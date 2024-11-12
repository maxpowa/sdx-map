import { useControls, folder, button } from 'leva'
import { useState, useEffect, useMemo } from 'react'
import { DraconisExpanseSystem } from '../data/sdx'
import {
  GPSRoute,
  GPSPoint,
  computeShortestRoute,
  GPSPointOfInterest,
} from '../util/gps'
import { getParams } from './useSynchronizedSetting'

const gpsParams = getParams().getAll('gps').join('\n')

export function useRoutePlanner(system: keyof typeof DraconisExpanseSystem) {
  const [route, setRoute] = useState<GPSRoute>([])

  const [waypoints, setWaypoints] = useState<GPSPointOfInterest[]>()
  const [world, pois] = useMemo(() => {
    const world = DraconisExpanseSystem[system].clone()
    if (waypoints) {
      world.push(...waypoints)
    }

    return [
      world,
      world
        .pois(true, true)
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce(
          (acc, poi) => {
            acc[poi.name] = poi
            return acc
          },
          {} as Record<string, GPSPoint>,
        ),
    ]
  }, [system, waypoints])

  const { mode } = useControls({
    'Route Planner': folder({
      mode: {
        value: gpsParams ? 'Advanced' : 'Simple',
        options: ['Simple', 'Advanced'],
        label: 'Mode',
      },
    }),
  })

  const [{ Start: from, End: to, allowLithoturns }, set] = useControls(
    () => ({
      'Route Planner': folder({
        Start: {
          render: () => mode === 'Simple',
          options: pois,
        },
        End: {
          render: () => mode === 'Simple',
          options: pois,
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
      }),
    }),
    [pois, setRoute, mode],
  )

  useEffect(() => {
    set({
      Start: pois['MCRN Free Rebel Fleet'] ?? pois[Object.keys(pois)[0]],
      End: pois['Pallas Station'] ?? pois[Object.keys(pois)[1]],
    })
    setRoute([])
  }, [pois, set, system, waypoints])

  useControls(
    'Route Planner',
    {
      Route: button(() => {
        if (mode === 'Advanced' && !waypoints) {
          alert('Please enter at least two waypoints to calculate a route.')
          return
        }

        let route
        try {
          route = computeShortestRoute(
            mode === 'Simple' ? [from, to] : waypoints!,
            world,
            allowLithoturns,
          )
        } catch (e) {
          alert(e)
          return
        }

        setRoute(route)
        // TODO: Move to proper inline modal or something instead of alert
        alert(
          'The route has been calculated and is displayed on the map. A NavOS journey has been printed below for your convenience.\n\n' +
            '[Journey Start]\n' +
            route
              .map(
                (each, index) =>
                  `${each.category === 'highspeed' ? '10000' : '750  '} ${index === route.length - 1 ? 'true ' : 'false'} ${each}`,
              )
              .join('\n') +
            '\n[Journey End]',
        )
      }),
    },
    [system, from, to, allowLithoturns, route, mode, waypoints],
  )

  return route
}
