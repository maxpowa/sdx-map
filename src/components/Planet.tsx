import * as THREE from 'three'
import { Sphere, useTexture } from '@react-three/drei'

type BodyProps = { radius: number; name: string }

export const Earth = (props: BodyProps) => {
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

export const Planetoid = (props: BodyProps) => {
  const { radius } = props

  const [texture] = useTexture(['./planets/rocky.jpg'])

  return (
    <Sphere args={[radius, 64, 128]} rotation={[Math.PI / 2, 0, 0]}>
      <meshPhongMaterial map={texture} />
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
export const Planet = (props: BodyProps) => {
  const { radius, name } = props
  const [texture] = useTexture([`./planets/${name}.jpg`])

  return (
    <Sphere args={[radius, 64, 128]} rotation={[Math.PI / 2, 0, 0]}>
      <meshPhongMaterial map={texture} />
    </Sphere>
  )
}

export const Body = (props: BodyProps) => {
  const { name, radius } = props

  let Component = Planetoid
  if (name === 'earth') {
    Component = Earth
  } else if (supportedPlanets.includes(name)) {
    Component = Planet
  }

  return (
    <>
      <Component {...props} radius={radius * 0.7} />
    </>
  )
}
