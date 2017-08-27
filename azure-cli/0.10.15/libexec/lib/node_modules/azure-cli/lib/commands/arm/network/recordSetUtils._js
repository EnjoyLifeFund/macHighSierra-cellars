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
var util = require('util');
var utils = require('../../../util/utils');
var resourceUtils = require('../resource/resourceUtils');

exports.covertToAzureFormat = function (recordSet) {
  var parameters = {
    name: recordSet.name,
    tTL: recordSet.ttl || constants.dnsZone.defTtl
  };
  switch (recordSet.type) {
    case constants.dnsZone.SOA :
      parameters.soaRecord = recordSet.records[0];

      // 'Host' is determined by Azure DNS.
      delete parameters.soaRecord.host;
      break;
    case constants.dnsZone.NS :
      parameters.nsRecords = recordSet.records;

      // Only TTL can be updated for NS record set with name '@'.
      if (parameters.name === '@') delete parameters.nsRecords;
      break;
    case constants.dnsZone.A :
      parameters.aRecords = recordSet.records;
      break;
    case constants.dnsZone.AAAA :
      parameters.aaaaRecords = recordSet.records;
      break;
    case constants.dnsZone.CNAME:
      parameters.cnameRecord = recordSet.records[0];
      break;
    case constants.dnsZone.MX :
      parameters.mxRecords = recordSet.records;
      break;
    case constants.dnsZone.PTR :
      parameters.ptrRecords = recordSet.records;
      break;
    case constants.dnsZone.SRV :
      parameters.srvRecords = recordSet.records;
      break;
    case constants.dnsZone.TXT :
      parameters.txtRecords = recordSet.records;
      break;
  }
  return parameters;
};

exports.getShortType = function (id) {
  var resourceInfo = resourceUtils.getResourceInformation(id);
  return resourceInfo.resourceType.split('/')[2];
};

exports.convertToListFormat = function (recordSets) {
  var printable = [];

  for (var i = 0; i < recordSets.length; i++) {
    var recordSet = recordSets[i];
    var items = [];
    var item;
    if (!__.isEmpty(recordSet.soaRecord)) {
      var soaRecord = recordSet.soaRecord;
      items.push({
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        email: soaRecord.email,
        serialNumber: soaRecord.serialNumber,
        refreshTime: soaRecord.refreshTime,
        retryTime: soaRecord.retryTime,
        expireTime: soaRecord.expireTime,
        minimumTtl: soaRecord.minimumTtl,
        host: soaRecord.host,
        metadata: recordSet.metadata
      });
    }
    if (!__.isEmpty(recordSet.cnameRecord)) {
      var cnameRecord = recordSet.cnameRecord;
      items.push({
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        record: cnameRecord.cname
      });
    }
    if (!__.isEmpty(recordSet.aRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      __.each(recordSet.aRecords, function (rec) {
        item.records.push(rec.ipv4Address);
      });
      items.push(item);
    }
    if (!__.isEmpty(recordSet.aaaaRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      __.each(recordSet.aaaaRecords, function (rec) {
        item.records.push(rec.ipv6Address);
      });
      items.push(item);
    }
    if (!__.isEmpty(recordSet.nsRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      __.each(recordSet.nsRecords, function (rec) {
        item.records.push(rec.nsdname);
      });
      items.push(item);
    }
    if (!__.isEmpty(recordSet.srvRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      __.each(recordSet.srvRecords, function (rec) {
        item.records.push(util.format('%s %s %s %s', rec.priority, rec.weight, rec.port, rec.target));
      });
      items.push(item);
    }
    if (!__.isEmpty(recordSet.mxRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      __.each(recordSet.mxRecords, function (rec) {
        item.records.push(util.format('%s %s', rec.preference, rec.exchange));
      });
      items.push(item);
    }
    if (!__.isEmpty(recordSet.ptrRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      __.each(recordSet.ptrRecords, function (rec) {
        item.records.push(rec.ptrdname);
      });
      items.push(item);
    }
    if (!__.isEmpty(recordSet.txtRecords)) {
      item = {
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        records: []
      };
      var maxLength = 20;
      __.each(recordSet.txtRecords, function (rec) {
        item.records.push(rec.value.length > maxLength ? rec.value.substr(0, maxLength) + '...' : rec.value);
      });
      items.push(item);
    }

    // Record set is empty.
    if (items.length === 0) {
      items.push({
        name: recordSet.name,
        ttl: recordSet.tTL,
        type: exports.getShortType(recordSet.id),
        metadata: recordSet.metadata,
        record: ''
      });
    }

    printable = printable.concat(items);
  }

  return printable;
};

exports.getPropertyName = function (setType) {
  var map = {
    SOA: 'soaRecord',
    A: 'aRecords',
    AAAA: 'aaaaRecords',
    NS: 'nsRecords',
    MX: 'mxRecords',
    CNAME: 'cnameRecord',
    TXT: 'txtRecords',
    SRV: 'srvRecords',
    PTR: 'ptrRecords'
  };
  return map[setType];
};

exports.splitTxtRecord = function(text) {
  var encoded = text.replace(/\\"/g, '&quot;').replace(/\\/g, '');
  var reg = /"[^"]*"/g;
  var checkOnInvalidInput = encoded.replace(reg, '');
  if (checkOnInvalidInput.length === encoded.length){
    return sliceTXTValue(encoded.trim());
  }

  if (checkOnInvalidInput.trim().length > 0){
    return '';
  }

  var matches = [];
  encoded.match(reg).forEach(function(item){
    matches.push(
      item.replace(/"/g,'')
        .replace(/&quot;/g, '"')
    );
  });
  return sliceTXTValue(matches);
};

exports.displaySpecialCharacters = function(line) {
  line = line.replace(/\\/g, '\\\\');
  return line.replace(/"/g, '\\\"');
};

/**
 * This method is used as workaround to delete extra xxxRecords from recordSet
 */
exports.removeEmptyRecords = function (recordSet) {
  if (!recordSet.properties) return;

  var fields = ['aRecords', 'aaaaRecords', 'nsRecords', 'MXRecords', 'srvRecords', 'txtRecords', 'soaRecord', 'ptrRecords'];

  for (var i = 0; i < fields.length; i++) {
    var propName = fields[i];
    if (__.isEmpty(recordSet[propName])) {
      var type = propName.replace('Records', '');
      if (!utils.ignoreCaseEquals(type, exports.getShortType(recordSet.id))) {
        delete recordSet.properties[propName];
      }
    }
  }
};

exports.merge = function (rs1, rs2, type, options, output) {
  var self = this;
  if (options.debug) {
    console.log('\nExisting Record Set:  %j \n', rs2);
    console.log('\nNew Record Set:  %j \n', rs1);
  }

  switch (type) {
    case constants.dnsZone.SOA :
      mergeSOA(rs1, rs2);
      break;
    case constants.dnsZone.NS :
      mergeNS(rs1, rs2);
      break;
    case constants.dnsZone.CNAME :
      mergeCNAME(rs1, rs2, output);
      break;
    case constants.dnsZone.A :
      mergeA(rs1, rs2);
      break;
    case constants.dnsZone.AAAA :
      mergeAAAA(rs1, rs2);
      break;
    case constants.dnsZone.MX :
      mergeMX(rs1, rs2);
      break;
    case constants.dnsZone.TXT :
      mergeTXT(rs1, rs2);
      break;
    case constants.dnsZone.SRV :
      mergeSRV(rs1, rs2);
      break;
    case constants.dnsZone.PTR :
      mergePTR(rs1, rs2);
      break;
  }

  // To override existing set after merge.
  rs2.ifNoneMatch = undefined;
  self.removeEmptyRecords(rs2.recordSet);

  if (options.debug) {
    console.log('\nAfter merge:  %j \n', rs2);
  }
  return rs2;
};

function mergeSOA(rs1, rs2) {
  var host = rs2.soaRecord.host;
  rs2.soaRecord = rs1.soaRecord;
  rs2.soaRecord.host = host;
  rs2.ttl = rs1.ttl;
}

function mergeNS(rs1, rs2) {
  if (rs2.recordSet.name === '@') {
    rs2.ttl = rs1.ttl;
  } else {
    var nsRecords = rs1.nsRecords;
    for (var i = 0; i < nsRecords.length; i++) {
      if (!utils.findFirstCaseIgnore(rs2.nsRecords, {nsdname: nsRecords[i].nsdname})) {
        rs2.nsRecords.push(nsRecords[i]);
      }
    }
  }
}

function mergeCNAME(rs1, rs2, output) {
  output.warn(util.format('Can\'t merge record set "%s" of type CNAME with existing one, skipped', rs2.recordSet.name));
}

function mergeA(rs1, rs2) {
  var aRecords = rs1.aRecords;
  for (var i = 0; i < aRecords.length; i++) {
    if (!utils.findFirstCaseIgnore(rs2.aRecords, {ipv4Address: aRecords[i].ipv4Address})) {
      rs2.aRecords.push(aRecords[i]);
    }
  }
}

function mergeAAAA(rs1, rs2) {
  var aaaaRecords = rs1.aaaaRecords;
  for (var i = 0; i < aaaaRecords.length; i++) {
    if (!utils.findFirstCaseIgnore(rs2.aaaaRecords, {ipv6Address: aaaaRecords[i].ipv6Address})) {
      rs2.aaaaRecords.push(aaaaRecords[i]);
    }
  }
}

function mergeMX(rs1, rs2) {
  var mxRecords = rs1.mxRecords;
  for (var i = 0; i < mxRecords.length; i++) {
    if (!utils.findFirstCaseIgnore(rs2.mxRecords, {exchange: mxRecords[i].exchange})) {
      rs2.mxRecords.push(mxRecords[i]);
    }
  }
}

function mergeTXT(rs1, rs2) {
  var txtRecords = rs1.txtRecords;
  for (var i = 0; i < txtRecords.length; i++) {
    if (!utils.findFirstCaseIgnore(rs2.txtRecords, {value: txtRecords[i].value})) {
      rs2.txtRecords.push(txtRecords[i]);
    }
  }
}

function mergeSRV(rs1, rs2) {
  var srvRecords = rs1.srvRecords;
  for (var i = 0; i < srvRecords.length; i++) {
    if (!utils.findFirstCaseIgnore(rs2.srvRecords, {target: srvRecords[i].target})) {
      rs2.srvRecords.push(srvRecords[i]);
    }
  }
}

function mergePTR(rs1, rs2) {
  var ptrRecords = rs1.ptrRecords;
  for (var i = 0; i < ptrRecords.length; i++) {
    if (!utils.findFirstCaseIgnore(rs2.ptrRecords, {ptrdname: ptrRecords[i].ptrdname})) {
      rs2.ptrRecords.push(ptrRecords[i]);
    }
  }
}

function sliceTXTValue(txt) {
  var maxLength = constants.dnsZone.txtStringMaxLength;
  var iterationCount;
  var txtArray = [];

  if (Array.isArray(txt)){
    for(var i = 0; i < txt.length; i++){
      iterationCount = txt[i].length / maxLength;

      for(var k = 0; k < iterationCount; k++) {
        txtArray.push(txt[i].substr(k * maxLength, maxLength));
      }
    }
    return txtArray;
  }
  else{
    iterationCount = txt.length / maxLength;

    for(var j = 0; j < iterationCount; j++) {
      txtArray.push(txt.substr(j * maxLength, maxLength));
    }
    return txtArray;
  }
}
