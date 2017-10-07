#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-swf" for configuration "Release"
set_property(TARGET aws-cpp-sdk-swf APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-swf PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-swf.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-swf.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-swf )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-swf "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-swf.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
