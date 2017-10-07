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
#include <aws/glue/Glue_EXPORTS.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <aws/core/utils/memory/stl/AWSVector.h>
#include <aws/core/utils/DateTime.h>
#include <utility>

namespace Aws
{
namespace Utils
{
namespace Json
{
  class JsonValue;
} // namespace Json
} // namespace Utils
namespace Glue
{
namespace Model
{

  /**
   * <p>A development endpoint where a developer can remotely debug ETL
   * scripts.</p><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/glue-2017-03-31/DevEndpoint">AWS
   * API Reference</a></p>
   */
  class AWS_GLUE_API DevEndpoint
  {
  public:
    DevEndpoint();
    DevEndpoint(const Aws::Utils::Json::JsonValue& jsonValue);
    DevEndpoint& operator=(const Aws::Utils::Json::JsonValue& jsonValue);
    Aws::Utils::Json::JsonValue Jsonize() const;


    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline const Aws::String& GetEndpointName() const{ return m_endpointName; }

    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline void SetEndpointName(const Aws::String& value) { m_endpointNameHasBeenSet = true; m_endpointName = value; }

    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline void SetEndpointName(Aws::String&& value) { m_endpointNameHasBeenSet = true; m_endpointName = std::move(value); }

    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline void SetEndpointName(const char* value) { m_endpointNameHasBeenSet = true; m_endpointName.assign(value); }

    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline DevEndpoint& WithEndpointName(const Aws::String& value) { SetEndpointName(value); return *this;}

    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline DevEndpoint& WithEndpointName(Aws::String&& value) { SetEndpointName(std::move(value)); return *this;}

    /**
     * <p>The name of the DevEndpoint.</p>
     */
    inline DevEndpoint& WithEndpointName(const char* value) { SetEndpointName(value); return *this;}


    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline const Aws::String& GetRoleArn() const{ return m_roleArn; }

    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline void SetRoleArn(const Aws::String& value) { m_roleArnHasBeenSet = true; m_roleArn = value; }

    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline void SetRoleArn(Aws::String&& value) { m_roleArnHasBeenSet = true; m_roleArn = std::move(value); }

    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline void SetRoleArn(const char* value) { m_roleArnHasBeenSet = true; m_roleArn.assign(value); }

    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithRoleArn(const Aws::String& value) { SetRoleArn(value); return *this;}

    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithRoleArn(Aws::String&& value) { SetRoleArn(std::move(value)); return *this;}

    /**
     * <p>The AWS ARN of the IAM role used in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithRoleArn(const char* value) { SetRoleArn(value); return *this;}


    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline const Aws::Vector<Aws::String>& GetSecurityGroupIds() const{ return m_securityGroupIds; }

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline void SetSecurityGroupIds(const Aws::Vector<Aws::String>& value) { m_securityGroupIdsHasBeenSet = true; m_securityGroupIds = value; }

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline void SetSecurityGroupIds(Aws::Vector<Aws::String>&& value) { m_securityGroupIdsHasBeenSet = true; m_securityGroupIds = std::move(value); }

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithSecurityGroupIds(const Aws::Vector<Aws::String>& value) { SetSecurityGroupIds(value); return *this;}

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithSecurityGroupIds(Aws::Vector<Aws::String>&& value) { SetSecurityGroupIds(std::move(value)); return *this;}

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline DevEndpoint& AddSecurityGroupIds(const Aws::String& value) { m_securityGroupIdsHasBeenSet = true; m_securityGroupIds.push_back(value); return *this; }

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline DevEndpoint& AddSecurityGroupIds(Aws::String&& value) { m_securityGroupIdsHasBeenSet = true; m_securityGroupIds.push_back(std::move(value)); return *this; }

    /**
     * <p>A list of security group identifiers used in this DevEndpoint.</p>
     */
    inline DevEndpoint& AddSecurityGroupIds(const char* value) { m_securityGroupIdsHasBeenSet = true; m_securityGroupIds.push_back(value); return *this; }


    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline const Aws::String& GetSubnetId() const{ return m_subnetId; }

    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline void SetSubnetId(const Aws::String& value) { m_subnetIdHasBeenSet = true; m_subnetId = value; }

    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline void SetSubnetId(Aws::String&& value) { m_subnetIdHasBeenSet = true; m_subnetId = std::move(value); }

    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline void SetSubnetId(const char* value) { m_subnetIdHasBeenSet = true; m_subnetId.assign(value); }

    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline DevEndpoint& WithSubnetId(const Aws::String& value) { SetSubnetId(value); return *this;}

    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline DevEndpoint& WithSubnetId(Aws::String&& value) { SetSubnetId(std::move(value)); return *this;}

    /**
     * <p>The subnet ID for this DevEndpoint.</p>
     */
    inline DevEndpoint& WithSubnetId(const char* value) { SetSubnetId(value); return *this;}


    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline const Aws::String& GetYarnEndpointAddress() const{ return m_yarnEndpointAddress; }

    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline void SetYarnEndpointAddress(const Aws::String& value) { m_yarnEndpointAddressHasBeenSet = true; m_yarnEndpointAddress = value; }

    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline void SetYarnEndpointAddress(Aws::String&& value) { m_yarnEndpointAddressHasBeenSet = true; m_yarnEndpointAddress = std::move(value); }

    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline void SetYarnEndpointAddress(const char* value) { m_yarnEndpointAddressHasBeenSet = true; m_yarnEndpointAddress.assign(value); }

    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithYarnEndpointAddress(const Aws::String& value) { SetYarnEndpointAddress(value); return *this;}

    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithYarnEndpointAddress(Aws::String&& value) { SetYarnEndpointAddress(std::move(value)); return *this;}

    /**
     * <p>The YARN endpoint address used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithYarnEndpointAddress(const char* value) { SetYarnEndpointAddress(value); return *this;}


    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline const Aws::String& GetPublicAddress() const{ return m_publicAddress; }

    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline void SetPublicAddress(const Aws::String& value) { m_publicAddressHasBeenSet = true; m_publicAddress = value; }

    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline void SetPublicAddress(Aws::String&& value) { m_publicAddressHasBeenSet = true; m_publicAddress = std::move(value); }

    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline void SetPublicAddress(const char* value) { m_publicAddressHasBeenSet = true; m_publicAddress.assign(value); }

    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithPublicAddress(const Aws::String& value) { SetPublicAddress(value); return *this;}

    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithPublicAddress(Aws::String&& value) { SetPublicAddress(std::move(value)); return *this;}

    /**
     * <p>The public address used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithPublicAddress(const char* value) { SetPublicAddress(value); return *this;}


    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline const Aws::String& GetStatus() const{ return m_status; }

    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline void SetStatus(const Aws::String& value) { m_statusHasBeenSet = true; m_status = value; }

    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline void SetStatus(Aws::String&& value) { m_statusHasBeenSet = true; m_status = std::move(value); }

    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline void SetStatus(const char* value) { m_statusHasBeenSet = true; m_status.assign(value); }

    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline DevEndpoint& WithStatus(const Aws::String& value) { SetStatus(value); return *this;}

    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline DevEndpoint& WithStatus(Aws::String&& value) { SetStatus(std::move(value)); return *this;}

    /**
     * <p>The current status of this DevEndpoint.</p>
     */
    inline DevEndpoint& WithStatus(const char* value) { SetStatus(value); return *this;}


    /**
     * <p>The number of nodes used by this DevEndpoint.</p>
     */
    inline int GetNumberOfNodes() const{ return m_numberOfNodes; }

    /**
     * <p>The number of nodes used by this DevEndpoint.</p>
     */
    inline void SetNumberOfNodes(int value) { m_numberOfNodesHasBeenSet = true; m_numberOfNodes = value; }

    /**
     * <p>The number of nodes used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithNumberOfNodes(int value) { SetNumberOfNodes(value); return *this;}


    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline const Aws::String& GetAvailabilityZone() const{ return m_availabilityZone; }

    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline void SetAvailabilityZone(const Aws::String& value) { m_availabilityZoneHasBeenSet = true; m_availabilityZone = value; }

    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline void SetAvailabilityZone(Aws::String&& value) { m_availabilityZoneHasBeenSet = true; m_availabilityZone = std::move(value); }

    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline void SetAvailabilityZone(const char* value) { m_availabilityZoneHasBeenSet = true; m_availabilityZone.assign(value); }

    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline DevEndpoint& WithAvailabilityZone(const Aws::String& value) { SetAvailabilityZone(value); return *this;}

    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline DevEndpoint& WithAvailabilityZone(Aws::String&& value) { SetAvailabilityZone(std::move(value)); return *this;}

    /**
     * <p>The AWS availability zone where this DevEndpoint is located.</p>
     */
    inline DevEndpoint& WithAvailabilityZone(const char* value) { SetAvailabilityZone(value); return *this;}


    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline const Aws::String& GetVpcId() const{ return m_vpcId; }

    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline void SetVpcId(const Aws::String& value) { m_vpcIdHasBeenSet = true; m_vpcId = value; }

    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline void SetVpcId(Aws::String&& value) { m_vpcIdHasBeenSet = true; m_vpcId = std::move(value); }

    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline void SetVpcId(const char* value) { m_vpcIdHasBeenSet = true; m_vpcId.assign(value); }

    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithVpcId(const Aws::String& value) { SetVpcId(value); return *this;}

    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithVpcId(Aws::String&& value) { SetVpcId(std::move(value)); return *this;}

    /**
     * <p>The ID of the virtual private cloud (VPC) used by this DevEndpoint.</p>
     */
    inline DevEndpoint& WithVpcId(const char* value) { SetVpcId(value); return *this;}


    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline const Aws::String& GetExtraPythonLibsS3Path() const{ return m_extraPythonLibsS3Path; }

    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline void SetExtraPythonLibsS3Path(const Aws::String& value) { m_extraPythonLibsS3PathHasBeenSet = true; m_extraPythonLibsS3Path = value; }

    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline void SetExtraPythonLibsS3Path(Aws::String&& value) { m_extraPythonLibsS3PathHasBeenSet = true; m_extraPythonLibsS3Path = std::move(value); }

    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline void SetExtraPythonLibsS3Path(const char* value) { m_extraPythonLibsS3PathHasBeenSet = true; m_extraPythonLibsS3Path.assign(value); }

    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline DevEndpoint& WithExtraPythonLibsS3Path(const Aws::String& value) { SetExtraPythonLibsS3Path(value); return *this;}

    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline DevEndpoint& WithExtraPythonLibsS3Path(Aws::String&& value) { SetExtraPythonLibsS3Path(std::move(value)); return *this;}

    /**
     * <p>Path to one or more Python libraries in an S3 bucket that should be loaded in
     * your DevEndpoint.</p>
     */
    inline DevEndpoint& WithExtraPythonLibsS3Path(const char* value) { SetExtraPythonLibsS3Path(value); return *this;}


    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline const Aws::String& GetExtraJarsS3Path() const{ return m_extraJarsS3Path; }

    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline void SetExtraJarsS3Path(const Aws::String& value) { m_extraJarsS3PathHasBeenSet = true; m_extraJarsS3Path = value; }

    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline void SetExtraJarsS3Path(Aws::String&& value) { m_extraJarsS3PathHasBeenSet = true; m_extraJarsS3Path = std::move(value); }

    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline void SetExtraJarsS3Path(const char* value) { m_extraJarsS3PathHasBeenSet = true; m_extraJarsS3Path.assign(value); }

    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline DevEndpoint& WithExtraJarsS3Path(const Aws::String& value) { SetExtraJarsS3Path(value); return *this;}

    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline DevEndpoint& WithExtraJarsS3Path(Aws::String&& value) { SetExtraJarsS3Path(std::move(value)); return *this;}

    /**
     * <p>Path to one or more Java Jars in an S3 bucket that should be loaded in your
     * DevEndpoint.</p>
     */
    inline DevEndpoint& WithExtraJarsS3Path(const char* value) { SetExtraJarsS3Path(value); return *this;}


    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline const Aws::String& GetFailureReason() const{ return m_failureReason; }

    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline void SetFailureReason(const Aws::String& value) { m_failureReasonHasBeenSet = true; m_failureReason = value; }

    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline void SetFailureReason(Aws::String&& value) { m_failureReasonHasBeenSet = true; m_failureReason = std::move(value); }

    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline void SetFailureReason(const char* value) { m_failureReasonHasBeenSet = true; m_failureReason.assign(value); }

    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithFailureReason(const Aws::String& value) { SetFailureReason(value); return *this;}

    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithFailureReason(Aws::String&& value) { SetFailureReason(std::move(value)); return *this;}

    /**
     * <p>The reason for a current failure in this DevEndpoint.</p>
     */
    inline DevEndpoint& WithFailureReason(const char* value) { SetFailureReason(value); return *this;}


    /**
     * <p>The status of the last update.</p>
     */
    inline const Aws::String& GetLastUpdateStatus() const{ return m_lastUpdateStatus; }

    /**
     * <p>The status of the last update.</p>
     */
    inline void SetLastUpdateStatus(const Aws::String& value) { m_lastUpdateStatusHasBeenSet = true; m_lastUpdateStatus = value; }

    /**
     * <p>The status of the last update.</p>
     */
    inline void SetLastUpdateStatus(Aws::String&& value) { m_lastUpdateStatusHasBeenSet = true; m_lastUpdateStatus = std::move(value); }

    /**
     * <p>The status of the last update.</p>
     */
    inline void SetLastUpdateStatus(const char* value) { m_lastUpdateStatusHasBeenSet = true; m_lastUpdateStatus.assign(value); }

    /**
     * <p>The status of the last update.</p>
     */
    inline DevEndpoint& WithLastUpdateStatus(const Aws::String& value) { SetLastUpdateStatus(value); return *this;}

    /**
     * <p>The status of the last update.</p>
     */
    inline DevEndpoint& WithLastUpdateStatus(Aws::String&& value) { SetLastUpdateStatus(std::move(value)); return *this;}

    /**
     * <p>The status of the last update.</p>
     */
    inline DevEndpoint& WithLastUpdateStatus(const char* value) { SetLastUpdateStatus(value); return *this;}


    /**
     * <p>The point in time at which this DevEndpoint was created.</p>
     */
    inline const Aws::Utils::DateTime& GetCreatedTimestamp() const{ return m_createdTimestamp; }

    /**
     * <p>The point in time at which this DevEndpoint was created.</p>
     */
    inline void SetCreatedTimestamp(const Aws::Utils::DateTime& value) { m_createdTimestampHasBeenSet = true; m_createdTimestamp = value; }

    /**
     * <p>The point in time at which this DevEndpoint was created.</p>
     */
    inline void SetCreatedTimestamp(Aws::Utils::DateTime&& value) { m_createdTimestampHasBeenSet = true; m_createdTimestamp = std::move(value); }

    /**
     * <p>The point in time at which this DevEndpoint was created.</p>
     */
    inline DevEndpoint& WithCreatedTimestamp(const Aws::Utils::DateTime& value) { SetCreatedTimestamp(value); return *this;}

    /**
     * <p>The point in time at which this DevEndpoint was created.</p>
     */
    inline DevEndpoint& WithCreatedTimestamp(Aws::Utils::DateTime&& value) { SetCreatedTimestamp(std::move(value)); return *this;}


    /**
     * <p>The point in time at which this DevEndpoint was last modified.</p>
     */
    inline const Aws::Utils::DateTime& GetLastModifiedTimestamp() const{ return m_lastModifiedTimestamp; }

    /**
     * <p>The point in time at which this DevEndpoint was last modified.</p>
     */
    inline void SetLastModifiedTimestamp(const Aws::Utils::DateTime& value) { m_lastModifiedTimestampHasBeenSet = true; m_lastModifiedTimestamp = value; }

    /**
     * <p>The point in time at which this DevEndpoint was last modified.</p>
     */
    inline void SetLastModifiedTimestamp(Aws::Utils::DateTime&& value) { m_lastModifiedTimestampHasBeenSet = true; m_lastModifiedTimestamp = std::move(value); }

    /**
     * <p>The point in time at which this DevEndpoint was last modified.</p>
     */
    inline DevEndpoint& WithLastModifiedTimestamp(const Aws::Utils::DateTime& value) { SetLastModifiedTimestamp(value); return *this;}

    /**
     * <p>The point in time at which this DevEndpoint was last modified.</p>
     */
    inline DevEndpoint& WithLastModifiedTimestamp(Aws::Utils::DateTime&& value) { SetLastModifiedTimestamp(std::move(value)); return *this;}


    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline const Aws::String& GetPublicKey() const{ return m_publicKey; }

    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline void SetPublicKey(const Aws::String& value) { m_publicKeyHasBeenSet = true; m_publicKey = value; }

    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline void SetPublicKey(Aws::String&& value) { m_publicKeyHasBeenSet = true; m_publicKey = std::move(value); }

    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline void SetPublicKey(const char* value) { m_publicKeyHasBeenSet = true; m_publicKey.assign(value); }

    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline DevEndpoint& WithPublicKey(const Aws::String& value) { SetPublicKey(value); return *this;}

    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline DevEndpoint& WithPublicKey(Aws::String&& value) { SetPublicKey(std::move(value)); return *this;}

    /**
     * <p>The public key to be used by this DevEndpoint for authentication.</p>
     */
    inline DevEndpoint& WithPublicKey(const char* value) { SetPublicKey(value); return *this;}

  private:

    Aws::String m_endpointName;
    bool m_endpointNameHasBeenSet;

    Aws::String m_roleArn;
    bool m_roleArnHasBeenSet;

    Aws::Vector<Aws::String> m_securityGroupIds;
    bool m_securityGroupIdsHasBeenSet;

    Aws::String m_subnetId;
    bool m_subnetIdHasBeenSet;

    Aws::String m_yarnEndpointAddress;
    bool m_yarnEndpointAddressHasBeenSet;

    Aws::String m_publicAddress;
    bool m_publicAddressHasBeenSet;

    Aws::String m_status;
    bool m_statusHasBeenSet;

    int m_numberOfNodes;
    bool m_numberOfNodesHasBeenSet;

    Aws::String m_availabilityZone;
    bool m_availabilityZoneHasBeenSet;

    Aws::String m_vpcId;
    bool m_vpcIdHasBeenSet;

    Aws::String m_extraPythonLibsS3Path;
    bool m_extraPythonLibsS3PathHasBeenSet;

    Aws::String m_extraJarsS3Path;
    bool m_extraJarsS3PathHasBeenSet;

    Aws::String m_failureReason;
    bool m_failureReasonHasBeenSet;

    Aws::String m_lastUpdateStatus;
    bool m_lastUpdateStatusHasBeenSet;

    Aws::Utils::DateTime m_createdTimestamp;
    bool m_createdTimestampHasBeenSet;

    Aws::Utils::DateTime m_lastModifiedTimestamp;
    bool m_lastModifiedTimestampHasBeenSet;

    Aws::String m_publicKey;
    bool m_publicKeyHasBeenSet;
  };

} // namespace Model
} // namespace Glue
} // namespace Aws
