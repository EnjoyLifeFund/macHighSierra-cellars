// @flow

import Output from './output'
import Parser, {type OutputFlags, type OutputArgs, type InputFlags} from './parser' // eslint-disable-line
import pjson from '../package.json'
import {buildConfig, type Config, type ConfigOptions} from 'cli-engine-config'
import type {Arg} from './arg'
import HTTP from 'http-call'
import Help from './help'

export default class Command <Flags: InputFlags> {
  static topic: string
  static command: ?string
  static description: ?string
  static hidden: ?boolean
  static usage: ?string
  static help: ?string
  static aliases: string[] = []
  static variableArgs = false
  static flags: Flags
  static args: Arg[] = []
  static _version = pjson.version

  static get id (): string {
    let cmd = this.command ? `${this.topic}:${this.command}` : this.topic
    return cmd
  }

  /**
   * instantiate and run the command setting {mock: true} in the config (shorthand method)
   */
  static async mock (...argv: string[]): Promise<this> {
    argv.unshift('argv0', 'cmd')
    return this.run({argv, mock: true})
  }

  /**
   * instantiate and run the command
   */
  static async run (config: ?ConfigOptions): Promise<this> {
    const cmd = new this({config})
    try {
      await cmd.init()
      await cmd.run()
      await cmd.out.done()
    } catch (err) {
      cmd.out.error(err)
    }
    return cmd
  }

  config: Config
  http: Class<HTTP>
  out: Output
  flags: OutputFlags = {}
  argv: string[]
  args: {[name: string]: string} = {}

  constructor (options: {config?: ConfigOptions} = {}) {
    this.config = buildConfig(options.config)
    this.argv = this.config.argv
    this.out = new Output(this.config)
    this.http = HTTP.defaults({
      headers: {
        'user-agent': `${this.config.name}/${this.config.version} (${this.config.platform}-${this.config.arch}) node-${process.version}`
      }
    })
  }

  async init () {
    const parser = new Parser({
      flags: this.constructor.flags || {},
      args: this.constructor.args || [],
      variableArgs: this.constructor.variableArgs,
      cmd: this
    })
    const {argv, flags, args} = await parser.parse({flags: this.flags, argv: this.argv.slice(2)})
    this.flags = flags
    this.argv = argv
    this.args = args
  }

  // prevent setting things that need to be static
  topic: null
  command: null
  description: null
  hidden: null
  usage: null
  help: null
  aliases: null

  /**
   * actual command run code goes here
   */
  async run (...rest: void[]): Promise<void> { }

  get stdout (): string {
    return this.out.stdout.output
  }

  get stderr (): string {
    return this.out.stderr.output
  }

  static buildHelp (config: Config): string {
    let help = new Help(config)
    return help.command(this)
  }

  static buildHelpLine (config: Config): [string, ?string] {
    let help = new Help(config)
    return help.commandLine(this)
  }
}
