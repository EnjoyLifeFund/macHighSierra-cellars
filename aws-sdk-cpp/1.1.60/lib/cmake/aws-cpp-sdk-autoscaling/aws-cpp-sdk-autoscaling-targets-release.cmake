#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-autoscaling" for configuration "Release"
set_property(TARGET aws-cpp-sdk-autoscaling APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-autoscaling PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-autoscaling.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-autoscaling.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-autoscaling )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-autoscaling "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-autoscaling.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
