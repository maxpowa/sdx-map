import * as THREE from 'three'
import { Billboard, Sphere, Text } from '@react-three/drei'
import { useCallback, useRef, useState } from 'react'
import { GPSList, GPSZone } from '../util/gps'
import { useScale, useTextScale } from '../hooks/scale'
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { useControls } from 'leva'

export function Zone(props: {
  zone: GPSZone
  renderChildren: (data: GPSList) => JSX.Element
}) {
  const { zone, renderChildren } = props
  const { children, color, radius } = zone
  const [x, y, z] = zone.relativeCoords()

  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, hover] = useState(false)

  const scale = useScale()
  const textScale = useTextScale()

  // Rendering will always reduce precision to make for simpler rendering
  const position = new THREE.Vector3(x, y, z)
  const scaledRadius = radius * scale

  const isHighSpeed = GPSZone.isHighSpeed(zone)

  const [showText, setShowText] = useState(true)
  useFrame((state) => {
    // const cameraDistance = state.controls?.object?.position.distanceTo(position)
    state.camera.updateProjectionMatrix()
    const controls = state.controls as OrbitControls
    const cameraDistance = controls.getDistance()
    // console.log(cameraDistance)
    if (
      cameraDistance &&
      (cameraDistance < scaledRadius * 2.2 ||
        cameraDistance > scaledRadius * 20)
    ) {
      setShowText(false)
    } else {
      setShowText(true)
    }
  })

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

  const controls = useThree((state) => state.controls) as OrbitControls
  const onDoubleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!controls) return
      if (isHighSpeed) return
      const targetPosition = new THREE.Vector3(
        zone.x * scale,
        zone.y * scale,
        zone.z * scale,
      )
      controls.target = targetPosition
      const cameraPosition = targetPosition
        .clone()
        .add(
          controls.object.position
            .normalize()
            .multiplyScalar(scaledRadius * 0.8),
        )
      controls.object.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
      )
      set({
        Information: `${zone.name} (Zone ${zone.category})`,
        GPS: zone.toString(),
      })
      event.stopPropagation()
    },
    [controls, isHighSpeed, scale, scaledRadius, set, zone],
  )

  return (
    <group ref={groupRef} position={position}>
      <Billboard
        {...(isHighSpeed
          ? {}
          : {
              onPointerOver: (event) => {
                event.stopPropagation()
                hover(true)
              },
              onPointerOut: () => {
                hover(false)
              },
              onDoubleClick,
            })}
      >
        <mesh
          userData={{
            name: zone.name,
            radius: scaledRadius,
            isHighSpeed,
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
          <Text
            visible={showText || hovered}
            font={'./RobotoMono-Regular.ttf'}
            position={[0, 0, 1000 / scale]}
            textAlign="left"
            fontSize={100 * textScale}
            outlineWidth={hovered ? 3 * textScale : 0}
            outlineBlur={hovered ? 1 * textScale : 0}
            outlineColor={color}
          >
            {zone.name}
          </Text>
        </mesh>
      </Billboard>
      {renderChildren(children)}
    </group>
  )
}
