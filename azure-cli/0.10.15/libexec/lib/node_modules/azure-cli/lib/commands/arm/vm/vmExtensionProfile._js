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

var __ = require('underscore');
var fs = require('fs');
var util = require('util');
var path = require('path');
var exec = require('child_process').exec;
var openssl = require('openssl-wrapper');
var js2xmlparser = require('js2xmlparser');
var utils = require('../../../util/utils');
var tagUtils = require('../tag/tagUtils');
var EndPointUtil = require('../../../util/endpointUtil');
var blobUtil = require('../../../util/blobUtils');
var vmConstants = require('../../../util/vmConstants');

var $ = utils.getLocaleString;

function VMExtensionProfile(cli, params, serviceClients) {
    this.cli = cli;
    this.output = cli.output;
    this.params = params;
    this.serviceClients = serviceClients;
}

__.extend(VMExtensionProfile.prototype, {
  generateExtensionProfile: function() {
    var extensionProfile = this._parseExtensionProfileParams(this.params);
    return {
      profile: extensionProfile
    };
  },

  generateDockerExtensionProfile: function(_) {
    if ((this.params.dockerPort && typeof this.params.dockerPort === 'boolean') || !this.params.dockerPort) {
      this.params.dockerPort = vmConstants.EXTENSIONS.DOCKER_PORT;
    } else {
      var endPointUtil = new EndPointUtil();
      var dockerPortValidation = endPointUtil.validatePort(this.params.dockerPort, 'docker port');
      if (dockerPortValidation.error) {
        throw new Error(dockerPortValidation.error);
      }
    }

    if ((this.params.dockerCertDir && typeof this.params.dockerCertDir === 'boolean') || !this.params.dockerCertDir) {
      var homePath = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
      this.params.dockerCertDir = path.join(homePath, '.docker');
    }

    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.DOCKER_VERSION_ARM;
    }

    var dockerCertPaths = {
      caKey: path.join(this.params.dockerCertDir, 'ca-key.pem'),
      ca: path.join(this.params.dockerCertDir, 'ca.pem'),
      serverKey: path.join(this.params.dockerCertDir, this.params.vmName + '-server-key.pem'),
      server: path.join(this.params.dockerCertDir, this.params.vmName + '-server.csr'),
      serverCert: path.join(this.params.dockerCertDir, this.params.vmName + '-server-cert.pem'),
      clientKey: path.join(this.params.dockerCertDir, 'key.pem'),
      client: path.join(this.params.dockerCertDir, 'client.csr'),
      clientCert: path.join(this.params.dockerCertDir, 'cert.pem')
    };

    this._checkAndGenerateDockerCertificatesIfNeeded(dockerCertPaths, this.params.dockerCertCn, _);

    this.params.extensionName = vmConstants.EXTENSIONS.DOCKER_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.DOCKER_PUBLISHER;
    this.params.publicConfig = this._createDockerPublicConfiguration();
    this.params.privateConfig = this._createDockerPrivateConfiguration(dockerCertPaths);
    this.params.autoUpgradeMinorVersion = true;

    return this.generateExtensionProfile();
  },

  generateVMAccessExtensionProfile: function() {
    if (this.params.osType === 'Linux') {
      return this._generateVMAccessLinuxProfile();
    } else if (this.params.osType === 'Windows') {
      return this._generateVMAccessWindowsProfile();
    }

    return null;
  },

  generateVMDiagExtensionProfile: function(_) {
    if (this.params.osType === 'Linux') {
      return this._generateVMDiagLinuxProfile(_);
    } else if (this.params.osType === 'Windows') {
      return this._generateVMDiagWindowsProfile(_);
    }

    return null;
  },

  _generateVMDiagLinuxProfile: function(_) {
    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.LINUX_DIAG_VERSION;
    }

    this.params.extensionName = vmConstants.EXTENSIONS.LINUX_DIAG_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.LINUX_DIAG_PUBLISHER;
    this.params.publicConfig = this._createDiagPublicConfiguration();
    this.params.privateConfig = this._createDiagPrivateConfiguration(_);
    this.params.autoUpgradeMinorVersion = true;
    
    return this.generateExtensionProfile();
  },

   _generateVMDiagWindowsProfile: function(_) {
     if (utils.stringIsNullOrEmpty(this.params.version)) {
       this.params.version = vmConstants.EXTENSIONS.IAAS_DIAG_VERSION;
     }

     this.params.extensionName = vmConstants.EXTENSIONS.IAAS_DIAG_NAME;
     this.params.publisherName = vmConstants.EXTENSIONS.IAAS_DIAG_PUBLISHER;
     this.params.publicConfig = this._createDiagPublicConfiguration();
     this.params.privateConfig = this._createDiagPrivateConfiguration(_);
     this.params.autoUpgradeMinorVersion = true;

     return this.generateExtensionProfile();
  },

  _createDiagPublicConfiguration: function() {
    var config = {
	  xmlCfg: null,
	  ladCfg: null,
      storageAccount: null,
    };

    if (!utils.stringIsNullOrEmpty(this.params.configFile)) {
      var configFile = fs.readFileSync(this.params.configFile);
      config.xmlCfg = new Buffer(configFile).toString('base64');
    } else {
      if (this.params.osType === 'Windows') {
        this.cli.output.verbose($('--config-file is not specified, using default one.'));
        config.xmlCfg = new Buffer(this._generateDefaultWindowsXmlCfg(this.params.vmID)).toString('base64');
      } else if (this.params.osType === 'Linux') {
        this.cli.output.verbose($('--config-file is not specified, using default one.'));
		config.ladCfg = this._generateDefaultLinuxXmlCfg(this.params.vmID);
      } else {

        return null;
      }
    }

    config.storageAccount = this._getStorageAccountName();

    return config;
  },

  _generateDefaultWindowsXmlCfg: function (vmID) {
    var wadCfg = {
      DiagnosticMonitorConfiguration: {
        '@': {
          overallQuotaInMB: '4096'
        },
        DiagnosticInfrastructureLogs: {
          '@': {
            scheduledTransferPeriod: 'PT1M',
            scheduledTransferLogLevelFilter: 'Warning'
          }
        },
        PerformanceCounters: {
          '@': {
            scheduledTransferPeriod: 'PT1M'
          },
          PerformanceCounterConfiguration: [
            {
              '@': {
                counterSpecifier: '\\Processor(_Total)\\% Processor Time',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'CPU utilization',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Processor(_Total)\\% Privileged Time',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'CPU privileged time',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Processor(_Total)\\% User Time',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'CPU user time',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Processor' +
                ' Information(_Total)\\Processor Frequency',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'CPU frequency',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\System\\Processes',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Processes',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Process(_Total)\\Thread Count',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Threads',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Process(_Total)\\Handle Count',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Handles',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Memory\\% Committed Bytes In Use',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'Memory usage',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Memory\\Available Bytes',
                sampleRate: 'PT15S',
                unit: 'Bytes'
              },
              annotation: {
                '@': {
                  displayName: 'Memory available',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Memory\\Committed Bytes',
                sampleRate: 'PT15S',
                unit: 'Bytes'
              },
              annotation: {
                '@': {
                  displayName: 'Memory committed',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Memory\\Commit Limit',
                sampleRate: 'PT15S',
                unit: 'Bytes'
              },
              annotation: {
                '@': {
                  displayName: 'Memory commit limit',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Memory\\Pool Paged Bytes',
                sampleRate: 'PT15S',
                unit: 'Bytes'
              },
              annotation: {
                '@': {
                  displayName: 'Memory paged pool',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\Memory\\Pool Nonpaged Bytes',
                sampleRate: 'PT15S',
                unit: 'Bytes'
              },
              annotation: {
                '@': {
                  displayName: 'Memory non-paged pool',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\% Disk Time',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'Disk active time',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\% Disk Read Time',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'Disk active read time',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\% Disk Write Time',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'Disk active write time',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Disk Transfers/sec',
                sampleRate: 'PT15S',
                unit: 'CountPerSecond'
              },
              annotation: {
                '@': {
                  displayName: 'Disk operations',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Disk Reads/sec',
                sampleRate: 'PT15S',
                unit: 'CountPerSecond'
              },
              annotation: {
                '@': {
                  displayName: 'Disk read operations',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Disk Writes/sec',
                sampleRate: 'PT15S',
                unit: 'CountPerSecond'
              },
              annotation: {
                '@': {
                  displayName: 'Disk write operations',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Disk Bytes/sec',
                sampleRate: 'PT15S',
                unit: 'BytesPerSecond'
              },
              annotation: {
                '@': {
                  displayName: 'Disk speed',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Disk Read Bytes/sec',
                sampleRate: 'PT15S',
                unit: 'BytesPerSecond'
              },
              annotation: {
                '@': {
                  displayName: 'Disk read speed',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Disk Write' +
                ' Bytes/sec',
                sampleRate: 'PT15S',
                unit: 'BytesPerSecond'
              },
              annotation: {
                '@': {
                  displayName: 'Disk write speed',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Avg. Disk Queue' +
                ' Length',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Disk average queue length',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Avg. Disk Read' +
                ' Queue Length',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Disk average read queue length',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\PhysicalDisk(_Total)\\Avg. Disk Write' +
                ' Queue Length',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Disk average write queue length',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\LogicalDisk(_Total)\\% Free Space',
                sampleRate: 'PT15S',
                unit: 'Percent'
              },
              annotation: {
                '@': {
                  displayName: 'Disk free space (percentage)',
                  locale: 'en-us'
                }
              }
            },
            {
              '@': {
                counterSpecifier: '\\LogicalDisk(_Total)\\Free Megabytes',
                sampleRate: 'PT15S',
                unit: 'Count'
              },
              annotation: {
                '@': {
                  displayName: 'Disk free space (MB)',
                  locale: 'en-us'
                }
              }
            }
          ]
        },
        WindowsEventLog: {
          '@': {
            scheduledTransferPeriod: 'PT1M'
          },
          DataSource: [
            {
              '@': {
                name: 'Application!*[System[(Level = 1 or Level = 2)]]'
              }
            },
            {
              '@': {
                name: 'Security!*[System[(Level = 1 or Level = 2)]'
              }
            },
            {
              '@': {
                name: 'System!*[System[(Level = 1 or Level = 2)]]'
              }
            }
          ]
        },
        Metrics: {
          '@': {
            resourceId: vmID
          },
          MetricAggregation: [
            {
              '@': {
                scheduledTransferPeriod: 'PT1H'
              }
            },
            {
              '@': {
                scheduledTransferPeriod: 'PT1M'
              }
            }
          ]
        }
      }
    };

    var options = {
      declaration: {include: false},
      prettyPrinting: {enabled: false}
    };

    return js2xmlparser('WadCfg', wadCfg, options);
  },

  _generateDefaultLinuxXmlCfg: function (vmID) {
    var ladCfg = {
      'diagnosticMonitorConfiguration': {
        'metrics': {
          'resourceId': vmID,
          'metricAggregation': [
            {
              'scheduledTransferPeriod': 'PT1H'
            },
            {
              'scheduledTransferPeriod': 'PT1M'
            }
          ]
        },
        'performanceCounters': {
          'performanceCounterConfiguration': [
			{
                'class': 'Memory',
				'counterSpecifier': 'PercentAvailableMemory',
				'table': 'LinuxMemory'
			}, {
				'class': 'Memory',
				'counterSpecifier': 'AvailableMemory',
				'table': 'LinuxMemory'
			}, {
				'class': 'Memory',
				'counterSpecifier': 'UsedMemory',
				'table': 'LinuxMemory'
			}, {
				'class': 'Memory',
				'counterSpecifier': 'PercentUsedSwap',
				'table': 'LinuxMemory'
			}, {
				'class': 'Processor',
				'counterSpecifier': 'PercentProcessorTime',
				'table': 'LinuxCpu'
			}, {
				'class': 'Processor',
				'counterSpecifier': 'PercentIOWaitTime',
				'table': 'LinuxCpu'
			}, {
				'class': 'Processor',
				'counterSpecifier': 'PercentIdleTime',
				'table': 'LinuxCpu'
			}, {
				'class': 'PhysicalDisk',
				'counterSpecifier': 'AverageWriteTime',
				'table': 'LinuxDisk'
			}, {
				'class': 'PhysicalDisk',
				'counterSpecifier': 'AverageReadTime',
				'table': 'LinuxDisk'
			}, {
				'class': 'PhysicalDisk',
				'counterSpecifier': 'ReadBytesPerSecond',
				'table': 'LinuxDisk'
			}, {
				'class': 'PhysicalDisk',
				'counterSpecifier': 'WriteBytesPerSecond',
				'table': 'LinuxDisk'
			}
          ]
        }
      }
    };

	return ladCfg;
  },

  _createDiagPrivateConfiguration: function(_) {
    var config = {
      storageAccountName: null,
      storageAccountKey: null,
      storageAccountEndPoint: 'https://core.windows.net:443/'
    };

    config.storageAccountName = this._getStorageAccountName();
    var keys = this.serviceClients.storageManagementClient.storageAccounts.listKeys(this.params.resourceGroupName, config.storageAccountName, _);
    config.storageAccountKey = keys.keys[0].value;

    return config;
  },

  _getStorageAccountName: function() {
    if(!utils.stringIsNullOrEmpty(this.params.storageAccountName)) {
      return this.params.storageAccountName;
    }

    if (utils.stringIsNullOrEmpty(this.params.osDiskUri)) {
      throw new Error($('params.osDiskUri is required when --storage-account-name parameter is not specified'));
    }

    var osDiskUri = blobUtil.splitDestinationUri(this.params.osDiskUri);
    return osDiskUri.accountName;
  },

  generateVMAemProfile: function(){
    if (this.params.osType === 'Linux') {
      return this._generateVMAemLinuxProfile();
    } else if (this.params.osType === 'Windows') {
      return this._generateVMAemWindowsProfile();
    }
    return null;
  },

  _generateVMAemWindowsProfile: function(){
    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.IAAS_AEM_VERSION;
    }

    this.params.extensionName = vmConstants.EXTENSIONS.IAAS_AEM_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.IAAS_AEM_PUBLISHER;
    this.params.autoUpgradeMinorVersion = true;

    this._createAemConfiguration();

    return this.generateExtensionProfile();
  },

  _generateVMAemLinuxProfile: function(){
    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.LINUX_AEM_VERSION;
    }

    this.params.extensionName = vmConstants.EXTENSIONS.LINUX_AEM_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.LINUX_AEM_PUBLISHER;
    this.params.autoUpgradeMinorVersion = true;

    this._createAemConfiguration();

    return this.generateExtensionProfile();
  },

  _createAemConfiguration: function(){
    var publicConfig = {
        'vmsize': this.params.vmSize,
        'vm.role': 'IaaS',
        'vm.memory.isovercommitted': 0,
        'vm.cpu.isovercommitted': ((this.params.vmSize === 'ExtralSmall') ? 1 : 0),
        'verbose': ((this.params.verbose) ? '1': '0'),
        'href': 'http://aka.ms/sapaem',
    };

    //Config iops and throughput
    var vmType = this.params.vmSize.slice(0, 'Standard_DS'.length);
    if(vmType === 'Standard_DS' || vmType === 'Standard_GS'){
      vmSizeProfile = vmConstants.PREMIUM_STORAGE_VM_SIZES[this.params.vmSize.toUpperCase()] || {};
      publicConfig['vm.sla.iops'] = vmSizeProfile.IOPS;
      publicConfig['vm.sla.throughput'] = vmSizeProfile.THROUGHPUT;
    }

    var privateConfig = {};
    var saProperties = null;
    var premiumDiskType = null;
    var storageAccountProfile = null;

    //Config storage account for osdisk
    var osDiskUri = blobUtil.splitDestinationUri(this.params.osDisk.vhd.uri);
    saProperties = this.params.vmStorageAccounts[osDiskUri.accountName];
    publicConfig['osdisk.account'] = saProperties.name;

    var tmp = this.params.osDisk.vhd.uri;
    publicConfig['osdisk.name'] = tmp.substr(tmp.lastIndexOf('/')+1);

    publicConfig['osdisk.caching'] = this.params.osDisk.caching;
    publicConfig['osdisk.type'] = saProperties.type;
    
    if(saProperties.type === 'Premium'){
      premiumDiskType = 'P10';
      storageAccountProfile = vmConstants.PREMIUM_STORAGE_ACCOUNTS[premiumDiskType] || {};
      publicConfig['osdisk.sla.iops'] = storageAccountProfile.IOPS;
      publicConfig['osdisk.sla.throughput'] = storageAccountProfile.THROUGHPUT;
    } else {
      publicConfig['osdisk.connminute'] = saProperties.name + '.minute';
      publicConfig['osdisk.connhour'] = saProperties.name + '.hour';
    }


    this._addStorageAccountConfig(publicConfig, privateConfig, saProperties);

    //Config storage account for datadisk
    for(var i = 1; i <= this.params.dataDisks.length; i++){
      var dataDisk = this.params.dataDisks[i-1];
      var dataDiskUri = blobUtil.splitDestinationUri(dataDisk.vhd.uri);
      saProperties = this.params.vmStorageAccounts[dataDiskUri.accountName];
      publicConfig['disk.account.' + i] = saProperties.name;
      publicConfig['disk.lun.' + i] = dataDisk.lun;
      publicConfig['disk.name.' + i] = dataDisk.name + '.vhd';
      publicConfig['disk.caching.' + i] = dataDisk.caching;
      publicConfig['disk.type.' + i] = saProperties.type;
        
      if(saProperties.type === 'Premium'){
        premiumDiskType = 'P10';
        if(dataDisk.diskSizeGB == 1023){
          premiumDiskType = 'P30';
        } else if(dataDisk.diskSizeGB == 512){
          premiumDiskType = 'P20';
        } else if(dataDisk.diskSizeGB == 128){
          premiumDiskType = 'P10';
        }
        storageAccountProfile = vmConstants.PREMIUM_STORAGE_ACCOUNTS[premiumDiskType] || {};
        publicConfig['disk.sla.iops.' + i] = storageAccountProfile.IOPS;
        publicConfig['disk.sla.throughput.' + i] = storageAccountProfile.THROUGHPUT;
      }else{
        publicConfig['disk.connminute.' + i] = saProperties.name + '.minute';
        publicConfig['disk.connhour.' + i] = dataDisk.name + '.hour';
      }

      this._addStorageAccountConfig(publicConfig, privateConfig, saProperties);
    }

    //Config wad 
    saProperties = this.params.vmStorageAccounts[this.params.wadStorageAccount];
    publicConfig['wad.isenabled'] = 1;
    publicConfig['wad.name'] = saProperties.name;
    publicConfig['wad.uri'] = saProperties.endpoints.table;
    privateConfig['wad.key'] = saProperties.key;

    publicConfig['timestamp'] = Date.now();
 
    this.params.publicConfig = {
      cfg: this._generateKeyValuePairConfig(publicConfig)
    };
    this.params.privateConfig = { 
      cfg: this._generateKeyValuePairConfig(privateConfig)
    };
  },

  _addStorageAccountConfig: function(publicConfig, privateConfig, saProperties){
    if(saProperties.type === 'Premium'){
      publicConfig[saProperties.name + '.hour.ispremium'] = 1;
      publicConfig[saProperties.name + '.minute.ispremium'] = 1;
      privateConfig[saProperties.name + '.hour.key'] = saProperties.key;
    } else {
      publicConfig[saProperties.name + '.hour.ispremium'] = 0;
      publicConfig[saProperties.name + '.minute.ispremium'] = 0;
      publicConfig[saProperties.name + '.hour.name'] = saProperties.name;
      publicConfig[saProperties.name + '.minute.name'] = saProperties.name;
      publicConfig[saProperties.name + '.hour.uri'] = saProperties.endpoints.table + '$MetricsHourPrimaryTransactionsBlob';
      publicConfig[saProperties.name + '.minute.uri'] = saProperties.endpoints.table + '$MetricsMinutePrimaryTransactionsBlob';

      privateConfig[saProperties.name + '.minute.key'] = saProperties.key;
    }
  },

  _generateKeyValuePairConfig: function(config){
    var keyValuePairs = [];
    var self = this;
    __.map(config, function(value, key){
      if (typeof value === 'undefined'){
        self.output.warn(util.format($('Empty value: %s'), key));
        return;
      }
      keyValuePairs.push({
        key: key,
        value: value
      });
    });
    return keyValuePairs;
  },

  _generateVMAccessLinuxProfile: function() {
    if (utils.stringIsNullOrEmpty(this.params.userName) &&
        utils.stringIsNullOrEmpty(this.params.removeUser) &&
        !this.params.resetSsh) {
      throw new Error($('Either --user-name or --remove-user or --reset-ssh params are required.'));
    }

    if (!utils.stringIsNullOrEmpty(this.params.userName)) {
      if (utils.stringIsNullOrEmpty(this.params.password) && utils.stringIsNullOrEmpty(this.params.sshKeyFile)) {
        throw new Error(util.format($('Either password or SSH key are required to reset access for user %s.'), this.params.userName));
      }
    }

    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.LINUX_ACCESS_VERSION;
    }

    this.params.extensionName = vmConstants.EXTENSIONS.LINUX_ACCESS_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.LINUX_ACCESS_PUBLISHER;
    this.params.privateConfig = this._createVMAccessLinuxPrivateConfig();

    return this.generateExtensionProfile();
  },

  _generateVMAccessWindowsProfile: function() {
    var self = this;
    if (utils.stringIsNullOrEmpty(this.params.userName) || utils.stringIsNullOrEmpty(this.params.password)) {
      throw new Error($('Both user name and password are required.'));
    }

    if (!utils.stringIsNullOrEmpty(this.params.removeUser) ||
        this.params.resetSsh ||
        !utils.stringIsNullOrEmpty(this.params.sshKeyFile)) {
      self.output.warn($('Resetting access on Windows VM, --reset-ssh, --ssh-key-file and--remove-user parameters will be ignored.'));
    }

    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.WINDOWS_ACCESS_VERSION;
    }

    this.params.extensionName = vmConstants.EXTENSIONS.WINDOWS_ACCESS_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.WINDOWS_ACCESS_PUBLISHER;
    this.params.publicConfig = { UserName: this.params.userName };
    this.params.privateConfig = { Password: this.params.password };

    return this.generateExtensionProfile();
  },

  _parseExtensionProfileParams: function(params) {
    if (params.publicConfig && params.publicConfigPath) {
      throw new Error($('Both optional parameters --public-config and --public-config-path cannot be specified together.'));
    }

    if (params.privateConfig && params.privateConfigPath) {
      throw new Error($('Both optional parameters --private-config and --private-config-path cannot be specified together.'));
    }

    var extensionProfile = {
      name: params.extensionName,
      type: vmConstants.EXTENSIONS.TYPE,
      location: params.location,
      tags: null,
      publisher: params.publisherName,
      virtualMachineExtensionType: params.extensionName,
      typeHandlerVersion: params.version,
      settings: null,
      autoUpgradeMinorVersion: null,
      protectedSettings: null,
      forceUpdateTag: null
    };

    if (params.publicConfig) {
      if (typeof params.publicConfig === 'string') {
        extensionProfile.settings = this._parseExtensionConfig(params.publicConfig, $('Error parsing public config'));
      } else {
        extensionProfile.settings = params.publicConfig;
      }
    }

    if (params.privateConfig) {
      if (typeof params.privateConfig === 'string') {
        extensionProfile.protectedSettings = this._parseExtensionConfig(params.privateConfig, $('Error parsing private config'));
      } else {
        extensionProfile.protectedSettings = params.privateConfig;
      }
    }

    if (params.publicConfigPath) {
      var publicConfig = fs.readFileSync(params.publicConfigPath);
      extensionProfile.settings = this._parseExtensionConfig(publicConfig.toString(), util.format($('Error parsing public config from file %s'), params.publicConfigPath));
    }

    if (params.privateConfigPath) {
      var privateConfig = fs.readFileSync(params.privateConfigPath);
      extensionProfile.protectedSettings = this._parseExtensionConfig(privateConfig.toString(), util.format($('Error parsing private config from file %s'), params.privateConfigPath));
    }

    if (params.tags) {
      extensionProfile.tags = {};
      extensionProfile.tags = tagUtils.buildTagsParameter(extensionProfile.tags, { tags: params.tags });
    }

    if (params.autoUpgradeMinorVersion) {
      extensionProfile.autoUpgradeMinorVersion = true;
    }

    if (params.forceUpdateTag) {
      extensionProfile.forceUpdateTag = params.forceUpdateTag;
    }
    
    return extensionProfile;
  },

  _parseExtensionConfig: function(config, errorMessage) {
    try {
      var parsedConfig = JSON.parse(config);
      return parsedConfig;
    } catch (err) {
      throw new Error(util.format($('%s. %s'), errorMessage, err));
    }
  },

  _createVMAccessLinuxPrivateConfig: function() {
    var privateConfig = {};

    if (this.params.resetSsh) {
      privateConfig['reset_ssh'] = true;
    }

    if (!utils.stringIsNullOrEmpty(this.params.userName)) {
      privateConfig['username'] = this.params.userName;
    }

    if (!utils.stringIsNullOrEmpty(this.params.password)) {
      privateConfig['password'] = this.params.password;
    }

    if (!utils.stringIsNullOrEmpty(this.params.expiration)) {
      privateConfig['expiration'] = this.params.expiration;
    }

    if (!utils.stringIsNullOrEmpty(this.params.sshKeyFile)) {
      var publicKey = this._parseSSHPublicKeyFile(this.params.sshKeyFile);
      privateConfig['ssh_key'] = publicKey;
    }

    if (!utils.stringIsNullOrEmpty(this.params.removeUser)) {
      privateConfig['remove_user'] = this.params.removeUser;
    }

    // this is for the double call with the same parameter.
    privateConfig['task_id'] = utils.uuidGen();

    return privateConfig;
  },

  _parseSSHPublicKeyFile: function (sshKeyFile) {
    var self = this;
    self.output.info(util.format($('Parsing the public key SSH file: %s'), sshKeyFile));
    var sshPublickeyData = fs.readFileSync(sshKeyFile);
    var sshPublickeyDataStr = sshPublickeyData.toString();

    return sshPublickeyDataStr;
  },

  _checkAndGenerateDockerCertificatesIfNeeded: function(dockerCertPaths, serverCN, _) {
    var self = this;
    var dockerDirExists = utils.fileExists(this.params.dockerCertDir, _);
    var progress;
    var password = 'Docker123';
    if (!dockerDirExists) {
      self.output.verbose($('Docker certificates were not found.'));
      fs.mkdir(this.params.dockerCertDir, _);
      progress = this.cli.interaction.progress($('Generating docker certificates.'));
      try {
        this._generateDockerCertificates(dockerCertPaths, password, serverCN, _);
      } finally {
        progress.end();
      }
    } else {
      // We need to check if all certificates are in place.
      // If not, generate them from the scratch
      var missingClientCertificates = this._checkExistingDockerClientCertificates(dockerCertPaths, _);
      if (missingClientCertificates.length === 0) {
        self.output.verbose($('Found docker client certificates.'));
        var missingServerCertificates = this._checkExistingDockerServerCertificates(dockerCertPaths, _);
        if (missingServerCertificates.length === 0) {
          self.output.verbose($('Found docker server certificates.'));
        } else {
          this._generateDockerServerCertificates(dockerCertPaths, password, serverCN, _);
        }
      } else {
        for (i = 0; i < missingClientCertificates.length; i++) {
          self.output.verbose(missingClientCertificates[i]);
        }

        progress = this.cli.interaction.progress($('Generating docker certificates.'));
        try {
          this._generateDockerCertificates(dockerCertPaths, password, serverCN, _);
        } finally {
          progress.end();
        }
      }
    }
  },

  _checkExistingDockerClientCertificates: function(dockerCertPaths, _) {
    var missingCertificates = [];
    this._checkIfDockerCertificateExist(missingCertificates, dockerCertPaths.caKey, _);
    this._checkIfDockerCertificateExist(missingCertificates, dockerCertPaths.ca, _);
    this._checkIfDockerCertificateExist(missingCertificates, dockerCertPaths.clientKey, _);
    this._checkIfDockerCertificateExist(missingCertificates, dockerCertPaths.clientCert, _);

    return missingCertificates;
  },

  _checkExistingDockerServerCertificates: function(dockerCertPaths, _) {
    var missingCertificates = [];
    this._checkIfDockerCertificateExist(missingCertificates, dockerCertPaths.serverKey, _);
    this._checkIfDockerCertificateExist(missingCertificates, dockerCertPaths.serverCert, _);

    return missingCertificates;
  },

  _checkIfDockerCertificateExist: function(missingCertificates, filepath, _) {
    var fileExists = utils.fileExists(filepath, _);
    if (!fileExists) {
      missingCertificates.push(util.format($('%s file was not found'), filepath));
    }
  },

  _generateDockerCertificates: function(dockerCertPaths, password, serverCN, _) {
    var self = this;
    /*jshint camelcase: false */
    self.output.verbose(util.format($('Password for docker certificates is "%s"'), password));
    try {
      exec('openssl version', _);
    } catch (e) {
      throw new Error(util.format($('Please install/configure OpenSSL client. Error: %s'), e.message));
    }

    this._executeOpensslCommand('genrsa', {
      des3: true,
      passout: 'pass:' + password,
      out: dockerCertPaths.caKey
    }, _);

    /*jshint camelcase: false */
    this._executeOpensslCommand('req', {
      new: true,
      x509: true,
      days: 365,
      passin: 'pass:' + password,
      subj: '/C=AU/ST=Some-State/O=Internet Widgits Pty Ltd/CN=\\*',
      key: dockerCertPaths.caKey,
      out: dockerCertPaths.ca
    },  _);

    this._generateDockerServerCertificates(dockerCertPaths, password, serverCN, _);
    this._generateDockerClientCertificates(dockerCertPaths, password, _);

    // setting cert permissions
    fs.chmodSync(dockerCertPaths.caKey, 0600);
    fs.chmodSync(dockerCertPaths.ca, 0600);
    return;
  },

  _generateDockerServerCertificates: function(dockerCertPaths, password, serverCN, _) {
    /*jshint camelcase: false */
    this._executeOpensslCommand('genrsa', {
      des3: true,
      passout: 'pass:' + password,
      out: dockerCertPaths.serverKey
    },  _);

    if (utils.stringIsNullOrEmpty(serverCN)) {
      serverCN = '*';
    }
    this._executeOpensslCommand('req', {
      new: true,
      passin: 'pass:' + password,
      subj: '/C=AU/ST=Some-State/O=Internet Widgits Pty Ltd/CN=' + serverCN,
      key: dockerCertPaths.serverKey,
      out: dockerCertPaths.server
    },  _);

    /*jshint camelcase: false */
    this._executeOpensslCommand('x509', {
      req: true,
      days: 365,
      in : dockerCertPaths.server,
      passin: 'pass:' + password,
      set_serial: 01,
      CA: dockerCertPaths.ca,
      CAkey: dockerCertPaths.caKey,
      out: dockerCertPaths.serverCert
    },  _);

    this._executeOpensslCommand('rsa', {
      passin: 'pass:' + password,
      in : dockerCertPaths.serverKey,
      passout: 'pass:' + password,
      out: dockerCertPaths.serverKey
    },  _);

    fs.chmodSync(dockerCertPaths.serverKey, 0600);
    fs.chmodSync(dockerCertPaths.server, 0600);
    fs.chmodSync(dockerCertPaths.serverCert, 0600);
  },

  _generateDockerClientCertificates: function(dockerCertPaths, password, _) {
    /*jshint camelcase: false */
    this._executeOpensslCommand('genrsa', {
      des3: true,
      passout: 'pass:' + password,
      out: dockerCertPaths.clientKey
    },  _);

    this._executeOpensslCommand('req', {
      new: true,
      passin: 'pass:' + password,
      subj: '/C=AU/ST=Some-State/O=Internet Widgits Pty Ltd/CN=\\*',
      key: dockerCertPaths.clientKey,
      out: dockerCertPaths.client
    },  _);

    var configPath = path.join(this.params.dockerCertDir, 'extfile.cnf');
    fs.writeFile(configPath, 'extendedKeyUsage = clientAuth',  _);
    /*jshint camelcase: false */
    this._executeOpensslCommand('x509', {
      req: true,
      days: 365,
      in : dockerCertPaths.client,
      passin: 'pass:' + password,
      set_serial: 01,
      extfile: configPath,
      CA: dockerCertPaths.ca,
      CAkey: dockerCertPaths.caKey,
      out: dockerCertPaths.clientCert
    },  _);

    this._executeOpensslCommand('rsa', {
      passin: 'pass:' + password,
      in : dockerCertPaths.clientKey,
      passout: 'pass:' + password,
      out: dockerCertPaths.clientKey
    },  _);

    fs.chmodSync(dockerCertPaths.clientKey, 0600);
    fs.chmodSync(dockerCertPaths.client, 0600);
    fs.chmodSync(configPath, 0600);
    fs.chmodSync(dockerCertPaths.clientCert, 0600);
  },

  _executeOpensslCommand: function(command, options, _) {
    var self = this;
    try {
      openssl.exec(command, options, _);
    } catch (err) {
      // This is not an actual error, 'openssl.exec' command throws log messages.
      // So we will just output them to verbose log without interrupting the command.
      self.output.verbose(err);
    }
  },

  _createDockerPublicConfiguration: function() {
    var publicConfig = {
      docker: {
        port: this.params.dockerPort.toString()
      }
    };

    return publicConfig;
  },

  _createDockerPrivateConfiguration: function(dockerCertPaths) {
    var certs = this._getDockerServerCertsInBase64(dockerCertPaths);
    var privateConfig = {
      certs: {
        ca: certs.caCert,
        cert: certs.serverCert,
        key: certs.serverKey
      },
    };

    return privateConfig;
  },

  _getDockerServerCertsInBase64: function(dockerCertPaths) {
    var caCert = this._convertFileToBase64(dockerCertPaths.ca);
    var serverKey = this._convertFileToBase64(dockerCertPaths.serverKey);
    var serverCert = this._convertFileToBase64(dockerCertPaths.serverCert);

    return {
      caCert: caCert,
      serverKey: serverKey,
      serverCert: serverCert
    };
  },

  _convertFileToBase64: function(filePath) {
    var file = fs.readFileSync(filePath);
    return new Buffer(file).toString('base64');
  },

  generateVMBgInfoExtensionProfile: function() {
    if (!this.params.versionFound) {
      this.params.version = vmConstants.EXTENSIONS.BGINFO_VERSION;
    }

    this.params.extensionName = vmConstants.EXTENSIONS.BGINFO_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.BGINFO_PUBLISHER;
    this.params.publicConfig = null;
    this.params.privateConfig = null;
    this.params.autoUpgradeMinorVersion = true;

    return this.generateExtensionProfile();
  },
    
  generateAzureVMBackupExtensionProfile: function () {
      if (utils.ignoreCaseEquals(this.params.osType , 'Linux')) {
          return this._generateAzureVMBackupExtensionProfile();
      }
      return null;
  },
    
  _generateAzureVMBackupExtensionProfile: function () {
    if (utils.stringIsNullOrEmpty(this.params.version)) {
        this.params.version = vmConstants.EXTENSIONS.AZURE_VM_BACKUP_LINUX_EXTENSION_VERSION;
    }
    this.params.extensionName = vmConstants.EXTENSIONS.AZURE_VM_BACKUP_LINUX_EXTENSION_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.AZURE_VM_BACKUP_LINUX_EXTENSION_PUBLISHER;
      
    //Assign extension config
    var vmBackupPublicConfig = {
        locale: this.params.locale,
        taskId: this.params.taskId,
        commandToExecute: this.params.command,
        commandStartTimeUTCTicks: this.params.commandStartTimeUTCTicks,
        objectStr: this.params.pubObjectStr
    };
      
    var vmBackupPrivateConfig = {
        logsBlobUri: null,
        objectStr: this.params.objectStr
    };
      
    this.params.publicConfig = vmBackupPublicConfig;
    this.params.privateConfig = vmBackupPrivateConfig;
      
    return this.generateExtensionProfile();
  },
  
  generateAzureDiskEncryptionExtensionProfile: function() {
    if (utils.ignoreCaseEquals(this.params.osType , 'Linux')) {
      return this._generateAzureDiskEncryptionLinuxProfile();
    } else if (utils.ignoreCaseEquals(this.params.osType , 'Windows')) {
      return this._generateAzureDiskEncryptionWindowsProfile();
    }

    return null;
  },

  _generateAzureDiskEncryptionLinuxProfile: function() {

    //Check parameters
    if ((utils.stringIsNullOrEmpty(this.params.aadClientId)) || 
        (utils.stringIsNullOrEmpty(this.params.diskEncryptionKeyVaultUrl)) ||
        (utils.stringIsNullOrEmpty(this.params.diskEncryptionKeyVaultId))) {
      throw new Error($('--aad-client-id, --disk-encryption-key-vault-url, --disk-encryption-key-vault-id are mandatory inputs'));
    }

    if ((utils.stringIsNullOrEmpty(this.params.aadClientSecret)) && 
        (utils.stringIsNullOrEmpty(this.params.aadClientCertThumbprint))){
      throw new Error($('Please provide --aad-client-secret or --aad-client-cert-thumbprint correspondong to --aad-client-id'));
    }

    if (!utils.stringIsNullOrEmpty(this.params.keyEncryptionKeyUrl) &&
        (utils.stringIsNullOrEmpty(this.params.keyEncryptionKeyVaultId))){
      throw new Error($('Please provide --key-encryption-key-vault-id correspondong to --key-encryption-key-url'));
    }

    //Assign default extension information
    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_VERSION;
    }
    this.params.extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_PUBLISHER;

    //Assign extension config
    var adePublicConfig = {
        AADClientID: this.params.aadClientId,
        AADClientCertThumbprint: this.params.aadClientCertThumbprint,
        KeyVaultURL: this.params.diskEncryptionKeyVaultUrl,
        VolumeType: this.params.volumeType,
        EncryptionOperation: 'EnableEncryption',
        KeyEncryptionKeyURL: this.params.keyEncryptionKeyUrl,
        KeyEncryptionAlgorithm: this.params.keyEncryptionAlgorithm,
        SequenceVersion: this.params.sequenceVersion,
        AutoUpgradeMinorVersion: this.params.autoUpgradeMinorVersion
    };

    this.params.publicConfig = adePublicConfig;
    this.params.privateConfig = { AADClientSecret: this.params.aadClientSecret };
  
    return this.generateExtensionProfile();	
  },

  _generateAzureDiskEncryptionWindowsProfile: function() {

    //Check parameters
    if ((utils.stringIsNullOrEmpty(this.params.aadClientId)) || 
        (utils.stringIsNullOrEmpty(this.params.diskEncryptionKeyVaultUrl)) ||
        (utils.stringIsNullOrEmpty(this.params.diskEncryptionKeyVaultId))) {
      throw new Error($('--aad-client-id, --disk-encryption-key-vault-url, --disk-encryption-key-vault-id are mandatory inputs'));
    }

    if ((utils.stringIsNullOrEmpty(this.params.aadClientSecret)) && 
        (utils.stringIsNullOrEmpty(this.params.aadClientCertThumbprint))){
      throw new Error($('Please provide --aad-client-secret or --aad-client-cert-thumbprint correspondong to --aad-client-id'));
    }

    if (!utils.stringIsNullOrEmpty(this.params.keyEncryptionKeyUrl) &&
        (utils.stringIsNullOrEmpty(this.params.keyEncryptionKeyVaultId))){
      throw new Error($('Please provide --key-encryption-key-vault-id correspondong to --key-encryption-key-url'));
    }

    //Assign default extension information
    if (utils.stringIsNullOrEmpty(this.params.version)) {
      this.params.version = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_VERSION;
    }
    this.params.extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_NAME;
    this.params.publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_PUBLISHER;

    //Assign extension config
    var adePublicConfig = {
        AADClientID: this.params.aadClientId,
        AADClientCertThumbprint: this.params.aadClientCertThumbprint,
        KeyVaultURL: this.params.diskEncryptionKeyVaultUrl,
        VolumeType: this.params.volumeType,
        EncryptionOperation: 'EnableEncryption',
        KeyEncryptionKeyURL: this.params.keyEncryptionKeyUrl,
        KeyEncryptionAlgorithm: this.params.keyEncryptionAlgorithm,
        SequenceVersion: this.params.sequenceVersion,
        AutoUpgradeMinorVersion: this.params.autoUpgradeMinorVersion
    };

    this.params.publicConfig = adePublicConfig;

    if ( this.params.aadClientSecret ) {
      this.params.privateConfig = { AADClientSecret: this.params.aadClientSecret };
    } else { 
      this.params.privateConfig = { AADClientSecret: '' };
    }

    return this.generateExtensionProfile();	
  },
  
  generateDisableAzureDiskEncryptionExtensionProfile: function(osType) {

    // Get extension status from VM instance view
    
    if (utils.ignoreCaseEquals(osType, 'Linux')) {
        this.params.extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_NAME;
        this.params.publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_PUBLISHER;
        this.params.version = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_VERSION;
    }
    else if(utils.ignoreCaseEquals(osType, 'Windows')) {
        this.params.extensionName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_NAME;
        this.params.publisherName = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_PUBLISHER;
        this.params.version = vmConstants.EXTENSIONS.AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_VERSION;
    }

    //Assign extension config
    var adePublicConfig = {
        VolumeType: this.params.volumeType,
        EncryptionOperation: 'DisableEncryption',
        SequenceVersion: this.params.sequenceVersion,
        AutoUpgradeMinorVersion: this.params.autoUpgradeMinorVersion
    };

    this.params.publicConfig = adePublicConfig;
    this.params.privateConfig = {};

    return this.generateExtensionProfile();	
  }

});

module.exports = VMExtensionProfile;
