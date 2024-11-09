import { useControls } from 'leva'
import { DraconisExpanseSystem } from './data/sdx'
import { useEffect } from 'react'
import { UserInterface } from './components/UserInterface'

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
  }) as { system: keyof typeof DraconisExpanseSystem }

  useEffect(() => {
    if (system !== urlBasedSystem) localStorage.setItem('system', system)
  }, [system, urlBasedSystem])

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
        }}
      >
        <UserInterface system={system}></UserInterface>
      </div>
    </>
  )
}

export default App
