import { describe, it, expect } from 'vitest'
import { GPSList, GPSPoint, GPSBody, GPSZone } from './gps'

describe('GPS module', () => {
  it('should parse basic GPS data', () => {
    const gps = 'GPS:Hello World:15:-15:0:#FF40EC34:'
    const result = GPSPoint.fromString(gps)
    expect(result).toEqual({
      name: 'Hello World',
      x: 15,
      y: -15,
      z: 0,
      color: '#FF40EC34',
      class: 'poi',
    })
  })

  it('should parse GPS data with radius', () => {
    const gps = 'GPS:Hello World - (R:10km):15:-15:0:#FF40EC34:'
    const result = GPSZone.fromString(gps)
    expect(result).toEqual({
      name: 'Hello World - (R:10km)',
      x: 15,
      y: -15,
      z: 0,
      color: '#FF40EC34',
      class: 'zone',
      radius: 10000,
      children: {
        list: [],
        zoneCount: 0,
      },
    })
  })

  it('should parse GPS data with radius and category-based color', () => {
    const gps = 'GPS:Hello World - (R:10km):15:-15:0:#FF40EC34:DX2:'
    const result = GPSZone.fromString(gps)
    expect(result).toEqual({
      name: 'Hello World - (R:10km)',
      x: 15,
      y: -15,
      z: 0,
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
    const gps = 'GPS:Earth:15:-15:0:#FF40EC34:'
    const result = GPSBody.fromString(gps)
    expect(result).toEqual({
      name: 'Earth',
      x: 15,
      y: -15,
      z: 0,
      category: undefined,
      color: '#FF40EC34',
      class: 'body',
      radius: 100000,
    })
  })

  it('should be reasonably robust against colons in GPS names', () => {
    const gps = 'GPS:Hello:World:15:-15:0:#FF40EC34:'
    const result = GPSPoint.fromString(gps)
    expect(result).toEqual({
      category: undefined,
      class: 'poi',
      color: '#FF40EC34',
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
    const gps = `GPS:Hello World:15:-15:0:#FF40EC34:\nGPS:Goodbye World:-15:15:0:#FF40EC34:`
    const result = GPSList.fromString(gps)
    expect(result).toEqual({
      list: [
        {
          name: 'Hello World',
          x: 15,
          y: -15,
          z: 0,
          color: '#FF40EC34',
          class: 'poi',
        },
        {
          name: 'Goodbye World',
          x: -15,
          y: 15,
          z: 0,
          color: '#FF40EC34',
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
})
