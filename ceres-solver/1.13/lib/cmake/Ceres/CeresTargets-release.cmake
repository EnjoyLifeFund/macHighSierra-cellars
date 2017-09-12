#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "ceres" for configuration "Release"
set_property(TARGET ceres APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(ceres PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "CXX"
  IMPORTED_LINK_INTERFACE_LIBRARIES_RELEASE "/usr/local/lib/libglog.dylib;gflags_shared;/usr/local/lib/libspqr.a;/usr/local/lib/libtbb.dylib;/usr/local/lib/libtbbmalloc.dylib;/usr/local/lib/libcholmod.a;/usr/local/lib/libccolamd.a;/usr/local/lib/libcamd.a;/usr/local/lib/libcolamd.a;/usr/local/lib/libamd.a;/usr/local/lib/libopenblas.dylib;/usr/local/lib/libopenblas.dylib;/usr/local/lib/libopenblas.dylib;/usr/local/lib/libsuitesparseconfig.a;/usr/local/lib/libcxsparse.a;/usr/local/lib/libopenblas.dylib;/usr/local/lib/libopenblas.dylib"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libceres.a"
  )

list(APPEND _IMPORT_CHECK_TARGETS ceres )
list(APPEND _IMPORT_CHECK_FILES_FOR_ceres "${_IMPORT_PREFIX}/lib/libceres.a" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
