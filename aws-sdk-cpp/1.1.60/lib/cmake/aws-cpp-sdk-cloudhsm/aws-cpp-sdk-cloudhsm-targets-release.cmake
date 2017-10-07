#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-cloudhsm" for configuration "Release"
set_property(TARGET aws-cpp-sdk-cloudhsm APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-cloudhsm PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-cloudhsm.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-cloudhsm.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-cloudhsm )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-cloudhsm "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-cloudhsm.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
