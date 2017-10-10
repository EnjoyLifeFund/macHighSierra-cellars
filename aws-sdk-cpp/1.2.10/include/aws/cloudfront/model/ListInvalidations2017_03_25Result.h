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
#include <aws/cloudfront/CloudFront_EXPORTS.h>
#include <aws/cloudfront/model/InvalidationList.h>
#include <utility>

namespace Aws
{
template<typename RESULT_TYPE>
class AmazonWebServiceResult;

namespace Utils
{
namespace Xml
{
  class XmlDocument;
} // namespace Xml
} // namespace Utils
namespace CloudFront
{
namespace Model
{
  /**
   * <p>The returned result of the corresponding request. </p><p><h3>See Also:</h3>  
   * <a
   * href="http://docs.aws.amazon.com/goto/WebAPI/cloudfront-2017-03-25/ListInvalidationsResult">AWS
   * API Reference</a></p>
   */
  class AWS_CLOUDFRONT_API ListInvalidations2017_03_25Result
  {
  public:
    ListInvalidations2017_03_25Result();
    ListInvalidations2017_03_25Result(const Aws::AmazonWebServiceResult<Aws::Utils::Xml::XmlDocument>& result);
    ListInvalidations2017_03_25Result& operator=(const Aws::AmazonWebServiceResult<Aws::Utils::Xml::XmlDocument>& result);


    /**
     * <p>Information about invalidation batches. </p>
     */
    inline const InvalidationList& GetInvalidationList() const{ return m_invalidationList; }

    /**
     * <p>Information about invalidation batches. </p>
     */
    inline void SetInvalidationList(const InvalidationList& value) { m_invalidationList = value; }

    /**
     * <p>Information about invalidation batches. </p>
     */
    inline void SetInvalidationList(InvalidationList&& value) { m_invalidationList = std::move(value); }

    /**
     * <p>Information about invalidation batches. </p>
     */
    inline ListInvalidations2017_03_25Result& WithInvalidationList(const InvalidationList& value) { SetInvalidationList(value); return *this;}

    /**
     * <p>Information about invalidation batches. </p>
     */
    inline ListInvalidations2017_03_25Result& WithInvalidationList(InvalidationList&& value) { SetInvalidationList(std::move(value)); return *this;}

  private:

    InvalidationList m_invalidationList;
  };

} // namespace Model
} // namespace CloudFront
} // namespace Aws
