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
#include <aws/elasticloadbalancingv2/ElasticLoadBalancingv2_EXPORTS.h>
#include <aws/core/utils/memory/stl/AWSStreamFwd.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace Utils
{
namespace Xml
{
  class XmlNode;
} // namespace Xml
} // namespace Utils
namespace ElasticLoadBalancingv2
{
namespace Model
{

  /**
   * <p>Information about a target.</p><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/elasticloadbalancingv2-2015-12-01/TargetDescription">AWS
   * API Reference</a></p>
   */
  class AWS_ELASTICLOADBALANCINGV2_API TargetDescription
  {
  public:
    TargetDescription();
    TargetDescription(const Aws::Utils::Xml::XmlNode& xmlNode);
    TargetDescription& operator=(const Aws::Utils::Xml::XmlNode& xmlNode);

    void OutputToStream(Aws::OStream& ostream, const char* location, unsigned index, const char* locationValue) const;
    void OutputToStream(Aws::OStream& oStream, const char* location) const;


    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline const Aws::String& GetId() const{ return m_id; }

    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline void SetId(const Aws::String& value) { m_idHasBeenSet = true; m_id = value; }

    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline void SetId(Aws::String&& value) { m_idHasBeenSet = true; m_id = std::move(value); }

    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline void SetId(const char* value) { m_idHasBeenSet = true; m_id.assign(value); }

    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline TargetDescription& WithId(const Aws::String& value) { SetId(value); return *this;}

    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline TargetDescription& WithId(Aws::String&& value) { SetId(std::move(value)); return *this;}

    /**
     * <p>The ID of the target. If the target type of the target group is
     * <code>instance</code>, specify an instance ID. If the target type is
     * <code>ip</code>, specify an IP address.</p>
     */
    inline TargetDescription& WithId(const char* value) { SetId(value); return *this;}


    /**
     * <p>The port on which the target is listening.</p>
     */
    inline int GetPort() const{ return m_port; }

    /**
     * <p>The port on which the target is listening.</p>
     */
    inline void SetPort(int value) { m_portHasBeenSet = true; m_port = value; }

    /**
     * <p>The port on which the target is listening.</p>
     */
    inline TargetDescription& WithPort(int value) { SetPort(value); return *this;}


    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline const Aws::String& GetAvailabilityZone() const{ return m_availabilityZone; }

    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline void SetAvailabilityZone(const Aws::String& value) { m_availabilityZoneHasBeenSet = true; m_availabilityZone = value; }

    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline void SetAvailabilityZone(Aws::String&& value) { m_availabilityZoneHasBeenSet = true; m_availabilityZone = std::move(value); }

    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline void SetAvailabilityZone(const char* value) { m_availabilityZoneHasBeenSet = true; m_availabilityZone.assign(value); }

    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline TargetDescription& WithAvailabilityZone(const Aws::String& value) { SetAvailabilityZone(value); return *this;}

    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline TargetDescription& WithAvailabilityZone(Aws::String&& value) { SetAvailabilityZone(std::move(value)); return *this;}

    /**
     * <p>The Availability Zone where the IP address is to be registered. Specify
     * <code>all</code> to register an IP address outside the target group VPC with all
     * Availability Zones that are enabled for the load balancer.</p> <p>If the IP
     * address is in a subnet of the VPC for the target group, the Availability Zone is
     * automatically detected and this parameter is optional.</p> <p>This parameter is
     * not supported if the target type of the target group is
     * <code>instance</code>.</p>
     */
    inline TargetDescription& WithAvailabilityZone(const char* value) { SetAvailabilityZone(value); return *this;}

  private:

    Aws::String m_id;
    bool m_idHasBeenSet;

    int m_port;
    bool m_portHasBeenSet;

    Aws::String m_availabilityZone;
    bool m_availabilityZoneHasBeenSet;
  };

} // namespace Model
} // namespace ElasticLoadBalancingv2
} // namespace Aws
