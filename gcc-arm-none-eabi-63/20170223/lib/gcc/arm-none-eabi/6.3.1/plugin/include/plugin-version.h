#include "configargs.h"

#define GCCPLUGIN_VERSION_MAJOR   6
#define GCCPLUGIN_VERSION_MINOR   3
#define GCCPLUGIN_VERSION_PATCHLEVEL   1
#define GCCPLUGIN_VERSION  (GCCPLUGIN_VERSION_MAJOR*1000 + GCCPLUGIN_VERSION_MINOR)

static char basever[] = "6.3.1";
static char datestamp[] = "20170215";
static char devphase[] = "release";
static char revision[] = "[ARM/embedded-6-branch revision 245512]";

/* FIXME plugins: We should make the version information more precise.
   One way to do is to add a checksum. */

static struct plugin_gcc_version gcc_version = {basever, datestamp,
						devphase, revision,
						configuration_arguments};
