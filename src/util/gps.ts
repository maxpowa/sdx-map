import { Vector3 } from 'three'

// These are somewhat specific to SDX, might make sense to pull this out.
export const ZoneColors = {
  DX1: '#000000',
  DX2: '#FF8C00',
  DX3: '#FF0000',
  DX4: '#0000FF',
  DX5: '#A9A9A9',
  DX6: '#008000',
  DX7: '#800080',
  DX8: '#FFFFFF',
} as Record<string, string>

// Sources:
// https://discord.com/channels/516135382191177728/990099184810078248/1293984387754623078
// https://discord.com/channels/516135382191177728/911150478325325824/1292874325715587205
const bodies = {
  Ariel: 20000,
  Ceres: 60000,
  Deimos: 9000,
  Earth: 200000,
  Europa: 21000,
  Ganymede: 35000,
  Ilus: 120000, // guess, no source
  'Ilus 1': 16000, // rough estimate based on survey data (I went there and figured an approximate value)
  Io: 22000,
  Jannah: 385000,
  Jupiter: 280000,
  Kronos: 130000, // guess, no source
  'Kronos 1': 20000, // guess, no source
  Luna: 28000,
  Mars: 120000,
  Pallas: 28000,
  Phobos: 8800,
  Rhea: 18000,
  Saturn: 120000,
  Titan: 20000,
  Uranus: 160000,
  Vesta: 39000, // admins say this is 56km, but it seems smaller due to the location of Vesta (Station), compared to the origin of Vesta (Body), or the waypoint for the center of Vesta is wrong.
} as Record<string, number>

export class GPSPoint extends Vector3 {
  class: string
  name: string
  color: string
  category?: string
  radius?: number
  parent?: GPSZone

  constructor(
    x: number,
    y: number,
    z: number,
    cls: string,
    name: string,
    color: string,
    category?: string,
    parent?: GPSZone,
  ) {
    super(x, y, z)
    this.class = cls
    this.name = name
    this.x = x
    this.y = y
    this.z = z
    this.color = color
    this.category = category
    this.parent = parent
  }

  relativeCoords(): [number, number, number] {
    return [
      this.x - (this.parent?.x ?? 0),
      this.y - (this.parent?.y ?? 0),
      this.z - (this.parent?.z ?? 0),
    ]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toString(_: boolean = false): string {
    let result = `GPS:${this.name}:${this.x}:${this.y}:${this.z}:${this.color}:`
    if (this.category) result += `${this.category}:`
    return result
  }

  // This regex is kind of hellish, but it works. I assume the game has a similar internal regex, since the allowed format is very loose.
  static GPS_REGEX = new RegExp(
    /GPS:(?<name>.+?):(?<x>-?\d+(?:.\d+)?):(?<y>-?\d+(?:.\d+)?):(?<z>-?\d+(?:.\d+)?):(?<color>#(?:[0-9a-fA-F]{1,2}){3,4})(?::(?<category>.+):)?/,
  )
  static fromString(gps: string): GPSPointOfInterest {
    const result = GPSPoint.GPS_REGEX.exec(gps)
    if (!result) {
      throw new Error('Failed to parse GPS, invalid format.')
    }

    const name = result[1]
    const radixResult = /(?<name>.+?)(?: - \(R:(?<radix>\d+?)km\))?$/.exec(
      name,
    )!

    const x = parseFloat(result[2])
    const y = parseFloat(result[3])
    const z = parseFloat(result[4])

    const color = result[5]
    const category = result[6]

    if (radixResult[2]) {
      return new GPSZone(
        x,
        y,
        z,
        name,
        ZoneColors[category] ?? color ?? '#FFFFFF',
        parseInt(radixResult[2], 10) * 1000,
        undefined,
        category,
      )
    } else if (bodies[name]) {
      return new GPSBody(x, y, z, name, color ?? '#C8C8C8', bodies[name] / 2)
    }

    return new GPSPoint(x, y, z, 'poi', name, color, category)
  }
}

export class GPSBody extends GPSPoint {
  radius: number

  constructor(
    x: number,
    y: number,
    z: number,
    name: string,
    color: string,
    radius: number,
    category?: string,
    parent?: GPSZone,
  ) {
    super(x, y, z, 'body', name, color, category, parent)
    this.radius = radius
  }

  static isBody(point: GPSPointOfInterest): point is GPSBody {
    return point.class === 'body'
  }
}

export class GPSZone extends GPSPoint {
  radius: number
  children: GPSList

  constructor(
    x: number,
    y: number,
    z: number,
    name: string,
    color: string,
    radius: number,
    children: GPSList = new GPSList(),
    category?: string,
    parent?: GPSZone,
  ) {
    if (!name.includes(' - (R:')) {
      name += ` - (R:${radius / 1000}km)`
    }
    super(x, y, z, 'zone', name, color, category, parent)
    this.radius = radius
    this.children = children
  }

  doesCapture(point: GPSPointOfInterest): boolean {
    // if the point is a zone, double check the radius is smaller than the current zone
    return (
      point.distanceTo(this) < this.radius &&
      !(GPSZone.isZone(point) && point.radius > this.radius)
    )
  }

  push(point: GPSPointOfInterest): void {
    point.parent = this
    this.children.push(point)
  }

  toString(includeChildren: boolean = false): string {
    if (includeChildren && this.children) {
      return `${super.toString()}\n${this.children.toString()}`
    }
    return super.toString()
  }

  // "from" point must be inside of the zone
  vectorToEdge(from: GPSPoint, padding: number = 0): Vector3 {
    if (!this.doesCapture(from)) {
      throw new Error('POI is not within the zone')
    }

    const distanceFromCenter = from.distanceTo(this)
    const fromVec = new Vector3(from.x, from.y, from.z)
    const vec = new Vector3(from.x - this.x, from.y - this.y, from.z - this.z)
    return fromVec.add(
      vec
        .normalize()
        .multiplyScalar(this.radius - distanceFromCenter + padding),
    )
  }

  static isHighSpeed(zone: GPSZone): boolean {
    return zone.radius >= 2750000
  }

  static isZone(point: GPSPointOfInterest): point is GPSZone {
    return point.class === 'zone'
  }
}

export type GPSPointOfInterest = GPSPoint | GPSBody | GPSZone

export class GPSList {
  private list = [] as GPSPointOfInterest[]
  private zoneCount = 0

  constructor(...args: GPSPointOfInterest[]) {
    this.list.push(...args)
    this.arrange()
  }

  push(...args: GPSPointOfInterest[]): void {
    this.list.push(...args)
    this.arrange()
  }

  addFromString(gps: string): void {
    const lines = gps
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line)
    const results = lines.map((line) => GPSPoint.fromString(line))
    this.push(...results)
  }

  pois(
    withTurns: boolean = false,
    recursive: boolean = false,
  ): GPSPointOfInterest[] {
    return this.list.flatMap((poi) => {
      if (GPSZone.isZone(poi) && recursive) {
        return poi.children.pois(withTurns)
      }
      if (withTurns && poi.parent && !GPSZone.isHighSpeed(poi.parent)) {
        const turnVec = poi.parent?.vectorToEdge(poi)
        if (turnVec && !turnVec.equals(poi)) {
          return [
            poi,
            new GPSPoint(
              turnVec.x,
              turnVec.y,
              turnVec.z,
              'turn',
              `${poi.name} (Turn)`,
              '#00FFFF',
              poi.category,
              poi.parent,
            ),
          ]
        }
      }
      return [poi]
    })
  }

  zones(withHighSpeed: boolean = false, recursive: boolean = false): GPSZone[] {
    return this.list.flatMap((result) => {
      if (GPSZone.isZone(result)) {
        return withHighSpeed || !GPSZone.isHighSpeed(result)
          ? [
              ...(recursive
                ? result.children.zones(withHighSpeed, recursive)
                : []),
              result,
            ]
          : []
      }
      return []
    }) as GPSZone[]
  }

  map<T>(callback: (point: GPSPointOfInterest, index: number) => T): T[] {
    return this.list.map(callback)
  }

  count(): number {
    return this.list.length
  }

  arrange(): GPSList {
    const zones = this.list.filter((result) => GPSZone.isZone(result))
    const pois = this.list.filter((result) => !GPSZone.isZone(result))

    // sort zones small -> large to make sure pois find smallest zone they are within
    zones.sort((a, b) => a.radius - b.radius)

    const outsidePOIs = [] as GPSPointOfInterest[]

    // Nest POIs within the smallest parent zone
    pois.forEach((poi) => {
      const parentZone = zones.find((zone) => zone.doesCapture(poi))
      if (parentZone) {
        poi.parent = parentZone
        parentZone.push(poi)
      } else {
        outsidePOIs.push(poi)
      }
    })

    if (zones.length !== this.zoneCount) {
      // Nest zones within zones, again within their smallest possible parents
      let i = zones.length
      while (i--) {
        const zone = zones[i]
        const parentZone = zones.find(
          (potentialParent) =>
            zone !== potentialParent && potentialParent.doesCapture(zone),
        )
        if (parentZone) {
          zone.parent = parentZone
          parentZone.push(zone)
          zones.splice(i, 1)
        }
      }

      this.zoneCount = zones.length
    }
    this.list = [...zones.reverse(), ...outsidePOIs]

    return this
  }

  clone(): GPSList {
    return new GPSList(...this.list)
  }

  toString(): string {
    if (this.list.length === 0) return ''
    return [this.list.map((p) => p.toString(true)).join('\n')]
      .filter((group) => !!group)
      .join('\n')
  }

  static fromString(gps: string): GPSList {
    const lines = gps
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line)
    const results = lines.map((line) => GPSPoint.fromString(line))
    return new GPSList(...results)
  }
}

export type GPSRoute = GPSPoint[]

export const computeShortestRoute = (
  from: GPSPoint,
  to: GPSPoint,
  world: GPSList,
): GPSRoute => {
  const route: GPSRoute = [
    new GPSPoint(
      from.x,
      from.y,
      from.z,
      'poi',
      from.name + ' (Start)',
      from.color,
    ),
  ]

  if (from.parent === to.parent) {
    const potentialObstacles = from.parent?.children ?? world
    const unitVector = new Vector3(from.x, from.y, from.z)
      .sub(new Vector3(to.x, to.y, to.z))
      .normalize()

    potentialObstacles.map((obstacle) => {
      if (obstacle === from || obstacle === to) return

      // line-sphere intersection formula
      // adapted from the formula provided on https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
      const o = new Vector3(from.x, from.y, from.z)
      const c = new Vector3(obstacle.x, obstacle.y, obstacle.z)
      const r = obstacle.radius || 10
      const u = unitVector.clone()
      const distance = o.distanceTo(c)
      const nabla = u.dot(o.clone().sub(c)) ** 2 - (distance ** 2 - r ** 2)

      if (nabla < 0) {
        // no intersection
      } else {
        // tangent or two intersections
        const d = -u.dot(o.clone().sub(c))
        const midpoint = o.clone().add(u.clone().multiplyScalar(d))

        const distanceFromCenter = midpoint.distanceTo(obstacle)
        const turnPoint = new Vector3(midpoint.x, midpoint.y, midpoint.z)
        const vec = new Vector3(
          midpoint.x - obstacle.x,
          midpoint.y - obstacle.y,
          midpoint.z - obstacle.z,
        )

        // half-radius padding to avoid accidental voxel collision or zone transfer
        // cap at 50km to avoid excessive padding
        const bypassPadding = Math.min(r * 0.5, 50000)
        turnPoint.add(
          vec
            .normalize()
            .multiplyScalar(r - distanceFromCenter + bypassPadding),
        )

        route.push(
          new GPSPoint(
            turnPoint.x,
            turnPoint.y,
            turnPoint.z,
            'poi',
            obstacle.name + ' (P1)',
            obstacle.color,
          ),
        )
      }
    })

    route.push(
      new GPSPoint(to.x, to.y, to.z, 'poi', to.name + ' (End)', to.color),
    )
  }
  return route
}

// export const computeRoute = (
//   from: GPSPoint,
//   to: GPSPoint,
//   world: GPSList,
//   optimize: 'time' | 'distance',
// ): GPSRoute => {
//   const route: GPSRoute = [from]

//   return route
// }
