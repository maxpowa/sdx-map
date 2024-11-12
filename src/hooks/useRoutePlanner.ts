import { useControls, folder, button } from 'leva'
import { useState, useMemo, useEffect } from 'react'
import { DraconisExpanseSystem } from '../data/sdx'
import { GPSRoute, computeShortestRoute } from '../util/gps'
import { getGPSList } from './useSystemData'
import datalist from '../components/plugin-datalist'

const routeParam = getGPSList('gps')

export function useRoutePlanner(system: keyof typeof DraconisExpanseSystem) {
  const [route, setRoute] = useState<GPSRoute>([])
  const pois = useMemo(() => {
    const world = DraconisExpanseSystem[system].clone()
    world.add(routeParam)

    return world
      .pois(true, true)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((each) => ({ label: each.name, value: each }))
  }, [system])

  const [{ Start: from, End: to, allowLithoturns }, set] = useControls(
    () => ({
      'Route Planner': folder({
        Start: datalist({
          options: pois,
        }),
        End: datalist({
          options: pois,
        }),
        allowLithoturns: {
          value: true,
          label: 'Allow Lithoturns (slam into slowzones instead of braking)',
        },
      }),
    }),
    [pois, setRoute],
  )

  useEffect(() => {
    set({
      Start: (routeParam.pois()[0] ??
        pois['MCRN Free Rebel Fleet'] ??
        pois[Object.keys(pois)[0]]) as any,
      End: (routeParam.pois()[1] ??
        pois['Pallas Station'] ??
        pois[Object.keys(pois)[1]]) as any,
    })
    setRoute([])
  }, [pois, set, system])

  useControls(
    'Route Planner',
    {
      Route: button(() => {
        const world = DraconisExpanseSystem[system].clone()
        world.add(getGPSList('route'))

        const route = computeShortestRoute(
          from as any,
          to as any,
          world,
          allowLithoturns,
        )

        console.log(route)
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
    [system, from, to, allowLithoturns, route],
  )

  return route
}
