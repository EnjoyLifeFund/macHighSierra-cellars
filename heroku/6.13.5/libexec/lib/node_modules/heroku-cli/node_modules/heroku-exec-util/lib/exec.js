'use strict'

const cli = require('heroku-cli-util')
const path = require('path');
const child = require('child_process');
const url = require('url');
const co = require('co');
const keypair = require('keypair');
const forge = require('node-forge');
const socks = require('socksv5');
const ssh = require('./ssh')
const wait = require('co-wait')
const Client = require('ssh2').Client;

function * checkStatus(context, heroku, configVars) {
  let dynos = yield heroku.request({path: `/apps/${context.app}/dynos`})

  var execUrl = _execUrl(context, configVars)

  return cli.got(`https://${execUrl.host}`, {
    auth: execUrl.auth,
    path: _execApiPath(configVars),
    headers: _execHeaders(),
    method: 'GET'
  }).then(response => {

    var reservations = JSON.parse(response.body);

    cli.styledHeader(`${context.app} Heroku Exec status`);

    if (reservations.length == 0) {
      cli.error("Heroku Exec is not running!")
      cli.error("Check dyno status with `heroku ps'")
    } else {

      var statuses = []

      for (var i in reservations) {
        var name = reservations[i]['dyno_name']
        var dyno = dynos.find(d => d.name === name)

        statuses.push({
          dyno_name: cli.color.white.bold(name),
          proxy_status: 'running',
          dyno_status: !dyno ? cli.color.red('missing!') : (dyno.state === 'up' ? cli.color.green(dyno.state) : cli.color.yellow(dyno.state))
        })
      }
      cli.table(statuses, {
        columns: [
          {key: 'dyno_name', label: 'Dyno'},
          {key: 'proxy_status', label: 'Proxy Status'},
          {key: 'dyno_status', label: 'Dyno Status'},
        ]
      });
    }
  }).catch(error => {
    cli.error(error);
  });;
}

function * initFeature(context, heroku, callback) {
  var buildpackUrl = "https://github.com/heroku/exec-buildpack"

  let buildpacks = yield heroku.request({
    path: `/apps/${context.app}/buildpack-installations`,
    headers: {Range: ''}
  });

  if (buildpacks.length === 0) {
    cli.error(`${context.app} has no Buildpack URL set. You must deploy your application first!`);
  } else {
    let configVars = yield heroku.get(`/apps/${context.app}/config-vars`)
    var addonUrl = configVars['HEROKU_EXEC_URL']
    if (addonUrl) {
      cli.error("It looks like you're using the Heroku Exec addon, which is no longer required\n" +
                "to use this feature. Please run the following command to remove the addon\n" +
                "and then try using Heroku Exec again:\n" +
                cli.color.magenta('  heroku addons:destroy heroku-exec'));
      cli.exit();
    } else {
      let feature = yield heroku.request({ path: `/apps/${context.app}/features/runtime-heroku-exec` });

      if (!feature.enabled) {
        yield cli.action('Initializing feature', co(function* () {
          yield heroku.request({
            method: 'PATCH',
            path: `/apps/${context.app}/features/runtime-heroku-exec`,
            body: {'enabled' : true}
          });
        }));

        if (_hasExecBuildpack(buildpacks, buildpackUrl)) {
          yield cli.action(`Restarting dynos`, co(function * () {
            yield wait(2000)
            yield heroku.request({method: 'DELETE', path: `/apps/${context.app}/dynos`});
          }))

          let dynoName = _dyno(context)
          let state = 'down'
          yield cli.action(`Waiting for ${cli.color.cyan(dynoName)} to start`, co(function * () {
            while (state != 'up') {
              yield wait(3000)
              let d = yield heroku.request({path: `/apps/${context.app}/dynos/${dynoName}`})
              state = d.state
              if (state === 'crashed') {
                throw new Error(`The dyno crashed`)
              }
            }
          }))
        }
      }

      if (_hasExecBuildpack(buildpacks, buildpackUrl)) {
        yield callback(configVars);
      } else {
        cli.log(`Adding the Heroku Exec buildpack to ${context.app}`)
        child.execSync(`heroku buildpacks:add -i 1 ${buildpackUrl} -a ${context.app}`)
        cli.log('');
        cli.log('Run the following commands to redeploy your app, then Heroku Exec will be ready to use:');
        cli.log(cli.color.magenta('  git commit -m "Heroku Exec initialization" --allow-empty'));
        cli.log(cli.color.magenta('  git push heroku master'));
      }
    }
  }
}

function updateClientKey(context, heroku, configVars, callback) {
  return cli.action("Establishing credentials", {success: false}, co(function* () {
    var key = keypair();
    var privkeypem = key.private;
    var publicKey = forge.pki.publicKeyFromPem(key.public);
    var pubkeypem = forge.ssh.publicKeyToOpenSSH(publicKey, '');
    cli.hush(pubkeypem)

    var execUrl = _execUrl(context, configVars)
    var dyno = _dyno(context)

    return cli.got(`https://${execUrl.host}`, {
      auth: execUrl.auth,
      path: `${_execApiPath(configVars)}/${dyno}`,
      method: 'PUT',
      headers: _execHeaders(),
      body: {client_key: pubkeypem}
    }).then(function (response) {
      cli.action.done('done')
      callback(privkeypem, dyno, response);
    }).catch(error => {
      cli.action.done('error');
      cli.hush(error);
      cli.error('Could not connect to dyno!\nCheck if the dyno is running with `heroku ps\'')
    });;
  }))
}


function createSocksProxy(context, heroku, configVars, callback) {
  return updateClientKey(context, heroku, configVars, function(key, dyno, response) {
    cli.hush(response.body);
    var json = JSON.parse(response.body);
    var user = json['client_user']
    var host = json['tunnel_host']
    var port = 80
    var dyno_ip = json['dyno_ip']

    ssh.socksv5({ host: host, port: port, username: user, privateKey: key }, function(socks_port) {
      if (callback) callback(dyno_ip, dyno, socks_port)
      else cli.log(`Use ${cli.color.magenta('CTRL+C')} to stop the proxy`)
    });
  })
}

function _execApiPath(configVars) {
  if (configVars['HEROKU_EXEC_URL']) {
    return '/api/v1';
  } else {
    return '/api/v2'
  }
}

function _execUrl(context, configVars) {
  var urlString = configVars['HEROKU_EXEC_URL']
  if (urlString) {
    return url.parse(urlString);
  } else {
    if (process.env.HEROKU_EXEC_URL === undefined) {
      urlString = "https://heroku-exec.herokuapp.com/"
    } else {
      urlString = process.env.HEROKU_EXEC_URL
    }
    var execUrl = url.parse(urlString)
    execUrl.auth = `${context.app}:${process.env.HEROKU_API_KEY || context.auth.password}`
    return execUrl
  }
}

function _dyno(context) {
  return context.flags.dyno || 'web.1'
}

function _hasExecBuildpack(buildpacks, url) {
  for (let b of buildpacks) {
    if (b['buildpack']['url'].indexOf(url) === 0) return true
  }
  return false
}

function _execHeaders() {
  if (process.env.HEROKU_HEADERS) {
    cli.hush(`using headers: ${process.env.HEROKU_HEADERS}`)
    return JSON.parse(process.env.HEROKU_HEADERS)
  } else {
    return {}
  }
}

module.exports = {
  createSocksProxy,
  checkStatus,
  initFeature,
  updateClientKey
}
