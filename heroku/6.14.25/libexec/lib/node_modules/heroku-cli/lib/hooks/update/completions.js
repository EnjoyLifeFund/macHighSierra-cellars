'use strict';

var _cliEngine = require('cli-engine');

var _cliEngine2 = _interopRequireDefault(_cliEngine);

var _completions = require('cli-engine-heroku/lib/completions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('heroku:completions');

async function run(config, opts) {
  try {
    if (this.config.windows) {
      debug('skipping autocomplete on windows');
    } else {
      const plugins = await new _cliEngine2.default(this.config).list();
      const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete');
      if (acPlugin) {
        let ac = await acPlugin.findCommand('autocomplete:init');
        if (ac) await ac.run(this.config);
      } else {
        debug('skipping autocomplete, not installed');
      }
      await _completions.AppCompletion.options({ config: this.config });
      await _completions.PipelineCompletion.options({ config: this.config });
      await _completions.SpaceCompletion.options({ config: this.config });
      await _completions.TeamCompletion.options({ config: this.config });
    }
  } catch (err) {
    debug(err);
  }
}

module.exports = run;