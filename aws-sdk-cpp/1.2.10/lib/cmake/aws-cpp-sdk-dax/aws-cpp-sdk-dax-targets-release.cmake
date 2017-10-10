#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-dax" for configuration "Release"
set_property(TARGET aws-cpp-sdk-dax APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-dax PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-dax.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-dax.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-dax )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-dax "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-dax.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
