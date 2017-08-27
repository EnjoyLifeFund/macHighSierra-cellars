//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var HdiConstants = {
  ConfigurationKey: {
    ///<summary>
    /// The constant for Core site configs.
    ///</summary>
    CoreSite: 'core-site',

    ///<summary>
    /// The constant for Cluster Identity configs.
    ///</summary>
    ClusterIdentity: 'clusterIdentity',

    ///<summary>
    /// The constant for Hive site configs.
    ///</summary>
    HiveSite: 'hive-site',

    ///<summary>
    /// The constant for hive environment configs.
    ///</summary>
    HiveEnv: 'hive-env',

    ///<summary>
    /// The constant for Oozie site configs.
    ///</summary>
    OozieSite: 'oozie-site',

    ///<summary>
    /// The constant for Oozie environment configs.
    ///</summary>
    OozieEnv: 'oozie-env',

    ///<summary>
    /// The constant for WebHCAT site configs.
    ///</summary>
    WebHCatSite: 'webhcat-site',

    ///<summary>
    /// The constant for HBase environment configs.
    ///</summary>
    HBaseEnv: 'hbase-env',

    ///<summary>
    /// The constant for HBase site configs.
    ///</summary>
    HBaseSite: 'hbase-site',

    ///<summary>
    /// The constant for Storm site configs.
    ///</summary>
    StormSite: 'storm-site',

    ///<summary>
    /// The constant for Yarn site configs.
    ///</summary>
    YarnSite: 'yarn-site',

    ///<summary>
    /// The constant for MapRed site configs.
    ///</summary>
    MapRedSite: 'mapred-site',

    ///<summary>
    /// The constant for Tez site configs.
    ///</summary>
    TezSite: 'tez-site',

    ///<summary>
    /// The constant for HDFS site configs.
    ///</summary>
    HdfsSite: 'hdfs-site',

    ///<summary>
    /// The constant for Gateway configs.
    ///</summary>
    Gateway: 'gateway'
  },

  StorageType: {
    ///<summary>
    ///  Windows Azure Blob Storage
    ///</summary>  
    AzureStorage: 'WASB',

    ///<summary>
    ///  Azure Data Lake Store
    ///</summary>  
    AzureDataLakeStore: 'ADLS'
  }
};

module.exports = HdiConstants;
