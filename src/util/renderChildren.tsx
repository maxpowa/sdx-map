import { POI } from '../components/PointofInterest'
import { Zone } from '../components/Zone'
import { GPSList, GPSPoint, GPSZone } from './gps'

export function renderSystemChildren(data: GPSList) {
  return data.map((each: GPSPoint) => {
    if (GPSZone.isZone(each)) {
      return <Zone zone={each} key={each.name} />
    }
    return <POI poi={each} key={each.name} />
  })
}
