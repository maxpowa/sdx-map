import { OrbitControls } from '@react-three/drei'
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
    },
    // Placeholder to keep reset view below the system button
    'Reset View': button(() => {}),
  }) as { system: keyof typeof DraconisExpanseSystem }

  useEffect(() => {
    if (system !== urlBasedSystem) localStorage.setItem('system', system)
  }, [system, urlBasedSystem])

  return (
    <>
      <Canvas
        camera={{
          far: 1500000,
          near: 0.1,
        }}
      >
        <OrbitControls makeDefault rotation={[0, 0, 0]} up={[0, 1, 0]} />
        <directionalLight position={[0, 4000, 5000]} intensity={1} />
        <ambientLight intensity={Math.PI / 4} />
        {system && <StarSystem system={system} />}
      </Canvas>
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--leva-space-sm)',
          right: 'var(--leva-space-sm)',
          ...blurbStyle,
        }}
      >
        * BODIES MAY LOOK DIFFERENT IN-GAME
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--leva-space-sm)',
          left: 'var(--leva-space-sm)',
          ...blurbStyle,
        }}
      >
        SUBMIT MAP BUGS{' '}
        <a href="https://github.com/maxpowa/sdx-map/issues">HERE</a>
      </div>
    </>
  )
}

export default App
