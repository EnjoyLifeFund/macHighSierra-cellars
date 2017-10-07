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
#include <aws/core/utils/memory/stl/AWSVector.h>
#include <aws/rekognition/model/OrientationCorrection.h>
#include <aws/rekognition/model/FaceRecord.h>
#include <utility>

namespace Aws
{
template<typename RESULT_TYPE>
class AmazonWebServiceResult;

namespace Utils
{
namespace Json
{
  class JsonValue;
} // namespace Json
} // namespace Utils
namespace Rekognition
{
namespace Model
{
  class AWS_REKOGNITION_API IndexFacesResult
  {
  public:
    IndexFacesResult();
    IndexFacesResult(const Aws::AmazonWebServiceResult<Aws::Utils::Json::JsonValue>& result);
    IndexFacesResult& operator=(const Aws::AmazonWebServiceResult<Aws::Utils::Json::JsonValue>& result);


    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline const Aws::Vector<FaceRecord>& GetFaceRecords() const{ return m_faceRecords; }

    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline void SetFaceRecords(const Aws::Vector<FaceRecord>& value) { m_faceRecords = value; }

    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline void SetFaceRecords(Aws::Vector<FaceRecord>&& value) { m_faceRecords = std::move(value); }

    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline IndexFacesResult& WithFaceRecords(const Aws::Vector<FaceRecord>& value) { SetFaceRecords(value); return *this;}

    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline IndexFacesResult& WithFaceRecords(Aws::Vector<FaceRecord>&& value) { SetFaceRecords(std::move(value)); return *this;}

    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline IndexFacesResult& AddFaceRecords(const FaceRecord& value) { m_faceRecords.push_back(value); return *this; }

    /**
     * <p>An array of faces detected and added to the collection. For more information,
     * see <a>howitworks-index-faces</a>. </p>
     */
    inline IndexFacesResult& AddFaceRecords(FaceRecord&& value) { m_faceRecords.push_back(std::move(value)); return *this; }


    /**
     * <p>The orientation of the input image (counterclockwise direction). If your
     * application displays the image, you can use this value to correct image
     * orientation. The bounding box coordinates returned in <code>FaceRecords</code>
     * represent face locations before the image orientation is corrected. </p> <note>
     * <p>If the input image is in jpeg format, it might contain exchangeable image
     * (Exif) metadata. If so, and the Exif metadata populates the orientation field,
     * the value of <code>OrientationCorrection</code> is null and the bounding box
     * coordinates in <code>FaceRecords</code> represent face locations after Exif
     * metadata is used to correct the image orientation. Images in .png format don't
     * contain Exif metadata.</p> </note>
     */
    inline const OrientationCorrection& GetOrientationCorrection() const{ return m_orientationCorrection; }

    /**
     * <p>The orientation of the input image (counterclockwise direction). If your
     * application displays the image, you can use this value to correct image
     * orientation. The bounding box coordinates returned in <code>FaceRecords</code>
     * represent face locations before the image orientation is corrected. </p> <note>
     * <p>If the input image is in jpeg format, it might contain exchangeable image
     * (Exif) metadata. If so, and the Exif metadata populates the orientation field,
     * the value of <code>OrientationCorrection</code> is null and the bounding box
     * coordinates in <code>FaceRecords</code> represent face locations after Exif
     * metadata is used to correct the image orientation. Images in .png format don't
     * contain Exif metadata.</p> </note>
     */
    inline void SetOrientationCorrection(const OrientationCorrection& value) { m_orientationCorrection = value; }

    /**
     * <p>The orientation of the input image (counterclockwise direction). If your
     * application displays the image, you can use this value to correct image
     * orientation. The bounding box coordinates returned in <code>FaceRecords</code>
     * represent face locations before the image orientation is corrected. </p> <note>
     * <p>If the input image is in jpeg format, it might contain exchangeable image
     * (Exif) metadata. If so, and the Exif metadata populates the orientation field,
     * the value of <code>OrientationCorrection</code> is null and the bounding box
     * coordinates in <code>FaceRecords</code> represent face locations after Exif
     * metadata is used to correct the image orientation. Images in .png format don't
     * contain Exif metadata.</p> </note>
     */
    inline void SetOrientationCorrection(OrientationCorrection&& value) { m_orientationCorrection = std::move(value); }

    /**
     * <p>The orientation of the input image (counterclockwise direction). If your
     * application displays the image, you can use this value to correct image
     * orientation. The bounding box coordinates returned in <code>FaceRecords</code>
     * represent face locations before the image orientation is corrected. </p> <note>
     * <p>If the input image is in jpeg format, it might contain exchangeable image
     * (Exif) metadata. If so, and the Exif metadata populates the orientation field,
     * the value of <code>OrientationCorrection</code> is null and the bounding box
     * coordinates in <code>FaceRecords</code> represent face locations after Exif
     * metadata is used to correct the image orientation. Images in .png format don't
     * contain Exif metadata.</p> </note>
     */
    inline IndexFacesResult& WithOrientationCorrection(const OrientationCorrection& value) { SetOrientationCorrection(value); return *this;}

    /**
     * <p>The orientation of the input image (counterclockwise direction). If your
     * application displays the image, you can use this value to correct image
     * orientation. The bounding box coordinates returned in <code>FaceRecords</code>
     * represent face locations before the image orientation is corrected. </p> <note>
     * <p>If the input image is in jpeg format, it might contain exchangeable image
     * (Exif) metadata. If so, and the Exif metadata populates the orientation field,
     * the value of <code>OrientationCorrection</code> is null and the bounding box
     * coordinates in <code>FaceRecords</code> represent face locations after Exif
     * metadata is used to correct the image orientation. Images in .png format don't
     * contain Exif metadata.</p> </note>
     */
    inline IndexFacesResult& WithOrientationCorrection(OrientationCorrection&& value) { SetOrientationCorrection(std::move(value)); return *this;}

  private:

    Aws::Vector<FaceRecord> m_faceRecords;

    OrientationCorrection m_orientationCorrection;
  };

} // namespace Model
} // namespace Rekognition
} // namespace Aws
