import { useState, useEffect } from 'react'

export function useHashParams() {
  const [hashState, setHashState] = useState<URLSearchParams>()

  useEffect(() => {
    const updateState = (event: HashChangeEvent) => {
      const newUrl = new URL(event.newURL)
      if (event.oldURL && newUrl.hash === new URL(event.oldURL).hash) return

      const urlHash = newUrl.hash.replace('#', '')
      const params = new URLSearchParams(urlHash)
      setHashState(params)
    }

    updateState({
      newURL: window.location.toString(),
    } as HashChangeEvent)
    window.addEventListener('hashchange', updateState)
    return () => {
      window.removeEventListener('hashchange', updateState)
    }
  }, [])

  return hashState
}
