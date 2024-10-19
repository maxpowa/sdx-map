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
import { ThreeEvent, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three-stdlib'
import { Billboard, Text, Points, Sphere, Line } from '@react-three/drei'
import { button, useControls } from 'leva'
import { DraconisExpanseSystem } from '../data/sdx'
import {
  GPSZone,
  GPSPointOfInterest,
  GPSBody,
  GPSList,
  GPSPoint,
} from '../util/gps'
import { Body } from './Planet'
import usePersistentState from '../util/state'

const ScaleContext = createContext({
  coordScale: 0.001,
  textScale: 1,
})
const useScale = () => useContext(ScaleContext).coordScale
const useTextScale = () => useContext(ScaleContext).textScale

function renderSystemChildren(data: GPSList) {
  return data.map((each: GPSPoint) => {
    if (GPSZone.isZone(each)) {
      return <Zone zone={each} key={each.name} />
    }
    return <POI poi={each} key={each.name} />
  })
}

function Zone(props: { zone: GPSZone }) {
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

function POI(props: { poi: GPSPointOfInterest }) {
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

export function StarSystem(props: {
  system: keyof typeof DraconisExpanseSystem
}) {
  const { system } = props
  let coordScale = 0.012
  let textScale = 1000
  if (system === 'Sol' || system === 'Ring Space') {
    coordScale = 0.001
    if (system === 'Ring Space') {
      textScale = 500
    }
  }

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
      controls.object.position.set(0, 9000, 8000)
      controls.target.set(7000, 8000, 1000)
    }
    set({ Information: 'N/A', GPS: '' })
  }, [controls, set, system])

  useEffect(resetCamera, [system, resetCamera])

  useControls(
    {
      'Reset View': button(resetCamera),
    },
    [controls],
  )

  const [userGpsList, setPersistedGpsList] = usePersistentState(
    `userGPSList-${system}`,
    '',
  )
  useControls(
    'User GPS',
    () => ({
      [`gpsList-${system}`]: {
        label: '',
        value: userGpsList,
        // show as multiline text
        rows: 3,
        onChange: ((currentSystem: string) => (value: string) => {
          if (system === currentSystem) setPersistedGpsList(value)
        })(system),
      },
    }),
    [system, userGpsList, setPersistedGpsList],
  )

  const [systemData, poiRecord, sortedKeys] = useMemo(() => {
    const data = DraconisExpanseSystem[system].clone()
    data.addFromString(userGpsList)
    const poiRecord = data
      .pois()
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce(
        (acc: Record<string, GPSPointOfInterest>, poi: GPSPointOfInterest) => {
          acc[poi.name] = poi
          return acc
        },
        {},
      )
    const sortedKeys = Object.keys(poiRecord).sort()
    return [data, poiRecord, sortedKeys]
  }, [system, userGpsList])

  const { from: fromPoi, to: toPoi } = useControls(
    'Route Planner (WIP)',
    {
      from: {
        value: poiRecord[sortedKeys[0]],
        options: poiRecord,
      },
      to: {
        value: poiRecord[sortedKeys[1]],
        options: poiRecord,
      },
    },
    [sortedKeys, poiRecord],
  )

  useControls(
    'Route Planner (WIP)',
    {
      'Calculate Optimized Route': button(() => {
        console.log('Calculating optimized route... TODO :)')

        // Calculate optimized route, between fromPoi and toPoi (if possible)
      }),
    },
    [fromPoi, toPoi],
  )

  return (
    <ScaleContext.Provider value={{ coordScale, textScale }}>
      <group scale={[coordScale, coordScale, coordScale]}>
        <Points>{renderSystemChildren(systemData)}</Points>
      </group>
    </ScaleContext.Provider>
  )
}
