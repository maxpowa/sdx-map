import { useEffect, useState } from 'react'

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [state, setInternalState] = useState<T>(initialValue)

  useEffect(() => {
    const value = localStorage.getItem(key)

    if (!value) return

    setInternalState(JSON.parse(value))
  }, [key])

  const setState = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value))
    setInternalState(value)
  }

  return [state, setState]
}

// const [persistedGpsList, setPersistedGpsList] = usePersistentState(
//   `userGPSList-${system}`,
//   '',
// )
// const [{ [`gpsList-${system}`]: userGpsList }] = useControls(
//   'User GPS List',
//   () => ({
//     [`gpsList-${system}`]: {
//       label: system,
//       value: persistedGpsList,
//       // show as multiline text
//       rows: true,
//     },
//   }),
//   [system, persistedGpsList],
// )

// useEffect(() => {
//   console.log('userGpsList', userGpsList)
//   if (userGpsList !== persistedGpsList && userGpsList)
//     setPersistedGpsList(userGpsList)
// }, [userGpsList, setPersistedGpsList, persistedGpsList])
