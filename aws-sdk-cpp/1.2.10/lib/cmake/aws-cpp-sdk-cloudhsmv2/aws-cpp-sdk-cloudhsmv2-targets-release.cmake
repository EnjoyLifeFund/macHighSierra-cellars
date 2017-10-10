#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-cloudhsmv2" for configuration "Release"
set_property(TARGET aws-cpp-sdk-cloudhsmv2 APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-cloudhsmv2 PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-cloudhsmv2.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-cloudhsmv2.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-cloudhsmv2 )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-cloudhsmv2 "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-cloudhsmv2.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
