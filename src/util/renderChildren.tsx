import { POI } from '../components/PointofInterest'
import { Zone } from '../components/Zone'
import { GPSList, GPSPoint, GPSZone } from './gps'

export function renderSystemChildren(
  data: GPSList,
  withTurns: boolean,
  withHighSpeed: boolean,
) {
  return (
    <>
      {data.pois(withTurns).map((each: GPSPoint) => {
        return <POI poi={each} key={each.name} />
      })}
      {data.zones(withHighSpeed).map((each: GPSZone) => (
        <Zone
          zone={each}
          key={each.name}
          renderChildren={(data: GPSList) => {
            return renderSystemChildren(data, withTurns, withHighSpeed)
          }}
        />
      ))}
    </>
  )
}
