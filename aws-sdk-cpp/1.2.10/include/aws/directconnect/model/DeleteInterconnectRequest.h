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
   * <p>Container for the parameters to the DeleteInterconnect
   * operation.</p><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/directconnect-2012-10-25/DeleteInterconnectRequest">AWS
   * API Reference</a></p>
   */
  class AWS_DIRECTCONNECT_API DeleteInterconnectRequest : public DirectConnectRequest
  {
  public:
    DeleteInterconnectRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "DeleteInterconnect"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    
    inline const Aws::String& GetInterconnectId() const{ return m_interconnectId; }

    
    inline void SetInterconnectId(const Aws::String& value) { m_interconnectIdHasBeenSet = true; m_interconnectId = value; }

    
    inline void SetInterconnectId(Aws::String&& value) { m_interconnectIdHasBeenSet = true; m_interconnectId = std::move(value); }

    
    inline void SetInterconnectId(const char* value) { m_interconnectIdHasBeenSet = true; m_interconnectId.assign(value); }

    
    inline DeleteInterconnectRequest& WithInterconnectId(const Aws::String& value) { SetInterconnectId(value); return *this;}

    
    inline DeleteInterconnectRequest& WithInterconnectId(Aws::String&& value) { SetInterconnectId(std::move(value)); return *this;}

    
    inline DeleteInterconnectRequest& WithInterconnectId(const char* value) { SetInterconnectId(value); return *this;}

  private:

    Aws::String m_interconnectId;
    bool m_interconnectIdHasBeenSet;
  };

} // namespace Model
} // namespace DirectConnect
} // namespace Aws
