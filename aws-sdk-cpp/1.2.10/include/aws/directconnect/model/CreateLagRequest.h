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
#include <aws/directconnect/DirectConnect_EXPORTS.h>
#include <aws/directconnect/DirectConnectRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace DirectConnect
{
namespace Model
{

  /**
   * <p>Container for the parameters to the CreateLag operation.</p><p><h3>See
   * Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/directconnect-2012-10-25/CreateLagRequest">AWS
   * API Reference</a></p>
   */
  class AWS_DIRECTCONNECT_API CreateLagRequest : public DirectConnectRequest
  {
  public:
    CreateLagRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "CreateLag"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>The number of physical connections initially provisioned and bundled by the
     * LAG.</p> <p>Default: None</p>
     */
    inline int GetNumberOfConnections() const{ return m_numberOfConnections; }

    /**
     * <p>The number of physical connections initially provisioned and bundled by the
     * LAG.</p> <p>Default: None</p>
     */
    inline void SetNumberOfConnections(int value) { m_numberOfConnectionsHasBeenSet = true; m_numberOfConnections = value; }

    /**
     * <p>The number of physical connections initially provisioned and bundled by the
     * LAG.</p> <p>Default: None</p>
     */
    inline CreateLagRequest& WithNumberOfConnections(int value) { SetNumberOfConnections(value); return *this;}


    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline const Aws::String& GetLocation() const{ return m_location; }

    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline void SetLocation(const Aws::String& value) { m_locationHasBeenSet = true; m_location = value; }

    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline void SetLocation(Aws::String&& value) { m_locationHasBeenSet = true; m_location = std::move(value); }

    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline void SetLocation(const char* value) { m_locationHasBeenSet = true; m_location.assign(value); }

    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline CreateLagRequest& WithLocation(const Aws::String& value) { SetLocation(value); return *this;}

    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline CreateLagRequest& WithLocation(Aws::String&& value) { SetLocation(std::move(value)); return *this;}

    /**
     * <p>The AWS Direct Connect location in which the LAG should be allocated.</p>
     * <p>Example: EqSV5</p> <p>Default: None</p>
     */
    inline CreateLagRequest& WithLocation(const char* value) { SetLocation(value); return *this;}


    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline const Aws::String& GetConnectionsBandwidth() const{ return m_connectionsBandwidth; }

    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline void SetConnectionsBandwidth(const Aws::String& value) { m_connectionsBandwidthHasBeenSet = true; m_connectionsBandwidth = value; }

    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline void SetConnectionsBandwidth(Aws::String&& value) { m_connectionsBandwidthHasBeenSet = true; m_connectionsBandwidth = std::move(value); }

    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline void SetConnectionsBandwidth(const char* value) { m_connectionsBandwidthHasBeenSet = true; m_connectionsBandwidth.assign(value); }

    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline CreateLagRequest& WithConnectionsBandwidth(const Aws::String& value) { SetConnectionsBandwidth(value); return *this;}

    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline CreateLagRequest& WithConnectionsBandwidth(Aws::String&& value) { SetConnectionsBandwidth(std::move(value)); return *this;}

    /**
     * <p>The bandwidth of the individual physical connections bundled by the LAG.</p>
     * <p>Default: None</p> <p>Available values: 1Gbps, 10Gbps</p>
     */
    inline CreateLagRequest& WithConnectionsBandwidth(const char* value) { SetConnectionsBandwidth(value); return *this;}


    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline const Aws::String& GetLagName() const{ return m_lagName; }

    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline void SetLagName(const Aws::String& value) { m_lagNameHasBeenSet = true; m_lagName = value; }

    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline void SetLagName(Aws::String&& value) { m_lagNameHasBeenSet = true; m_lagName = std::move(value); }

    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline void SetLagName(const char* value) { m_lagNameHasBeenSet = true; m_lagName.assign(value); }

    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline CreateLagRequest& WithLagName(const Aws::String& value) { SetLagName(value); return *this;}

    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline CreateLagRequest& WithLagName(Aws::String&& value) { SetLagName(std::move(value)); return *this;}

    /**
     * <p>The name of the LAG.</p> <p>Example: "<code>3x10G LAG to AWS</code>"</p>
     * <p>Default: None</p>
     */
    inline CreateLagRequest& WithLagName(const char* value) { SetLagName(value); return *this;}


    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline const Aws::String& GetConnectionId() const{ return m_connectionId; }

    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline void SetConnectionId(const Aws::String& value) { m_connectionIdHasBeenSet = true; m_connectionId = value; }

    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline void SetConnectionId(Aws::String&& value) { m_connectionIdHasBeenSet = true; m_connectionId = std::move(value); }

    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline void SetConnectionId(const char* value) { m_connectionIdHasBeenSet = true; m_connectionId.assign(value); }

    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline CreateLagRequest& WithConnectionId(const Aws::String& value) { SetConnectionId(value); return *this;}

    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline CreateLagRequest& WithConnectionId(Aws::String&& value) { SetConnectionId(std::move(value)); return *this;}

    /**
     * <p>The ID of an existing connection to migrate to the LAG.</p> <p>Default:
     * None</p>
     */
    inline CreateLagRequest& WithConnectionId(const char* value) { SetConnectionId(value); return *this;}

  private:

    int m_numberOfConnections;
    bool m_numberOfConnectionsHasBeenSet;

    Aws::String m_location;
    bool m_locationHasBeenSet;

    Aws::String m_connectionsBandwidth;
    bool m_connectionsBandwidthHasBeenSet;

    Aws::String m_lagName;
    bool m_lagNameHasBeenSet;

    Aws::String m_connectionId;
    bool m_connectionIdHasBeenSet;
  };

} // namespace Model
} // namespace DirectConnect
} // namespace Aws
