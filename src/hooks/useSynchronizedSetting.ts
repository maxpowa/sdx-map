import { useControls } from 'leva'
import { useEffect } from 'react'

export const getParams = () => {
  const urlHash = window.location.hash.replace('#', '')
  return new URLSearchParams(urlHash)
}

export function useSynchronizedPicklistSetting<T>(
  setting: string,
  options: T[],
  validator?: (input?: string) => T | undefined,
  toString: (input: T) => string = (input: T) => String(input),
) {
  const params = getParams()

  validator =
    validator ??
    ((input?: string) => {
      if (!input) return
      return options.find(
        (opt) =>
          toString(opt).toLocaleLowerCase() === input?.toLocaleLowerCase(),
      )
    })

  let value
  if (params.has(setting)) {
    value = validator(params.get(setting) as string)
  }
  if (!value) {
    if (localStorage.getItem(setting)) {
      value = validator(localStorage.getItem(setting) as string)
    }
    if (!value) {
      value = options[0]
    }
  }

  const { [setting]: controlValue } = useControls(
    {
      [setting]: {
        value: value,
        options: options,
      },
    },
    [options, value],
  ) as { [paramName: string]: T }

  useEffect(() => {
    if (controlValue !== value) {
      localStorage.setItem(setting, toString(controlValue))
      const params = getParams()
      params.set(setting, toString(controlValue))
      window.location.hash = params.toString()
    }
  }, [controlValue, setting, toString, value])

  return controlValue
}
