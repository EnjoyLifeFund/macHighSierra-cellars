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

// Camel case checks disabled because the identifier secret_ops is part of spec and can't be changed.
/*jshint camelcase:false */

var util = require('util');
var fs = require('fs');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var kvUtils = require('./kv-utils');

var $ = utils.getLocaleString;

// Taken from https://nodejs.org/api/buffer.html. Must not contain binary encodings like base64, hex and binary.
var TEXT_FILE_ENCODINGS = ['utf8', 'utf16le', 'ucs2', 'ascii'];
var BINARY_FILE_ENCODINGS = ['base64', 'hex'];

exports.init = function(cli) {
  var log = cli.output;

  var secret = cli.category('keyvault').category('secret')
    .description($('Commands to manage secrets in the Azure Key Vault service'));

  secret.command('list [vault-name]')
    .description($('Lists secrets of a vault'))
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
      // Create the client and list secrets.       //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var secrets = [];
      var progress = cli.interaction.progress(util.format($('Loading secrets of vault %s'), options.vaultUri));
      try {
        var result = client.getSecrets(options.vaultUri, null, _);
        if (result) {
          secrets = result;

          while (result && result.nextLink) {
            log.verbose(util.format($('Found %d secrets, loading more'), secrets.length));
            result = client.getSecretsNext(result.nextLink, _);
            if (result) {
              secrets = secrets.concat(result);
            }
          }
        }
      } finally {
        progress.end();
      }

      log.table(secrets, showSecretRow);

      log.info(util.format($('Found %d secrets'), secrets.length));
    });

  secret.command('list-versions [vault-name] [secret-name]')
    .description($('Lists secret versions'))
    .usage('[options] <vault-name> [secret-name]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-s, --secret-name <secret-name>', $('lists only versions of this secret'))
    .execute(function(vaultName, secretName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        secretName: secretName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.secretName = options.secretName || secretName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      ////////////////////////////////////////////
      // Create the client and list secrets.       //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var secrets, secretIdentifier, secretVersions; 
      var progress;
      if (!options.secretName) {
        secrets = [];
        progress = cli.interaction.progress(util.format($('Loading secrets of vault %s'), options.vaultUri));
        try {
          var result = client.getSecrets(options.vaultUri, null, _);
          if (result && result.length) {
            for (var i = 0; i < result.length; ++i) {
              secretIdentifier = kvUtils.parseSecretIdentifier(result[i].id);
              secretVersions = getSecretVersions(client, secretIdentifier.vaultUri, secretIdentifier.name, _);
              secrets = secrets.concat(secretVersions);
            }

            while (result && result.nextLink) {
              log.verbose(util.format($('Found %d secrets, loading more'), secrets.length));
              result = client.getSecretsNext(result.nextLink, _);
              if (result && result.length) {
                for (var j = 0; j < result.length; ++j) {
                  secretIdentifier = kvUtils.parseSecretIdentifier(result[j].id);
                  secretVersions = getSecretVersions(client, secretIdentifier.vaultUri, secretIdentifier.name, _);
                  secrets = secrets.concat(secretVersions);
                }
              }
            }
          }
        } finally {
          progress.end();
        }
      } else {
        progress = cli.interaction.progress(util.format($('Loading secrets of vault %s'), options.vaultUri));
        try {
          secrets = getSecretVersions(client, options.vaultUri, options.secretName, _);
        } finally {
          progress.end();
        }
      }

      log.table(secrets, showSecretRow);

      log.info(util.format($('Found %d secrets'), secrets.length));
    });

  secret.command('set [vault-name] [secret-name] [secret-value]')
    .description($('Stores a secret on the vault'))
    .usage('options <vault-name> <secret-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-s, --secret-name <secret-name>', $('name of the secret to be created; if already exists, a new secret version is created'))
    .option('-w, --value <secret-value>', $('the secret value to be uploaded, expressed as an arbitrary sequence of characters; cannot be used along with --json-value or --file flags'))
    .option('--json-value <JSON-string>', $('the secret value to be uploaded, expressed as a JSON string; cannot be used along with --value or --file flags'))
    .option('--file <file-name>', $('the file that contains the secret value to be uploaded; cannot be used along with the --value or --json-value flag'))
    .option('--file-encoding <encoding>', util.format($('for text files, specifies encoding used on the file; valid values: [%s]; default is %s'), TEXT_FILE_ENCODINGS.join(', '), TEXT_FILE_ENCODINGS[0]))
    .option('--encode-binary <encoding>', util.format($('tells the file is binary and encodes it before uploading; valid values: [%s]'), BINARY_FILE_ENCODINGS.join(', ')))
    .option('-c, --content-type <content-type>', $('the content type'))
    .option('--enabled <boolean>', $('tells if the secret should be enabled; valid values: [false, true]; default is true'))
    .option('-e, --expires <datetime>', $('expiration time of secret, expressed in RFC-1123/ISO8601 date format'))
    .option('-n, --not-before <datetime>', $('time before which secret cannot be used, expressed in RFC-1123/ISO8601 date format'))
    .option('-t, --tags <tags>', $('Tags to set on the secret. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .execute(function(vaultName, secretName, secretValue, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      var secretVersion; // must be undefined on this command.
      parseSecretPropertiesArguments(vaultName, secretName, secretVersion, options);
      parseSecretValue(secretValue, options);

      /////////////////////////////////////////////////
      // Perform the request.                        //
      /////////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var requestOptions = {
        tags: options.tags,
        contentType: options.contentType,
        secretAttributes: {
          enabled: options.enabled,
          notBefore: options.notBefore,
          expires: options.expires
        },
      };

      log.verbose('request options: ' + JSON.stringify(requestOptions));

      var secret;
      var secretIdentifier = getSecretIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Creating secret %s'), secretIdentifier));
      try {
        secret = client.setSecret(options.vaultUri, options.secretName, options.value, requestOptions, _);
      } finally {
        progress.end();
      }

      showSecret(options, secret);

    });

  secret.command('set-attributes [vault-name] [secret-name] [secret-version]')
    .description($('Changes attributes of an existing secret'))
    .usage('[options] <vault-name> <secret-name> [secret-version]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-s, --secret-name <secret-name>', $('name of the secret to be modified'))
    .option('-r, --secret-version <secret-version>', $('the version to be modified; if omited, modifies only the most recent'))
    .option('-c, --content-type <content-type>', $('the content type'))
    .option('--enabled <boolean>', $('if informed, command will change the enabled state; valid values: [false, true]'))
    .option('-e, --expires <datetime>', $('if informed, command will change secret expiration time; expressed in RFC-1123/ISO8601 date format, or null to clear the value'))
    .option('-n, --not-before <datetime>', $('if informed, command will change time before which secret cannot be used; expressed in RFC-1123/ISO8601 date format, or null to clear the value'))
    .option('-t, --tags <tags>', $('Tags to set on the secret. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--reset-tags', $('remove previously existing tags; can combined with --tags'))
    .execute(function(vaultName, secretName, secretVersion, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      // Detect informed parameters.
      var informed = {
        enabled: options.enabled || false,
        expires: options.expires || false,
        notBefore: options.notBefore || false,
        secretOps: options.secretOps || false,
        tags: options.tags || false,
        resetTags: options.resetTags || false
      };

      parseSecretPropertiesArguments(vaultName, secretName, secretVersion, options);

      //////////////////////////////////////////////////////
      // Deal with tags. Load existing vault, if needed.  //
      //////////////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var secret;
      var secretIdentifier = getSecretIdentifier(options);

      if (informed.tags) {

        // Some tags were informed.

        if (!informed.resetTags) {

          // We must read existing tags and add the new ones.
          log.info(util.format($('Getting secret %s'), secretIdentifier));
          secret = client.getSecret(secretIdentifier, _);
          var currentTags = secret.tags;
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

      var requestOptions = {
        secretAttributes: {
        },
      };

      if (informed.secretOps) requestOptions.secretOps = options.secretOps;
      if (informed.enabled) requestOptions.secretAttributes.enabled = options.enabled;
      if (informed.notBefore) requestOptions.secretAttributes.notBefore = options.notBefore;
      if (informed.expires) requestOptions.secretAttributes.expires = options.expires;
      if (informed.tags) requestOptions.tags = options.tags;

      /////////////////////////////////////////////////
      // Send the request.                           //
      /////////////////////////////////////////////////

      log.verbose('request options: ' + JSON.stringify(requestOptions, null, ' '));

      var progress = cli.interaction.progress(util.format($('Updating secret %s'), secretIdentifier));
      try {
        secret = client.updateSecret(secretIdentifier, requestOptions, _);
      } finally {
        progress.end();
      }

      delete secret.value;
      showSecret(options, secret);
    });

  secret.command('show [vault-name] [secret-name] [secret-version]')
    .description($('Shows a vault secret'))
    .usage('[options] <vault-name> <secret-name> [secret-version]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-s, --secret-name <secret-name>', $('the secret name'))
    .option('-r, --secret-version <secret-version>', $('the secret version; if omited, uses the most recent'))
    .execute(function(vaultName, secretName, secretVersion, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      options.vaultName = options.vaultName || vaultName;
      options.secretName = options.secretName || secretName;
      options.secretVersion = options.secretVersion || secretVersion;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.secretName) {
        return cli.missingArgument('secret-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var secretIdentifier = getSecretIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Getting secret %s'), secretIdentifier));
      try {
        secret = client.getSecret(secretIdentifier, _);
      } finally {
        progress.end();
      }

      showSecret(options, secret);
    });

  secret.command('get [vault-name] [secret-name] [secret-version] [file]')
    .description($('Downloads a secret from the vault'))
    .usage('[options] <vault-name> <secret-name> [secret-version] <file>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-s, --secret-name <secret-name>', $('the secret name'))
    .option('-r, --secret-version <secret-version>', $('the secret version; if omited, uses the most recent'))
    .option('--file <file-name>', $('the file to receive secret contents; the file must not exist otherwise the command fails'))
    .option('--file-encoding <encoding>', util.format($('specifies how to encode the secret contents in the file; valid values: [%s]; default is %s'), TEXT_FILE_ENCODINGS.join(', '), TEXT_FILE_ENCODINGS[0]))
    .option('--decode-binary <encoding>', util.format($('tells to write a binary file by decoding secret contents with the informed encoding; valid values: [%s]'), BINARY_FILE_ENCODINGS.join(', ')))
    .execute(function(vaultName, secretName, secretVersion, file, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      options.vaultName = options.vaultName || vaultName;
      options.secretName = options.secretName || secretName;
      options.secretVersion = options.secretVersion || secretVersion;
      options.file = options.file || file;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.secretName) {
        return cli.missingArgument('secret-name');
      }

      if (!options.file) {
        return cli.missingArgument('file');
      }
      
      if (options.fileEncoding && options.decodeBinary) {
        log.error($('The following options cannot be used together:'));
        log.error($('    --file-encoding <encoding>'));
        log.error($('    --decode-binary <encoding>'));
        throw new Error($('Unable to determine file format.'));
      }
      
      if (options.decodeBinary) {
        options.decodeBinary = kvUtils.parseEnumArgument('decode-binary', options.decodeBinary, BINARY_FILE_ENCODINGS);
      } else {
        options.fileEncoding = kvUtils.parseEnumArgument('file-encoding', options.fileEncoding, TEXT_FILE_ENCODINGS, TEXT_FILE_ENCODINGS[0]);
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var secretIdentifier = getSecretIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Getting secret %s'), secretIdentifier));
      try {
        secret = client.getSecret(secretIdentifier, _);
      } finally {
        progress.end();
      }

      log.info(util.format($('Writing secret to %s'), options.file));
      
      if (!options.decodeBinary) {
        
        // Writes the secret value as a text file.
        fs.writeFileSync(options.file, secret.value, { encoding: options.fileEncoding, flag: 'wx' });
        
      } else if (secret.value.length > 0) {

        // Writes the secret value as a binary file.

        var minLength = 0;
        if (options.decodeBinary == 'base64') {
          // -2 to accomodate trailers.
          minLength = Math.floor(secret.value.length / 4) * 3 - 2;
        } else if (options.decodeBinary == 'hex') {
          minLength = Math.ceil(secret.value.length / 2);
        }
        
        var data = Buffer.from(secret.value, options.decodeBinary);
        if (!data || !data.length || data.length < minLength) {
          throw new Error(util.format($('The secret value doesn\'t appear to be %s-encoded. You cannot use --decode-binary %s with this secret value.'), options.decodeBinary, options.decodeBinary));
        }

        fs.writeFileSync(options.file, data, { flag: 'wx' });

      } else {
        
        // Writes a zero-length file.
        fs.writeFileSync(options.file, Buffer.alloc(0));
        
      }

    });

  secret.command('delete [vault-name] [secret-name]')
    .description($('Deletes a secret from the vault'))
    .usage('[options] <vault-name> <secret-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-s, --secret-name <secret-name>', $('the secret name'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function(vaultName, secretName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        secretName: secretName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.secretName = options.secretName || secretName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.secretName) {
        return cli.missingArgument('secret-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete secret %s from vault %s? [y/n] '), options.secretName, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var secret;
      var progress = cli.interaction.progress(util.format($('Deleting secret %s from vault %s'), options.secretName, options.vaultName));
      try {
        secret = client.deleteSecret(options.vaultUri, options.secretName, _);
      } finally {
        progress.end();
      }

      showSecret(options, secret);
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

  function getSecretIdentifier(options) {
    var id = options.vaultUri + '/secrets/' + options.secretName;
    if (options.secretVersion) {
      id += '/' + options.secretVersion;
    }
    return id;
  }
  
  function parseSecretValue(secretValue, options) {

    var informed = [];
    if (secretValue)        informed.push($('    [secret-value]'));
    if (options.value)      informed.push($('    -w, --value <secret-value>'));
    if (options.jsonValue)  informed.push($('    --json-value <JSON-string>'));
    if (options.file)       informed.push($('    --file <file-name>'));

    if (informed.length > 1) {
      log.error($('The following flags cannot be used together:'));
      for (var i = 0; i < informed.length; ++i) {
        log.error(informed[i]);
      }
      throw new Error($('Unable to determine the secret value.'));
    }
    
    if (informed.length === 0) {
      log.error($('Please inform at least one of the following:'));
      log.error($('    [secret-value]'));
      log.error($('    -w, --value <secret-value>'));
      log.error($('    --json-value <JSON-string>'));
      log.error($('    --file <file-name>'));
      throw new Error($('Unable to determine the secret value.'));
    }

    if (!options.file && options.fileEncoding) {
      log.error($('Flag --file-encoding can only be used with --file.'));
      throw new Error($('Inconsistent parameters.'));
    }
    
    if (!options.file && options.encodeBinary) {
      log.error($('Flag --encode-binary can only be used with --file.'));
      throw new Error($('Inconsistent parameters.'));
    }

    if (options.fileEncoding && options.encodeBinary) {
      log.error($('The following options cannot be used together:'));
      log.error($('    --file-encoding <encoding>'));
      log.error($('    --encode-binary <encoding>'));
      throw new Error($('Unable to determine file format.'));
    }

    if (secretValue) {
      
      options.value = secretValue;
      
    }
    else if (options.jsonValue) {
      
      options.value = kvUtils.parseJsonStringArgument('json-value', options.jsonValue);
      
    } else if (options.file) {

      if (!options.encodeBinary) {
        
        options.fileEncoding = kvUtils.parseEnumArgument('file-encoding', options.fileEncoding, TEXT_FILE_ENCODINGS, TEXT_FILE_ENCODINGS[0]);
        options.value = fs.readFileSync(options.file, { encoding: options.fileEncoding } );
        
      } else {
        
        options.encodeBinary = kvUtils.parseEnumArgument('encode-binary', options.encodeBinary, BINARY_FILE_ENCODINGS);
        options.value = fs.readFileSync(options.file, { encoding: options.encodeBinary } );

      }

    }

    if (!options.value) {
      throw new Error('Error parsing secret value from options');     
    }

  }

  function parseSecretPropertiesArguments(vaultName, secretName, secretVersion, options) {

    log.verbose('arguments: ' + JSON.stringify({
      vaultName: vaultName,
      secretName: secretName,
      secretVersion: secretVersion,
      options: options
    }));

    options.vaultName = options.vaultName || vaultName;
    options.secretName = options.secretName || secretName;
    options.secretVersion = options.secretVersion || secretVersion;

    if (!options.vaultName) {
      return cli.missingArgument('vault-name');
    }

    if (!options.secretName) {
      return cli.missingArgument('secret-name');
    }

    options.enabled = kvUtils.parseBooleanArgument('enabled', options.enabled, true);
    options.tags = kvUtils.parseTagsArgument('tags', options.tags);

  }

  function getSecretVersions(client, vaultUri, secretName, _) {

    log.verbose(util.format($('Loading versions of secret %s'), secretName));

    var secrets = [];
    var result = client.getSecretVersions(vaultUri, secretName, null, _);
    if (result) {
      secrets = result;

      while (result && result.nextLink) {
        log.verbose(util.format($('Found %d versions, loading more'), secrets.length));
        result = client.getSecretVersionsNext(result.nextLink, _);
        if (result) {
          secrets = secrets.concat(result);
        }
      }
    }

    return secrets;
  }

  function showSecret(options, secret) {
    cli.interaction.formatOutput(secret, function(secret) {
      secret.attributes = kvUtils.getAttributesWithPrettyDates(secret.attributes);
      utils.logLineFormat(secret, log.data);      
    });
  }

  function showSecretRow(row, item) {
    var identifier = kvUtils.parseSecretIdentifier(item.id);
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
    row.cell($('Tags'), kvUtils.getTagsInfo(item.tags));
  }

};