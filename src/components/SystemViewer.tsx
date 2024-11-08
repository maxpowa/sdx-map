import { useCallback, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from 'three-stdlib'
import { Line, Points } from '@react-three/drei'
import { button, useControls } from 'leva'
import { DraconisExpanseSystem } from '../data/sdx'
import { ScaleProvider, useTextScale } from '../hooks/scale'
import { renderSystemChildren } from '../util/renderChildren'
import { Grid } from './Grid'
import { Color } from 'three'

export function AxisLine(props: { axis: 'x' | 'y' | 'z' }) {
  const { axis } = props
  const scale = useTextScale()

  let rgb = [1, 0, 0]
  let points = [
    [-10 * scale, 0, 0],
    [0, 0, 0],
    [10 * scale, 0, 0],
  ] as [number, number, number][]

  switch (axis) {
    case 'y':
      rgb = [0, 1, 0]
      points = [
        [0, -10 * scale, 0],
        [0, 0, 0],
        [0, 10 * scale, 0],
      ]
      break
    case 'z':
      rgb = [0, 0, 1]
      points = [
        [0, 0, -10 * scale],
        [0, 0, 0],
        [0, 0, 10 * scale],
      ]
      break
  }

  return (
    <Line
      points={points}
      lineWidth={1}
      vertexColors={[new Color(0, 0, 0), new Color(...rgb), new Color(0, 0, 0)]}
    />
  )
}

export function StarSystem(props: {
  system: keyof typeof DraconisExpanseSystem
  coordScale: number
  textScale: number
}) {
  const { system, coordScale, textScale } = props

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
      controls.object.position.set(2000, 0, 3500)
      controls.target.set(7000, 8000, 1000)
    }
    controls.update()
    set({ Information: 'N/A', GPS: '' })
  }, [controls, set, system])

  useEffect(resetCamera, [system, resetCamera])

  useControls(
    {
      'Reset View': button(resetCamera),
    },
    [controls, system],
  )

  // const { userGpsList } = useControls(
  //   `User GPS (${system})`,
  //   {
  //     userGpsList: {
  //       value: '',
  //       label: 'GPS List',
  //       rows: true,
  //     },
  //   },
  //   [system],
  // )

  const systemData = useMemo(() => {
    // const [systemData] = useMemo(() => {
    const data = DraconisExpanseSystem[system].clone()
    // data.addFromString(userGpsList ?? '')
    // const poiRecord = data
    //   .pois(true, true)
    //   .sort((a, b) => a.name.localeCompare(b.name))
    //   .filter((poi) => poi.class !== 'turn')
    //   .reduce(
    //     (acc: Record<string, GPSPointOfInterest>, poi: GPSPointOfInterest) => {
    //       acc[poi.name] = poi
    //       return acc
    //     },
    //     {},
    //   )
    // const sortedKeys = Object.keys(poiRecord).sort()
    return data
  }, [system])
  // }, [system, userGpsList])

  const { showGrid, showHighSpeed, axes, turns } = useControls(
    'View Settings',
    {
      turns: {
        value: true,
        label: 'Turns',
      },
      showHighSpeed: {
        value: true,
        label: 'High Speed Zones',
      },
      showGrid: {
        value: false,
        label: 'Gridlines',
      },
      axes: {
        value: false,
        label: 'Axes',
      },
    },
  )

  return (
    <>
      <ScaleProvider value={{ coordScale, textScale }}>
        {showGrid && (
          <Grid
            args={[2, 2]}
            sectionSize={0.5 * textScale}
            cellSize={0.1 * textScale}
            fadeDistance={10 * textScale}
            cellColor={new Color(0.2, 0.2, 0.2)}
            rotation={[Math.PI / 2, 0, 0]}
          />
        )}
        {axes && (
          <>
            <AxisLine axis="x" />
            <AxisLine axis="y" />
            <AxisLine axis="z" />
          </>
        )}
        <group scale={[coordScale, coordScale, coordScale]}>
          <Points>
            {renderSystemChildren(systemData, turns, showHighSpeed)}
          </Points>
        </group>
      </ScaleProvider>
    </>
  )
}
