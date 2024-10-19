import * as THREE from 'three'
import { Sphere, useTexture } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'

export const Earth = (props: {
  radius: number
  onDoubleClick: (event: ThreeEvent<MouseEvent>) => void
}) => {
  const { radius, onDoubleClick } = props

  const [dayTexture, nightTexture] = useTexture([
    './planets/earth/day.jpg',
    './planets/earth/night.jpg',
  ])

  return (
    <Sphere args={[radius, 64, 128]} onDoubleClick={onDoubleClick}>
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

export const Planetoid = (props: {
  radius: number
  onDoubleClick: (event: ThreeEvent<MouseEvent>) => void
}) => {
  const { radius, onDoubleClick } = props

  const [texture] = useTexture(['./planets/rocky.jpg'])

  return (
    <Sphere args={[radius, 64, 128]} onDoubleClick={onDoubleClick}>
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
export const Planet = (props: {
  radius: number
  name: string
  onDoubleClick: (event: ThreeEvent<MouseEvent>) => void
}) => {
  const { radius, name, onDoubleClick } = props
  const [texture] = useTexture([`./planets/${name}.jpg`])

  return (
    <Sphere args={[radius, 64, 128]} onDoubleClick={onDoubleClick}>
      <meshPhongMaterial map={texture} />
    </Sphere>
  )
}

export const Body = (props: {
  radius: number
  name: string
  onDoubleClick: (event: ThreeEvent<MouseEvent>) => void
}) => {
  const { name } = props

  if (name === 'earth') {
    return <Earth {...props} />
  } else if (supportedPlanets.includes(name)) {
    return <Planet {...props} />
  }

  return <Planetoid {...props} />
}
