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
#include <aws/cloudhsmv2/CloudHSMV2_EXPORTS.h>
#include <aws/core/utils/memory/stl/AWSString.h>

namespace Aws
{
namespace CloudHSMV2
{
namespace Model
{
  enum class ClusterState
  {
    NOT_SET,
    CREATE_IN_PROGRESS,
    UNINITIALIZED,
    INITIALIZE_IN_PROGRESS,
    INITIALIZED,
    ACTIVE,
    UPDATE_IN_PROGRESS,
    DELETE_IN_PROGRESS,
    DELETED,
    DEGRADED
  };

namespace ClusterStateMapper
{
AWS_CLOUDHSMV2_API ClusterState GetClusterStateForName(const Aws::String& name);

AWS_CLOUDHSMV2_API Aws::String GetNameForClusterState(ClusterState value);
} // namespace ClusterStateMapper
} // namespace Model
} // namespace CloudHSMV2
} // namespace Aws
