import { Canvas } from '@react-three/fiber'
import { DraconisExpanseSystem } from '../data/sdx'
import { Stars, OrbitControls, Line } from '@react-three/drei'
import { StarSystem } from './SystemViewer'
import { useState } from 'react'
import { button, useControls } from 'leva'
import { GPSPoint, GPSRoute, route } from '../util/gps'

const blurbStyle = {
  padding: 'var(--leva-space-xs) var(--leva-space-sm)',
  borderRadius: 'var(--leva-radii-sm)',
  color: 'var(--leva-colors-highlight3)',
  backgroundColor: 'var(--leva-colors-elevation1)',
  fontFamily: 'var(--leva-fonts-mono)',
  fontSize: 'var(--leva-fontSizes-root)',
}

const globalData = DraconisExpanseSystem['Sol']
const deimos = globalData
  .pois(false, true)
  .find((body) => body.name === 'Deimos') as GPSPoint
const ariel = globalData
  .pois(false, true)
  .find((body) => body.name === 'Ariel') as GPSPoint

const generator = route(deimos, ariel, globalData)

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

  const [showUserGpsOverlay, setShowUserGpsOverlay] = useState(false)
  const [route, setRoute] = useState<GPSRoute>([deimos])

  useControls(
    'Route',
    {
      'Next Waypoint': button(() => {
        const next = generator.next()
        console.log({ next, route })
        if (next.value) {
          setRoute([...route, next.value])
        }
      }),
    },
    [route, setRoute],
  )

  return (
    <>
      <Canvas
        camera={{
          far: 1500000,
          near: 0.1,
          // rotation: [0, 1, 1],
          up: [0, 0, 1],
        }}
      >
        <OrbitControls makeDefault />
        <directionalLight position={[0, 4000, 5000]} intensity={1} />
        <ambientLight intensity={Math.PI / 4} />
        <Stars radius={100000000 * coordScale} fade />
        {system && (
          <StarSystem
            system={system}
            coordScale={coordScale}
            textScale={textScale}
          />
        )}
        <group scale={[coordScale, coordScale, coordScale]}>
          {route && route.length > 1 && <Line points={route} color="red" />}
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
        <span style={blurbStyle}>* BODIES MAY LOOK DIFFERENT IN-GAME</span>
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
        SUBMIT MAP BUGS{' '}
        <a href="https://github.com/maxpowa/sdx-map/issues">HERE</a>
      </div>
      <div
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
              transform: showUserGpsOverlay ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
            className="leva-c-cHvNmv"
          >
            <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
          </svg>
        </i>
        <div>User GPS</div>
      </div>
    </>
  )
}
