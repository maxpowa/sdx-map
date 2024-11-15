import { Points, Stars } from '@react-three/drei'
import { folder, useControls } from 'leva'
import { ScaleProvider, useScaledCameraSystem } from '../hooks/scale'
import { renderSystemChildren } from '../util/renderChildren'
import { Grid } from './Grid'
import { Color } from 'three'
import { AxisLine } from './AxisLine'
import { GPSSystem } from '../util/gps'

export function StarSystem(props: {
  systemData: GPSSystem
  coordScale: number
  textScale: number
}) {
  const { systemData, coordScale, textScale } = props

  useScaledCameraSystem(systemData)

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
    <instancedMesh>
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
          <instancedMesh>
            <AxisLine axis="x" />
            <AxisLine axis="y" />
            <AxisLine axis="z" />
          </instancedMesh>
        )}
        <group scale={[coordScale, coordScale, coordScale]}>
          <Points>
            {renderSystemChildren(systemData, turns, showHighSpeed)}
          </Points>
        </group>
      </ScaleProvider>
    </instancedMesh>
  )
}
