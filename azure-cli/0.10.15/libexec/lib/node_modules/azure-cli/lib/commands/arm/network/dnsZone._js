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
var constants = require('./constants');
var fs = require('fs');
var resourceUtils = require('../resource/resourceUtils');
var recordSetUtils = require('./recordSetUtils');
var tagUtils = require('../tag/tagUtils');
var ZoneFile = require('./zoneFile');
var util = require('util');
var utils = require('../../../util/utils');
var $ = utils.getLocaleString;

function DnsZone(cli, dnsManagementClient) {
  this.dnsManagementClient = dnsManagementClient;
  this.zoneFile = new ZoneFile(cli.output);
  this.output = cli.output;
  this.interaction = cli.interaction;
}

__.extend(DnsZone.prototype, {

  /**
   * Zone methods
   */
  create: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');

    var zone = {
      properties: {},
      location: constants.dnsZone.defLocation
    };
    zone = self._parseZone(zone, options);
    var progress = self.interaction.progress(util.format($('Creating dns zone "%s"'), zoneName));
    try {

      // Using ifNoneMatch: '*' force create zone if not exist.
      zone = self.dnsManagementClient.zones.createOrUpdate(resourceGroupName, zoneName, zone, options, _);
    } finally {
      progress.end();
    }
    self._showZone(zone,resourceGroupName, zoneName);
  },

  set: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');

    var zone = self.get(resourceGroupName, zoneName, _);
    if (!zone) {
      throw new Error(util.format($('A dns zone with name "%s" not found in the resource group "%s"'), zoneName, resourceGroupName));
    }

    zone = self._parseZone(zone, options);

    var progress = self.interaction.progress(util.format($('Updating dns zone "%s"'), zoneName));
    try {

      // Using ifMatch: eTag to force update existing zone.
      zone = self.dnsManagementClient.zones.createOrUpdate(resourceGroupName, zoneName, zone, options, _);
    } finally {
      progress.end();
    }

    self._showZone(zone, resourceGroupName, zoneName);
  },

  list: function (options, _) {
    var self = this;
    var progress = self.interaction.progress($('Getting the dns zones'));

    var dnsZones = null;
    var nextLink, nextZones;
    try {
      if (options.resourceGroup) {
        dnsZones = self.dnsManagementClient.zones.listInResourceGroup(options.resourceGroup, options, _);
        nextLink = dnsZones.nextLink;
        while (nextLink !== undefined) {
          self.output.silly('Following nextLink');
          nextZones = self.dnsManagementClient.zones.listInResourceGroupNext(nextLink, options, _);
          dnsZones.zones = dnsZones.concat(nextZones.zones);
          nextLink = nextZones.nextLink;
        }
      } else {
        dnsZones = self.dnsManagementClient.zones.listInSubscription(options, _);
        nextLink = dnsZones.nextLink;
        while (nextLink !== undefined) {
          self.output.silly('Following nextLink');
          nextZones = self.dnsManagementClient.zones.listInSubscriptionNext(nextLink, options, _);
          dnsZones.zones = dnsZones.concat(nextZones.zones);
          nextLink = nextZones.nextLink;
        }
      }
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(dnsZones, function (zones) {
      if (zones.length === 0) {
        self.output.warn($('No dns zones found'));
      } else {
        self.output.table(zones, function (row, zone) {
          row.cell($('Name'), zone.name);
          var resInfo = resourceUtils.getResourceInformation(zone.id);
          row.cell($('Resource group'), resInfo.resourceGroup);
          row.cell($('Tags'), tagUtils.getTagsInfo(zone.tags) || '');
        });
      }
    });
  },

  show: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');

    var zone = self.get(resourceGroupName, zoneName, _);
    self._showZone(zone, resourceGroupName, zoneName);
  },

  clear: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');

    if (!options.quiet && !self.interaction.confirm(util.format($('Clear dns zone "%s"? [y/n] '), zoneName), _)) {
      cli.output.info(util.format($('DNS zone "%s" was not cleared and still has old record set list'), zoneName));
      return;
    }

    var recordSets = null;
    var progress = self.interaction.progress($('Looking up the DNS Record Sets'));
    try {
      recordSets = self.dnsManagementClient.recordSets.listAllInResourceGroup(resourceGroupName, zoneName, options, _);
    } finally {
      progress.end();
    }

    for (var i = 0; i < recordSets.length; i++) {
      var recordSet = recordSets[i];
      var type = recordSetUtils.getShortType(recordSet.id);
      if (recordSet.name === '@' && (type === constants.dnsZone.SOA || type === constants.dnsZone.NS)) continue;

      options.type = type;
      self.deleteRecordSet(resourceGroupName, zoneName, recordSet.name, options, _);
    }
  },

  delete: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');

    self.output.warn(util.format($('Deleting dns zone "%s" you will delete all record sets'), zoneName));
    if (!options.quiet && !self.interaction.confirm(util.format($('WARNING: This will delete the DNS zone "%s" and all DNS records. ' +
        'This operation cannot be undone. Please confirm [y/n]'), zoneName), _)) {
      cli.output.info(util.format($('DNS zone "%s" was not deleted and still exists in resource group "%s"'), zoneName, resourceGroupName));
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting dns zone "%s"'), zoneName));
    var response;
    try {
      response = self.dnsManagementClient.zones.deleteMethod(resourceGroupName, zoneName, options, _);
    } finally {
      progress.end();
    }

    if (response.statusCode === 204) {
      throw new Error(util.format($('A dns zone with name "%s" not found in the resource group "%s"'), zoneName, resourceGroupName));
    }
  },

  get: function (resourceGroupName, zoneName, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');
    var progress = self.interaction.progress(util.format($('Looking up the dns zone "%s"'), zoneName));
    try {
      var dnsZone = self.dnsManagementClient.zones.get(resourceGroupName, zoneName, null, _);
      return dnsZone;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  update: function (resourceGroupName, zoneName, dnsZone, _) {
    var self = this;
    zoneName = utils.trimTrailingChar(zoneName, '.');
    var progress = self.interaction.progress(util.format($('Updating dns zone "%s"'), zoneName));
    try {
      self.dnsManagementClient.zones.createOrUpdate(resourceGroupName, zoneName, {zone: dnsZone}, _);
    } catch (e) {
      throw e;
    } finally {
      progress.end();
    }
  },

  import: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = zoneName.toLowerCase();

    if (options.debug) console.time('Time elapsed');

    var text = fs.readFileSync(options.fileName, 'utf8');
    var zfile = self.zoneFile.parse(zoneName, text);

    if (options.parseOnly && self.output.format().json) {
      self.output.json(zfile);
    }
    if (options.parseOnly) return;

    var dnsZone = self.get(resourceGroupName, zoneName, _);
    if (!dnsZone) {
      self.create(resourceGroupName, zoneName, options, _);
    }

    var totalSetsCount = zfile.sets.length;
    var importedSetsCount = 0;

    for (var i = 0; i < zfile.sets.length; i++) {
      var recordSet = zfile.sets[i];
      importedSetsCount += self.importRecordSet(resourceGroupName, zoneName, recordSet, options, _);
      self.output.info(util.format($('%d out of %d record sets processed, %d import(s) failed'),
        i + 1, totalSetsCount, (i + 1 - importedSetsCount)));
    }

    if (options.debug) console.timeEnd('Time elapsed');
  },

  export: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    zoneName = zoneName.toLowerCase();
    zoneName = utils.trimTrailingChar(zoneName, '.');

    if (fs.existsSync(options.fileName)) {
      if (!options.quiet && !self.interaction.confirm(util.format($('Overwrite file "%s"? [y/n] '), options.fileName), _)) {
        cli.output.info(util.format($('File "%s" was not overwritten'), options.fileName));
        return;
      }
    }

    var dnsZone = self.get(resourceGroupName, zoneName, _);
    if (!dnsZone) {
      throw new Error(util.format($('DNS zone "%s" not found in resource group "%s"'), zoneName, resourceGroupName));
    }
    var recordSets = self.dnsManagementClient.recordSets.listAllInResourceGroup(resourceGroupName, zoneName, options, _);

    var nextLink = recordSets.nextLink;
    while (nextLink !== undefined) {
      self.output.silly('Following nextLink');
      var nextRecordSets = self.dnsManagementClient.recordSets.listAllInResourceGroupNext(nextLink, _);
      recordSets = recordSets.concat(nextRecordSets);
      nextLink = nextRecordSets.nextLink;
    }

    var fileData = self.zoneFile.generate(resourceGroupName, zoneName, recordSets);

    var progress = self.interaction.progress(util.format($('Exporting dns zone "%s" from resource group "%s"'), zoneName, resourceGroupName));
    try {
      fs.writeFileSync(options.fileName, fileData);
    } finally {
      progress.end();
    }
  },

  /**
   * Record Set methods
   */
  importRecordSet: function (resourceGroupName, zoneName, recordSet, options, _) {
    var self = this;

    // Converting record set FQDN name to relative name.\
    var fqdnName = utils.trimTrailingChar(recordSet.name, '.');
    recordSet.name = self.zoneFile.covertFromFQDN(recordSet.name, zoneName);
    zoneName = utils.trimTrailingChar(zoneName, '.');

    // Note: these rules only apply to the SOA/NS records at the zone apex (record set FQDN = zone name).
    if (recordSet.name === '@') {
      fqdnName = '@';

      switch (recordSet.type) {

        // For the SOA, all fields are taken from the zone file, EXCEPT the 'host' parameter, which must be preserved (i.e. zone file host is ignored).
        case constants.dnsZone.SOA:
          self.output.info($('The "host" of the SOA record is determined by the Azure DNS name server names - the value specified in the imported zone file is ignored'));
          break;

        // For the NS, only the TTL shall be taken from the zone file.  All other data must be preserved (i.e. zone file is ignored).
        case constants.dnsZone.NS:
          self.output.info($('The authoritative NS records at the zone apex are determined by the Azure DNS name server names - the values specified in the imported zone file are ignored'));
          break;
      }
    }

    // Parsed record set format is not compatible with DNS api, converting to compatible format.
    var parameters = recordSetUtils.covertToAzureFormat(recordSet);

    // Force replace existing recordSet if required.
    if (options.force) {
      parameters.ifNoneMatch = undefined;
    } else {
      parameters.ifNoneMatch = '*';
    }

    /*
     Records in a record set may be out-of-sequence in the zone file, with records from different record sets in between.
     These must be combined into a single record set.  This record set may then need to be merged with a pre-existing record set in Azure DNS.
     */
    var progress = self.interaction.progress(util.format($('Importing record set "%s" of type "%s"'), fqdnName, recordSet.type));
    var res = self.tryImportRecordSet(resourceGroupName, zoneName, recordSet.name, recordSet.type, parameters, _);
    if (res.statusCode === 412) {
      var existingSet = self.getRecordSet(resourceGroupName, zoneName, recordSet.name, recordSet, _);
      parameters = recordSetUtils.merge(parameters, existingSet, recordSet.type, options, self.output);
      res = self.tryImportRecordSet(resourceGroupName, zoneName, recordSet.name, recordSet.type, parameters, _);
    }
    progress.end();

    return res.statusCode === 200 ? 1 : 0;
  },

  tryImportRecordSet: function (resourceGroupName, zoneName, setName, setType, parameters, _) {
    var self = this;
    var res = {};
    try {
      if (setName === '@' && (setType === constants.dnsZone.SOA || setType === constants.dnsZone.NS)) {

        // '@' SOA and NS are special case, need to use PATCH method.
        self.dnsManagementClient.recordSets.update(resourceGroupName, zoneName, setName, setType, parameters, null, _);
      } else {

        // All other types uses PUT method.
        self.dnsManagementClient.recordSets.createOrUpdate(resourceGroupName, zoneName, setName, setType, parameters, null, _);
      }
      res.statusCode = 200;
    } catch (e) {
      res.statusCode = e.statusCode;
      if (e.statusCode !== 412) {
        self.output.warn(e.message);
      }
    }
    return res;
  },

  createRecordSet: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;

    var recordSet = self._initRecordSet(resourceGroupName, zoneName, setName, options);
    var progress = self.interaction.progress(util.format($('Creating DNS record set "%s" of type "%s"'), setName, options.type));
    try {
      recordSet = self.dnsManagementClient.recordSets.createOrUpdate(resourceGroupName, zoneName, setName, options.type, recordSet, options, _);
    } finally {
      progress.end();
    }
    self._showRecordSet(recordSet);
  },

  setRecordSet: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;
    options.type = utils.verifyParamExistsInCollection(constants.dnsZone.recordTypes, options.type, '--type');

    var zone = self.get(resourceGroupName, zoneName, _);
    if (!zone) {
      throw new Error(util.format($('A DNS zone with name "%s" not found in the resource group "%s"'), zoneName, resourceGroupName));
    }

    var recordSet = self.getRecordSet(resourceGroupName, zoneName, setName, options, _);
    if (!recordSet) {
      throw new Error(util.format($('A record set with name "%s" of type "%s" not found in the DNS zone "%s"'), setName, options.type, zoneName));
    }

    self._parseRecordSet(recordSet, options, false);

    recordSet = self.updateRecordSet(resourceGroupName, zoneName, setName, options.type, recordSet, _);
    self._showRecordSet(recordSet);
  },

  setSoaRecord: function(resourceGroupName, zoneName, options, _) {
    var self = this;

    // Default name for required SOA record set.
    var setName = '@';
    options.type = constants.dnsZone.SOA;
    var recordSet = self.getRecordSet(resourceGroupName, zoneName, setName, options, _);
    if (!recordSet) {
      throw new Error(util.format($('A record set with name "%s" of type "%s" not found in the DNS zone "%s"'), setName, options.type, zoneName));
    }
    if(options.email) {
      recordSet.soaRecord.email = options.email;
    }
    if(options.expireTime) {
      recordSet.soaRecord.expireTime = parseInt(options.expireTime);
    }
    if(options.serialNumber) {
      recordSet.soaRecord.serialNumber = parseInt(options.serialNumber);
    }
    if(options.minimumTtl) {
      recordSet.soaRecord.minimumTtl = parseInt(options.minimumTtl);
    }
    if(options.refreshTime) {
      recordSet.soaRecord.refreshTime = parseInt(options.refreshTime);
    }
    if(options.retryTime) {
      recordSet.soaRecord.retryTime = parseInt(options.retryTime);
    }
    self._parseRecordSet(recordSet, options, false);

    recordSet = self.updateRecordSet(resourceGroupName, zoneName, setName, options.type, recordSet, _);
    self._showRecordSet(recordSet);
  },

  deleteRecordSet: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;
    var recordSet = self.getRecordSet(resourceGroupName, zoneName, setName, options, _);
    if(!recordSet) {
      throw new Error(util.format($('A record set with name "%s" of type "%s" not found in the DNS zone "%s"'), setName, options.type, zoneName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete DNS record set "%s" from DNS zone "%s"? [y/n] '), setName, zoneName), _)) {
      cli.output.info(util.format($('DNS record set "%s" was not deleted and still exists in DNS zone "%s"'), setName, zoneName));
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting DNS record set "%s" of type "%s"'), setName, options.type));
    try {
      self.dnsManagementClient.recordSets.deleteMethod(resourceGroupName, zoneName, setName, options.type, options, _);
    } finally {
      progress.end();
    }
  },

  listRecordSets: function (resourceGroupName, zoneName, options, _) {
    var self = this;
    var dnsRecords = null;

    var progress = self.interaction.progress($('Looking up the DNS Record Sets'));
    try {
      if (options.type) {
        options.type = self._validateType(options.type);
        dnsRecords = self.dnsManagementClient.recordSets.listByType(resourceGroupName, zoneName, options.type, options, _);
      } else {
        dnsRecords = self.dnsManagementClient.recordSets.listAllInResourceGroup(resourceGroupName, zoneName, options, _);
      }
    } finally {
      progress.end();
    }

    var nextLink = dnsRecords.nextLink;
    while (nextLink !== undefined) {
      self.output.silly('Following nextLink');
      var nextRecordSets = self.dnsManagementClient.recordSets.listByTypeNext(nextLink, _);
      dnsRecords = dnsRecords.concat(nextRecordSets);
      nextLink = nextRecordSets.nextLink;
    }
    self.interaction.formatOutput(dnsRecords, function (outputData) {
      if (outputData.length === 0) {
        self.output.warn($('No DNS records sets found'));
      } else {
        var indent = 2;
        var formattedRecordSetList = recordSetUtils.convertToListFormat(outputData);
        formattedRecordSetList.forEach(function (recordSet) {
          self.output.nameValue($('Name'), recordSet.name);
          self.output.nameValue($('Type'), recordSet.type);
          self.output.nameValue($('TTL'), recordSet.ttl);
          self.output.nameValue($('Email'), recordSet.email);
          self.output.nameValue($('Host'), recordSet.host);
          self.output.nameValue($('Serial Number'), recordSet.serialNumber);
          self.output.nameValue($('Refresh Time'), recordSet.refreshTime);
          self.output.nameValue($('Retry Time'), recordSet.retryTime);
          self.output.nameValue($('Expire Time'), recordSet.expireTime);
          self.output.nameValue($('Minimum TTL'), recordSet.minimumTtl);

          if (recordSet.records && recordSet.records.length > 0) {
            self.output.header($('Records'));
            if(recordSet.type === constants.dnsZone.TXT) {
              recordSet.records.forEach(function (item) {
                item = item.join('');
                item = recordSetUtils.displaySpecialCharacters(item);
                self.output.data(util.format($('%s\"%s\"'), self.output.spaces(indent), item));
              });
            } else {
              self.output.list(recordSet.records, indent);
            }
          }
          if(recordSet.record) {
            self.output.nameValue($('Record'), recordSet.record);
          }
          self.output.data($(''), '');
        });
      }
    });
  },

  getRecordSet: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;

    var progress = self.interaction.progress(util.format($('Looking up the DNS Record Set "%s" of type "%s"'), setName, options.type));
    try {
      options.type = options.type.toUpperCase();
      var recordSet = self.dnsManagementClient.recordSets.get(resourceGroupName, zoneName, setName, options.type, _);
      recordSetUtils.removeEmptyRecords(recordSet);
      return recordSet;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  showRecordSet: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;
    options.type = utils.verifyParamExistsInCollection(constants.dnsZone.recordTypes, options.type, '--type');

    var recordSet = self.getRecordSet(resourceGroupName, zoneName, setName, options, _);
    self.interaction.formatOutput(recordSet, function (recordSet) {
      if (recordSet === null) {
        self.output.warn(util.format($('A DNS record with name "%s" not found in the zone "%s"'), setName, zoneName));
      } else {
        self._showRecordSet(recordSet);
      }
    });
  },

  addRecord: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;
    options.type = self._validateType(options.type);

    var dnsZone = self.get(resourceGroupName, zoneName, _);
    if (!dnsZone) {
      throw new Error(util.format($('A DNS zone with name "%s" not found in the resource group "%s"'), zoneName, resourceGroupName));
    }

    var recordSet = self.getRecordSet(resourceGroupName, zoneName, setName, options, _);
    if (recordSet) {
      if (options.type === constants.dnsZone.CNAME && !options.quiet && recordSet.cnameRecord && !self.interaction.confirm(
          util.format($('The DNS record set with type "%s" permits only one record per record set.' +
            'Do you want to replace the existing record set value to new "%s"? [y/n]'), options.type, options.cname), _)) {
        cli.output.info(util.format($('DNS record set "%s" was not changed and still has value "%s"'), setName, recordSet.cnameRecord.cname));
        return;
      }
    } else {
      recordSet = self._initRecordSet(resourceGroupName, zoneName, setName, options);
    }
    self._parseRecord(recordSet, options, true);
    recordSet = self.updateRecordSet(resourceGroupName, zoneName, setName, options.type, recordSet, _);
    self._showRecordSet(recordSet);
  },

  deleteRecord: function (resourceGroupName, zoneName, setName, options, _) {
    var self = this;
    options.type = self._validateType(options.type);

    var dnsZone = self.get(resourceGroupName, zoneName, _);
    if (!dnsZone) {
      throw new Error(util.format($('A DNS zone with name "%s" not found in the resource group "%s"'), zoneName, resourceGroupName));
    }

    var recordSet = self.getRecordSet(resourceGroupName, zoneName, setName, options, _);
    if (!recordSet) {
      throw new Error(util.format($('A record set with name "%s" of type "%s" not found in DNS zone "%s"'), setName, options.type, zoneName));
    }
    var recordCount = self._parseRecord(recordSet, options, false);

    if (!options.quiet && !self.interaction.confirm($('Delete DNS Record? [y/n] '), _)) {
      cli.output.info(util.format($('DNS record was not deleted and still exists in record set "%s"'), setName));
      return;
    }

    if(recordCount === 0 && !options.keepEmptyRecordSet) {
      self.output.warn(util.format($('Record set "%s" of type "%s" will be deleted as well'), setName, options.type));
      options.quiet = true;
      self.deleteRecordSet(resourceGroupName, zoneName, setName, options, _);
    } else {
      recordSet = self.updateRecordSet(resourceGroupName, zoneName, setName, options.type, recordSet, _);
      self._showRecordSet(recordSet);
    }
  },

  updateRecordSet: function (resourceGroupName, zoneName, setName, setType, parameters, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Updating record set "%s" of type "%s"'), setName, setType));
    try {
      var recordSet = self.dnsManagementClient.recordSets.createOrUpdate(resourceGroupName, zoneName, setName, setType, parameters, _);
      return recordSet;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  promptRecordParamsIfNotGiven: function (options, _) {
    var self = this;
    options.type = self._validateType(options.type);

    switch (options.type) {
      case constants.dnsZone.A:
        options.ipv4Address = self.interaction.promptIfNotGiven($('IPv4 address for A record: '), options.ipv4Address, _);
        break;
      case constants.dnsZone.AAAA:
        options.ipv6Address = self.interaction.promptIfNotGiven($('IPv6 address for AAAA record: '), options.ipv6Address, _);
        break;
      case constants.dnsZone.CNAME:
        options.cname = self.interaction.promptIfNotGiven($('Canonical name for CNAME record: '), options.cname, _);
        break;
      case constants.dnsZone.MX:
        options.preference = self.interaction.promptIfNotGiven($('Preference for MX record: '), options.preference, _);
        options.exchange = self.interaction.promptIfNotGiven($('Exchange for MX record: '), options.exchange, _);
        break;
      case constants.dnsZone.NS:
        options.nsdname = self.interaction.promptIfNotGiven($('Domain name for NS record: '), options.nsdname, _);
        break;
      case constants.dnsZone.SRV:
        options.priority = self.interaction.promptIfNotGiven($('Priority for SRV record: '), options.priority, _);
        options.weight = self.interaction.promptIfNotGiven($('Weight for SRV record: '), options.weight, _);
        options.port = self.interaction.promptIfNotGiven($('Port for SRV record: '), options.port, _);
        options.target = self.interaction.promptIfNotGiven($('Target for SRV record: '), options.target, _);
        break;
      case constants.dnsZone.TXT:
        options.text = self.interaction.promptIfNotGiven($('Text for TXT record type: '), options.text, _);
        break;
      case constants.dnsZone.PTR:
        options.ptrdname = self.interaction.promptIfNotGiven($('PTR domain name for PTR record: '), options.ptrdname, _);
        break;
      default:
        break;
    }
  },

  /**
   * Private methods.
   */

  _initRecordSet: function(resourceGroupName, zoneName, setName, options) {
    var self = this;

    options.type = utils.verifyParamExistsInCollection(constants.dnsZone.recordTypes, options.type, '--type');
    if (options.type === constants.dnsZone.SOA) {
      throw new Error(util.format($('Only one "%s" record is allowed in dns zone'), options.type));
    }

    var recordSet = {};
    var propName = recordSetUtils.getPropertyName(options.type);
    recordSet[propName] = [];

    self._parseRecordSet(recordSet, options, true);
    return recordSet;
  },

  _parseZone: function (zone, options) {
    if (options.tags) {
      if (utils.argHasValue(options.tags)) {
        tagUtils.appendTags(zone, options);
      } else {
        zone.tags = {};
      }
    }
    return zone;
  },

  _parseRecordSet: function (recordSet, options, useDefaults) {
    var self = this;

    if (options.ttl) {
      var ttlAsInt = utils.parseInt(options.ttl);
      if (isNaN(ttlAsInt) || (ttlAsInt < 0)) {
        throw new Error($('--ttl value must be positive integer'));
      }
      recordSet.tTL = ttlAsInt;
    } else if (useDefaults) {
      var defTtl = constants.dnsZone.defTtl;
      self.output.warn(util.format($('using default TTL of %s seconds'), defTtl));
      recordSet.tTL = defTtl;
    }

    if (options.metadata) {
      if (utils.argHasValue(options.metadata)) {
        tagUtils.appendTags(recordSet, options, 'metadata');
      } else {
        recordSet.metadata = {};
      }
    }
  },

  _parseRecord: function (recordSet, options, isAdding) {
    var self = this;
    var recordIndex;
    var recordCount = 0;

    // A record
    if (options.ipv4Address) {
      if (options.type !== constants.dnsZone.A) {
        self.output.info(util.format($('--ipv4-address will be ignored for record of type "%s"'), options.type));
      } else {
        if (isAdding) {
          recordSet.aRecords.push({ipv4Address: options.ipv4Address});
        } else {
          recordIndex = utils.indexOfCaseIgnore(recordSet.aRecords, {ipv4Address: options.ipv4Address});
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with IPv4 "%s" not found in the record set "%s"'), options.type, options.ipv4Address, recordSet.name));
          }
          recordSet.aRecords.splice(recordIndex, 1);
          recordCount = recordSet.aRecords.length;
        }
      }
    }

    // AAAA record
    if (options.ipv6Address) {
      if (options.type !== constants.dnsZone.AAAA) {
        self.output.info(util.format($('--ipv6-address will be ignored for record of type "%s"'), options.type));
      } else {
        if (isAdding) {
          recordSet.aaaaRecords.push({ipv6Address: options.ipv6Address});
        } else {
          recordIndex = utils.indexOfCaseIgnore(recordSet.aaaaRecords, {ipv6Address: options.ipv6Address});
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with IPv6 "%s" not found in the record set "%s"'), options.type, options.ipv6Address, recordSet.name));
          }
          recordSet.aaaaRecords.splice(recordIndex, 1);
          recordCount = recordSet.aaaaRecords.length;
        }
      }
    }

    // CNAME record
    if (options.cname) {
      if (options.type !== constants.dnsZone.CNAME) {
        self.output.info(util.format($('--cname will be ignored for record of type "%s"'), options.type));
      } else {
        if (isAdding) {
          options.cname = utils.trimTrailingChar(options.cname, '.');
          recordSet.cnameRecord = {cname: options.cname};
        } else {
          if (recordSet.cnameRecord.cname === options.cname) {
            delete recordSet.cnameRecord;
          } else {
            throw new Error(util.format($('Record of type "%s" with cname "%s" not found in the record set "%s"'), options.type, options.cname, recordSet.name));
          }
        }
      }
    }

    // MX record
    if (options.preference || options.exchange) {
      if (options.type !== constants.dnsZone.MX) {
        self.output.info(util.format($('--preference,--exchange will be ignored for record of type "%s"'), options.type));
      } else {
        options.exchange = utils.trimTrailingChar(options.exchange, '.');
        options.preference =  parseInt(options.preference);
        if (isAdding) {
          recordSet.mxRecords.push({preference: options.preference, exchange: options.exchange});
        } else {
          recordIndex = utils.indexOfCaseIgnore(recordSet.mxRecords, {preference: options.preference, exchange: options.exchange});
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with preference "%s" and exchange "%s" not found in the record set "%s"'), options.type, options.preference, options.exchange, recordSet.name));
          }
          recordSet.mxRecords.splice(recordIndex, 1);
          recordCount = recordSet.mxRecords.length;
        }
      }
    }

    // NS record
    if (options.nsdname) {
      if (options.type !== constants.dnsZone.NS) {
        self.output.info(util.format($('--nsdname will be ignored for record of type "%s"'), options.type));
      } else {
        if (isAdding) {
          recordSet.nsRecords.push({nsdname: options.nsdname});
        } else {
          recordIndex = utils.indexOfCaseIgnore(recordSet.nsRecords, {nsdname: options.nsdname});
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with nsdname "%s" not found in the record set "%s"'), options.type, options.nsdname, recordSet.name));
          }
          recordSet.nsRecords.splice(recordIndex, 1);
          recordCount = recordSet.nsRecords.length;
        }
      }
    }

    // SOA records
    if (options.type.toUpperCase() !== constants.dnsZone.SOA) {
      if (options.email || options.expireTime || options.host || options.minimumTtl || options.refreshTime || options.retryTime) {
        self.output.info(util.format($('SOA parameters will be ignored due to type of this DNS record - "%s"'), options.type));
      }
    } else if (options.email || options.expireTime || options.host || options.minimumTtl || options.refreshTime || options.retryTime) {
      if (options.email && options.expireTime && options.host && options.minimumTtl && options.refreshTime && options.retryTime) {
        throw new Error($('You must specify all SOA parameters if even one is specified'));
      }

      if (isNaN(options.expireTime) || options.expireTime < 0) {
        throw new Error($('--expire-time parameter must be positive integer'));
      }

      if (isNaN(options.refreshTime) || options.refreshTime < 0) {
        throw new Error($('--refresh-time parameter must be positive integer'));
      }

      if (isNaN(options.retryTime) || options.retryTime < 0) {
        throw new Error($('--retry-time parameter must be positive integer'));
      }

      if (isNaN(options.minimumTtl) || options.minimumTtl < 255) {
        throw new Error($('--minimumTtl parameter must be in the range [0,255]'));
      }

      if (true) {
        recordSet.soaRecord = {
          email: options.email,
          expireTime: options.expireTime,
          //host: options.host,
          minimumTtl: options.minumumTtl,
          refreshTime: options.refreshTime,
          retryTime: options.retryTime
        };
      } else {
        var soaRecord = ((recordSet.soaRecord.email === options.email) && (recordSet.soaRecord.expireTime === parseInt(options.expireTime)) && (recordSet.soaRecord.host === options.host) &&
        (recordSet.soaRecord.minimumTtl === parseInt(options.minimumTtl)) && (recordSet.soaRecord.refreshTime === parseInt(options.refreshTime)) && (recordSet.soaRecord.retryTime === parseInt(options.retryTime)));
        if (!soaRecord) {
          self.output.warn($('Record SOA not found in the record set with parameters specified.'));
        } else {
          delete recordSet.soaRecord;
        }
      }
    }

    // SRV record
    if (options.priority || options.weight || options.port || options.target) {
      if (options.type !== constants.dnsZone.SRV) {
        self.output.info(util.format($('--priority,--weight,--port,--target will be ignored for record of type "%s"'), options.type));
      } else {
        options.target = utils.trimTrailingChar(options.target, '.');
        options.priority = parseInt(options.priority);
        options.weight = parseInt(options.weight);
        options.port = parseInt(options.port);
        if (isAdding) {
          recordSet.srvRecords.push({
            priority: options.priority,
            weight: options.weight,
            port: options.port,
            target: options.target
          });
        } else {
          recordIndex = utils.indexOfCaseIgnore(recordSet.srvRecords, {
            priority: options.priority,
            weight: options.weight,
            port: options.port,
            target: options.target
          });
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with priority="%s",weight="%s",port="%s",target="%s" not found in the record set "%s"'),
              options.type, options.priority, options.weight, options.port, options.target, recordSet.name));
          }
          recordSet.srvRecords.splice(recordIndex, 1);
          recordCount = recordSet.srvRecords.length;
        }
      }
    }

    // TXT record
    if (options.text) {
      if (options.type !== constants.dnsZone.TXT) {
        self.output.info(util.format($('--text will be ignored for record of type "%s"'), options.type));
      } else {
        var textArray = recordSetUtils.splitTxtRecord(options.text);
        if (isAdding) {
          recordSet.txtRecords.push({value: textArray});
        } else {
          for (var record in recordSet.txtRecords) {
            recordSet.txtRecords[record].txtConcatenatedRecords = recordSet.txtRecords[record].value.join('');
          }
          recordIndex = utils.indexOfCaseIgnore(recordSet.txtRecords, {txtConcatenatedRecords: options.text});
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with value "%s" not found in the record set "%s"'), options.type, options.text, recordSet.name));
          }
          recordSet.txtRecords.splice(recordIndex, 1);
          recordCount = recordSet.txtRecords.length;
        }
      }
    }

    // PTR record
    if (options.ptrdname) {
      if (options.type !== constants.dnsZone.PTR) {
        self.output.info(util.format($('--ptrd-name will be ignored for record of type "%s"'), options.type));
      } else {
        if (isAdding) {
          options.ptrdname = utils.trimTrailingChar(options.ptrdname, '.');
          recordSet.ptrRecords.push({ptrdname: options.ptrdname});
        } else {
          recordIndex = utils.indexOfCaseIgnore(recordSet.ptrRecords, {ptrdname: options.ptrdname});
          if (recordIndex === -1) {
            throw new Error(util.format($('Record of type "%s" with pointer domain name "%s" not found in the record set "%s"'), options.type, options.ptrdname, recordSet.name));
          }
          recordSet.ptrRecords.splice(recordIndex, 1);
          recordCount = recordSet.ptrRecords.length;
        }
      }
    }
    return recordCount;
  },

  _showZone: function (zone, resourceGroupName, zoneName) {
    var self = this;
    var indent = 4;
    self.interaction.formatOutput(zone, function (zone) {
      if (zone === null) {
        self.output.warn(util.format($('A dns zone with name "%s" not found in the resource group "%s"'), zoneName, resourceGroupName));
        return;
      }

      self.output.nameValue($('Id'), zone.id);
      self.output.nameValue($('Name'), zone.name);
      self.output.nameValue($('Type'), zone.type);
      self.output.nameValue($('Location'), zone.location);
      self.output.nameValue($('Number of record sets'), zone.numberOfRecordSets);
      self.output.nameValue($('Max number of record sets'), zone.maxNumberOfRecordSets);
      if (zone.nameServers.length > 0) {
        self.output.header($('Name servers'));
        self.output.list(zone.nameServers, indent);
      }
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(zone.tags) || '');
    });
  },

  _showRecordSet: function (recordSet) {
    var self = this;
    self.interaction.formatOutput(recordSet, function (recordSet) {
      self.output.nameValue($('Id'), recordSet.id);
      self.output.nameValue($('Name'), recordSet.name);
      self.output.nameValue($('Type'), recordSet.type);
      self.output.nameValue($('TTL'), recordSet.tTL);
      self.output.nameValue($('Metadata'), tagUtils.getTagsInfo(recordSet.metadata) || '');
      if (!__.isEmpty(recordSet.aRecords)) {
        self.output.header($('A records'));
        for (var aRecordNum in recordSet.aRecords) {
          var aRecord = recordSet.aRecords[aRecordNum];
          self.output.nameValue($('IPv4 address'), aRecord.ipv4Address, 4);
        }
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.aaaaRecords)) {
        self.output.header($('AAAA records'));
        for (var aaaaRecordNum in recordSet.aaaaRecords) {
          var aaaaRecord = recordSet.aaaaRecords[aaaaRecordNum];
          self.output.nameValue($('IPv6 address'), aaaaRecord.ipv6Address, 4);
        }
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.cnameRecord)) {
        self.output.header($('CNAME record'));
        self.output.nameValue($('CNAME'), recordSet.cnameRecord.cname, 2);
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.mxRecords)) {
        self.output.header($('MX records'));
        for (var mxRecordNum in recordSet.mxRecords) {
          var mxRecord = recordSet.mxRecords[mxRecordNum];
          self.output.nameValue($('Preference'), mxRecord.preference, 4);
          self.output.nameValue($('Mail exchange'), mxRecord.exchange, 4);
        }
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.nsRecords)) {
        self.output.data($('NS records'));
        for (var nsRecordNum in recordSet.nsRecords) {
          var nsRecord = recordSet.nsRecords[nsRecordNum];
          self.output.nameValue($('Name server domain name'), nsRecord.nsdname, 4);
        }
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.srvRecords)) {
        self.output.header($('SRV records'));
        for (var srvRecordNum in recordSet.srvRecords) {
          var srvRecord = recordSet.srvRecords[srvRecordNum];
          self.output.nameValue($('Priority'), srvRecord.priority, 4);
          self.output.nameValue($('Weight'), srvRecord.weight, 4);
          self.output.nameValue($('Port'), srvRecord.port, 4);
          self.output.nameValue($('Target'), srvRecord.target, 4);
        }
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.txtRecords)) {
        self.output.header($('TXT records'));
        for (var txtRecordNum in recordSet.txtRecords) {
          var txtRecord = recordSet.txtRecords[txtRecordNum];
          var recordValue = txtRecord.value.join('');
          recordValue = recordSetUtils.displaySpecialCharacters(recordValue);
          self.output.nameValue($('Text'), util.format($('\"%s\"'), recordValue), 4);
        }
        self.output.data($(''), '');
      }
      if (!__.isEmpty(recordSet.soaRecord)) {
        var soaRecord = recordSet.soaRecord;
        self.output.header($('SOA record'));
        self.output.nameValue($('Email'), soaRecord.email, 2);
        self.output.nameValue($('Expire time'), soaRecord.expireTime, 2);
        self.output.nameValue($('Host'), soaRecord.host, 2);
        self.output.nameValue($('Serial number'), soaRecord.serialNumber, 2);
        self.output.nameValue($('Minimum TTL'), soaRecord.minimumTtl, 2);
        self.output.nameValue($('Refresh time'), soaRecord.refreshTime, 2);
        self.output.nameValue($('Retry time'), soaRecord.retryTime, 2);
        self.output.nameValue($(''), '');
      }
      if (!__.isEmpty(recordSet.ptrRecords)) {
        self.output.header($('PTR records'));
        for (var ptrRecordNum in recordSet.ptrRecords) {
          var ptrRecord = recordSet.ptrRecords[ptrRecordNum];
          self.output.nameValue($('PTR domain name'), ptrRecord.ptrdname, 4);
          self.output.data($(''), '');
        }
      }
    });
  },

  _validateType: function (type) {
    return utils.verifyParamExistsInCollection(constants.dnsZone.restrictedRecordTypes, type, '--type');
  }
});

module.exports = DnsZone;