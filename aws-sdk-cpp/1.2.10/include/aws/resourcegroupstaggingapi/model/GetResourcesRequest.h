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
#include <aws/resourcegroupstaggingapi/ResourceGroupsTaggingAPI_EXPORTS.h>
#include <aws/resourcegroupstaggingapi/ResourceGroupsTaggingAPIRequest.h>
#include <aws/core/utils/memory/stl/AWSString.h>
#include <aws/core/utils/memory/stl/AWSVector.h>
#include <aws/resourcegroupstaggingapi/model/TagFilter.h>
#include <utility>

namespace Aws
{
namespace ResourceGroupsTaggingAPI
{
namespace Model
{

  /**
   */
  class AWS_RESOURCEGROUPSTAGGINGAPI_API GetResourcesRequest : public ResourceGroupsTaggingAPIRequest
  {
  public:
    GetResourcesRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "GetResources"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline const Aws::String& GetPaginationToken() const{ return m_paginationToken; }

    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline void SetPaginationToken(const Aws::String& value) { m_paginationTokenHasBeenSet = true; m_paginationToken = value; }

    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline void SetPaginationToken(Aws::String&& value) { m_paginationTokenHasBeenSet = true; m_paginationToken = std::move(value); }

    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline void SetPaginationToken(const char* value) { m_paginationTokenHasBeenSet = true; m_paginationToken.assign(value); }

    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline GetResourcesRequest& WithPaginationToken(const Aws::String& value) { SetPaginationToken(value); return *this;}

    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline GetResourcesRequest& WithPaginationToken(Aws::String&& value) { SetPaginationToken(std::move(value)); return *this;}

    /**
     * <p>A string that indicates that additional data is available. Leave this value
     * empty for your initial request. If the response includes a
     * <code>PaginationToken</code>, use that string for this value to request an
     * additional page of data.</p>
     */
    inline GetResourcesRequest& WithPaginationToken(const char* value) { SetPaginationToken(value); return *this;}


    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline const Aws::Vector<TagFilter>& GetTagFilters() const{ return m_tagFilters; }

    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline void SetTagFilters(const Aws::Vector<TagFilter>& value) { m_tagFiltersHasBeenSet = true; m_tagFilters = value; }

    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline void SetTagFilters(Aws::Vector<TagFilter>&& value) { m_tagFiltersHasBeenSet = true; m_tagFilters = std::move(value); }

    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline GetResourcesRequest& WithTagFilters(const Aws::Vector<TagFilter>& value) { SetTagFilters(value); return *this;}

    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline GetResourcesRequest& WithTagFilters(Aws::Vector<TagFilter>&& value) { SetTagFilters(std::move(value)); return *this;}

    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline GetResourcesRequest& AddTagFilters(const TagFilter& value) { m_tagFiltersHasBeenSet = true; m_tagFilters.push_back(value); return *this; }

    /**
     * <p>A list of tags (keys and values). A request can include up to 50 keys, and
     * each key can include up to 20 values.</p> <p>If you specify multiple filters
     * connected by an AND operator in a single request, the response returns only
     * those resources that are associated with every specified filter.</p> <p>If you
     * specify multiple filters connected by an OR operator in a single request, the
     * response returns all resources that are associated with at least one or possibly
     * more of the specified filters.</p>
     */
    inline GetResourcesRequest& AddTagFilters(TagFilter&& value) { m_tagFiltersHasBeenSet = true; m_tagFilters.push_back(std::move(value)); return *this; }


    /**
     * <p>A limit that restricts the number of resources returned by GetResources in
     * paginated output. You can set ResourcesPerPage to a minimum of 1 item and the
     * maximum of 50 items. </p>
     */
    inline int GetResourcesPerPage() const{ return m_resourcesPerPage; }

    /**
     * <p>A limit that restricts the number of resources returned by GetResources in
     * paginated output. You can set ResourcesPerPage to a minimum of 1 item and the
     * maximum of 50 items. </p>
     */
    inline void SetResourcesPerPage(int value) { m_resourcesPerPageHasBeenSet = true; m_resourcesPerPage = value; }

    /**
     * <p>A limit that restricts the number of resources returned by GetResources in
     * paginated output. You can set ResourcesPerPage to a minimum of 1 item and the
     * maximum of 50 items. </p>
     */
    inline GetResourcesRequest& WithResourcesPerPage(int value) { SetResourcesPerPage(value); return *this;}


    /**
     * <p>A limit that restricts the number of tags (key and value pairs) returned by
     * GetResources in paginated output. A resource with no tags is counted as having
     * one tag (one key and value pair).</p> <p> <code>GetResources</code> does not
     * split a resource and its associated tags across pages. If the specified
     * <code>TagsPerPage</code> would cause such a break, a
     * <code>PaginationToken</code> is returned in place of the affected resource and
     * its tags. Use that token in another request to get the remaining data. For
     * example, if you specify a <code>TagsPerPage</code> of <code>100</code> and the
     * account has 22 resources with 10 tags each (meaning that each resource has 10
     * key and value pairs), the output will consist of 3 pages, with the first page
     * displaying the first 10 resources, each with its 10 tags, the second page
     * displaying the next 10 resources each with its 10 tags, and the third page
     * displaying the remaining 2 resources, each with its 10 tags.</p> <p/> <p>You can
     * set <code>TagsPerPage</code> to a minimum of 100 items and the maximum of 500
     * items.</p>
     */
    inline int GetTagsPerPage() const{ return m_tagsPerPage; }

    /**
     * <p>A limit that restricts the number of tags (key and value pairs) returned by
     * GetResources in paginated output. A resource with no tags is counted as having
     * one tag (one key and value pair).</p> <p> <code>GetResources</code> does not
     * split a resource and its associated tags across pages. If the specified
     * <code>TagsPerPage</code> would cause such a break, a
     * <code>PaginationToken</code> is returned in place of the affected resource and
     * its tags. Use that token in another request to get the remaining data. For
     * example, if you specify a <code>TagsPerPage</code> of <code>100</code> and the
     * account has 22 resources with 10 tags each (meaning that each resource has 10
     * key and value pairs), the output will consist of 3 pages, with the first page
     * displaying the first 10 resources, each with its 10 tags, the second page
     * displaying the next 10 resources each with its 10 tags, and the third page
     * displaying the remaining 2 resources, each with its 10 tags.</p> <p/> <p>You can
     * set <code>TagsPerPage</code> to a minimum of 100 items and the maximum of 500
     * items.</p>
     */
    inline void SetTagsPerPage(int value) { m_tagsPerPageHasBeenSet = true; m_tagsPerPage = value; }

    /**
     * <p>A limit that restricts the number of tags (key and value pairs) returned by
     * GetResources in paginated output. A resource with no tags is counted as having
     * one tag (one key and value pair).</p> <p> <code>GetResources</code> does not
     * split a resource and its associated tags across pages. If the specified
     * <code>TagsPerPage</code> would cause such a break, a
     * <code>PaginationToken</code> is returned in place of the affected resource and
     * its tags. Use that token in another request to get the remaining data. For
     * example, if you specify a <code>TagsPerPage</code> of <code>100</code> and the
     * account has 22 resources with 10 tags each (meaning that each resource has 10
     * key and value pairs), the output will consist of 3 pages, with the first page
     * displaying the first 10 resources, each with its 10 tags, the second page
     * displaying the next 10 resources each with its 10 tags, and the third page
     * displaying the remaining 2 resources, each with its 10 tags.</p> <p/> <p>You can
     * set <code>TagsPerPage</code> to a minimum of 100 items and the maximum of 500
     * items.</p>
     */
    inline GetResourcesRequest& WithTagsPerPage(int value) { SetTagsPerPage(value); return *this;}


    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline const Aws::Vector<Aws::String>& GetResourceTypeFilters() const{ return m_resourceTypeFilters; }

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline void SetResourceTypeFilters(const Aws::Vector<Aws::String>& value) { m_resourceTypeFiltersHasBeenSet = true; m_resourceTypeFilters = value; }

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline void SetResourceTypeFilters(Aws::Vector<Aws::String>&& value) { m_resourceTypeFiltersHasBeenSet = true; m_resourceTypeFilters = std::move(value); }

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline GetResourcesRequest& WithResourceTypeFilters(const Aws::Vector<Aws::String>& value) { SetResourceTypeFilters(value); return *this;}

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline GetResourcesRequest& WithResourceTypeFilters(Aws::Vector<Aws::String>&& value) { SetResourceTypeFilters(std::move(value)); return *this;}

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline GetResourcesRequest& AddResourceTypeFilters(const Aws::String& value) { m_resourceTypeFiltersHasBeenSet = true; m_resourceTypeFilters.push_back(value); return *this; }

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline GetResourcesRequest& AddResourceTypeFilters(Aws::String&& value) { m_resourceTypeFiltersHasBeenSet = true; m_resourceTypeFilters.push_back(std::move(value)); return *this; }

    /**
     * <p>The constraints on the resources that you want returned. The format of each
     * resource type is <code>service[:resourceType]</code>. For example, specifying a
     * resource type of <code>ec2</code> returns all tagged Amazon EC2 resources (which
     * includes tagged EC2 instances). Specifying a resource type of
     * <code>ec2:instance</code> returns only EC2 instances. </p> <p>The string for
     * each service name and resource type is the same as that embedded in a resource's
     * Amazon Resource Name (ARN). Consult the <i>AWS General Reference</i> for the
     * following:</p> <ul> <li> <p>For a list of service name strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#genref-aws-service-namespaces">AWS
     * Service Namespaces</a>.</p> </li> <li> <p>For resource type strings, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html#arns-syntax">Example
     * ARNs</a>.</p> </li> <li> <p>For more information about ARNs, see <a
     * href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html">Amazon
     * Resource Names (ARNs) and AWS Service Namespaces</a>.</p> </li> </ul>
     */
    inline GetResourcesRequest& AddResourceTypeFilters(const char* value) { m_resourceTypeFiltersHasBeenSet = true; m_resourceTypeFilters.push_back(value); return *this; }

  private:

    Aws::String m_paginationToken;
    bool m_paginationTokenHasBeenSet;

    Aws::Vector<TagFilter> m_tagFilters;
    bool m_tagFiltersHasBeenSet;

    int m_resourcesPerPage;
    bool m_resourcesPerPageHasBeenSet;

    int m_tagsPerPage;
    bool m_tagsPerPageHasBeenSet;

    Aws::Vector<Aws::String> m_resourceTypeFilters;
    bool m_resourceTypeFiltersHasBeenSet;
  };

} // namespace Model
} // namespace ResourceGroupsTaggingAPI
} // namespace Aws
