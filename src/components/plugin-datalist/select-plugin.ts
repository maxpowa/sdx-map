import type { SelectInput, InternalSelectSettings } from './select-types'

export const sanitize = (value: any, _settings: InternalSelectSettings) => {
  return value
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const format = (value: any, _settings: InternalSelectSettings) => {
  return value
}

export const normalize = (input: SelectInput) => {
  const { value, options } = input
  return { value, settings: { options } }
}
