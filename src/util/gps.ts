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
// Anything divided by 0.7 is an approximation, since most planets in SE have approximately 70% of their radius as their actual surface radius with the rest being atmosphere/gravity well
// It's not that I don't trust the data shared on the discord, but that the data doesn't seem to be accurate.
// I think some of the sizes are based on the size of the amosphere.
const bodies = {
  Ariel: 20000,
  Ceres: 60000 / 0.7,
  Deimos: 9000 / 0.7,
  Earth: 200000,
  Europa: 21000 / 0.7,
  Ganymede: 35000 / 0.7,
  Ilus: 120000 / 0.7, // guess, no source
  'Ilus 1': 16000 / 0.7, // rough estimate based on survey data (I went there and figured an approximate value)
  Io: 22000,
  Jannah: 385000 / 0.7,
  Jupiter: 280000,
  Kronos: 130000 / 0.7, // guess, no source
  'Kronos 1': 20000 / 0.7, // guess, no source
  Luna: 28000,
  Mars: 120000,
  Pallas: 28000 / 0.7,
  Phobos: 8800 / 0.7,
  Rhea: 18000 / 0.7,
  Saturn: 120000,
  Titan: 20000 / 0.7,
  Uranus: 160000,
  Vesta: 56000,
} as Record<string, number>

const TURN_DISTANCE = 2500

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
    let result = `GPS:${this.name}:${this.x}:${this.y}:${this.z}:#FF${this.color.substring(1)}:`
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

    let color = result[5]
    if (color.length > 6) {
      color = '#' + color.substring(color.length - 6)
    }
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

  // Add multiple GPSLists together
  add(...args: GPSList[]): void {
    for (const arg of args) {
      this.list.push(...arg.list)
    }
    this.arrange()
  }

  push(...args: GPSPointOfInterest[]): GPSPointOfInterest[] {
    this.list.push(...args)
    this.arrange()
    // returns the added points
    return [...args]
  }

  addFromString(gps: string): GPSPointOfInterest[] {
    const lines = gps
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line)
    const results = lines.map((line) => GPSPoint.fromString(line))
    return this.push(...results)
  }

  pois(
    withTurns: boolean = false,
    recursive: boolean = false,
  ): GPSPointOfInterest[] {
    return this.list.flatMap((poi) => {
      if (GPSZone.isZone(poi)) {
        return recursive ? poi.children.pois(withTurns, recursive) : []
      }
      if (withTurns && poi.parent && !GPSZone.isHighSpeed(poi.parent)) {
        const turnVec = poi.parent?.vectorToEdge(poi, TURN_DISTANCE)
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
          : [
              ...(recursive
                ? result.children.zones(withHighSpeed, recursive)
                : []),
            ]
      }
      return []
    }) as GPSZone[]
  }

  sort(
    compareFn?: (a: GPSPointOfInterest, b: GPSPointOfInterest) => number,
  ): GPSPointOfInterest[] {
    return this.list.sort(compareFn)
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

// This is a rough estimate of the distance required to reach max speed
export const distanceToMaxSpeed = (
  accel: number,
  maxSpeed: number,
  initialSpeed = 0,
): number => {
  return maxSpeed ** 2 - initialSpeed ** 2 / (2 * accel)
}

export enum RoutingModes {
  None = 0,
  // Do not allow lithoturns (will ensure waypoints that enter zones are just outside of the zone)
  No_Lithoturns = 1 << 0,
  // Internal, used for the recursion to know when to ignore the zone check
  NavigatingAroundZoneToEntry = 1 << 1,
  DeterminedStartDirection = 1 << 2,
}

export function* traverseRoutingPath(
  from: GPSPoint,
  to: GPSPoint,
  world: GPSList,
  mode: RoutingModes = 0,
): Generator<GPSPoint, void> {
  if (from.equals(to)) return

  const zones = world.zones(true, true)
  const fromZone = from.parent ?? zones.find((zone) => zone.doesCapture(from))
  const toZone = to.parent ?? zones.find((zone) => zone.doesCapture(to))
  if (
    fromZone !== toZone &&
    fromZone &&
    !GPSZone.isHighSpeed(fromZone) &&
    (mode & RoutingModes.DeterminedStartDirection) !==
      RoutingModes.DeterminedStartDirection
  ) {
    const start = new GPSPoint(
      from.x,
      from.y,
      from.z,
      'poi',
      from.name,
      from.color,
      fromZone && !GPSZone.isHighSpeed(fromZone) ? 'slowzone' : 'highspeed',
    )

    // Vector to TURN_DISTANCE outside of zone
    // With user GPS points, we will need to check for body collisions here, since you may have a GPS point between the planet and a moon
    let vec
    if (fromZone.equals(from)) {
      // starting point and zone are the same position, so need to calculate a vector to the edge using our overall direction unit vector
      vec = new Vector3()
        .subVectors(to, from)
        .normalize()
        .multiplyScalar(fromZone.radius + TURN_DISTANCE)
        .add(from)
    } else {
      vec = fromZone.vectorToEdge(from, TURN_DISTANCE)
    }
    const newFromPoint = new GPSPoint(
      vec.x,
      vec.y,
      vec.z,
      'poi',
      `Turn (${from.name})`,
      from.color,
      fromZone && !GPSZone.isHighSpeed(fromZone) ? 'slowzone' : 'highspeed',
    )

    console.log('Routing out of zone', fromZone.name)
    yield* traverseRoutingPath(
      start,
      newFromPoint,
      fromZone.children,
      mode | RoutingModes.DeterminedStartDirection,
    )

    console.log('Continuing to destination')
    yield* traverseRoutingPath(
      newFromPoint,
      to,
      world,
      mode | RoutingModes.DeterminedStartDirection,
    )
    return
  }

  const unitVector = new Vector3(to.x, to.y, to.z)
    .sub(new Vector3(from.x, from.y, from.z))
    .normalize()

  const obstacles = [...zones, ...world.pois(false, true)]
  const sortedObstacles = obstacles
    .filter((obstacle) => {
      // filter to relevant obstacles
      if (obstacle.equals(from) || obstacle.equals(to)) {
        return false
      } else if (GPSZone.isZone(obstacle)) {
        if (GPSZone.isHighSpeed(obstacle)) {
          return false
        } else if (
          from.distanceTo(obstacle) >
          from.distanceTo(to) + obstacle.radius
        ) {
          return false
        } else if (obstacle.doesCapture(from) && obstacle.doesCapture(to)) {
          // if this zone captures both from and to, it's not an applicable obstacle
          return false
        }
      }
      return true
    })
    .sort((a, b) => a.distanceTo(from) - b.distanceTo(from))

  // Lithoturning only applies when entering into a zone from outside, in other cases it is not required
  const allowsLithoturning =
    (mode & RoutingModes.No_Lithoturns) !== RoutingModes.No_Lithoturns

  for (const obstacle of sortedObstacles) {
    if (
      (mode & RoutingModes.NavigatingAroundZoneToEntry) !==
        RoutingModes.NavigatingAroundZoneToEntry &&
      GPSZone.isZone(obstacle) &&
      !GPSZone.isHighSpeed(obstacle) &&
      obstacle.doesCapture(to) &&
      !obstacle.doesCapture(from)
    ) {
      // vector exactly to the optimal point on the edge of the zone (utilize zone speed limits to brake)
      // 1km to the inside of the zone should guarantee we actally end up inside the zone
      // This should give NavOS a chance to reorient before reaching the waypoint
      const vec = obstacle.vectorToEdge(
        to,
        allowsLithoturning ? -TURN_DISTANCE : TURN_DISTANCE,
      )
      const newFromPoint = new GPSPoint(
        vec.x,
        vec.y,
        vec.z,
        'poi',
        allowsLithoturning
          ? `Lithoturn (${obstacle.name})`
          : `Turn (${obstacle.name})`,
        from.color,
        'slowzone', // it's always slowzone in this scenario
      )

      console.log(newFromPoint.name)

      yield* traverseRoutingPath(
        from,
        newFromPoint,
        world,
        mode | RoutingModes.NavigatingAroundZoneToEntry,
      )
      yield* traverseRoutingPath(
        newFromPoint,
        to,
        obstacle.children,
        mode | RoutingModes.NavigatingAroundZoneToEntry,
      )
      return
    }

    // line-sphere intersection formula
    // adapted from the formula provided on https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
    const o = new Vector3(from.x, from.y, from.z)
    const c = new Vector3(obstacle.x, obstacle.y, obstacle.z)
    // Either use the radius of the obstacle (if a body), or 5km as a safeguard against user GPS points (which may have loaded grids under them)
    const r = obstacle.radius ?? TURN_DISTANCE
    const u = unitVector.clone()
    const normal = o.distanceTo(c)
    const nabla = u.dot(o.clone().sub(c)) ** 2 - (normal ** 2 - r ** 2)

    if (nabla >= 0) {
      const d = -u.dot(o.clone().sub(c))

      if (d < 0) {
        // no intersection (obstacle is behind the starting point)
        continue
      }

      if (d > o.distanceTo(to)) {
        // no intersection (obstacle is inline with the current position but not in range)
        continue
      }

      console.log('Intersection with', obstacle.name)
      const midpoint = new Vector3().addVectors(o, u.clone().multiplyScalar(d))

      const distanceFromCenter = midpoint.distanceTo(obstacle)
      const direction = new Vector3().subVectors(midpoint, obstacle).normalize()

      // half-radius padding to avoid accidental voxel collision or zone transfer
      // cap at 50km to avoid excessive padding
      const bypassPadding = Math.min(r * 0.5, 50000)
      const turnPoint = new Vector3().addVectors(
        midpoint,
        direction.multiplyScalar(r - distanceFromCenter + bypassPadding),
      )

      if (
        allowsLithoturning &&
        from.distanceTo(to) < from.distanceTo(turnPoint)
      ) {
        // we were close enough to lithoturning anyways, so just continue
        continue
      }

      const nextPoint = new GPSPoint(
        turnPoint.x,
        turnPoint.y,
        turnPoint.z,
        'poi',
        `Obstacle (${obstacle.name})`,
        obstacle.color,
        'highspeed',
      )
      const nextZone = zones.find((zone) => zone.doesCapture(nextPoint))
      if (nextZone && !GPSZone.isHighSpeed(nextZone)) {
        nextPoint.category = 'slowzone'
      }

      console.log(
        `Turning to avoid ${obstacle.name} (${from.name} -> ${to.name})`,
      )
      yield* traverseRoutingPath(from, nextPoint, world, mode)

      console.log(`Continuing route (${nextPoint.name} -> ${to.name})`)
      yield* traverseRoutingPath(nextPoint, to, world, mode)

      return // end the loop and exit the function
    }
  }

  console.log('No obstacles found, direct route')

  // Offset by 1km so we don't slam directly into the target
  const endPosition = new Vector3(to.x, to.y, to.z).add(
    unitVector.clone().multiplyScalar(((to.radius ?? 0) + 1000) * -1),
  )
  yield new GPSPoint(
    endPosition.x,
    endPosition.y,
    endPosition.z,
    'poi',
    to.name,
    to.color,
    toZone && !GPSZone.isHighSpeed(toZone) ? 'slowzone' : 'highspeed',
  )
}

export function* traverseRoute(
  waypoints: GPSPoint[],
  world: GPSList,
  allowLithoturns: boolean = true,
): Generator<GPSPoint, void> {
  if (waypoints.length < 2) throw new Error('too few waypoints')

  const isStartInSlowZone =
    waypoints[0].parent && !GPSZone.isHighSpeed(waypoints[0].parent)
  yield new GPSPoint(
    waypoints[0].x,
    waypoints[0].y,
    waypoints[0].z,
    'poi',
    waypoints[0].name,
    waypoints[0].color,
    isStartInSlowZone ? 'slowzone' : 'highspeed',
  )
  for (let i = 0; i < waypoints.length - 1; i++) {
    yield* traverseRoutingPath(
      waypoints[i],
      waypoints[i + 1],
      world,
      allowLithoturns ? 0 : RoutingModes.No_Lithoturns,
    )
  }
}

export const computeShortestRoute = (
  waypoints: GPSPoint[],
  world: GPSList,
  allowLithoturns: boolean = true,
): GPSRoute => {
  return [...traverseRoute(waypoints, world, allowLithoturns)]
}
