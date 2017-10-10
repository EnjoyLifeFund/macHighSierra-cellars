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
#include <aws/events/CloudWatchEvents_EXPORTS.h>
#include <aws/events/CloudWatchEventsRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <aws/core/utils/memory/stl/AWSVector.h>
#include <utility>

namespace Aws
{
namespace CloudWatchEvents
{
namespace Model
{

  /**
   */
  class AWS_CLOUDWATCHEVENTS_API RemoveTargetsRequest : public CloudWatchEventsRequest
  {
  public:
    RemoveTargetsRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "RemoveTargets"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>The name of the rule.</p>
     */
    inline const Aws::String& GetRule() const{ return m_rule; }

    /**
     * <p>The name of the rule.</p>
     */
    inline void SetRule(const Aws::String& value) { m_ruleHasBeenSet = true; m_rule = value; }

    /**
     * <p>The name of the rule.</p>
     */
    inline void SetRule(Aws::String&& value) { m_ruleHasBeenSet = true; m_rule = std::move(value); }

    /**
     * <p>The name of the rule.</p>
     */
    inline void SetRule(const char* value) { m_ruleHasBeenSet = true; m_rule.assign(value); }

    /**
     * <p>The name of the rule.</p>
     */
    inline RemoveTargetsRequest& WithRule(const Aws::String& value) { SetRule(value); return *this;}

    /**
     * <p>The name of the rule.</p>
     */
    inline RemoveTargetsRequest& WithRule(Aws::String&& value) { SetRule(std::move(value)); return *this;}

    /**
     * <p>The name of the rule.</p>
     */
    inline RemoveTargetsRequest& WithRule(const char* value) { SetRule(value); return *this;}


    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline const Aws::Vector<Aws::String>& GetIds() const{ return m_ids; }

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline void SetIds(const Aws::Vector<Aws::String>& value) { m_idsHasBeenSet = true; m_ids = value; }

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline void SetIds(Aws::Vector<Aws::String>&& value) { m_idsHasBeenSet = true; m_ids = std::move(value); }

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline RemoveTargetsRequest& WithIds(const Aws::Vector<Aws::String>& value) { SetIds(value); return *this;}

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline RemoveTargetsRequest& WithIds(Aws::Vector<Aws::String>&& value) { SetIds(std::move(value)); return *this;}

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline RemoveTargetsRequest& AddIds(const Aws::String& value) { m_idsHasBeenSet = true; m_ids.push_back(value); return *this; }

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline RemoveTargetsRequest& AddIds(Aws::String&& value) { m_idsHasBeenSet = true; m_ids.push_back(std::move(value)); return *this; }

    /**
     * <p>The IDs of the targets to remove from the rule.</p>
     */
    inline RemoveTargetsRequest& AddIds(const char* value) { m_idsHasBeenSet = true; m_ids.push_back(value); return *this; }

  private:

    Aws::String m_rule;
    bool m_ruleHasBeenSet;

    Aws::Vector<Aws::String> m_ids;
    bool m_idsHasBeenSet;
  };

} // namespace Model
} // namespace CloudWatchEvents
} // namespace Aws
