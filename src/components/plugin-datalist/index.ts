import * as props from './select-plugin'
import { SelectComponent } from './Select'
import { createPlugin } from 'leva/plugin'

export * from './Select'

export const shitPlugin = createPlugin({
  component: SelectComponent,
  ...props,
})

// leva is great until its not. The plugin system is DEFINITELY NOT GREAT
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (stupid: any) => shitPlugin({ value: stupid } as never)
