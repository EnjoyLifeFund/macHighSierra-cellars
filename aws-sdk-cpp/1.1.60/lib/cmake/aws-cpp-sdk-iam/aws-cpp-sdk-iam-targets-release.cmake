#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-iam" for configuration "Release"
set_property(TARGET aws-cpp-sdk-iam APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-iam PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-iam.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-iam.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-iam )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-iam "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-iam.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
