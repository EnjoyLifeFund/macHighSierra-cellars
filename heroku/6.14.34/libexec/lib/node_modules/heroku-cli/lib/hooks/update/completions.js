'use strict';

var _cliUx = require('cli-ux');

var _plugins = require('cli-engine/lib/plugins');

var _plugins2 = _interopRequireDefault(_plugins);

var _completions = require('cli-engine-heroku/lib/completions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('heroku:completions');

async function run(config, opts) {
  try {
    if (config.windows) {
      debug('skipping autocomplete on windows');
    } else {
      const cli = new _cliUx.CLI();
      const plugins = await new _plugins2.default(config).list();
      const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete');
      if (acPlugin) {
        cli.action.start('Updating completions');
        let ac = await acPlugin.findCommand('autocomplete:init');
        if (ac) await ac.run(config);
        await _completions.AppCompletion.options({ config });
        await _completions.PipelineCompletion.options({ config });
        await _completions.SpaceCompletion.options({ config });
        await _completions.TeamCompletion.options({ config });
      } else {
        debug('skipping autocomplete, not installed');
      }
      cli.action.done();
    }
  } catch (err) {
    debug(err);
  }
}

module.exports = run;