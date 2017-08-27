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
* You can test powerbi embedded commands get loaded by xplat by following steps:
* a. Copy the folder to '<repository root>\lib\commands\arm'
* b. Under <repository root>, run 'node bin/azure config mode arm'
* c. Run 'node bin/azure', you should see 'powerbi' listed as a command set
* d. Run 'node bin/azure powerbi', you should see 'create', "delete", etc 
      showing up in the help text 
*/

'use strict';

var util = require('util');

var profile = require('../../../util/profile');
var tagUtils = require('../tag/tagUtils');
var utils = require('../../../util/utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var powerbiembeddedcli = cli.category('powerbi')
    .description($('Commands to manage your Azure Power BI Embedded Workspace Collections'));
    
  /**
   * Create new workspace collection
   */
  powerbiembeddedcli.command('create <resourceGroup> <name> <location> [tags]')
    .description($('Create a new workspace collection'))
    .option('-g --resource-group <resourceGroup>', $('Name of the resource group'))
    .option('-n --name <name>', $('The name of the new workspace collection'))
    .option('-l --location <location>', $('The location (azure region/datacenter) where the workspace collection will be provisioned'))
    .option('-t --tags [tags]', $('Tags to set to the resource group. Can be multiple. ' +
        'In the format of \'name=value\'. Name is required and value is optional. ' + 
        'For example, -t \'tag1=value1;tag2\'. Providing an empty string \'\' will delete the tags.'))
    .option('-s --subscription [subscription]', $('The subscription identifier'))
    .execute(function (resourceGroup, name, location, tags, options, _) {
      /** Normalize options */
      options.location = options.location || location;
      options.tags = options.tags || tags;
      
      /** Validate parameters */
      if (!resourceGroup) {
        return cli.missingArgument('resourceGroup');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      
      /** Create client */
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPowerbiManagementClient(subscription);
      
      /** Invoke client method */
      var tagsObject = {};
      if(options.tags) {
        tagsObject = tagUtils.buildTagsParameter(null, options);
      }
    
      var workspaceCollectionCreationOptions = {
        location: options.location,
        tags: tagsObject,
        sku: {
          name: 'S1',
          tier: 'Standard'
        }
      };

      var progress = cli.interaction.progress(util.format($('Creating workspace collection: %s'), name));
      var workspaceCollection;
      try {
        workspaceCollection = client.workspaceCollections.create(resourceGroup, name, workspaceCollectionCreationOptions, _);
      }
      finally {
        progress.end();
      }
      
      log.info('WorkspaceCollection created:');
      cli.interaction.formatOutput(workspaceCollection, function (workspaceCollection) {
        var workspaceCollectionProperties = [
          { key: 'name', value: workspaceCollection.name },
          { key: 'location', value: workspaceCollection.location },
          // TODO: The api doesn't seem to be returning sku information, expose when it's fixed.
          // { key: 'sku', value: workspaceCollection.sku.name },
          // { key: 'tier', value: workspaceCollection.sku.tier },
          { key: 'tags', value: tagUtils.getTagsInfo(workspaceCollection.tags) }
        ];
        
        log.table(workspaceCollectionProperties, function (row, workspaceCollectionProperty) {
          row.cell($('Property'), workspaceCollectionProperty.key);
          row.cell($('Value'), workspaceCollectionProperty.value);
        });
      });
    });
    
  /**
   * Update existing workspace collection
   */
  // TODO: Uncomment when bugs in service are fixed and SDK is updated with support.
  // powerbiembeddedcli.command('set <resourceGroup> <name> <tags>')
  //   .description($('Update a workspace collection\'s tags'))
  //   .option('-g --resource-group <resourceGroup>', $('Name of the resource group'))
  //   .option('-n --name <name>', $('Name of workspace collection'))
  //   .option('-t --tags <tags>', $('Tags to set to the resource group. Can be multiple. ' +
  //       'In the format of \'name=value\'. Name is required and value is optional. ' + 
  //       'For example, -t \'tag1=value1;tag2\'. Providing an empty string \'\' will delete the tags.'))
  //   .option('-s --subscription [subscription]', $('The subscription identifier'))
  //   .execute(function (resourceGroup, name, tags, options, _) {
          
    
  //     /** Validate parameters */
  //     if (!resourceGroup) {
  //       return cli.missingArgument('resourceGroup');
  //     }
  //     if (!name) {
  //       return cli.missingArgument('name');
  //     }
  //     if (!tags) {
  //       return cli.missingArgument('tags');
  //     }
      
  //    var tagsObject = {}
  //    if(options.tags) {
  //      tagsObject = tagUtils.buildTagsParameter(null, options);
  //    }
    
  //     /** Create client */
  //     var subscription = profile.current.updateSubscription(options.subscription);
  //     var client = utils.createPowerbiManagementClient(subscription);
      
  //     /** Invoke client method */
  //     var body = {
  //       tags: tagsObject,
  //       sku: {
  //         name: "S1"
  //       }
  //     };
      
  //     var progress = cli.interaction.progress(util.format($('Udating workspace collection: %s'), name));
  //     var workspaceCollection;
  //     try {
  //       workspaceCollection = client.workspaceCollections.update(resourceGroup, name, body, _);
  //     } finally {
  //       progress.end();
  //     }
      
  //     /** Display output */
  //     log.info('WorkspaceCollection updated!');
  //   });

  /**
   * Delete existing workspace collection
   */
  // TODO: Uncomment when bugs in service are fixed and SDK is updated with support.
  // powerbiembeddedcli.command('delete [resourceGroup] [name]')
  //   .description($('Delete existing workspace collection'))
  //   .option('-g --resource-group <resourceGroup>', $('Name of the resource group'))
  //   .option('-n --name <name>', $('Name of workspace collection'))
  //   .option('-s --subscription [subscription]', $('The subscription identifier'))
  //   .execute(function (resourceGroup, name, options, _) {
  //     /** Validate parameters */
  //     if (!resourceGroup) {
  //       return cli.missingArgument('resourceGroup');
  //     }
  //     if (!name) {
  //       return cli.missingArgument('name');
  //     }
      
  //     /** Create client */
  //     var subscription = profile.current.getSubscription(options.subscription);
  //     var client = utils.createPowerbiManagementClient(subscription);

  //     /** Invoke client method */
  //     var progress = cli.interaction.progress(util.format($('Deleting workspace collection %s'), name));

  //     var result;
  //     try {
  //       result = client.workspaceCollections.delete(resourceGroup, name, _);
  //     } finally {
  //       progress.end();
  //     }
      
  //     log.info('Workspace Collection: ' + name + ' was deleted.');
  //   });
    
  /**
   * List by Subscription or by Resource Group
   */
  powerbiembeddedcli.command('list [resourceGroup]')
    .description($('List workspace collections within subscription or within resource group'))
    .option('-g --resource-group [resourceGroup]', $('Name of the resource group'))
    .option('-s --subscription [subscription]', $('The subscription identifier'))
    .execute(function (resourceGroup, options, _) {
      /** Normalize Options */
      options.resourceGroup = options.resourceGroup || resourceGroup;
      
      /** Create client */
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPowerbiManagementClient(subscription);
      
      /** Invoke client method */
      var workspaceCollections;
      var progress;
      if(options.resourceGroup) {
        progress = cli.interaction.progress($('Getting workspace collections in subscription ' + subscription.id + ' and within resource group: ' + options.resourceGroup));
        try {
          workspaceCollections = client.workspaceCollections.listByResourceGroup(options.resourceGroup, _);
        } finally {
          progress.end();
        }
      }
      else {
        progress = cli.interaction.progress($('Getting workspace collections in subscription: ' + subscription.id));
        try {
          workspaceCollections = client.workspaceCollections.listBySubscription(_);
        } finally {
          progress.end();
        }
      }

      /** Output result */
      cli.interaction.formatOutput(workspaceCollections, function (workspaceCollections) {
        if (workspaceCollections.length === 0) {
          log.info($('No workspace collections found.'));
          return;
        }
        
        log.table(workspaceCollections, function (row, workspaceCollection) {
          var resourceGroup = null;
          var resourceGroupMatches = workspaceCollection.id.match(/resourceGroups\/([^\/]+)/);
          if(resourceGroupMatches) {
            resourceGroup = resourceGroupMatches[1];
          }
          
          row.cell($('Name'), workspaceCollection.name);
          row.cell($('Group'), resourceGroup);
          row.cell($('Location'), workspaceCollection.location);
          row.cell($('Provisioning State'), workspaceCollection.properties.provisioningState);
          row.cell($('Tags'), tagUtils.getTagsInfo(workspaceCollection.tags));
        });
      });
    });

  /**
   * Get access keys for workspace collection
   */
  var keys = powerbiembeddedcli.category('keys')
    .description($('Commands to manage your Power BI Workspace Collection keys'));
    
  keys.command('list <resourceGroup> <name>')
    .description($('Get access keys for a workspace collection'))
    .option('-g --resource-group <resourceGroup>', $('Name of the resource group'))
    .option('-n --name <name>', $('Name of workspace collection'))
    .option('-s --subscription [subscription]', $('The subscription identifier'))
    .execute(function (resourceGroup, name, options, _) {
      /** Validate parameters */
      if (!resourceGroup) {
        return cli.missingArgument('resourceGroup');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      
      /** Create client */
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPowerbiManagementClient(subscription);
      
      /** Invoke client method */
      var progress = cli.interaction.progress($('Getting workspace collection access keys...'));
      var accessKeys;
      try {
        accessKeys = client.workspaceCollections.getAccessKeys(resourceGroup, name, _);
      } finally {
        progress.end();
      }

      /** Output result */
      cli.interaction.formatOutput(accessKeys, function (accessKeys) {
        var keys = [
          { name: 'key1 (Primary)', key: accessKeys.key1 },
          { name: 'key2 (Secondary)', key: accessKeys.key2 }
        ];
        
        log.table(keys, function (row, key) {
          row.cell($('Name'), key.name);
          row.cell($('Key'), key.key);
        });
      });
    });
  
  /**
   * Regenerage access key
   */
  keys.command('renew <resourceGroup> <name>')
    .description($('Get access keys for a workspace collection'))
    .option('-g --resource-group <resourceGroup>', $('Name of the resource group'))
    .option('-n --name <name>', $('Name of workspace collection'))
    .option('--primary', $('Renew the Primary key'))
    .option('--secondary', $('Renew the Secondary key'))
    .option('-s --subscription [subscription]', $('The subscription identifier'))
    .execute(function (resourceGroup, name, options, _) {
      /** Validate parameters */
      if (!resourceGroup) {
        return cli.missingArgument('resourceGroup');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      
      if (!options.primary && !options.secondary) {
        throw new Error($('Need to specify either --primary or --secondary'));
      } else if (options.primary && options.secondary) {
        throw new Error($('Only one of primary or secondary keys can be renewed at a time'));
      }
      
      var keyName = 'key1';
      if(options.secondary) {
        keyName = 'key2';
      }
      
      /** Create client */
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPowerbiManagementClient(subscription);
      
      /** Invoke client method */
      var progress = cli.interaction.progress($('Regenerate workspace collection access key: ' + keyName));
      var accessKeys;
      
      var body = {
        keyName: keyName
      };
      try {
        accessKeys = client.workspaceCollections.regenerateKey(resourceGroup, name, body, _);
      } finally {
        progress.end();
      }

      /** Output result */
      var key1name = 'key1 (Primary)';
      if(keyName === 'key1') {
        key1name += ' (Regenerated)';
      }
      
      var key2name = 'key2 (Secondary)';
      if(keyName === 'key2') {
        key2name += ' (Regenerated)';
      }
      
      cli.interaction.formatOutput(accessKeys, function (accessKeys) {
        var keys = [
          { name: key1name, key: accessKeys.key1 },
          { name: key2name, key: accessKeys.key2 }
        ];
        
        log.table(keys, function (row, key) {
          row.cell($('Name'), key.name);
          row.cell($('Key'), key.key);
        });
      });
    });
    
  /**
   * List workspaces within workspace collection
   */
  var workspaces = powerbiembeddedcli.category('workspaces')
    .description($('Commands to manage your Power BI Workspaces'));
  
  workspaces.command('list <resourceGroup> <name>')
    .description($('Get workspaces within given workspace collection'))
    .option('-g --resource-group <resourceGroup>', $('Name of the resource group'))
    .option('-n --name <name>', $('Name of workspace collection'))
    .option('-s --subscription [subscription]', $('The subscription identifier'))
    .execute(function (resourceGroup, name, options, _) {
      /** Validate parameters */
      if (!resourceGroup) {
        return cli.missingArgument('resourceGroup');
      }
      if (!name) {
        return cli.missingArgument('name');
      }
      
      /** Create client */
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPowerbiManagementClient(subscription);
      
      /** Invoke client method */
      var progress = cli.interaction.progress($('Fetching workspaces...'));
      var workspaces;
      
      try {
        workspaces = client.workspaces.list(resourceGroup, name, _);
      } finally {
        progress.end();
      }

      /** Output result */
      cli.interaction.formatOutput(workspaces, function (workspaces) {
        if (workspaces.length === 0) {
          log.info($('No workspaces found.'));
          return;
        }
        
        log.table(workspaces, function (row, workspace) {
          row.cell($('Name'), workspace.name);
        });
      });
    });
};
