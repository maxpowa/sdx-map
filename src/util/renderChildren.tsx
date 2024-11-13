import { POI } from '../components/PointofInterest'
import { Zone } from '../components/Zone'
import { GPSSystem, GPSPoint, GPSZone } from './gps'

export function renderSystemChildren(
  data: GPSSystem | GPSZone,
  withTurns: boolean,
  withHighSpeed: boolean,
) {
  return (
    <>
      {[...data.pois(), ...data.turns()].map((each: GPSPoint) => {
        return <POI poi={each} key={each.name} />
      })}
      {data.zones(true).map((each: GPSZone) => (
        <Zone
          zone={each}
          key={each.name}
          visible={!(each.isHighSpeed() && !withHighSpeed)}
          renderChildren={(data: GPSZone) => {
            return renderSystemChildren(data, withTurns, withHighSpeed)
          }}
        />
      ))}
    </>
  )
}
