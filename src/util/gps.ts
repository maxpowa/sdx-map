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
  Io: 22000,
  Jannah: 385000,
  Jupiter: 280000,
  Kronos: 200000, // guess, no source
  Luna: 28000,
  Mars: 120000,
  Pallas: 28000,
  Phobos: 8800,
  Rhea: 18000,
  Saturn: 120000,
  Titan: 20000,
  Uranus: 160000,
  Vesta: 56000,
} as Record<string, number>

export class GPSPoint {
  class: string
  name: string
  x: number
  y: number
  z: number
  color: string
  category?: string
  radius?: number
  parent?: GPSZone

  constructor(
    cls: string,
    name: string,
    x: number,
    y: number,
    z: number,
    color: string,
    category?: string,
    parent?: GPSZone,
  ) {
    this.class = cls
    this.name = name
    this.x = x
    this.y = y
    this.z = z
    this.color = color
    this.category = category
    this.parent = parent
  }

  offset(
    offsetX: number = 0,
    offsetY: number = 0,
    offsetZ: number = 0,
  ): GPSPointOfInterest {
    this.x += offsetX
    this.y += offsetY
    this.z += offsetZ
    return this
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
        name,
        x,
        y,
        z,
        ZoneColors[category] ?? color ?? '#FFFFFF',
        parseInt(radixResult[2], 10) * 1000,
      )
    } else if (bodies[name]) {
      return new GPSBody(name, x, y, z, color ?? '#C8C8C8', bodies[name] / 2)
    }

    return new GPSPoint('poi', name, x, y, z, color, category)
  }
}

export class GPSBody extends GPSPoint {
  radius: number

  constructor(
    name: string,
    x: number,
    y: number,
    z: number,
    color: string,
    radius: number,
    category?: string,
    parent?: GPSZone,
  ) {
    super('body', name, x, y, z, color, category, parent)
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
    name: string,
    x: number,
    y: number,
    z: number,
    color: string,
    radius: number,
    children: GPSList = new GPSList(),
    category?: string,
    parent?: GPSZone,
  ) {
    if (!name.includes(' - (R:')) {
      name += ` - (R:${radius / 1000}km)`
    }
    super('zone', name, x, y, z, color, category, parent)
    this.radius = radius
    this.children = children
  }

  doesCapture(point: GPSPointOfInterest): boolean {
    const distance = Math.sqrt(
      Math.pow(point.x - this.x, 2) +
        Math.pow(point.y - this.y, 2) +
        Math.pow(point.z - this.z, 2),
    )
    // if the point is a zone, double check the radius is smaller than the current zone
    return (
      distance < this.radius &&
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

  pois(): GPSPointOfInterest[] {
    return this.list.flatMap((result) =>
      GPSZone.isZone(result) ? [...result.children.pois(), result] : [result],
    )
  }

  map<T>(callback: (point: GPSPointOfInterest) => T): T[] {
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
        parentZone.push(poi.offset(-parentZone.x, -parentZone.y, -parentZone.z))
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
            zone !== potentialParent && zone.doesCapture(potentialParent),
        )
        if (parentZone) {
          parentZone.push(
            zone.offset(-parentZone.x, -parentZone.y, -parentZone.z),
          )
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
