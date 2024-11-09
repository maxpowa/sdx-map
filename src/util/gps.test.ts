import { describe, it, expect } from 'vitest'
import {
  GPSList,
  GPSPoint,
  GPSBody,
  GPSZone,
  computeShortestRoute,
} from './gps'
import { Vector3 } from 'three'
import { DraconisExpanseSystem } from '../data/sdx'

describe('GPS module', () => {
  it('should parse basic GPS data', () => {
    const gps = 'GPS:Hello World:15:-15:0:#40EC34:'
    const result = GPSPoint.fromString(gps)
    expect(result).toEqual({
      name: 'Hello World',
      x: 15,
      y: -15,
      z: 0,
      color: '#40EC34',
      class: 'poi',
    })
  })

  it('should parse GPS data with radius', () => {
    const gps = 'GPS:Hello World - (R:10km):15:-15:0:#40EC34:'
    const result = GPSZone.fromString(gps)
    expect(result).toEqual({
      name: 'Hello World - (R:10km)',
      x: 15,
      y: -15,
      z: 0,
      color: '#40EC34',
      class: 'zone',
      radius: 10000,
      children: {
        list: [],
        zoneCount: 0,
      },
    })
  })

  it('should parse GPS data with radius and category-based color', () => {
    const gps = 'GPS:Hello World - (R:10km):15:-15:0:#40EC34:DX2:'
    const result = GPSZone.fromString(gps)
    expect(result).toEqual({
      name: 'Hello World - (R:10km)',
      x: 15,
      y: -15,
      z: 0,
      category: 'DX2',
      color: '#FF8C00',
      class: 'zone',
      radius: 10000,
      children: {
        list: [],
        zoneCount: 0,
      },
    })
  })

  it('should parse GPS data with known body', () => {
    const gps = 'GPS:Earth:15:-15:0:#40EC34:'
    const result = GPSBody.fromString(gps)
    expect(result).toEqual({
      name: 'Earth',
      x: 15,
      y: -15,
      z: 0,
      category: undefined,
      color: '#40EC34',
      class: 'body',
      radius: 100000,
    })
  })

  it('should be reasonably robust against colons in GPS names', () => {
    const gps = 'GPS:Hello:World:15:-15:0:#40EC34:'
    const result = GPSPoint.fromString(gps)
    expect(result).toEqual({
      category: undefined,
      class: 'poi',
      color: '#40EC34',
      name: 'Hello:World',
      x: 15,
      y: -15,
      z: 0,
    })
  })

  it('should throw an error for invalid GPS data', () => {
    const gps = 'GPS:Hell:o:World:1::5:-:1:::5:0:#FF40:EC34'
    expect(() => GPSPoint.fromString(gps)).toThrowError(
      'Failed to parse GPS, invalid format.',
    )
  })

  it('should export basic GPS data to string', () => {
    const gps = 'GPS:Hello World:15:-15:0:#FF40EC34:'
    const result = GPSPoint.fromString(gps).toString()
    expect(result).toEqual(gps)
  })

  it('should parse GPS list data', () => {
    const gps = `GPS:Hello World:15:-15:0:#40EC34:\nGPS:Goodbye World:-15:15:0:#40EC34:`
    const result = GPSList.fromString(gps)
    expect(result).toEqual({
      list: [
        {
          name: 'Hello World',
          x: 15,
          y: -15,
          z: 0,
          color: '#40EC34',
          class: 'poi',
        },
        {
          name: 'Goodbye World',
          x: -15,
          y: 15,
          z: 0,
          color: '#40EC34',
          class: 'poi',
        },
      ],
      zoneCount: 0,
    })
  })

  it('should export GPS list data to string', () => {
    const gps = `GPS:Hello World:15:-15:0:#FF40EC34:\nGPS:Goodbye World:-15:15:0:#FF40EC34:`
    const result = GPSList.fromString(gps).toString()
    expect(result).toEqual(gps)
  })

  it('should calculate distances between GPS points', () => {
    const pointA = new GPSPoint(0, 0, 0, 'poi', 'A', '#FFFFFF')
    const pointB = new GPSPoint(3, 4, 0, 'poi', 'B', '#FFFFFF')
    const result = pointA.distanceTo(pointB)
    expect(result).toEqual(5)
  })

  it('should calculate distances between GPS points with different z values', () => {
    const pointA = new GPSPoint(0, 0, 0, 'poi', 'A', '#FFFFFF')
    const pointB = new GPSPoint(3, 4, 5, 'poi', 'B', '#FFFFFF')
    const result = pointA.distanceTo(pointB)
    expect(result).toEqual(7.0710678118654755)
  })

  it('should calculate the shortest vector to the edge of a zone', () => {
    const zone = new GPSZone(2, 10, 7, 'A', '#FFFFFF', 10000)
    const point = new GPSPoint(0, 500, 0, 'poi', 'B', '#FFFFFF')
    expect(point.distanceTo(zone)).toEqual(490.05407864846916)
    const result = zone.vectorToEdge(point)
    expect(result).toEqual(
      new Vector3(-38.811822350623906, 10008.896475902857, -135.8413782271837),
    )
  })
})

describe('Route Planner', () => {
  it('should calculate the optimal route between two points with an obstacle', () => {
    const world = GPSList.fromString(`
      GPS:Deimos:900000:-800000:0:#40EC34:
      GPS:Phobos:650000:-650000:-250000:#40EC34:
      GPS:Mars:750000:-750000:-80000:#40EC34:
      GPS:Mars - (R:400km):750000:-750000:-80000:#FFFFFF00:DX3:
    `)
    const deimos = world.pois(false, true)[0]
    const phobos = world.pois(false, true)[1]
    const result = computeShortestRoute(deimos, phobos, world)
    expect(result).toMatchSnapshot()
  })

  it('should calculate a complex route', () => {
    const globalData = DraconisExpanseSystem['Sol']
    const deimos = globalData
      .pois(false, true)
      .find((body) => body.name === 'Deimos') as GPSPoint
    const ariel = globalData
      .pois(false, true)
      .find((body) => body.name === 'Ariel') as GPSPoint

    const route = computeShortestRoute(deimos, ariel, globalData)
    expect(route).toMatchSnapshot()
  })
})
