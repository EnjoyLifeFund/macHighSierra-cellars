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
#include <aws/rekognition/Rekognition_EXPORTS.h>
#include <aws/rekognition/RekognitionRequest.h>
#include <aws/rekognition/model/Image.h>
#include <utility>

namespace Aws
{
namespace Rekognition
{
namespace Model
{

  /**
   */
  class AWS_REKOGNITION_API CompareFacesRequest : public RekognitionRequest
  {
  public:
    CompareFacesRequest();
    
    // Service request name is the Operation name which will send this request out,
    // each operation should has unique request name, so that we can get operation's name from this request.
    // Note: this is not true for response, multiple operations may have the same response name,
    // so we can not get operation's name from response.
    inline virtual const char* GetServiceRequestName() const override { return "CompareFaces"; }

    Aws::String SerializePayload() const override;

    Aws::Http::HeaderValueCollection GetRequestSpecificHeaders() const override;


    /**
     * <p>The source image, either as bytes or as an S3 object.</p>
     */
    inline const Image& GetSourceImage() const{ return m_sourceImage; }

    /**
     * <p>The source image, either as bytes or as an S3 object.</p>
     */
    inline void SetSourceImage(const Image& value) { m_sourceImageHasBeenSet = true; m_sourceImage = value; }

    /**
     * <p>The source image, either as bytes or as an S3 object.</p>
     */
    inline void SetSourceImage(Image&& value) { m_sourceImageHasBeenSet = true; m_sourceImage = std::move(value); }

    /**
     * <p>The source image, either as bytes or as an S3 object.</p>
     */
    inline CompareFacesRequest& WithSourceImage(const Image& value) { SetSourceImage(value); return *this;}

    /**
     * <p>The source image, either as bytes or as an S3 object.</p>
     */
    inline CompareFacesRequest& WithSourceImage(Image&& value) { SetSourceImage(std::move(value)); return *this;}


    /**
     * <p>The target image, either as bytes or as an S3 object.</p>
     */
    inline const Image& GetTargetImage() const{ return m_targetImage; }

    /**
     * <p>The target image, either as bytes or as an S3 object.</p>
     */
    inline void SetTargetImage(const Image& value) { m_targetImageHasBeenSet = true; m_targetImage = value; }

    /**
     * <p>The target image, either as bytes or as an S3 object.</p>
     */
    inline void SetTargetImage(Image&& value) { m_targetImageHasBeenSet = true; m_targetImage = std::move(value); }

    /**
     * <p>The target image, either as bytes or as an S3 object.</p>
     */
    inline CompareFacesRequest& WithTargetImage(const Image& value) { SetTargetImage(value); return *this;}

    /**
     * <p>The target image, either as bytes or as an S3 object.</p>
     */
    inline CompareFacesRequest& WithTargetImage(Image&& value) { SetTargetImage(std::move(value)); return *this;}


    /**
     * <p>The minimum level of confidence in the face matches that a match must meet to
     * be included in the <code>FaceMatches</code> array.</p>
     */
    inline double GetSimilarityThreshold() const{ return m_similarityThreshold; }

    /**
     * <p>The minimum level of confidence in the face matches that a match must meet to
     * be included in the <code>FaceMatches</code> array.</p>
     */
    inline void SetSimilarityThreshold(double value) { m_similarityThresholdHasBeenSet = true; m_similarityThreshold = value; }

    /**
     * <p>The minimum level of confidence in the face matches that a match must meet to
     * be included in the <code>FaceMatches</code> array.</p>
     */
    inline CompareFacesRequest& WithSimilarityThreshold(double value) { SetSimilarityThreshold(value); return *this;}

  private:

    Image m_sourceImage;
    bool m_sourceImageHasBeenSet;

    Image m_targetImage;
    bool m_targetImageHasBeenSet;

    double m_similarityThreshold;
    bool m_similarityThresholdHasBeenSet;
  };

} // namespace Model
} // namespace Rekognition
} // namespace Aws
