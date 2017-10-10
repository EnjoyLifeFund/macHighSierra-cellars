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
#include <aws/redshift/Redshift_EXPORTS.h>
#include <aws/redshift/RedshiftRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace Redshift
{
namespace Model
{

  /**
   * <p/><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/redshift-2012-12-01/DeleteClusterSubnetGroupMessage">AWS
   * API Reference</a></p>
   */
  class AWS_REDSHIFT_API DeleteClusterSubnetGroupRequest : public RedshiftRequest
  {
  public:
    DeleteClusterSubnetGroupRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "DeleteClusterSubnetGroup"; }

    Aws::String SerializePayload() const override;

  protected:
    void DumpBodyToUrl(Aws::Http::URI& uri ) const override;

  public:

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline const Aws::String& GetClusterSubnetGroupName() const{ return m_clusterSubnetGroupName; }

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline void SetClusterSubnetGroupName(const Aws::String& value) { m_clusterSubnetGroupNameHasBeenSet = true; m_clusterSubnetGroupName = value; }

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline void SetClusterSubnetGroupName(Aws::String&& value) { m_clusterSubnetGroupNameHasBeenSet = true; m_clusterSubnetGroupName = std::move(value); }

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline void SetClusterSubnetGroupName(const char* value) { m_clusterSubnetGroupNameHasBeenSet = true; m_clusterSubnetGroupName.assign(value); }

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline DeleteClusterSubnetGroupRequest& WithClusterSubnetGroupName(const Aws::String& value) { SetClusterSubnetGroupName(value); return *this;}

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline DeleteClusterSubnetGroupRequest& WithClusterSubnetGroupName(Aws::String&& value) { SetClusterSubnetGroupName(std::move(value)); return *this;}

    /**
     * <p>The name of the cluster subnet group name to be deleted.</p>
     */
    inline DeleteClusterSubnetGroupRequest& WithClusterSubnetGroupName(const char* value) { SetClusterSubnetGroupName(value); return *this;}

  private:

    Aws::String m_clusterSubnetGroupName;
    bool m_clusterSubnetGroupNameHasBeenSet;
  };

} // namespace Model
} // namespace Redshift
} // namespace Aws
