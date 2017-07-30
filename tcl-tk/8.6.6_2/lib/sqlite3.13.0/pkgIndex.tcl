#
# Tcl package index file
#
# Note sqlite*3* init specifically
#
package ifneeded sqlite3 3.13.0 \
    [list load [file join $dir libsqlite3.13.0.dylib] Sqlite3]
