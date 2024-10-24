import { createContext, useContext } from 'react'

const ScaleContext = createContext({
  coordScale: 0.001,
  textScale: 1,
})
export const useScale = () => useContext(ScaleContext).coordScale
export const useTextScale = () => useContext(ScaleContext).textScale
export const ScaleProvider = ScaleContext.Provider
export default ScaleContext
