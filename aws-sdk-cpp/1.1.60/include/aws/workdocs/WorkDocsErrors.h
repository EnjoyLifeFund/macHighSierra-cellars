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

#include <aws/core/client/CoreErrors.h>
#include <aws/workdocs/WorkDocs_EXPORTS.h>

namespace Aws
{
namespace WorkDocs
{
enum class WorkDocsErrors
{
  //From Core//
  //////////////////////////////////////////////////////////////////////////////////////////
  INCOMPLETE_SIGNATURE = 0,
  INTERNAL_FAILURE = 1,
  INVALID_ACTION = 2,
  INVALID_CLIENT_TOKEN_ID = 3,
  INVALID_PARAMETER_COMBINATION = 4,
  INVALID_QUERY_PARAMETER = 5,
  INVALID_PARAMETER_VALUE = 6,
  MISSING_ACTION = 7, // SDK should never allow
  MISSING_AUTHENTICATION_TOKEN = 8, // SDK should never allow
  MISSING_PARAMETER = 9, // SDK should never allow
  OPT_IN_REQUIRED = 10,
  REQUEST_EXPIRED = 11,
  SERVICE_UNAVAILABLE = 12,
  THROTTLING = 13,
  VALIDATION = 14,
  ACCESS_DENIED = 15,
  RESOURCE_NOT_FOUND = 16,
  UNRECOGNIZED_CLIENT = 17,
  MALFORMED_QUERY_STRING = 18,
  SLOW_DOWN = 19,
  REQUEST_TIME_TOO_SKEWED = 20,
  INVALID_SIGNATURE = 21,
  SIGNATURE_DOES_NOT_MATCH = 22,
  INVALID_ACCESS_KEY_ID = 23,
  NETWORK_CONNECTION = 99,
  
  UNKNOWN = 100,
  ///////////////////////////////////////////////////////////////////////////////////////////

  CONCURRENT_MODIFICATION= static_cast<int>(Aws::Client::CoreErrors::SERVICE_EXTENSION_START_RANGE) + 1,
  CUSTOM_METADATA_LIMIT_EXCEEDED,
  DEACTIVATING_LAST_SYSTEM_USER,
  DOCUMENT_LOCKED_FOR_COMMENTS,
  DRAFT_UPLOAD_OUT_OF_SYNC,
  ENTITY_ALREADY_EXISTS,
  ENTITY_NOT_EXISTS,
  FAILED_DEPENDENCY,
  ILLEGAL_USER_STATE,
  INVALID_ARGUMENT,
  INVALID_OPERATION,
  LIMIT_EXCEEDED,
  PROHIBITED_STATE,
  RESOURCE_ALREADY_CHECKED_OUT,
  STORAGE_LIMIT_EXCEEDED,
  STORAGE_LIMIT_WILL_EXCEED,
  TOO_MANY_LABELS,
  TOO_MANY_SUBSCRIPTIONS,
  UNAUTHORIZED_OPERATION,
  UNAUTHORIZED_RESOURCE_ACCESS
};
namespace WorkDocsErrorMapper
{
  AWS_WORKDOCS_API Aws::Client::AWSError<Aws::Client::CoreErrors> GetErrorForName(const char* errorName);
}

} // namespace WorkDocs
} // namespace Aws
