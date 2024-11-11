import { Canvas } from '@react-three/fiber'
import { DraconisExpanseSystem } from '../data/sdx'
import { OrbitControls, Line } from '@react-three/drei'
import { StarSystem } from './SystemViewer'
import { useEffect, useMemo, useState } from 'react'
import { button, folder, useControls } from 'leva'
import { computeShortestRoute, GPSPoint, GPSRoute } from '../util/gps'
import { Color } from 'three'

const blurbStyle = {
  padding: 'var(--leva-space-xs) var(--leva-space-sm)',
  borderRadius: 'var(--leva-radii-sm)',
  color: 'var(--leva-colors-highlight2)',
  backgroundColor: 'var(--leva-colors-elevation2)',
  fontFamily: 'var(--leva-fonts-mono)',
  fontSize: 'var(--leva-fontSizes-root)',
}

const useRoutePlanner = (system: keyof typeof DraconisExpanseSystem) => {
  const [route, setRoute] = useState<GPSRoute>([])
  const pois = useMemo(
    () =>
      DraconisExpanseSystem[system]
        .pois(true, true)
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce(
          (acc, poi) => {
            acc[poi.name] = poi
            return acc
          },
          {} as Record<string, GPSPoint>,
        ),
    [system],
  )

  const [{ Start: from, End: to, allowLithoturns }, set] = useControls(
    () => ({
      'Route Planner': folder({
        Start: {
          options: pois,
        },
        End: {
          options: pois,
        },
        allowLithoturns: {
          value: true,
          label: 'Allow Lithoturns (slam into slowzones instead of braking)',
        },
      }),
    }),
    [pois, setRoute],
  )

  useEffect(() => {
    set({
      Start: pois['MCRN Free Rebel Fleet'] ?? pois[Object.keys(pois)[0]],
      End: pois['Pallas Station'] ?? pois[Object.keys(pois)[1]],
    })
    setRoute([])
  }, [pois, set, system])

  useControls(
    'Route Planner',
    {
      Route: button(() => {
        const route = computeShortestRoute(
          from,
          to,
          DraconisExpanseSystem[system],
          allowLithoturns,
        )
        console.log(route)
        setRoute(route)
        // TODO: Move to proper inline modal or something instead of alert
        alert(
          'The route has been calculated and is displayed on the map. A NavOS journey has been printed below for your convenience.\n\n' +
            '[Journey Start]\n' +
            route
              .map(
                (each, index) =>
                  `${each.category === 'highspeed' ? '10000' : '750  '} ${index === route.length - 1 ? 'true ' : 'false'} ${each}`,
              )
              .join('\n') +
            '\n[Journey End]',
        )
      }),
    },
    [system, from, to, allowLithoturns, route],
  )

  return route
}

export function UserInterface(props: {
  system: keyof typeof DraconisExpanseSystem
}) {
  const { system } = props

  let coordScale = 0.01
  let textScale = 1000
  if (system === 'Sol' || system === 'Ring Space') {
    coordScale = 0.001
    if (system === 'Ring Space') {
      textScale = 500
    }
  }

  // const [showUserGpsOverlay, setShowUserGpsOverlay] = useState(false)
  const route = useRoutePlanner(system)

  return (
    <>
      <Canvas
        camera={{
          far: 1500000,
          near: 0.1,
          // rotation: [0, 1, 1],
          up: [0, 0, 1],
        }}
        frameloop="demand"
        performance={{ min: 0.5 }}
        dpr={[0.25, 1]}
      >
        <OrbitControls makeDefault />
        <directionalLight position={[0, 4000, 5000]} intensity={1.8} />
        <ambientLight intensity={Math.PI / 4} />
        {system && (
          <StarSystem
            system={system}
            coordScale={coordScale}
            textScale={textScale}
          />
        )}
        <group scale={[coordScale, coordScale, coordScale]}>
          {route && route.length > 0 && (
            <Line
              lineWidth={2}
              points={route}
              vertexColors={route.map(
                (each) =>
                  new Color(each.category === 'slowzone' ? 'red' : 'green'),
              )}
            />
          )}
        </group>
      </Canvas>
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--leva-space-sm)',
          right: 'var(--leva-space-sm)',
          textAlign: 'end',
          lineHeight: '1.3em',
        }}
      >
        <span style={blurbStyle}>
          * Bodies may differ from in-game appearance
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--leva-space-sm)',
          left: 'var(--leva-space-sm)',
          lineHeight: '1.3em',
          ...blurbStyle,
        }}
      >
        Submit map errors{' '}
        <a href="https://github.com/maxpowa/sdx-map/issues">here</a>
      </div>
      {/* <div
        style={{
          position: 'absolute',
          top: 'var(--leva-space-md)',
          left: 'var(--leva-space-md)',
          lineHeight: '1.3em',
          ...blurbStyle,
          borderRadius: 'var(--leva-radii-lg)',
          padding: 'var(--leva-space-sm) var(--leva-space-md)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={() => setShowUserGpsOverlay(!showUserGpsOverlay)}
      >
        <div className="leva-c-hwBXYF">
          <i
            className="leva-c-ctBOWy"
            style={{
              width: '24px',
              paddingInlineEnd: '8px',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 9 5"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: showUserGpsOverlay
                  ? 'rotate(-90deg)'
                  : 'rotate(0deg)',
              }}
              className="leva-c-cHvNmv"
            >
              <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
            </svg>
          </i>
          <span style={{ alignSelf: 'center' }}>User GPS</span>
        </div>
        <div className="leva-c-dmsJDs"></div>
      </div> */}
    </>
  )
}
