import { Line } from '@react-three/drei'
import { useTextScale } from '../hooks/scale'
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
