'use strict';

const debug = require('debug')('heroku:analytics');

async function run(config) {
  try {
    const { default: MigrateV5Plugins } = require('cli-engine/lib/plugins/migrator');
    const migrator = new MigrateV5Plugins(config);
    await migrator.run();
  } catch (err) {
    debug(err);
  }
}

module.exports = run;