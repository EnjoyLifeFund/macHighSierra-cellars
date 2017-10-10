﻿/*
* Copyright 2010-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*  http://aws.amazon.com/apache2.0
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*/

#pragma once
#include <aws/opsworkscm/OpsWorksCM_EXPORTS.h>
#include <aws/opsworkscm/OpsWorksCMRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace OpsWorksCM
{
namespace Model
{

  /**
   */
  class AWS_OPSWORKSCM_API DeleteBackupRequest : public OpsWorksCMRequest
  {
  public:
    DeleteBackupRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "DeleteBackup"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline const Aws::String& GetBackupId() const{ return m_backupId; }

    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline void SetBackupId(const Aws::String& value) { m_backupIdHasBeenSet = true; m_backupId = value; }

    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline void SetBackupId(Aws::String&& value) { m_backupIdHasBeenSet = true; m_backupId = std::move(value); }

    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline void SetBackupId(const char* value) { m_backupIdHasBeenSet = true; m_backupId.assign(value); }

    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline DeleteBackupRequest& WithBackupId(const Aws::String& value) { SetBackupId(value); return *this;}

    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline DeleteBackupRequest& WithBackupId(Aws::String&& value) { SetBackupId(std::move(value)); return *this;}

    /**
     * <p>The ID of the backup to delete. Run the DescribeBackups command to get a list
     * of backup IDs. Backup IDs are in the format
     * <code>ServerName-yyyyMMddHHmmssSSS</code>. </p>
     */
    inline DeleteBackupRequest& WithBackupId(const char* value) { SetBackupId(value); return *this;}

  private:

    Aws::String m_backupId;
    bool m_backupIdHasBeenSet;
  };

} // namespace Model
} // namespace OpsWorksCM
} // namespace Aws
