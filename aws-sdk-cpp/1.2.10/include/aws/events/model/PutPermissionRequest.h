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
#include <utility>

namespace Aws
{
namespace CloudWatchEvents
{
namespace Model
{

  /**
   */
  class AWS_CLOUDWATCHEVENTS_API PutPermissionRequest : public CloudWatchEventsRequest
  {
  public:
    PutPermissionRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "PutPermission"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline const Aws::String& GetAction() const{ return m_action; }

    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline void SetAction(const Aws::String& value) { m_actionHasBeenSet = true; m_action = value; }

    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline void SetAction(Aws::String&& value) { m_actionHasBeenSet = true; m_action = std::move(value); }

    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline void SetAction(const char* value) { m_actionHasBeenSet = true; m_action.assign(value); }

    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline PutPermissionRequest& WithAction(const Aws::String& value) { SetAction(value); return *this;}

    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline PutPermissionRequest& WithAction(Aws::String&& value) { SetAction(std::move(value)); return *this;}

    /**
     * <p>The action that you are enabling the other account to perform. Currently,
     * this must be <code>events:PutEvents</code>.</p>
     */
    inline PutPermissionRequest& WithAction(const char* value) { SetAction(value); return *this;}


    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline const Aws::String& GetPrincipal() const{ return m_principal; }

    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline void SetPrincipal(const Aws::String& value) { m_principalHasBeenSet = true; m_principal = value; }

    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline void SetPrincipal(Aws::String&& value) { m_principalHasBeenSet = true; m_principal = std::move(value); }

    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline void SetPrincipal(const char* value) { m_principalHasBeenSet = true; m_principal.assign(value); }

    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline PutPermissionRequest& WithPrincipal(const Aws::String& value) { SetPrincipal(value); return *this;}

    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline PutPermissionRequest& WithPrincipal(Aws::String&& value) { SetPrincipal(std::move(value)); return *this;}

    /**
     * <p>The 12-digit AWS account ID that you are permitting to put events to your
     * default event bus. Specify "*" to permit any account to put events to your
     * default event bus.</p> <p>If you specify "*", avoid creating rules that may
     * match undesirable events. To create more secure rules, make sure that the event
     * pattern for each rule contains an <code>account</code> field with a specific
     * account ID from which to receive events. Rules with an account field do not
     * match any events sent from other accounts.</p>
     */
    inline PutPermissionRequest& WithPrincipal(const char* value) { SetPrincipal(value); return *this;}


    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline const Aws::String& GetStatementId() const{ return m_statementId; }

    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline void SetStatementId(const Aws::String& value) { m_statementIdHasBeenSet = true; m_statementId = value; }

    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline void SetStatementId(Aws::String&& value) { m_statementIdHasBeenSet = true; m_statementId = std::move(value); }

    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline void SetStatementId(const char* value) { m_statementIdHasBeenSet = true; m_statementId.assign(value); }

    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline PutPermissionRequest& WithStatementId(const Aws::String& value) { SetStatementId(value); return *this;}

    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline PutPermissionRequest& WithStatementId(Aws::String&& value) { SetStatementId(std::move(value)); return *this;}

    /**
     * <p>An identifier string for the external account that you are granting
     * permissions to. If you later want to revoke the permission for this external
     * account, specify this <code>StatementId</code> when you run
     * <a>RemovePermission</a>.</p>
     */
    inline PutPermissionRequest& WithStatementId(const char* value) { SetStatementId(value); return *this;}

  private:

    Aws::String m_action;
    bool m_actionHasBeenSet;

    Aws::String m_principal;
    bool m_principalHasBeenSet;

    Aws::String m_statementId;
    bool m_statementIdHasBeenSet;
  };

} // namespace Model
} // namespace CloudWatchEvents
} // namespace Aws
