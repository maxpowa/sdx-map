import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useControls } from 'leva'
import { DraconisExpanseSystem } from './data/sdx'
import { StarSystem } from './components/SystemViewer'

function App() {
  const { system } = useControls({
    system: {
      options: Object.keys(DraconisExpanseSystem),
    },
  }) as { system: keyof typeof DraconisExpanseSystem }

  return (
    <Canvas
      camera={{
        far: 1500000,
        near: 0.1,
      }}
    >
      <OrbitControls makeDefault rotation={[0, 0, 0]} up={[0, 1, 0]} />
      <directionalLight position={[0, 4000, 5000]} intensity={1} />
      <ambientLight intensity={0.4} />
      <StarSystem system={system} />
    </Canvas>
  )
}

export default App
