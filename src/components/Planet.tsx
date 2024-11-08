import * as THREE from 'three'
import { Sphere, useTexture } from '@react-three/drei'

export const Earth = (props: { radius: number }) => {
  const { radius } = props

  const [dayTexture, nightTexture] = useTexture([
    './planets/earth/day.jpg',
    './planets/earth/night.jpg',
  ])

  return (
    <Sphere args={[radius, 64, 128]} rotation={[Math.PI / 2, 0, 0]}>
      <meshPhongMaterial
        map={dayTexture}
        emissiveMap={nightTexture}
        emissive={new THREE.Color(0xa0a0a0)}
        emissiveIntensity={2}
        specular={1}
        shininess={30}
      />
    </Sphere>
  )
}

export const Planetoid = (props: { radius: number }) => {
  const { radius } = props

  const [texture] = useTexture(['./planets/rocky.jpg'])

  return (
    <Sphere args={[radius, 64, 128]} rotation={[Math.PI / 2, 0, 0]}>
      <meshPhongMaterial
        map={texture}
        displacementMap={texture}
        displacementScale={1000}
      />
    </Sphere>
  )
}

const supportedPlanets = [
  'earth',
  'jupiter',
  'saturn',
  'mars',
  'uranus',
  'jannah',
  'kronos',
  'ilus',
  'luna',
]
export const Planet = (props: { radius: number; name: string }) => {
  const { radius, name } = props
  const [texture] = useTexture([`./planets/${name}.jpg`])

  return (
    <Sphere args={[radius, 64, 128]} rotation={[Math.PI / 2, 0, 0]}>
      <meshPhongMaterial map={texture} />
    </Sphere>
  )
}

export const Body = (props: { radius: number; name: string }) => {
  const { name } = props

  if (name === 'earth') {
    return <Earth {...props} />
  } else if (supportedPlanets.includes(name)) {
    return <Planet {...props} />
  }

  return <Planetoid {...props} />
}
