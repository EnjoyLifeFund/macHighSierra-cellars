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
var util = require('util');
var async = require('async');

var utils = require('../../../util/utils');
var $ = utils.getLocaleString;

function VMImage(cli, serviceClients, resourceGroupName, params) {
  this.cli = cli;
  this.serviceClients = serviceClients;
  this.resourceGroupName = resourceGroupName;
  this.params = params;
}

__.extend(VMImage.prototype, {
  getVMImagePublisherList: function (location, _) {
    var publishers;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine and/or extension image publishers (Location: "%s")'), location));
    try {
      publishers = this.serviceClients.computeManagementClient.virtualMachineImages.listPublishers(location, _);
    } finally {
      progress.end();
    }

    return publishers;
  },

  getVMImageOffersList: function (location, publisherName, _) {
    var offers;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine image offers (Publisher: "%s" Location:"%s")'), publisherName, location));
    try {
      offers = this.serviceClients.computeManagementClient.virtualMachineImages.listOffers(location, publisherName, _);
    } finally {
      progress.end();
    }

    offers.map(function(sku){
      sku.publisher = publisherName;
      return sku;
    });

    return offers;
  },

  getVMImageSkusList: function (location, publisherName, offer, _) {
    var skus;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine image skus (Publisher:"%s" Offer:"%s" Location:"%s")'), publisherName, offer, location));
    try {
      skus = this.serviceClients.computeManagementClient.virtualMachineImages.listSkus(location, publisherName, offer, _);
    } finally {
      progress.end();
    }

    skus.map(function(sku){
      sku.publisher = publisherName;
      sku.offer = offer;
      return sku;
    });

    return skus;
  },

  getVMImageListForSku: function (location, publisherName, offer, skus, _) {
    var images;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine images (Publisher:"%s" Offer:"%s" Sku: "%s" Location:"%s")'), publisherName, offer, skus, location));
    try {
      images = this.serviceClients.computeManagementClient.virtualMachineImages.list(location, publisherName, offer, skus, _);
    } finally {
      progress.end();
    }

    return images;
  },

  getVMImageList: function (imageFilter, _) {
    if (!imageFilter.location) {
      imageFilter.location = this.cli.interaction.prompt($('Enter location: '), _);
    }

    if (imageFilter.publishername && imageFilter.offer && imageFilter.skus) {
      return this._getVMImageListForPublisherOfferAndSkus(imageFilter, _);
    }

    if (imageFilter.publishername && imageFilter.offer) {
      return this._getVMImageListForPublisherAndOffer(imageFilter, _);
    }

    if (imageFilter.publishername) {
      return this._getVMImageListForPublisher(imageFilter, _);
    }
  },

  _getVMImageListForPublisherOfferAndSkus: function (imageFilter, _) {
    var that = this;

    var images = that.getVMImageListForSku(imageFilter.location, imageFilter.publishername, imageFilter.offer, imageFilter.skus, _);
    var imageQueries = [];
    images.forEach(function (image) {
      imageQueries.push(function(callBack) {
        that.serviceClients.computeManagementClient.virtualMachineImages.get(
          imageFilter.location,
          imageFilter.publishername,
          imageFilter.offer,
          imageFilter.skus,
          image.name,
          function(error, imgResult) {
            imgResult = error ? { osDiskImage: {}, dataDiskImages: [] } : imgResult;
            image.publisher = imageFilter.publishername;
            image.offer = imageFilter.offer;
            image.skus = imageFilter.skus;
            image.urn = image.publisher + ':' +image.offer + ':' + image.skus + ':' + image.name;
            image.operatingSystem = imgResult.osDiskImage.operatingSystem;
            image.dataDiskImages = imgResult.dataDiskImages;
            image.purchasePlan = imgResult.purchasePlan;
            return callBack(null, image);
          });
      });
    });

    var imageCollection = async.parallel(imageQueries, _);
    return imageCollection;
  },

  _getVMImageListForPublisherAndOffer: function (imageFilter, _) {
    var that = this;
    var imageQueries;

    var skusCollection = that.getVMImageSkusList(imageFilter.location, imageFilter.publishername, imageFilter.offer, _);
    imageQueries = [];
    skusCollection.forEach( function(skus) {
      imageQueries.push(function(callBack) {
        that.serviceClients.computeManagementClient.virtualMachineImages.list(
          imageFilter.location,
          imageFilter.publishername,
          imageFilter.offer,
          skus.name,
          function(error, vmImages) {
            vmImages = error ? [] : vmImages;
            vmImages.skus = skus.name;
            skus.vmImages = vmImages;
            return callBack(error, vmImages);
          });
      });
    });

    async.parallel(imageQueries, _);

    // Flatten the collection
    imageQueries = [];
    skusCollection.forEach( function(skus) {
      skus.vmImages.forEach( function (image) {
        imageQueries.push(function(callBack) {
          that.serviceClients.computeManagementClient.virtualMachineImages.get(
            imageFilter.location,
            imageFilter.publishername,
            imageFilter.offer,
            skus.vmImages.skus,
            image.name,
            function(error, imgResult) {
              imgResult = error ? { osDiskImage: {}, dataDiskImages: [] } : imgResult;
              image.publisher = imageFilter.publishername;
              image.offer = imageFilter.offer;
              image.skus = skus.vmImages.skus;
              image.urn = image.publisher + ':' +image.offer + ':' + image.skus + ':' + image.name;
              image.operatingSystem = imgResult.osDiskImage.operatingSystem;
              image.dataDiskImages = imgResult.dataDiskImages;
              image.purchasePlan = imgResult.purchasePlan;
              return callBack(null, image);
            });
        });
      });
    });

    var imageCollection = async.parallel(imageQueries, _);
    return imageCollection;
  },

  _getVMImageListForPublisher: function (imageFilter, _) {
    var that = this;
    var imageQueries;

    var offers = that.getVMImageOffersList(imageFilter.location, imageFilter.publishername, _);
    var skuQueries = [];
    offers.forEach(function(offer) {
      skuQueries.push(function(callBack) {
        offer = offer;
        that.serviceClients.computeManagementClient.virtualMachineImages.listSkus(
          imageFilter.location,
          imageFilter.publishername,
          offer.name,
          function (error, skus) {
            skus = error ? [] : skus;
            skus.offer = offer.name;
            offer.skus = skus;
            return callBack(error, skus);
          });
      });
    });

    var skusCollections = async.parallel(skuQueries, _);
    imageQueries = [];
    skusCollections.forEach(function(skusCollection) {
      skusCollection.forEach(function(skus) {
        imageQueries.push(function(callBack) {
          skus = skus;
          that.serviceClients.computeManagementClient.virtualMachineImages.list(
            imageFilter.location,
            imageFilter.publishername,
            skusCollection.offer,
            skus.name,
            function(error, vmImages) {
              vmImages = error ? [] : vmImages;
              vmImages.skus = skus.name;
              skus.vmImages = vmImages;
              return callBack(error, vmImages);
            });
        });
      });
    });

    async.parallel(imageQueries, _);
    imageQueries = [];
    // Flatten the collection
    skusCollections.forEach (function (skusCollection) {
      skusCollection.forEach(function (skus) {
        skus.vmImages.forEach(function (image) {
          imageQueries.push(function(callBack) {
            that.serviceClients.computeManagementClient.virtualMachineImages.get(
              imageFilter.location,
              imageFilter.publishername,
              skusCollection.offer,
              skus.name,
              image.name,
              function(error, imgResult) {
                imgResult = error ? { osDiskImage: {}, dataDiskImages: [] } : imgResult;
                image.publisher = imageFilter.publishername;
                image.offer = skusCollection.offer;
                image.skus = skus.name;
                image.urn = image.publisher + ':' +image.offer + ':' + image.skus + ':' + image.name;
                image.operatingSystem = imgResult.osDiskImage.operatingSystem;
                image.dataDiskImages = imgResult.dataDiskImages;
                image.purchasePlan = imgResult.purchasePlan;
                return callBack(null, image);
              });
          });
        });
      });
    });

    var imageCollection = async.parallel(imageQueries, _);
    return imageCollection;
  },
  
  getVMImageDetails: function (imageFilter, _) {
    var that = this;
    var imageQueries = [];
    imageQueries.push(function(callBack) {
      that.serviceClients.computeManagementClient.virtualMachineImages.get(imageFilter.location, imageFilter.publishername, imageFilter.offer, imageFilter.skus, imageFilter.version, function(error, imgResult) {
        if (error) {
          callBack(error);
          return;
        }

        imgResult = error ? {} : imgResult;
        return callBack(null, imgResult);
      });
    });

    var imageCollection = async.parallel(imageQueries, _);
    return imageCollection;
  },

  getVMExtensionImageList: function (location, publisher, typeName, _) {
    if (!location) {
      location = this.cli.interaction.prompt($('Enter location: '), _);
    }

    if (publisher && typeName) {
      return this.getVMExtensionImageVersionList(location, publisher, typeName, _);
    }
    else if (publisher && !typeName) {
      return this._getExtImageListForPublisher(location, publisher, _);
    }
    else if (!publisher && typeName) {
      publisher = this.cli.interaction.prompt($('Enter publisher name: '), _);
      return this.getVMExtensionImageVersionList(location, publisher, typeName, _);
    }
    else {
      return this._getExtImageListForLocation(location, _);
    }
  },

  _getExtImageListForLocation: function (location, _) {
    var that = this;
    var publishers = this.serviceClients.computeManagementClient.virtualMachineImages.listPublishers(location, _);
    var typeQueries = [];
    publishers.forEach(function(publisherItem) {
      typeQueries.push(function(callBack) {
        that.serviceClients.computeManagementClient.virtualMachineExtensionImages.listTypes(
          location,
          publisherItem.name,
          function (error, types) {
            types = error ? [] : types;
            types.publisher = publisherItem.name;
            types.location = location;
            return callBack(error, types);
          });
      });
    });

    var typeCollections = async.parallel(typeQueries, _);
    
    imageQueries = [];
    typeCollections.forEach(function(typeCollection) {
      typeCollection.forEach(function(typeItem) {
        imageQueries.push(function(callBack) {
          that.serviceClients.computeManagementClient.virtualMachineExtensionImages.listVersions(
            typeCollection.location,
            typeCollection.publisher,
            typeItem.name,
            function(error, verItems) {
              verItems = error ? [] : verItems;
              verItems.publisher = typeCollection.publisher;
              verItems.location = typeCollection.location;
              verItems.typeName = typeItem.name;
              return callBack(error, verItems);
            });
        });
      });
    });

    var verCollections = async.parallel(imageQueries, _);

    var imgResult = [];
    verCollections.forEach(function(verCol) {
      if (verCol) {
        verCol.forEach(function(verItem) {
          imgResult.push({
            publisher: verCol.publisher,
            location: verCol.location,
            typeName: verCol.typeName,
            name: verItem.name
          });
        });
      }
    });

    return imgResult;
  },

  _getExtImageListForPublisher: function (location, publisher, _) {
    var that = this;
    var typeNames = that.getVMExtensionImageTypeList(location, publisher, _);
    var verQueries = [];
    typeNames.forEach(function(typeItem) {
      verQueries.push(function(callBack) {
        that.serviceClients.computeManagementClient.virtualMachineExtensionImages.listVersions(
          location,
          publisher,
          typeItem.name,
          function (error, item) {
            item = error ? [] : item;
            item.publisher = publisher;
            item.location = location;
            item.typeName = typeItem.name;
            return callBack(error, item);
          });
      });
    });

    var verCollections = async.parallel(verQueries, _);

    var imgResult = [];
    verCollections.forEach(function(verCol) {
      if (verCol) {
        verCol.forEach(function(resourceItem) {
          imgResult.push({
            publisher: verCol.publisher,
            location: verCol.location,
            typeName: verCol.typeName,
            name: resourceItem.name
          });
        });
      }
    });

    return imgResult;
  },

  getVMExtensionImageTypeList: function (location, publisherName, _) {
    var extTypes;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine extension image types (Publisher: "%s" Location:"%s")'), publisherName, location));
    try {
      extTypes = this.serviceClients.computeManagementClient.virtualMachineExtensionImages.listTypes(
        location,
        publisherName,
        _);
    } finally {
      progress.end();
    }

    extTypes.map(function(item){
      item.publisher = publisherName;
      return item;
    });

    return extTypes;
  },

  getVMExtensionImageVersionList: function (location, publisherName, typeName, _) {
    var extVersions = [];
    var resultList = null;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine extension image versions (Publisher: "%s" Type:"%s" Location:"%s")'), publisherName, typeName, location));

    try {
      resultList = this.serviceClients.computeManagementClient.virtualMachineExtensionImages.listVersions(
        location,
        publisherName,
        typeName,
        _);
    } finally {
      progress.end();
    }

    resultList.forEach(function (versionItem) {
      extVersions.push(versionItem);
    });

    extVersions.map(function(item){
      item.publisher = publisherName;
      item.typeName = typeName;
      return item;
    });

    return extVersions;
  },

  getVMExtensionImage: function (location, publisherName, typeName, version, _) {
    var extImage = null;
    var progress = this.cli.interaction.progress(util.format($('Getting virtual machine extension images (Publisher: "%s" Type:"%s" Version:"%s" Location:"%s")'), publisherName, typeName, version, location));
    try {
      extImage = this.serviceClients.computeManagementClient.virtualMachineExtensionImages.get(
        location,
        publisherName,
        typeName,
        version,
        _);
    } finally {
      progress.end();
    }

    return extImage;
  }

});

module.exports = VMImage;
