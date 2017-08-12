// @flow

import type Output from './output'
import type Command from './command'

export default class Topic {
  constructor (commands: Class<Command<*>>[], out: Output) {
    this.out = out
    this.commands = commands
  }

  static namespace: ?string
  static topic: string
  static description: ?string
  static hidden = false

  commands: Class<Command<*>>[]
  out: Output

  static get id (): string {
    return this.namespace ? `${this.namespace}:${this.topic}` : this.topic
  }
}
