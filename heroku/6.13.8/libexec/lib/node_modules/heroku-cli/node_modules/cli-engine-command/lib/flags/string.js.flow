// @flow

import {merge, type Flag} from '.'

type Options = $Shape<Flag<string>>

export default function StringFlag (options: Options = {}): Flag<string> {
  const required = options.optional === false || options.required
  const defaultOptions: Options = {
    parse: (input, cmd, name) => {
      let value = input
      if (!value && options.default) value = options.default
      if (!value && required) throw new RequiredFlagError(name)
      return input
    }
  }
  return merge(defaultOptions, options)
}

export class RequiredFlagError extends Error {
  constructor (name: string) {
    super(`Missing required flag --${name}`)
  }
}
