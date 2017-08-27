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
* You can test sample commands get loaded by xplat by following steps:
* a. Copy the folder to '<repository root>\lib\commands\arm'
* b. Under <repository root>, run 'node bin/azure config mode arm'
* c. Run 'node bin/azure', you should see 'sample' listed as a command set
* d. Run 'node bin/azure', you should see 'create', "delete", etc 
      showing up in the help text 
*/
'use strict';

var util = require('util');
var cdnManagementUtil = require('./cdnmanagement.utils');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var tagUtils = require('../tag/tagUtils');

var $ = utils.getLocaleString;

exports.init = function(cli) {
  var log = cli.output;

  var cdn = cli.category('cdn')
    .description($('Commands to manage Azure Content Delivery Network (CDN)'));

  //================================================================================================================================
  //Profiles opertaion
  var profiles = cdn.category('profile')
    .description($('Commands to manage your Azure cdn profiles'));

  // List Profiles
  profiles.command('list')
    .description($('List all profiles under the current subscription'))
    .usage('[options] [resource-group]')
    .option('-g, --resource-group [resource-group]', $('Name of the Resource Group'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(options, _) {

      /////////////////////////
      // Create the client.  //
      /////////////////////////
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createCdnManagementClient(subscription);

      var operation;
      if (options.resourceGroup) {
        operation = client.profiles.listByResourceGroup(options.resourceGroup, _);
      } else {
        operation = client.profiles.list(_);
      }

      var progress = cli.interaction.progress(util.format($('Listing Cdn profile(s)')));
      var result;
      try {
        result = operation;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function() {
        if (!result || result.length === 0) {
          log.info($('No profiles found.'));
        } else {
          log.table(result, function(row, profile) {
            row.cell($('Name'), profile.name);
            row.cell($('ResourceGroup'), cdnManagementUtil.getResourceGroupFromProfileId(profile.id));
            row.cell($('Location'), profile.location);
            row.cell($('Tags'), tagUtils.getTagsInfo(profile.tags));
            row.cell($('ProvisioningState'), profile.provisioningState);
            row.cell($('ResourceState'), profile.resourceState);
            row.cell($('Sku'), profile.sku.name);
            row.cell($('Subscription'), subscription.id);
          });
        }
      });
    });

  // Get profile
  profiles.command('show [name] [resource-group]')
    .description($('Show the infomation of a specific cdn profile'))
    .usage('[options] <name> <resource-group>')
    .option('-n, --name <name>', $('Name of the Cdn Profile'))
    .option('-g, --resource-group <resource-group>', $('Name of the Resource Group'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

	  name = cli.interaction.promptIfNotGiven($('Profile name: '), name, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////
      var subscription = profile.current.getSubscription(options.subscription);
	  
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Get cdn profile %s ...'), name));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.profiles.get(resourceGroup, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }
	  
      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No profile named %s found.'), name);
        } else {
          log.data('');
          log.data($('Profile name :'), result.name);
          log.data('');
          log.data($('Resource Group     :'), resourceGroup);
          log.data($('Location           :'), result.location);
          log.data($('ResourceState      :'), result.resourceState);
          log.data($('ProvisioningState  :'), result.provisioningState);
          log.data($('Sku                :'), result.sku.name);
          log.data($('Tags               :'), tagUtils.getTagsInfo(result.tags));
          log.data($('Id                 :'), result.id);
          log.data('');
        }
      });
    });

  // Create Profile
  profiles.command('create [name] [resource-group] [location] [sku-name]')
    .description($('Create a profile under given resource group and subscription'))
    .usage('[options] <name> <resource-group> <location> <sku-name> [tags]')
    .option('-n, --name <name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile will be created in'))
    .option('-l, --location <location>', $('The location in which to create the Cdn Profile'))
    .option('-k, --sku-name <sku-name>', $('The pricing sku name of the Azure Cdn Profile'))
    .option('-t, --tags [tags]', $('Tags to set to the profile. Can be multiple. ' +
      'In the format of \'name=value\'. Name is required and value is optional.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, resourceGroup, location, skuName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        profileName: name,
        options: options
      }));

	  name = cli.interaction.promptIfNotGiven($('Profile name: '), name, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
	  location = cli.interaction.promptIfNotGiven($('Profile location: '), location, _);	  
	  skuName = cli.interaction.promptIfNotGiven($('Profile skuName name: '), skuName, _);

      var tags = {};
      tags = tagUtils.buildTagsParameter(tags, options);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createCdnManagementClient(subscription);

      /////////////////////////
      // Prepare properties. //
      /////////////////////////
      var creationParameter = {
        location: location,
        sku: {
          name: skuName
        },
        tags: tags
      };

      var progress = cli.interaction.progress(util.format($('Attempting to create cdn profile %s ...'), name));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.profiles.create(resourceGroup, name, creationParameter, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No profile information available'));
        } else {
          log.data('');
          log.data($('Profile name :'), result.name);
          log.data('');
          log.data($('Resource Group     :'), resourceGroup);
          log.data($('Location           :'), result.location);
          log.data($('ResourceState      :'), result.resourceState);
          log.data($('ProvisioningState  :'), result.provisioningState);
          log.data($('Sku                :'), result.sku.name);
          log.data($('Tags               :'), tagUtils.getTagsInfo(result.tags));
          log.data($('Id                 :'), result.id);
          log.data('');
        }
      });

      if (response.statusCode == 200) {
        log.info('Cdn profile ' + name + ' is getting created...');
      } else {
        log.info('Failed in creating profile ' + name);
      }
    });

  // Delete Profile
  profiles.command('delete [name] [resource-group]')
    .description($('Delete a profile under given resource group and subscription'))
    .usage('[options] <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile will be delete in'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, resourceGroup, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        profileName: name,
        options: options
      }));

      name = cli.interaction.promptIfNotGiven($('Profile name: '), name, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      ////////////////////
      // Delete Tenant. //
      ////////////////////

      var progress = cli.interaction.progress(util.format($('Deleting Cdn Profile %s'), name));
      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.profiles.deleteMethod(resourceGroup, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } finally {
        progress.end();
      }

      if (response.statusCode == 200) {
        log.info('Delete command successfully invoked for Cdn Profile ' + name);
      } else if (response.statusCode == 204) {
        log.info('Delete sucess, but no profile named ' + name + ' was found');
      } else {
        log.info('Error in deleting profile ' + name);
      }
    });

  // Update profile
  profiles.command('set [name] [resource-group]')
    .description($('Update a profile\'s tags'))
    .usage('[options] <name> <resource-group> [tags]')
    .option('-n, --name <name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile will be created in'))
    .option('-t, --tags [tags]', $('Tags to set to the profile. Can be multiple. ' +
      'In the format of \'name=value\'. Name is required and value is optional.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Profile name: '), name, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      var tags = {};
      tags = tagUtils.buildTagsParameter(tags, options);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Attempting to update tags for cdn profile %s ...'), name));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.profiles.update(resourceGroup, name, tags, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No profile information available'));
        } else {
          log.data('');
          log.data($('Profile name :'), result.name);
          log.data('');
          log.data($('Resource Group     :'), resourceGroup);
          log.data($('Location           :'), result.location);
          log.data($('ResourceState      :'), result.resourceState);
          log.data($('ProvisioningState  :'), result.provisioningState);
          log.data($('Sku                :'), result.sku.name);
          log.data($('Tags               :'), tagUtils.getTagsInfo(result.tags));
          log.data($('Id                 :'), result.id);
          log.data('');
        }
      });

      if (response.statusCode == 202 || response.statusCode == 200) {
        log.info('Successfully updated tags of profile ' + name);
	  } else {
        log.info('Failed in updating tags of profile ' + name);
      }
    });
    
  // Check usage command for profile
  profiles.command('checkUsage [name] [resource-group]')
    .description($('List the usages of resources under profile.'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Profile name: '), name, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Listing usages for profile: ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.profiles.listResourceUsage(resourceGroup, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode != 200) {
        log.info('Command invoke failed, please retry');
      } else {
        cli.interaction.formatOutput(result, function() {
          if (!result || result.length === 0) {
            log.info($('No usage record was found.'));
          } else {
            log.table(result, function(row, usage) {
              row.cell($('ResourceType'), usage.resourceType);
              row.cell($('Unit'), usage.unit);
              row.cell($('CurrentValue'), usage.currentValue);
              row.cell($('Limit'), usage.limit);
            });
          }
        });
      }
    });

  //================================================================================================================================
  //SSO Uri operation
  var ssoUri = cdn.category('ssouri')
    .description($('Commands to generate sso uri of your Azure cdn profiles'));

  // Generate profile sso uri
  ssoUri.command('create [profile-name] [resource-group]')
    .description($('Create sso uri of the profile'))
    .usage('[options] <profile-name> <resource-group>')
    .option('-n, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(profileName, resourceGroup, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Generating Cdn profile(s) sso uri')));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.profiles.generateSsoUri(resourceGroup, profileName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      log.info($('Sso uri of profile ' + profileName + ' is:\n ' + result.ssoUriValue));
    });

  //==================================================================================================================================
  //Endpoint operation
  var endpoint = cdn.category('endpoint')
    .description($('Commands to manage Azure cdn profile endpoints'));

  //List Endpoint
  endpoint.command('list [profile-name] [resource-group]')
    .description($('List endpoints by profile and resource group'))
    .usage('[options] <profile-name> <resource-group>')
    .option('-n, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Listing endpoints...')));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.listByProfile(resourceGroup, profileName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function() {
        if (!result || result.length === 0) {
          log.info($('No endpoints found.'));
        } else {
          log.table(result, function(row, endpoint) {
            row.cell($('Name'), endpoint.name);
            row.cell($('ProfileName'), profileName);
            row.cell($('ResourceGroup'), resourceGroup);
            row.cell($('Subscription'), subscription.id);
            row.cell($('Location'), endpoint.location);
            row.cell($('Tags'), tagUtils.getTagsInfo(endpoint.tags));
          });
        }
      });
    });

  //Get endpoint
  endpoint.command('show [name] [profile-name] [resource-group]')
    .description($('Get endpoint by endpoint name, profile name, and resource group'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

	  name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Getting endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.get(resourceGroup, profileName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }
	  
      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No endpoint named %s found.'), profileName);
        } else {
          log.data('');
          log.data($('Endpoint name                  :'), result.name);
          log.data('');
          log.data($('Profile name                   :'), profileName);
          log.data($('Resource Group                 :'), resourceGroup);
          log.data($('Location                       :'), result.location);
          log.data($('Tags                           :'), tagUtils.getTagsInfo(result.tags));
          log.data($('Host Name                      :'), result.hostName);
          log.data($('Origin Host Header             :'), result.originHostHeader);
          log.data($('Origin Path                    :'), result.originPath);
          log.data($('Content Types To Compress      :'), result.contentTypesToCompress.join(','));
          log.data($('Is Compression Enabled         :'), result.isCompressionEnabled);
          log.data($('Is Http Allowed                :'), result.isHttpAllowed);
          log.data($('Is Https Allowed               :'), result.isHttpsAllowed);
          log.data($('Query String Caching Behavior  :'), result.queryStringCachingBehavior);
          log.data($('Origin Names                   :'), cdnManagementUtil.getOriginNamesString(result.origins));
          log.data($('OptimizationType               :'), result.optimizationType);
          log.data($('Number of geo filters          :'), result.geoFilters.length);
          log.data($('Resource State                 :'), result.resourceState);
          log.data($('Provisioning State             :'), result.provisioningState);
          log.data('');
        }
      });
    });

  //Create endpoint
  endpoint.command('create [name] [profile-name] [resource-group] [location] [origin-name] [origin-host-name]')
    .description($('Create endpoint with given name and properties.'))
    .usage('[options] <name> <profile-name> <resource-group> <location> <origin-name> <origin-host-name> [origin-host-header] [origin-path] [content-type-to-compress] [is-compression-enabled] [is-http-allowed] [is-https-allowed] [query-string-caching-behavior]  [http-port] [https-port] [tags]')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-l, --location <location>', $('The location of the Cdn endpoint'))
    .option('-o, --origin-name <origin-name>', $('The name of the origin used to identify the origin'))
    .option('-r, --origin-host-name <origin-host-name>', $('The host name of the origin'))
    .option('-e, --origin-host-header [origin-host-header]', $('The origin host header of the Azure Cdn Endpoint'))
    .option('-i, --origin-path [origin-path]', $('The origin path Azure Cdn Endpoint'))
    .option('-c, --content-types-to-compress [content-types-to-compress]', $('The list of mime types that need to be compressed by Cdn edge nodes'))
    .option('-d, --is-compression-enabled [is-compression-enabled]', $('Is the compression enabled for the Cdn. Valid input: -d [true|false]'))
    .option('-w, --is-http-allowed [is-http-allowed]', $('Is the http traffic allowed for the Cdn. Valid input: -w [true|false]'))
    .option('-a, --is-https-allowed [is-https-allowed]', $('Is the https traffic allowed for the Cdn. Valid input: -a [true|false]'))
    .option('-q, --query-string-caching-behavior [query-string-caching-behavior]', $('The way Cdn handles requests with query string'))
    .option('-u, --http-port [http-port]', $('The port http traffic used on the origin server'))
    .option('-f, --https-port [https-port]', $('The port https traffic used on the origin server'))
    .option('-t, --tags [tags]', $('The tags to associate with the Azure Cdn Endpoint'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, location, originName, originHostName, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
      location = cli.interaction.promptIfNotGiven($('Endpoint location: '), location, _);
      originName = cli.interaction.promptIfNotGiven($('Origin name: '), originName, _);	  
      originHostName = cli.interaction.promptIfNotGiven($('Origin host name: '), originHostName, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var tags = {};
      tags = tagUtils.buildTagsParameter(tags, options);

      var contentTypesToCompress = options.contentTypesToCompress ? options.contentTypesToCompress.split(',') : [];

      var endpointCreateParameters = {
        contentTypesToCompress: contentTypesToCompress,
        location: location,
        originHostHeader: options.originHostHeader,
        originPath: options.originPath,
        origins: [{
          name: originName,
          hostName: originHostName,
          httpPort: parseInt(options.httpPort),
          httpsPort: parseInt(options.httpsPort)
        }],
        queryStringCachingBehavior: options.queryStringCachingBehavior,
        tags: tags
      };

      if (options.isCompressionEnabled) {
        endpointCreateParameters.isCompressionEnabled = cdnManagementUtil.getBooleanFromString(options.isCompressionEnabled);
      }
      if (options.isHttpAllowed) {
        endpointCreateParameters.isHttpAllowed = cdnManagementUtil.getBooleanFromString(options.isHttpAllowed);
      }
      if (options.isHttpsAllowed) {
        endpointCreateParameters.isHttpsAllowed = cdnManagementUtil.getBooleanFromString(options.isHttpsAllowed);
      }

      var progress = cli.interaction.progress(util.format($('Creating endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.create(resourceGroup, profileName, name, endpointCreateParameters, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('Error creating endpoint %s.'));
        } else {
          log.data('');
          log.data($('Endpoint name                  :'), result.name);
          log.data('');
          log.data($('Profile name                   :'), profileName);
          log.data($('Resource Group                 :'), resourceGroup);
          log.data($('Location                       :'), result.location);
          log.data($('Tags                           :'), tagUtils.getTagsInfo(result.tags));
          log.data($('Host Name                      :'), result.hostName);
          log.data($('Origin Host Header             :'), result.originHostHeader);
          log.data($('Origin Path                    :'), result.originPath);
          log.data($('Content Types To Compress      :'), result.contentTypesToCompress.join(','));
          log.data($('Is Compression Enabled         :'), result.isCompressionEnabled);
          log.data($('Is Http Allowed                :'), result.isHttpAllowed);
          log.data($('Is Https Allowed               :'), result.isHttpsAllowed);
          log.data($('Query String Caching Behavior  :'), result.queryStringCachingBehavior);
          log.data($('Origin Names                   :'), cdnManagementUtil.getOriginNamesString(result.origins));
          log.data($('OptimizationType               :'), result.optimizationType);
          log.data($('Number of geo filters          :'), result.geoFilters.length);
          log.data($('Resource State                 :'), result.resourceState);
          log.data($('Provisioning State             :'), result.provisioningState);
          log.data('');
        }
      });
    });

  //Update Endpoint
  endpoint.command('set [name] [profile-name] [resource-group]')
    .description($('Update endpoint with given properties.'))
    .usage('[options] <name> <profile-name> <resource-group> [origin-host-header] [origin-path] [content-type-to-compress] [is-compression-enabled] [is-http-allowed] [is-https-allowed] [query-string-caching-behavior] [tags]')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-e, --origin-host-header [origin-host-header]', $('The origin host header of the Azure Cdn Endpoint'))
    .option('-i, --origin-path [origin-path]', $('The origin path Azure Cdn Endpoint'))
    .option('-c, --content-types-to-compress [content-types-to-compress]', $('The list of mime types that need to be compressed by Cdn edge nodes'))
    .option('-d, --is-compression-enabled [is-compression-enabled]', $('Is the compression enabled for the Cdn. Valid input: -d [true|false]'))
    .option('-u, --is-http-allowed [is-http-allowed]', $('Is the http traffic allowed for the Cdn. Valid input: -u [true|false]'))
    .option('-w, --is-https-allowed [is-https-allowed]', $('Is the https traffic allowed for the Cdn. Valid input: -w [true|false]'))
    .option('-q, --query-string-caching-behavior [query-string-caching-behavior]', $('The way Cdn handles requests with query string'))
    .option('-t, --tags [tags]', $('The tags to associate with the Azure Cdn Endpoint'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
	  
      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);




      var endpointUpdateParameters = {};

      if (options.originHostHeader) {
        endpointUpdateParameters.originHostHeader = options.originHostHeader;
      }
      if (options.originPath) {
        endpointUpdateParameters.originPath = options.originPath;
      }
      if (options.isCompressionEnabled) {
        endpointUpdateParameters.isCompressionEnabled = cdnManagementUtil.getBooleanFromString(options.isCompressionEnabled);
      }
      if (options.contentTypesToCompress) {
        endpointUpdateParameters.contentTypesToCompress = options.contentTypesToCompress.split(',');
      }
      if (options.isHttpAllowed) {
        endpointUpdateParameters.isHttpAllowed = cdnManagementUtil.getBooleanFromString(options.isHttpAllowed);
      }
      if (options.isHttpsAllowed) {
        endpointUpdateParameters.isHttpsAllowed = cdnManagementUtil.getBooleanFromString(options.isHttpsAllowed);
      }
      if (options.queryStringCachingBehavior) {
        endpointUpdateParameters.queryStringCachingBehavior = options.queryStringCachingBehavior;
      }
      if (options.tags) {
        var tags = {};
        tags = tagUtils.buildTagsParameter(tags, options);
        endpointUpdateParameters.tags = tags;
      }


      var progress = cli.interaction.progress(util.format($('Updating endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.update(resourceGroup, profileName, name, endpointUpdateParameters, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('Error updating endpoint %s.'));
        } else {
          log.data('');
          log.data($('Endpoint name                  :'), result.name);
          log.data('');
          log.data($('Profile name                   :'), profileName);
          log.data($('Resource Group                 :'), resourceGroup);
          log.data($('Location                       :'), result.location);
          log.data($('Tags                           :'), tagUtils.getTagsInfo(result.tags));
          log.data($('Host Name                      :'), result.hostName);
          log.data($('Origin Host Header             :'), result.originHostHeader);
          log.data($('Origin Path                    :'), result.originPath);
          log.data($('Content Types To Compress      :'), result.contentTypesToCompress.join(','));
          log.data($('Is Compression Enabled         :'), result.isCompressionEnabled);
          log.data($('Is Http Allowed                :'), result.isHttpAllowed);
          log.data($('Is Https Allowed               :'), result.isHttpsAllowed);
          log.data($('Query String Caching Behavior  :'), result.queryStringCachingBehavior);
          log.data($('Origin Names                   :'), cdnManagementUtil.getOriginNamesString(result.origins));
          log.data($('OptimizationType               :'), result.optimizationType);
          log.data($('Number of geo filters          :'), result.geoFilters.length);
          log.data($('Resource State                 :'), result.resourceState);
          log.data($('Provisioning State             :'), result.provisioningState);
          log.data('');
        }
      });
    });


  //Delete Endpoint
  endpoint.command('delete [name] [profile-name] [resource-group]')
    .description($('Delete an endpoint by endpoint name, profile name, and resource group'))
    .usage('[options] <ename> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Deleting endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.deleteMethod(resourceGroup, profileName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode == 200) {
        log.info('Delete command successfully invoked for endpoint ' + name);
      } else if (response.statusCode == 204) {
        log.info('Delete sucess, but no endpoint named ' + name + ' was found');
      } else {
        log.info('Error in deleting endpoint ' + name);
      }
    });

  //Start endpoint
  endpoint.command('start [name] [profile-name] [resource-group]')
    .description($('Start an endpoint by endpoint name, profile name, and resource group'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Starting endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.start(resourceGroup, profileName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode == 200) {
        log.info('Command successfully invoked for endpoint ' + name + ' and it is now running');
      } else {
        log.info('Error in starting endpoint ' + name);
      }
    });

  //Stop endpoint
  endpoint.command('stop [name] [profile-name] [resource-group]')
    .description($('Stop an endpoint by endpoint name, profile name, and resource group'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Stopping endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.stop(resourceGroup, profileName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode == 200) {
        log.info('Command successfully invoked for endpoint ' + name + ' and it is now stopped');
      } else {
        log.info('Error in stopping endpoint ' + name);
      }
    });

  //Endpoint Purge Content
  endpoint.command('purge [name] [profile-name] [resource-group] [content-paths]')
    .description($('Purge the content of the given paths in the endpoint'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-c, --content-paths <content-paths>', $('Content paths to be purged'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, contentPaths, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
	  contentPaths = cli.interaction.promptIfNotGiven($('Content paths: '), contentPaths, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var parsedContentPaths = contentPaths ? contentPaths.split(',') : [];

      var progress = cli.interaction.progress(util.format($('Purging content for endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.purgeContent(resourceGroup, profileName, name, parsedContentPaths, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }
    });

  //Endpoint Load Content
  endpoint.command('load [name] [profile-name] [resource-group] [content-paths]')
    .description($('Load the content of the given paths in the endpoint'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-c, --content-paths <content-paths>', $('Content paths to be purged'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, contentPaths, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
      contentPaths = cli.interaction.promptIfNotGiven($('Content paths: '), contentPaths, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var parsedContentPaths = contentPaths ? contentPaths.split(',') : [];

      var progress = cli.interaction.progress(util.format($('Loading content for endpoint named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.loadContent(resourceGroup, profileName, name, parsedContentPaths, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }
    });

  //Endpoint Check Name Availability
  endpoint.command('check [endpoint-name]')
    .description($('Check if the endpoint name has been used or not'))
    .usage('[options] <endpoint-name>')
    .option('-n, --endpoint-name <endpoint-name>', $('Endpoint name'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(endpointName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Checking name availability for ' + endpointName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.checkNameAvailability(endpointName, 'Microsoft.Cdn/Profiles/Endpoints', [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode != 200) {
        log.info('Command invoke failed, please retry');
      } else if (result.nameAvailable) {
        log.info(endpointName + ' is valid to use');
      } else {
        log.info(endpointName + ' is already in use');
      }
    });
    
  
  // Endpoint get usage command  
  endpoint.command('checkUsage [name] [profile-name] [resource-group]')
    .description($('List the usages of resources under endpoint.'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Endpoint name: '), name, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Listing usages for endpoint: ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.listResourceUsage(resourceGroup, profileName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode != 200) {
        log.info('Command invoke failed, please retry');
      } else {
        cli.interaction.formatOutput(result, function() {
          if (!result || result.length === 0) {
            log.info($('No usage record was found.'));
          } else {
            log.table(result, function(row, usage) {
              row.cell($('ResourceType'), usage.resourceType);
              row.cell($('Unit'), usage.unit);
              row.cell($('CurrentValue'), usage.currentValue);
              row.cell($('Limit'), usage.limit);
            });
          }
        });
      }
    });

  //==================================================================================================================================
  //Origin operation
  var origin = cdn.category('origin')
    .description($('Commands to manage Azure cdn profile endpoint origin'));

  //Get Origin
  origin.command('show [name] [endpoint-name] [profile-name] [resource-group]')
    .description($('Get origin by origin name, endpoint name, profile name, and resource group'))
    .usage('[options] <name> <endpoint-name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the origin'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

	  name = cli.interaction.promptIfNotGiven($('Origin name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Getting origin named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.origins.get(resourceGroup, profileName, endpointName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No origin named %s found.'), profileName);
        } else {
          log.data('');
          log.data($('origin name                  :'), result.name);
          log.data('');
          log.data($('endpoint name                  :'), endpointName);
          log.data($('profile name                   :'), profileName);
          log.data($('resource group                 :'), resourceGroup);
          log.data($('type                           :'), result.type);
          log.data($('host name                      :'), result.hostName);
          log.data($('http port                      :'), result.httpPort);
          log.data($('https port                     :'), result.httpsPort);
          log.data($('resource state                 :'), result.resourceState);
          log.data($('provisioning state             :'), result.provisioningState);
          log.data('');
        }
      });
    });

  //Update Origin
  origin.command('set [name] [endpoint-name] [profile-name] [resource-group]')
    .description($('Update origin of the given origin name, endpoint name, profile name, and resource group'))
    .usage('[options] <name> <endpoint-name> <profile-name> <resource-group> [host-name] [http-port] [https-port]')
    .option('-n, --name <name>', $('Name of the origin'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-o, --host-name [host-name]', $('Host name'))
    .option('-r, --http-port [http-port]', $('Http port'))
    .option('-w, --https-port [https-port]', $('Https port'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////
	  
      name = cli.interaction.promptIfNotGiven($('Origin name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var originUpdateParameter = {};
      if (options.hostName) {
        originUpdateParameter.hostName = options.hostName;
      }
      if (options.httpPort) {
        originUpdateParameter.httpPort = parseInt(options.httpPort);
      }
      if (options.httpsPort) {
        originUpdateParameter.httpsPort = parseInt(options.httpsPort);
      }


      var progress = cli.interaction.progress(util.format($('Updating origin named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.origins.update(resourceGroup, profileName, endpointName, name, originUpdateParameter, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No origin named %s found to update.'), profileName);
        } else {
          log.data('');
          log.data($('origin name                  :'), result.name);
          log.data('');
          log.data($('endpoint name                  :'), endpointName);
          log.data($('profile name                   :'), profileName);
          log.data($('resource group                 :'), resourceGroup);
          log.data($('type                           :'), result.type);
          log.data($('host name                      :'), result.hostName);
          log.data($('http port                      :'), result.httpPort);
          log.data($('https port                     :'), result.httpsPort);
          log.data($('resource state                 :'), result.resourceState);
          log.data($('provisioning state             :'), result.provisioningState);
          log.data('');
        }
      });
    });

  //==============================================================================================================
  //Custom Domain

  var customDomain = cdn.category('customDomain')
    .description($('Commands to manage Azure cdn profile endpoint custom domain'));

  //List Custom Domain
  customDomain.command('list [endpoint-name] [profile-name] [resource-group]')
    .description($('List custom domains by endpoint name, profile name, and resource group'))
    .usage('[options] <endpoint-name> <profile-name> <resource-group>')
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	    resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Listing custom domain under ' + endpointName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.customDomains.listByEndpoint(resourceGroup, profileName, endpointName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function() {
        if (!result || result.length === 0) {
          log.info($('No custom domains found under ' + endpointName));
        } else {
          log.table(result, function(row, cd) {
            row.cell($('Name'), cd.name);
            row.cell($('Endpoint'), endpointName);
            row.cell($('HostName'), cd.hostName);
            row.cell($('ValidationData'), cd.validationData);
            row.cell($('ProvisioningState'), cd.provisioningState);
            row.cell($('ResourceState'), cd.resourceState);
            row.cell($('CustomHttpsProvisioningState'), cd.customHttpsProvisioningState);
          });
        }
      });
    });

  //Get Custom Domain
  customDomain.command('show [name] [endpoint-name] [profile-name] [resource-group]')
    .description($('Get custom domains by custom domain name, endpoint name, profile name, and resource group'))
    .usage('[options] <name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the custom domain'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Custom domain name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Getting custom domain named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.customDomains.get(resourceGroup, profileName, endpointName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }


      cli.interaction.formatOutput(result, function(data) {
        if (!data) {
          log.info($('No custom domain named %s found.'), name);
        } else {
          log.data('');
          log.data($('custom domain name             :'), result.name);
          log.data('');
          log.data($('endpoint name                  :'), endpointName);
          log.data($('profile name                   :'), profileName);
          log.data($('resource group                 :'), resourceGroup);
          log.data($('type                           :'), result.type);
          log.data($('host name                      :'), result.hostName);
          log.data($('validation data                :'), result.validationData);
          log.data($('resource state                 :'), result.resourceState);
          log.data($('provisioning state             :'), result.provisioningState);
          log.data($('custom https provisioning state:'), result.customHttpsProvisioningState);
          log.data($('id                             :'), result.id);
          log.data('');
        }
      });
    });

  //Create Custom Domain
  customDomain.command('create [name] [endpoint-name] [profile-name] [resource-group] [custom-domain-host-name]')
    .description($('Create a custom domain of a perticular custom domain host name'))
    .usage('[options] <name> <endpoint-name> <profile-name> <resource-group> <custom-domain-host-name>')
    .option('-n, --name <name>', $('Name of the custom domain'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-d, --custom-domain-host-name <custom-domain-host-name>', $('The host name of the custom domain'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, customDomainHostName, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Custom domain name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
      customDomainHostName = cli.interaction.promptIfNotGiven($('Custom domain host name: '), customDomainHostName, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Creating custom domain named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.customDomains.create(resourceGroup, profileName, endpointName, name, customDomainHostName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function() {
        log.data('');
        log.data($('custom domain name             :'), result.name);
        log.data('');
        log.data($('endpoint name                  :'), endpointName);
        log.data($('profile name                   :'), profileName);
        log.data($('resource group                 :'), resourceGroup);
        log.data($('type                           :'), result.type);
        log.data($('host name                      :'), result.hostName);
        log.data($('validation data                :'), result.validationData);
        log.data($('resource state                 :'), result.resourceState);
        log.data($('provisioning state             :'), result.provisioningState);
        log.data($('custom https provisioning state:'), result.customHttpsProvisioningState);
        log.data($('id                             :'), result.id);
        log.data('');
      });
    });

  //Delete Custom Domain
  customDomain.command('delete [name] [endpoint-name] [profile-name] [resource-group]')
    .description($('Delete a custom domain of a perticular custom domain host name'))
    .usage('[options] <name> <endpoint-name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the custom domain'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      name = cli.interaction.promptIfNotGiven($('Custom domain name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Deleting custom domain named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.customDomains.deleteMethod(resourceGroup, profileName, endpointName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode == 200) {
        log.info('Delete command successfully invoked for custom domain ' + name);
      } else if (response.statusCode == 204) {
        log.info('Delete success, but no custom domain named ' + name + ' was found');
      } else {
        log.info('Error in deleting custom domain ' + name);
      }
    });

  //Validate custom domain
  customDomain.command('validate [endpoint-name] [profile-name] [resource-group] [custom-domain-host-name]')
    .description($('Check to see if a custom domain host name is registered for cname mapping to the endpoint '))
    .usage('[options] <endpoint-name> <profile-name> <resource-group> <custom-domain-host-name>')
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-d, --custom-domain-host-name <custom-domain-host-name>', $('The host name of the custom domain'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(endpointName, profileName, resourceGroup, customDomainHostName, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////
	  
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	  resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
	  customDomainHostName = cli.interaction.promptIfNotGiven($('Custom domain host name: '), customDomainHostName, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Validating custom domain host name: ' + customDomainHostName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.validateCustomDomain(resourceGroup, profileName, endpointName, customDomainHostName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(result, function() {
        if (response.statusCode != 200) {
          log.info('Command invoke failed, please retry');
        } else if (result.customDomainValidated) {
          log.info('Validate host name ' + customDomainHostName + ' success');
        } else {
          log.info('Validate host name ' + customDomainHostName + ' failed');
          log.info('Reason: ' + result.reason);
          log.info('Message: ' + result.message);
        }
      });
    });
    
  //Enable custom domain https
  customDomain.command('enableHttps [name] [endpoint-name] [profile-name] [resource-group]')
    .description($('Enable https on the custom domain.'))
    .usage('[options] <name> <endpoint-name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the custom domain'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////
	  
      name = cli.interaction.promptIfNotGiven($('Custom domain name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Enabling https for custom domain named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.customDomains.enableCustomHttps(resourceGroup, profileName, endpointName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode == 200 || response.statusCode == 202) {
        log.info('Enable https command successfully invoked for custom domain ' + name);
      } 
      else
      {
        log.info('Error when enabling https custom domain ' + name);
      }
    });
	
  //Disable custom domain https
  customDomain.command('disableHttps [name] [endpoint-name] [profile-name] [resource-group]')
    .description($('Disable https on the custom domain.'))
    .usage('[options] <name> <endpoint-name> <profile-name> <resource-group>')
    .option('-n, --name <name>', $('Name of the custom domain'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(name, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////
	  
      name = cli.interaction.promptIfNotGiven($('Custom domain name: '), name, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Disabling https for custom domain named ' + name)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.customDomains.disableCustomHttps(resourceGroup, profileName, endpointName, name, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode == 200 || response.statusCode == 202) {
        log.info('Disable https command successfully invoked for custom domain ' + name);
      } 
      else
      {
        log.info('Error when disabling https custom domain ' + name);
      }
    });
	
  //==============================================================================================================
  //Geo filters
  var geoFilter = cdn.category('geofilter')
    .description($('Commands to manage Azure cdn profile endpoint geo filters'));

  //List Geo filters
  geoFilter.command('list [endpoint-name] [profile-name] [resource-group]')
    .description($('List geo filters by endpoint name, profile name, and resource group'))
    .usage('[options] <endpoint-name> <profile-name> <resource-group>')
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Listing custom domain under ' + endpointName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.get(resourceGroup, profileName, endpointName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function() {
        if (!result) {
          log.info($('No endpoint found for endpoint name ' + endpointName));
        }
        else if (!result.geoFilters){
          log.info($('Geo filter field is not set for endpoint name ' + endpointName));
        } else {
          log.table(result.geoFilters, function(row, gf) {
            row.cell($('RelativePath'), gf.relativePath);
            row.cell($('Action'), gf.action);
            row.cell($('CountryCodes'), gf.countryCodes.join(','));
          });
        }
      });
    });

  //Add geo filter command
  geoFilter.command('add [relative-path] [endpoint-name] [profile-name] [resource-group] [action] [country-codes]')
    .description($('Add a geo filters by endpoint name, profile name, and resource group'))
    .usage('[options] <relative-path> <endpoint-name> <profile-name> <resource-group> <action> <country-codes>')
	  .option('-r, --relative-path <relative-path>', $('Relative path of the geo filter'))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-a, --action <action>', $('Action of the geo filter. Valid input: -a [Block|Allow]'))
    .option('-c, --country-codes <country-codes>', $('List of country codes to apply the geo filter. Country codes are two letters and comma separated.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(relativePath, endpointName, profileName, resourceGroup, action, countryCodes, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      relativePath = cli.interaction.promptIfNotGiven($('Relative path: '), relativePath, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	    resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
      action = cli.interaction.promptIfNotGiven($('Action: '), action, _);
      countryCodes = cli.interaction.promptIfNotGiven($('Country codes: '), countryCodes, _);
	  
      var countryCodesList = countryCodes ? countryCodes.split(',') : [];
      
      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Adding geo filter under ' + endpointName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.get(resourceGroup, profileName, endpointName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function() {
        if (!result) {
          log.info($('No endpoint found for endpoint name ' + endpointName));
        }
        else if (!result.geoFilters){
          log.info($('Geo filter field is not set for endpoint name ' + endpointName));
        } else {
          for (var i = 0; i < result.geoFilters.length; i++) {
            if (result.geoFilters[i].relativePath.toLowerCase() === relativePath.toLowerCase())
            {
              throw new Error('There is a geo filter with same relative path under endpoint ' + endpointName + '!');
            }
          }
        }
      });
      
      var endpointUpdateParameters = {};
      
      var geoFiltersObject = result.geoFilters;
      var geoFilterToAdd = {
        relativePath: relativePath,
        action: action,
        countryCodes: countryCodesList
      };
      
      geoFiltersObject.push(geoFilterToAdd);
      
      endpointUpdateParameters.geoFilters = geoFiltersObject;
      
      try {
        callbackArgs = client.endpoints.update(resourceGroup, profileName, endpointName, endpointUpdateParameters, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(function() {
        log.info($('New geo filter added for ') + endpointName);
      });
    });
  
  //Update geo filter command
  geoFilter.command('set [relative-path] [endpoint-name] [profile-name] [resource-group]')
    .description($('Update a geo filters by endpoint name, profile name, and resource group'))
    .usage('[options] <relative-path> <endpoint-name> <profile-name> <resource-group> [action] [country-codes]')
    .option('-r, --relative-path <relative-path>', $('Relative path of the geo filter. e.g. /mycars '))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('-a, --action [action]', $('Action of the geo filter. Block or Allow.'))
    .option('-c, --country-codes [country-codes]', $('List of country codes to apply the geo filter. Country codes are two letters and comma separated.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(relativePath, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      relativePath = cli.interaction.promptIfNotGiven($('Relative path: '), relativePath, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
      resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
      
      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Updating a geo filter under ' + endpointName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.get(resourceGroup, profileName, endpointName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      var foundTarget = false;
      
      cli.interaction.formatOutput(result, function() {
        if (!result) {
          log.info($('No endpoint found for endpoint name ' + endpointName));
        }
        else if (!result.geoFilters){
          log.info($('Geo filter field is not set for endpoint name ' + endpointName));
        } else {
          for (var i = 0; i < result.geoFilters.length; i++) {
            if (result.geoFilters[i].relativePath.toLowerCase() === relativePath.toLowerCase())
            {
              if(options.action)
              {
                result.geoFilters[i].action = options.action;
              }
              if(options.countryCodes)
              {
                result.geoFilters[i].countryCodes = options.countryCodes.split(',');
              }
              
              foundTarget = true;
            }
          }
        }
      });
      
      if (!foundTarget)
      {
        throw new Error('There is no geo filter that has relative path ' + relativePath + ' under endpoint ' + endpointName + '!');
      }
      
      var endpointUpdateParameters = {};
      
      endpointUpdateParameters.geoFilters = result.geoFilters;
      
      try {
        callbackArgs = client.endpoints.update(resourceGroup, profileName, endpointName, endpointUpdateParameters, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(function() {
        log.info($('Geo filter updated for ') + endpointName);
      });
    });
  
  //Remove geo filter command
  geoFilter.command('delete [relative-path] [endpoint-name] [profile-name] [resource-group]')
    .description($('Delete a geo filters by relative path, endpoint name, profile name, and resource group'))
    .usage('[options] <relative-path> <endpoint-name> <profile-name> <resource-group> <action> <country-codes>')
    .option('-r, --relative-path <relative-path>', $('Relative path of the geo filter. e.g. /mycars '))
    .option('-e, --endpoint-name <endpoint-name>', $('Name of the endpoint'))
    .option('-p, --profile-name <profile-name>', $('Name of the profile'))
    .option('-g, --resource-group <resource-group>', $('The resource group of the Azure Cdn Profile'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(relativePath, endpointName, profileName, resourceGroup, options, _) {
      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      relativePath = cli.interaction.promptIfNotGiven($('Relative path: '), relativePath, _);
      endpointName = cli.interaction.promptIfNotGiven($('Endpoint name: '), endpointName, _);
      profileName = cli.interaction.promptIfNotGiven($('Profile name: '), profileName, _);	  
	    resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), resourceGroup, _);
      
      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Deleting a geo filter under endpoint ' + endpointName)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.endpoints.get(resourceGroup, profileName, endpointName, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      var foundTarget = false;
      
      var newGeoFilterArray = [];
      
      cli.interaction.formatOutput(result, function() {
        if (!result) {
          log.info($('No endpoint found for endpoint name ' + endpointName));
        }
        else if (!result.geoFilters){
          log.info($('Geo filter field is not set for endpoint name ' + endpointName));
        } else {
          for (var i = 0; i < result.geoFilters.length; i++) {
            if (result.geoFilters[i].relativePath.toLowerCase() === relativePath.toLowerCase())
            {
              foundTarget = true;
            }
            else
            {
              newGeoFilterArray.push(result.geoFilters[i]);
            }
          }
        }
      });
      
      if (!foundTarget)
      {
        throw new Error('There is no geo filter that has relative path ' + relativePath + ' under endpoint ' + endpointName + '!');
      }
      
      var endpointUpdateParameters = {};
      endpointUpdateParameters.geoFilters = newGeoFilterArray;
      
      try {
        callbackArgs = client.endpoints.update(resourceGroup, profileName, endpointName, endpointUpdateParameters, [_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(function() {
        log.info($('One geo filter deleted for ') + endpointName);
      });
    });
    
  // Azure CDN EdgeNode Command
  var edgeNodes = cdn.category('edgeNode')
    .description($('Commands to get edge nodes of Azure CDN service'));
  
  // Get EdgeNode list
  edgeNodes.command('list')
    .description($('Get the edge node list of Azure CDN service'))
    .usage('[options]')
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(options, _) {

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);

      var progress = cli.interaction.progress(util.format($('Listing edge nodes for subscription: ' + subscription)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.edgeNodes.list([_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode != 200) {
        log.info('Command invoke failed, please retry');
      } else {
        cli.interaction.formatOutput(result, function() {
          if (!result || result.value.length === null ) {
            log.info($('No edgeNodes found.'));
          } else {
            log.info($('EdgeNodes:   \r\n' + util.inspect(result.value, {depth: null})));
          }
        });
      }
    });
  
  // Usage commands
  var usage = cdn.category('usage')
    .description($('Commands to get the usage of subscription'));
    
  usage.command('list')
    .description($('List the usages of resources under subscription'))
    .usage('[options]')
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function(options, _) {

      /////////////////////////
      // Create the client.  //
      /////////////////////////

      var subscription = profile.current.getSubscription();
      var client = utils.createCdnManagementClient(subscription);
      var progress = cli.interaction.progress(util.format($('Listing usages for subscription: ' + subscription)));

      var callbackArgs = [];
      var result, response;
      try {
        callbackArgs = client.listResourceUsage([_]);
        result = callbackArgs[0];
        response = callbackArgs[2];
      } catch (e) {
        throw e;
      } finally {
        progress.end();
      }

      if (response.statusCode != 200) {
        log.info('Command invoke failed, please retry');
      } else {
        cli.interaction.formatOutput(result, function() {
          if (!result || result.length === 0) {
            log.info($('No usage record was found.'));
          } else {
            log.table(result, function(row, usage) {
              row.cell($('ResourceType'), usage.resourceType);
              row.cell($('Unit'), usage.unit);
              row.cell($('CurrentValue'), usage.currentValue);
              row.cell($('Limit'), usage.limit);
            });
          }
        });
      }
    });
};