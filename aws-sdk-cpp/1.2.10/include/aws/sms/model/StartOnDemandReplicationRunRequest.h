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
#include <aws/sms/SMS_EXPORTS.h>
#include <aws/sms/SMSRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace SMS
{
namespace Model
{

  /**
   */
  class AWS_SMS_API StartOnDemandReplicationRunRequest : public SMSRequest
  {
  public:
    StartOnDemandReplicationRunRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "StartOnDemandReplicationRun"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    
    inline const Aws::String& GetReplicationJobId() const{ return m_replicationJobId; }

    
    inline void SetReplicationJobId(const Aws::String& value) { m_replicationJobIdHasBeenSet = true; m_replicationJobId = value; }

    
    inline void SetReplicationJobId(Aws::String&& value) { m_replicationJobIdHasBeenSet = true; m_replicationJobId = std::move(value); }

    
    inline void SetReplicationJobId(const char* value) { m_replicationJobIdHasBeenSet = true; m_replicationJobId.assign(value); }

    
    inline StartOnDemandReplicationRunRequest& WithReplicationJobId(const Aws::String& value) { SetReplicationJobId(value); return *this;}

    
    inline StartOnDemandReplicationRunRequest& WithReplicationJobId(Aws::String&& value) { SetReplicationJobId(std::move(value)); return *this;}

    
    inline StartOnDemandReplicationRunRequest& WithReplicationJobId(const char* value) { SetReplicationJobId(value); return *this;}


    
    inline const Aws::String& GetDescription() const{ return m_description; }

    
    inline void SetDescription(const Aws::String& value) { m_descriptionHasBeenSet = true; m_description = value; }

    
    inline void SetDescription(Aws::String&& value) { m_descriptionHasBeenSet = true; m_description = std::move(value); }

    
    inline void SetDescription(const char* value) { m_descriptionHasBeenSet = true; m_description.assign(value); }

    
    inline StartOnDemandReplicationRunRequest& WithDescription(const Aws::String& value) { SetDescription(value); return *this;}

    
    inline StartOnDemandReplicationRunRequest& WithDescription(Aws::String&& value) { SetDescription(std::move(value)); return *this;}

    
    inline StartOnDemandReplicationRunRequest& WithDescription(const char* value) { SetDescription(value); return *this;}

  private:

    Aws::String m_replicationJobId;
    bool m_replicationJobIdHasBeenSet;

    Aws::String m_description;
    bool m_descriptionHasBeenSet;
  };

} // namespace Model
} // namespace SMS
} // namespace Aws
