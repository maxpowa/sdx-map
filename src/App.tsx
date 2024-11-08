import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { button, useControls } from 'leva'
import { DraconisExpanseSystem } from './data/sdx'
import { StarSystem } from './components/SystemViewer'
import { useEffect } from 'react'

const blurbStyle = {
  padding: 'var(--leva-space-xs) var(--leva-space-sm)',
  borderRadius: 'var(--leva-radii-sm)',
  color: 'var(--leva-colors-highlight3)',
  backgroundColor: 'var(--leva-colors-elevation1)',
  fontFamily: 'var(--leva-fonts-mono)',
  fontSize: 'var(--leva-fontSizes-root)',
}

const keys = Object.keys(DraconisExpanseSystem)

function App() {
  const urlHash = localStorage.getItem('system')
  const urlBasedSystem =
    (urlHash &&
      keys.find(
        (key) => key.toLocaleLowerCase() === urlHash.toLocaleLowerCase(),
      )) ||
    keys[0]

  const { system } = useControls({
    system: {
      value: urlBasedSystem,
      options: keys,
      label: 'System',
    },
    // Placeholder to keep reset view below the system button
    'Reset View': button(() => {}),
  }) as { system: keyof typeof DraconisExpanseSystem }

  useEffect(() => {
    if (system !== urlBasedSystem) localStorage.setItem('system', system)
  }, [system, urlBasedSystem])

  let coordScale = 0.01
  let textScale = 1000
  if (system === 'Sol' || system === 'Ring Space') {
    coordScale = 0.001
    if (system === 'Ring Space') {
      textScale = 500
    }
  }

  return (
    <>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
            Scale: {0.05 / coordScale} km per grid division
          </span>
          <br />
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
          }}
        >
          <span>User GPS</span>
          <i className="leva-c-ctBOWy">
            <svg
              width="12"
              height="32"
              viewBox="0 0 9 5"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: 'rotate(90deg)' }}
              className="leva-c-cHvNmv"
            >
              <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
            </svg>
          </i>
        </div>
      </div>
    </>
  )
}

export default App
