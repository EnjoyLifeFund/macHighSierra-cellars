// @flow

import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import uuidV4 from 'uuid/v4'
import { type UserConfig } from './user_config'

type S3 = {
  host?: string,
  bucket?: string
}

type CLI = {
  dirname?: string,
  defaultCommand?: string,
  bin?: string,
  namespaces?: ?(?string)[],
  s3?: S3,
  plugins?: string[]
}

export type PJSON = {
  name?: ?string,
  version?: ?string,
  dependencies?: ?{ [name: string]: string },
  'cli-engine'?: ?CLI
}

export type Config = {
  name: string, // name of CLI
  dirname: string, // name of CLI directory
  bin: string, // name of binary
  namespaces: ?(?string)[], // names of permitted plugin namespaces
  s3: S3, // S3 config
  root: string, // root of CLI
  home: string, // user home directory
  pjson: PJSON, // parsed CLI package.json
  updateDisabled: ?string, // CLI updates are disabled
  defaultCommand: string, // default command if no args passed (usually help)
  channel: string, // CLI channel for updates
  version: string, // CLI version
  debug: number, // debugging level
  dataDir: string, // directory for storing CLI data
  cacheDir: string, // directory for storing temporary CLI data
  configDir: string, // directory for storing CLI config
  arch: string, // CPU architecture
  platform: string, // operating system
  windows: boolean, // is windows OS
  _version: '1', // config schema version
  skipAnalytics: boolean, // skip processing of analytics
  install: ?string, // generated uuid of this install
  userAgent: string, // user agent for API calls
  shell: string // the shell in which the command is run
}

export type ConfigOptions = $Shape<Config>

function dir (config: ConfigOptions, category: string, d: ?string): string {
  d = d || path.join(config.home, category === 'data' ? '.local/share' : '.' + category)
  if (config.windows) d = process.env.LOCALAPPDATA || d
  d = process.env.XDG_DATA_HOME || d
  d = path.join(d, config.dirname)
  fs.mkdirpSync(d)
  return d
}

function debug (bin: string) {
  const DEBUG = process.env[envVarKey(bin, 'DEBUG')]
  if (DEBUG === 'true') return 1
  if (DEBUG) return parseInt(DEBUG)
  return 0
}

function envVarKey (...parts: string[]) {
  return parts.map(p => p.replace('-', '_')).join('_').toUpperCase()
}

function envVarTrue (k: string): boolean {
  let v = process.env[k]
  return v === '1' || v === 'true'
}

function skipAnalytics (bin: string, userConfig: UserConfig) {
  if (userConfig && userConfig.skipAnalytics) {
    return true
  } else if (envVarTrue('TESTING') || envVarTrue(envVarKey(bin, 'SKIP_ANALYTICS'))) {
    return true
  }
  return false
}

let loadUserConfig = function (configDir: string, configOptions: ConfigOptions) {
  let config: UserConfig
  let configPath = path.join(configDir, 'config.json')
  try {
    config = fs.readJSONSync(configPath)
  } catch (e) {
    if (e.code === 'ENOENT') {
      config = {skipAnalytics: undefined, install: undefined}
    } else {
      throw e
    }
  }

  if (config && config.skipAnalytics) {
    config.install = null
  } else if (config && config.install === undefined && configOptions.install === undefined) {
    config.install = uuidV4()
    try {
      fs.writeJSONSync(configPath, config)
    } catch (e) {
      config.install = null
    }
  }

  return config
}

function shell (onWindows: boolean = false): string {
  let shellPath
  if (process.env['SHELL']) {
    shellPath = process.env['SHELL'].split(`/`)
  } else if (onWindows && process.env['COMSPEC']) {
    shellPath = process.env['COMSPEC'].split(/\\|\//)
  } else {
    shellPath = ['unknown']
  }
  return shellPath[shellPath.length - 1]
}

export function buildConfig (options: ConfigOptions = {}): Config {
  if (options._version) return options
  const pjson = options.pjson || {}
  const cli: CLI = pjson['cli-engine'] || {}
  const name = options.name || pjson.name || 'cli-engine'
  const defaults: ConfigOptions = {
    pjson,
    name,
    namespaces: cli.namespaces,
    dirname: cli.dirname || name,
    version: pjson.version || '0.0.0',
    channel: 'stable',
    home: os.homedir() || os.tmpdir(),
    debug: debug(cli.bin || 'cli-engine') || 0,
    s3: cli.s3 || {},
    root: path.join(__dirname, '..'),
    platform: os.platform(),
    arch: os.arch() === 'ia32' ? 'x86' : os.arch(),
    bin: cli.bin || 'cli-engine',
    defaultCommand: cli.defaultCommand || 'help',
    skipAnalytics: undefined,
    shell: undefined
  }
  const config: ConfigOptions = Object.assign(defaults, options)
  if (config.platform === 'win32') config.platform = 'windows'
  config.windows = config.platform === 'windows'
  config.shell = shell(config.windows)
  config.dataDir = config.dataDir || dir(config, 'data')
  config.configDir = config.configDir || dir(config, 'config')
  let defaultCacheDir = process.platform === 'darwin' ? path.join(config.home, 'Library', 'Caches') : null
  config.cacheDir = config.cacheDir || dir(config, 'cache', defaultCacheDir)
  config._version = '1'
  let channel = config.channel === 'stable' ? '' : ` ${config.channel}`
  config.userAgent = `${config.name}/${config.version}${channel} (${config.platform}-${config.arch}) node-${process.version}`
  let userConfig = loadUserConfig(config.configDir, options)
  if (config.skipAnalytics === undefined) {
    config.skipAnalytics = skipAnalytics(config.bin, userConfig)
  }
  if (config.install === undefined && userConfig) {
    config.install = userConfig.install
  }
  return config
}

export interface IRunOptions {
  argv?: string[],
  config?: ConfigOptions
}

export interface ICommand {
  +topic: string,
  +command: ?string,
  +description: ?string,
  +hidden: ?boolean,
  +usage: ?string,
  +help: ?string,
  +aliases: string[],
  +_version: string,
  +id: string,
  +run: (options: $Shape<IRunOptions>) => Promise<any>
}
