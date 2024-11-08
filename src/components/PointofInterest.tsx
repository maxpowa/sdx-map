import * as THREE from 'three'
import { Billboard, Sphere, Line, Text } from '@react-three/drei'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { useControls } from 'leva'
import { useMemo, useCallback, useState } from 'react'
import { OrbitControls } from 'three-stdlib'
import { useScale, useTextScale } from '../hooks/scale'
import { GPSPointOfInterest, GPSBody } from '../util/gps'
import { Body } from './Planet'

export function POI(props: { poi: GPSPointOfInterest }) {
  const { poi } = props
  const { name, color, radius } = poi
  const [x, y, z] = poi.relativeCoords()

  const scale = useScale()
  const textScale = useTextScale()
  const [hovered, hover] = useState(false)

  const isBody = GPSBody.isBody(poi)

  const labelPosition = useMemo(() => {
    if (GPSBody.isBody(poi)) {
      return new THREE.Vector3(
        5 * textScale + poi.radius,
        poi.radius,
        poi.radius,
      )
    }
    return new THREE.Vector3(-15 * textScale, 15 * textScale, 0)
  }, [textScale, poi])

  const labelFontSize = useMemo(
    () => (radius ? 12 : 8) * textScale,
    [radius, textScale],
  )

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
      const targetPosition = new THREE.Vector3(
        poi.x * scale,
        poi.y * scale,
        poi.z * scale,
      )
      controls.target = targetPosition
      const cameraPosition = targetPosition
        .clone()
        .add(
          controls.object.position
            .normalize()
            .multiplyScalar((radius ?? 10000) * scale * 2),
        )
      controls.object.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
      )
      set({ Information: name, GPS: poi.toString() })
      event.stopPropagation()
    },
    [controls, poi, scale, radius, set, name],
  )

  return (
    <group
      position={new THREE.Vector3(x, y, z)}
      onDoubleClick={onDoubleClick}
      onPointerOver={(event) => {
        event.stopPropagation()
        hover(true)
      }}
      onPointerOut={() => {
        hover(false)
      }}
    >
      {isBody ? (
        <Body name={name.toLocaleLowerCase()} radius={poi.radius} />
      ) : (
        <Sphere args={[5 * textScale]}>
          <meshStandardMaterial color={color} />
        </Sphere>
      )}
      <Billboard>
        <Text
          font={'./RobotoMono-Regular.ttf'}
          position={labelPosition
            .clone()
            .add(
              new THREE.Vector3(
                (isBody ? 4 : -2) * textScale,
                1 * textScale,
                0,
              ),
            )}
          fontSize={labelFontSize}
          anchorX={isBody ? 'left' : 'right'}
          anchorY={'bottom'}
          outlineWidth={hovered ? 0.5 * textScale : 0}
          outlineBlur={hovered ? 0.5 * textScale : 0}
          outlineColor={poi.parent?.color ?? '#FFFFFF'}
        >
          {name}
        </Text>
        <Line
          lineWidth={0.9}
          points={[labelPosition, new THREE.Vector3(0, 0, 0)]}
        />
        <Line
          lineWidth={0.9}
          points={[
            labelPosition.clone().add(new THREE.Vector3(0, 5 * textScale, 0)),
            labelPosition,
          ]}
        />
        <Line
          lineWidth={0.9}
          points={[
            labelPosition
              .clone()
              .add(
                new THREE.Vector3(
                  (isBody ? 2 : -2) * name.length * textScale,
                  0,
                  0,
                ),
              ),
            labelPosition,
          ]}
        />
      </Billboard>
    </group>
  )
}
