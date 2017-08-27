//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

exports = module.exports;

var VMConstants = {
  EXTENSIONS: {
    TYPE: 'Microsoft.Compute/virtualMachines/extensions',

    LINUX_DIAG_NAME: 'LinuxDiagnostic',
    LINUX_DIAG_PUBLISHER: 'Microsoft.OSTCExtensions',
    LINUX_DIAG_VERSION: '2.3',
    IAAS_DIAG_NAME: 'IaaSDiagnostics',
    IAAS_DIAG_PUBLISHER: 'Microsoft.Azure.Diagnostics',
    IAAS_DIAG_VERSION: '1.5',

    IAAS_AEM_VERSION: '2.0',
    IAAS_AEM_NAME: 'AzureCATExtensionHandler',
    IAAS_AEM_PUBLISHER: 'Microsoft.AzureCAT.AzureEnhancedMonitoring',
    LINUX_AEM_VERSION: '3.0',
    LINUX_AEM_NAME: 'AzureEnhancedMonitorForLinux',
    LINUX_AEM_PUBLISHER: 'Microsoft.OSTCExtensions',

    DOCKER_PORT: 2376,
    DOCKER_VERSION_ARM: '1.0',
    DOCKER_VERSION_ASM: '1.*',
    DOCKER_NAME: 'DockerExtension',
    DOCKER_PUBLISHER: 'Microsoft.Azure.Extensions',

    LINUX_ACCESS_VERSION: '1.4',
    LINUX_ACCESS_NAME: 'VMAccessForLinux',
    LINUX_ACCESS_PUBLISHER: 'Microsoft.OSTCExtensions',
    WINDOWS_ACCESS_VERSION: '2.0',
    WINDOWS_ACCESS_NAME: 'VMAccessAgent',
    WINDOWS_ACCESS_PUBLISHER: 'Microsoft.Compute',

    BGINFO_MAJOR_VERSION: '2',
    BGINFO_VERSION: '2.1',
    BGINFO_NAME: 'BGInfo',
    BGINFO_PUBLISHER: 'Microsoft.Compute',

    AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_PUBLISHER: 'Microsoft.Azure.Security',
    AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_NAME: 'AzureDiskEncryption',
    AZURE_DISK_ENCRYPTION_WINDOWS_EXTENSION_VERSION: '1.1',

    AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_PUBLISHER: 'Microsoft.Azure.Security',
    AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_NAME: 'AzureDiskEncryptionForLinux',
    AZURE_DISK_ENCRYPTION_LINUX_EXTENSION_VERSION: '0.1',
        
    AZURE_VM_BACKUP_LINUX_EXTENSION_PUBLISHER: 'Microsoft.Azure.Security',
    AZURE_VM_BACKUP_LINUX_EXTENSION_NAME: 'VMBackupForLinuxExtension',
    AZURE_VM_BACKUP_LINUX_EXTENSION_VERSION: '0.1',

    EXTENSION_PROVISIONING_SUCCEEDED: 'Succeeded',
    DEFAULT_KEY_ENCRYPTION_ALGORITHM: 'RSA-OAEP'
  },
  
  //VM sizes stated on https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-size-specs/
  PREMIUM_STORAGE_VM_SIZES:{
   
    // DS-SERIES
    STANDARD_DS1: {IOPS: 3200, THROUGHPUT: 32},
    STANDARD_DS2: {IOPS: 6400, THROUGHPUT: 64},
    STANDARD_DS3: {IOPS: 12800, THROUGHPUT: 128},
    STANDARD_DS4: {IOPS: 25600, THROUGHPUT: 256},
    STANDARD_DS11: {IOPS: 6400, THROUGHPUT: 64},
    STANDARD_DS12: {IOPS: 12800, THROUGHPUT: 128},
    STANDARD_DS13: {IOPS: 25600, THROUGHPUT: 256},
    STANDARD_DS14: {IOPS: 50000, THROUGHPUT: 512},
    
    //GS-SERIES 
    STANDARD_GS1: {IOPS: 5000, THROUGHPUT: 125},
    STANDARD_GS2: {IOPS: 10000, THROUGHPUT: 250},
    STANDARD_GS3: {IOPS: 20000, THROUGHPUT: 500},
    STANDARD_GS4: {IOPS: 40000, THROUGHPUT: 1000},
    STANDARD_GS5: {IOPS: 80000, THROUGHPUT: 2000},
  },

  PREMIUM_STORAGE_ACCOUNTS:{
    P10: {IOPS: 500, THROUGHPUT: 100},
    P20: {IOPS: 2300, THROUGHPUT: 150},
    P30: {IOPS: 5000, THROUGHPUT: 200},
  }
};

module.exports = VMConstants;
