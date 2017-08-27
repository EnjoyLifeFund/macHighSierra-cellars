##2017-06-08 Version 0.10.14
* General
  * Fixed bug #3605 by updating easy table package dependency. This ensures this application works well with npm@5. #3608
* Compute (ARM)
  * Updated Compute Package to 2.0.0-preview with new API version. #3599
  * Updated Compute Package to version 3.0.0-preview & updated commands. #3603
* Compute (ASM)
  * Added ASM Compute VM Commands: Delete/Redeploy/Start/Restart/GetRDP/Show. #3607
* Network
  * Rewrote implementation for ExpressRoute Circuit Peerings. #3601
  * Application Gateway. #3604
    * Added support for Disabled Rule Groups to WAF Config
    * Added support for Path Based Routing to Request Routing Rules
  * Traffic Manager. #3589
    * Rewrote implementation for Traffic Manager
    * Added support for API version 2017-05-01 (Fast Endpoint Failover)
  * Network Interfaces. #3609
    * Added support for EnableAcceleratedNetworking
  * Added vnet usage feature support #3602
* Graph-RBAC
  * upgraded to new package version
  * Fixed bug in role assignment command (Issue Azure/azure-powershell#3407). #3585
  * Updated getobjectsbyobjectId call for objectIds > 1000, since the API limits only 1000 objectIds. #3594
* IotHub
  * Added Routing Support for IotHub. #3590
* Mobile Services
  * Removed "Azure Mobile" commands. #3598
* Web
  * Updated kuduscript package. #3581

##2017-05-10 Version 0.10.13
* General
  * login: allow accesstokens.json to be configurable through env var #3552
  * Standardize User Agent string in request header (Issue #3565). #3578
* Compute
  * Fixed help text for 'azure vm image show' (Issue #3548). #3563
  * Chef Extension
    * Renamed chef-service-interval option to chef-daemon-interval #3566
* Storage
  * Added support for large page blob (8TB) #3572
* Batch
  * Fixed confirmation string when removing nodes from Batch pool. #3570
* Network
  * Improved Network DNS Zone Import's data validation #3569
  * Rewrote implementation for NIC (#3568), VPN Gateway (#3567), Local Gateway (#3576), Application Gateway (#3577), Express Routes (#3579).

##2017-04-05 Version 0.10.12
* Storage
  * Upgraded azure-storage to 2.1.0 #3544
  * Added --incremental parameter to azure storage blob copy start command to support page blob incremental copy #3544
* General
  * fixed sinon.stub warnings by changing to the new signature #3547
  * Handled the os.networkInterfaces() exception thrown while getting the host nic on win10 bash subsystem
* TrafficManager
  * Added api-version=2017-03-01 #3543
  * Added geo mapping for endpoints #3543
* Compute (ASM)
  * Added new CLI command "initiate-maintenance" for a new API called "PerformMaintenance" #3542
  * Added MaintenanceStatus field in the GetDeployment response #3542

##2017-03-14 Version 0.10.11 (npm only - hotfix)
* General
  * Added a SHA-256 hash of macAddress to userAgent header, per VS Telemetry standard #3520
* Datalake
  * Fixed bug with ADLA create credential not properly binding credentialName parameter #3533
* CDN
  * Added enable/disable https in CDN custom domain #3519
 
##2017-02-22 Version 0.10.10 (npm only - hotfix)
* General
  * Fixed a bug with appveyor integration. #3493
  * Added auto completion for fish shell. #3509
* Compute
  * Fixed issue of not being able to quick create a VM from a user image (Issue #3499). #3499
  * Added optional --storage-account-name parameter to vm quick-create. #3499
  * Fixed bug #3503 in managed disk scenario by adding a --skip-vm-backup option to the enable-encryption command #3504
  * Chef Extension
    * Added support for passing daemon as task. #3516
* KeyVault
  * Fixed bug #3444. Made CLI not prompt for parameter value if keyvault reference is included. #3488
* Network
  * Implemented commands for Network watcher #3494
  * Fixed bug #2167 by adding multi-site support for app gateways (host name option). #3515
* Storage
  * Updated azure-storage module to 2.0.0 #3455
  * Added support for large block blob #3455
  * Added support for `file` for the `--enable-encryption-service` and `--disable-encryption-service` for commands  `azure storage account create` and `azure storage account set`. #3496
  * Added `--prefix` option for command `azure storage file list`. #3496
  * Updated the implementation for commands `azure storage container list` and `azure storage container show` to save unnecessary extra service call. #3496
* Web
  * Updated kuduscript package. #3479

##2017-02-08 Version 0.10.9
* General
  * Improved error message in the CLI about command not being valid (Fixes #3272, #3256, #3245). #3424
  * Improved azure portal command to infer the environment if not passed in (Fixes #2074). #3426
  * Made the application not prompt for telemetry if AZURE_NON_INTERACTIVE_MODE environment variable is set (Fixes #3297). #3432
  * Client side telemetry: Added error classification (Fixes #2779). #3434
  * Changed setup authoring of windows installer to install 32 or 64 bit Node based on target cpu architecture (Fixes #3451). #3454
* Datalake
  * Add support to create Clusters with ADLS as default Storage. #3431
* ServiceFabric
  * Add timeout to application type register command. #3427
* Compute
  * Added new commands to support managed disks. #3458
  * Fixed the scenario of enabling disk encryption from the CLI when using a certificate instead of a password. #3433
  * Chef Extension
    * Added new options in azure vm extension set-chef command for both ASM and ARM mode. #3400
      *  --daemon - Configures the chef-client service for unattended execution. The node platform to be Windows. Options: \'none\' or \'service\'. \n \'none\' - Currently prevents the chef-client service from being configured as a service. \n \'service\' - Configures the chef-client to run automatically in the background as a service.
      * --chef-service-interval - It specifies the frequency (in minutes) at which the chef-service runs. Pass 0 if you don\'t want the chef-service to be installed on the target machine.
      * --secret - The secret key to use to encrypt data bag item values.
      * --secret-file  - A file containing the secret key to use to encrypt data bag item values.
      * --bootstrap-version - chef-client version to be installed.
* CDN
  * Added support for usage and edgenode commands. #3402
* Network
  * Improved arm DNS services. #3419
    * Added option --quiet in the ```dns record-set add-record``` command to make CNAME records corrections available for scripting
    * Added a chance in the ```dns record-set list``` command to filter record sets by type without setting option name
    * Fixed ```dns records-set delete-record``` ```--type``` option description
    * Fixed ```dns record-set``` commands case-sensitive ```--type``` option issue
    * Corrected record-set show command displaying format
    * Added ```--keep-empty-record-set``` option to remove record saving empty record set.
    * Added default functionality to remove record set is last record was deleted
  * Fixed issues in arm vpn connections (Fixes #3409, #3411, #3413). #3441
    * Fixed ```vpn-connection set``` command issues
    * Added VPN gateway BGP settings options
    * Added ```--enable-bgp``` option in VPN connection
  * Fixed issues in vnet and nsg. #3450
    * Stripped unreachable NSG code
    * Updated vnet create/set: if vnet was created from portal w/o dns servers it was impossible to add them using `vnet set` command. Also, `vnet create` works more similar to creating vnet from Azure portal
  * Fixed issue with TXT records import even if values contain record types (MX, TXT, etc). #3452
  * Fixed TXT records output format. #3459
* Redis Cache
  * Added import, export and Reset commands for Azure Redis Cache. #3423
* WebApp
  * Fixed hostnames list "undefined" error (Fixes #3435). #3436

##2016-12-14 Version 0.10.8
* General
  * Skipped output of progress spinners when running with AZURE_NON_INTERACTIVE_MODE set, mostly resolves #3292. #3296
  * Updated uuid to version 3.0.0. #3383
* Network
  * Fixed ARM network commands descriptions. #3275
  * Corrected inconsistent option naming in app gateways backend-health command. #3308
  * Fixed issues in PTR record set records import.  #3298
  * Fixed issue with record-set add-record command adding PTR type record.  #3298
  * Fixed issue #3282 with record-set delete commands: type option is not case sensitive anymore.  #3298
  * Fixed nsg rule create command descriptions. #3291
  * Fixed issue #3339. #3345
  * Added an ability to change default names for app gateway http-settings, http listener, frontend port, frontend ip, gateway IP config. #3345
  * Fixed extra-logger and mistypes in commands. #3345
  * Removed ssl cert param from app gw show command when listener protocol is http (fixes #3354). #3365
  * Reworked url path map listing. #3366
  * Fixed issue in app gateway show command (Fixes #3347). #3348
  * Reworked app gateways rule list command (fixes #3353). #3368
  * Fixed DNS zone import issue with semicolon symbol (fixes #2869). #3376
  * Reworked local gateways (fixes #3351). #3367
* Compute
  * Fixed typographical error in user message for get VM images. #3311
  * Added --force-update-tag support to VM Extension & update test #3314
  * Added Linux support to showAzureDiskEncryptionStatus. #3324 
  * Fixed issue #3283 and added an ability to associate app gw probe and http settings #3315
  * Added VM Secrets Support. #3338
  * Fixed get-serial-console (fixes #3266). #3343
* ServiceFabric
  * Provided support for app package copy to use persist connection. #3326
  * Fixed update service command, instanceCount would not be udpated. #3372
* Storage
  * Fixed the issue that the `azure storage container set` will erase the existing policies #3319
  * Fixed the issue that `azure storage file download` won't return to command prompt after download success #3319
* ResourceManager
  * Fixed typo in an user facing message in group.deployment._js. #3336
  * Added manual polling to provide current state of deployment to the customer. #3360
  * Fixed resource create and set commands to take in the passed in properties. #3342
  * Changed parsing function from jsonlint.parse to JSON.parse. #3375
* ServerSideTelemetry #3350
  * Added OS info and command info to user agent string.
  * Refactored code around telemetry.
  * Added tests for the new scenarios.
* CDN
  * Added geo filter after CDN RP version change. #3300
* Datalake #3362
  * Added new commands for trusted id providers, firewall rules, and waiting for job completion
  * Refactored return objects based on GA SDK
  * Updated tests and add new tests
  * Re-enabled the ability to delete full ACLs
  * Removed unsupported/unused logic
* WebApp
  * Fixed cli.interaction in webapp config set (fixes #3302). #3364

##2016-11-2 Version 0.10.7
* IotHub #3265
  * Added support for the following IP filter-rules commands in IotHub:
    1. List IP filter rules: azure iothub ipfilter-rules list [resource-group] [name]
    2. Set IP filter rules: azure iothub ipfilter-rules set [resource-group] [name] [input-file]
* HDInsight #3268
  * Added new securityProfile section to input payload when creating a cluster. This enables integration with Active Directory.
* WebApp #3260
  * Added slot support for all webapp commands
  * Updated descriptions of some webapp commands
  * Made some minor optimizations for appsettings and hostnames
* ResourceManager #3277
  * Modified the group deployment command to not throw when optional parameters are omitted
* Usage #3276
   * Ported azure-arm-commerce to use Autorest based library
   * Provided support for `| more` while paging
   * Fixed bugs #3239 and #3255.
* ActiveDirectory #3276
   * Fixed the implementation of `| more` while paging in `azure ad sp|user|group|group memeber list` commands

##2016-10-12 Version 0.10.6
* General
  * Changed log output filename to be trivially sortable into chronological order #3215
* Datalake
  * Removed erroneous not from the help #3205
* Network
  * Made resource-group positional parameter work in application-gateway list command #3207
  * Ensured that default values are not used in set commands
  * Added required parameters to the usage string and allowed to use required parameters as positional w/o using --<option-name> #3201
  * Reworked request routing rules show/list commands #3218
  * Added app-gateway backend-health show command #3226
  * Fixed app gateway url path map rule options #3208
  * Fixed issues in url path map show/list commands #3217
  * Reworked app gateway http listener show/list command #3219
  * Reworked app gateway address pool show/list command #3222
  * Reworked http settings show/list commands #3223
  * Fixed peer info messages #3243
  * Fixed issue in DNS info message #3244
  * Fixed incorrect option naming for appGatewayFrontendIp command #3238
  * Fixed issue with Express Route VPN connection #3235
  * Reworked application gateway show command - separated json format #3224
  * Added --json-attributes for ASM and ARM. User can set custom json attributes using this option which will get set in first_boot.json #3216
* ResourceManager
  * Throw error when deployment fails #3241
* WebApp #3227
  * Implemented App Service on linux
  * Added linux option when creating appserviceplans
  * Added islinux option in webapp config show
* Batch
  * Renamed the 'batch subscription list-quotas' command to 'batch location quotas show' for consistency with the management API and the CLI naming conventions #3232
* HDInsight
  * Fixed logClusterOperationInfo to log both operation status and state #3234
* Keyvault
  * 'keyvault certificate policy create' now supports --certificate-type argument.
* Compute
  * Fixed #3248 in the VM command. #3250 
* ASM
  * Website
    * Update kuduscript to v1.0.9 #3214

##2016-09-28 Version 0.10.5
* General
  * **By default azure-cli will now save access tokens to ~/.azure/accessTokens.json for OSX and Window, like it does on Linux**. When you install this version, **please run login to re-establish the credentials**. If you prefer **old behaviors** of using secure storage, you can turn on the env variable of **AZURE_USE_SECURE_TOKEN_STORAGE**
  * Typo fixes in log messages, help of some commands, help files and README
  * Added back ip for telemetry
  * Fixed #3108
* Network
  * Implemented functionality to remove public-ip-address and NIC ip config association
  * Fixed error message in application gateways when user have to login
  * IPv6 NICs are available for a few regions
  * Added nic effective-nsg and effective-route-tables
  * Implemented ARM application gateway http listener set command
  * Implemented url path map show/list commands
  * Reworked app gateway show command
  * Implemented Application gateway http listener show/list commands
  * Added app-gw rule set/list/show
  * Implemented App gateway URL path maps, rules set commands 
  * Added CRUD commands for app-gw sub commands
    * address-pool
    * frontend-ip
    * frontend-port
    * http-settings
    * probe
    * ssl-cert
* IotHub
  * Adding commands to show a well formed connection string.
* ResourceManager
  * Ignore resource group case when validating source and destination group in resource move
  * Fixed #2931 #2561 #3085 #2751 #2689 #2552
* Compute
  * Fixed #2601: 'vm set' command to support '--new-os-disk-size' input
* Datalake
  * Fixed #3163
* Storage
  * Upgraded the azure-storage dependency to 1.3.0 to address the tough-cookie security issue
* Batch
  * Added new 'batch task reactivate' command
  * Added '--default-version' parameter to 'batch application set' command
  * Fixed bug in the --app-package-ref parameter handling in the 'batch pool create' and 'batch pool set' commands
  * Fixed a bug in the formatted display of the 'batch pool usage-metrics list' output
* WebApp
  * Added webapp config hostname commands
  * Added appserviceplan set command
  * Modified appserviceplan parameter name change from tier to sku
  * Modified some description changes
  * Fixed creating free/shared appserviceplans now work
* ServiceFabric
  * Implemented the first version of service fabric commands

* ASM
  * Network
    * Added nsg and route-table migration commands

##2016-09-03 Version 0.10.4
* General
  * Fixed #2775 and #2963.
  * Support for help in json format
  * Improved the help command experience
  * Support generating random values within a command; record them if a test runs that command and retrieve them from the recording file if the test for that command is being run in playback mode
  * Fixed Image URN for VM Related Tests
  * Updated the request package to 2.74.0 to fix the though-cookie issue.
  * Changed azureProfile file permission to 600
* WebApp
  * Added appserviceplan and webapp commands
    - `webapp config show`
    - `webapp config update`
    - `webapp publishprofile get`
    - `appserviceplan create`
    - `appserviceplan list`
    - `appserviceplan show`
    - `appserviceplan delete`
  * Fixed appserviceplan/webapp commands and updated webapp api to be used
* Batch
  * Azure batch pool commands now support a virtual network property
  * Azure batch job now supports onAllTasksComplete and onAllTasksFailure properties, which can be used to control the lifetime of the job along with the azure batch task exitConditions property.
  * Azure batch task now supports application package references, as does the jobManager property of azure batch job.
* Storage
  * Upgraded azure-common package to 0.9.17 and request package to 2.74.0 to address the security issue and proxy tunneling issue.
  * Tuned the description of the `--snapshot` option for blob commands.
  * Tuned the description of the storage account credential related options for storage commands.
  * Added the command azure storage blob update to update the properties of an existing blob.  
* IotHub
  * Added Azure IotHub CLI commands
* Network
  * Moved to new api version 2016-04-01
  * Implemented new dns zone clear command to remove all related record sets
  * Dns zone delete command now removes dns zone and all related record sets
  * Implemented command ```dns record-set set-soa-record``` to set SOA type record
  * Records of type PTR is now supported
  * Added functionality to create dns zone, record sets from record-set add-record command.
  * Reworked dns zone list command to make resource-group optional parameter
  * DNS record sets now supports metadata parameter instead of tags
  * Reworked TXT records functionality. Max record length is 1024, splitted by 255 simbols.
  * DNS zone properties now include nameServers
  * Record sets have no location property
  * SOA record have an additional serialNumber field
  * Fixed #1795
  * Updated azure-arm-network version
  * Added vnet peerings implementation
  * Added vnet peerings tests and corresponding recordings
  * Fixed recordings broken after azure-arm-network version update
  * Added application-gateway ssl-policy and authentication-certificate commands
  * Added related tests
  * Added related recordings
  * ARM NIC mupltiple IP configurations functionality is supported now
* Provider
  * Reformat provider output,Location list output
  * Added verbose output for displaying all locations and resource types
  * Location lists and added --details flag
  * Registered providers and info for help
  * ASM reserved ip migration commands implemented
  * Fixed #3023
* Keyvault
  * Move to autorest base node SDK2
  * Added support for Key Vault certificates3
  * Key Vault certificates tests
* DOCS
  * Update docs for auto-complete
  * Fixed imageUrn.json
  * Fixed #3119
* VM
  * [ASM] Fix VM Password Interactive Input Issue #3106
  * Fixed #3118
* Location
  * Added to test case
  * Renamed parameters and cleaned up layout
  * Added create subscription client to utils.js
  * Changed Output Location List

##2016-8-7 Version 0.10.3
* Storage
  * Added '--concurrenttaskcount' option for 'azure file download' command
  * Added support --snaptshot option for 'azure storage blob show' and azure storage blob download' commands
  * Added --lease option for 'azure storage blob upload' command
  * Changed the default blob type to page blob when uploading VHD files
  * Improved the error message for invalid account name when creating storage account
  * Fixed the issue that downloading public blob with size greater than 32MB will fail.
  * Upgraded the azure-storage dependency to version 1.1.0
* Network
  * Fixed issues #1847, #2940, #3015, #3058
  * Added unit tests for --nowait option
  * Added workaround to prevent issue
  * Added workaround for old azure-arm-dns package location issue
  * Display all locations for provider resource types.
  * Reworked nowait option for common style (like group delete command)
  * Reworked app gateway long-running commands
* HDinsight
  * fixed #3003
* Insights
  * Support for event hub in diagnosticsettings
  * Use insights sdk version 0.11.3
* General
  * fixed issues #1646,#1794, #2087, #2870, #2938, #2987,#3053, #3045
  * customers can set non interactive mode by setting the environment variable AZURE_NON_INTERACTIVE_MODE=1 and the CLI will throw an error instead of waiting for the user input,#2420, #2946
  * setting cert thumbprint as the userId while sending telemetry, if the user is using cert based auth for rdfe commands
  * Added subscription Id for telemetry
  * json formatting set to 2 spaces whenever JSON data is being written to a file
* ResourceManager
   * Support property alias in provider show command
* KeyVault
  * Added support for upload and download secrets as a file to keyvault commands
  * Added options to upload and download secrets as a file
* CDN 
  * fix the issue of cdn command -option not recongizable issue
  * improved help for cdn commands
* Compute
  * Add CLI changes for validate migration apis


##2016-07-07 Version 0.10.2
* Storage
  * Added new command `azure storage account sas create`
  * Added options `--protocol` and `--ip-range` for the service SAS commands
	- `azure storage container sas create`
	- `azure storage blob sas create`
	- `azure storage queue sas create`
	- `azure storage table sas create`
	- `azure storage share sas create`
	- `azure storage file sas create`
  * Added support for permission `c` (Create) and `a` (Add) for the service SAS commands
	- `azure storage container sas create`
	- `azure storage blob sas create`
  * Added support for permission `c` (Create) for the service SAS commands
	- `azure storage share sas create`
	- `azure storage file sas create`
  * Added support for the option `--file` for `azure storage metrics set` and `azure storage metrics show` commands
* Network
  * Fixed issue importing record set in case when record name is equal to any record type
* Compute
  * Fixed VMSS Quick-Create issue
  * Fixed issues #2717, #2767, #2879, #2926, #2960, #2961
* General
  * Added new commands
	*  `azure ad app set`
	*  `azure ad group member add | delete| check`
	*  `azure ad sp set` 
  * Added support for `ad user create|delete| memberGroups list` commands
  * Added support for setting reply url for an application while creating it
  * Added support for `ad group create|delete` commands
  * Fixed issues #2919, #2937, #2939

##2016-06-01 Version 0.10.1
* Storage
  * Integrated with the GA version of Azure Storage Client Library for Node.js
  * Added support for blob snapshot commands
    * Added new commands `azure storage blob snapshot`
    * Added new option `--snapshot` and `--delete-snapshots` for `azure storage blob delete` 
  * Added support for blob/container lease commands
    * Added new commands `azure storage blob/container lease acquire`
    * Added new commands `azure storage blob/container lease renew`
    * Added new commands `azure storage blob/container lease change`
    * Added new commands `azure storage blob/container lease release`
    * Added new commands `azure storage blob/container lease break`
    * Added `--lease` option to existing commands which can be performed with a lease ID
  * Added support for running CLI commands with Azure Storage emulator
  * Improved option description for command `azure storage blob delete`
* PowerBiEmbedded
  * Added the following Power BI Embedded commands with tests
    * `azure powerbi create`
    * `azure powerbi set`
    * `azure powerbi delete`
    * `azure powerbi list`
    * `azure powerbi get-keys`
    * `azure powerbi regenerate-key`
* HdInsight
  * Added --applicationName to script-action create command for Edgenode customization
  * Added randomly generated appName
* DevTestLabs
  * Added commands for Microsoft.DevTestLab provider
* Network
  * Updated validator package and improved common validation logic
  * Added the following express-route peerings commands
    * `azure network express-route peerings create`
    * `azure network express-route peerings set`
    * `azure network express-route peerings show`
    * `azure network express-route peerings list`
    * `azure network express-route peerings delete`
  * Used new api version for networking commands: 2016-03-30 (azure-arm-network: 0.13.2)
  * Added InternalDomainNameSuffix propert for `azure network nic show`
  * Added --ip-version option to specify ip version of IPv4 or IPv6 for `azure network public-ip create`
  * Added `azure network nic ip-config` to manage multiple ip configurations inside nic
  * Used `azure network nic ip-config` instead of `azure network nic set` to modify ip configuration
  * Changed `azure network nic address-pool/inbound-nat-rule` to `azure network nic ip-config address-pool/inbound-nat-rule`
  * Renamed option `-n, --name` to `-c, --nic-name` in `azure network nic ip-config address-pool/inbound-nat-rule` commands
  * Renamed app gateway option names to common style 
  * Fixed issue with app gateway ssl cert modifications
  * Fixed issues #2876, #2877, #2878
* Compute
  * Updated vm enable-diag command to use JSON config for Linux
  * VMSS scale out command
  * Fixed BGInfo's major version search issue
* KeyVault
  * Fixed issues #2709, #2742 and #2800
* CDN
  * Akamai integretion for Azure CDN
* ResourceManager
  * Display provisioning status message during create deployment
  * Added jsonLint.js to display the line number in exception when parsing json fails
  * Fixed issue #1956
* ServerManagement
  * Added commands for Server Management Tools service
* Batch
  * Add parameterized way to create/update batch entities
  * Added the more parameters to the following commands to enable these operations without providing a JSON file
    * `azure batch job create`
    * `azure batch job set`
    * `azure batch job-schedule create`
    * `azure batch job-schedule set`
  * Added more pool and task related commands
  * Changed default entity update behavior to patch. *
* General
  * Removed buffer's encoding to fix issues #2820 #2825 #2827 #2829 #2846

##2016-05-04 Version 0.10.0
* Storage
  * Updated dependency of 'azure-arm-storage' to '0.13.1-preview'
  * Replaced `--type` by `--sku-name` in `azure storage account create` and `azure storage account set`
  * Added `--access-tier` to `azure storage account create` and `azure storage account set`
  * Added `--enable-encryption-service` to `azure storage account create` and `azure storage account set`
  * Added `--kind` to `azure storage account create`
  * Added `--disable-encryption-service` to `azure storage account set`
* HdInsight
  * Added an option to provide `--clusterTier Standard|Premium` to `azure hdinsight cluster create` command
  * Added options to `azure hdinsight config create` command
  * Added deprecation warning message for ASM HDInsight commands
* Network
  * Fixed #2768 - ARM: Application gateway with custom backend port
  * Updated help for azure network *-migration in ASM
  * Updated `azure-asm-network` package to 0.11.0
* ResourceManager
  * Fixed #2810 - Prettify json output before writing to file for RG export and deployment save commands
  * Policy commands added for: creating, updating, deleting and getting policy definitions and policy assignments
  * Fixed the issue related to bubbling up nested error messages for the deployments. With this fix, user will get more meaningful error messages when the deployment fails.
* Compute
  * Update Tests
  * AVSet Command
  * Premium VM & VMSS Commands
  * Update ARM ACS Commands
  * Update ASM Migration Commands
  * VM/SS Image Aliases
* DataLake
  * Fixed issue: #2798
  * Updated ADL to the latest packages and fixed a bug with deleting all secrets under a database
* Batch
  * Changed the node scheduling related commands to sub category commands.
  * Added certificate/compute node related commands
  * Modified the structure of `azure batch node get-remote-desktop` to `azure batch node remote-desktop show`
  * Added the following Batch job schedule commands
    * `azure batch job-schedule enable`
    * `azure batch job-schedule disable`
    * `azure batch job-schedule terminate`
  * Added the following Batch job commands
    * `azure batch job enable`
    * `azure batch job disable`
    * `azure batch job terminate`
azure batch job prep-and-release-task-status list
* General
  * Updated AzureGermanCloud AD Endpoint
  * Fixed #2155, #2785
  * Fixed help usage for webapp commands
  * Fixed buffer creation under node v6 #2820
  * Active Directory casing as per the brand name

##2016-04-19 Version 0.9.20
* Fix computer name prefix issue in vmss quick-create command
* Fix FD/UD parameter issue in availset create command
* Added Azure Container Service set of CLI commands.
  * container config create/patch
  * container config parameter [options] set/delete
  * container create [options] <resource-group> <name>
  * container delete [options] <resource-group> <name>
  * container show [options] <resource-group> <name>
  * container list [options] <resource-group>
* Enabled Telemetry for data-collection for command usage and exception tracking
* Fixed issues #2274 #2731, #2732, #2747, #2754 and updated node.js installation steps on linux systems
* Fixed structuring of cdn commands
* Added BlackForest Environment to the list of supported environments
* Network
  * Added --gateway-type option to create VPN or ExpressRoute gateways, 
  * Renamed --type option  to --vpn-type in `network vpn-gateway create` command
  * Used dedicated verbs for consistency
    * azure network nic address-pool add/remove -> create/delete
    * azure network nic inbound-nat-rule add/remove -> create/delete
    * azure network vpn-gateway root-cert add/remove -> create/delete
    * azure network vpn-gateway revoked-cert add/remove -> create/delete
  * Added ARM application gateways URL path maps support
  * Added ARM app gateways url path map rules modifications support
  * Improved network tests
* Batch
  * Added support for creating and displaying Batch Linux pools
  * Updated the batch node-user create and set commands to support SSH keys for Linux users
  * Added the batch pool list-node-agent-skus command
  * Added the batch node get-remote-login-settings command
  * Added the batch application package related commands
* ResourceManager
  * Add policy definition commands
  * Add policy assignment commands
* Improved insight commands in the PR #2721 and #2716
* Backup
  * Added command remove-backup [resource-group] [name] to remove VM backups
  * VM backup creation for Linux VMs
  * Added new command disable-disk-encryption that disables encryption on Windows VMs, there's no support for Linux VMs
  * Enable and disable encryption commands now use version 1.1.. of the AzureDiskEncryption extension
  * Enable and disable commands support now --disable-auto-upgrade-minor-version switch
  * Enable/Disable encryption and show status commands now support new encryption setting: ‘enabled’
  * Enable encryption command only allows encryption of data volumes for Linux VMs
* Added --platform-update-domain-count, --platform-fault-domain-count options to availset create command in asm

##2016-03-30 Version 0.9.19
* Graph-RBAC
  * RBAC cmdlets consuming new graph version
* Batch
  * Added batch management and service commands
* HDInsight
  * Added commands for managing HDInsight script actions: create, persisted, and history.
* CDN
  * Added commands for CDN Management in ARM mode
* Insights
  * Introduced log profiles commands for CLI
  * Introducing actions and webhooks to alerts and autoscale
  * Splitting alert creation command into three separate commands: one for metrics, one for logs, one for webtest
  * Using latest version of Insights SDK
* DataLake
  * Migrated to Autorest generated node sdk
* ResourceManager
  * Added debugSetting parameter for group deployment create
  * Added group export command
  * Added group deployment template download command
  * Brought back the validation step when submitting an ARM deployment
  * Fixed tests
* VM
  * Added more tests for command "azure vm enable-aem"
  * Fixed storage account name case sensitive issue for command "azure vm enable-aem"
  * Updated vm commands to consume Compute API Version to 2016-03-30
  * Updated Linux Diagnostic version to 2.3
  * Added VMSS Commands
  * Added VM Redeploy Command
* Network 
  * vnet/lb/publicip/nic/nsg/traffic-manager profile/express-route circuit list commands now support --resource-group as optional parameter for backward compatibility
  * Removed extra-error message when authorization item was not found
  * Fixed network dns zone import for record sets with multiple records of type A
  * Fixed dns record-set create regression issue which throws exception 'The record set of type '<...>' cannot be null'
  * Fixed 'azure network public-ip list' command  to output 'IP Address' column
  * Added support for --default-site-id and --default-site-name options to attach Local Network Gateway as Default Site for VPN Gateway in 'azure network vpn-gateway create/set' commands
  * Added prompt for --priority if not specified
  * Changed default values to '*''network nsg rule create'
  * Added support for --sku-name option in 'network vpn-gateway create/set' commands
  * Added support for --address-prefixes option in 'network vpn-gateway create/set'
  * Implemented commands for vpn gateways to manage Root/Revoked Certificates
  * Fixed incorrect properties of provider in the listProviders method #2667
* General
  * Fixed #2619, #2579
  * Improved warn output to respect --json option
  * Implemented ARM network application gateways commands
  * Fixed silly logging of Buffer types in the cli 

##2016-03-11 Version 0.9.18
* Upgraded Graph to 1.6-internal api-version and consumed it in ad commands
* Fixed issue #2619, #2616
* Made role assignment commands work with 1.6-internal

##2016-03-07 Version 0.9.17
* Fixed login for US Government Environment

##2016-03-03 Version 0.9.16
* General
  * Fixed harvesting script bugs
  * Fixed issues #2560, #2388, #2529, #2530, #1913, #2486,  #2518
  * Added support for Github issues/pr templates feature
  * Leap Year Fix for adding years
  * Fixed broken link for contribution guidelines
  * Removed apiapp commands
* Resource Management
  * Ported ARM cmdlets to use autorest generated resource mgmt client
  * Fixed display of innerdetail message only when present
  * Fixed json output issue for deployment create/show
* Network
  * Fixed #2493, #1771, #2505, #2510, 2563
  * Improved tests #2564
  * --resource-group now optional for 'azure network traffic-manager profile list'
* VM
  * Fixed #2502, #2507, #2575, #2546
  * Support RSA format ssh cert in "vm reset-access" #2437
  * Fixed reading storage account data vm for enable-aem command
  * Fix NIC-IP Association Issue #2551
  * Fixed issue #2524 VM Create License Type Option
  * Fix #2539 VM Image List/Show
  * Added test for vm list-usage
* Redis Cache
  * Added delete-diagnostics command for redis cache
  * Added set-diagnostics command to redis cache

## 2016-02-01 Version 0.9.15
* General
  * Improved tests and the tests infrastructure #2422, #2433, #2460, #2467, #2468, #2472
  * Enable login using a service principal with a certificate #2432
  * Support for adding dash to allowed resource group names #2441
  * Improved config commands to use common execution flow #2448
  * Included 4.2.4 in the installer #2450
  * Ensured auth header is not logged in verbose logging #2451
  * Ensured stdout gets drained before exit #2470
  * Provided deprecate message that apiapp commands are going away #2471
* VM
  * Chef extension commands can be operated on provided resource groups #2222
  * Updated vm quick-create, used NRP autoRest-client, & other fixes #2463
  * Updated AutoRest Compute Lib #2479
  * Added enable-aem command #2449
* Network
  * Improved azure network vpn-gateway create/set/list #2427
  * Updated azure-arm-TrafficManager package and test nocks #2429
  * fixed issue in 'nic create' with --public-ip-name #2440
  * added ability to create connection between Gateways in different resource groups #2445
  * NIC: test cases fixed to run against live #2476
  * Improved network dns record-set list output #2477
  * Fixed nic create #2484
  * Implemented express-route authorization #2453
* Storage
  * Upgrade azure-storage NodeJS NPM module from 0.6.0 to 0.7.0 #2458
  * Switched to the swagger based REST client lib #2459
* ARM
  * Fixed nested template error #2475
  * Change to use provisioning state instead of statusMessage #2482

## 2016-01-12 Version 0.9.14
* Insights
  * Removed retention from insights diagnostic commands 
* Redis Cache
  * Added premium sku and other related features option in redis create
* VM
  * Added User Image Option for VM Creation
  * Diagnostics - collect basic metrics when enabling diagnostic extension without specifying a wadcfg file
  * Updated VM Image Commands
  * Fixed issue #1487
* Resource Manager
  * Support resource move across subscriptions
* Network
  * Fixed issue #2366, #2391
  * Removed --no-tags option from all ARM networking commands
  * Implemented load balancer rule session persistence 
  * Implemented VPN connection Shared Key commands
* Website
  * Fixed issue #1892
* KeyVault
  * Added Key Vault DNS suffix to the AzureUSGovernment environment
* Role Based Access Control
  * Updated AAD Application command

## 2015-12-08 Version 0.9.13
* VM
  * Chef Extension
    * Implemented new option --client-pem for set-chef extension commands
    * Implemented changes for set chef extension client_pem option to provide validator less bootstrap support
    * Add user-image option for vm creation
    * Implemented certificates get command
    * Enable boot-diagnostics by default
    * Fixed the re-run with the same parameter issue for the set-access command for linux
    * Added bootstrap_version option for set-chef command
* Websites
  * Update kuduscript to v1.0.6
* DNS
  * Implemented DNS export
* Rediscache
  * cmds use the AutoRest generated clients
  * Added premium sku and other related features option in redis create
* HDInsight
  * Implemented Hdinsight Cluster CRUD ARM commands
* KeyVault
  * Added challenge parsing for KeyVault to support multiple environments
* Datalake
  * Added tests for datalake cmds
  * Fixed catalog commands and adding new types to support
  * Fixed FileSystem ingress/egress to use direct methods which avoid redirect calls
  * Updated all tests to reflect the above changes, which enabled us to remove the "skips" for the previous redirect problem tests.
* Mobile Service
  * Synchronized portal & cli behavior for mobile service deletion
* Insights
  * Implemented commands for insights diagnostic get/set
  * Remove retention from insights diagnostic commands 
* Resource Manager
  * Added deployment mode param when creating deployment
* Network
  * Fixed issue #2262, #2282, #2288, #2289, #2306, #2309, #2317, #2319, #2322
  * Made changes to TrafficManager Profile & Endpoints
  * Zone Export output file formatting fixed
* Authorization
  * Set roleDefinition to take complete object instead of partial updated fields.
  * List, show and delete role definition to take scope param
  * list and show RoleDefinition to take AtScopeAndBelow param
  * Use scoped RoleDefinitions in RoleAssignment commands
* General Improvements
  * Fixed #2269, #2275, #2285, #2021, #2268
  * Removed useless ._js file before create installer so to shrink the download size

## 2015.11.18 Version 0.9.12
* Authorization
  * Fixed json output format for role definition commands
  * Fixed roleId in authorization change log command to be a guid
* DataLake
  *Fix casing for "requires()" for DataLake* modules, enabling functionality on unix machines.
  *Fix a bug in catalog item enumeration
  *Fix a bug in downloading files to support binary files
  *Fix usage bugs for DataLake* commands.
  *Fix output logic for readability of internal arrays
  *Fix a bug in ADLA account creation where ADLS accounts were not properly associated.
  *Updated switch parameters to properly be treated as switch parameters that do not take a value

## 2015.10.29 Version 0.9.11
* Authorization
  * Add paging support for role assignment list calls
  * Modify RoleDefinitionId Display and Input to be a Guid in role and roleassignment commands.
  * Added RoleId as a parameter in create and delete role assignment commands.
  * Documentation/help text updates and miscellaneous bug fixes 
* Resource
  * Add resource move command
  * Add list deployment operation command
  * Add an option to avoid deployment validation
* Network
  * Add DNS Zone import commands
  * Add Express Route providers list commands
  * Fixed issue #2177, #2236
* Storage
  * Uses GA version of storage sdk library
  * Set the default concurrency to 10
  * Add --description in the storage account set command
* Compute
  * Enable disk encryption options for VM creation
  * Enable BGInfo extension on VM by default
* DataLake commands
* Website
  * Updated kudu scripts to v1.0.3
* Login
  * Add US Goverment environment
  * Fixed Osx login error caused by invalid keychain entries
  
## 2015.10.02 Version 0.9.10
* Authorization
  * Fixed display of role assignments display to add and remove certain fields.
  * Added expandPrincipalGroups and includeClassicAdministrators options to role assignment list command
  * Updated all role assignment commands to take in a signInName parameter instead of upn and email and renamed the role parameter to roleName
  * Added new role assignment changelog list command that gives access change history for a subscription
  * Role assignment Get fixes
  * Role Assignment Delete fixes
* Compute
  * Fixed issue #2119
  * Removed support for ASM images in ARM
* Network
  * Fixed issue #2143 in azure network vnet list command
  * Implemented ARM  Load Balancer  Inbound NAT Pools  commands
  * Load Balancer refactoring: constants improved, checking  statusCode  instead of error message, etc.
* Logging
  * Added truncation by default to the silly log capture after 1MB of logs has been captured
  * Added a AZURE_CLI_DISABLE_LOG_CAPTURE environment variable which allows silly log capturing to be disabled
* Resource
  * Update "azure group template" commands to work with newer gallery service.
  * Remove "--gallery-template" arguments from "group" and "group deployment" create commands.
* Storage
  * Update the storage dependency to 0.6.0 to be compatible with Nodejs 4.x
  * Fixed issues #2102, #2103
* KeyVault
  * Updated DNS suffix to correct azurechinacloud dns suffix.
  * Updated keyvault api version to current GA version ('2015-06-01').
* Usage
  * Documented the format of the date parameters and prompted for the dates if they weren't provided
* MFA Login
  * Fixed bad error message when the user logs in with an MSA account
  * Support Login using non organization id such as MSA account, live ids.
* README updates
  * Added Redis Cache in the home page features list
  * Added Docker Azure CLI as an installation option

## 2015.09.11 Version 0.9.9
* Redis Cache
  * Implemented create, set, show, list, list-keys, renew-key and delete commands
* Resource Provider operations
  * Implemented the Resource Provider operations show command
* Compute
  * Added support for IAAS diag and Linux diag extensions.
  * Fixed compute bugs
  * Added test cases for IAAS diagnostics extension.
  * Added test cases to address bug fixes
  * Updated recordings with minor refactoring
  * Implemented Set/Get Diagnostics Profile and Log
* KeyVault
  * Added environment parameter for keyvault dns suffix
* Storage
  * Improved user experience by checking the source size and ensured it doesn't exceed dest object limitation before data transfer
  * Supported AzureChinaCloud environment when the active account is in it
  * Switched from azure-storage-legacy to azure-storage
* Authentication
  * Enabled 2 factor authentication for org-id user accounts **(NOTE: this does not enable Microsoft Service Accounts like @live.com, etc...)**
* Network
  * Fixed network vnet delete when there is only one network
  * Implemented Local Networks Gateways commands
  * ASM: network nsg rule create command can now handle asterisk symbols on linux. Fixed issue #2002
* Authorization
  * Fixed formatting of role commands
* General Fixes
  * Cleaned up test run output by not emitting out errors to the console
  * Wired up code coverage npm 
  * Improved  utils.indexOfCaseIgnore() by making it return  -1  instead of  null  when item not found. Fixed issue #2077.
  * Added a separate VM testlist for ARM

## 2015.08.19 Version 0.9.8
* Storage
  * Update azure-storage to 0.5.0 which supports Azure storage service version 2015-02-21
  * Support append blob
  * Supports share quota and share usage
  * New commands for shared access signatures for shares and files
    * azure storage share sas create [options] [share] [permissions] [expiry] 
    * azure storage file sas create [options] [share] [path] [permissions] [expiry]
  * New commands for share ACL 
    * azure storage share policy create [options] [share] [name]
    * azure storage share policy show [options] [share] [name]
    * azure storage share policy list [options] [share]
    * azure storage share policy set [options] [share] [name]
    * azure storage share policy delete [options] [share] [name] 
  * New commands for file async copy 
    * azure storage file copy start [options] [sourceUri] [destShare]
    * azure storage file copy show [options] [share] [path]
    * azure storage file copy stop [options] [share] [path] [copyid]
  * New commands for CORS (Cross-Origin Resource Sharing)
    * azure storage cors set [options]
    * azure storage cors show [options]
    * azure storage cors delete [options]
* ARM
  * Display Outputs section from a template when submitting new deployments
  * group delete command will now block until the resource group is deleted
  * Support for submitting deployments with v2 version of template parameters
  * "azure-arm-resource" package is updated to version 0.10.2
  * Added delete deployment command
* Authorization
  * Role test fixes and authorization package updated to version 0.10.2
  * Added support to display custom roles in role list command
  * Added support to create and set role definitions with custom role
* Network
  * Fixed CIDR validation issues
  * Added support for 'None' next hop type in ARM RouteTable Route
  * Fixed the inability to add a nic in address-pool issue #2013
* General command improvement
  * Fixed service principal login issue on Mac #1958
  * Upgraded adal-node to 0.1.15 to fix '&' in the password issue #1918
  * Documentation updates for using Chinal Cloud fix issue #1995
  * Fixed issues #1894, #1911, #1923
  * Upgraded request library dependency to version 2.52.0
  * Added default Visual Studio nodejs project for xplat cli

## 2015.08.05 Version 0.9.7
* General command improvement
  * Fix the broken "help" command
  * Performance improvement on displaying command help information
  * AutoComplete support on commands options
* Login
  * Retain default account after login
  * Clean up cached tokens of service principal after logout
* ARM
  * Handle group deployment using a template file with BOM
  * Usage
    * Added command to list Azure resource usage information for a subscription
  * VM
    * Tags support for VM create.
    * Handle generation of SSH certs inside 'vm create' and 'vm docker create' commands
    * Added --lun option to 'vm disk attach-new' and 'vm disk attach' commands
    * Added functionality to set data disk name in 'vm disk attach-new' command
  * Network commands 
    * Route Tables
    * NIC

## 2015.07.20 Version 0.9.6
* ASM
  *  Network
    * Added commands to manage routes and route table
    * Added commands to manage local network
    * Added commands to manage application gateway
    * Added commands to manage traffic manager
    * Added commands to manage virtual network gateway
    * Reduced command load time by splitting network commands to separate files
  * Compute
    * Updated VM endpoint command to support probe interval and timeout
    * The endpoint create-multiple command has breaking change due to the accommodation of probe interval and timeout
    * Added support to set remote-subnet for an endpoint ACL rule
    * Added command to fetch deployment event
    * Enhanced docker create vm command to pass certificate CN
  * Site
    * Fixed streamline precompiler issues with azure site commands 

## 2015.06.26 Version 0.9.5
* ARM
  * WebApp
    * Added create, delete, show, list, start, stop and restart commands
  * ApiApp
    * Added create command
  * Key Vault
    * Commands now use Key Vault REST API v2015-06-01
* ASM
  * site
    * Bug fixes for Issues #1666, Added support for PHP version 5.6
    * Remove support PHP version 5.3 for web site options

## 2015.06.05 Version 0.9.4
* ARM
  * Fix group deployment create bug. Users should now be able to successfully submit template deployments

## 2015.05.29 Version 0.9.3
* General Fixes
  * Performance improvement of general command loading
  * Support login with partner tenant
* ARM
  * VM
    * Bug fixes for Issues #1726, #1731, #1761
  * Network
    * Bug fixes for Issues #1763, #1764, #1769, #1770, #1771, #1773, #1775, #1776, #1777, #1780, #1781, #1783
  * Monitoring
    * Moved events client out of Azure rollup into its own package
  * Insights
    * Added last Insights autoscale command
  * ApiApp
    * Added improved UIDefinition constraint validation
* ASM
  * HDInsight
    * Fixed the bug on listCluster command which shows duplicate items
    * Fixed parameter description for storageAccountName
  * VM
    * Bug fixes for Issues #1566, #1600, #1759
    * Chef Extension
      * Implemented new option --delete-chef-config for set-chef extension commands

## 2015.05.04 Version 0.9.2
* ARM
  * Network
    * Commands to manage DNS Zone and DNS Zone recordset
  * Key Vault
    * Added commands to manage vaults, keys and secrets (azure keyvault)
  * Insights
    * Added commands to handle alerts and alert rules, autoscale events and autoscale settings, list metrics and metrics definitions, and list usage metrics
  * ApiApp
    * Added package create command

## Version 0.9.1
* ARM
  * Virtual machines
    * Support for managing virtual machine resource in CRP stack, this includes commands to
      * Create VM with options to configure availability set and network resources
      * Quick create VM
      * Create docker VM
      * Delete, start, stop, generalize and capture VM
      * Manage VM extensions
      * Manage VM data disks
      * Manage VM images
      * Update VM to add and remove NICs
      * VM instance view
      * VM show commands which supports --depth option to fetch associated resources
      * Reset VM access credentials
  * Network
    * Support for managing network resources in NRP stack, this includes commands to
      * Manage virtual network
      * Manage virtual network subnet
      * Manage load balancer
      * Manage load balancer child resources
        * Probes
        * VIP configuration
        * Address pool
        * load balancing rules
        * Inbount NAT rules
      * Manage NIC
      * Manage PublicIP
      * Manage traffic manager
      * Manage security group
  * Availability set resource in CRP stack
    * Commands to manage availability set
  * Insights
    * Added commands to retrieve event/operation logs from Event Service
*ASM
  * VM
    * Chef Extension
      * Implemented new option --bootstrap-options for set-chef extension commands
  * Mobile
    * Features
        * Added support for AAD Tenants
        * Added support for proxies / fiddler
        * Improved custom domain, certificate, and SSL error handling
    * Issues
        * Fixed 'log is undefined' bug
        * Fixed connection issues with mobile pipeline
    * Test Infrastructure
        * Updated common mobile test infrastructure
        * Refactored mobile tests into separate files
        * Optimized mocked test time run for mobile tests

## 2015.03.27 Version 0.8.17
*  General Fixes
  * Fixed Improper JSON for vm image show #1611
  * Fixed account-affinitygroup show command #1633
  * Fixed an issue in vm export command #1635, #1514
  * Updated kuduscript for website deployment
  * Fixed Sql Server deletion issue in mobile service commands
  * Updated default docker extension version to 0.6
  * Fixed issues in windows and mac installer
* Test Infrastructure Optimization
  * Reduced the time to run mocked tests
  * Every test can be recorded to its individual test file

## 2015.03.04 Version 0.8.16
* VM
  * Feature
    * azure vm extension set-chef
    * azure vm extension get-chef
  * Issue fixes to address the following IAAS related issues
    * azure vm endpoint acl-rule create parser error: --description is incorrectly a bool #1500
    * azure vm create fails for specialized image: Cannot set property 'mediaLink' of undefined #1516
    * Azure vm disk attach properties (such as host-caching) not discoverable #1554
    * Can not copy a image blob between storage accounts #1565
    * -u is used for username as well as blob-url in the vm create command #1566
    * error: undefined is not a function #1575
    * Add support for changing cache policy of attached disk #1583
    * azure vm endpoint create fails with lb-set option #1594
* NETWORK
  * Issue fixes to address the following IAAS related issues
    * network import doesn't pass LocalNetworkSites #1416
    * network vnet create destroys subscription's "local network" #1569
    * azure network vnet create - Error - Cannot read property #1589
* General Fixes
  * use streamline version 0.10.17 to make it work for node version 0.12.0 upward
  * Restricted use of jshint to version <= 2.6.0 due to issues with later versions
  * Fixed issues when azure cli is used via proxy

## 2015.02.17 Version 0.8.15
* Used "Microsoft Azure Client Library for node" version 0.10.4
* Added custom domains functionality to mobile service commands

## 2015.01.22 Version 0.8.14
* Storage
  * Added support for storage "stored access policy" and update storage SDK
  * Added support for creating XIO storage accounts
  * Added support for "Premium_LRS" storage account type
* Mobile Service
  * Updated restart to only restart service. Add redeploy command to ensure mobile service runtime is using latest.
  * Added new required --push parameter to azure mobile create to specify push mode for node services. Options are legacy and nh.
  * Updated mobile tests for new gcm string and notification hub errors
* Websites
  * Fixed issues in site log set command with storage account option
* VM
  * Fixed azure vm create issue because of required storage account type
* General Fixes
  * Fixed azure login issues in AzureChinaCloud
  * Added location Australia, Australia South East, Japan East, Japan West and East US 2 for resource group
  * Moved azure.err file to user's home directory/.azure/azure.err
  * Fixed managing two subscriptions with same name issue
  * Updated Readme.md with Ubuntu installation instructions

## 2014.12.05 Version 0.8.13
* Upgraded the sites cli to work with latest breaking changes in the Azure Web Sites API.
* Upgraded the storage cli to work with latest breaking changes in the Azure Storage API.
* Added an option to delete SB Namepsace in mobile delete command
* VM
  * Support for capturing VM as VM image
  * Disk host caching while attaching disk
* NETWORK
  * Support for region wise VNet
  * Bug fix: unable to create affinity group as a part of vnet creation
  * Bug fix: don't re-throw 404 error from get network config
* SERVICE
  * Support for internal load balancer

## 2014.11.12 Version 0.8.12
* Fix Mobile CLI Tests and recorded mocks
* Fix for HDInsight commands in Azure China environment
* Storage
  * Updated azure-storage dependency to 0.4.0
  * Improved the blob downloading and uploading speed
* VM
  * VM create command bug fixes
  * Skip zero blocks when uploading fixed VHD
  * Commands to manage virtual machine endpoint ACL
  * Commands to manage virtual machine public IP
  * Support for creating virtual machine from VM image

## 2014.10.27 Version 0.8.11
* Credential store bug fixes
  * Clean credential store on account clear command
  * Remove old credential entries on login
* Storage
  * Add new commands to manage Storage logging properties
      storage logging show [options]
      storage logging set [options]
  * Add new commands to manage Storage metrics properties
      storage metrics show [options]
      storage metrics set [options]
  * Add SAS token support for blob download/copy
* Documentation and helper commands to enable Fiddler tracing

## 2014.10.02 Version 0.8.10
* VM
  * Create and manage VM extensions
  * Create and manage reserved IP addresses
  * Fixed issues in vm image list command
  * Fixed issues in --no-ssh-password parameter handling in vm create command
* Storage
  * SAS support
      azure storage container sas create
      azure storage blob sas create
      azure storage table sas create
      azure storage queue sas create
  * Storage unit test fixes
* Moved the GraphRbacManagementClient in a separate module named 'azure-extra' published to npm
* Fixed issues in token caching mechanism and the azure login command
* Fixed issues in npm install azure-cli on Ubuntu OS
* Fixed website tests
* Fixed the test recording infrastructure

## 2014.09.10 Version 0.8.8
* Role-based access control support
  *  Query role definition
      Azure role list
  *  Manage role assignment
      azure role assignment create
      azure role assignment list/show
      azure role assignment delete
  *  Query Azure AD object
      azure AD user list/show
      azure AD group list/show
      azure AD group member list
      azure AD SP list/show
  *  Show user's permissions
      azure group list/show
      azure resource list/show
* Active Directory service principal login support in Azure Resource Manager mode
      azure login --service-principal -tenant
* Storage
  *  Azure File Service support
      azure storage share create
      azure storage share list/show
      azure storage share delete
      azure storage directory create
      azure storage directory delete
      azure storage file upload
      azure storage file download
      azure storage file list
      azure storage file delete
  *  Azure Blob Service improvements
      azure storage blob copy start
      azure storage blob copy stop
      azure storage blob copy show
  *  Azure Table Service support
      azure storage table create
      azure storage table list/show
      azure storage table delete
  *  Azure Queue Service Support
      azure storage queue create
      azure storage queue list/show
      azure storage queue delete
  *  Switched storage library to Azure storage module

## 2014.08.04 Version 0.8.7
* Fixed issues with vm commands (vm image, vm docket create)
* Added support for A8, A9 vm sizes in vm create command
* Fixed user logout scenario issues and bumped up the credential size
* Rebranding from Windows Azure to Microsoft Azure
* Test fixes

## 2014.07.16 Version 0.8.6
* Store user credentials in the windows credential store
* Azure Resource Manager Tags (in arm mode)
  * azure tag create/list/show/delete
  * tags parameter in azure group create/set and azure resource create/set
  * tags parameter in azure group list and azure resource list
* Support PHP version 5.5 for web site options

## 2014.07.07 Version 0.8.5
* Active directory authentication support for
  * azure vm
  * azure vnet
  * azure mobile
* Command to create docker VM in azure
  * azure vm docker create
* Store active drectory token in key chain on Mac

## 2014.05.30 Version 0.8.4
* Active directory support for AzureChinaCloud
* Bug fixes for AzureChinaCloud endpoints
* Dropped support for Node version 0.6
* Test system improvements

## 2014.05.07 Version 0.8.3
* Bug fixes
* Engineering and infrastructure improvements

## 2014.04.10 Version 0.8.2
* Hotfix to correct issue with azure mobile create command

## 2014.04.03 Version 0.8.0
* Azure Resource Manager commands (preview)
  * "azure config" mode to switch mode between service management and resource manager.
  * Resource groups
    * azure group create/list/show/delete
    * azure group log show
  * Templates
    * azure group template list/show/download/validate
  * Deployments
    * azure group deployment create/list/show
  * Resources
    * azure resource create/set/list/show/delete
* Azure Active Directory authentication with Organizational ID
  * Log in directly from the command line using Organizational ID (create one for free in your subscription)
    * azure login/logout
  * Doesn't work with the following commands for now
    * azure vm
    * azure network
    * azure mobile

## 2014.01.20 - version 0.7.5
* Added web site slots support
* Added web jobs support
* CloudInit support for Ubuntu VM via "azure vm create -d"
* Multiple bugfixes

## 2013.11.13 - version 0.7.4
* azure site set --web-socket --disable-web-socket to enable/disable WebSocket
* azure site set --remote-debugging --disable-remote-debugging --remote-debugging-version to enable/disable/set remote debugging for .NET application.
* azure site set --managed-pipeline-mode to choose between Classic and Integrated.
* Multiple bugfixes

## 2013.10.18 - version 0.7.3
* #961 - Fixed issue with site connection strings
* #712 - Add support for VM shutdown on stop
* #876 - Improve azure site show appearance
* #966 - Fixed issue with incorrect service endpoint being used from publish settings
* #987 - Fix issue with "azure site download" on windows
* #925 - Making "azure site create" show template based error instead of generic one
* #963 - Update kudu script module to version 0.1.5
* Upgrade to latest SDK (which uses generated website wrappers)
* Supports the new high-memory A5 instance size (2 cores, 14GB RAM)

## 2013.09.24 - version 0.7.2
* Multiple bugfixes

## 2013.08.26 - version 0.7.1
* Added blob storage commands
  * azure storage blob list
  * azure storage blob show
  * azure storage blob upload
  * azure storage blob download
  * azure storage blob delete
* Added azure account cert export
* Multiple bug fixes

## 2013.07.31 - version 0.7.0
* Added network commands
* Added more site commands
  * azure site set
  * azure site cert
  * azure site connectionstring
  * azure site defaultdocument
  * azure site domain
  * azure site handler
* Improved site list to show locations
* Renamed azure site config (will be removed in a future version) to azure site appsettings
* Renamed azure account storage (will be removed in a future version) to azure storage account
* Reduced CLI generic help
* Added bash auto-complete support for commands and categories
* Fixed generic options (--json and --verbose) to only show up where they work
* Improved and updated setup experience
* Multiple bug fixes and test infrastructure improvement

## 2013.07.15 - version 0.6.18
* Added website diagnostics configuration command
  * azure site log set
* Added more storage container commands
  * azure storage container show
  * azure storage container create
  * azure storage container set
  * azure storage container delete
* Multiple fixes
* Made module global by default
* Added scenario tests

## 2013.06.20 - version 0.6.17
* HDInsight commands
* Added cucumber tests
* Multiple fixes to support Azure China
* Multiple VM fixes
* New azure site repository sync command to sync the deployment of a website
* New azure mobile recover command to recover of an unhealthy mobile service
* Command to list Microsoft Azure Storage container
  * azure storage container list

## 2013.05.13 - version 0.6.16
* Fixed issue with registered resources on account import.
* Fixed jsHint errors.
* Multiple fixes to support different REST endpoints / environments.
* Dinamicaly fetch locations for websites instead of hardcoding them.
* Fixed issues around first website creation to enable this scenario more easily.

## 2013.04.21 - version 0.6.15
* Locked package.json dependencies to patch versions.

## 2013.04.03 - version 0.6.14
* Adding node 0.10 support.
* Fixed issue when importing publishsettings files for a brand new Azure account.

## 2013.03.19 - version 0.6.13
* Switch "azure site repository delete" to use the new api.  Old api will be deprecated in 08/13 and users using old SDK will need upgrade.
* Adding support for creating and deleting affinity groups
* Changed the option names to --description and --affinity-group on the storage command
* "azure site scale" - change the scaling mode of websites

## 2013.03.12 - Version 0.6.12
* Added constraint to package.json to restrict to node versions < 0.9.

## 2012.12.12 - Version 0.6.11
* "azure sql" - manage Azure SQL Server servers, databases and firewall rules
* "azure site log tail" - realtime streaming logs over Microsoft Azure.
* "azure mobile script upload" - now supports shared and scheduler scripts #179
* "azure mobile show" - now displays scale information #139
* "azure mobile scale" - allows managing scale out for your mobile app #139
* "azure mobile job" - allows managing scheduled jobs #78
* "azure mobile data truncate" - allows truncating mobile tables #164
* "azure site deploymentscript" - bunch of fixes

## 2012.12.22 - Version 0.6.10
* Fix require issue with unix based systems
* Fix issue with deployment scripts

## 2012.12.12 - Version 0.6.9
* "azure portal" - replaces "azure vm portal" and "azure site portal".
* "azure mobile" - Manages Azure Mobile Services
* "azure sb namespace" - Manages Service Bus namespaces
* "azure site deploymentscript" - Generates deployment scripts for customizing your website deployment
* "azure vm create -o" - Create VMs using community/OSS images
* "azure vm endpoint create-multiple" - Create multiple VM endpoints in one shot.

## 2012.11.20 - Version 0.6.8
* Initial release of stand alone CLI.
* New commands for managing storage accounts
* Support for new .publishsettings file format
* Several bug fixes for github repos.

========== CLI Split =========

## 2012.10.15 Version 0.6.7
 * Adding connection strings support for storage and service bus
 * Fixing issue with EMULATED and explicit variables making the later more relevant
 * Adding Github support
 * Adding website application settings support

## 2012.10.12 Version 0.6.6
 * Using fixed version of commander.js to avoid bug in commander.js 1.0.5

## 2012.10.01 Version 0.6.5
 * Bugfixing

## 2012.09.18 Version 0.6.4
 * Multiple Bugfixes around blob streaming

## 2012.09.09 Version 0.6.3
 * Fixing issue with xml2js

## 2012.08.15 Version 0.6.2
 * Multiple Bugfixes

## 2012.07.02 Version 0.6.1
 * Multiple Bugfixes
 * Adding subscription setting and listing functionality.

## 2012.06.06 Version 0.6.0
 * Adding CLI tool
 * Multiple Bugfixes

## 2012.04.19 Version 0.5.3
 * Service Runtime Wrappers
 * Multiple Bugfixes
 * Unit tests converted to mocha and code coverage made easy through JSCoverage

## 2012.02.10 Version 0.5.2
 * Service Bus Wrappers
 * Storage Services UT run against a mock server.
 * Node.exe version requirement lowered to raise compatibility.
 * Multiple Bugfixes

## 2011.12.14 Version 0.5.1
 * Multiple bug fixes

## 2011.12.09 Version 0.5.0
 * Initial Release
