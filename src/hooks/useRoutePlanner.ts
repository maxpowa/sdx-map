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
import { useHashParams } from './useHashData'

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
  const hashParams = useHashParams()
  const gpsParams = hashParams?.getAll('gps').join('\n')

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

  const [{ mode }, setMode] = useControls(() => ({
    'Route Planner': folder({
      mode: {
        options: ['Simple', 'Advanced'],
        label: 'Mode',
      },
    }),
  }))

  useEffect(() => {
    setMode({ mode: gpsParams ? 'Advanced' : 'Simple' })
  }, [gpsParams, setMode])

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
            value: '',
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
                waypoints?.forEach((each) => each.remove())
                world.push(...newPoints)
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
  }, [pois, set, world])

  useEffect(() => {
    set({
      // @ts-expect-error Leva types are jank as fuck here
      GPS: gpsParams ?? '',
    })
  }, [gpsParams, set])

  useEffect(() => {
    if (waypoints) {
      set({
        // @ts-expect-error Leva types are jank as fuck here
        GPS: waypoints?.join('\n'),
      })
    }
  }, [waypoints, set])

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

  useEffect(() => {
    if (waypoints && waypoints.length > 0) {
      computeRoute()
    }
  }, [computeRoute, waypoints])

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
      waypoints?.join('\n'),
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
        label: 'Copy',
        render: () => route.length > 0,
        opts: {
          'NavOS Journey': () =>
            getRouteAndCopy((r) => buildJourney(r, smallGridSpeeds)),
          'GPS List': () => getRouteAndCopy((r) => r.join('\n')),
          URL: () => {
            const params = new URLSearchParams()
            const points =
              mode === 'Simple' ? [pois[from], pois[to]] : waypoints!
            points.forEach((point) => {
              params.append('gps', point.toString())
            })
            const tempUrl = new URL(window.location.toString())
            tempUrl.hash = params.toString()
            navigator.clipboard.writeText(tempUrl.toString())
          },
        },
      }),
    },
    [route, getRouteAndCopy, smallGridSpeeds],
  )

  return route
}
