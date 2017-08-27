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
var adUtils = require('./adUtils');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var util = require('util');
var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);

  var ad = cli.category('ad')
    .description($('Commands to display Active Directory objects'));
  var adUser = ad.category('user')
    .description($('Commands to display Active Directory users'));

  adUser.command('list')
    .description($('Get all Active Directory users in current subscription\'s tenant. When --json flag is used, it will get the information from all the pages and then provide the final json array.'))
    .option('| more', $('Provides paging support. Press \'Enter\' for more information.'))
    .execute(function (options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Listing Active Directory users'));
      try {
        adUtils.listGraphObjects(client, 'user', cli.interaction, log, options.json, _);
      } finally {
        progress.end();
      }
    });

  adUser.command('show')
    .description($('Get an Active Directory user'))
    .option('-u --upn <upn>', $('the principal name of the user to return'))
    .option('-o --objectId <objectId>', $('the object id of the user to return'))
    .option('-c --search <search>', $('search users with display name starting with the provided value'))
    .execute(function (options, _) {
      var upn = options.upn,
          objectId = options.objectId,
          search = options.search;

      adUtils.validateParameters({
        upn: upn,
        objectId: objectId,
        search: search
      });
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Getting Active Directory user'));
      var users = [];
      var parameters = null;
      try {
        if (upn) {
          parameters = { filter: 'userPrincipalName eq \'' + upn + '\'' };
          users = client.users.list(parameters, _);
        } else if (objectId) {
          var user = client.users.get(objectId, _);
          if (user) {
            users.push(user);
          }
        } else {
          parameters = { filter: 'startswith(displayName,\'' + search + '\')' };
          users = client.users.list(parameters, _);
        }
      } finally {
        progress.end();
      }

      if (users.length > 0) {
        adUtils.displayUsers(users, cli.interaction, log);
      } else {
        log.error($('No matching user was found'));
      }
    });

  adUser.command('delete [upn-or-objectId]')
    .description($('Deletes Active Directory user (work/school account also popularly known as org-id).'))
    .usage('[options] <upn-or-objectId>')
    .option('-u --upn-or-objectId <upn-or-objectId>', $('the user principal name or the objectId.'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation).'))
    .execute(function (upnOrObjectId, options, _) {
      if (!upnOrObjectId) {
        return cli.missingArgument('upn-or-objectId');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete user: \'%s\' ? [y/n] '), upnOrObjectId), _)) {
        return;
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress(util.format($('Deleting user: \'%s\''), upnOrObjectId));
      try {
        client.users.deleteMethod(upnOrObjectId, _);
      } finally {
        progress.end();
      }
    });

  adUser.command('create [upn] [display-name] [mail-nickname] [password]')
    .description($('Create Active Directory user (work/school account also popularly known as org-id). ' + 
      'For more information: https://msdn.microsoft.com/en-us/library/azure/ad/graph/api/users-operations#CreateUser'))
    .usage('[options] <upn> <display-name> <mail-nickname> <password>')
    .option('-u --upn <upn>', $('the user principal name. example - \'someuser@contoso.com\'.'))
    .option('-i --immutableId <immutableId>', $('It needs to be specified only if you are using a federated domain for the user\'s user principal name (upn) property.'))
    .option('-d --display-name <display-name>', $('the name to display in the address book for the user. example \'Alex Wu\''))
    .option('-m --mail-nickname <mail-nickname>', $('the mail alias for the user. example: \'Alexw\'.'))
    .option('-p --password <password>', $('password for the user. It must meet the tenant\'s password complexity requirements. It is recommended to set a strong password.'))
    .option('-f --force-change-password-next-login', $('It must be specified if the user must change the password on the next successful login (true). '+ 
      'Default behavior is (false) to not change the password on the next successful login.'))
    .execute(function (upn, displayName, mailNickname, password, options, _) {
      if (!upn) {
        return cli.missingArgument('upn');
      }

      if (!displayName) {
        return cli.missingArgument('display-name');
      }

      if (!mailNickname) {
        return cli.missingArgument('mail-nickname');
      }

      if (!password) {
        return cli.missingArgument('password');
      }
      var forceChangePasswordNextLogin = false;
      if (options && options.forceChangePasswordNextLogin) {
        forceChangePasswordNextLogin = true;
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);

      var userParams = {
        accountEnabled: true,
        userPrincipalName: upn,
        displayName: displayName,
        mailNickname: mailNickname,
        passwordProfile: {
          password: password,
          forceChangePasswordNextLogin: forceChangePasswordNextLogin
        }
      };

      if (options && options.immutableId) {
        userParams.immutableId = options.immutableId;
      }

      var user = withProgress(util.format($('Creating Active Directory user: \'%s\'.'), upn),
      function (log, _) {
        return client.users.create(userParams, _);
      }, _);
      cli.interaction.formatOutput(user, function (data) {
        if (data) {
          adUtils.displayAUser(data, log, true);
        }
      });
    });

  adUser.command('set [upn-or-objectId]')
    .description($('Update an existing Active Directory user (work/school account also popularly known as org-id). ' + 
      'For more information: https://msdn.microsoft.com/en-us/library/azure/ad/graph/api/users-operations#UpdateUser'))
    .usage('[options] <upn-or-objectId>')
    .option('-u --upn-or-objectId <upn-or-objectId>', $('the user principal name (\'someuser@contoso.com\') or the objectId (a Guid) for which the properties need to be updated.'))
    .option('-a --enable-account <enable-account>', $('true for enabling the account; otherwise, false.'))
    .option('-d --display-name <display-name>', $('new name to display in the address book for the user. example \'Alex Wu\''))
    .option('-m --mail-nickname <mail-nickname>', $('new mail alias for the user. example: \'Alexw\'.'))
    .option('-p --password <password>', $('new password for the user. It must meet the tenant\'s password complexity requirements. It is recommended to set a strong password.'))
    .option('-f --force-change-password-next-login', $('It must be specified only when you are updating the password. Otherwise it will be ignored. ' + 
      'It must be specified if the user must change the password on the next successful login (true). Default behavior is (false) to not change the password on the next successful login.'))
    .execute(function (upnOrObjectId, options, _) {
      if (!options) options = {};
      if (!upnOrObjectId) {
        return cli.missingArgument('upn-or-objectId');
      }
      var displayName = options.displayName,
        mailNickname = options.mailNickname,
        password = options.password,
        accountEnabled = options.enableAccount,
        userUpdateParams = {};

      if (displayName) {
        userUpdateParams.displayName = displayName;
      }

      if (mailNickname) {
        userUpdateParams.mailNickname = mailNickname;
      }

      if (accountEnabled) {
        if (accountEnabled.toLowerCase() === 'true' || accountEnabled.toLowerCase() === 'false') {
          userUpdateParams.accountEnabled = accountEnabled.toLowerCase() === 'true' ? true : false;
        } else {
          throw new Error(util.format('Valid values for --enable-account are: true, false. The provides value %s is invalid.', accountEnabled));
        }
      }

      if (password) {
        userUpdateParams.passwordProfile = {};
        userUpdateParams.passwordProfile.password = password;
        var forceChangePasswordNextLogin = false;
        if (options && options.forceChangePasswordNextLogin) {
          forceChangePasswordNextLogin = true;
        }
        userUpdateParams.passwordProfile.forceChangePasswordNextLogin = forceChangePasswordNextLogin;
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress(util.format($('Updating Active Directory user: \'%s\'.'), upnOrObjectId));
      try {
        client.users.update(upnOrObjectId, userUpdateParams, _);
      } finally {
        progress.end();
      }
    });

  var adMemberGroups = adUser.category('memberGroups')
    .description($('Commands to display member groups of the Active Directory user.'));

  adMemberGroups.command('list [objectId]')
    .description($('Provides a lit of Object IDs of the groups of which the user is a member.'))
    .usage('[options] <objectId>')
    .option('-o --objectId <objectId>', $('the objectId of the user'))
    .option('-e --securityEnabledOnly', $('If true, only membership in security enabled groups will be checked. Otherwise membership in all groups will be checked. Default: false'))
    .execute(function (objectId, options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      if (!objectId) {
        return cli.missingArgument('objectId');
      }
      var securityEnabledOnly = false;
      if (options && options.securityEnabledOnly) {
        securityEnabledOnly = true;
      }

      var groups = withProgress($('Getting member groups for the user: ' + objectId),
      function (log, _) {
        return client.users.getMemberGroups(objectId, securityEnabledOnly, _);
      }, _);

      if (groups.length === 0) {
        if (options.json) {
          log.json(groups);
        } else {
          log.data('No member groups found.');
        }
      }

      for (var i=0; i < groups.length; i++) {
        var group = client.groups.get(groups[i], _);
        adUtils.displayGroupMembers([group], cli.interaction, log, _);
      }
    });
};