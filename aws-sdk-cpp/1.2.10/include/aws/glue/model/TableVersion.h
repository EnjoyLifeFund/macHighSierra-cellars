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
#include <aws/glue/Glue_EXPORTS.h>
#include <aws/glue/model/Table.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <utility>

namespace Aws
{
namespace Utils
{
namespace Json
{
  class JsonValue;
} // namespace Json
} // namespace Utils
namespace Glue
{
namespace Model
{

  class AWS_GLUE_API TableVersion
  {
  public:
    TableVersion();
    TableVersion(const Aws::Utils::Json::JsonValue& jsonValue);
    TableVersion& operator=(const Aws::Utils::Json::JsonValue& jsonValue);
    Aws::Utils::Json::JsonValue Jsonize() const;


    
    inline const Table& GetTable() const{ return m_table; }

    
    inline void SetTable(const Table& value) { m_tableHasBeenSet = true; m_table = value; }

    
    inline void SetTable(Table&& value) { m_tableHasBeenSet = true; m_table = std::move(value); }

    
    inline TableVersion& WithTable(const Table& value) { SetTable(value); return *this;}

    
    inline TableVersion& WithTable(Table&& value) { SetTable(std::move(value)); return *this;}


    
    inline const Aws::String& GetVersionId() const{ return m_versionId; }

    
    inline void SetVersionId(const Aws::String& value) { m_versionIdHasBeenSet = true; m_versionId = value; }

    
    inline void SetVersionId(Aws::String&& value) { m_versionIdHasBeenSet = true; m_versionId = std::move(value); }

    
    inline void SetVersionId(const char* value) { m_versionIdHasBeenSet = true; m_versionId.assign(value); }

    
    inline TableVersion& WithVersionId(const Aws::String& value) { SetVersionId(value); return *this;}

    
    inline TableVersion& WithVersionId(Aws::String&& value) { SetVersionId(std::move(value)); return *this;}

    
    inline TableVersion& WithVersionId(const char* value) { SetVersionId(value); return *this;}

  private:

    Table m_table;
    bool m_tableHasBeenSet;

    Aws::String m_versionId;
    bool m_versionIdHasBeenSet;
  };

} // namespace Model
} // namespace Glue
} // namespace Aws
