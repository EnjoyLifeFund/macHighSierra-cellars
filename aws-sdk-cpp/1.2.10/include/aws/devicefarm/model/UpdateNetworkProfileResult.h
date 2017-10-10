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
#include <aws/devicefarm/DeviceFarm_EXPORTS.h>
#include <aws/devicefarm/model/NetworkProfile.h>
#include <utility>

namespace Aws
{
template<typename RESULT_TYPE>
class AmazonWebServiceResult;

namespace Utils
{
namespace Json
{
  class JsonValue;
} // namespace Json
} // namespace Utils
namespace DeviceFarm
{
namespace Model
{
  class AWS_DEVICEFARM_API UpdateNetworkProfileResult
  {
  public:
    UpdateNetworkProfileResult();
    UpdateNetworkProfileResult(const Aws::AmazonWebServiceResult<Aws::Utils::Json::JsonValue>& result);
    UpdateNetworkProfileResult& operator=(const Aws::AmazonWebServiceResult<Aws::Utils::Json::JsonValue>& result);


    /**
     * <p>A list of the available network profiles.</p>
     */
    inline const NetworkProfile& GetNetworkProfile() const{ return m_networkProfile; }

    /**
     * <p>A list of the available network profiles.</p>
     */
    inline void SetNetworkProfile(const NetworkProfile& value) { m_networkProfile = value; }

    /**
     * <p>A list of the available network profiles.</p>
     */
    inline void SetNetworkProfile(NetworkProfile&& value) { m_networkProfile = std::move(value); }

    /**
     * <p>A list of the available network profiles.</p>
     */
    inline UpdateNetworkProfileResult& WithNetworkProfile(const NetworkProfile& value) { SetNetworkProfile(value); return *this;}

    /**
     * <p>A list of the available network profiles.</p>
     */
    inline UpdateNetworkProfileResult& WithNetworkProfile(NetworkProfile&& value) { SetNetworkProfile(std::move(value)); return *this;}

  private:

    NetworkProfile m_networkProfile;
  };

} // namespace Model
} // namespace DeviceFarm
} // namespace Aws
