import * as THREE from 'three'
import { Billboard, Sphere, Text } from '@react-three/drei'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { useControls } from 'leva'
import { useRef, useState, useCallback } from 'react'
import { OrbitControls } from 'three-stdlib'
import { GPSZone } from '../util/gps'
import { useScale, useTextScale } from '../hooks/scale'
import { renderSystemChildren } from '../util/renderChildren'

export function Zone(props: { zone: GPSZone }) {
  const { zone } = props
  const { children, color, radius } = zone
  const [x, y, z] = zone.relativeCoords()

  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, hover] = useState(false)
  const controls = useThree((state) => state.controls) as OrbitControls

  const scale = useScale()
  const textScale = useTextScale()

  // Rendering will always reduce precision to make for simpler rendering
  const position = new THREE.Vector3(x, y, z)
  const scaledRadius = radius * scale

  const isSlowZone = radius < 2750000

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

  const onDoubleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!controls) return
      if (!isSlowZone) return
      const scaledPosition = new THREE.Vector3(x * scale, y * scale, z * scale)
      controls.target = scaledPosition
      controls.object.position.set(
        scaledPosition.x,
        scaledPosition.y,
        scaledRadius * 0.8,
      )
      set({ Information: `${zone.name} (Zone ${zone.category})` })
      set({ GPS: zone.toString() })
      event.stopPropagation()
    },
    [controls, isSlowZone, scale, scaledRadius, set, x, y, z, zone],
  )

  return (
    <group ref={groupRef} position={position}>
      <Billboard
        {...(isSlowZone
          ? {}
          : {
              onPointerOver: (event) => {
                if (!isSlowZone) return
                event.stopPropagation()
                hover(true)
              },
              onPointerOut: () => {
                hover(false)
              },
            })}
      >
        <mesh
          onDoubleClick={onDoubleClick}
          userData={{
            name: zone.name,
            radius: scaledRadius,
            isSlowZone,
            origin: position,
          }}
        >
          <Sphere args={[radius]}>
            <meshPhongMaterial
              color={color}
              transparent={false}
              opacity={hovered ? 0.7 : 0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
          {isSlowZone && (
            <Text
              font={'./RobotoMono-Regular.ttf'}
              position={[0, 0, 1000 / scale]}
              textAlign="left"
              fontSize={100 * textScale}
              outlineWidth={hovered ? 1 : 0}
              outlineBlur={1}
              outlineColor={color}
            >
              {zone.name}
            </Text>
          )}
        </mesh>
      </Billboard>
      {renderSystemChildren(children)}
    </group>
  )
}
