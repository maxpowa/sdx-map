import { useControls, button, buttonGroup, folder } from 'leva'
import { useMemo, useEffect, useState } from 'react'
import { DraconisExpanseSystem } from '../data/sdx'
import { getParams } from './useSynchronizedSetting'
import { GPSPoint, GPSPointOfInterest, GPSSystem } from '../util/gps'

export function getGPSValue(key: string) {
  const params = getParams()
  let value
  if (params.has(key)) {
    value = GPSPoint.fromString(params.get(key) as string)
  }
  return value
}

export function useSystemWithUserPoints(
  system: keyof typeof DraconisExpanseSystem,
) {
  const [userPoints, setUserPoints] = useState<GPSPoint[]>([])

  useEffect(() => {
    const storedData = localStorage.getItem(`${system}-userData`)
    if (storedData) {
      const points = storedData
        .split('\n')
        .map((each) => {
          try {
            return GPSPoint.fromString(each)
          } catch (e) {
            console.error(e)
            return null
          }
        })
        .filter((each) => !!each)
      setUserPoints(points)
    }
  }, [system])

  const [{ Points }, set] = useControls(
    'GPS Manager',
    () => ({
      'Create new GPS': folder(
        {
          mode: {
            label: 'Mode',
            options: ['Advanced', 'Simple'],
          },
          Name: {
            value: '',
            render: (get) =>
              get('GPS Manager.Create new GPS.mode') === 'Simple',
          },
          Position: {
            value: { x: 0, y: 0, z: 0 },
            render: (get) =>
              get('GPS Manager.Create new GPS.mode') === 'Simple',
          },
          Color: {
            value: '#FFFFFF',
            render: (get) =>
              get('GPS Manager.Create new GPS.mode') === 'Simple',
          },
          Data: {
            value: '',
            rows: true,
            render: (get) =>
              get('GPS Manager.Create new GPS.mode') === 'Advanced',
          },
          Add: button((get) => {
            const mode = get('GPS Manager.Create new GPS.mode')
            if (mode === 'Simple') {
              const name = get('GPS Manager.Create new GPS.Name')
              if (name) {
                const coords = get('GPS Manager.Create new GPS.Position')
                const color = get('GPS Manager.Create new GPS.Color')
                const point = new GPSPoint(
                  coords.x,
                  coords.y,
                  coords.z,
                  name,
                  color,
                )
                setUserPoints([
                  ...userPoints.filter((each) => each.name !== point.name),
                  point,
                ])
                localStorage.setItem(
                  `${system}-userData`,
                  Object.values(userPoints).join('\n'),
                )
              } else {
                alert('Name is required')
              }
            } else {
              const data = get('GPS Manager.Create new GPS.Data')
              const newPoints = data
                .split('\n')
                .map((each: string): GPSPoint | null => {
                  try {
                    return GPSPoint.fromString(each)
                  } catch (e) {
                    console.error(e)
                    return null
                  }
                })
                .filter((each: GPSPoint | null): boolean => !!each)
              setUserPoints([
                ...userPoints.filter(
                  (each) =>
                    !!newPoints.find(
                      (point: GPSPointOfInterest) => each.name !== point.name,
                    ),
                ),
                ...newPoints,
              ])
              localStorage.setItem(
                `${system}-userData`,
                Object.values(userPoints).join('\n'),
              )
            }
          }),
        },
        { collapsed: true },
      ),
      Points: {
        options: ['--', ...userPoints.map((point) => point.name)],
      },
      ' ': buttonGroup({
        'Delete All': () => {
          userPoints.forEach((point) => point.remove())
          setUserPoints([])
          localStorage.removeItem(`${system}-userData`)
        },
        'Copy All': () => {
          navigator.clipboard.writeText(userPoints.join('\n'))
        },
        Copy: (get) => {
          navigator.clipboard.writeText(
            get('GPS Manager.Points').value.toString(),
          )
        },
        Delete: (get) => {
          const newPoints = userPoints.filter(
            (point) => point.name !== get('GPS Manager.Points'),
          )
          setUserPoints(newPoints)
          set({
            Points: newPoints[0]?.name ?? '',
          })
          localStorage.setItem(`${system}-userData`, newPoints.join('\n'))
        },
      }),
    }),
    { collapsed: true },
    [system, userPoints.join('\n'), setUserPoints],
  )

  useEffect(() => {
    if (!Points && userPoints[0]) {
      set({
        Points: userPoints[0].name,
      })
    }
  }, [userPoints, set, Points])

  const systemData = useMemo(() => {
    const data = DraconisExpanseSystem[system].clone()
    data.name = system
    data.push(...userPoints)
    return data
  }, [system, userPoints])

  return systemData
}

export function getGPSList(key: string) {
  const params = getParams()
  let value = new GPSSystem()
  if (params.has(key)) {
    value = GPSSystem.fromString(params.getAll(key).join('\n'))
  }
  return value
}

export function useSystemData(system: keyof typeof DraconisExpanseSystem) {
  const systemData = useSystemWithUserPoints(system)

  return systemData
}
