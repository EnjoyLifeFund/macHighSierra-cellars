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
#include <aws/rds/RDS_EXPORTS.h>
#include <aws/rds/RDSRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace RDS
{
namespace Model
{

  /**
   * <p/><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/rds-2014-10-31/PromoteReadReplicaDBClusterMessage">AWS
   * API Reference</a></p>
   */
  class AWS_RDS_API PromoteReadReplicaDBClusterRequest : public RDSRequest
  {
  public:
    PromoteReadReplicaDBClusterRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "PromoteReadReplicaDBCluster"; }

    Aws::String SerializePayload() const override;

  protected:
    void DumpBodyToUrl(Aws::Http::URI& uri ) const override;

  public:

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline const Aws::String& GetDBClusterIdentifier() const{ return m_dBClusterIdentifier; }

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline void SetDBClusterIdentifier(const Aws::String& value) { m_dBClusterIdentifierHasBeenSet = true; m_dBClusterIdentifier = value; }

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline void SetDBClusterIdentifier(Aws::String&& value) { m_dBClusterIdentifierHasBeenSet = true; m_dBClusterIdentifier = std::move(value); }

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline void SetDBClusterIdentifier(const char* value) { m_dBClusterIdentifierHasBeenSet = true; m_dBClusterIdentifier.assign(value); }

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline PromoteReadReplicaDBClusterRequest& WithDBClusterIdentifier(const Aws::String& value) { SetDBClusterIdentifier(value); return *this;}

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline PromoteReadReplicaDBClusterRequest& WithDBClusterIdentifier(Aws::String&& value) { SetDBClusterIdentifier(std::move(value)); return *this;}

    /**
     * <p>The identifier of the DB cluster Read Replica to promote. This parameter is
     * not case-sensitive. </p> <p>Constraints:</p> <ul> <li> <p>Must contain from 1 to
     * 63 alphanumeric characters or hyphens.</p> </li> <li> <p>First character must be
     * a letter.</p> </li> <li> <p>Cannot end with a hyphen or contain two consecutive
     * hyphens.</p> </li> </ul> <p>Example: <code>my-cluster-replica1</code> </p>
     */
    inline PromoteReadReplicaDBClusterRequest& WithDBClusterIdentifier(const char* value) { SetDBClusterIdentifier(value); return *this;}

  private:

    Aws::String m_dBClusterIdentifier;
    bool m_dBClusterIdentifierHasBeenSet;
  };

} // namespace Model
} // namespace RDS
} // namespace Aws
