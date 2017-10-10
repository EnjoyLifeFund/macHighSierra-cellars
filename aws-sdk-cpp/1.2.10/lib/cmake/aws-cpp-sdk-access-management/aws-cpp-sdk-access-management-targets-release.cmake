#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-access-management" for configuration "Release"
set_property(TARGET aws-cpp-sdk-access-management APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-access-management PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-access-management.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-access-management.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-access-management )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-access-management "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-access-management.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
