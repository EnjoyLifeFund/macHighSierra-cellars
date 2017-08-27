#----------------------------------------------------------------
# Generated CMake target import file for configuration "RELEASE".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "netcdf" for configuration "RELEASE"
set_property(TARGET netcdf APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(netcdf PROPERTIES
  IMPORTED_LINK_INTERFACE_LIBRARIES_RELEASE "/usr/local/lib/libhdf5_hl.dylib;/usr/local/lib/libhdf5.dylib;/usr/local/lib/libsz.dylib;/usr/lib/libz.dylib;/usr/lib/libdl.dylib;/usr/lib/libm.dylib;/usr/local/lib/libcurl.dylib"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libnetcdf.11.4.0.dylib"
  IMPORTED_SONAME_RELEASE "@rpath/libnetcdf.11.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS netcdf )
list(APPEND _IMPORT_CHECK_FILES_FOR_netcdf "${_IMPORT_PREFIX}/lib/libnetcdf.11.4.0.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
