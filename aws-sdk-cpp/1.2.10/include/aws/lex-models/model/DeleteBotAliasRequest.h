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
#include <aws/lex-models/LexModelBuildingService_EXPORTS.h>
#include <aws/lex-models/LexModelBuildingServiceRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace LexModelBuildingService
{
namespace Model
{

  /**
   */
  class AWS_LEXMODELBUILDINGSERVICE_API DeleteBotAliasRequest : public LexModelBuildingServiceRequest
  {
  public:
    DeleteBotAliasRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "DeleteBotAlias"; }

    Aws::String SerializePayload() const override;


    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline const Aws::String& GetName() const{ return m_name; }

    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline void SetName(const Aws::String& value) { m_nameHasBeenSet = true; m_name = value; }

    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline void SetName(Aws::String&& value) { m_nameHasBeenSet = true; m_name = std::move(value); }

    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline void SetName(const char* value) { m_nameHasBeenSet = true; m_name.assign(value); }

    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline DeleteBotAliasRequest& WithName(const Aws::String& value) { SetName(value); return *this;}

    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline DeleteBotAliasRequest& WithName(Aws::String&& value) { SetName(std::move(value)); return *this;}

    /**
     * <p>The name of the alias to delete. The name is case sensitive. </p>
     */
    inline DeleteBotAliasRequest& WithName(const char* value) { SetName(value); return *this;}


    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline const Aws::String& GetBotName() const{ return m_botName; }

    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline void SetBotName(const Aws::String& value) { m_botNameHasBeenSet = true; m_botName = value; }

    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline void SetBotName(Aws::String&& value) { m_botNameHasBeenSet = true; m_botName = std::move(value); }

    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline void SetBotName(const char* value) { m_botNameHasBeenSet = true; m_botName.assign(value); }

    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline DeleteBotAliasRequest& WithBotName(const Aws::String& value) { SetBotName(value); return *this;}

    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline DeleteBotAliasRequest& WithBotName(Aws::String&& value) { SetBotName(std::move(value)); return *this;}

    /**
     * <p>The name of the bot that the alias points to.</p>
     */
    inline DeleteBotAliasRequest& WithBotName(const char* value) { SetBotName(value); return *this;}

  private:

    Aws::String m_name;
    bool m_nameHasBeenSet;

    Aws::String m_botName;
    bool m_botNameHasBeenSet;
  };

} // namespace Model
} // namespace LexModelBuildingService
} // namespace Aws
