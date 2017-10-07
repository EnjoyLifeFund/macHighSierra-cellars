#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "aws-cpp-sdk-appstream" for configuration "Release"
set_property(TARGET aws-cpp-sdk-appstream APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(aws-cpp-sdk-appstream PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-appstream.dylib"
  IMPORTED_SONAME_RELEASE "libaws-cpp-sdk-appstream.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS aws-cpp-sdk-appstream )
list(APPEND _IMPORT_CHECK_FILES_FOR_aws-cpp-sdk-appstream "${_IMPORT_PREFIX}/lib/libaws-cpp-sdk-appstream.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
