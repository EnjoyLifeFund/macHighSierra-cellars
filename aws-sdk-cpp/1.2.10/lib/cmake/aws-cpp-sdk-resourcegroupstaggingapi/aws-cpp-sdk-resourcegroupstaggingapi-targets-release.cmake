#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-resourcegroupstaggingapi" for configuration "Release"
set_property(TARGET aws-cpp-sdk-resourcegroupstaggingapi APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-resourcegroupstaggingapi PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-resourcegroupstaggingapi.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-resourcegroupstaggingapi.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-resourcegroupstaggingapi )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-resourcegroupstaggingapi "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-resourcegroupstaggingapi.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
