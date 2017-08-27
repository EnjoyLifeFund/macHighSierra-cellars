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

// Camel case checks disabled because the identifier key_ops is part of spec and can't be changed.
/*jshint camelcase:false */

var __ = require('underscore');
var util = require('util');
var fs = require('fs');
var forge = require('node-forge');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var kvUtils = require('./kv-utils');

var $ = utils.getLocaleString;

var KEY_DEST_TYPE_MAP = {
  'Software': 'RSA',
  'HSM': 'RSA-HSM'
};
var KEY_DESTS = Object.keys(KEY_DEST_TYPE_MAP);

var KEY_OPS = ['encrypt', 'decrypt', 'sign', 'verify', 'wrapKey', 'unwrapKey'];

exports.init = function(cli) {
  var log = cli.output;

  var key = cli.category('keyvault').category('key')
    .description($('Commands to manage keys in the Azure Key Vault service'));

  key.command('list [vault-name]')
    .description($('Lists keys of a vault'))
    .usage('[options] <vault-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .execute(function(vaultName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      ////////////////////////////////////////////
      // Create the client and list keys.       //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var keys = [];
      var progress = cli.interaction.progress(util.format($('Loading keys of vault %s'), options.vaultUri));
      try {
        var result = client.getKeys(options.vaultUri, null, _);
        if (result) {
          keys = result;

          while (result && result.nextLink) {
            log.verbose(util.format($('Found %d keys, loading more'), keys.length));
            result = client.getKeysNext(result.nextLink, _);
            if (result) {
              keys = keys.concat(result);
            }
          }
        }
      } finally {
        progress.end();
      }

      log.table(keys, showKeyRow);
      log.info(util.format($('Found %d keys'), keys.length));
    });

  key.command('list-versions [vault-name] [key-name]')
    .description($('Lists key versions'))
    .usage('[options] <vault-name> [key-name>]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('lists only versions of this key'))
    .execute(function(vaultName, keyName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        keyName: keyName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.keyName = options.keyName || keyName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      ////////////////////////////////////////////
      // Create the client and list keys.       //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var keys, keyIdentifier, keyVersions;
      var progress;
      if (!options.keyName) {
        keys = [];
        progress = cli.interaction.progress(util.format($('Loading keys of vault %s'), options.vaultUri));
        try {
          var result = client.getKeys(options.vaultUri, null, _);
          if (result && result.length) {
            for (var i = 0; i < result.length; ++i) {
              keyIdentifier = kvUtils.parseKeyIdentifier(result[i].kid);
              keyVersions = getKeyVersions(client, keyIdentifier.vaultUri, keyIdentifier.name, _);
              keys = keys.concat(keyVersions);
            }

            while (result && result.nextLink) {
              log.verbose(util.format($('Found %d keys, loading more'), keys.length));
              result = client.getKeysNext(result.nextLink, _);
              if (result && result.length) {
                for (var j = 0; j < result.length; ++j) {
                  keyIdentifier = kvUtils.parseKeyIdentifier(result[j].kid);
                  keyVersions = getKeyVersions(client, keyIdentifier.vaultUri, keyIdentifier.name, _);
                  keys = keys.concat(keyVersions);
                }
              }
            }
          }
        } finally {
          progress.end();
        }
      } else {
        progress = cli.interaction.progress(util.format($('Loading keys of vault %s'), options.vaultUri));
        try {
          keys = getKeyVersions(client, options.vaultUri, options.keyName, _);
        } finally {
          progress.end();
        }
      }

      log.table(keys, showKeyRow);
      log.info(util.format($('Found %d keys'), keys.length));
    });

  key.command('create [vault-name] [key-name]')
    .description($('Creates a key in the vault'))
    .usage('[options] <vault-name> <key-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('name of the key to be created; if already exists, a new key version is generated'))
    .option('-d, --destination <destination>', util.format($('tells if the key is software-protected or HSM-protected; valid values: [%s]'), KEY_DESTS.join(', ')))
    .option('--enabled <boolean>', $('tells if the key should be enabled; valid values: [false, true]; default is true'))
    .option('-e, --expires <datetime>', $('key expiration time, expressed in RFC-1123/ISO8601 date format'))
    .option('-n, --not-before <datetime>', $('time before which key cannot be used, expressed in RFC-1123/ISO8601 date format'))
    .option('-o, --key-ops <key-ops>', util.format($('JSON-encoded array of strings representing key operations; each string can be one of [%s]'), KEY_OPS.join(', ')))
    .option('-t, --tags <tags>', $('Tags to set on the key. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .execute(function(vaultName, keyName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      var keyVersion; // must be undefined on this command.
      parseKeyPropertiesArguments(vaultName, keyName, keyVersion, options, true);
      options.kty = options.hsm ? 'RSA-HSM' : 'RSA';

      /////////////////////////////////////////////////
      // Perform the request.                        //
      /////////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var requestOptions = {
        keyOps: options.keyOps,
        keyAttributes: {
          enabled: options.enabled,
          notBefore: options.notBefore,
          expires: options.expires
        },
        tags: options.tags
      };

      log.verbose('request options: ' + JSON.stringify(requestOptions));

      var key;
      var keyIdentifier = getKeyIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Creating key %s'), keyIdentifier));
      try {
        key = client.createKey(options.vaultUri, options.keyName, options.kty, requestOptions, _);
      } finally {
        progress.end();
      }

      showKey(key);
    });

  key.command('import [vault-name] [key-name]')
    .description($('Imports an existing key into a vault'))
    .usage('[options] <vault-name> <key-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('name of the key to be imported; if already exists, a new key version is generated'))
    .option('--pem-file <file-name>', $('name of a PEM file containing the key to be imported; the file must not be password protected'))
    .option('--byok-file <file-name>', $('name of a BYOK file containing the key to be imported'))
    .option('-p, --password <password>', $('password of key file; if not informed and the file is encrypted, will prompt'))
    .option('-d, --destination <destination>', util.format($('tells if the key is software-protected or HSM-protected; valid values: [%s]'), KEY_DESTS.join(', ')))
    .option('--enabled <boolean>', $('tells if the key should be enabled; valid values: [false, true]; default is true'))
    .option('-e, --expires <datetime>', $('key expiration time, expressed in RFC-1123/ISO8601 date format'))
    .option('-n, --not-before <datetime>', $('time before which key cannot be used, expressed in RFC-1123/ISO8601 date format'))
    .option('-o, --key-ops <key-ops>', util.format($('JSON-encoded array of strings representing key operations; each string can be one of [%s]'), KEY_OPS.join(', ')))
    .option('-t, --tags <tags>', $('Tags to set on the key. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .execute(function(vaultName, keyName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      var keyVersion; // must be undefined on this command.
      parseKeyPropertiesArguments(vaultName, keyName, keyVersion, options, options.pemFile);

      var v = 0;
      if (options.pemFile) v++;
      if (options.byokFile) v++;

      if (v != 1) {
        v = ['zero', 'one', 'two'][v];
        log.error(util.format($('Expecting exactly one of the following, but %s were informed:'), v));
        log.error($('    --pem-file <file-name>'));
        log.error($('    --byok-file <file-name>'));
        throw new Error($('Could not establish key to import from command arguments'));
      }

      if (options.byokFile && options.destination && !options.hsm) {
        throw new Error(util.format($('Value of parameter --destination (%s) is incompatible with input key type (BYOK).'), options.destination));
      }

      /////////////////////////////////////////////////
      // Read the file and build the request.        //
      /////////////////////////////////////////////////

      var requestKey = {
        keyOps: options.keyOps,
      };

      var requestOptions = {
        hsm: options.hsm,
        keyAttributes: {
          enabled: options.enabled,
          notBefore: options.notBefore,
          expires: options.expires
        },
        tags: options.tags
      };

      var data;
      var keyFile;
      if (options.pemFile) {

        requestKey.kty = 'RSA';
        log.verbose('reading ' + options.pemFile);
        data = fs.readFileSync(options.pemFile);
        var keyInfo;
        var encrypted = isPemEncrypted(data);
        if (encrypted) {
          var pwdMsg = util.format($('Password for %s: '), options.pemFile);
          var password = cli.interaction.promptPasswordOnceIfNotGiven(pwdMsg, options.password, _);
          keyInfo = forge.pki.decryptRsaPrivateKey(data, password);
        } else {
          keyInfo = forge.pki.privateKeyFromPem(data);
          if (options.password) {
            log.warn(util.format($('File %s is not password protected, the --password flag is extraneous and was ignored'), options.pemFile));
          }
        }

        log.verbose('setting RSA parameters from PEM data');
        setRsaParameters(requestKey, keyInfo);
        keyFile = options.pemFile;

      } else {

        requestKey.kty = 'RSA-HSM';
        log.verbose('reading ' + options.byokFile);
        log.verbose('setting BYOK parameters from file');
        requestKey.t = fs.readFileSync(options.byokFile);
        keyFile = options.byokFile;

        if (options.password) {
          log.warn($('The --password flag is extraneous and was ignored'));
        }

      }

      /////////////////////////////////////////////////
      // Send the request.                           //
      /////////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      log.verbose('request options: ' + JSON.stringify(requestOptions, null, ' '));

      var key;
      var progress = cli.interaction.progress(util.format($('Importing file %s into key %s'), keyFile, options.keyName));
      try {
        key = client.importKey(options.vaultUri, options.keyName, requestKey, requestOptions, _);
      } finally {
        progress.end();
      }

      showKey(key);
    });

  key.command('set-attributes [vault-name] [key-name] [key-version]')
    .description($('Changes attributes of an existing key'))
    .usage('[options] <vault-name> <key-name> [key-version]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('name of the key to be modified'))
    .option('-r, --key-version <key-version>', $('the version to be modified; if omited, modifies only the most recent'))
    .option('--enabled <boolean>', $('if informed, command will change the enabled state; valid values: [false, true]'))
    .option('-e, --expires <datetime>', $('if informed, command will change secret expiration time; expressed in RFC-1123/ISO8601 date format, or null to clear the value'))
    .option('-n, --not-before <datetime>', $('if informed, command will change time before which secret cannot be used; expressed in RFC-1123/ISO8601 date format, or null to clear the value'))
    .option('-o, --key-ops <key-ops>', util.format($('if informed, command will change valid operations; must be JSON-encoded array of strings representing key operations; each string can be one of [%s]'), KEY_OPS.join(', ')))
    .option('-t, --tags <tags>', $('Tags to set on the key. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--reset-tags', $('remove previously existing tags; can combined with --tags'))
    .execute(function(vaultName, keyName, keyVersion, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      // Detect informed parameters.
      var informed = {
        enabled: options.enabled || false,
        expires: options.expires || false,
        notBefore: options.notBefore || false,
        keyOps: options.keyOps || false,
        tags: options.tags || false,
        resetTags: options.resetTags || false
      };

      parseKeyPropertiesArguments(vaultName, keyName, keyVersion, options, false);

      //////////////////////////////////////////////////////
      // Deal with tags. Load existing vault, if needed.  //
      //////////////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var key;
      var keyIdentifier = getKeyIdentifier(options);

      if (informed.tags) {

        // Some tags were informed.

        if (!informed.resetTags) {

          // We must read existing tags and add the new ones.
          log.info(util.format($('Getting key %s'), keyIdentifier));
          key = client.getKey(keyIdentifier, _);
          var currentTags = key.tags;
          if (!currentTags) {
            // Defend against undefined.
            currentTags = {};
          }
          options.tags = kvUtils.mergeTags(currentTags, options.tags);

        }

      } else {

        // No tags informed.

        if (informed.resetTags) {

          // Clear all tags ignoring existing one.
          informed.tags = true;
          options.tags = {};

        }

      }

      ////////////////////////////////////////////////////////////
      // Build the request based on informed parameters.        //
      ////////////////////////////////////////////////////////////

      var request = {
        keyAttributes: {}
      };

      if (informed.keyOps) request.keyOps = options.keyOps;
      if (informed.enabled) request.keyAttributes.enabled = options.enabled;
      if (informed.notBefore) request.keyAttributes.notBefore = options.notBefore;
      if (informed.expires) request.keyAttributes.expires = options.expires;
      if (informed.tags) request.tags = options.tags;

      /////////////////////////////////////////////////
      // Send the request.                           //
      /////////////////////////////////////////////////

      log.verbose('request: ' + JSON.stringify(request, null, ' '));

      var progress = cli.interaction.progress(util.format($('Updating key %s'), keyIdentifier));
      try {
        key = client.updateKey(keyIdentifier, request, _);
      } finally {
        progress.end();
      }

      showKey(key);
    });

  key.command('show [vault-name] [key-name] [key-version]')
    .description($('Shows properties of a vault key'))
    .usage('[options] <vault-name> <key-name> [key-version]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('the key name'))
    .option('-r, --key-version <key-version>', $('the key version; if omited, uses the most recent'))
    .execute(function(vaultName, keyName, keyVersion, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        keyName: keyName,
        keyVersion: keyVersion,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.keyName = options.keyName || keyName;
      options.keyVersion = options.keyVersion || keyVersion;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.keyName) {
        return cli.missingArgument('key-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var keyIdentifier = getKeyIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Getting key %s'), keyIdentifier));
      try {
        key = client.getKey(keyIdentifier, _);
      } finally {
        progress.end();
      }

      showKey(key);
    });

  key.command('delete [vault-name] [key-name]')
    .description($('Deletes a key from the vault'))
    .usage('[options] <vault-name> <key-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('the key name'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function(vaultName, keyName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        keyName: keyName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.keyName = options.keyName || keyName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.keyName) {
        return cli.missingArgument('key-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete key %s from vault %s? [y/n] '), options.keyName, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var key;
      var keyIdentifier = getKeyIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Deleting key %s'), keyIdentifier));
      try {
        key = client.deleteKey(options.vaultUri, options.keyName, _);
      } finally {
        progress.end();
      }

      showKey(key);
    });

  key.command('backup [vault-name] [key-name] [output-file]')
    .description($('Generates a protected backup of a vault key'))
    .usage('[options] <vault-name> <key-name> <output-file>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-k, --key-name <key-name>', $('the key name'))
    .option('-f, --output-file <output-file>', $('name of the binary file that will contain backup data'))
    .execute(function(vaultName, keyName, outputFile, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        keyName: keyName,
        outputFile: outputFile,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.keyName = options.keyName || keyName;
      options.outputFile = options.outputFile || outputFile;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.keyName) {
        return cli.missingArgument('key-name');
      }

      if (!options.outputFile) {
        return cli.missingArgument('output-file');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var blob;
      var keyIdentifier = getKeyIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Requesting a backup blob for key %s'), keyIdentifier));
      try {
        blob = client.backupKey(options.vaultUri, options.keyName, _);
        //console.log(JSON.stringify(blob));
      } finally {
        progress.end();
      }

      log.info(util.format($('Writing file %s'), options.outputFile));
      fs.writeFileSync(options.outputFile, blob.value);
    });

  key.command('restore [vault-name] [input-file]')
    .description($('Restores a backed up key to a vault'))
    .usage('[options] <vault-name> <input-file>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-f, --input-file <input-file>', $('name of the binary file that contains backup data'))
    .execute(function(vaultName, inputFile, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        inputFile: inputFile,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.inputFile = options.inputFile || inputFile;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.inputFile) {
        return cli.missingArgument('input-file');
      }

      ///////////////////////////////////////
      // Read file and send the request.   //
      ///////////////////////////////////////

      log.info(util.format($('Reading file %s'), options.inputFile));
      var buffer = fs.readFileSync(options.inputFile);

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var key;
      var progress = cli.interaction.progress(util.format($('Restoring key into vault %s'), options.vaultUri));
      try {
        key = client.restoreKey(options.vaultUri, buffer, _);
      } finally {
        progress.end();
      }

      showKey(key);

    });

  function createVaultUri(options) {
    var subscription = profile.current.getSubscription(options.subscription);
    return 'https://' + options.vaultName + subscription.keyVaultDnsSuffix;
  }

  function createClient(options) {
    var subscription = profile.current.getSubscription(options.subscription);
    log.verbose(util.format($('Using subscription %s (%s)'), subscription.name, subscription.id));
    return utils.createKeyVaultClient(subscription);
  }
  
  function isPemEncrypted(pem) {
    var msg = forge.pem.decode(pem)[0];
    if (!msg || (msg.type !== 'ENCRYPTED PRIVATE KEY' && msg.type !== 'PRIVATE KEY' && msg.type !== 'RSA PRIVATE KEY')) {      
      return false;
    }
    return (msg.procType && msg.procType.type === 'ENCRYPTED');
  }

  function getKeyIdentifier(options) {
    var kid = options.vaultUri + '/keys/' + options.keyName;
    if (options.keyVersion) {
      kid += '/' + options.keyVersion;
    }
    return kid;
  }

  function parseKeyPropertiesArguments(vaultName, keyName, keyVersion, options, requireDestination) {

    log.verbose('arguments: ' + JSON.stringify({
      vaultName: vaultName,
      keyName: keyName,
      keyVersion: keyVersion,
      options: options
    }));

    options.vaultName = options.vaultName || vaultName;
    options.keyName = options.keyName || keyName;
    options.keyVersion = options.keyVersion || keyVersion;

    if (!options.vaultName) {
      return cli.missingArgument('vault-name');
    }

    if (!options.keyName) {
      return cli.missingArgument('key-name');
    }

    if (requireDestination && !options.destination) {
      return cli.missingArgument('destination');
    }

    if (options.destination) {
      var kty;
      __.each(KEY_DEST_TYPE_MAP, function(value, key) {
        if (utils.ignoreCaseEquals(key, options.destination)) {
          kty = value;
        }
      });

      if (!kty) {
        throw new Error(util.format($('Invalid value for destination argument. Accepted values are: %s'), KEY_DESTS.join(', ')));
      }

      options.hsm = (kty === 'RSA-HSM');
    } else {
      options.hsm = false;
    }

    options.keyOps = kvUtils.parseArrayArgument('key-ops', options.keyOps, KEY_OPS, []);
    options.enabled = kvUtils.parseBooleanArgument('enabled', options.enabled, true);
    options.tags = kvUtils.parseTagsArgument('tags', options.tags);

  }

  function getKeyVersions(client, vaultUri, keyName, _) {

    log.verbose(util.format($('Loading versions of key %s'), keyName));

    var keys = [];
    var result = client.getKeyVersions(vaultUri, keyName, null, _);
    if (result) {
      keys = result;

      while (result && result.nextLink) {
        log.verbose(util.format($('Found %d versions, loading more'), keys.length));
        result = client.getKeyVersionsNext(result.nextLink, _);
        if (result) {
          keys = keys.concat(result);
        }
      }
    }
    return keys;
  }

  function showKey(key) {
    key.key.n = kvUtils.bufferToBase64Url(key.key.n);
    key.key.e = kvUtils.bufferToBase64Url(key.key.e);

    cli.interaction.formatOutput(key, function(key) {
      key.attributes = kvUtils.getAttributesWithPrettyDates(key.attributes);
      utils.logLineFormat(key, log.data);
    });
  }

  function showKeyRow(row, item) {
    var identifier = kvUtils.parseKeyIdentifier(item.kid);
    // The vault is the same, so we don't show.
    // row.cell($('Vault'), identifier.vaultUri);
    row.cell($('Name'), identifier.name);
    if (identifier.version) {
      row.cell($('Version'), identifier.version);
    }
    row.cell($('Enabled'), item.attributes.enabled);
    var attributes = kvUtils.getAttributesWithPrettyDates(item.attributes);
    row.cell($('Not Before'), attributes.notBefore || '');
    row.cell($('Expires'), attributes.expires || '');
    row.cell($('Created'), attributes.created);
    row.cell($('Updated'), attributes.updated);
  }

  function setRsaParameters(dest, key) {
    dest.n = bigIntegerToBuffer(key.n);
    dest.e = bigIntegerToBuffer(key.e);
    dest.d = bigIntegerToBuffer(key.d);
    dest.p = bigIntegerToBuffer(key.p);
    dest.q = bigIntegerToBuffer(key.q);
    dest.dp = bigIntegerToBuffer(key.dP);
    dest.dq = bigIntegerToBuffer(key.dQ);
    dest.qi = bigIntegerToBuffer(key.qInv);
  }

  function bigIntegerToBuffer(n) {
    // Convert to binary and remove leading zeroes.
    var data = n.toByteArray();
    var leadingZeroes = 0;
    while (leadingZeroes < data.length && data[leadingZeroes] === 0) {
      ++leadingZeroes;
    }
    if (leadingZeroes) {
      data = data.slice(leadingZeroes);
    }

    return new Buffer(data);
  }
};