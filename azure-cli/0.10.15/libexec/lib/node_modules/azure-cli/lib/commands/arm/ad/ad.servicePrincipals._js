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
var moment = require('moment');
var util = require('util');

var adUtils = require('./adUtils');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);

  var ad = cli.category('ad')
    .description($('Commands to display Active Directory objects'));
  var adSP = ad.category('sp')
    .description($('Commands to display Active Directory service principals'));

  adSP.command('list')
    .description($('Get all Active Directory service principals in current subscription\'s tenant. When --json flag is used, it will get the information from all the pages and then provide the final json array.'))
    .option('| more', $('Provides paging support. Press \'Enter\' for more information.'))
    .execute(function (options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Listing Active Directory service principals'));
      try {
        adUtils.listGraphObjects(client, 'servicePrincipal', cli.interaction, log, options.json, _);
      } finally {
        progress.end();
      }
    });

  adSP.command('show')
    .description($('Get Active Directory service principals'))
    .option('-n --spn <spn>', $('the name of the service principal to return'))
    .option('-o --objectId <objectId>', $('the object id of the service principal to return'))
    .option('-c --search <search>', $('search display name of the service principal starting with the provided value'))
    .execute(function (options, _) {
      var spn = options.spn,
          objectId = options.objectId,
          search = options.search;

      adUtils.validateParameters({
        spn: spn,
        objectId: objectId,
        search:search
      });
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Getting Active Directory service principals'));
      var servicePrincipals = [];
      var parameters = null;
      try {
        if (spn) {
          parameters = { filter: 'servicePrincipalNames/any(c:c eq \'' + spn + '\')' };
          servicePrincipals = client.servicePrincipals.list(parameters, _);
        } else if (objectId) {
          var servicePrincipal = client.servicePrincipals.get(objectId, _);
          if (servicePrincipal) {
            servicePrincipals.push(servicePrincipal);
          }
        } else {
          parameters = { filter: 'startswith(displayName,\'' + search + '\')' };
          servicePrincipals = client.servicePrincipals.list(parameters, _);
        }
      } finally {
        progress.end();
      }

      if (servicePrincipals.length > 0) {
        adUtils.displayServicePrincipals(servicePrincipals, cli.interaction, log);
      } else {
        log.data($('No matching service principal was found'));
      }
    });

  adSP.command('create')
    .description($('Create Active Directory service principal.'))
    .option('-a --applicationId <applicationId>', $('The application Id for which service principal needs to be created. ' +
      'If this is provided then everything else will be ignored. \nWhen the applicationId is provided it means that the ' +
      'application was already created and it needs to be used to create the service principal.'))
    .option('-n --name <name>', $('the display name for the application'))
    .option('-p --password <password>', $('the value for the password credential associated with the application that will be valid for one year by default'))
    .option('--cert-value <cert-value>', $('the value of the "asymmetric" credential type. It represents the base 64 encoded certificate'))
    .option('--start-date <start-date>', $('the start date after which password or key would be valid. Default value is current time'))
    .option('--end-date <end-date>', $('the end date till which password or key is valid. Default value is one year after current time'))
    .execute(function (options, _) {

      var applicationId = options.applicationId;

      if (options.password && options.certValue) {
        throw new Error($('specify either --password or --cert-value, but not both.'));
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);

      if (!applicationId) {

        if (!options.name) {
          throw new Error($('specify a value for --applicationId, if an application is exisitng or --name, if a new application is to be created'));
        }

        var uri = 'http://' + options.name.trim().replace(/ /g, '_');

        var appParams = {
          availableToOtherTenants: false,
          displayName: options.name,
          homepage: uri,
          identifierUris: [uri]
        };

        var application = adUtils.createApplicationWithParameters(cli, client, appParams, _);
        applicationId = application.appId;
      }

      var spParams = {
        accountEnabled: true,
        appId: applicationId
      };

      var startDate = options.startDate ? new Date(Date.parse(options.startDate)) : new Date(Date.now());
      var endDate = (function () {
        if (options.endDate) {
          return new Date(Date.parse(options.endDate));
        } else {
          var date = new Date(startDate);
          var m = moment(date);
          m.add(1, 'years');
          date = new Date(m.toISOString());
          return date;
        }
      })();

      var keyType = 'AsymmetricX509Cert';
      var keyUsage = 'Verify';

      if (options.password) {
        spParams.passwordCredentials = [{
          startDate: startDate,
          endDate: endDate,
          keyId: utils.uuidGen(),
          value: options.password
        }];
      } else if (options.certValue) {
        spParams.keyCredentials = [{
          startDate: startDate,
          endDate: endDate,
          keyId: utils.uuidGen(),
          value: options.certValue,
          usage: keyUsage,
          type: keyType
        }];
      }

      var servicePrincipal = withProgress(util.format($('Creating service principal for application %s'), applicationId),
      function (log, _) {
        return client.servicePrincipals.create(spParams, _);
      }, _);

      cli.interaction.formatOutput(servicePrincipal, function (data) {
        if (data) {
          adUtils.displayAServicePrincipal(data, log);
        }
      });
    });

  adSP.command('set [objectId]')
    .description($('Updates the properties of the created Active Directory ServicePrincipal'))
    .usage('[options] <objectId>')
    .option('-o --objectId <objectId>', $('the object id of the servicePrincipal to update.'))
    .option('-n --name <name>', $('the new display name for the application.'))
    .option('-p --password <password>', $('new value for the password credential associated with the application that will be valid for one year by default'))
    .option('--cert-value <cert-value>', $('new value of the "asymmetric" credential type. It represents the base 64 encoded certificate'))
    .option('--start-date <start-date>', $('new start date value after which password or key would be valid. Default value is current time'))
    .option('--end-date <end-date>', $('new end date value till which password or key is valid. Default value is one year after current time'))
    .execute(function (objectId, options, _) {
      if (!objectId) {
        return cli.missingArgument('objectId');
      }
      var applicationId;

      if (options.password && options.certValue) {
        throw new Error($('specify either --password or --cert-value, but not both.'));
      }

      var startDate = options.startDate ? new Date(Date.parse(options.startDate)) : new Date(Date.now());
      var endDate = (function () {
        if (options.endDate) {
          return new Date(Date.parse(options.endDate));
        } else {
          var date = new Date(startDate);
          var m = moment(date);
          m.add(1, 'years');
          date = new Date(m.toISOString());
          return date;
        }
      })();

      var keyType = 'AsymmetricX509Cert';
      var keyUsage = 'Verify';

      var appParams = {};
      var spParams = {};

      if (options) {
        if (options.name) {
          appParams.displayName = options.name;
        }

        if (options.password) {
          spParams.passwordCredentials = [{
            startDate: startDate,
            endDate: endDate,
            keyId: utils.uuidGen(),
            value: options.password
          }];
        } else if (options.certValue) {
          spParams.keyCredentials = [{
            startDate: startDate,
            endDate: endDate,
            keyId: utils.uuidGen(),
            value: options.certValue,
            usage: keyUsage,
            type: keyType
          }];
        }
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);

      var application = null;
      var applications = [];
      var applicationObjectId;
      var servicePrincipal;
      try {
        servicePrincipal = client.servicePrincipals.get(objectId, _);
        if (!servicePrincipal) {
          throw new Error($(util.format('A ServicePrincipal with the provided objectId: \'%s\' was not found. Hence the ServicePrincipal cannot be updated. ' +
            'If you are not sure, then please execute \'azure ad sp list\' and find out the correct objectId.', objectId)));
        }

        if (options.password) {
          withProgress(util.format($('Updating password credential for the ServicePrincipal with objectId: \'%s\'.'), objectId),
          function (log, _) {
            client.servicePrincipals.updatePasswordCredentials(objectId, spParams.passwordCredentials, _);
          }, _);
        }

        if (options.certValue) {
          withProgress(util.format($('Updating cert credential for the ServicePrincipal with objectId: \'%s\'.'), objectId),
          function (log, _) {
            client.servicePrincipals.updateKeyCredentials(objectId, spParams.keyCredentials, _);
          }, _);
        }

        if (options.name) {
          applicationId = servicePrincipal.appId;
          var parameters = { filter: 'appId eq \'' + applicationId + '\'' };
          applications = client.applications.list(parameters, _);
          if (!applications || (applications && applications.length === 0)) {
            throw new Error($(util.format('The retrieved applicationId: \'%s\' for the service principal with objectId: \'%s\' was not found. Hence the ' +
              'ServicePrincipal cannot be updated. If you are not sure, then please execute \'azure ad app list\' and find out whether the underlying ' +
              'application actually exists.', applicationId, objectId)));
          }

          applicationObjectId = applications[0].objectId;

          application = withProgress(util.format($('Updating the underlying application with objectId: \'%s\', for the ServicePrincipal with objectId: \'%s\'.'), applicationObjectId, objectId),
          function (log, _) {
            return client.applications.patch(applicationObjectId, appParams, _);
          }, _);

          servicePrincipal = client.servicePrincipals.get(objectId, _);
        }
      } catch (ex) {
        if (ex.statusCode && ex.statusCode === 403) {
          // Check if the User is a Guest user
          var currentUserObject = client.objects.getCurrentUser(_);
          if (currentUserObject && currentUserObject.userType && currentUserObject.userType === 'Guest') {
            throw new Error($('Updating the ServicePrincipal is not allowed for a Guest user. Please contact your administrator to be added as a member in your tenant.'));
          }
        }
        throw ex;
      }

      cli.interaction.formatOutput(servicePrincipal, function (data) {
        if (data) {
          adUtils.displayAServicePrincipal(data, log);
        }
      });
    });

  adSP.command('delete [objectId]')
    .description($('Deletes Active Directory service principal.'))
    .usage('[options] <objectId>')
    .option('-o --objectId <objectId>', $('the object id of the service principal to delete'))
    .option('-d --delete-application', $('Default value: false. If you want to delete the underlying application then set this flag.'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function (objectId, options, _) {
      if (!objectId) {
        return cli.missingArgument('objectId');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete service principal %s? [y/n] '), objectId), _)) {
        return;
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress(util.format($('Deleting service principal %s'), objectId));
      try {
        if (options.deleteApplication) {
          var servicePrincipal = client.servicePrincipals.get(objectId, _);
          var parameters = { filter: 'appId eq \'' + servicePrincipal.appId + '\'' };
          var applications = client.applications.list(parameters, _);
          var applicationObjectId = applications[0].objectId;
          client.applications.deleteMethod(applicationObjectId, _);
        } else {
          log.info('Deleting the underlying application.');
          client.servicePrincipals.deleteMethod(objectId, _);
        }
      } finally {
        progress.end();
      }
    });
};