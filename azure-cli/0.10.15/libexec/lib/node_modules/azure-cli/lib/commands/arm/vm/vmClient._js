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

var fs = require('fs');
var readableStream = require('readable-stream');
var stream = require('stream');
var __ = require('underscore');
var url = require('url');
var util = require('util');

var azureStorage = require('azure-storage');

var AvailabilitySet = require('./../availabilityset/availabilitySet');
var NetworkNic = require('./networkNic');
var NetworkPublicIP = require('./networkPublicIP');
var profile = require('../../../util/profile');
var StorageUtil = require('../../../util/storage.util');
var startProgress = StorageUtil.startProgress;
var endProgress = StorageUtil.endProgress;
var utils = require('../../../util/utils');
var vmConstants = require('../../../util/vmConstants');
var VirtualMachine = require('./virtualMachine');
var VMImage = require('./vmImage');
var VMExtensionProfile = require('./vmExtensionProfile');
var VMProfile = require('./vmProfile');
var vmShowUtil = require('./vmShowUtil');
var VMStorageProfile = require('./vmStorageProfile');
var blobUtil = require('../../../util/blobUtils');
var AemExtensionUtil = require('./aemExtensionUtil');

var $ = utils.getLocaleString;
var writable = stream.Writable || readableStream.Writable;
var CHEFPUBLISHER = 'Chef.Bootstrap.WindowsAzure';

function WriteStream(options) {
  writable.call(this, options);
}

function VMClient(cli, subscription) {
  this.cli = cli;
  this.subscription = subscription;
}

__.extend(VMClient.prototype, {
  createVM: function (resourceGroupName, vmName, location, osType, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var params = {};
    // General
    params.subscriptionId = subscription.id;
    params.vmName = vmName;
    params.location = location;
    if (options.imageUrn && options.imageUrn.indexOf(':') === -1) {
      options.imageUrn = utils.getImageAliasUrn(options.imageUrn);
    }
    params.imageUrn = options.imageUrn;
    // hardwareProfile
    params.vmSize = options.vmSize;
    // osProfile
    params.computerName = params.vmName;
    params.adminUsername = options.adminUsername;
    params.adminPassword = options.adminPassword;
    params.osType = osType;
    params.sshPublickeyFile = options.sshPublickeyFile;
    params.generateSshKeys = options.generateSshKeys;
    params.customData = options.customData;
    // storageProfile - storage accountweb
    params.storageAccountName = options.storageAccountName;
    params.storageAccountContainerName = options.storageAccountContainerName || 'vhds';
    // storageProfile.osDiskProfile
    params.osDiskType = params.osType;
    params.osDiskCaching = options.osDiskCaching;
    params.osDiskVhd = options.osDiskVhd;
    // storageProfile.osDisk.encryptionSettings
    params.diskEncryptionKeyVaultId = options.diskEncryptionKeyVaultId;
    params.diskEncryptionKeySecretUrl = options.diskEncryptionKeyUrl;
    params.keyEncryptionKeyVaultId = options.keyEncryptionKeyVaultId;
    params.keyEncryptionKeyUrl = options.keyEncryptionKeyUrl;
    // storageProfile.dataDiskProfile
    params.dataDiskCaching = options.dataDiskCaching;
    params.dataDiskVhd = options.dataDiskVhd;
    params.dataDiskSize = options.dataDiskSize;
    params.newDataDisk = !options.dataDiskExisting;
    params.dataDisks = [];
    // networkProfile - network interface
    params.nicName = options.nicName;
    params.nicId = options.nicId;
    params.nicIds = options.nicIds;
    params.nicNames = options.nicNames;
    // networkProfile - public IP
    params.publicipName = options.publicIpName;
    params.publicipDomainName = options.publicIpDomainName;
    params.publicipIdletimeout = options.publicIpIdletimeout;
    params.publicipAllocationmethod = options.publicIpAllocationMethod;
    // networkProfile - virtual network
    params.subnetId = options.subnetId;
    params.vnetName = options.vnetName;
    params.vnetAddressPrefix = options.vnetAddressPrefix;
    params.vnetSubnetName = options.vnetSubnetName;
    params.vnetSubnetAddressprefix = options.vnetSubnetAddressPrefix;
    // availabilitySetProfile
    params.availsetName = options.availsetName;
    // tags
    params.tags = options.tags;
    // boot diagnostics storage URI
    params.disableBootDiagnostics = !!(options.disableBootDiagnostics);
    params.enableBootDiagnostics = !(params.disableBootDiagnostics);
    params.enableBootDiagnostics = options.bootDiagnosticsStorageUri ? true : params.enableBootDiagnostics;
    params.bootDiagnosticsStorageUri = options.bootDiagnosticsStorageUri ? options.bootDiagnosticsStorageUri : null;
    // bginfo extension option
    params.disableBginfoExtension = options.disableBginfoExtension ? options.disableBginfoExtension : null;
    // license type
    params.licenseType = options.licenseType;
    // plan options
    if (!utils.stringIsNullOrEmpty(options.planName)) {
      params.plan = {
        name : options.planName,
        publisher : options.planPublisher ? options.planPublisher : null,
        product : options.planProduct ? options.planProduct : null,
        promotionCode : options.planPromotionCode ? options.planPromotionCode : null
      };
    }

    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroupName, params.vmName, _);
    if (vmResult) {
      throw new Error(util.format($('A virtual machine with name "%s" already exists in the resource group "%s"'), vmResult.name, resourceGroupName));
    }

    var vmProfile = new VMProfile(this.cli, resourceGroupName, params, serviceClients);
    var vmCreateProfile = vmProfile.generateVMProfile(_);
    
    if (!options.bootDiagnosticsStorageUri && vmCreateProfile.profile.diagnosticsProfile) {
      var diagProfile = vmCreateProfile.profile.diagnosticsProfile;
      if (diagProfile.bootDiagnostics && diagProfile.bootDiagnostics.enabled && diagProfile.bootDiagnostics.storageUri) {
        var diagMessage = util.format($(
          'The storage URI \'%s\' will be used for boot diagnostics settings, and it ' +
          'can be overwritten by the parameter input of \'--boot-diagnostics-storage-uri\'.'),
          diagProfile.bootDiagnostics.storageUri);
        this.cli.output.info(diagMessage);
      }
    }

    var foundBginfoExt = false;
    var foundMajorVersion = vmConstants.EXTENSIONS.BGINFO_MAJOR_VERSION + '.0';
    if (!params.disableBginfoExtension && osType.toString().toLowerCase() == 'windows') {
      // Try to find the BGInfo Extension and its Version
      var vmImage = new VMImage(this.cli, serviceClients);
      var publishers = vmImage.getVMImagePublisherList(location, _);
      for (var key1 in publishers) {
        if (publishers[key1].name === vmConstants.EXTENSIONS.BGINFO_PUBLISHER) {
          var types = vmImage.getVMExtensionImageTypeList(location, publishers[key1].name, _);
          for (var key2 in types) {
            if (types[key2].name === vmConstants.EXTENSIONS.BGINFO_NAME) {
              var versions = vmImage.getVMExtensionImageVersionList(location, publishers[key1].name, types[key2].name, _);
              if (versions.length > 0) {
                for (var key3 in versions) {
                  // Starts with '2.0', '2.1', '2.1.0.1', etc.
                  if (utils.stringStartsWith(versions[key3].name, vmConstants.EXTENSIONS.BGINFO_MAJOR_VERSION + '.')) {
                    foundBginfoExt = true;
                    var versionTable = versions[key3].name.split('.');
                    if (versionTable.length >= 2) {
                      foundMajorVersion = versionTable[0] + '.' + versionTable[1];
                    }
                    break;
                  }
                }
              }
              break;
            }
          }
          break;
        }
      }
    }

    virtualMachine.createOrUpdateVM(resourceGroupName, vmCreateProfile.profile, true, _);

    // Enable BGInfo for Windows VM if found
    if (foundBginfoExt) {
      var bgInfoParams = {
        resourceGroupName: resourceGroupName,
        osType: osType,
        location: location,
        versionFound: true,
        version: foundMajorVersion
      };

      var vmExtensionProfile = new VMExtensionProfile(this.cli, bgInfoParams, serviceClients);
      var vmBgInfoExtension = vmExtensionProfile.generateVMBgInfoExtensionProfile();
      virtualMachine.createOrUpdateVMExtension(resourceGroupName, params.vmName, vmBgInfoExtension.profile, true, _);
    }
  },

  getDefaultVmSize: function(location, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var sizeResult = virtualMachine.getVMSizesByLocationName(location, _);
    var selectedSize = null;
    var findAndSet = function (sizeName) {
      for(var i = 0; i < sizeResult.length; i++) {
        if(sizeResult[i].name === sizeName)
          selectedSize = sizeName;
      }
    };
    if (sizeResult && Array.isArray(sizeResult)) {
      findAndSet('Standard_D1');
      findAndSet('Standard_D1_v2');
      findAndSet('Standard_DS1');
    }
    return selectedSize ? selectedSize : 'Standard_A0';
  },
  
  tryCreatePremiumStorageAccount: function(storageManagementClient, location, resourceGroupName, name, _) {
    var defaultType = 'Premium_LRS';
    var createdAccount = null;
    try {
      var stoParams = {};
      stoParams.name = name;
      stoParams.location = location;
      
      stoParams.sku = { name : 'Premium_LRS' };
      stoParams.kind = 'Storage';
      createdAccount = storageManagementClient.storageAccounts.create(resourceGroupName, stoParams.name, stoParams, _);
    }
    catch (err) {
      if (err.code === 'AccountTypeNotSupportedInLocation' || err.code === 'StorageAccountAlreadyExists' || err.code === 'VMScaleSetAllocationError') {
        this.cli.output.warn(util.format($('%s : %s [%s]'), err.code, err.message, defaultType));
      }
      else if (err.message && utils.stringStartsWith(err.message, 'Storage account type Premium_LRS is not supported for VM size')) {
        this.cli.output.warn(util.format($('%s : %s [%s]'), err.code, err.message, defaultType));
      }
      else {
        throw err;
      }
    }
    return createdAccount;
  },
  
  quickCreateVM: function (resourceGroupName, vmName, location, osType, imageUrn, adminUsername, adminPassword, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);

    var removeAllSpace = function (str) {
        return (str.replace(/[\(\)\{\}\[\]\.\,\;\:\"\ ']/g, '').toLowerCase());
    };

    var resourceNamePrefix = removeAllSpace(vmName).slice(0, 5) + '-' +
      removeAllSpace(location).slice(0, 5) + '-' + utils.getRandomString();

    var resourceName = function (postFix) {
      return resourceNamePrefix + '-' + postFix;
    };

    var params = {};
    // General
    params.subscriptionId = subscription.id;
    params.vmName = vmName;
    params.location = location;
    if (imageUrn && imageUrn.indexOf(':') === -1) {
      imageUrn = utils.getImageAliasUrn(imageUrn);
    }
    params.imageUrn = imageUrn;
    // hardwareProfile
    // For quick create requirement is to have 'Standard_DS1' as default
    params.vmSize = (options.vmSize || this.getDefaultVmSize(location, _));
    // osProfile
    params.computerName = params.vmName;
    params.adminUsername = adminUsername;
    params.adminPassword = adminPassword;
    params.sshPublickeyFile = options.sshPublickeyFile;
    params.osType = osType;
    params.customData = options.customData;
    // storageProfile - storage accountweb
    params.storageAccountName = options.storageAccountName ? options.storageAccountName : ('sto' + utils.getRandomString()).substring(0, 24);
    params.storageAccountContainerName = 'vhds';
    // storageProfile.osDiskProfile
    params.osDiskType = osType;
    // storageProfile.dataDiskProfile
    params.dataDisks = [];
    // networkProfile - network interface
    params.nicName = resourceName('nic');
    // networkProfile - public IP
    params.publicipName = resourceName('pip');
    params.publicipDomainName = options.publicIpDomainName ? options.publicIpDomainName : resourceName('pip');

    // networkProfile - virtual network
    params.vnetName = resourceName('vnet');
    params.vnetAddressPrefix = '10.0.0.0/16';
    params.vnetSubnetName = resourceName('snet');
    params.vnetSubnetAddressprefix = '10.0.1.0/24';
    // availabilitySetProfile
    // params.availsetName = resourceName('avset');
    
    // boot diagnostics storage URI
    params.disableBootDiagnostics = false;
    params.enableBootDiagnostics = true;
    params.bootDiagnosticsStorageUri = null;

    var serviceClients = this._getServiceClients(subscription);
    // create resource group if not exists
    var response = serviceClients.resourceManagementClient.resourceGroups.list({}, _);
    var rgList = response.resourceGroups;
    var found = false;
    for (var index in rgList) {
      if (rgList[index].name === resourceGroupName) {
        found = true;
      }
    }
    
    if (found === false) {
      var rgParams = { location : location };
      serviceClients.resourceManagementClient.resourceGroups.createOrUpdate(resourceGroupName, rgParams, _);
    }
    
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroupName, params.vmName, _);
    if (vmResult) {
      throw new Error(util.format($('A virtual machine with name "%s" already exists in the resource group "%s"'), vmResult.name, resourceGroupName));
    }

    var vmProfile = new VMProfile(this.cli, resourceGroupName, params, serviceClients);
    var vmCreateProfile = vmProfile.generateVMProfile(_);
    virtualMachine.createOrUpdateVM(resourceGroupName, vmCreateProfile.profile, true, _);
    // Show created VM in case of Quick create
    this.showVM(resourceGroupName, params.vmName, {}, _);
  },

  showVM: function(resourceGroupName, name, options, _) {
    var output = this.cli.output;
    var isJson = output.format().json;
    var depth = 0; // 0 recurse
    if (isJson) {
      if (options.depth) {
        if (options.depth === 'full') {
          depth = -1; // full recurse
        } else {
          depth = utils.parseInt(options.depth);
          if (isNaN(depth)) {
            throw new Error($('--depth is an optional parameter but when specified it must be an integer (number of times to recurse) or text "full" (idefinite recursion)'));
          }
        }
      }
    } else {
      if (options.depth) {
        output.warn($('--depth paramater will be ignored when --json option is not specified'));
      }
    }

    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var dependencies = {
      virtualMachine: new VirtualMachine(this.cli, serviceClients),
      availabilitySet: new AvailabilitySet(this.cli, serviceClients),
      networkNic: new NetworkNic(this.cli, serviceClients.networkResourceProviderClient)
    };

    var vmResult = dependencies.virtualMachine.getVMByNameExpanded(resourceGroupName, name, depth, {}, dependencies, _);
    if (vmResult) {
      var virtualMachine = vmResult;
      if (isJson) {
        output.json(virtualMachine);
      } else {
        virtualMachine = this._populateNics(virtualMachine, subscription, _);
        vmShowUtil.show(virtualMachine, output.data);
      }
    } else {
      if (isJson) {
        output.json({});
      } else {
        throw new Error($('No VMs found'));
      }
    }
  },

  listVM: function(resourceGroupName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmsResult = virtualMachine.getVMList(resourceGroupName, _);
    var output = this.cli.output;
    this.cli.interaction.formatOutput(vmsResult, function (outputData) {
      if (outputData.length === 0) {
        output.info($('No VMs found'));
      } else {
        output.table(outputData, function (row, item) {
          row.cell($('ResourceGroupName'), item.resourceGroupName);
          row.cell($('Name'), item.name);
          row.cell($('ProvisioningState'), item.provisioningState);
          row.cell($('PowerState'), item.powerState ? item.powerState : '');
          row.cell($('Location'), item.location);
          row.cell($('Size'), item.hardwareProfile.vmSize);
        });
      }
    });
  },
  
  listIPAddress: function(resourceGroupName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine=new VirtualMachine(this.cli, serviceClients);
    var vmsResult = virtualMachine.getVMList(resourceGroupName, _);
    for(i = 0; i < vmsResult.length; i++)
    {
      vmsResult[i] = this._populateNics( vmsResult[i], subscription, _);
    }
    var output = this.cli.output;
    this.cli.interaction.formatOutput(vmsResult, function (outputData) {
      if (outputData.length === 0) {
        output.info($('No VMs found'));
      } 
      else {
        output.table(outputData, function (row, item) {
          row.cell($('Resource Group '), item.resourceGroupName);
          row.cell($('Name'), item.name);
          row.cell($('Public IP Address'),  utils.getPublicIp(item));
        });
      }
    });
  },

  deleteVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    if (!options.quiet && !this.cli.interaction.confirm(util.format($('Delete the virtual machine "%s"? [y/n] '), name), _)) {
      return;
    }

    virtualMachine.deleteVM(resourceGroupName, name, _);
  },

  stopVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    var output = this.cli.output;
    output.warn($('VM shutdown will not release the compute resources so you will be billed for the compute resources that this Virtual Machine uses.'));
    output.info($('To release the compute resources use "azure vm deallocate".'));
    virtualMachine.stopVM(resourceGroupName, name, _);
  },

  restartVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    virtualMachine.restartVM(resourceGroupName, name, _);
  },

  startVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    virtualMachine.startVM(resourceGroupName, name, _);
  },

  deallocateVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    virtualMachine.deallocateVM(resourceGroupName, name, _);
  },

  captureVM: function(resourceGroupName, name, vhdNamePrefix, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    params = {
      destinationContainerName: options.storageAccountContainerName || 'vhds',
      vhdPrefix: vhdNamePrefix,
      overwriteVhds: options.overwrite ? true : false
    };

    var result = virtualMachine.captureVM(resourceGroupName, name, params, _);
    if (result.output) {
      if (options.templateFileName) {
        fs.writeFileSync(options.templateFileName, JSON.stringify(result.output, null, 2));
        this.cli.output.info(util.format($('Saved template to file "%s"'), options.templateFileName));
      }
      else {
        this.cli.output.json(result.output);
      }
    }
  },

  generalizeVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    virtualMachine.generalizeVM(resourceGroupName, name, _);
  },

  getInstanceView: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var output = this.cli.output;

    var instanceViewResult = virtualMachine.getInstanceView(resourceGroupName, name, _);
    if (!instanceViewResult) {
      if (output.format().json) {
        output.json({});
      } else {
        output.warn($('No VMs found'));
      }
    } else {
      var vmInstanceView = instanceViewResult;
      this.cli.interaction.formatOutput(vmInstanceView, function () {
        utils.logLineFormat(vmInstanceView, output.data);
      });
    }
  },

  getSerialOutput: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var output = this.cli.output;

    var instanceViewResult = virtualMachine.getInstanceView(resourceGroupName, name, _);
    if (!instanceViewResult) {
      if (output.format().json) {
        output.json({});
      } else {
        output.warn($('No VMs found'));
      }
    } else {
      var vmResult = instanceViewResult;
      if (vmResult) {
        var instanceView = vmResult.instanceView;
        if (instanceView && instanceView.bootDiagnostics && instanceView.bootDiagnostics.consoleScreenshotBlobUri)
        {
          var consoleScreenshotBlobUri = instanceView.bootDiagnostics.consoleScreenshotBlobUri;
          this.cli.output.info(util.format($('Console Screenshot Blob Uri:\n%s'), consoleScreenshotBlobUri));
        }

        if (instanceView && instanceView.bootDiagnostics && instanceView.bootDiagnostics.serialConsoleLogBlobUri)
        {
          var serialConsoleLogBlobUri = instanceView.bootDiagnostics.serialConsoleLogBlobUri;
          this.cli.output.info(util.format($('Serial Console Log Blob Uri:\n%s'), serialConsoleLogBlobUri));

          //Init StorageUtil
          StorageUtil.init(this.cli);

          var result = this._getStorageAccountContainerAndBlobFromUri(serialConsoleLogBlobUri);
          if (result.accountName && result.containerName && result.blobName) {
            var storageClient = serviceClients.storageManagementClient;
            var keys = storageClient.storageAccounts.listKeys(resourceGroupName, result.accountName, _);
            var blobService = azureStorage.createBlobService(result.accountName, keys.keys[0].value, url.parse(serialConsoleLogBlobUri).host);

            var content = '';
            util.inherits(WriteStream, writable);
            WriteStream.prototype._write = function (chunk, encoding, done) {
              content += chunk.toString();
              done();
            };
            var ws = new WriteStream();

            var performStorageOperation = StorageUtil.performStorageOperation;
            var operation = this._getStorageBlobOperation(blobService, 'getBlobToStream');
            var storageOptions = this._getStorageBlobOperationDefaultOption();

            try {
              performStorageOperation(operation, _, result.containerName, result.blobName, ws, storageOptions);
            } 
            catch (e) {
              if (StorageUtil.isNotFoundException(e)) {
                this.cli.output.warn(util.format($('Can not find blob \'%s\' in container \'%s\''), result.blobName, result.containerName));
              }
              else {
                throw e;
              }
            }
            
            var maxLen = options.maxLength === null ? 1000000 : parseInt(options.maxLength, 10);
            var startPos = 0;
            while (startPos < content.length) {
              if (startPos > 0 && !this.cli.interaction.confirm('Do you want to view more log?', _)) {
                break;
              }

              var strlen = startPos + maxLen < content.length ? maxLen : content.length - startPos;
              this.cli.output.info(content.substr(startPos, strlen));
              startPos += parseInt(strlen, 10);
            }
          }
        }
      }
    }
  },

  resetVMAccess: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    options.location = vmResult.location;
    options.osType = vmResult.storageProfile.osDisk.osType;
    options.version = options.extensionVersion;
    var vmExtensionProfile = new VMExtensionProfile(this.cli, options);
    var vmAccessExtension = vmExtensionProfile.generateVMAccessExtensionProfile();

    virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, vmAccessExtension.profile, true, _);
  },

  enableDiagVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    var diagParams = {
      resourceGroupName: resourceGroupName,
      osType: vmResult.storageProfile.osDisk.osType,
      location: vmResult.location,
      version: options.extensionVersion,
      storageAccountName: options.storageAccountName,
      osDiskUri: vmResult.storageProfile.osDisk.vhd.uri,
      configFile: options.configFile,
      vmID: vmResult.id
    };

    var vmExtensionProfile = new VMExtensionProfile(this.cli, diagParams, serviceClients);
    var vmDiagExtension = vmExtensionProfile.generateVMDiagExtensionProfile(_);
    virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, vmDiagExtension.profile, true, _);
  },

  enableAemVM : function(resourceGroupName, name, options, _){
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var aemExtensionUtil = new AemExtensionUtil(this.cli);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    //Fetch storage account used by the vm
    var vmStorageAccounts = {};
    var saProperties;

    StorageUtil.init(this.cli);

    StorageUtil.startProgress($('Getting storage accounts'));
    var storageAccountsResult = null;
    try {
      storageAccountsResult = serviceClients.storageManagementClient.storageAccounts.list(_);
    } finally {
      StorageUtil.endProgress();
    }

    var osDiskUri = blobUtil.splitDestinationUri(vmResult.storageProfile.osDisk.vhd.uri);
    saProperties = aemExtensionUtil.getStorageAccountProperties(serviceClients, storageAccountsResult, osDiskUri.accountName, _);
    vmStorageAccounts[saProperties.name] = saProperties;

    var i;
    for(i = 0; i < vmResult.storageProfile.dataDisks.length; i++){
      var dataDisk = vmResult.storageProfile.dataDisks[i];
      var dataDiskUri = blobUtil.splitDestinationUri(dataDisk.vhd.uri);
      if(!vmStorageAccounts[dataDiskUri.accountName]){
        saProperties = aemExtensionUtil.getStorageAccountProperties(serviceClients, storageAccountsResult, dataDiskUri.accountName, _);
        vmStorageAccounts[saProperties.name] = saProperties;
      }
    }

    //Config logging for storage accounts 
    var vmStorageAccountNames = Object.keys(vmStorageAccounts);
    for(i = 0; i < vmStorageAccountNames.length; i++){
      vmStorageAccount = vmStorageAccounts[vmStorageAccountNames[i]];
      if(vmStorageAccount.type === 'Standard'){ //logging is only appliable for standard storage
        aemExtensionUtil.enableStorageAccountAnalytics(vmStorageAccount, _);
      }
    }

    //Check and config diagnostic extension
    var diagExtension = null;
    if (vmResult.resources)
      for(i = 0; i < vmResult.resources.length; i++){
        extension = vmResult.resources[i];
        if (extension.virtualMachineExtensionType === vmConstants.EXTENSIONS.IAAS_DIAG_NAME && extension.publisher === vmConstants.EXTENSIONS.IAAS_DIAG_PUBLISHER ||
            extension.virtualMachineExtensionType === vmConstants.EXTENSIONS.LINUX_DIAG_NAME && extension.publisher === vmConstants.EXTENSIONS.LINUX_DIAG_PUBLISHER)
          diagExtension = extension;
      }

    var wadStorageAccountName = null;
    if(!diagExtension){
      this.cli.output.info(util.format($('Diagnostic extension must be enabled first for Virtual Machine "%s".'), name));
      if (!options.quiet && !this.cli.interaction.confirm($('Install the virtual machine diagnostic extension? [y/n] '), _)) {
        this.cli.output.error($('Canceled. Please enable diagnostic extension first.'));
        return;
      }

      wadStorageAccountName = options.diagnosticStorageAccountName;
      if(!wadStorageAccountName){
        //Choose a standard storage account for diagnostic extension
        for(i = 0; i < vmStorageAccountNames.length; i++){
          vmStorageAccount = vmStorageAccounts[vmStorageAccountNames[i]];
          if(vmStorageAccount.type === 'Standard'){
            wadStorageAccountName = vmStorageAccount.name;
            break;
          }
        }
      }

      if(!wadStorageAccountName){
        this.cli.output.error($('Can\'t find a standard storage account for diagnostic extension to use.'));
        this.cli.output.error($('Please specify one with option -a, --diagnostic-storage-account-name'));
        return;
      }

      var diagParams = {
        resourceGroupName: resourceGroupName,
        osType: vmResult.storageProfile.osDisk.osType,
        location: vmResult.location,
        storageAccountName: wadStorageAccountName,
        vmID: vmResult.id
      };

      var progress = this.cli.interaction.progress($('Preparing parameters for diagnostic extension'));
      try {
        var vmDiagExtensionProfile = new VMExtensionProfile(this.cli, diagParams, serviceClients);
        diagExtension = vmDiagExtensionProfile.generateVMDiagExtensionProfile(_).profile;
      } finally {
        progress.end();
      }
      virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, diagExtension, true, _);
    }
    else {
	  wadStorageAccountName = options.diagnosticStorageAccountName;
      if(!wadStorageAccountName){
        if (diagExtension.settings)
          wadStorageAccountName = diagExtension.settings.StorageAccount ? diagExtension.settings.StorageAccount : diagExtension.settings.storageAccount;
        if(!wadStorageAccountName){
          this.cli.output.error($('Can\'t get storage account name from diagnostic extension settings'));
          this.cli.output.error($('Please specify one with option -a, --diagnostic-storage-account-name'));
          return;
        } 
      }
    }

    if(!vmStorageAccounts[wadStorageAccountName]){
      saProperties = aemExtensionUtil.getStorageAccountProperties(serviceClients, storageAccountsResult, wadStorageAccountName, _);
      vmStorageAccounts[saProperties.name] = saProperties;
    }

    var aemParams = {
      resourceGroupName: resourceGroupName,
      verbose: options.verbose,
      location: vmResult.location,
      osType: vmResult.storageProfile.osDisk.osType,
      vmSize: vmResult.hardwareProfile.vmSize,
      wadStorageAccount: wadStorageAccountName,
      osDisk: vmResult.storageProfile.osDisk,
      dataDisks: vmResult.storageProfile.dataDisks,
      vmStorageAccounts: vmStorageAccounts
    };

    var vmAEMExtensionProfile = new VMExtensionProfile(this.cli, aemParams, serviceClients);
    var vmAEMExtension = vmAEMExtensionProfile.generateVMAemProfile();
    virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, vmAEMExtension.profile, true, _);
  },

  setVM: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    // boot diagnostics storage URI
    if (options.disableBootDiagnostics || options.enableBootDiagnostics || options.bootDiagnosticsStorageUri) {
      options.disableBootDiagnostics = !!(options.disableBootDiagnostics);
      options.enableBootDiagnostics = options.enableBootDiagnostics ? true : (options.disableBootDiagnostics ? false : true);
      options.enableBootDiagnostics = options.bootDiagnosticsStorageUri ? true : options.enableBootDiagnostics;
      options.bootDiagnosticsStorageUri = options.disableBootDiagnostics ? '' : (options.bootDiagnosticsStorageUri ? options.bootDiagnosticsStorageUri : null);
    }
    else {
      options.disableBootDiagnostics = null;
      options.enableBootDiagnostics = null;
      options.bootDiagnosticsStorageUri = null;
    }

    var vmProfile = new VMProfile(this.cli, resourceGroupName, options, serviceClients);
    vmResult = vmProfile.updateVMProfile(vmResult, _);

    virtualMachine.createOrUpdateVM(resourceGroupName, vmResult, false, _);
  },

  listVMSizesOrLocationVMSizes: function(options, _) {
    if (options.location && options.vmName) {
      throw new Error($('Both --location and --vm-name parameters cannot be specified together.'));
    }

    if (options.vmName) {
      if (!options.resourceGroup) {
        options.resourceGroup = this.cli.interaction.promptIfNotGiven($('Resource group name: '), options.resourceGroup, _);
      }
    } else if (!options.location) {
      throw new Error($('One of the optional parameter --location or --vm-name is required.'));
    }

    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var sizeResult;

    if (options.vmName) {
      var vmResult = virtualMachine.getVM(options.resourceGroup, options.vmName, _);
      if (!vmResult) {
        throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), options.vmName, options.resourceGroup));
      }

      sizeResult = virtualMachine.getVMSizesByVMName(options.resourceGroup, options.vmName, _);
    } else {
      sizeResult = virtualMachine.getVMSizesByLocationName(options.location, _);
    }

    var output = this.cli.output;
    this.cli.interaction.formatOutput(sizeResult, function (outputData) {
      if (outputData.length === 0) {
        output.info($('No VM size details found'));
      } else {
        output.table(outputData, function (row, item) {
          row.cell($('Name'), item.name);
          row.cell($('CPU Cores'), item.numberOfCores);
          row.cell($('Memory (MB)'), item.memoryInMB);
          row.cell($('Max data-disks'), item.maxDataDiskCount);
          row.cell($('Max data-disk Size (MB)'), item.resourceDiskSizeInMB);
          row.cell($('Max OS-disk Size (MB)'), item.osDiskSizeInMB);
        });
      }
    });
  },

  listComputeUsage: function(location, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var client = utils.createComputeManagementClient(subscription);

    var usageResult = client.usageOperations.list(location, _);
    var output = this.cli.output;
    if(!usageResult || usageResult.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn($('No compute usage information found'));
      }

      return;
    }

    var usages = usageResult;
    this.cli.interaction.formatOutput(usages, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Name'), item.name.localizedValue);
        row.cell($('Unit'), item.unit);
        row.cell($('CurrentValue'), item.currentValue);
        row.cell($('Limit'), item.limit);
      });
    });
  },

  attachNewDataDisk: function(resourceGroup, vmName, size, vhdName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var params = {};
    params.dataDiskSize = size;
    params.dataDiskCaching = options.hostCaching;
    params.dataDiskVhd = vhdName;
    params.vmName = vmName;
    params.storageAccountName = options.storageAccountName;
    params.storageAccountContainerName = options.storageAccountContainerName || 'vhds';
    params.lun = options.lun;
    params.newDataDisk = true;

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroup, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroup));
    }

    if (!options.storageAccountName) {
      params.osDiskUri = vmResult.storageProfile.osDisk.vhd.uri;
    } else {
      params.location = vmResult.location;
    }

    params.dataDisks = vmResult.storageProfile.dataDisks;
    var vmStorageProfile = new VMStorageProfile(this.cli, resourceGroup, params, serviceClients);
    var newDataDisk = vmStorageProfile.generateDataDiskProfile(_);
    this.cli.output.info(util.format($('New data disk location: %s '), newDataDisk.vhd.uri));

    var dataDisks = vmResult.storageProfile.dataDisks || [];
    dataDisks.push(newDataDisk);

    try {
      virtualMachine.createOrUpdateVM(resourceGroup, vmResult, false, _);
    } catch (err) {
      if (err.code === 'InvalidParameter' && err.message === 'The value of parameter \'dataDisk.lun\' is invalid.') {
        throw new Error(util.format($('Exceeded the maximum number of data disks that can be attached to a VM with size "%s".'), vmResult.hardwareProfile.vmSize));
      } else {
        throw err;
      }
    }
  },

  attachDataDisk: function(resourceGroup, vmName, vhdUrl, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var params = {};
    params.dataDiskCaching = options.hostCaching;
    params.dataDiskVhd = vhdUrl;
    params.vmName = vmName;
    params.lun = options.lun;
    params.newDataDisk = false;

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroup, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroup));
    }

    params.dataDisks = vmResult.storageProfile.dataDisks;
    var vmStorageProfile = new VMStorageProfile(this.cli, resourceGroup, params, serviceClients);
    var newDataDisk = vmStorageProfile.generateDataDiskProfile(_);

    var dataDisks = vmResult.storageProfile.dataDisks || [];
    dataDisks.push(newDataDisk);

    try {
      virtualMachine.createOrUpdateVM(resourceGroup, vmResult, false, _);
    } catch (err) {
      if (err.code === 'InvalidParameter' && err.message === 'The value of parameter \'dataDisk.lun\' is invalid.') {
        throw new Error(util.format($('Exceeded the maximum number of data disks that can be attached to a VM with size "%s".'), vmResult.hardwareProfile.vmSize));
      } else {
        throw err;
      }
    }
  },

  detachDataDisk: function(resourceGroup, vmName, lun, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var lunAsInt = utils.parseInt(lun);
    if (isNaN(lunAsInt)) {
      throw new Error($('lun must be an integer'));
    }

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroup, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroup));
    }

    var vmStorageProfile = new VMStorageProfile(this.cli, resourceGroup, {}, serviceClients);
    vmStorageProfile.removeDataDiskByLun(vmResult, lunAsInt);

    virtualMachine.createOrUpdateVM(resourceGroup, vmResult, false, _);
  },

  listDataDisks: function(resourceGroup, vmName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroup, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroup));
    }

    var dataDisks = vmResult.storageProfile.dataDisks;
    var output = this.cli.output;
    if(!dataDisks || dataDisks.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn($('No data disks found'));
      }

      return;
    }

    this.cli.interaction.formatOutput(dataDisks, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Name'), item.name);
        row.cell($('Lun'), item.lun);
        row.cell($('DiskSizeGB'), item.diskSizeGB ? item.diskSizeGB : '');
        row.cell($('Caching'), item.caching);
        row.cell($('URI'), item.vhd.uri);
      });
    });
  },

  setExtension: function(resourceGroupName, vmName, extensionName, publisherName, version, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroupName, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroupName));
    }

    virtualMachine = vmResult;
    if (virtualMachine.storageProfile.osDisk.osType === 'Windows') {
      if (!virtualMachine.osProfile.windowsConfiguration || !virtualMachine.osProfile.windowsConfiguration.provisionVMAgent) {
        throw new Error($('Provision Guest Agent must be enabled on the VM before setting VM Extension.'));
      }
    }

    if (options.uninstall) {
      this._uninstallExtension(resourceGroupName, vmName, extensionName, serviceClients, options, _);
      return;
    }

    options.location = vmResult.location;
    this._createOrUpdateExtension(resourceGroupName, vmName, extensionName, publisherName, version, options, serviceClients, _);
  },

  setChefExtension: function(resourceGroupName, vmName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
 
    if (!options.clientPem && !options.validationPem) {
      options.validationPem = this.cli.interaction.promptIfNotGiven($('VM Extension validation pem file path: '), options.validationPem, _);
    }

    if (!options.clientConfig) {
      options.clientConfig = this.cli.interaction.promptIfNotGiven($('Chef client config file(i.e client.rb) path: '), options.clientConfig, _);
    }

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroupName, vmName, _);
    options.location = vmResult.location;

    var extensionName = '';
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroupName));
    }

    // set extension name
    virtualMachine = vmResult;
    if (virtualMachine.storageProfile.osDisk.osType === 'Windows') {
      extensionName = 'ChefClient';
     if (!virtualMachine.osProfile.windowsConfiguration || !virtualMachine.osProfile.windowsConfiguration.provisionVMAgent) {
        throw new Error($('Provision Guest Agent must be enabled on the VM before setting VM Extension.'));
      }
    } else {
      extensionName = 'LinuxChefClient';
    }

    if (options.uninstall) {
      this._uninstallExtension(resourceGroupName, vmName, extensionName, serviceClients, options, _);
      return;
    }

    // set version to latest
    if(!options.version) {
      var vmImage = new VMImage(this.cli, serviceClients);
      var versionsResult = vmImage.getVMExtensionImageVersionList(options.location, CHEFPUBLISHER, extensionName, _);
      var versions = versionsResult;
      var ver = versions[versions.length-1].name.split('.');
      options.version = ver[0] + '.' + ver[1];
    }
  
    // form and set public and private config for chef
    pubConfig = {};
    priConfig = {};

    pubConfig['client_rb'] = fs.readFileSync(options.clientConfig).toString();
    pubConfig['runlist'] = options.runList;
    pubConfig['bootstrap_version'] = options.bootstrapVersion;
    pubConfig['chef_daemon_interval'] = options.chefDaemonInterval;

    if (virtualMachine.storageProfile.osDisk.osType === 'Windows' && options.daemon) {
      if (['none', 'service', 'task'].indexOf(options.daemon) != -1) {
        pubConfig['daemon'] = options.daemon;
      } else {
        throw new Error(util.format($('Invalid user input for --daemon option.')));
      }
    } else if (options.daemon) {
      throw new Error(util.format($('The daemon option is valid for Windows node.')));
    }

    if (options.jsonAttributes) {
      try {
        pubConfig['custom_json_attr'] = JSON.parse(options.jsonAttributes);
      } catch (er) {
        log.error('Bad user input for --json-attributes option', er);
        return cb(er);
      }
    }

    if (options.bootstrapOptions) {
      try {
        pubConfig['bootstrap_options'] = JSON.parse(options.bootstrapOptions);
      } catch (er) {
        log.error('Bad user input for -j or --bootstrap-options option', er);
        return cb(er);
      }
    }

    if (options.secretFile){
      priConfig['encrypted_data_bag_secret'] = fs.readFileSync(options.secretFile).toString();
    } else if (options.secret) {
      priConfig['encrypted_data_bag_secret'] = options.secret;
    }

    if (options.clientPem) {
      priConfig['client_pem'] = fs.readFileSync(options.clientPem).toString();
    } else {
      priConfig['validation_key'] = fs.readFileSync(options.validationPem).toString();
    }

    options.publicConfig = pubConfig;
    options.privateConfig = priConfig;

    this._createOrUpdateExtension(resourceGroupName, vmName, extensionName, CHEFPUBLISHER, options.version, options, serviceClients, _);

  },

  getExtensions: function(resourceGroup, vmName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroup, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroup));
    }

    var output = this.cli.output;
    if(!vmResult.resources || vmResult.resources.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn($('No VM extensions found'));
      }

      return;
    }

    this.cli.interaction.formatOutput(vmResult.resources, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Name'), item.name);
        row.cell($('Version'), item.typeHandlerVersion);
        row.cell($('State'), item.provisioningState);
      });
    });
  },

  getChefExtension: function(resourceGroup, vmName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(resourceGroup, vmName, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), vmName, resourceGroup));
    }

    var output = this.cli.output;
    if(!vmResult.resources || vmResult.resources.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn($('No VM extensions found'));
      }

      return;
    }

    this.cli.interaction.formatOutput(vmResult.resources, function (outputData) {
      var chefextn = outputData.filter(function(obj) {
        return obj.publisher === CHEFPUBLISHER;
      });
      
      output.table(chefextn, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Name'), item.name);
        row.cell($('Version'), item.typeHandlerVersion);
        row.cell($('State'), item.provisioningState);
      });
    });
  },

  createDockerVM: function(resourceGroupName, vmName, location, osType, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var dockerExtensionParams = {
      dockerPort: options.dockerPort,
      dockerCertDir: options.dockerCertDir,
      version: options.dockerExtensionVersion,
      location: location,
      vmName: vmName,
      dockerCertCn: options.dockerCertCn
    };
    var vmExtensionProfile = new VMExtensionProfile(this.cli, dockerExtensionParams);
    var dockerExtension = vmExtensionProfile.generateDockerExtensionProfile(_);

    this.createVM(resourceGroupName, vmName, location, osType, options, _);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    try {
      virtualMachine.createOrUpdateVMExtension(resourceGroupName, vmName, dockerExtension.profile, true, _);
    } catch (e) {
      virtualMachine.deleteVM(resourceGroupName, vmName, _);
      throw e;
    }
  },

  listVMImagePublishers: function (location, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImage = new VMImage(this.cli, serviceClients);
    var publishersResult = vmImage.getVMImagePublisherList(location, _);

    var publishers = publishersResult;
    var output = this.cli.output;
    if(!publishers || publishers.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn(util.format($('No virtual machine and/or extension image publishers found in the region "%s"'),location));
      }

      return;
    }

    this.cli.interaction.formatOutput(publishers, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.name);
        row.cell($('Location'), item.location);
      });
    });
  },

  listVMImageOffers: function (location, publisherName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImage = new VMImage(this.cli, serviceClients);
    var offersResult = vmImage.getVMImageOffersList(location, publisherName, _);

    var offers = offersResult;
    var output = this.cli.output;
    if(!offers || offers.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn(util.format($('No virtual machine image offers found (publisher: "%s" location:"%s")'),publisherName, location));
      }

      return;
    }

    this.cli.interaction.formatOutput(offers, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Offer'), item.name);
        row.cell($('Location'), item.location);
      });
    });
  },

  listVMImageSkus: function (location, publisherName, offer, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImage = new VMImage(this.cli, serviceClients);
    var skuResult = vmImage.getVMImageSkusList(location, publisherName, offer, _);

    var skus = skuResult;
    var output = this.cli.output;
    if(!skus || skus.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn(util.format($('No virtual machine image skus found (publisher: "%s" location:"%s" offer:"%s")'),publisherName, location, offer));
      }

      return;
    }

    this.cli.interaction.formatOutput(skus, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Offer'), item.offer);
        row.cell($('sku'), item.name);
        row.cell($('Location'), item.location);
      });
    });
  },

  listVMImages: function (params, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var imageFilter = {
      location: params.location,
      publishername: params.publisher,
      offer: params.offer,
      skus: params.sku
    };

    var vmImage = new VMImage(this.cli, serviceClients);
    var imagesResult = vmImage.getVMImageList(imageFilter, _);
    var images = imagesResult;
    var output = this.cli.output;
    if(!images || images.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn($('No virtual machine images found'));
      }

      return;
    }

    this.cli.interaction.formatOutput(images, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Offer'), item.offer);
        row.cell($('Sku'), item.skus);
        row.cell($('OS'), item.operatingSystem);
        row.cell($('Version'), item.name);
        row.cell($('Location'), item.location);
        row.cell($('Urn'), item.urn);
      });
    });
  },

  getVMImageDetails: function (params, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var imageFilter = {
      location: params.location,
      publishername: params.publisher,
      offer: params.offer,
      skus: params.sku,
      version: params.version
    };

    var vmImage = new VMImage(this.cli, serviceClients);
    var imagesResult = vmImage.getVMImageDetails(imageFilter, _);
    var images = imagesResult;
    var output = this.cli.output;
    if(!images || images.length === 0) {
      output.warn($('No virtual machine images found'));
    }
    else {
      if (output.format().json) {
        output.json(images);
      }
      else {
        this.cli.interaction.formatOutput(images, function (outputData) {
          output.table(outputData, function (row, item) {
            row.cell($('Publisher'), params.publisher);
            row.cell($('Offer'), params.offer);
            row.cell($('Sku'), params.sku);
            row.cell($('OS'), item.osDiskImage ? item.osDiskImage.operatingSystem : null);
            row.cell($('Version'), item.name);
            row.cell($('Location'), item.location);
            row.cell($('Urn'), params.publisher + ':' + params.offer + ':' + params.sku + ':' + item.name);
            if (item.dataDiskImages && item.dataDiskImages.length > 0) {
              row.cell($('DataDiskImages'), item.dataDiskImages);
            }
          });
        });
      }
    }
  },

  listVMExtensionImageTypes: function (location, publisherName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImage = new VMImage(this.cli, serviceClients);
    var typesResult = vmImage.getVMExtensionImageTypeList(location, publisherName, _);

    var types = typesResult;
    var output = this.cli.output;
    if(!types || types.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn(util.format($('No virtual machine extension image types found (publisher: "%s" location:"%s")'),publisherName, location));
      }

      return;
    }

    this.cli.interaction.formatOutput(types, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Type'), item.name);
        row.cell($('Location'), item.location);
      });
    });
  },

  listVMExtensionImageVersions: function (location, publisherName, typeName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImage = new VMImage(this.cli, serviceClients);
    var versionsResult = vmImage.getVMExtensionImageVersionList(location, publisherName, typeName, _);

    var versions = versionsResult;
    var output = this.cli.output;
    if(!versions || versions.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn(util.format($('No virtual machine extension image versions found (publisher: "%s" type: "%s" location:"%s")'),publisherName, typeName, location));
      }

      return;
    }

    this.cli.interaction.formatOutput(versions, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Type'), item.typeName);
        row.cell($('Version'), item.name);
        row.cell($('Location'), item.location);
      });
    });
  },

  listVMExtensionImages: function (location, publisher, typeName, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImageClient = new VMImage(this.cli, serviceClients);
    var extImagesResult = vmImageClient.getVMExtensionImageList(location, publisher, typeName, _);
    var extImages = extImagesResult;
    var output = this.cli.output;
    if(!extImages || extImages.length === 0) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn($('No virtual machine extension images found'));
      }

      return;
    }

    this.cli.interaction.formatOutput(extImages, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Publisher'), item.publisher);
        row.cell($('Type'), item.typeName);
        row.cell($('Version'), item.name);
        row.cell($('Location'), item.location);
      });
    });
  },

  getVMExtensionImage: function (location, publisherName, typeName, version, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);

    var vmImage = new VMImage(this.cli, serviceClients);
    var imageResult = vmImage.getVMExtensionImage(location, publisherName, typeName, version, _);

    var output = this.cli.output;
    if(!imageResult) {
      if (output.format().json) {
        output.json([]);
      } else {
        output.warn(util.format($('No virtual machine extension images found (publisher: "%s" type: "%s" version: "%s" location:"%s")'),publisherName, typeName, version, location));
      }

      return;
    }
    else {
      output.json(imageResult);
    }
  },

  _createOrUpdateExtension: function(resourceGroupName, vmName, extensionName, publisherName, version, options, serviceClients, _) {
    options.extensionName = extensionName;
    options.publisherName = publisherName;
    options.version = version;

    var vMExtensionProfile = new VMExtensionProfile(this.cli, options);
    var vmExtension = vMExtensionProfile.generateExtensionProfile();

    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    virtualMachine.createOrUpdateVMExtension(resourceGroupName, vmName, vmExtension.profile, true, _);
  },

  _uninstallExtension: function(resourceGroupName, vmName, extensionName, serviceClients, options, _) {
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var extension = virtualMachine.getVMExtension(resourceGroupName, vmName, extensionName, _);
    if (!extension) {
      throw new Error(util.format($('Extension "%s" not found under the virtual machine "%s"'), extensionName, vmName));
    }

    if (!options.quiet && !this.cli.interaction.confirm(util.format($('Uninstall the virtual machine extension "%s"? [y/n] '), extensionName), _)) {
      return;
    }

    virtualMachine.deleteVMExtension(resourceGroupName, vmName, extensionName, _);
  },

  _populateNics: function (virtualMachine, subscription, _) {
    if (!virtualMachine || !virtualMachine.networkProfile || !virtualMachine.networkProfile.networkInterfaces) {
      return virtualMachine;
    }

    var networkInterfaces = virtualMachine.networkProfile.networkInterfaces;
    if (networkInterfaces.length > 0) {
      var networkResourceProviderClient = utils.createNetworkManagementClient(subscription);
      var networkNic = new NetworkNic(this.cli, networkResourceProviderClient);
      var networkPublicIP = new NetworkPublicIP(this.cli, networkResourceProviderClient);
      for (var i = 0; i < networkInterfaces.length; i++) {
        var networkInterface = networkInterfaces[i];
        var nicInfo = networkNic.getNICInfoById(networkInterface.id, _);
        if (nicInfo.profile) {
          networkInterface.expanded = nicInfo.profile;
          var ipConfigurations = networkInterface.expanded.ipConfigurations;
          if (ipConfigurations && ipConfigurations.length > 0) {
            // Right now CRP supports only one IPConfiguration
            var ipConfiguration = ipConfigurations[0];
            if (ipConfiguration.publicIPAddress && ipConfiguration.publicIPAddress.id) {
              var pubIPInfo = networkPublicIP.getPublicIPInfoById(ipConfiguration.publicIPAddress.id, _);
              if (pubIPInfo.profile) {
                ipConfiguration.publicIPAddress.expanded = pubIPInfo.profile;
              }
            }
          }
        }
      }
    }

    return virtualMachine;
  },

  _getServiceClients: function(subscription) {
    return {
      computeManagementClient: utils.createComputeManagementClient(subscription),
      storageManagementClient: utils.createStorageResourceProviderClient(subscription),
      networkResourceProviderClient: utils.createNetworkManagementClient(subscription),
      resourceManagementClient: utils.createResourceClient(subscription)
    };
  },

  _leftPadTwo : function (n) {
      return (n < 10 ? '0' : '') + n;
  },

  _toUTC: function (date) {
      return (date.getUTCFullYear() + '-' +
      this._leftPadTwo((date.getUTCMonth() + 1)) + '-' +
      this._leftPadTwo(date.getUTCDate()) + 'T' +
      this._leftPadTwo(date.getUTCHours()) + ':' +
      this._leftPadTwo(date.getUTCMinutes()) + ':' +
      this._leftPadTwo(date.getUTCSeconds()) + 'Z');
  },
  
  _getStorageAccountContainerAndBlobFromUri : function(serialConsoleLogBlobUri) {
    var result = {
        accountName : null,
        containerName : null,
        blobName : null
    };

    var parsedResult = url.parse(serialConsoleLogBlobUri, true);
    var hostName = parsedResult.host || '';
    var hostSegments = hostName.split('.');
    var containerAndBlobPath = parsedResult.path || '';
    if (containerAndBlobPath.length > 0 && containerAndBlobPath.charAt(0) === '/') {
      containerAndBlobPath = containerAndBlobPath.substr(1, containerAndBlobPath.length - 1);
    }
    var pathSegments = containerAndBlobPath.split('/');

    if (hostSegments.length > 0 && pathSegments.length == 2) {
      result.accountName = hostSegments[0];
      result.containerName = pathSegments[0];
      result.blobName = pathSegments[1];
    }
    return result;
  },
  
  _getStorageBlobOperation : function(serviceClient, operationName) {
    return StorageUtil.getStorageOperation(serviceClient, StorageUtil.OperationType.Blob, operationName);
  },

  _getStorageBlobOperationDefaultOption : function() {
    var option = StorageUtil.getStorageOperationDefaultOption();

    // Add blob specific options here
    option.parallelOperationThreadCount = StorageUtil.threadsInOperation;

    return option;
  },

  createVMBackup: function (resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
        
    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
        throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    // generate the sas uris of the vm 
    var storageBlobUris = [];
    storageBlobUris.push(vmResult.storageProfile.osDisk.vhd.uri);
    var dataDisks = vmResult.storageProfile.dataDisks;
    dataDisks.forEach(function (dataDisk) {
        storageBlobUris.push(dataDisk.vhd.uri);
    });

    var storageSASBlobUris = [];
    for (var i in storageBlobUris) {
        var blobUri = storageBlobUris[i];
        var result = this._getStorageAccountContainerAndBlobFromUri(blobUri);
        if (result.accountName && result.containerName && result.blobName) {
            var storageClient = serviceClients.storageManagementClient;
            var keys = storageClient.storageAccounts.listKeys(resourceGroupName, result.accountName, _);
            var blobService = azureStorage.createBlobService(result.accountName, keys.keys[0].value);
            var startDate = new Date();
            startDate.setMinutes(startDate.getMinutes() - 2);
            var expiryDate = new Date(startDate);
            expiryDate.setMinutes(startDate.getMinutes() + 60);
            var sharedAccessPolicy = {
                Id: null,
                AccessPolicy: {
                    Permissions: StorageUtil.BlobPermission.Read + StorageUtil.BlobPermission.Write,
                    Start: this._toUTC(startDate),
                    Expiry: this._toUTC(expiryDate)
                }
            };
            var queryString = blobService.generateSharedAccessSignature(result.containerName, result.blobName, sharedAccessPolicy);
            var uri = blobUri + '?' + queryString;
            storageSASBlobUris.push(uri);
        } else {
            throw new Error(util.format($('wrong blob uri found %s '), blobUri));
        }
    }
    var params = {};
        
    params.location = vmResult.location;
    params.osType = vmResult.storageProfile.osDisk.osType;
    params.version = options.extensionVersion;
        
    var commandStartTimeUTCTicks = ((new Date().getTime() * 10000) + 621355968000000000).toString();
    params.commandStartTimeUTCTicks = commandStartTimeUTCTicks;
    params.locale = 'en-us';
    params.command = 'snapshot';
    var taskId = utils.uuidGen().toString();
    params.taskId = taskId;
    var tag = utils.uuidGen().toString();
        
    params.objectStr = new Buffer(JSON.stringify({ blobSASUri: storageSASBlobUris })).toString('base64');
        
    var vmBackupPublicConfig = {
        backupMetadata: [{ Key: 'vmbackupidentity', Value: taskId }, { Key: 'vmbackuptag', Value: tag }]
    };
        
    params.pubObjectStr = new Buffer(JSON.stringify(vmBackupPublicConfig)).toString('base64');
        
    var vmExtensionProfile = new VMExtensionProfile(this.cli, params);
    var azureVmBackupExtension = vmExtensionProfile.generateAzureVMBackupExtensionProfile();
        
    var extResult = virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, azureVmBackupExtension.profile, true, _);
        
    if (!(extResult) ||
    !utils.ignoreCaseEquals(extResult.provisioningState, vmConstants.EXTENSIONS.EXTENSION_PROVISIONING_SUCCEEDED)) {
        throw new Error(util.format($('call extension %s failed with : %s  '), vmConstants.AZURE_VM_BACKUP_LINUX_EXTENSION_PUBLISHER, extResult.error.message));
    }
    console.log(util.format($('one snapshot with tag %s is created for this vm.'), tag));
    return true;
  },

  removeVMBackup: function (resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    console.log('removing the backup with identity:' + options.identity);

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
        throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }
    // generate the sas uris of the vm 
    var storageBlobUris = [];
    storageBlobUris.push(vmResult.storageProfile.osDisk.vhd.uri);
    var dataDisks = vmResult.storageProfile.dataDisks;
    dataDisks.forEach(function (dataDisk) {
        storageBlobUris.push(dataDisk.vhd.uri);
    });
    StorageUtil.init(this.cli);
    for (var i in storageBlobUris) {
        var blobUri = storageBlobUris[i];
        var result = this._getStorageAccountContainerAndBlobFromUri(blobUri);
        if (result.accountName && result.containerName && result.blobName) {
            var storageClient = serviceClients.storageManagementClient;
            var keys = storageClient.storageAccounts.listKeys(resourceGroupName, result.accountName, _);
            var blobService = azureStorage.createBlobService(result.accountName, keys.keys[0].value);
            blobService.listAllBlobs = function (container, options, callback) {
                StorageUtil.listWithContinuation(blobService.listBlobsSegmentedWithPrefix, 
                blobService, StorageUtil.ListContinuationTokenArgIndex.Blob, 
                container, options.prefix, null, options, callback);
            };
            var operation = this._getStorageBlobOperation(blobService, 'listAllBlobs');
            var storageOptions = this._getStorageBlobOperationDefaultOption();
            storageOptions.include = 'snapshots,metadata';
            var blobs = [];
            var tips = util.format($('listing blobs in container %s'), result.containerName);
            startProgress(tips);
            var performStorageOperation = StorageUtil.performStorageOperation;
            try {
                blobs = performStorageOperation(operation, _, result.containerName, storageOptions);
            } finally {
                endProgress();
            }
            for (var j = 0, len = blobs.length; j < len; j++) {
                blob = blobs[j];
                if (blob.metadata['vmbackuptag'] == options.identity) {
                    console.log('the snapshot with the tag found.');
                    storageOptions = this._getStorageBlobOperationDefaultOption();
                    storageOptions.snapshotId = blob.snapshot;
                    tips = util.format($('Deleting Blob %s in container %s'), blob.name, result.containerName);
                    operation = this._getStorageBlobOperation(blobService, 'deleteBlob');
                    startProgress(tips);
                    try {
                        performStorageOperation(operation, _, result.containerName, blob.name, storageOptions);
                    } catch (e) {
                        if (StorageUtil.isNotFoundException(e)) {
                            throw new Error(util.format($('Can not remove blob snapshot \'%s\' in container \'%s\''), blob.name, result.containerName));
                        } else {
                            throw e;
                        }
                    } finally {
                        endProgress();
                    }
                }
            }
        } else {
            throw new Error(util.format($('wrong blob uri found %s '), blobUri));
        }
    }
  },

  setAzureDiskEncryption: function (resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var params = {};

    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
        }
       
    if (!utils.ignoreCaseEquals(vmResult.storageProfile.osDisk.osType, 'Linux')) {
        if (options.passphrase) {
            throw new Error($('The passphase option is only supported for pre-encrypted Linux operating system volumes.')); 
        }
    } else {
        params.passphrase = options.passphrase;
    }

    if (utils.ignoreCaseEquals(vmResult.storageProfile.osDisk.osType, 'Linux') && 
         (!(utils.ignoreCaseEquals(options.volumeType, 'OS') ||
            utils.ignoreCaseEquals(options.volumeType, 'Data') ||
            utils.ignoreCaseEquals(options.volumeType, 'All')))) {
         throw new Error($('--volume-type option is missing (must be OS, Data, or All)'));
    }    

    if (utils.ignoreCaseEquals(vmResult.storageProfile.osDisk.osType, 'Linux') && (!options.skipVmBackup)) {
        var createResult = this.createVMBackup(resourceGroupName, name, options, _);
        if (!createResult) {
            throw new Error($('create backup failed.'));
        }
    }

    params.location = vmResult.location;
    params.osType = vmResult.storageProfile.osDisk.osType;
    params.version = options.extensionVersion;
    params.aadClientId = options.aadClientId;
    params.aadClientSecret = options.aadClientSecret;
    params.aadClientCertThumbprint = options.aadClientCertThumbprint;
    params.diskEncryptionKeyVaultUrl = options.diskEncryptionKeyVaultUrl;
    params.diskEncryptionKeyVaultId = options.diskEncryptionKeyVaultId;
    params.keyEncryptionKeyUrl = options.keyEncryptionKeyUrl;
    params.keyEncryptionKeyVaultId = options.keyEncryptionKeyVaultId;
    params.keyEncryptionAlgorithm = options.keyEncryptionAlgorithm;
    params.volumeType = options.volumeType;
    params.sequenceVersion = options.sequenceVersion;
    params.autoUpgradeMinorVersion = !options.disableAutoUpgradeMinorVersion;

    // If keyEncryptionKeyUrl is not null but keyEncryptionAlgorithm is, use the default key encryption algorithm
    if(!utils.stringIsNullOrEmpty(options.keyEncryptionKeyUrl)) {
        if(utils.stringIsNullOrEmpty(options.keyEncryptionAlgorithm)) {
            params.keyEncryptionAlgorithm = vmConstants.EXTENSIONS.DEFAULT_KEY_ENCRYPTION_ALGORITHM;
        }
    }

    // prepare to install extension 
    var vmExtensionProfile = new VMExtensionProfile(this.cli, params);
    var azureDiskEncryptionExtension = vmExtensionProfile.generateAzureDiskEncryptionExtensionProfile();
    
    // prompt for user verification  
    if (!options.quiet && 
        !this.cli.interaction.confirm($('This cmdlet prepares the VM and enables encryption which may reboot the machine and takes 10-15 minutes to finish. Please save your work on the VM before confirming. Do you want to continue? [y/n] '),_)) 
    {
      return;
    }

    // update the vm with the new extension profile 
    var result = virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, azureDiskEncryptionExtension.profile, true, _);
    if (!(result) ||
        !utils.ignoreCaseEquals(result.provisioningState, vmConstants.EXTENSIONS.EXTENSION_PROVISIONING_SUCCEEDED))
    {
      throw new Error(util.format($('Installing extension failed with : %s  '), result.error.message));
    }

    // get extension status from VM instance view
    var extensionName = '';
    var publisherName = '';
    
    if (utils.ignoreCaseEquals(params.osType, 'Linux')) {
        extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_NAME;
        publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_PUBLISHER;
    }
    else if(utils.ignoreCaseEquals(params.osType, 'Windows')) {
        extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_NAME;
        publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_PUBLISHER;
    }

    var getOptions = { expand : 'instanceView' };
    var extensionResult = serviceClients.computeManagementClient.virtualMachineExtensions.get(resourceGroupName, name, extensionName, getOptions, _);

    if(!extensionResult ||
       !extensionResult.instanceView ||
       !extensionResult.instanceView.statuses ||
       (extensionResult.instanceView.statuses.length < 1) ||
       !utils.ignoreCaseEquals(extensionResult.publisher, publisherName) ||
       !utils.ignoreCaseEquals(extensionResult.virtualMachineExtensionType, extensionName) ||
       !utils.ignoreCaseEquals(extensionResult.provisioningState, vmConstants.EXTENSIONS.EXTENSION_PROVISIONING_SUCCEEDED))
    {
      throw new Error(util.format($('Virtual machine "%s" extension with successful status not found after installing extension  '), extensionName));
    }
    
    var statusUrl = extensionResult.instanceView.statuses[0].message;
    if(utils.stringIsNullOrEmpty(statusUrl))
    {
      throw new Error(util.format($('Extension status is empty. It should be valid KeyVault secret URL'), statusUrl));
    }

    // get VM model 
    var vmModel = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmModel ||
        !vmModel.storageProfile) 
    {
      throw new Error(util.format($('Virtual machine "%s" with valid storage profile is not found under the resource group "%s"'), name, resourceGroupName));
    }

    // prepare to update VM encryption settings
    var encryptionSettings = {
      diskEncryptionKey: {
        sourceVault: {
          id: options.diskEncryptionKeyVaultId
        },
        secretUrl: statusUrl
      },
      //keyEncryptionKey: null,
      enabled: true
    };

    if (options.keyEncryptionKeyVaultId)
    {
      if (options.keyEncryptionKeyUrl) {
        encryptionSettings.keyEncryptionKey = {
          sourceVault: {
            id: options.keyEncryptionKeyVaultId
          },
          keyUrl: options.keyEncryptionKeyUrl
        };
      } else {
        encryptionSettings.keyEncryptionKey = {
          sourceVault: {
            id: options.keyEncryptionKeyVaultId
          }
        };
      }
    }

    // update VM encryption settings
    vmModel.storageProfile.osDisk.encryptionSettings = encryptionSettings;
    return virtualMachine.createOrUpdateVM(resourceGroupName, vmModel, false, _);
  },

  showAzureDiskEncryptionStatus: function (resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var output = this.cli.output;
    var encryptionStatus = {
      osVolumeEncrypted: 'NotEncrypted',
      osVolumeEncryptionSettings: null,
      dataVolumesEncrypted: 'NotEncrypted'
    };

    var vmModel = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmModel) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    if (vmModel.storageProfile.osDisk.encryptionSettings) {
      var extensionName = '';
      var publisherName = '';
      if (utils.ignoreCaseEquals(vmModel.storageProfile.osDisk.osType, 'Linux')) {
        extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_NAME;
        publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_PUBLISHER;
      }
      else if (utils.ignoreCaseEquals(vmModel.storageProfile.osDisk.osType, 'Windows')) {
        extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_NAME;
        publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_PUBLISHER;
      }

      var extensionStatus = null;
      try {
        var getOptions = { expand: 'instanceView' };
        extensionStatus = serviceClients.computeManagementClient.virtualMachineExtensions.get(resourceGroupName, name, extensionName, getOptions, _);
      }
      catch (e) {
        extensionStatus = null;
      }

      // attempt to retrieve extension status message  
      if (extensionStatus &&
        extensionStatus.instanceView &&
        extensionStatus.instanceView.statuses &&
        (extensionStatus.instanceView.statuses.length >= 1) &&
        utils.ignoreCaseEquals(extensionStatus.publisher, publisherName) &&
        utils.ignoreCaseEquals(extensionStatus.virtualMachineExtensionType, extensionName)) {
        encryptionStatus.progressMessage = extensionStatus.instanceView.statuses[0].message;
      }

      // attempt to retrieve extension substatus message 
      var substatusMessage = null;
      if (extensionStatus &&
        extensionStatus.instanceView &&
        extensionStatus.instanceView.substatuses &&
        (extensionStatus.instanceView.substatuses.length >= 1) &&
        utils.ignoreCaseEquals(extensionStatus.publisher, publisherName) &&
        utils.ignoreCaseEquals(extensionStatus.virtualMachineExtensionType, extensionName)) {
        substatusMessage = extensionStatus.instanceView.substatuses[0].message;
      }

      // retrieve os volume encryption settings
      encryptionStatus.osVolumeEncryptionSettings = vmModel.storageProfile.osDisk.encryptionSettings;

      if (utils.ignoreCaseEquals(vmModel.storageProfile.osDisk.osType, 'Linux')) {
        // Linux - get os and data volume encryption state from the instance view status message
        var messageObject = null;
        try {
          messageObject = JSON.parse(substatusMessage);
        }
        catch (e) {
          messageObject = null;  // outdated versions of guest agent produce messages that cannot be parsed
        }

        if (messageObject && messageObject.hasOwnProperty('os')) {
          encryptionStatus.osVolumeEncrypted = messageObject.os;
        } else {
          encryptionStatus.osVolumeEncrypted = 'Unknown';
        }

        if (messageObject && messageObject.hasOwnProperty('data')) {
          encryptionStatus.dataVolumesEncrypted = messageObject.data;
        } else {
          encryptionStatus.dataVolumesEncrypted = 'Unknown';
        }
      }
      else if (utils.ignoreCaseEquals(vmModel.storageProfile.osDisk.osType, 'Windows')) {
        // Windows - get os and data volume encryption state from the vm model 
        if (encryptionStatus.osVolumeEncryptionSettings.enabled && encryptionStatus.osVolumeEncryptionSettings.diskEncryptionKey.secretUrl) {
          encryptionStatus.osVolumeEncrypted = 'Encrypted';
        }

        if ((extensionStatus) &&
          utils.ignoreCaseEquals(extensionStatus.publisher, publisherName) &&
          utils.ignoreCaseEquals(extensionStatus.virtualMachineExtensionType, extensionName) &&
          utils.ignoreCaseEquals(extensionStatus.provisioningState, vmConstants.EXTENSIONS.EXTENSION_PROVISIONING_SUCCEEDED)) {
          if (!extensionStatus.settings.VolumeType ||
            utils.ignoreCaseEquals(extensionStatus.settings.VolumeType, 'All') ||
            utils.ignoreCaseEquals(extensionStatus.settings.VolumeType, 'Data') ||
            (utils.stringIsNullOrEmpty(extensionStatus.settings.VolumeType))) {
            if (utils.ignoreCaseEquals(extensionStatus.settings.EncryptionOperation, 'EnableEncryption')) {
              encryptionStatus.dataVolumesEncrypted = 'Encrypted';
            }
          }
        }
      }
    }

    var isJson = output.format().json;
    if (isJson) {
      output.json(encryptionStatus);
    } else {
      var string = JSON.stringify(encryptionStatus);
      this.cli.output.info(string);
    }

    return encryptionStatus;
  },

  disableAzureDiskEncryption: function(resourceGroupName, name, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var params = {};
    
    var vmResult = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmResult) {
      throw new Error(util.format($('Virtual machine "%s" not found under the resource group "%s"'), name, resourceGroupName));
    }

    params.location = vmResult.location;
    params.osType = vmResult.storageProfile.osDisk.osType;
    params.version = options.extensionVersion;
    params.volumeType = options.volumeType;
    params.sequenceVersion = options.sequenceVersion;
    params.autoUpgradeMinorVersion = !options.disableAutoUpgradeMinorVersion;

    // +---------+---------------+----------------------------+ 
    // | OSType  |  VolumeType   | UpdateVmEncryptionSettings | 
    // +---------+---------------+----------------------------+ 
    // | Windows | OS            | Yes                        | 
    // | Windows | Data          | No                         | 
    // | Windows | Not Specified | Yes                        | 
    // | Linux   | OS            | N/A                        | 
    // | Linux   | Data          | Yes                        | 
    // | Linux   | Not Specified | N/A                        | 
    // +---------+---------------+----------------------------+ 

    if (utils.ignoreCaseEquals(params.osType, 'Linux') && (!utils.ignoreCaseEquals(params.volumeType,'Data'))) {
      throw new Error($('Disabling encryption on Linux is only supported for the Data volume type option'));
    }

    if (utils.ignoreCaseEquals(params.OSType, 'Windows') && utils.ignoreCaseEquals(param.volumeType,'Data')) {
      throw new Error($('Disabling encryption on Windows is only supported for the OS or All volume type option'));
    }
      
    // prepare to uninstall extension
    var vmExtensionProfile = new VMExtensionProfile(this.cli, params);
    var disableAzureDiskEncryptionExtension = vmExtensionProfile.generateDisableAzureDiskEncryptionExtensionProfile(params.osType);

    // prompt user for confirmation 
    if (!options.quiet && 
        !this.cli.interaction.confirm($('This cmdlet disables encryption on the VM which may reboot the machine. Please save your work on the VM before confirming. Do you want to continue? [y/n] '),_)) 
    {
      return;
    }

    // update and uninstall extension 
    var result = virtualMachine.createOrUpdateVMExtension(resourceGroupName, name, disableAzureDiskEncryptionExtension.profile, true, _);
    if (!(result) ||
        !utils.ignoreCaseEquals(result.provisioningState, vmConstants.EXTENSIONS.EXTENSION_PROVISIONING_SUCCEEDED))
    {
      throw new Error(util.format($('Installing extension failed with : %s  '), result.error.message));
    }

    // Get extension status from VM instance view
    var extensionName = '';
    var publisherName = '';
    
    if (utils.ignoreCaseEquals(params.osType, 'Linux')) {
        extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_NAME;
        publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_PUBLISHER;
    }
    else if(utils.ignoreCaseEquals(params.osType, 'Windows')) {
        extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_NAME;
        publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_PUBLISHER;
    }
    
    var getOptions = { expand : 'instanceView' };
    var extensionResult = serviceClients.computeManagementClient.virtualMachineExtensions.get(resourceGroupName, name, extensionName, getOptions, _);

    if(!extensionResult ||
       !extensionResult.instanceView ||
       !extensionResult.instanceView.statuses ||
       (extensionResult.instanceView.statuses.length < 1) ||
       !utils.ignoreCaseEquals(extensionResult.publisher, publisherName) ||
       !utils.ignoreCaseEquals(extensionResult.virtualMachineExtensionType, extensionName) ||
       !utils.ignoreCaseEquals(extensionResult.provisioningState, vmConstants.EXTENSIONS.EXTENSION_PROVISIONING_SUCCEEDED))
    {
      throw new Error(util.format($('Virtual machine "%s" extension with successful status not found after installing extension  '), extensionName));
    }
    
    // get extension status 
    var statusMsg = extensionResult.instanceView.statuses[0].message;
    if(utils.stringIsNullOrEmpty(statusMsg))
    {
      throw new Error($('Extension status is empty.'));
    }

    // get VM model 
    var vmModel = virtualMachine.getVM(resourceGroupName, name, _);
    if (!vmModel ||
        !vmModel.storageProfile) 
    {
      throw new Error(util.format($('Virtual machine "%s" with valid storage profile is not found under the resource group "%s"'), name, resourceGroupName));
    }

    // prepare to disable 
    var encryptionSettings = {
      enabled: false
    };

    // update VM with disable setting 
    vmModel.storageProfile.osDisk.encryptionSettings = encryptionSettings;
    return virtualMachine.createOrUpdateVM(resourceGroupName, vmModel, false, _);

  },

  addSecret: function(params, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(params.group, params.name, _);
    if (vmResult.osProfile.secrets === null) {
      vmResult.osProfile.secrets = [];
    }
    var sourceVaultObj = {
      sourceVault: {
        id : params.sourceVaultId
      },
      vaultCertificates : []
    };
    if (options.certificateUrl) {
      var certUrlObj = {
        certificateUrl : options.certificateUrl,
        certificateStore : options.certificateStore,
      };
      sourceVaultObj.vaultCertificates.push(certUrlObj);
    }
    vmResult.osProfile.secrets.push(sourceVaultObj);
    virtualMachine.createOrUpdateVM(params.group, vmResult, false, _);
  },

  deleteSecret: function(params, options, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var serviceClients = this._getServiceClients(subscription);
    var virtualMachine = new VirtualMachine(this.cli, serviceClients);
    var vmResult = virtualMachine.getVM(params.group, params.name, _);
    if (vmResult.osProfile.secrets !== null) {
      if (options.certificateUrl === null) {
        for (var i0 in vmResult.osProfile.secrets) {
          if (utils.ignoreCaseEquals(vmResult.osProfile.secrets[i0].sourceVault.id, params.sourceVaultId)) {
            vmResult.osProfile.secrets.remove(i0);
            break;
          }
        }
      }
      else {
        for (var i in vmResult.osProfile.secrets) {
          if (utils.ignoreCaseEquals(vmResult.osProfile.secrets[i].sourceVault.id, params.sourceVaultId)) {
            for (var j in vmResult.osProfile.secrets[i].vaultCertificates) {
              if (utils.ignoreCaseEquals(vmResult.osProfile.secrets[i].vaultCertificates[j].certificateUrl, options.certificateUrl)) {
                vmResult.osProfile.secrets[i].vaultCertificates.remove(j);
                break;
              }
            }
            break;
          }
        }
      }
    }
    virtualMachine.createOrUpdateVM(params.group, vmResult, false, _);
  }

});


module.exports = VMClient;
