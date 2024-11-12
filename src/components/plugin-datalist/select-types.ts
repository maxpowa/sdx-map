import { LevaInputProps } from 'leva/plugin'

export type SelectSettings<U = unknown> = { options: U[] }
export type InternalSelectSettings = { options: any[] }

export type SelectInput<P = unknown, U = unknown> = {
  value?: P
} & SelectSettings<U>

export type SelectProps = LevaInputProps<any, InternalSelectSettings, number>
