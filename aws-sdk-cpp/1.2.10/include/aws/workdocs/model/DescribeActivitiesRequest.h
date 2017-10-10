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
#include <aws/workdocs/WorkDocs_EXPORTS.h>
#include <aws/workdocs/WorkDocsRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <aws/core/utils/DateTime.h>
#include <utility>

namespace Aws
{
namespace Http
{
    class URI;
} //namespace Http
namespace WorkDocs
{
namespace Model
{

  /**
   */
  class AWS_WORKDOCS_API DescribeActivitiesRequest : public WorkDocsRequest
  {
  public:
    DescribeActivitiesRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "DescribeActivities"; }

    Aws::String SerializePayload() const override;

    void AddQueryStringParameters(Aws::Http::URI& uri) const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline const Aws::String& GetAuthenticationToken() const{ return m_authenticationToken; }

    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline void SetAuthenticationToken(const Aws::String& value) { m_authenticationTokenHasBeenSet = true; m_authenticationToken = value; }

    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline void SetAuthenticationToken(Aws::String&& value) { m_authenticationTokenHasBeenSet = true; m_authenticationToken = std::move(value); }

    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline void SetAuthenticationToken(const char* value) { m_authenticationTokenHasBeenSet = true; m_authenticationToken.assign(value); }

    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline DescribeActivitiesRequest& WithAuthenticationToken(const Aws::String& value) { SetAuthenticationToken(value); return *this;}

    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline DescribeActivitiesRequest& WithAuthenticationToken(Aws::String&& value) { SetAuthenticationToken(std::move(value)); return *this;}

    /**
     * <p>Amazon WorkDocs authentication token. This field should not be set when using
     * administrative API actions, as in accessing the API using AWS credentials.</p>
     */
    inline DescribeActivitiesRequest& WithAuthenticationToken(const char* value) { SetAuthenticationToken(value); return *this;}


    /**
     * <p>The timestamp that determines the starting time of the activities; the
     * response includes the activities performed after the specified timestamp.</p>
     */
    inline const Aws::Utils::DateTime& GetStartTime() const{ return m_startTime; }

    /**
     * <p>The timestamp that determines the starting time of the activities; the
     * response includes the activities performed after the specified timestamp.</p>
     */
    inline void SetStartTime(const Aws::Utils::DateTime& value) { m_startTimeHasBeenSet = true; m_startTime = value; }

    /**
     * <p>The timestamp that determines the starting time of the activities; the
     * response includes the activities performed after the specified timestamp.</p>
     */
    inline void SetStartTime(Aws::Utils::DateTime&& value) { m_startTimeHasBeenSet = true; m_startTime = std::move(value); }

    /**
     * <p>The timestamp that determines the starting time of the activities; the
     * response includes the activities performed after the specified timestamp.</p>
     */
    inline DescribeActivitiesRequest& WithStartTime(const Aws::Utils::DateTime& value) { SetStartTime(value); return *this;}

    /**
     * <p>The timestamp that determines the starting time of the activities; the
     * response includes the activities performed after the specified timestamp.</p>
     */
    inline DescribeActivitiesRequest& WithStartTime(Aws::Utils::DateTime&& value) { SetStartTime(std::move(value)); return *this;}


    /**
     * <p>The timestamp that determines the end time of the activities; the response
     * includes the activities performed before the specified timestamp.</p>
     */
    inline const Aws::Utils::DateTime& GetEndTime() const{ return m_endTime; }

    /**
     * <p>The timestamp that determines the end time of the activities; the response
     * includes the activities performed before the specified timestamp.</p>
     */
    inline void SetEndTime(const Aws::Utils::DateTime& value) { m_endTimeHasBeenSet = true; m_endTime = value; }

    /**
     * <p>The timestamp that determines the end time of the activities; the response
     * includes the activities performed before the specified timestamp.</p>
     */
    inline void SetEndTime(Aws::Utils::DateTime&& value) { m_endTimeHasBeenSet = true; m_endTime = std::move(value); }

    /**
     * <p>The timestamp that determines the end time of the activities; the response
     * includes the activities performed before the specified timestamp.</p>
     */
    inline DescribeActivitiesRequest& WithEndTime(const Aws::Utils::DateTime& value) { SetEndTime(value); return *this;}

    /**
     * <p>The timestamp that determines the end time of the activities; the response
     * includes the activities performed before the specified timestamp.</p>
     */
    inline DescribeActivitiesRequest& WithEndTime(Aws::Utils::DateTime&& value) { SetEndTime(std::move(value)); return *this;}


    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline const Aws::String& GetOrganizationId() const{ return m_organizationId; }

    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline void SetOrganizationId(const Aws::String& value) { m_organizationIdHasBeenSet = true; m_organizationId = value; }

    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline void SetOrganizationId(Aws::String&& value) { m_organizationIdHasBeenSet = true; m_organizationId = std::move(value); }

    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline void SetOrganizationId(const char* value) { m_organizationIdHasBeenSet = true; m_organizationId.assign(value); }

    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline DescribeActivitiesRequest& WithOrganizationId(const Aws::String& value) { SetOrganizationId(value); return *this;}

    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline DescribeActivitiesRequest& WithOrganizationId(Aws::String&& value) { SetOrganizationId(std::move(value)); return *this;}

    /**
     * <p>The ID of the organization. This is a mandatory parameter when using
     * administrative API (SigV4) requests.</p>
     */
    inline DescribeActivitiesRequest& WithOrganizationId(const char* value) { SetOrganizationId(value); return *this;}


    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline const Aws::String& GetUserId() const{ return m_userId; }

    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline void SetUserId(const Aws::String& value) { m_userIdHasBeenSet = true; m_userId = value; }

    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline void SetUserId(Aws::String&& value) { m_userIdHasBeenSet = true; m_userId = std::move(value); }

    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline void SetUserId(const char* value) { m_userIdHasBeenSet = true; m_userId.assign(value); }

    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline DescribeActivitiesRequest& WithUserId(const Aws::String& value) { SetUserId(value); return *this;}

    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline DescribeActivitiesRequest& WithUserId(Aws::String&& value) { SetUserId(std::move(value)); return *this;}

    /**
     * <p>The ID of the user who performed the action. The response includes activities
     * pertaining to this user. This is an optional parameter and is only applicable
     * for administrative API (SigV4) requests.</p>
     */
    inline DescribeActivitiesRequest& WithUserId(const char* value) { SetUserId(value); return *this;}


    /**
     * <p>The maximum number of items to return.</p>
     */
    inline int GetLimit() const{ return m_limit; }

    /**
     * <p>The maximum number of items to return.</p>
     */
    inline void SetLimit(int value) { m_limitHasBeenSet = true; m_limit = value; }

    /**
     * <p>The maximum number of items to return.</p>
     */
    inline DescribeActivitiesRequest& WithLimit(int value) { SetLimit(value); return *this;}


    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline const Aws::String& GetMarker() const{ return m_marker; }

    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline void SetMarker(const Aws::String& value) { m_markerHasBeenSet = true; m_marker = value; }

    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline void SetMarker(Aws::String&& value) { m_markerHasBeenSet = true; m_marker = std::move(value); }

    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline void SetMarker(const char* value) { m_markerHasBeenSet = true; m_marker.assign(value); }

    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline DescribeActivitiesRequest& WithMarker(const Aws::String& value) { SetMarker(value); return *this;}

    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline DescribeActivitiesRequest& WithMarker(Aws::String&& value) { SetMarker(std::move(value)); return *this;}

    /**
     * <p>The marker for the next set of results. (You received this marker from a
     * previous call.)</p>
     */
    inline DescribeActivitiesRequest& WithMarker(const char* value) { SetMarker(value); return *this;}

  private:

    Aws::String m_authenticationToken;
    bool m_authenticationTokenHasBeenSet;

    Aws::Utils::DateTime m_startTime;
    bool m_startTimeHasBeenSet;

    Aws::Utils::DateTime m_endTime;
    bool m_endTimeHasBeenSet;

    Aws::String m_organizationId;
    bool m_organizationIdHasBeenSet;

    Aws::String m_userId;
    bool m_userIdHasBeenSet;

    int m_limit;
    bool m_limitHasBeenSet;

    Aws::String m_marker;
    bool m_markerHasBeenSet;
  };

} // namespace Model
} // namespace WorkDocs
} // namespace Aws
