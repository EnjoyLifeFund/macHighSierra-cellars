// @flow

import util from 'util'
import httpCall, {type HTTPRequestOptions} from 'http-call'
import type Output from './output'
import {buildConfig, type Config, type ConfigOptions} from 'cli-engine-config'

function mergeRequestOptions (...options: $Shape<HTTPRequestOptions>[]): HTTPRequestOptions {
  let output: HTTPRequestOptions = {method: 'GET', headers: {}}
  for (let o of options) {
    let headers = Object.assign(output.headers, o.headers)
    Object.assign(output, o)
    output.headers = headers
  }
  return output
}

function renderHeaders (headers: {[key: string]: string}) {
  return Object.keys(headers).map(key => {
    let value = key.toUpperCase() === 'AUTHORIZATION' ? 'REDACTED' : headers[key]
    return '    ' + key + '=' + value
  }).join('\n')
}

export default class HTTP {
  out: Output
  config: Config
  http: Class<httpCall>
  requestOptions: HTTPRequestOptions

  constructor (output: Output, config: ?ConfigOptions) {
    let self = this
    this.out = output
    this.config = buildConfig(config || this.out.config)
    this.requestOptions = mergeRequestOptions({
      headers: {
        'user-agent': `${this.config.name}/${this.config.version} (${this.config.platform}-${this.config.arch}) node-${process.version}`
      }
    })
    this.http = class extends httpCall {
      async _request (...args) {
        self._logRequest(this)
        await super._request(...args)
        self._logResponse(this)
      }
    }
  }

  get (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.get(url, options)
  }

  post (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.post(url, options)
  }

  put (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.put(url, options)
  }

  patch (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.patch(url, options)
  }

  delete (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.delete(url, options)
  }

  stream (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.stream(url, options)
  }

  request (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options = mergeRequestOptions(this.requestOptions, options)
    return this.http.request(url, options)
  }

  get _debugHeaders (): boolean {
    if (this.out.config.debug > 1) return true
    const HEROKU_DEBUG_HEADERS = process.env.HEROKU_DEBUG_HEADERS
    return HEROKU_DEBUG_HEADERS === 'true' || HEROKU_DEBUG_HEADERS === '1'
  }

  _logRequest (http: httpCall) {
    if (!this.out.config.debug) return
    this.out.stderr.log(`--> ${http.method} ${http.url}`)
    if (this._debugHeaders) {
      this.out.stderr.log(renderHeaders(http.headers))
    }
    // TODO: conditionally add displaying of POST body
    // if (body) this.error(`--- BODY\n${util.inspect(body)}\n---`)
  }

  _logResponse (http: httpCall) {
    if (!this.out.config.debug) return
    this.out.stderr.log(`<-- ${http.method} ${http.url} ${http.response.statusCode}`)
    if (this.out.config.debug > 1) {
      this.out.stderr.log(renderHeaders(http.response.headers))
      if (http.body) this.out.stderr.log(`--- BODY\n${util.inspect(http.body)}\n---`)
    }
  }
}
