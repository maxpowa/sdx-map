import { useThree } from '@react-three/fiber'
import { useControls, button } from 'leva'
import { createContext, useCallback, useContext, useEffect } from 'react'
import { GPSSystem, GPSBody } from '../util/gps'
import { getGPSValue } from './useSystemData'
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const ScaleContext = createContext({
  coordScale: 0.001,
  textScale: 1,
})
export const useScale = () => useContext(ScaleContext).coordScale
export const useTextScale = () => useContext(ScaleContext).textScale
export const ScaleProvider = ScaleContext.Provider
export default ScaleContext

export function useScaledCameraSystem(system: GPSSystem) {
  const controls = useThree((state) => state.controls) as OrbitControlsImpl

  const [, set] = useControls('Focused Point of Interest', () => ({
    Information: {
      value: '',
      editable: false,
    },
    GPS: {
      value: '',
      editable: false,
    },
  }))

  const scale = useScale()

  const resetCamera = useCallback(() => {
    if (!controls) return
    if (system.name === 'Sol') {
      controls.object.position.set(0, 0, 5000)
      controls.target.set(0, 0, 0)
    } else if (system.name === 'Ring Space') {
      controls.object.position.set(0, 0, 50)
      controls.target.set(15, 10, 0)
    } else if (system.name === 'Kronos') {
      controls.object.position.set(-5500, 2300, 1233)
      controls.target.set(-900, 1030, 216)
    } else if (system.name === 'Ilus') {
      controls.object.position.set(3275, 6164, 3333)
      controls.target.set(1903, 2661, 35)
    } else if (system.name === 'Jannah') {
      controls.object.position.set(2000, 0, 3500)
      controls.target.set(7000, 8000, 1000)
    }
    set({ Information: 'N/A', GPS: '' })

    const focus = getGPSValue('focus')
    if (focus) {
      const position = focus.clone().multiplyScalar(scale)
      controls.target = position
      const cameraPosition = position
        .clone()
        .add(
          controls.object.position
            .normalize()
            .multiplyScalar(
              (GPSBody.isBody(focus) ? focus.radius : 50000) * scale * 5,
            ),
        )
      controls.object.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
      )
      set({
        Information: `${focus.name} (${focus.category})`,
        GPS: focus.toString(),
      })
    }
    controls.update()
  }, [controls, set, system, scale])

  useEffect(resetCamera, [system.name, resetCamera, controls])

  useControls(
    {
      'Reset View': button(resetCamera),
    },
    [controls, system.name],
  )
}
