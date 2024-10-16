import * as THREE from 'three'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useThree } from '@react-three/fiber'
import { Billboard, Text, Points, Sphere } from '@react-three/drei'
import { button, folder, useControls } from 'leva'
import { DraconisExpanseSystem } from '../data/sdx'
import { GPSZone, GPSPointOfInterest, GPSBody } from '../util/gps'
import { Body } from './Planet'

const ScaleContext = createContext(1)
const useScale = () => useContext(ScaleContext)

function renderSystemChildren(data: GPSPointOfInterest[] = [], parent = null) {
  return data.map((each, index) => {
    if (GPSZone.isZone(each)) {
      return <Zone {...each} id={index} key={each.name} />
    }
    return <POI {...each} id={index} key={each.name} />
  })
}

function Zone(props: {
  name: string
  id: number
  x: number
  y: number
  z: number
  radius: number
  children: GPSPointOfInterest[]
  color: string
  focused: boolean
}) {
  const { id, focused, x, y, z, children = [], color, radius } = props

  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, hover] = useState(false)
  const controls = useThree((state) => state.controls)

  const scale = useScale()

  // Rendering will always reduce precision to make for simpler rendering
  const position = new THREE.Vector3(x, y, z)
  const scaledRadius = radius * scale

  const isSlowZone = radius < 2750000
  return (
    <group ref={groupRef} position={position}>
      <Billboard
        renderOrder={id}
        onPointerOver={(event) => {
          if (!isSlowZone) return
          event.stopPropagation()
          hover(true)
        }}
        onPointerOut={(event) => {
          hover(false)
        }}
      >
        <mesh
          onDoubleClick={(event) => {
            if (!controls) return
            const scaledPosition = new THREE.Vector3(
              x * scale,
              y * scale,
              z * scale,
            )
            controls.target = scaledPosition
            controls.object.position.set(
              scaledPosition.x,
              scaledPosition.y,
              scaledRadius,
            )
            isSlowZone && event.stopPropagation()
          }}
          userData={{
            name: props.name,
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
              position={[0, 0, 1000 / scale]}
              textAlign="left"
              fontSize={100 / scale}
              outlineWidth={focused ? 1 : 0}
              outlineBlur={1}
              outlineColor={color}
            >
              {props.name}
            </Text>
          )}
        </mesh>
      </Billboard>
      {renderSystemChildren(children)}
    </group>
  )
}

function POI(props: GPSPointOfInterest) {
  const { name, x, y, z, color, radius } = props

  const scale = useScale()

  const labelPosition = radius
    ? new THREE.Vector3(radius, radius, radius)
    : new THREE.Vector3(0, 8 / scale, 32 / scale)
  const labelFontSize = (radius ? 12 : 8) / scale

  return (
    <group position={new THREE.Vector3(x, y, z)}>
      {GPSBody.isBody(props) ? (
        <Body name={name.toLocaleLowerCase()} radius={props.radius} />
      ) : (
        <Sphere args={[5 / scale]}>
          <meshStandardMaterial color={color} />
        </Sphere>
      )}
      <Billboard position={labelPosition}>
        <Text fontSize={labelFontSize}>{name}</Text>
      </Billboard>
    </group>
  )
}

export function StarSystem(props: { system: string }) {
  const { system } = props
  const scale = 0.001

  const controls = useThree((state) => state.controls)

  const resetCamera = useCallback(() => {
    if (!controls) return
    controls.reset()
    // if (system === "Ring Space") controls.object.position.set(15, 11.5, 25);
  }, [controls, system])

  useEffect(() => {
    resetCamera()
  }, [system, controls])

  useControls(
    {
      'Reset View': button(resetCamera),
    },
    [controls],
  )

  const { list: userGpsList } = useControls(
    {
      'User GPS': folder({
        list: {
          value: '',
          // show as multiline text
          rows: 3,
        },
      }),
    },
    [],
  )

  const [systemData, poiNames] = useMemo(() => {
    const data = DraconisExpanseSystem[system].clone()
    data.addFromString(userGpsList)
    const poiNames = data
      .pois()
      .map((poi: GPSPointOfInterest) => poi.name)
      .sort()
    return [data, poiNames]
  }, [system, userGpsList])

  const { from: fromPointName, to: toPointName } = useControls(
    'Route Planner',
    {
      from: {
        value: poiNames[0],
        options: poiNames,
      },
      to: {
        value: poiNames[1],
        options: poiNames,
      },
    },
    [poiNames],
  )

  useControls(
    'Route Planner',
    {
      'Calculate Optimized Route': button(() => {
        console.log('Calculating optimized route...')
        // Raycast from "from" to "to" and calculate the shortest path between them, accounting for zone speed limits
        // Zone speed limits are as follows: zones larger than 2750000m have a speed limit of 15000m/s, smaller zones have a speed limit of 300m/s

        // Raycast using ThreeJS raycasting to reduce required math. Use the ray caster to find the first intersection with a zone, then calculate the time to reach the intersection point
        // Calculate the time to reach the next zone, and so on, until the destination is reached

        const from = systemData
          .pois()
          .find((poi: GPSPointOfInterest) => poi.name === fromPointName)
        const to = systemData
          .pois()
          .find((poi: GPSPointOfInterest) => poi.name === toPointName)

        if (!from || !to) {
          console.error('Invalid from/to points')
          return
        }

        // Use the calculated times to determine the optimal route

        // Display the optimal route on the map

        // Display the time required to travel the optimal route
      }),
    },
    [fromPointName, toPointName],
  )

  return (
    <ScaleContext.Provider value={scale}>
      <group scale={[scale, scale, scale]}>
        <Points>{renderSystemChildren(systemData)}</Points>
      </group>
    </ScaleContext.Provider>
  )
}
