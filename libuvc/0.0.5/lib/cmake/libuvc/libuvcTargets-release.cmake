#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "uvc" for configuration "Release"
set_property(TARGET uvc APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(uvc PROPERTIES
  IMPORTED_LINK_INTERFACE_LIBRARIES_RELEASE "-ljpeg;/usr/local/lib/libusb-1.0.dylib"
  IMPORTED_LOCATION_RELEASE "/usr/local/Cellar/libuvc/0.0.5/lib/libuvc.dylib"
  IMPORTED_SONAME_RELEASE "libuvc.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS uvc )
list(APPEND _IMPORT_CHECK_FILES_FOR_uvc "/usr/local/Cellar/libuvc/0.0.5/lib/libuvc.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
