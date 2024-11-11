import * as THREE from 'three'
import { Billboard, Sphere, Line, Text, Detailed } from '@react-three/drei'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { useControls } from 'leva'
import { useMemo, useCallback, useState } from 'react'
import { OrbitControls } from 'three-stdlib'
import { useScale, useTextScale } from '../hooks/scale'
import { GPSPointOfInterest, GPSBody } from '../util/gps'
import { Body } from './Planet'
import MeshFresnelMaterial from './MeshFresnelMaterial'

export function POI(props: { poi: GPSPointOfInterest }) {
  const { poi } = props
  const { name, color } = poi
  const [x, y, z] = poi.relativeCoords()

  const scale = useScale()
  const textScale = useTextScale()

  const isBody = GPSBody.isBody(poi)
  const radius = isBody ? poi.radius : 5 * textScale

  const labelRadius = isBody
    ? Math.max(poi.radius * (scale * 5), textScale * (scale * 1000))
    : textScale * (scale * 1000)

  const [hovered, hover] = useState(false)

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
    () => (isBody ? 12 : 8) * textScale,
    [isBody, textScale],
  )

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
            .multiplyScalar((isBody ? radius : 10000) * scale * 2),
        )
      controls.object.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
      )
      set({
        Information: `${name}${poi.category ? ` (${poi.category})` : ''}`,
        GPS: poi.toString(),
      })
      event.stopPropagation()
    },
    [controls, poi, scale, isBody, radius, set, name],
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
      <instancedMesh>
        {isBody ? (
          <>
            <Sphere args={[radius, 64, 128]}>
              <MeshFresnelMaterial
                fresnelColor={color}
                intensity={1}
                baseAlpha={hovered ? 0.5 : 0.15}
                amount={hovered ? 2 : 5}
              />
            </Sphere>
            <Body name={name.toLocaleLowerCase()} radius={poi.radius} />
          </>
        ) : (
          <Sphere args={[radius]}>
            <MeshFresnelMaterial
              fresnelColor={color}
              baseColor={poi.parent?.color ?? color}
              amount={hovered ? 0.5 : 1}
            />
          </Sphere>
        )}
      </instancedMesh>
      <Detailed distances={[0, hovered ? 20 * labelRadius : labelRadius]}>
        <instancedMesh>
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
              outlineWidth={hovered ? 0.25 * textScale : 0}
              outlineBlur={hovered ? 0.5 * textScale : 0}
              outlineColor={poi.parent?.color ?? '#FFFFFF'}
            >
              {name}
            </Text>
            <Line
              lineWidth={0.9}
              points={[
                new THREE.Vector3(0, 0, 0)
                  .add(labelPosition)
                  .normalize()
                  .multiplyScalar(radius),
                labelPosition,
              ]}
            />
            <Line
              lineWidth={0.9}
              points={[
                labelPosition
                  .clone()
                  .add(new THREE.Vector3(0, 5 * textScale, 0)),
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
        </instancedMesh>
        <instancedMesh />
      </Detailed>
    </group>
  )
}
