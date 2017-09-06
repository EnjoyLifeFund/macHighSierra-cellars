/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#pragma once

#include <atomic>
#include <string>
#include <vector>

#include <osquery/registry.h>
#include <osquery/status.h>

namespace osquery {

/**
 * @brief A list of supported backing storage categories: called domains.
 *
 * RocksDB has a concept of "column families" which are kind of like tables
 * in other databases. kDomains is populated with a list of all column
 * families. If a string exists in kDomains, it's a column family in the
 * database.
 *
 * For SQLite-backed storage these are tables using a keyed index.
 */
extern const std::vector<std::string> kDomains;

/**
 * @brief A backing storage domain name, used for key/value based storage.
 *
 * There are certain "cached" variables such as a node-unique UUID or negotiated
 * 'node_key' following enrollment. If a value or setting must persist between
 * osqueryi or osqueryd runs it should be stored using the kPersistentSetting%s
 * domain.
 */
extern const std::string kPersistentSettings;

/// The "domain" where the results of scheduled queries are stored.
extern const std::string kQueries;

/// The "domain" where event results are stored, queued for querytime retrieval.
extern const std::string kEvents;

/// The "domain" where the results of carve queries are stored.
extern const std::string kCarves;

/**
 * @brief The "domain" where buffered log results are stored.
 *
 * Logger plugins may shuttle logs to a remote endpoint or API call
 * asynchronously. The backing store can be used to buffer results and status
 * logs until the logger plugin-specific thread decided to flush.
 */
extern const std::string kLogs;

/**
 * @brief An osquery backing storage (database) type that persists executions.
 *
 * The osquery tools need a high-performance storage and indexing mechanism for
 * storing intermediate results from EventPublisher%s, persisting one-time
 * generated values, and performing non-memory backed differentials.
 *
 * Practically, osquery is built around RocksDB's performance guarantees and
 * all of the internal APIs expect RocksDB's indexing and read performance.
 * However, access to this representation of a backing-store is still abstracted
 * to removing RocksDB as a dependency for the osquery SDK.
 */
class DatabasePlugin : public Plugin {
 public:
  /**
   * @brief Perform a domain and key lookup from the backing store.
   *
   * Database value access indexing is abstracted into domains and keys.
   * Both are string values but exist separately for simple indexing without
   * API-enforcing tokenization. In some cases we do add a component-specific
   * tokeninzation to keys.
   *
   * @param domain A string value representing abstract storage indexing.
   * @param key A string value representing the lookup/retrieval key.
   * @param value The output parameter, left empty if the key does not exist.
   * @return Failure if the data could not be accessed. It is up to the plugin
   * to determine if a missing key means a non-success status.
   */
  virtual Status get(const std::string& domain,
                     const std::string& key,
                     std::string& value) const = 0;

  /**
   * @brief Store a string-represented value using a domain and key index.
   *
   * See DatabasePlugin::get for discussion around domain and key use.
   *
   * @param domain A string value representing abstract storage indexing.
   * @param key A string value representing the lookup/retrieval key.
   * @param value A string value representing the data.
   * @return Failure if the data could not be stored. It is up to the plugin
   * to determine if a conflict/overwrite should return different status text.
   */
  virtual Status put(const std::string& domain,
                     const std::string& key,
                     const std::string& value) = 0;

  /// Data removal method.
  virtual Status remove(const std::string& domain, const std::string& k) = 0;

  /// Data removal with range bounds.
  virtual Status removeRange(const std::string& domain,
                             const std::string& low,
                             const std::string& high) = 0;

  virtual Status scan(const std::string& domain,
                      std::vector<std::string>& results,
                      const std::string& prefix,
                      size_t max = 0) const {
    return Status(0, "Not used");
  }

  /**
   * @brief Shutdown the database and release initialization resources.
   *
   * Assume that a plugin may override #tearDown and choose to close resources
   * when the registry is stopping. Most plugins will implement a mutex around
   * initialization and destruction and assume #setUp and #tearDown will
   * dictate the flow in most situations.
   */
  virtual ~DatabasePlugin() {}

  /**
   * @brief Support the registry calling API for extensions.
   *
   * The database plugin "fast-calls" directly to local plugins.
   * Extensions cannot use an extension-local backing store so their requests
   * are routed like all other plugins.
   */
  Status call(const PluginRequest& request, PluginResponse& response) override;

 public:
  /// Database-specific workflow: reset the originally request instance.
  virtual Status reset() final;

  /// Database-specific workflow: perform an initialize, then reset.
  bool checkDB();

  /// Require all DBHandle accesses to open a read and write handle.
  static void setRequireWrite(bool rw) {
    kDBRequireWrite = rw;
  }

  /// Allow DBHandle creations.
  static void setAllowOpen(bool ao) {
    kDBAllowOpen = ao;
  }

 public:
  /// Control availability of the RocksDB handle (default false).
  static std::atomic<bool> kDBAllowOpen;

  /// The database must be opened in a R/W mode (default false).
  static std::atomic<bool> kDBRequireWrite;

  /// An internal mutex around database sanity checking.
  static std::atomic<bool> kDBChecking;

  /// An internal status protecting database access.
  static std::atomic<bool> kDBInitialized;

 public:
  /**
   * @brief Allow the initializer to check the active database plugin.
   *
   * Unlink the initializer's Initializer::initActivePlugin helper method, the
   * database plugin should always be within the core. There is no need to
   * discover the active plugin via the registry or extensions API.
   *
   * The database should setUp in preparation for accesses.
   */
  static Status initPlugin();

  /// Allow shutdown before exit.
  static void shutdown();

 protected:
  /// The database was opened in a ReadOnly mode.
  bool read_only_{false};

  /// Original requested path on disk.
  std::string path_;
};

/**
 * @brief Lookup a value from the active osquery DatabasePlugin storage.
 *
 * See DatabasePlugin::get for discussion around domain and key use.
 * Extensions, components, plugins, and core code should use getDatabaseValue
 * as a wrapper around the current tool's choice of a backing storage plugin.
 *
 * @param domain A string value representing abstract storage indexing.
 * @param key A string value representing the lookup/retrieval key.
 * @param value The output parameter, left empty if the key does not exist.
 * @return Storage operation status.
 */
Status getDatabaseValue(const std::string& domain,
                        const std::string& key,
                        std::string& value);

/**
 * @brief Set or put a value into the active osquery DatabasePlugin storage.
 *
 * See DatabasePlugin::get for discussion around domain and key use.
 * Extensions, components, plugins, and core code should use setDatabaseValue
 * as a wrapper around the current tool's choice of a backing storage plugin.
 *
 * @param domain A string value representing abstract storage indexing.
 * @param key A string value representing the lookup/retrieval key.
 * @param value A string value representing the data.
 * @return Storage operation status.
 */
Status setDatabaseValue(const std::string& domain,
                        const std::string& key,
                        const std::string& value);

/// Remove a domain/key identified value from backing-store.
Status deleteDatabaseValue(const std::string& domain, const std::string& key);

/// Remove a range of keys in domain.
Status deleteDatabaseRange(const std::string& domain,
                           const std::string& low,
                           const std::string& high);

/// Get a list of keys for a given domain.
Status scanDatabaseKeys(const std::string& domain,
                        std::vector<std::string>& keys,
                        size_t max = 0);

/// Get a list of keys for a given domain.
Status scanDatabaseKeys(const std::string& domain,
                        std::vector<std::string>& keys,
                        const std::string& prefix,
                        size_t max = 0);

/// Allow callers to reload or reset the database plugin.
void resetDatabase();

/// Allow callers to scan each column family and print each value.
void dumpDatabase();
}
