import { Line, Points, Stars } from '@react-three/drei'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { button, folder, useControls } from 'leva'
import { ScaleProvider, useTextScale } from '../hooks/scale'
import { renderSystemChildren } from '../util/renderChildren'
import { Grid } from './Grid'
import { Color } from 'three'
import { DraconisExpanseSystem } from '../data/sdx'
import { useThree } from '@react-three/fiber'
import { useMemo, useCallback, useEffect } from 'react'

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

function useSystemData(system: keyof typeof DraconisExpanseSystem) {
  const controls = useThree((state) => state.controls) as OrbitControlsImpl

  const systemData = useMemo(() => {
    const data = DraconisExpanseSystem[system].clone()
    return data
  }, [system])

  const [, set] = useControls('Focused Point of Interest', () => ({
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

  useEffect(resetCamera, [system, resetCamera, controls])

  useControls(
    {
      'Reset View': button(resetCamera),
    },
    [controls, system],
  )

  return systemData
}

export function StarSystem(props: {
  system: keyof typeof DraconisExpanseSystem
  coordScale: number
  textScale: number
}) {
  const { system, coordScale, textScale } = props

  const systemData = useSystemData(system)

  const { showGrid, showHighSpeed, axes, turns, stars } = useControls({
    'View Settings': folder(
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
        stars: {
          value: false,
          label: 'Distant Stars',
        },
      },
      { collapsed: true },
    ),
  })

  return (
    <>
      {stars && <Stars radius={100000000 * coordScale} fade />}
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
