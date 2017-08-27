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

'use strict';

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var webappUtils = require('./webappUtils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var webapp = cli.category('webapp')
    .description($('Commands to manage your Azure webapps'));

  var config = webapp.category('config')
    .description($('Commands to manage your Azure webapps configurations'));

  var appsettings = config.category('appsettings')
    .description($('Commands to manage your Azure webapps app setting configurations'));

  var container = config.category('container')
    .description($('Commands to manage your Azure webapps container configurations'));

  var publish = webapp.category('publishingprofile')
    .description($('Command to get your Azure webapps publishing profile'));

  var hostnames = config.category('hostnames')
    .description($('Commands to manage your Azure webapps hostnames'));

  config.command('show [resource-group] [name]')
    .description($('Get webapp configuration \nexample:  webapp config show RGName WebAppName'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to show'))
    .option('--slot <slot>', $('the name of the slot'))
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
      var progress = cli.interaction.progress($('Getting webapp configuration'));
      var resultConfig, resultSite, resultAppSvc;
      var publishingResult;
      var appSettingsResult;
      try {
        if (options.slot) {
          resultConfig = client.sites.getSiteConfigSlot(resourceGroup, name, options.slot, _);
          publishingResult = client.sites.listSitePublishingCredentialsSlot(resourceGroup, name, options.slot, _);
          appSettingsResult = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
          resultSite = client.sites.getSiteSlot(resourceGroup, name, options.slot, options, _);
        } else {
          resultConfig = client.sites.getSiteConfig(resourceGroup, name, _);
          publishingResult = client.sites.listSitePublishingCredentials(resourceGroup, name, _);
          appSettingsResult = client.sites.listSiteAppSettings(resourceGroup, name, _);
          resultSite = client.sites.getSite(resourceGroup, name, options, _);
        }
        var serverFarmIdArr = (resultSite.serverFarmId).split('/');
        var serverFarmId = serverFarmIdArr[serverFarmIdArr.length - 1];
        resultAppSvc = client.serverFarms.getServerFarm(resourceGroup, serverFarmId, _);
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(resultConfig, function (data) {
        if (!data) {
          log.info($('No webapp information available'));
        } else {
          log.data($('Properties'));
          log.data($('--------------------------------'));
          log.data($('Web app Name                   :'), data.name);
          log.data($('Location                       :'), data.location);
          log.data($('Php version                    :'), data.phpVersion);
          log.data($('Python version                 :'), data.pythonVersion);
          log.data($('Node version                   :'), data.nodeVersion);
          log.data($('Linux Enabled                  :'), resultAppSvc.reserved);
          log.data($('App Command Line               :'), data.appCommandLine);
          log.data($('Number Of Workers              :'), data.numberOfWorkers);
          log.data($('Net Framework Version          :'), data.netFrameworkVersion);
          log.data($('Java version                   :'), data.javaVersion);
          log.data($('Java Container                 :'), data.javaContainer);
          log.data($('Java Container Version         :'), data.javaContainerVersion);
          log.data($('Scm Type                       :'), data.scmType);
          log.data($('Http Logging Enabled           :'), data.httpLoggingEnabled);
          log.data($('Detailed Error Logging Enabled :'), data.detailedErrorLoggingEnabled);
          log.data($('Web Socket Enabled             :'), data.webSocketEnabled);
          log.data($('Always On                      :'), data.alwaysOn);
          log.data($('Use 32bit Worker Process       :'), data.use32BitWorkerProcess);
          log.data($('Auto Heal Enabled              :'), data.autoHealEnabled);
          log.data($('Remote Debugging Enabled       :'), data.remoteDebuggingEnabled);
          log.data($('Remote Debugging Version       :'), data.remoteDebuggingVersion);
          log.data($('Logs Directory Size Limit      :'), data.logsDirectorySizeLimit);
          log.data($('Load Balancing                 :'), data.loadBalancing);
          log.data($('Managed Pipeline Mode          :'), data.managedPipelineMode);
          log.data($('Virtual Applications           :'), data.virtualApplications);
          log.data($('Request Tracing Expiration Time:'), data.requestTracingExpirationTime);
          log.data($('Request Tracing Enabled        :'), data.requestTracingEnabled);
          log.data($('Document Root                  :'), data.documentRoot);
          log.data($('Handler Mappings               :'), data.handlerMappings);
          log.data($('Metadata                       :'), data.Metadata);
          log.data($('Default Documents              :'), data.defaultDocuments);
        }
      });
      cli.interaction.formatOutput(publishingResult, function (data) {
        if (!data) {
          log.info($('No webapp publishing profile information available'));
        } else {
          log.data($('Publish Profile Username       :'), data.publishingUserName);
          log.data($('Publish Profile Password       :'), data.publishingPassword);
          log.data('');
        }
      });
      cli.interaction.formatOutput(appSettingsResult.properties, function (data) {
        if (appSettingsResult.properties !== null && appSettingsResult.properties !== undefined) {
          log.data($('App Settings (use webapp config appsettings to change)'));
          log.data($('--------------------------------'));
          log.data(data);
          log.data($(''));
        }
      });
    });

  config.command('set [resource-group] [name]')
    .description($('Set webapp configuration\nexample:  webapp config set RGName WebAppName --alwayson true --numberofworkers 1'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to update'))
    .option('-j --jsonInput <jsonInput>', $('the json config object string'))
    .option('--phpversion <phpversion>', $('php version of webapp'))
    .option('--pythonversion <pythonversion>', $('python version of webapp'))
    .option('--nodeversion <nodeversion>', $('node version of webapp'))
    .option('--numberofworkers <numberofworkers>', $('number of workers'))
    .option('--appcommandline <appcommandline>', $('app command line'))
    .option('--netframeworkversion <netframeworkversion>', $('net framwork version of webapp'))
    .option('--requesttracingenabled <requesttracingenabled>', $('request tracing enabled option'))
    .option('--remotedebuggingenabled <remotedebuggingenabled>', $('remote debugging enabled option'))
    .option('--httploggingenabled <httploggingenabled>', $('http logging enabled option'))
    .option('--detailederrorloggingenabled <detailederrorloggingenabled>', $('detailed error logging enabled option'))
    .option('--websocketenabled <websocketenabled>', $('web socket enabled option'))
    .option('--use32bitworkerprocess <use32bitworkerprocess>', $('use 32 bit process option'))
    .option('--alwayson <alwayson>', $('always on option'))
    .option('--autohealenabled <autohealenabled>', $('auto heal enabled option'))
    .option('--javaversion <javaversion>', $('java version of webapp'))
    .option('--javacontainer <javacontainer>', $('java container of webapp'))
    .option('--javacontainerversion <javacontainerversion>', $('java container version of webapp'))
    .option('--scmtype <scmtype>', $('scm type of webapp'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
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
      var progress = cli.interaction.progress($('Updating webapp configuration\n'));
      var jsonObj = {};
      if (options.jsonInput !== null && options.jsonInput !== undefined) {
        jsonObj = JSON.parse(options.jsonInput);
      }
      if (options.phpversion !== null && options.phpversion !== undefined) {
        jsonObj['phpVersion'] = options.phpversion;
      }
      if (options.pythonversion !== null && options.pythonversion !== undefined) {
        jsonObj['pythonVersion'] = options.pythonversion;
      }
      if (options.nodeversion !== null && options.nodeversion !== undefined) {
        jsonObj['nodeVersion'] = options.nodeversion;
      }
      if (options.numberofworkers !== null && options.numberofworkers !== undefined) {
        jsonObj['numberOfWorkers'] = Number(options.numberofworkers);
      }
      if (options.appcommandline !== null && options.appcommandline !== undefined) {
        jsonObj['appCommandLine'] = options.appcommandline;
      }
      if (options.netframeworkversion !== null && options.netframeworkversion !== undefined) {
        jsonObj['netFrameworkVersion'] = options.netframeworkversion;
      }
      if (options.requesttracingenabled !== null && options.requesttracingenabled !== undefined) {
        jsonObj['requestTracingEnabled'] = toBool(options.requesttracingenabled);
      }
      if (options.remotedebuggingenabled !== null && options.remotedebuggingenabled !== undefined) {
        jsonObj['remoteDebuggingEnabled'] = toBool(options.remotedebuggingenabled);
      }
      if (options.httploggingenabled !== null && options.httploggingenabled !== undefined) {
        jsonObj['httpLoggingEnabled'] = toBool(options.httploggingenabled);
      }
      if (options.detailederrorloggingenabled !== null && options.detailederrorloggingenabled !== undefined) {
        jsonObj['detailedErrorLoggingEnabled'] = toBool(options.detailederrorloggingenabled);
      }
      if (options.publishingusername !== null && options.publishingusername !== undefined) {
        jsonObj['publishingUsername'] = options.publishingusername;
      }
      if (options.publishingpassword !== null && options.publishingpassword !== undefined) {
        jsonObj['publishingPassword'] = options.publishingpassword;
      }
      if (options.websocketenabled !== null && options.websocketenabled !== undefined) {
        jsonObj['webSocketEnabled'] = toBool(options.websocketenabled);
      }
      if (options.use32bitworkerprocess !== null && options.use32bitworkerprocess !== undefined) {
        jsonObj['use32BitWorkerProcess'] = toBool(options.use32bitworkerprocess);
      }
      if (options.alwayson !== null && options.alwayson !== undefined) {
        jsonObj['alwaysOn'] = toBool(options.alwayson);
      }
      if (options.autohealenabled !== null && options.autohealenabled !== undefined) {
        jsonObj['autoHealEnabled'] = toBool(options.autohealenabled);
      }
      if (options.javaversion !== null && options.javaversion !== undefined) {
        jsonObj['javaVersion'] = options.javaversion;
      }
      if (options.javacontainer !== null && options.javacontainer !== undefined) {
        jsonObj['javaContainer'] = options.javacontainer;
      }
      if (options.javacontainerversion !== null && options.javacontainerversion !== undefined) {
        jsonObj['javaContainerVersion'] = options.javacontainerversion;
      }
      if (options.scmtype !== null && options.scmtype !== undefined) {
        jsonObj['scmType'] = options.scmtype;
      }
      if (Object.keys(jsonObj).length !== 0) {
        try {
          var result;
          if (options.slot) {
            result = client.sites.getSiteSlot(resourceGroup, name, options.slot, _);
            jsonObj['location'] = result.location;
            result = client.sites.createOrUpdateSiteConfigSlot(resourceGroup, name, jsonObj, options.slot, _);
            log.info('Webapp slot ' + name + '/' + options.slot + ' configuration has been updated ');

          } else {
            result = client.sites.getSite(resourceGroup, name, _);
            jsonObj['location'] = result.location;
            result = client.sites.createOrUpdateSiteConfig(resourceGroup, name, jsonObj, _);
            log.info('Webapp ' + name + ' configuration has been updated ');
          }
          cli.interaction.formatOutput(result, function () {
            if (!result || result.length === 0)
              log.error($('API call did not return a valid result'));
          });
        } finally {
          progress.end();
        }

      }
      else {
        log.info('No options selected');
        progress.end();
      }
    });

  function toBool(stringToParse) {
    var str = stringToParse.toUpperCase();
    if (str == 'TRUE') return true;
    if (str == 'FALSE') return false;
    if (str == 'ON') return true;
    if (str == 'OFF') return false;
    return stringToParse;
  }

  appsettings.command('set [resource-group] [name] [appsettings]')
    .description($('Set webapp app settings (using comma seperated key value pairs)\nexample:  webapp config appsettings set RGName WebAppName KEY1=val1,KEY2=val2,KEY3=val3'))
    .usage('[options] <resource-group> <name> <appsettings>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to show'))
    .option('-a --appsettings <appsettings>', $('the appsettings of the webapp to add'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, appsettings, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!appsettings) {
        return cli.missingArgument('appsettings');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress($('Getting webapp appsettings'));
      var currentAppSettings;
      var appSettingsToAdd = appsettings;
      var appSettingsToAddSplit;
      var settingSplit;
      var result;
      try {
        if (options.slot) {
          currentAppSettings = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
        } else {
          currentAppSettings = client.sites.listSiteAppSettings(resourceGroup, name, _);
        }
      } finally {
        progress.end();
      }
      appSettingsToAddSplit = appSettingsToAdd.toString().split(',');
      settingSplit = [];
      for (var i = 0; i < appSettingsToAddSplit.length; i++) {
        var firstEqual = appSettingsToAddSplit[i].indexOf('=');
        if (firstEqual !== -1) {
          settingSplit = [appSettingsToAddSplit[i].substr(0, firstEqual), appSettingsToAddSplit[i].substr(firstEqual + 1)];
          currentAppSettings.properties[settingSplit[0]] = settingSplit[1];
        }
        else {
          log.info($(appSettingsToAddSplit[i] + ' does not contain an \'=\''));
        }
      }
      progress = cli.interaction.progress($('Modifying webapp appsettings'));
      try {
        if (options.slot) {
          result = client.sites.updateSiteAppSettingsSlot(resourceGroup, name, currentAppSettings, options.slot, _);
        } else {
          result = client.sites.updateSiteAppSettings(resourceGroup, name, currentAppSettings, _);
        }
      } finally {
        progress.end();
      }
      log.data($('Final App Settings'));
      log.data($('--------------------------------'));
      log.data(result.properties);
      log.data($(''));
    });

  appsettings.command('delete [resource-group] [name] [appsettings]')
    .description($('Delete webapp app settings (using comma seperated keys)\nexample:  webapp config appsettings delete RGName WebAppName KEY1,KEY2,KEY3'))
    .usage('[options] <resource-group> <name> <appsettings>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to show'))
    .option('-a --appsettings <appsettings>', $('the appsettings of the webapp to delete'))
    .option('--slot <slot>', $('the name of the slot'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, appsettings, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!appsettings) {
        return cli.missingArgument('appsettings');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress($('Getting webapp appsettings'));
      var currentAppSettings;
      try {
        if (options.slot) {
          currentAppSettings = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
        } else {
          currentAppSettings = client.sites.listSiteAppSettings(resourceGroup, name, _);
        }
      } finally {
        progress.end();
      }
      var appSettingsToDelete = appsettings;
      var appSettingsToDeleteSplit;
      var result;
      var appSettingsToDeleteProperties = {};
      appSettingsToDeleteSplit = appSettingsToDelete.toString().split(',');
      for (var i = 0; i < appSettingsToDeleteSplit.length; i++) {
        appSettingsToDeleteProperties[appSettingsToDeleteSplit[i]] = '';
      }
      for (var attrname in appSettingsToDeleteProperties) {
        if (currentAppSettings.properties.hasOwnProperty(attrname)) {
          delete currentAppSettings.properties[attrname];
        }
        else {
          log.data(attrname + ' does not exist in current appsettings!');
        }
      }
      progress = cli.interaction.progress($('Deleting webapp appsettings'));
      try {
        if (options.slot) {
          result = client.sites.updateSiteAppSettingsSlot(resourceGroup, name, currentAppSettings, options.slot, _);
        } else {
          result = client.sites.updateSiteAppSettings(resourceGroup, name, currentAppSettings, _);
        }
      } finally {
        progress.end();
      }
      log.data($('Final App Settings'));
      log.data($('--------------------------------'));
      log.data(result.properties);
      log.data($(''));
    });

  appsettings.command('list [resource-group] [name]')
    .description($('Get webapp app settings'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to list'))
    .option('--slot <slot>', $('the name of the slot'))
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
      var progress = cli.interaction.progress($('Getting webapp appsettings'));
      var result;
      try {
        if (options.slot) {
          result = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
        } else {
          result = client.sites.listSiteAppSettings(resourceGroup, name, _);
        }
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(result.properties, function (data) {
        if (result.properties !== null && result.properties !== undefined) {
          log.data($('App Settings'));
          log.data($('--------------------------------'));
          log.data(data);
          log.data($(''));
        }
        else {
          log.data($('No app setting set'));
        }
      });
    });

  publish.command('show [resource-group] [name]')
    .description($('Get webapp publish profile'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp to show'))
    .option('--slot <slot>', $('the name of the slot'))
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
      var progress = cli.interaction.progress($('Getting webapp configuration'));
      var result;
      try {
        if (options.slot) {
          result = client.sites.listSitePublishingCredentialsSlot(resourceGroup, name, options.slot, _);
        } else {
          result = client.sites.listSitePublishingCredentials(resourceGroup, name, options, _);
        }
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(result, function (data) {
        if (!data) {
          log.info($('No webapp publishing profile information available'));
        } else {
          log.data('');
          log.data(data);
          log.data('');
        }
      });
    });

  hostnames.command('add [resource-group] [name] [hostnames]')
    .description($('Add a hostname bindings for a webapp (using comma seperated names)\nexample:  webapp config hostnames add RGName WebAppName www.site1.com,www.site2.co.uk'))
    .usage('[options] <resource-group> <name> <hostnames>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the web app'))
    .option('-o --hostnames <hostname>', $('the list of hostnames to bind'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, hostnames, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!hostnames) {
        return cli.missingArgument('hostnames');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress($('Getting webapp hostnames'));
      var result;
      try {
        if (options.slot) {
          result = client.sites.getSiteSlot(resourceGroup, name, options.slot, _);
        } else {
          result = client.sites.getSite(resourceGroup, name, _);
        }
      } finally {
        progress.end();
      }
      var hostnamesToAddSplit = hostnames.toString().split(',');
      for (var i = 0; i < hostnamesToAddSplit.length; i++) {
        var bindingOptions = {
          location: result.location,
          siteName: name,
          hostNameBindingName: hostnamesToAddSplit[i]
        };
        progress = cli.interaction.progress($('Adding hostname:'), hostnamesToAddSplit[i]);
        try {
          if (options.slot) {
            result = client.sites.createOrUpdateSiteHostNameBindingSlot(resourceGroup, name, hostnamesToAddSplit[i], bindingOptions, options.slot, _);
          } else {
            result = client.sites.createOrUpdateSiteHostNameBinding(resourceGroup, name, hostnamesToAddSplit[i], bindingOptions, _);
          }
        } finally {
          progress.end();
        }
      }
    });

  hostnames.command('delete [resource-group] [name] [hostnames]')
    .description($('Delete a hostname binding for a webapp(using comma seperated names)\nexample:  webapp config hostnames delete RGName WebAppName www.site1.com,www.site2.co.uk'))
    .usage('[options] <resource-group> <name> <hostnames>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the web app'))
    .option('-o --hostnames <hostname>', $('the list of hostnames to unbind'))
    .option('-s --subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, hostnames, options, _) {
      if (!resourceGroup) {
        cli.missingArgument('resource-group');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!hostnames) {
        return cli.missingArgument('hostnames');
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = webappUtils.createWebappManagementClient(subscription);
      var progress = cli.interaction.progress($('Getting webapp hostnames'));
      var hostnamesToDeleteSplit = hostnames.toString().split(',');
      
      for (var i = 0; i < hostnamesToDeleteSplit.length; i++) {
        progress = cli.interaction.progress($('Deleting hostname:'), hostnamesToDeleteSplit[i]);
        try {
          if (options.slot) {
            client.sites.deleteSiteHostNameBindingSlot(resourceGroup, name, options.slot, hostnamesToDeleteSplit[i], _);
          } else {
            client.sites.deleteSiteHostNameBinding(resourceGroup, name, hostnamesToDeleteSplit[i], _);
          }
        } finally {
          progress.end();
        }
      }
    });

  hostnames.command('list [resource-group] [name]')
    .description($('List hostname bindings under a webapp'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the web app'))
    .option('--slot <slot>', $('the name of the slot'))
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
      var progress = cli.interaction.progress($('Getting webapp hostnames'));
      var result;
      try {
        if (options.slot) {
          result = client.sites.getSiteHostNameBindingsSlot(resourceGroup, name, options.slot, _);
        } else {
          result = client.sites.getSiteHostNameBindings(resourceGroup, name, _);
        }
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(result, function (data) {
        data = data.value;
        if (data === undefined || data.length <= 0 || !data) {
          log.info($('No web app hostname bindings defined.'));
        } else {
          log.table(data, function (row, item) {
            var hostnameIdArr = (item.name).split('/');
            row.cell($('HostName '), hostnameIdArr[1]);
            row.cell($('Type '), item.hostNameType);
          });
        }
      });
    });

  container.command('set [resource-group] [name]')
    .description($('Set webapp Container configurations (available only for linux webapps)'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp'))
    .option('-r --url <url>', $('the container registry server url'))
    .option('-u --username <username>', $('the container registry server username'))
    .option('-p --password <password>', $('the container registry server password'))
    .option('-c --custom-image-name <custom-image-name>', $('the container custom image name and optionally the tag name'))
    .option('--slot <slot>', $('the name of the slot'))
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
      if (!(options.url || options.username || options.password || options['customImageName']))
        throw new Error('User did not specify any container options');
      var progress = cli.interaction.progress($('Setting webapp container settings'));
      var currentAppSettings;
      var result;
      try {
        if (options.slot) {
          currentAppSettings = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
        } else {
          currentAppSettings = client.sites.listSiteAppSettings(resourceGroup, name, _);
        }
        if (options.url) 
          currentAppSettings.properties['DOCKER_REGISTRY_SERVER_URL'] = options.url;
        if (options.username) 
          currentAppSettings.properties['DOCKER_REGISTRY_SERVER_USERNAME'] = options.username;
        if (options.password) 
          currentAppSettings.properties['DOCKER_REGISTRY_SERVER_PASSWORD'] = options.password;
        if (options['customImageName'])
          currentAppSettings.properties['DOCKER_CUSTOM_IMAGE_NAME'] = options['customImageName'];
        if (options.slot) {
          result = client.sites.updateSiteAppSettingsSlot(resourceGroup, name, currentAppSettings, options.slot, _);
        } else {
          result = client.sites.updateSiteAppSettings(resourceGroup, name, currentAppSettings, _);
        }
      } finally {
        progress.end();
      }
      log.data($('Final Container Settings'));
      log.data($('--------------------------------'));
      cli.interaction.formatOutput(result.properties, function (data) {
        log.data($('Container Registry Server URL      :'), data['DOCKER_REGISTRY_SERVER_URL']);
        log.data($('Container Registry Server Username :'), data['DOCKER_REGISTRY_SERVER_USERNAME']);
        log.data($('Container Registry Server Password :'), data['DOCKER_REGISTRY_SERVER_PASSWORD']);
        log.data($('Container Custom Image Name        :'), data['DOCKER_CUSTOM_IMAGE_NAME']);
        log.data($(''));
      });
    });

  container.command('list [resource-group] [name]')
    .description($('List Container configurations  (available only for linux webapps)'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp'))
    .option('--slot <slot>', $('the name of the slot'))
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
      var progress = cli.interaction.progress($('Getting webapp container settings'));
      var result;
      try {
        if (options.slot) {
          result = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
        } else {
          result = client.sites.listSiteAppSettings(resourceGroup, name, _);
        }
      } finally {
        progress.end();
      }
      log.data($('Final Container Settings'));
      log.data($('--------------------------------'));
      cli.interaction.formatOutput(result.properties, function (data) {
        log.data($('Container Registry Server URL      :'), data['DOCKER_REGISTRY_SERVER_URL']);
        log.data($('Container Registry Server Username :'), data['DOCKER_REGISTRY_SERVER_USERNAME']);
        log.data($('Container Registry Server Password :'), data['DOCKER_REGISTRY_SERVER_PASSWORD']);
        log.data($('Container Custom Image Name        :'), data['DOCKER_CUSTOM_IMAGE_NAME']);
        log.data($(''));
      });
    });

  container.command('delete [resource-group] [name]')
    .description($('Delete all webapp Container configurations (available only for linux webapps)'))
    .usage('[options] <resource-group> <name>')
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the webapp'))
    .option('--slot <slot>', $('the name of the slot'))
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
      var progress = cli.interaction.progress($('Deleting webapp container settings'));
      var currentAppSettings; 
      try {
        if (options.slot) {
          currentAppSettings = client.sites.listSiteAppSettingsSlot(resourceGroup, name, options.slot, _);
        } else {
          currentAppSettings = client.sites.listSiteAppSettings(resourceGroup, name, _);
        }
        delete currentAppSettings.properties['DOCKER_REGISTRY_SERVER_URL'];
        delete currentAppSettings.properties['DOCKER_REGISTRY_SERVER_USERNAME'];
        delete currentAppSettings.properties['DOCKER_REGISTRY_SERVER_PASSWORD'];
        delete currentAppSettings.properties['DOCKER_CUSTOM_IMAGE_NAME'];
        if (options.slot) {
          client.sites.updateSiteAppSettingsSlot(resourceGroup, name, currentAppSettings, options.slot, _);
        } else {
          client.sites.updateSiteAppSettings(resourceGroup, name, currentAppSettings, _);
        }
      } finally {
        progress.end();
      }
    });
};
