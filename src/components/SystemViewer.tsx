import { useCallback, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from 'three-stdlib'
import { Points } from '@react-three/drei'
import { button, useControls } from 'leva'
import { DraconisExpanseSystem } from '../data/sdx'
import { GPSPointOfInterest } from '../util/gps'
import { ScaleProvider } from '../hooks/scale'
import { renderSystemChildren } from '../util/renderChildren'

export function StarSystem(props: {
  system: keyof typeof DraconisExpanseSystem
}) {
  const { system } = props
  let coordScale = 0.012
  let textScale = 1000
  if (system === 'Sol' || system === 'Ring Space') {
    coordScale = 0.001
    if (system === 'Ring Space') {
      textScale = 500
    }
  }

  const { controls } = useThree() as {
    controls: OrbitControls
  }

  const [, set] = useControls('Selected Point of Interest', () => ({
    Information: {
      value: '',
      editable: false,
    },
    GPS: {
      value: '',
      editable: false,
    },
  }))

  const resetCamera = useCallback(() => {
    if (!controls) return
    if (system === 'Sol') {
      controls.object.position.set(0, 0, 5000)
      controls.target.set(0, 0, 0)
    } else if (system === 'Ring Space') {
      controls.object.position.set(0, 0, 50)
      controls.target.set(15, 10, 0)
    } else if (system === 'Kronos') {
      controls.object.position.set(-5500, 2300, 1233)
      controls.target.set(-900, 1030, 216)
    } else if (system === 'Ilus') {
      controls.object.position.set(3275, 6164, 3333)
      controls.target.set(1903, 2661, 35)
    } else if (system === 'Jannah') {
      controls.object.position.set(0, 9000, 8000)
      controls.target.set(7000, 8000, 1000)
    }
    set({ Information: 'N/A', GPS: '' })
  }, [controls, set, system])

  useEffect(resetCamera, [system, resetCamera])

  useControls(
    {
      'Reset View': button(resetCamera),
    },
    [controls, system],
  )

  // const [systemData, poiRecord, sortedKeys] = useMemo(() => {
  const [systemData] = useMemo(() => {
    const data = DraconisExpanseSystem[system].clone()
    // data.addFromString(userGpsList ?? '')
    const poiRecord = data
      .pois()
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce(
        (acc: Record<string, GPSPointOfInterest>, poi: GPSPointOfInterest) => {
          acc[poi.name] = poi
          return acc
        },
        {},
      )
    const sortedKeys = Object.keys(poiRecord).sort()
    return [data, poiRecord, sortedKeys]
  }, [system])
  // }, [system, userGpsList])

  // const { from: fromPoi, to: toPoi } = useControls(
  //   'Route Planner (WIP)',
  //   {
  //     from: {
  //       value: poiRecord[sortedKeys[0]],
  //       options: poiRecord,
  //     },
  //     to: {
  //       value: poiRecord[sortedKeys[1]],
  //       options: poiRecord,
  //     },
  //   },
  //   {
  //     collapsed: true,
  //   },
  //   [sortedKeys, poiRecord],
  // )

  // useControls(
  //   'Route Planner (WIP)',
  //   {
  //     'Calculate Optimized Route': button(() => {
  //       console.log('Calculating optimized route... TODO :)')

  //       alert("This requires math, and I'm not a math person.")
  //       // Calculate optimized route, between fromPoi and toPoi (if possible)
  //     }),
  //   },
  //   {
  //     collapsed: true,
  //   },
  //   [fromPoi, toPoi],
  // )

  return (
    <ScaleProvider value={{ coordScale, textScale }}>
      <group scale={[coordScale, coordScale, coordScale]}>
        <Points>{renderSystemChildren(systemData)}</Points>
      </group>
    </ScaleProvider>
  )
}
