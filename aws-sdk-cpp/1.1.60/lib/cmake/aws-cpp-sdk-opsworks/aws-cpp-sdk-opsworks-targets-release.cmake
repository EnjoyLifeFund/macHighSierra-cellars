#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-opsworks" for configuration "Release"
set_property(TARGET aws-cpp-sdk-opsworks APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-opsworks PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-opsworks.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-opsworks.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-opsworks )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-opsworks "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-opsworks.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
