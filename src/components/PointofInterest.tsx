import * as THREE from 'three'
import { Billboard, Sphere, Line, Text } from '@react-three/drei'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { useControls } from 'leva'
import { useMemo, useCallback } from 'react'
import { OrbitControls } from 'three-stdlib'
import { useScale, useTextScale } from '../hooks/scale'
import { GPSPointOfInterest, GPSBody } from '../util/gps'
import { Body } from './Planet'
import React from 'react'

export function POI(props: { poi: GPSPointOfInterest }) {
  const { poi } = props
  const { name, color, radius } = poi
  const [x, y, z] = poi.relativeCoords()

  const scale = useScale()
  const textScale = useTextScale()
  const controls = useThree((state) => state.controls) as OrbitControls

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

  const onDoubleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!controls) return
      const targetPosition = new THREE.Vector3(
        poi.x * scale,
        poi.y * scale,
        poi.z * scale,
      )
      controls.target = targetPosition
      controls.object.position.set(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z + (radius ?? 10000) * scale * 2,
      )
      set({ Information: name })
      set({ GPS: poi.toString() })
      event.stopPropagation()
    },
    [controls, poi, scale, radius, set, name],
  )

  return (
    <group position={new THREE.Vector3(x, y, z)}>
      {isBody ? (
        <Body
          name={name.toLocaleLowerCase()}
          radius={poi.radius}
          onDoubleClick={onDoubleClick}
        />
      ) : (
        <Sphere args={[5 * textScale]} onDoubleClick={onDoubleClick}>
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
