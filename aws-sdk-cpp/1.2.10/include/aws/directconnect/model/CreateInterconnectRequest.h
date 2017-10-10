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
   * <p>Container for the parameters to the CreateInterconnect
   * operation.</p><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/directconnect-2012-10-25/CreateInterconnectRequest">AWS
   * API Reference</a></p>
   */
  class AWS_DIRECTCONNECT_API CreateInterconnectRequest : public DirectConnectRequest
  {
  public:
    CreateInterconnectRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "CreateInterconnect"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline const Aws::String& GetInterconnectName() const{ return m_interconnectName; }

    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline void SetInterconnectName(const Aws::String& value) { m_interconnectNameHasBeenSet = true; m_interconnectName = value; }

    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline void SetInterconnectName(Aws::String&& value) { m_interconnectNameHasBeenSet = true; m_interconnectName = std::move(value); }

    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline void SetInterconnectName(const char* value) { m_interconnectNameHasBeenSet = true; m_interconnectName.assign(value); }

    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline CreateInterconnectRequest& WithInterconnectName(const Aws::String& value) { SetInterconnectName(value); return *this;}

    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline CreateInterconnectRequest& WithInterconnectName(Aws::String&& value) { SetInterconnectName(std::move(value)); return *this;}

    /**
     * <p>The name of the interconnect.</p> <p>Example: "<i>1G Interconnect to
     * AWS</i>"</p> <p>Default: None</p>
     */
    inline CreateInterconnectRequest& WithInterconnectName(const char* value) { SetInterconnectName(value); return *this;}


    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline const Aws::String& GetBandwidth() const{ return m_bandwidth; }

    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline void SetBandwidth(const Aws::String& value) { m_bandwidthHasBeenSet = true; m_bandwidth = value; }

    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline void SetBandwidth(Aws::String&& value) { m_bandwidthHasBeenSet = true; m_bandwidth = std::move(value); }

    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline void SetBandwidth(const char* value) { m_bandwidthHasBeenSet = true; m_bandwidth.assign(value); }

    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline CreateInterconnectRequest& WithBandwidth(const Aws::String& value) { SetBandwidth(value); return *this;}

    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline CreateInterconnectRequest& WithBandwidth(Aws::String&& value) { SetBandwidth(std::move(value)); return *this;}

    /**
     * <p>The port bandwidth</p> <p>Example: 1Gbps</p> <p>Default: None</p>
     * <p>Available values: 1Gbps,10Gbps</p>
     */
    inline CreateInterconnectRequest& WithBandwidth(const char* value) { SetBandwidth(value); return *this;}


    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline const Aws::String& GetLocation() const{ return m_location; }

    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline void SetLocation(const Aws::String& value) { m_locationHasBeenSet = true; m_location = value; }

    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline void SetLocation(Aws::String&& value) { m_locationHasBeenSet = true; m_location = std::move(value); }

    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline void SetLocation(const char* value) { m_locationHasBeenSet = true; m_location.assign(value); }

    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline CreateInterconnectRequest& WithLocation(const Aws::String& value) { SetLocation(value); return *this;}

    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline CreateInterconnectRequest& WithLocation(Aws::String&& value) { SetLocation(std::move(value)); return *this;}

    /**
     * <p>Where the interconnect is located</p> <p>Example: EqSV5</p> <p>Default:
     * None</p>
     */
    inline CreateInterconnectRequest& WithLocation(const char* value) { SetLocation(value); return *this;}


    
    inline const Aws::String& GetLagId() const{ return m_lagId; }

    
    inline void SetLagId(const Aws::String& value) { m_lagIdHasBeenSet = true; m_lagId = value; }

    
    inline void SetLagId(Aws::String&& value) { m_lagIdHasBeenSet = true; m_lagId = std::move(value); }

    
    inline void SetLagId(const char* value) { m_lagIdHasBeenSet = true; m_lagId.assign(value); }

    
    inline CreateInterconnectRequest& WithLagId(const Aws::String& value) { SetLagId(value); return *this;}

    
    inline CreateInterconnectRequest& WithLagId(Aws::String&& value) { SetLagId(std::move(value)); return *this;}

    
    inline CreateInterconnectRequest& WithLagId(const char* value) { SetLagId(value); return *this;}

  private:

    Aws::String m_interconnectName;
    bool m_interconnectNameHasBeenSet;

    Aws::String m_bandwidth;
    bool m_bandwidthHasBeenSet;

    Aws::String m_location;
    bool m_locationHasBeenSet;

    Aws::String m_lagId;
    bool m_lagIdHasBeenSet;
  };

} // namespace Model
} // namespace DirectConnect
} // namespace Aws
