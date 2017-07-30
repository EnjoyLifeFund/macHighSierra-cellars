// @flow

import type {Flag} from '.'
import {RequiredFlagError} from './string'

type Options = $Shape<Flag<number>>

export default function NumberFlag (options: Options = {}): Flag<number> {
  const required = options.optional === false || options.required
  const defaultOptions: Options = {
    parse: (input, cmd, name) => {
      let value = input
      if (!value && options.default) return options.default()
      if (!value && required) throw new RequiredFlagError(name)
      if (value) return parseInt(input)
    }
  }
  return Object.assign(defaultOptions, options)
}
