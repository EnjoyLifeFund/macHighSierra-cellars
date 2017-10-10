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
#include <aws/elasticache/ElastiCache_EXPORTS.h>
#include <aws/elasticache/ElastiCacheRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <aws/core/utils/memory/stl/AWSVector.h>
#include <aws/elasticache/model/ParameterNameValue.h>
#include <utility>

namespace Aws
{
namespace ElastiCache
{
namespace Model
{

  /**
   * <p>Represents the input of a <code>ModifyCacheParameterGroup</code>
   * operation.</p><p><h3>See Also:</h3>   <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/elasticache-2015-02-02/ModifyCacheParameterGroupMessage">AWS
   * API Reference</a></p>
   */
  class AWS_ELASTICACHE_API ModifyCacheParameterGroupRequest : public ElastiCacheRequest
  {
  public:
    ModifyCacheParameterGroupRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "ModifyCacheParameterGroup"; }

    Aws::String SerializePayload() const override;

  protected:
    void DumpBodyToUrl(Aws::Http::URI& uri ) const override;

  public:

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline const Aws::String& GetCacheParameterGroupName() const{ return m_cacheParameterGroupName; }

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline void SetCacheParameterGroupName(const Aws::String& value) { m_cacheParameterGroupNameHasBeenSet = true; m_cacheParameterGroupName = value; }

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline void SetCacheParameterGroupName(Aws::String&& value) { m_cacheParameterGroupNameHasBeenSet = true; m_cacheParameterGroupName = std::move(value); }

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline void SetCacheParameterGroupName(const char* value) { m_cacheParameterGroupNameHasBeenSet = true; m_cacheParameterGroupName.assign(value); }

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline ModifyCacheParameterGroupRequest& WithCacheParameterGroupName(const Aws::String& value) { SetCacheParameterGroupName(value); return *this;}

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline ModifyCacheParameterGroupRequest& WithCacheParameterGroupName(Aws::String&& value) { SetCacheParameterGroupName(std::move(value)); return *this;}

    /**
     * <p>The name of the cache parameter group to modify.</p>
     */
    inline ModifyCacheParameterGroupRequest& WithCacheParameterGroupName(const char* value) { SetCacheParameterGroupName(value); return *this;}


    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline const Aws::Vector<ParameterNameValue>& GetParameterNameValues() const{ return m_parameterNameValues; }

    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline void SetParameterNameValues(const Aws::Vector<ParameterNameValue>& value) { m_parameterNameValuesHasBeenSet = true; m_parameterNameValues = value; }

    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline void SetParameterNameValues(Aws::Vector<ParameterNameValue>&& value) { m_parameterNameValuesHasBeenSet = true; m_parameterNameValues = std::move(value); }

    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline ModifyCacheParameterGroupRequest& WithParameterNameValues(const Aws::Vector<ParameterNameValue>& value) { SetParameterNameValues(value); return *this;}

    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline ModifyCacheParameterGroupRequest& WithParameterNameValues(Aws::Vector<ParameterNameValue>&& value) { SetParameterNameValues(std::move(value)); return *this;}

    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline ModifyCacheParameterGroupRequest& AddParameterNameValues(const ParameterNameValue& value) { m_parameterNameValuesHasBeenSet = true; m_parameterNameValues.push_back(value); return *this; }

    /**
     * <p>An array of parameter names and values for the parameter update. You must
     * supply at least one parameter name and value; subsequent arguments are optional.
     * A maximum of 20 parameters may be modified per request.</p>
     */
    inline ModifyCacheParameterGroupRequest& AddParameterNameValues(ParameterNameValue&& value) { m_parameterNameValuesHasBeenSet = true; m_parameterNameValues.push_back(std::move(value)); return *this; }

  private:

    Aws::String m_cacheParameterGroupName;
    bool m_cacheParameterGroupNameHasBeenSet;

    Aws::Vector<ParameterNameValue> m_parameterNameValues;
    bool m_parameterNameValuesHasBeenSet;
  };

} // namespace Model
} // namespace ElastiCache
} // namespace Aws
