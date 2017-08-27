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

var util = require('util');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var moment = require('moment');
var $ = utils.getLocaleString;

exports.getADGraphClient = function getADGraphClient(subscription) {
  return utils.createGraphManagementClient(subscription);
};

exports.createApplication = function (cli, name, homePage, identifierUris, options, _) {
  if (!name) {
    return cli.missingArgument('name');
  }

  if (!homePage) {
    return cli.missingArgument('home-page');
  }

  if (!identifierUris) {
    return cli.missingArgument('identifier-uris');
  }

  if (options.password && options.certValue) {
    throw new Error($('specify either --password or --cert-value, but not both.'));
  }

  var available = false;
  if (options.available) {
    if (options.available.toLowerCase() === 'true') {
      available = true;
    }
    else if (options.available.toLowerCase() === 'false') {
      available = false;
    } else {
      throw new Error($('Invalid value for --available parameter. Please specify "true" for a multi-tenant application or "false" for a single-tenant application.'));
    }
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

  var uris = identifierUris ? identifierUris.split(',') : [];

  var appParams = {
    availableToOtherTenants: available,
    displayName: name,
    homepage: homePage,
    identifierUris: uris
  };

  if (options.replyUrls) {
    appParams.replyUrls = options.replyUrls.split(',');
  }

  if (options.password) {
    appParams.passwordCredentials = [{
      startDate: startDate,
      endDate: endDate,
      keyId: utils.uuidGen(),
      value: options.password
    }];
  } else if (options.certValue) {
    appParams.keyCredentials = [{
      startDate: startDate,
      endDate: endDate,
      keyId: utils.uuidGen(),
      value: options.certValue,
      usage: keyUsage,
      type: keyType
    }];
  }

  var subscription = profile.current.getSubscription(options.subscription);
  var client = exports.getADGraphClient(subscription);

  var application = exports.createApplicationWithParameters(cli, client, appParams, _);
  return application;
};

exports.createApplicationWithParameters = function(cli, client, appParams, _) {

  var application = null;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);
  try {
    application = withProgress(util.format($('Creating application %s'), appParams.displayName),
      function(log, _) {
        return client.applications.create(appParams, _);
      }, _);
    return application;
  } catch (ex) {
    if (ex.statusCode && ex.statusCode === 403) {
      // Check if the User is a Guest user
      var currentUserObject = client.objects.getCurrentUser(_);
      if (currentUserObject && currentUserObject.userType && currentUserObject.userType === 'Guest') {
        throw new Error($('Creating an application is not allowed for a Guest user. Please contact your administrator to be added as a member in your tenant.'));
      }
    }
    throw ex;
  }
};

exports.createApplicationCredential = function(client, objectId, password, certValue, startDate, endDate, _) {

  startDate = startDate ? new Date(Date.parse(startDate)) : new Date(Date.now());
  endDate = (function() {
    if (endDate) {
      return new Date(Date.parse(endDate));
    } else {
      var date = new Date(startDate);
      var m = moment(date);
      m.add(1, 'years');
      date = new Date(m.toISOString());
      return date;
    }
  })();

  var credential = null;

  if (password) {
    // Create password credential
    var passwordCredential = {
      startDate: startDate,
      endDate: endDate,
      keyId: utils.uuidGen(),
      value: password
    };

    var passwordCredentials = exports.getAppPasswordCredentials(client, objectId, _);
    passwordCredentials.push(passwordCredential);

    client.applications.updatePasswordCredentials(objectId, passwordCredentials, _);
    credential = passwordCredential;
  } else if (certValue) {

    // Create KeyCredential
    var keyCredential = {
      startDate: startDate,
      endDate: endDate,
      keyId: utils.uuidGen(),
      value: certValue,
      usage: 'Verify',
      type: 'AsymmetricX509Cert'
    };

    var keyCredentials = exports.getAppKeyCredentials(client, objectId, _);
    keyCredentials.push(keyCredential);

    client.applications.updateKeyCredentials(objectId, keyCredentials, _);
    credential = keyCredential;
  }

  return credential;
};

exports.getAppKeyCredentials = function(client, appObjectId, _) {
  return client.applications.listKeyCredentials(appObjectId, _);
};

exports.getAppPasswordCredentials = function(client, appObjectId, _) {
  return client.applications.listPasswordCredentials(appObjectId, _);
};

exports.getObjectId = function (principal, graphClient, throwIfNoOption, shouldRetrieveObjectType, objectType, _) {
  if (principal.objectId) {
    // get object type if requested
    if (shouldRetrieveObjectType) {
      var objects = exports.getObjectsByObjectIds(graphClient, new Array(principal.objectId), true, _);
      if (objects && objects.length > 0) {
        objectType.value = objects[0].objectType;
      }
    }

    return principal.objectId;
  }

  var parameters = null;
  if (principal.signInName) {
    parameters = { filter: 'userPrincipalName eq \'' + principal.signInName + '\'' };
    var users = graphClient.users.list(parameters, _);
    if (users.length > 0) {
      objectType.value = 'user';
      return users[0].objectId;
    } else {
      throw new Error($('Invalid user signInName')); 
    }
  }

  if (principal.spn) {
    parameters = { filter: 'servicePrincipalNames/any(c:c eq \'' + principal.spn + '\')' };
    var servicePrincipals = graphClient.servicePrincipals.list(parameters, _);

    if (servicePrincipals.length > 0) {
      objectType.value = 'servicePrincipal';
      return servicePrincipals[0].objectId;
    } else {
      throw new Error($('Invalid service principal name'));
    }
  }
  if (throwIfNoOption) {
    throw new Error($('Failed to retrieve Active Dirctory Object Id'));
  } else {
    objectType.value = '';
    return '';
  }
};

/* <summary>
 * The graph getobjectsbyObjectId API supports 1000 objectIds per call.
 * Due to this we are batching objectIds by chunk size of 1000 per APi call if it exceeds 1000
 * </summary>
 */
exports.getObjectsByObjectIds = function (graphClient, objectIds, throwOnError, _) {
  var objects = [];
  if (!objectIds || !objectIds.length || objectIds.length === 0) {
    return objects;
  }
  var endIndex;
  try {
    for(var i=0 ;i<objectIds.length; i+=1000){
        var resultObject;
        if((i+1000) > objectIds.Count){
          endIndex = objectIds.length;
        }
        else{
          endIndex = i+1000;
        }
        resultObject=graphClient.objects.getObjectsByObjectIds({ objectIds: objectIds.slice(i, endIndex), includeDirectoryObjectReferences: true }, _);
        if(resultObject)
        {
          objects=objects.concat(resultObject);
        }
    }
  } catch (ex) {
    if (throwOnError === true) {
      throw ex;
    }
  }

  return objects;
};

exports.validateParameters = function (parameters, throwOnNoValues) {
  throwOnNoValues = (typeof throwOnNoValues !== 'undefined' ? throwOnNoValues : true);
  var parameterNames = Object.keys(parameters);

  //empty object is fine.
  if (parameterNames.length === 0) {
    return;
  }

  var values = parameterNames.filter(function (p) {
    return (!!parameters[p]);
  });

  if (values.length === 0 && throwOnNoValues) {
    throw new Error(util.format(('Please provide a value to one of the parameters \'%s\''), parameterNames.join()));
  }

  if (values.length > 1) {
    throw new Error(util.format($('You can only specify value to one of \'%s\''), values.join()));
  }
};

exports.listGraphObjects = function (client, objectType, interaction, log, isJsonMode, _) {
  function displayObjects(objects) {
    if (objects.length === 0) {
      return;
    }
    if (utils.ignoreCaseEquals(objectType, 'user')) {
      exports.displayUsers(objects, interaction, log);
    } else if (utils.ignoreCaseEquals(objectType, 'group')) {
      exports.displayGroups(objects, interaction, log);
    } else if (utils.ignoreCaseEquals(objectType, 'servicePrincipal')) {
      exports.displayServicePrincipals(objects, interaction, log);
    }
  }

  var operationsSuffix = 's';
  var response = client[objectType + operationsSuffix].list(null, _);
  var nextLink = response.odatanextLink;
  if (isJsonMode) {
    while (nextLink) {
      var response2 = client[objectType + operationsSuffix].listNext(nextLink, _);
      // merge new objects to the existing array
      response = response.concat(response2);
      nextLink = response2.odatanextLink;
    }
    displayObjects(response);
  } else {
    displayObjects(response);
    while (nextLink) {
      response = client[objectType + operationsSuffix].listNext(nextLink, _);
      nextLink = response.odatanextLink;
      displayObjects(response);
    }
  } 
};

exports.listGroupMembers = function (client, groupId, interaction, log, isJsonMode, _) {
  var groupMembers = client.groups.getGroupMembers(groupId, _);
  var nextLink = groupMembers.odatanextLink;
  if (isJsonMode) {
    while (nextLink) {
      var groupMembers2 = client.groups.getGroupMembersNext(nextLink, _);
      // merge new objects to the existing array
      groupMembers = groupMembers.concat(groupMembers2);
      nextLink = groupMembers2.odatanextLink;
    }
    exports.displayGroupMembers(groupMembers, interaction, log);
  } else {
    exports.displayGroupMembers(groupMembers, interaction, log);
    while (nextLink) {
      groupMembers = client.groups.getGroupMembersNext(nextLink, _);
      nextLink = groupMembers.odatanextLink;
      exports.displayGroupMembers(groupMembers, interaction, log);
    }
  }
};

exports.getObjectIdFromApplicationId = function (client, applicationId, _) {

  var parameters = { filter: 'appId eq \'' + applicationId + '\'' };
  var applications = client.applications.list(parameters, _);
  var objectId;
  if (applications && applications.length > 0) {
    objectId = applications[0].objectId;
  }

  return objectId;
};

exports.displayApplications = function (applications, interaction, log) {
  interaction.formatOutput(applications, function (data) {
    for (var i = 0; i < data.length; i++) {
      exports.displayAApplication(data[i], log);
      log.data('');
    }
  });
};

exports.displayCredentials = function (credentials, interaction, log) {
  interaction.formatOutput(credentials, function (data) {
    for (var i = 0; i < data.length; i++) {
      exports.displayCredential(data[i], log);
      log.data('');
    }
  });
};

exports.displayUsers = function (users, interaction, log) {
  interaction.formatOutput(users, function (data) {
    for (var i = 0; i < data.length; i++) {
      exports.displayAUser(data[i], log);
      log.data('');
    }
  });
};

exports.displayGroups = function (groups, interaction, log) {
  interaction.formatOutput(groups, function (data) {
    for (var i = 0; i < data.length; i++) {
      exports.displayAGroup(data[i], log);
      log.data('');
    }
  });
};

exports.displayServicePrincipals = function (servicePrincipals, interaction, log) {
  interaction.formatOutput(servicePrincipals, function (data) {
    for (var i = 0; i < data.length; i++) {
      exports.displayAServicePrincipal(data[i], log);
      log.data('');
    }
  });
};

exports.displayAServicePrincipal = function (servicePrincipal, log, showType) {
  log.data($('Object Id:              '), servicePrincipal.objectId);
  log.data($('Display Name:           '), servicePrincipal.displayName);
  log.data($('Service Principal Names:'));
  servicePrincipal.servicePrincipalNames.forEach(function (name) {
    log.data($('                        '), name);
  });
  if (showType) {
    log.data($('Object Type:          '), 'ServicePrincipal');
  }
};

exports.displayAUser = function (user, log, showType) {
  log.data($('Object Id:      '), user.objectId);
  log.data($('Principal Name: '), user.userPrincipalName);
  log.data($('Display Name:   '), user.displayName);
  if (user.mail || user.signInName) {
    log.data($('E-Mail:         '), user.mail || user.signInName);
  }
  if (user.mailNickname) {
    log.data($('Mail Nickname:  '), user.mailNickname);
  }
  if (showType) {
    log.data($('Object Type:    '), 'User');
  }
};

exports.displayAApplication = function (application, log) {
  log.data($('AppId:                  '), application.appId);
  log.data($('ObjectId:               '), application.objectId);
  log.data($('DisplayName:            '), application.displayName);
  log.data($('IdentifierUris:         '), application.identifierUris);
  log.data($('ReplyUrls:              '), application.replyUrls);
  log.data($('AvailableToOtherTenants:'), application.availableToOtherTenants ? 'True' : 'False');
  if (application.homepage) {
    log.data($('HomePage:               '), application.homepage);
  }
  if (application.appPermissions) {
    log.data($('AppPermissions:       '));
    Object.keys(application.appPermissions).forEach(function (item) {
      if (application.appPermissions[item]) {
        Object.keys(application.appPermissions[item]).forEach(function (subItem) {
          log.data($('                         ' + subItem + ': '), application.appPermissions[item][subItem]);
        });
      }
    });
  }
};

exports.displayCredential = function (credential, log) {
  log.data($('StartDate:              '), credential.startDate.toISOString());
  log.data($('EndDate:                '), credential.endDate.toISOString());
  log.data($('KeyId:                  '), credential.keyId);
  log.data($('Type:                   '), credential.type ? credential.type : 'Password');
};

exports.displayGroupMembers = function (members, interaction, log) {
  interaction.formatOutput(members, function (data) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].objectType === 'User') {
        exports.displayAUser(data[i], log, true);
      } else if (data[i].objectType === 'Group') {
        exports.displayAGroup(data[i], log, true);
      } else {
        log.warn('an unexpected object type:' + data[i].objectType);
      }
      log.data('');
    }
  });
};

exports.displayAGroup = function(group, log, showType) {
  log.data($('Display Name:     '), group.displayName);
  log.data($('ObjectId:         '), group.objectId);
  log.data($('Security Enabled: '), group.securityEnabled);
  log.data($('Mail Enabled:     '), group.mailEnabled || 'false');
  if (showType) {
    log.data($('Object Type:      '), 'Group');
  }
};
