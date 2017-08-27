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

// Camel case checks disabled because the identifier certificate_ops is part of spec and can't be changed.
/*jshint camelcase:false */

var util = require('util');
var fs = require('fs');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var kvUtils = require('./kv-utils');
var jsonlint = require('jsonlint');

var $ = utils.getLocaleString;

var ENCODINGS = ['base64'];
var KEY_TYPES = ['RSA', 'RSA-HSM'];
var SECRET_CONTENT_TYPES = ['application/x-pkcs12', 'application/x-pem-file'];

exports.init = function(cli) {
  var log = cli.output;

  var certificate = cli.category('keyvault').category('certificate')
    .description($('Commands to manage certificates in the Azure Key Vault service'));

  certificate.command('list [vault-name]')
    .description($('Lists certificates of a vault'))
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
      // Create the client and list certificates. //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var certificates = [];
      var progress = cli.interaction.progress(util.format($('Loading certificates of vault %s'), options.vaultUri));
      try {
        var result = client.getCertificates(options.vaultUri, _);
        if (result) {
          certificates = result;

          while (result && result.nextLink) {
            log.verbose(util.format($('Found %d certificates, loading more'), certificates.length));
            result = client.getCertificatesNext(result.nextLink, _);
            if (result) {
              certificates = certificates.concat(result);
            }
          }
        }
      } finally {
        progress.end();
      }

      log.table(certificates, showCertificateRow);

      log.info(util.format($('Found %d certificates'), certificates.length));
    });

  certificate.command('list-versions [vault-name] [certificate-name]')
    .description($('Lists certificate versions'))
    .usage('[options] <vault-name> [certificate-name]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('lists only versions of this certificate'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      ////////////////////////////////////////////
      // Create the client and list certificates.       //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificates, certificateIdentifier, certificateVersions;
      var progress;
      if (!options.certificateName) {
        certificates = [];
        progress = cli.interaction.progress(util.format($('Loading certificates of vault %s'), options.vaultUri));
        try {
          var result = client.getCertificates(options.vaultUri, _);
          if (result && result.length) {
            for (var i = 0; i < result.length; ++i) {
              certificateIdentifier = kvUtils.parseCertificateIdentifier(result[i].id);
              certificateVersions = getCertificateVersions(client, certificateIdentifier.vaultUri, certificateIdentifier.name, _);
              certificates = certificates.concat(certificateVersions);
            }

            while (result && result.nextLink) {
              log.verbose(util.format($('Found %d certificates, loading more'), certificates.length));
              result = client.getCertificatesNext(result.nextLink, _);
              if (result && result.length) {
                for (var j = 0; j < result.length; ++j) {
                  certificateIdentifier = kvUtils.parseCertificateIdentifier(result[j].id);
                  certificateVersions = getCertificateVersions(client, certificateIdentifier.vaultUri, certificateIdentifier.name, _);
                  certificates = certificates.concat(certificateVersions);
                }
              }
            }
          }
        } finally {
          progress.end();
        }
      } else {
        progress = cli.interaction.progress(util.format($('Loading certificates of vault %s'), options.vaultUri));
        try {
          certificates = getCertificateVersions(client, options.vaultUri, options.certificateName, _);
        } finally {
          progress.end();
        }
      }

      log.table(certificates, showCertificateRow);

      log.info(util.format($('Found %d certificates'), certificates.length));
    });

  certificate.command('show [vault-name] [certificate-name] [certificate-version]')
    .description($('Shows a vault certificate'))
    .usage('[options] <vault-name> <certificate-name> [certificate-version]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-r, --certificate-version <certificate-version>', $('the certificate version; if omited, uses the most recent'))
    .execute(function(vaultName, certificateName, certificateVersion, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        certificateVersion: certificateVersion,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;
      options.certificateVersion = options.certificateVersion || certificateVersion;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificateIdentifier = getCertificateIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Getting certificate %s'), certificateIdentifier));
      try {
        certificate = client.getCertificate(certificateIdentifier, _);
      } finally {
        progress.end();
      }

      showCertificate(options, certificate);
    });

  certificate.command('get [vault-name] [certificate-name] [certificate-version] [file]')
    .description($('Downloads a certificate from the vault'))
    .usage('[options] <vault-name> <certificate-name> [certificate-version] <file>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-r, --certificate-version <certificate-version>', $('the certificate version; if omited, uses the most recent'))
    .option('--file <file>', $('the file to receive certificate contents; the file must not exist otherwise the command fails'))
    .option('--encode <encoding>', util.format($('tells to write a file by encoding certificate contents with the informed encoding; valid values: [%s]'), ENCODINGS.join(', ')))
    .execute(function(vaultName, certificateName, certificateVersion, file, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        certificateVersion: certificateVersion,
        file: file,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;
      options.certificateVersion = options.certificateVersion || certificateVersion;
      options.file = options.file || file;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      if (!options.file) {
        return cli.missingArgument('file');
      }

      if (options.encode) {
        options.encodeFile = kvUtils.parseEnumArgument('encode', options.encodeFile, ENCODINGS);
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificateIdentifier = getCertificateIdentifier(options);
      var progress = cli.interaction.progress(util.format($('Getting certificate %s'), certificateIdentifier));
      try {
        certificate = client.getCertificate(certificateIdentifier, _);
      } finally {
        progress.end();
      }
      
      log.info(util.format($('Writing certificate to %s'), options.file));
      var data = certificate.cer;
      if (options.encode === 'base64') {
        data = kvUtils.bufferToBase64(certificate.cer);
      }
      
      fs.writeFileSync(options.file, data, { flag: 'wx' });

    });

  certificate.command('create [vault-name] [certificate-name]')
    .description($('Creates a certificate in the vault'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-p --certificate-policy <certificate-policy>', $('a JSON-formatted string containing the certificate policy.'))
    .fileRelatedOption('-e --certificate-policy-file <certificate-policy-file>', $('a file containing the certificate policy. Mutually exlcusive with --certificate-policy.'))
    .option('-t, --tags <tags>', $('Tags to set on the certificate. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      /////////////////////////////////////////////////
      // Read the certificate policy.                //
      /////////////////////////////////////////////////

      var certificatePolicyOptions = [options.certificatePolicy, options.certificatePolicyFile];
      var certificatePolicyOptionsProvided = certificatePolicyOptions.filter(function (value) { return value !== undefined; }).length;
      if (certificatePolicyOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --certificate-policy, or --certificate-policy-file options.'));
      }

      var certificatePolicy;
      if (options.certificatePolicyFile) {
        var jsonFile = fs.readFileSync(options.certificatePolicyFile);
        certificatePolicy = jsonlint.parse(utils.stripBOM(jsonFile));
      } else if (options.certificatePolicy) {
        certificatePolicy = jsonlint.parse(options.certificatePolicy);
      }

      options.tags = kvUtils.parseTagsArgument('tags', options.tags);

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificateOperation;
      var progress = cli.interaction.progress(util.format($('Creating certificate %s in vault %s'), options.certificateName, options.vaultName));
      try {
        certificateOperation = client.createCertificate(options.vaultUri, options.certificateName, { certificatePolicy: certificatePolicy, tags: options.tags }, _);
      } finally {
        progress.end();
      }

      showCertificateOperation(options, certificateOperation);
    });

  certificate.command('import [vault-name] [certificate-name]')
    .description($('Imports a certificate into the vault'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-b --content <content>', $('a base64 encoded string containing the certificate and private key (optional) to be imported'))
    .fileRelatedOption('-e --content-file <content-file>', $('a file containing the certificate and private key (optional) to be imported'))
    .option('--content-file-binary <boolean>', $('indicates if the content file is binary. valid values: [false, true]. default is false.'))
    .option('-d, --password <password>', $('password of the file if it contains a encrypted private key'))
    .option('-p --certificate-policy <certificate-policy>', $('a JSON-formatted string containing the certificate policy.'))
    .fileRelatedOption('-e --certificate-policy-file <certificate-policy-file>', $('a file containing the certificate policy. Mutually exlusive with --certificate-policy.'))
    .option('-t, --tags <tags>', $('Tags to set on the certificate. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      options.tags = kvUtils.parseTagsArgument('tags', options.tags);

      /////////////////////////////////////////////////
      // Read the certificate content.               //
      /////////////////////////////////////////////////

      var contentOptions = [options.content, options.contentFile];
      var contentOptionsProvided = contentOptions.filter(function (value) { return value !== undefined; }).length;
      if (contentOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --content, or --content-file options.'));
      }

      var certificateContent, contentFile;
      if (options.contentFile) {
        options.contentFileBinary = kvUtils.parseBooleanArgument('content-file-binary', options.contentFileBinary, false);
        if (options.contentFileBinary) {
          contentFile = fs.readFileSync(options.contentFile);
          certificateContent = kvUtils.bufferToBase64(contentFile);
        }
        else {
          contentFile = fs.readFileSync(options.contentFile, 'UTF-8');
          certificateContent = contentFile;
        }
      } else if (options.content) {
        certificateContent = options.content;
      }

      /////////////////////////////////////////////////
      // Read the certificate policy.                //
      /////////////////////////////////////////////////

      var certificatePolicyOptions = [options.certificatePolicy, options.certificatePolicyFile];
      var certificatePolicyOptionsProvided = certificatePolicyOptions.filter(function (value) { return value !== undefined; }).length;
      if (certificatePolicyOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --certificate-policy, or --certificate-policy-file options.'));
      }

      var certificatePolicy;
      if (options.certificatePolicyFile) {
        var jsonFile = fs.readFileSync(options.certificatePolicyFile);
        certificatePolicy = jsonlint.parse(utils.stripBOM(jsonFile));
      } else if (options.certificatePolicy) {
        certificatePolicy = jsonlint.parse(options.certificatePolicy);
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificate;
      var progress = cli.interaction.progress(util.format($('Importing certificate %s in vault %s'), options.certificateName, options.vaultName));
      try {
        certificate = client.importCertificate(options.vaultUri, options.certificateName, certificateContent, { password: options.password, certificatePolicy: certificatePolicy, tags: options.tags }, _);
      } finally {
        progress.end();
      }

      showCertificate(options, certificate);
    });

  certificate.command('merge [vault-name] [certificate-name] [content]')
    .description($('Merges certificate(s)into the vault'))
    .usage('[options] <vault-name> <certificate-name> <content>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-b --content <content>', $('certificate chain to merge; must be JSON-encoded array of base64 encoded certificate'))
    .option('-t, --tags <tags>', $('Tags to set on the certificate. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .execute(function(vaultName, certificateName, content, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        content: content,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;
      options.content = options.content || content;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      if (!options.content) {
        return cli.missingArgument('content');
      }

      options.tags = kvUtils.parseTagsArgument('tags', options.tags);
      options.content = kvUtils.validateArrayArgument('content', options.content);
      for (var i = 0; i < options.content.length; ++i) {
        options.content[i] = new Buffer(options.content[i], 'base64');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificate;
      var progress = cli.interaction.progress(util.format($('Merging certificate %s in vault %s'), options.certificateName, options.vaultName));
      try {
        certificate = client.mergeCertificate(options.vaultUri, options.certificateName, options.content, { tags: options.tags }, _);
      } finally {
        progress.end();
      }

      showCertificate(options, certificate);
    });

  certificate.command('set-attributes [vault-name] [certificate-name] [certificate-version]')
    .description($('Changes attributes of an existing certificate'))
    .usage('[options] <vault-name> <certificate-name> [certificate-version]')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('name of the certificate to be modified'))
    .option('-r, --certificate-version <certificate-version>', $('the version to be modified; if omited, modifies only the most recent'))
    .option('--enabled <boolean>', $('if informed, command will change the enabled state; valid values: [false, true]'))
    .option('-t, --tags <tags>', $('Tags to set on the certificate. Can be multiple in the format \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--reset-tags', $('remove previously existing tags; can combined with --tags'))
    .execute(function(vaultName, certificateName, certificateVersion, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        certificateVersion: certificateVersion,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;
      options.certificateVersion = options.certificateVersion || certificateName;

      var informed = {
        enabled: options.enabled || false,
        tags: options.tags || false,
        resetTags: options.resetTags || false
      };

      options.enabled = kvUtils.parseBooleanArgument('enabled', options.enabled, true);
      options.tags = kvUtils.parseTagsArgument('tags', options.tags);
      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var certificateIdentifier = getCertificateIdentifier(options);

      if (informed.tags) {

        // Some tags were informed.
        if (!informed.resetTags) {

          // We must read existing tags and add the new ones.
          log.info(util.format($('Getting certificate %s'), certificateIdentifier));
          certificate = client.getCertificate(certificateIdentifier, _);
          var currentTags = certificate.tags;
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

      var request = {
        certificateAttributes: {}
      };

      if (informed.enabled) request.certificateAttributes.enabled = options.enabled;
      if (informed.tags) request.tags = options.tags;

      /////////////////////////
      // Send the request.   //
      /////////////////////////
      var progress = cli.interaction.progress(util.format($('Setting attributes on certificate %s'), certificateIdentifier));
      try {
        certificate = client.updateCertificate(certificateIdentifier, request, _);
      } finally {
        progress.end();
      }
    });

  certificate.command('delete [vault-name] [certificate-name]')
    .description($('Deletes a certificate from the vault'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete certificate %s from vault %s? [y/n] '), options.certificateName, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificate;
      var progress = cli.interaction.progress(util.format($('Deleting certificate %s in vault %s'), options.certificateName, options.vaultName));
      try {
        certificate = client.deleteCertificate(options.vaultUri, options.certificateName, _);
      } finally {
        progress.end();
      }

      showCertificate(options, certificate);
    });

  var certificatePolicy = cli.category('keyvault').category('certificate').category('policy')
    .description($('Commands to manage a certificate policy in the Azure Key Vault service'));

  certificatePolicy.command('show [vault-name] [certificate-name]')
    .description($('Shows a vault certificate policy'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificatePolicy;
      var progress = cli.interaction.progress(util.format($('Getting policy for certificate %s'), options.certificateName));
      try {
        certificatePolicy = client.getCertificatePolicy(options.vaultUri, options.certificateName, _);
      } finally {
        progress.end();
      }

      showCertificatePolicy(options, certificatePolicy);
    });

  certificatePolicy.command('get [vault-name] [certificate-name] [file]')
    .description($('Gets a vault certificate policy'))
    .usage('[options] <vault-name> <certificate-name> <file>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('--file <file>', $('the file to receive certificate policy contents; the file must not exist otherwise the command fails'))
    .execute(function(vaultName, certificateName, file, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        file: file,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;
      options.file = options.file || file;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificatePolicy;
      var progress = cli.interaction.progress(util.format($('Getting policy for certificate %s'), options.certificateName));
      try {
        certificatePolicy = client.getCertificatePolicy(options.vaultUri, options.certificateName, _);
      } finally {
        progress.end();
      }

      fs.writeFileSync(options.file, JSON.stringify(certificatePolicy), { flag: 'wx' });
    });

  /* jshint unused: false */
  certificatePolicy.command('create [issuer-name] [subject-name] [file]')
    .description($('Creates a new certificate policy JSON object. This policy object can be used as input to other certificate commands such as certificate create.'))
    .usage('options <issuer-name> [subject-name] [file]')
    .option('-i, --issuer-name <issuer-name>', $('issuer name'))
    .option('-n, --subject-name <subject-name>', $('subject name'))
    .option('--file <file>', $('the file to receive certificate policy object; the file must not exist otherwise the command fails'))
    .option('-k, --key-type <key-type>', util.format($('tells if the key backing the certificate is software-protected or HSM-protected; valid values: [%s]'), KEY_TYPES.join(', ')))
    .option('--reuse-key-on-renewal', $('indicates if the key should be reused on renewal; defaults to key is not reused'))
    .option('--key-not-exportable', $('indicates if the key should not be exportable; defaults to key is exportable'))
    .option('-t, --secret-content-type <secret-content-type>', util.format($('secret content type; valid values: [%s]'), SECRET_CONTENT_TYPES.join(', ')))
    .option('-d, --dns-names <dns-name>', $('subject alternative dns names; must be JSON-encoded array of strings'))
    .option('-e, --ekus <ekus>', $('extended key usages; must be JSON-encoded array of strings'))
    .option('-m, --validity-in-months <validity-in-months>', $('validity of the certificate in months'))
    .option('-c, --certificate-type <certificate-type>', $('Type of certificate to be requested from the issuer'))
    .option('--renew-days-before-expiry <renew-days-before-expiry>', $('number of days before expiry to automatically renew the certificate'))
    .option('--renew-at-percentage-lifetime <renew-at-percentage-lifetime>', $('lifetime percentage at which automatically renew the certificate'))
    .option('--email-days-before-expiry <email-days-before-expiry>', $('number of days before expiry to send notification'))
    .option('--email-at-percentage-lifetime <email-at-percentage-lifetime>', $('lifetime percentage at which send notification'))
    .execute(function(issuerName, subjectName, file, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        issuerName: issuerName,
        subjectName: subjectName,
        file: file,
        options: options
      }));

      options.issuerName = options.issuerName || issuerName;
      options.subjectName = options.subjectName || subjectName;
      options.file = options.file || file;

      if (!options.issuerName) {
        throw new Error(util.format($('Issuer name must be provided')));
      }

      //options.keyNotExportable = kvUtils.parseBooleanArgument('key-not-exportable', options.keyNotExportable, false);
      //options.reuseKeyOnRenewal = kvUtils.parseBooleanArgument('reuse-key-on-renewal', options.reuseKeyOnRenewal, false);

      var policy = {
        keyProperties: {
          exportable: !options.keyNotExportable,
          reuseKey: options.reuseKeyOnRenewal,
        },
        x509CertificateProperties: {
        },
        issuerParameters: {
          name: options.issuerName,
          certificateType: options.certificateType
        }
      };

      if (options.keyType) {
        if (!KEY_TYPES.some(function(e) { return e.toUpperCase() === options.keyType.toUpperCase(); })) {
          throw new Error(util.format($('Invalid value for key type argument. Accepted values are: %s'), KEY_TYPES.join(', ')));
        }

        policy.keyProperties.keyType = options.keyType.toUpperCase();
      }

      if (options.secretContentType) {
        if (!SECRET_CONTENT_TYPES.some(function(e) { return e === options.secretContentType; })) {
          throw new Error(util.format($('Invalid value for secret content type argument. Accepted values are: %s'), SECRET_CONTENT_TYPES.join(', ')));
        }

        policy.secretProperties = {
          contentType: options.secretContentType
        };
      }

      if (!options.subjectName && !options.dnsNames) {
        throw new Error(util.format($('Either subject name or dns names must be provided')));
      }

      if (options.subjectName) {
        policy.x509CertificateProperties.subject = options.subjectName;
      }

      if (options.dnsNames) {
        options.dnsNames = kvUtils.validateArrayArgument('dns-names', options.dnsNames);
        policy.x509CertificateProperties.subjectAlternativeNames = {
          dnsNames: options.dnsNames
        };
      }

      if (options.ekus) {
        options.ekus = kvUtils.validateArrayArgument('ekus', options.ekus);
        policy.x509CertificateProperties.ekus = options.ekus;
      }

      if (options.validityInMonths) {
        options.validityInMonths = kvUtils.parseIntegerArgument('validity-in-months', options.validityInMonths);
        policy.x509CertificateProperties.validityInMonths = options.validityInMonths;
      }

      var lifetimeActionOptions = [options.renewDaysBeforeExpiry, options.renewAtPercentageLifetime, options.emailDaysBeforeExpiry, options.emailAtPercentageLifetime];
      var lifetimeActionOptionsProvided = lifetimeActionOptions.filter(function (value) { return value !== undefined; }).length;
      if (lifetimeActionOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --renew-days-before-expiry, --renew-at-percentage-lifetime, --email-days-before-expiry, or --email-at-percentage-lifetime options.'));
      }

      if (options.renewDaysBeforeExpiry) {
        policy.lifetimeActions = [{
          trigger: {
            daysBeforeExpiry: options.renewDaysBeforeExpiry
          },
          action: {
            actionType: 'AutoRenew'
            }
        }];
      }

      if (options.renewAtPercentageLifetime) {
        policy.lifetimeActions = [{
          trigger: {
            lifetimePercentage: options.renewAtPercentageLifetime
          },
          action: {
            actionType: 'AutoRenew'
            }
        }];
      }

      if (options.emailDaysBeforeExpiry) {
        policy.lifetimeActions = [{
          trigger: {
            daysBeforeExpiry: options.emailDaysBeforeExpiry
          },
          action: {
            actionType: 'EmailContacts'
            }
        }];
      }

      if (options.emailAtPercentageLifetime) {
        policy.lifetimeActions = [{
          trigger: {
            lifetimePercentage: options.emailAtPercentageLifetime
          },
          action: {
            actionType: 'EmailContacts'
            }
        }];
      }

      if (options.file) {
        fs.writeFileSync(options.file, JSON.stringify(policy), { flag: 'wx' });
      }
      else {
        showCertificatePolicy(options, policy);
      }
    });
  /* jshint unused: true */

  certificatePolicy.command('set [vault-name] [certificate-name]')
    .description($('Sets a vault certificate policy'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-p --certificate-policy <certificate-policy>', $('a JSON-formatted string containing the certificate policy'))
    .fileRelatedOption('-e --certificate-policy-file <certificate-policy-file>', $('a file containing the certificate policy.Mutually exlcusive with --certificate-policy.'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      /////////////////////////////////////////////////
      // Read the certificate policy.                //
      /////////////////////////////////////////////////

      var certificatePolicyOptions = [options.certificatePolicy, options.certificatePolicyFile];
      var certificatePolicyOptionsProvided = certificatePolicyOptions.filter(function (value) { return value !== undefined; }).length;
      if (certificatePolicyOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --certificate-policy, or --certificate-policy-file options.'));
      } else if (certificatePolicyOptionsProvided === 0) {
        throw new Error($('One of the --certificate-policy, or --certificate-policy-file options is required.'));
      }

      var certificatePolicy;
      if (options.certificatePolicyFile) {
        var jsonFile = fs.readFileSync(options.certificatePolicyFile);
        certificatePolicy = jsonlint.parse(utils.stripBOM(jsonFile));
      } else {
        certificatePolicy = jsonlint.parse(options.certificatePolicy);
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var progress = cli.interaction.progress(util.format($('Updating policy for certificate %s'), options.certificateName));
      try {
        certificatePolicy = client.updateCertificatePolicy(options.vaultUri, options.certificateName, certificatePolicy, _);
      } finally {
        progress.end();
      }

      showCertificatePolicy(options, certificatePolicy);
    });

  var certificateOperation = cli.category('keyvault').category('certificate').category('operation')
    .description($('Commands to manage certificate operations in the Azure Key Vault service'));

  certificateOperation.command('show [vault-name] [certificate-name]')
    .description($('Shows a vault certificate operation'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificateOperation;
      var progress = cli.interaction.progress(util.format($('Getting operation for certificate %s'), options.certificateName));
      try {
        certificateOperation = client.getCertificateOperation(options.vaultUri, options.certificateName, _);
      } finally {
        progress.end();
      }

      showCertificateOperation(options, certificateOperation);
    });

  certificateOperation.command('cancel [vault-name] [certificate-name]')
    .description($('Cancels a vault certificate operation'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-q, --quiet', $('quiet mode (do not ask for cancel confirmation)'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Cancel certificate operation for certificate %s from vault %s? [y/n] '), options.certificateName, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }
      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var certificateOperation;
      var progress = cli.interaction.progress(util.format($('Cancelling operation for certificate %s'), options.certificateName));
      try {
        certificateOperation = client.updateCertificateOperation(options.vaultUri, options.certificateName, { cancellationRequested : true }, _);
      } finally {
        progress.end();
      }

      showCertificateOperation(options, certificateOperation);
    });

  certificateOperation.command('delete [vault-name] [certificate-name]')
    .description($('Deletes a vault certificate operation'))
    .usage('[options] <vault-name> <certificate-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-name <certificate-name>', $('the certificate name'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function(vaultName, certificateName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateName: certificateName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateName = options.certificateName || certificateName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateName) {
        return cli.missingArgument('certificate-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete certificate operation for certificate %s from vault %s? [y/n] '), options.certificateName, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }
      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var certificateOperation;
      var progress = cli.interaction.progress(util.format($('Deleting operation for certificate %s'), options.certificateName));
      try {
        certificateOperation = client.deleteCertificateOperation(options.vaultUri, options.certificateName, _);
      } finally {
        progress.end();
      }

      showCertificateOperation(options, certificateOperation);
    });

  var certificateAdministrator = cli.category('keyvault').category('certificate').category('administrator')
    .description($('Commands to manage certificate administrators in the Azure Key Vault service'));

  /* jshint unused: false */
  certificateAdministrator.command('create [first-name] [last-name] [email-address] [phone-number] [file]')
    .description($('Creates a new certificate administator JSON object. This administratory object can be used as input to other certificate commands such as organization create.'))
    .usage('[options] [first-name] [last-name] [email-address] [phone-number] [file]')
    .option('-f, --first-name <first-name>', $('first name'))
    .option('-l, --last-name <last-name>', $('last name'))
    .option('-e, --email-address <email-address>', $('email-address'))
    .option('-p, --phone-number <phone-number>', $('phone-number'))
    .option('--file <file>', $('the file to receive certificate administator object; the file must not exist otherwise the command fails'))
    .execute(function(firstName, lastName, emailAddress, phoneNumber, file, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        emailAddress: emailAddress,
        phoneNumber: phoneNumber,
        options: options
      }));

      options.firstName = options.firstName || firstName;
      options.lastName = options.lastName || lastName;
      options.emailAddress = options.emailAddress || emailAddress;
      options.phoneNumber = options.phoneNumber || phoneNumber;
      options.file = options.file || file;

      ////////////////////////////////////////////
      // Create certificate administrator       //
      ////////////////////////////////////////////
      var certificateAdministrator = {
        firstName : options.firstName,
        lastName : options.lastName,
        emailAddress : options.emailAddress,
        phone : options.phoneNumber
      };

      if (options.file) {
        fs.writeFileSync(options.file, JSON.stringify(certificateAdministrator), { flag: 'wx' });
      }
      else {
        showCertificateAdministrator(options, certificateAdministrator);
      }
    });
  /* jshint unused: true */

  var certificateOrganization = cli.category('keyvault').category('certificate').category('organization')
    .description($('Commands to manage certificate organization in the Azure Key Vault service'));

  /* jshint unused: false */
  certificateOrganization.command('create [id] [file]')
    .description($('Creates a new certificate organization JSON object. This organization object can be used as input to other certificate commands such as issuer create.'))
    .usage('[options] [id] [file]')
    .option('-i, --id <id>', $('organization identifier'))
    .option('-a --certificate-administrator <certificate-administrator>', $('a JSON-formatted string containing a certificate administrator or an array of certificate administrators'))
    .fileRelatedOption('-e --certificate-administrator-file <certificate-administrator-file>', $('a file containing a certificate administrator or an array of certificate administrator. Mutually exclusive with --certificate-administrator.'))
    .option('--file <file>', $('the file to receive certificate organization object; the file must not exist otherwise the command fails'))
    .execute(function(id, file, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        id: id,
        file: file,
        options: options
      }));

      options.id = options.id || id;
      options.file = options.file || file;

      ////////////////////////////////////////////
      // Read certificate administrator         //
      ////////////////////////////////////////////
      var certificateAdministratorOptions = [options.certificateAdministrator, options.certificateAdministratorFile];
      var certificateAdministratorOptionsProvided = certificateAdministratorOptions.filter(function (value) { return value !== undefined; }).length;
      if (certificateAdministratorOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --certificate-administrator, or --certificate-administrator-file options.'));
      }

      var certificateAdministrator;
      if (options.certificateAdministratorFile) {
        var jsonFile = fs.readFileSync(options.certificateAdministratorFile);
        certificateAdministrator = jsonlint.parse(utils.stripBOM(jsonFile));
      } else if (options.certificateAdministrator) {
        certificateAdministrator = jsonlint.parse(options.certificateAdministrator);
      }

      // If certificateAdministrator is a single object,
      // we need to wrap it as an array
      if (!Array.isArray(certificateAdministrator)) {
        certificateAdministrator = [ certificateAdministrator ];
      }
      ////////////////////////////////////////////
      // Create certificate organization        //
      ////////////////////////////////////////////
      var certificateOrganization = {
        id : options.id,
        administratorDetails : certificateAdministrator
      };

      if (options.file) {
        fs.writeFileSync(options.file, JSON.stringify(certificateOrganization), { flag: 'wx' });
      }
      else {
        showCertificateOrganization(options, certificateOrganization);
      }
    });
  /* jshint unused: true */

  var certificateIssuer = cli.category('keyvault').category('certificate').category('issuer')
    .description($('Commands to manage certificate issuers in the Azure Key Vault service'));

  certificateIssuer.command('list [vault-name]')
    .description($('Lists certificate issuers of a vault'))
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
      // Create the client and list certificate issuers. //
      ////////////////////////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var certificateIssuers = [];
      var progress = cli.interaction.progress(util.format($('Loading certificate issuers of vault %s'), options.vaultUri));
      try {
        var result = client.getCertificateIssuers(options.vaultUri, _);
        if (result) {
          certificateIssuers = result;

          while (result && result.nextLink) {
            log.verbose(util.format($('Found %d certificate issuers, loading more'), certificateIssuers.length));
            result = client.getCertificatesNext(result.nextLink, _);
            if (result) {
              certificateIssuers = certificateIssuers.concat(result);
            }
          }
        }
      } finally {
        progress.end();
      }

      log.table(certificateIssuers, showCertificateIssuerRow);
      log.info(util.format($('Found %d certificate issuers'), certificateIssuers.length));
    });

  certificateIssuer.command('show [vault-name] [certificate-issuer-name]')
    .description($('Shows a vault certificate issuer'))
    .usage('[options] <vault-name> <certificate-issuer-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-issuer-name <certificate-issuer-name>', $('the certificate issuer name'))
    .execute(function(vaultName, certificateIssuerName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateIssuerName: certificateIssuerName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateIssuerName = options.certificateIssuerName || certificateIssuerName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateIssuerName) {
        return cli.missingArgument('certificate-issuer-name');
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificateIssuer;
      var progress = cli.interaction.progress(util.format($('Getting certificate issuer %s'), options.certificateIssuerName));
      try {
        certificateIssuer = client.getCertificateIssuer(options.vaultUri, options.certificateIssuerName, _);
      } finally {
        progress.end();
      }

      showCertificateIssuer(options, certificateIssuer);
    });

  certificateIssuer.command('create [vault-name] [certificate-issuer-name] [provider-name]')
    .description($('Creates a vault certificate issuer'))
    .usage('[options] <vault-name> <certificate-issuer-name> <provider-name> ')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-issuer-name <certificate-issuer-name>', $('the certificate issuer name'))
    .option('-p, --provider-name <provider-name>', $('the provider-name'))
    .option('-a, --account-id <account-id>', $('account identifier'))
    .option('-k, --api-key <api-key>', $('api key for the account'))
    .option('-o, --certificate-organization <certificate-organization>', $('the certificate organization'))
    .fileRelatedOption('-e --certificate-organization-file <certificate-organization-file>', $('a file containing the certificate organization. Mutually exclusive with --certificate-organization.'))
    .execute(function(vaultName, certificateIssuerName, providerName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateIssuerName: certificateIssuerName,
        providerName: providerName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateIssuerName = options.certificateIssuerName || certificateIssuerName;
      options.providerName = options.providerName || providerName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateIssuerName) {
        return cli.missingArgument('certificate-issuer-name');
      }

      if (!options.providerName) {
          return cli.missingArgument('provider-name');
      }

      /////////////////////////////////////////////////
      // Read the certificate organization           //
      /////////////////////////////////////////////////

      var certificateOrganizationOptions = [options.certificateOrganization, options.certificateOrganizationFile];
      var certificateOrganizationOptionsProvided = certificateOrganizationOptions.filter(function (value) { return value !== undefined; }).length;
      if (certificateOrganizationOptionsProvided > 1) {
        throw new Error($('Specify exactly one of the --certificate-organization, or --certificate-organization-file options.'));
      }

      var certificateOrganization;
      if (options.certificateOrganizationFile) {
        var jsonFile = fs.readFileSync(options.certificateOrganizationFile);
        certificateOrganization = jsonlint.parse(utils.stripBOM(jsonFile));
      } else if (options.certificateOrganization) {
        certificateOrganization = jsonlint.parse(options.certificateOrganization);
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      var issuerBundle = {
        credentials : {
          accountId : options.accountId,
          password : options.apiKey
        },
        organizationDetails : certificateOrganization
      };

      var certificateIssuer;
      var progress = cli.interaction.progress(util.format($('Creating certificate issuer %s'), options.certificateIssuerName));
      try {
        certificateIssuer = client.setCertificateIssuer(options.vaultUri, options.certificateIssuerName, options.providerName, issuerBundle, _);
      } finally {
        progress.end();
      }

      showCertificateIssuer(options, certificateIssuer);
    });

  certificateIssuer.command('delete [vault-name] [certificate-issuer-name]')
    .description($('Deletes a certificate issuer from the vault'))
    .usage('[options] <vault-name> <certificate-issuer-name>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-c, --certificate-issuer-name <certificate-issuer-name>', $('the certificate issuer name'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function(vaultName, certificateIssuerName, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        certificateIssuerName: certificateIssuerName,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.certificateIssuerName = options.certificateIssuerName || certificateIssuerName;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.certificateIssuerName) {
        return cli.missingArgument('certificate-issuer-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete certificate issuer %s from vault %s? [y/n] '), options.certificateIssuerName, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var certificateIssuer;
      var progress = cli.interaction.progress(util.format($('Deleting certificate issuer %s in vault %s'), options.certificateIssuerName, options.vaultName));
      try {
        certificateIssuer = client.deleteCertificateIssuer(options.vaultUri, options.certificateIssuerName, _);
      } finally {
        progress.end();
      }

      showCertificateIssuer(options, certificateIssuer);
    });

  var certificateContact = cli.category('keyvault').category('certificate').category('contact')
    .description($('Commands to manage certificate contacts in the Azure Key Vault service'));

  certificateContact.command('list [vault-name]')
    .description($('List vault certificate contacts'))
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

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);
      
      var certificateContacts;
      var progress = cli.interaction.progress(util.format($('Getting certificate contacts for vault %s'), options.vaultUri));
      try {
        certificateContacts = client.getCertificateContacts(options.vaultUri, _);
      } finally {
        progress.end();
      }

      showCertificateContacts(options, certificateContacts);
    });

  certificateContact.command('add [vault-name] [email-address]')
    .description($('Adds a certificate contact to the vault'))
    .usage('[options] <vault-name> <email-address>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-e, --email-address <email-address>', $('the contact email address'))
    .execute(function(vaultName, emailAddress, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        emailAddress: emailAddress,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.emailAddress = options.emailAddress || emailAddress;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.emailAddress) {
        return cli.missingArgument('email-address');
      }
      
      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var currentCertificateContacts, certificateContacts;
      var progress = cli.interaction.progress(util.format($('Adding certificate contact with email address %s in vault %s'), options.emailAddress, options.vaultName));
      try {
        currentCertificateContacts = client.getCertificateContacts(options.vaultUri, _);
      }
      catch (ex) {
        if (ex.statusCode === null || ex.statusCode != 404) {
          throw (ex);
        }
        
        currentCertificateContacts = { };
      }

      try {
        if (currentCertificateContacts.contactList === undefined || currentCertificateContacts.contactList === null) {
          currentCertificateContacts.contactList = [{ emailAddress: options.emailAddress}];
        }
        else {
          if (currentCertificateContacts.contactList.some(function(e) { return e.emailAddress.toUpperCase() == options.emailAddress.toUpperCase(); })) {
            throw new Error(util.format($('Certificate contact with email address %s already present'), options.emailAddress));
          }

          currentCertificateContacts.contactList.push({ emailAddress: options.emailAddress});
        }

        certificateContacts = client.setCertificateContacts(options.vaultUri, currentCertificateContacts, _);
      } finally {
        progress.end();
      }

      showCertificateContacts(options, certificateContacts);
    });

  certificateContact.command('delete [vault-name] [email-address]')
    .description($('Deletes a certificate contact from the vault'))
    .usage('[options <vault-name> <email-address>')
    .option('-u, --vault-name <vault-name>', $('the vault name'))
    .option('-e, --email-address <email-address>', $('the email address'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function(vaultName, emailAddress, options, _) {

      ///////////////////////
      // Parse arguments.  //
      ///////////////////////

      log.verbose('arguments: ' + JSON.stringify({
        vaultName: vaultName,
        emailAddress: emailAddress,
        options: options
      }));

      options.vaultName = options.vaultName || vaultName;
      options.emailAddress = options.emailAddress || emailAddress;

      if (!options.vaultName) {
        return cli.missingArgument('vault-name');
      }

      if (!options.emailAddress) {
        return cli.missingArgument('certificate-name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete certificate contact %s from vault %s? [y/n] '), options.emailAddress, options.vaultName), _)) {
        throw new Error($('Aborted by user'));
      }

      /////////////////////////
      // Send the request.   //
      /////////////////////////

      options.vaultUri = createVaultUri(options);
      var client = createClient(options);

      var currentCertificateContacts;
      var progress = cli.interaction.progress(util.format($('Deleting certificate contact with email address %s in vault %s'), options.emailAddress, options.vaultName));
      try {
        currentCertificateContacts = client.getCertificateContacts(options.vaultUri, _);
        if (currentCertificateContacts.contactList === null) {
          throw new Error(util.format($('Certificate contact with email address %s not found'), options.emailAddress));
        }

        var index = currentCertificateContacts.contactList.findIndex(
          function(e) { return e.emailAddress.toUpperCase() == options.emailAddress.toUpperCase(); });

        if (index == -1) {
            throw new Error(util.format($('Certificate contact with email address %s not found'), options.emailAddress));
        }

        currentCertificateContacts.contactList.splice(index, 1);
        if (currentCertificateContacts.contactList.length > 0) {
          client.setCertificateContacts(options.vaultUri, currentCertificateContacts, _);
        }
        else {
          client.deleteCertificateContacts(options.vaultUri, _);
        }
      } finally {
        progress.end();
      }
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

  function getCertificateIdentifier(options) {
    var id = options.vaultUri + '/certificates/' + options.certificateName;
    if (options.certificateVersion) {
      id += '/' + options.certificateVersion;
    }
    return id;
  }

  function getCertificateVersions(client, vaultUri, certificateName, _) {

    log.verbose(util.format($('Loading versions of certificate %s'), certificateName));

    var certificates = [];
    var result = client.getCertificateVersions(vaultUri, certificateName, _);
    if (result) {
      certificates = result;

      while (result && result.nextLink) {
        log.verbose(util.format($('Found %d versions, loading more'), certificates.length));
        result = client.getCertificateVersionsNext(result.nextLink, _);
        if (result) {
          certificates = certificates.concat(result);
        }
      }
    }

    return certificates;
  }

  function showCertificate(options, certificate) {
    if (certificate.cer) {
      certificate.cer = kvUtils.bufferToBase64(certificate.cer);
    }

    if (certificate.x509Thumbprint) {
      certificate.x509Thumbprint = kvUtils.bufferToHex(certificate.x509Thumbprint);
    }

    cli.interaction.formatOutput(certificate, function(certificate) {
      certificate.attributes = kvUtils.getAttributesWithPrettyDates(certificate.attributes);
      utils.logLineFormat(certificate, log.data);
    });
  }

  function showCertificateRow(row, item) {
    var identifier = kvUtils.parseCertificateIdentifier(item.id);
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

  function showCertificatePolicy(options, certificatePolicy) {
    cli.interaction.formatOutput(certificatePolicy, function(certificatePolicy) {
      utils.logLineFormat(certificatePolicy, log.data);
    });
  }

  function showCertificateOperation(options, certificateOperation) {
    certificateOperation.csr = kvUtils.bufferToBase64(certificateOperation.csr);
    cli.interaction.formatOutput(certificateOperation, function(certificateOperation) {
      certificateOperation.attributes = kvUtils.getAttributesWithPrettyDates(certificateOperation.attributes);
      utils.logLineFormat(certificateOperation, log.data);
    });
  }

  function showCertificateAdministrator(options, certificateAdministrator) {
    cli.interaction.formatOutput(certificateAdministrator, function(certificateAdministrator) {
      utils.logLineFormat(certificateAdministrator, log.data);
    });
  }

  function showCertificateOrganization(options, certificateOrganization) {
    cli.interaction.formatOutput(certificateOrganization, function(certificateOrganization) {
      utils.logLineFormat(certificateOrganization, log.data);
    });
  }

  function showCertificateIssuer(options, certificateIssuer) {
    cli.interaction.formatOutput(certificateIssuer, function(certificateIssuer) {
      certificateIssuer.attributes = kvUtils.getAttributesWithPrettyDates(certificateIssuer.attributes);
      utils.logLineFormat(certificateIssuer, log.data);
    });
  }

  function showCertificateIssuerRow(row, item) {
    var identifier = kvUtils.parseCertificateIssuerIdentifier(item.id);
    row.cell($('Name'), identifier.name);
    row.cell($('Provider'), item.provider);
  }

  function showCertificateContacts(options, certificateContacts) {
    var contactList = certificateContacts.contactList;
    cli.interaction.formatOutput(contactList, function(contactList) {
      utils.logLineFormat(contactList, log.data);
    });
  }
};