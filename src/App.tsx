import { DraconisExpanseSystem } from './data/sdx'
import { UserInterface } from './components/UserInterface'
import { useSynchronizedPicklistSetting } from './hooks/useSynchronizedSetting'

const keys = Object.keys(DraconisExpanseSystem)

function App() {
  const system = useSynchronizedPicklistSetting<
    keyof typeof DraconisExpanseSystem
  >('system', keys as (keyof typeof DraconisExpanseSystem)[])

  return (
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
  )
}

export default App
