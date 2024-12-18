import { useControls, folder, button, buttonGroup } from 'leva'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  GPSRoute,
  GPSPoint,
  computeShortestRoute,
  GPSPointOfInterest,
  optimizeRoute,
  GPSSystem,
} from '../util/gps'
import { getParams } from './useSynchronizedSetting'

const gpsParams = getParams().getAll('gps').join('\n')

export function buildJourney(route: GPSRoute, smallGridSpeeds: boolean) {
  if (route) {
    return [
      '[Journey Start]',
      ...route.map(
        (each, index) =>
          `${each.category === 'highspeed' ? '14998' : smallGridSpeeds ? '748  ' : '498  '} ${index === route.length - 1 ? 'true ' : 'false'} ${each}`,
      ),
      '[Journey End]',
    ].join('\n')
  }
  return ''
}

export function useRoutePlanner(world: GPSSystem) {
  const [route, setRoute] = useState<GPSRoute>([])

  const [waypoints, setWaypoints] = useState<GPSPointOfInterest[]>()
  const [pois] = useMemo(() => {
    const tempPois = [
      ...world.pois(true),
      ...world.turns(true),
      ...(waypoints ?? []),
    ]

    return [
      tempPois
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce(
          (acc, poi) => {
            acc[poi.name] = poi
            return acc
          },
          {} as Record<string, GPSPoint>,
        ),
    ]
  }, [world, waypoints])

  const { mode } = useControls({
    'Route Planner': folder({
      mode: {
        value: gpsParams ? 'Advanced' : 'Simple',
        options: ['Simple', 'Advanced'],
        label: 'Mode',
      },
    }),
  })

  const keys = Object.keys(pois)

  const [{ Start: from, End: to, allowLithoturns, smallGridSpeeds }, set] =
    useControls(
      () => ({
        'Route Planner': folder({
          Start: {
            render: () => mode === 'Simple',
            options: keys,
          },
          End: {
            render: () => mode === 'Simple',
            options: keys,
          },
          GPS: {
            render: () => mode === 'Advanced',
            value: waypoints ? waypoints.join('\n') : gpsParams,
            editable: true,
            rows: true,
            label: 'GPS List (one per line, SHIFT-ENTER to create a new line)',
            onChange: (value: string, _, ctx) => {
              if (value.length < 1) return
              const newPoints = value
                .split('\n')
                .map((each) => {
                  try {
                    return GPSPoint.fromString(each)
                  } catch (e) {
                    console.error(e)
                    return null
                  }
                })
                .filter((each) => !!each)
              if (
                newPoints.length != waypoints?.length ||
                newPoints.some((each, index) => !each.equals(waypoints[index]))
              ) {
                ctx.value =
                  newPoints.map((each) => each.toString()).join('\n') + '\n'
                setWaypoints(newPoints)
              }
            },
          },
          allowLithoturns: {
            value: true,
            label: 'Allow Lithoturns (slam into slowzones instead of braking)',
          },
          smallGridSpeeds: {
            value: false,
            label:
              'Small Grid (in slow zones: SG has 750m/s max, LG has 500m/s max. in high speed zones: both have 15000m/s max)',
          },
        }),
      }),
      [keys, setRoute, mode],
    )

  useEffect(() => {
    set({
      Start:
        Object.keys(pois).find((key) => key === 'MCRN Free Rebel Fleet') ||
        Object.keys(pois)[0],
      End:
        Object.keys(pois).find((key) => key === 'Pallas Station') ||
        Object.keys(pois)[1],
    })
    setRoute([])
  }, [pois, set, world, waypoints])

  const computeRoute = useCallback(() => {
    let route
    try {
      const beforeRoute = performance.now()
      const routeWaypoints =
        mode === 'Simple' ? [pois[from], pois[to]] : waypoints!
      route = computeShortestRoute(routeWaypoints, world, allowLithoturns)
      const afterRoute = performance.now()
      try {
        route = optimizeRoute(route, routeWaypoints, world)
      } catch (e) {
        console.error('Failed to optimize route:', e)
      }
      const afterOptimize = performance.now()

      console.log(`Route calculation took ${afterRoute - beforeRoute} ms`)
      console.log(`Route optimization took ${afterOptimize - afterRoute} ms`)
      setRoute(route)
    } catch (e) {
      alert(e)
    }

    return route
  }, [mode, pois, from, to, waypoints, world, allowLithoturns])

  useControls(
    'Route Planner',
    {
      Route: button(() => {
        if (mode === 'Advanced' && !waypoints) {
          alert('Please enter at least two waypoints to calculate a route.')
          return
        }

        computeRoute()
      }),
    },
    [
      world.name,
      from,
      to,
      allowLithoturns,
      route,
      mode,
      waypoints,
      smallGridSpeeds,
    ],
  )

  const getRouteAndCopy = useCallback(
    (stringify: (route: GPSRoute) => string) => {
      let activeRoute = route as GPSRoute | undefined
      if (route.length < 1) {
        activeRoute = computeRoute()
      }

      if (activeRoute && activeRoute.length > 0) {
        navigator.clipboard.writeText(stringify(activeRoute))
      } else {
        alert('No route to copy')
      }
    },
    [route, computeRoute],
  )

  useControls(
    'Route Planner',
    {
      Copy: buttonGroup({
        label: '',
        render: () => route.length > 0,
        opts: {
          'Copy NavOS Journey': () =>
            getRouteAndCopy((r) => buildJourney(r, smallGridSpeeds)),
          'Copy GPS List': () => getRouteAndCopy((r) => r.join('\n')),
        },
      }),
    },
    [route, getRouteAndCopy, smallGridSpeeds],
  )

  return route
}
