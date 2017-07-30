// @flow

import type Output from './output'

export type Arg = {
  name: string,
  description?: string,
  required?: boolean,
  optional?: boolean,
  hidden?: boolean,
  completion?: ?{
    cacheDuration?: ?number,
    cacheKey?: ?string,
    options: (Output) => Promise<string[]>
  }
}
