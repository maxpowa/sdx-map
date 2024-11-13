import { GPSSystem } from '../util/gps'

export const DraconisExpanseSystem = {
  // This GPS list is exported from ingame, using a combination of `!nexus getsectors true` and `!gps` commands.
  // Then run through `parseGPSList` to convert it to a format that can be used here.
  // Some manual tweaks are made as well, marking zone speed limits (by specifying instance names)
  Sol: GPSSystem.fromString(`
    GPS:Ariel:-4110989.31:3110909.45:-359192.17:#FF40EC34:
    GPS:Beratnas Gas Station Jupiter:-119500.8:-2955103.11:351258.18:#FFD6931E:
    GPS:Beratnas Gas Station Saturn:2290226.37:1817047.82:-195774.09:#FFD6931E:
    GPS:Beratnas Gas Station Uranus:-4106322.64:3003556.83:-69235.74:#FFD6931E:
    GPS:Bush Naval Shipyards:-860377.39:251612.55:58803.99:#FF75C9F1:Nation HQs:
    GPS:C1 - (R:300km):600000:1600000:0:#FFFFFF00:DX7:
    GPS:C2 - (R:300km):-600000:1600000:0:#FFFFFF00:DX7:
    GPS:Ceres - (R:400km):0:2350000:100000:#FFFFFF00:DX7:
    GPS:Ceres Station:-9793.86:2325984.53:84772.28:#FFD6931E:
    GPS:Ceres:0:2350000:100000:#FFD6931E:
    GPS:Corley Station:3001481.29:1908187.5:-105165.49:#FFD6931E:
    GPS:Deimos:900000:-800000:0:#FF40EC34:
    GPS:E1 - (R:300km):-1725000:0:0:#FFFFFF00:DX4:
    GPS:E2 - (R:300km):-1500000:-900000:0:#FFFFFF00:DX4:
    GPS:Earth - (R:400km):-800000:100000:80000:#FFFFFF00:DX4:
    GPS:Earth:-800000:100000:80000:#FF40EC34:
    GPS:Europa KOTH:404015.47:-3195511.14:108837.6:#FFD6931E:
    GPS:Europa:400000:-3200000:100000:#FF40EC34:
    GPS:Far Gate Zone - (R:80km):-9999999:-9999999:9999999:#FFFFFF00:DX6:
    GPS:Ganymede Botanical:-404041.3:-3093957.08:-285675.6:#FFD6931E:
    GPS:Ganymede:-400000:-3100000:-300000:#FF40EC34:
    GPS:Greek Cluster - (R:400km):-1600000:-2700000:-334490:#FFFFFF00:DX2:
    GPS:Greek Cluster Waystation:-1380846.75:-2582155.58:-302303.08:#FFD6931E:
    GPS:Inner High Speed Zone - (R:2750km):0:-1725000:100000:#FFFFFF00:DX5:
    GPS:Io:200000:-2900000:-100000:#FF40EC34:
    GPS:Jupiter - (R:750km):0:-3200000:0:#FFFFFF00:DX6:
    GPS:Jupiter:0:-3200000:0:#FF40EC34:
    GPS:Kirino Orbital Shipyards:827693.09:-813745.92:-77878.79:#FFF1C875:Nation HQs:
    GPS:Luna:-650000:225000:0:#FF40EC34:
    GPS:M1 - (R:300km):800000:-1550000:0:#FFFFFF00:DX3:
    GPS:M2 - (R:300km):1550000:-800000:0:#FFFFFF00:DX3:
    GPS:Mars - (R:400km):750000:-750000:-80000:#FFFFFF00:DX3:
    GPS:Mars:750000:-750000:-80000:#FF40EC34:
    GPS:MCRN Free Rebel Fleet:3200000:2250000:35000:#FFD6931E:
    GPS:Miller Mobile Construction Barge:-9605.07:2310850.71:122318.61:#FFF17575:Nation HQs:
    GPS:P1 - (R:300km):-800000:-1550000:0:#FFFFFF00:DX2:
    GPS:Pallas - (R:300km):0:-1725000:100000:#FFFFFF00:DX2:
    GPS:Pallas:0:-1725000:100000:#FFFFFF00:
    GPS:Pallas Station:-3296:-1727232:76613:#FFD6931E:
    GPS:Phobos:650000:-650000:-250000:#FF40EC34:
    GPS:Rhea:2700000:1800000:100000:#FF40EC34:
    GPS:Saturn - (R:750km):2800000:2000000:-100000:#FFFFFF00:DX8:
    GPS:Saturn:2800000:2000000:-100000:#FF40EC34:
    GPS:Scrap Yard:2750000:2435000:130000:#FFD6931E:
    GPS:Sol Gate - (R:80km):-3900000:3600000:-200000:#FFFFFF00:DX6:
    GPS:Sol Gate:-3900000:3600000:-200000:#FFFFFF00:
    GPS:T1 - (R:300km):1725000:0:0:#FFFFFF00:DX2:
    GPS:Titan:3000000:1900000:-100000:#FF40EC34:
    GPS:Trojan Cluster - (R:400km):1600000:-2700000:445350:#FFFFFF00:DX2:
    GPS:Trojan Cluster Waystation:1420788.01:-2531349.34:404487.57:#FFD6931E:
    GPS:Tycho - (R:300km):1400000:1000000:-50000:#FFFFFF00:DX2:
    GPS:Tycho Hub:1400000:1000000:-50000:#FFD6931E:
    GPS:Uranus - (R:500km):-4200000:3000000:-250000:#FFFFFF00:DX6:
    GPS:Uranus:-4200000:3000000:-250000:#FF40EC34:
    GPS:Vesta - (R:300km):-1400000:1000000:-50000:#FFFFFF00:DX2:
    GPS:Vesta Station:-1412860:986040:-49577:#FFD6931E:
    GPS:Vesta:-1400000:1000000:-50000:#FFD6931E:
  `),
  Kronos: GPSSystem.fromString(`
    GPS:Kronos Gate:-35303:234184:198247:#FFD6931E:
    GPS:Kronos:-75000:86000:18000:#FF40EC34:
    GPS:Kronos 1:-224000:164000:-55000:#FF40EC34:
    GPS:Kronos Research Facility:-48000:29000:32000:#FFD6931E:
  `),
  Ilus: GPSSystem.fromString(`
    GPS:Ilus:69500:111150:58750:#FFB775F1:
    GPS:Ilus Gate:300146:375140:31503:#FFB775F1:
    GPS:Ilus 1:57500:318500:47900:#FF40EC34:
    GPS:Belter Colony:71459:149570:12666:#FFB775F1:
  `),
  Jannah: GPSSystem.fromString(`
    GPS:Alpha Berkut Station:600764.75:703346.87:500064.02:#FF40EC34:
    GPS:Port Jannah:422538.91:630064.11:135873.58:#FF40EC34:
    GPS:Jannah Gate:250000:340000:25000:#FFD6931E:
    GPS:JN1 Asteroid Cluster:600000:700000:600000:#FF40EC34:
    GPS:Jannah:600000:700000:100000:#FF40EC34:
  `),
  'Ring Space': GPSSystem.fromString(`
    GPS:Medina Station:15156.6:11584.25:2312.33:#FFF1A875:
    GPS:Sol Gate:-17:411:18:#FFF1A875:
    GPS:Ilus Gate:12349:28361:7116:#FFF1A875:
    GPS:Kronos Gate:32676:6550:1022:#FFF1A875:
  `),
}

// Transit points are used to define the possible destinations from a given system, for calculating inter-system travel times.
export const TransitPoints = {
  'Jannah Gate': ['Sol'],
  'Sol Gate': ['Ring Space', 'Sol'],
  'Ilus Gate': ['Ring Space', 'Ilus'],
  'Kronos Gate': ['Ring Space', 'Kronos'],
}
