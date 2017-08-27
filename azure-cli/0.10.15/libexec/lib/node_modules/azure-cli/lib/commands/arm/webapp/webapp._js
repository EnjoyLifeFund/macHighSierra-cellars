/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/*
* You can test webapp commands get loaded by xplat by following steps:
* a. Copy the folder to '<repository root>\lib\commands\arm'
* b. Under <repository root>, run 'node bin/azure config mode arm'
* c. Run 'node bin/azure', you should see 'webapp' listed as a command set
* d. Run 'node bin/azure', you should see 'create', "delete", etc 
      showing up in the help text 
*/

'use strict';

var util = require('util');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var webappUtils = require('./webappUtils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var webapp = cli.category('webapp')
    .description($('Commands to manage your Azure webapps'));

  webapp.command('create [resource-group] [name] [location] [plan]')
    .description($('create a web app'))
    .usage('[options] <resource-group> <name> <location> <plan>')
    .option('-g --resource-group <resource-group>', $('Name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to create'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-l --location <location>', $('the geographic region to create the webapp, \n\t\t\t\t\t   locations found at https://azure.microsoft.com/en-us/status/'))
    .option('-p --plan <plan>', $('the name of the app service plan eg: Default1.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, location, plan, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!location) {
        return cli.missingArgument('location');
      }
      if (!plan) {
        return cli.missingArgument('plan');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Creating webapp %s'), name));
	    var siteEnvelope = {
	       sitename: name,
		     serverFarmId: plan,
		     location: location
	    };
      try {
        if (options.slot) {
          client.sites.createOrUpdateSiteSlot(resourceGroup, name, siteEnvelope, options.slot, _);
          log.info('Webapp slot ' + name + '/' + options.slot + ' has been created ');
        } else {
          client.sites.createOrUpdateSite(resourceGroup, name, siteEnvelope, _);
          log.info('Webapp ' + name + ' has been created');
        }
      } finally {
        progress.end();
      }
    });

  webapp.command('stop [resource-group] [name]')
    .description($('Stop a web app'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to stop'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (resourceGroup, name, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Stopping webapp %s'), name));
      try {
        if (options.slot) {
          client.sites.stopSiteSlot(resourceGroup, name, options.slot, _);
          log.info('Webapp slot ' + name + '/' + options.slot + ' has been stopped ');
        } else {
          client.sites.stopSite(resourceGroup, name, _);
          log.info('Webapp ' + name + ' has been stopped');
        }
      } finally {
        progress.end();
      }
    });

  webapp.command('start [resource-group] [name]')
    .description($('Start a web app'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to start'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (resourceGroup, name, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      var webSiteSlotName = name;
      if (options.slot) {
        webSiteSlotName = name.concat('/', options.slot);
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Starting webapp %s'), webSiteSlotName));
      try {
        if (options.slot) {
          client.sites.startSiteSlot(resourceGroup, name, options.slot, _);
          log.info('Webapp slot ' + name + '/' + options.slot + ' has been started');
        } else {
          client.sites.startSite(resourceGroup, name, _);
          log.info('Webapp ' + name + ' has been started');
        }
      } finally {
        progress.end();
      }
    });

  webapp.command('restart [resource-group] [name]')
    .description($('Stop and then start a web app'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to restart'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (resourceGroup, name, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      var webSiteSlotName = name;
      if (options.slot) {
        webSiteSlotName = name.concat('/', options.slot);
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Restarting webapp %s'), name));
      try {
        if (options.slot) {
          client.sites.restartSiteSlot(resourceGroup, name, options.slot, _);
          log.info('Webapp slot ' + name + '/' + options.slot + ' has been restarted');
        } else {
          client.sites.restartSite(resourceGroup, name, _);
          log.info('Webapp ' + name + ' has been restarted');
        }
      } finally {
        progress.end();
      }
    });

  webapp.command('delete [resource-group] [name]')
    .description($('Delete a webapp'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('Name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to delete'))
    .option('--slot <slot>', $('the name of the slot to be deleted'))
    .option('-q, --quiet', $('quiet mode, do not ask for delete confirmation'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!options.quiet) {
        if (!options.slot) {
          if (!cli.interaction.confirm(util.format('Delete site %s? [y/n] ', name), _)) {
            return;
          }
        } else if (!cli.interaction.confirm(util.format('Delete site %s - %s? [y/n] ', name, options.slot), _)) {
          return;
        }
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Deleting webapp %s'), name));
      options.delProperties = {
        deleteMetrics: true,
        deleteEmptyServerFarm: false,
        deleteAllSlots: true
      };
      try {
        if (options.slot) {
          client.sites.deleteSiteSlot(resourceGroup, name, options.slot, options, _);
          log.info('Webapp slot ' + name + '/' + options.slot + ' has been deleted');
        } else {
          client.sites.deleteSite(resourceGroup, name, options, _);
          log.info('Webapp ' + name + ' has been deleted');
        }
      } finally {
        progress.end();
      }
      log.info(util.format($('Webapp %s has been deleted'), name));
    });

  webapp.command('list [resource-group]')
    .description($('List your webapps'))
    .usage('[options] <resource-group>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
	  .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress($('Listing webapps'));
      var result;
      try {
        result = client.sites.getSites(resourceGroup, _);
      } finally {
        progress.end();
      }

      if (result && result.length > 0) {
        for (var i = 0; i < result.length; i++) {
          cli.interaction.formatOutput(result[i], function (data) {
            if (!data) {
              log.info($('No webapp information available'));
            } else {
              log.data($(''));
              log.data($('Web App Name     :'), data.name);
              log.data($('Enabled          :'), data.enabled);
              log.data($('Status           :'), data.state);
              log.data($('Last Modified    :'), data.lastModifiedTimeUtc);
              log.data($('Location         :'), data.location);
              var serverFarmIdArr = (data.serverFarmId).split('/');
              var serverFarmId = serverFarmIdArr[serverFarmIdArr.length - 1];
              log.data($('App Service Plan :'), serverFarmId);
            }
          });
          var resultSlots;
          progress = cli.interaction.progress($('Checking for slots'));
          try {
            resultSlots = client.sites.getSiteSlots(resourceGroup, result[i].name, _);
          } finally {
            progress.end();
          }
          if (resultSlots.length > 0) {
            for (var j = 0; j < resultSlots.length; j++) {
              cli.interaction.formatOutput(resultSlots[j], function (data) {
                if (!data) {
                  log.info($('No webapp slot information available'));
                } else {
                  log.data($('  Slot Name        :'), data.name);
                  log.data($('  Enabled          :'), data.enabled);
                  log.data($('  Status           :'), data.state);
                  log.data($('  Last Modified    :'), data.lastModifiedTimeUtc);
                  log.data($(''));
                }
              });
            }
          }
        }
      }
    });

  webapp.command('show [resource-group] [name]')
    .description($('Get an available webapp'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to show'))
    .option('--slot <slot>', $('the name of the slot to show'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress($('Getting webapp'));
      var result;
      try {
        if (options.slot) {
          result = client.sites.getSiteSlot(resourceGroup, name, options.slot, options, _);
        } else {
          result = client.sites.getSite(resourceGroup, name, options, _);
        }
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(result, function (data) {
        if (!data) {
          log.info($('No webapp information available'));
        } else {
		      log.data($(''));
          log.data($('Web App Name     :'), data.name);
          log.data($('Enabled          :'), data.enabled);
		      log.data($('Status           :'), data.state);
          log.data($('Last Modified    :'), data.lastModifiedTimeUtc);
          log.data($('Location         :'), data.location);
		      var serverFarmIdArr = (data.serverFarmId).split('/');
		      var serverFarmId = serverFarmIdArr[serverFarmIdArr.length - 1];
		      log.data($('App Service Plan :'), serverFarmId);
          log.data('');
          if (data.hostNames[0] && data.hostNames[0].length > 0) {
            log.table(data.hostNames, function (row, s) {
              row.cell($('Host Name'), s);
            });
          }
          log.data('');
        }
      });
    });
};