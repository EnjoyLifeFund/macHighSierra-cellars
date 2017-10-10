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
#include <aws/pinpoint/Pinpoint_EXPORTS.h>
#include <aws/pinpoint/model/ApplicationSettingsResource.h>
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
namespace Pinpoint
{
namespace Model
{
  class AWS_PINPOINT_API GetApplicationSettingsResult
  {
  public:
    GetApplicationSettingsResult();
    GetApplicationSettingsResult(const Aws::AmazonWebServiceResult<Aws::Utils::Json::JsonValue>& result);
    GetApplicationSettingsResult& operator=(const Aws::AmazonWebServiceResult<Aws::Utils::Json::JsonValue>& result);


    
    inline const ApplicationSettingsResource& GetApplicationSettingsResource() const{ return m_applicationSettingsResource; }

    
    inline void SetApplicationSettingsResource(const ApplicationSettingsResource& value) { m_applicationSettingsResource = value; }

    
    inline void SetApplicationSettingsResource(ApplicationSettingsResource&& value) { m_applicationSettingsResource = std::move(value); }

    
    inline GetApplicationSettingsResult& WithApplicationSettingsResource(const ApplicationSettingsResource& value) { SetApplicationSettingsResource(value); return *this;}

    
    inline GetApplicationSettingsResult& WithApplicationSettingsResource(ApplicationSettingsResource&& value) { SetApplicationSettingsResource(std::move(value)); return *this;}

  private:

    ApplicationSettingsResource m_applicationSettingsResource;
  };

} // namespace Model
} // namespace Pinpoint
} // namespace Aws
