/* !!!
 * If you're looking at config.h and thinking of editing - this is a
 * generated file. See build/config.h.in, unless you're just twiddling
 * to get things to work on your platform before updating Configure,
 * in which case go right ahead. :-)
 * !!!
 */

/* Version information. */
#define MVM_VERSION "2017.07"
#define MVM_VERSION_MAJOR 2017
#define MVM_VERSION_MINOR 07
#define MVM_VERSION_PATCH 0

/* Various compiler-specific pragmii. */
#define MVM_NO_RETURN 
#define MVM_NO_RETURN_GCC __attribute__((noreturn))
#define MVM_FORMAT(X, Y, Z) __attribute__((format(X, Y, Z)))

/* DLL interface definitions. */
#define MVM_DLL_IMPORT __attribute__ ((visibility ("default")))
#define MVM_DLL_EXPORT __attribute__ ((visibility ("default")))
#define MVM_DLL_LOCAL  __attribute__ ((visibility ("hidden")))

/* Set in case of big-endian sytems.
 * The default byte order is little-endian. */
#if 0
#define MVM_BIGENDIAN 0
#endif

/* pthread_yield() detection */
#if 0
#define MVM_HAS_PTHREAD_YIELD 0
#endif

/* How this compiler does static inline functions. */
#define MVM_STATIC_INLINE static __inline__

#if 1
#define MVM_CAN_UNALIGNED_INT32
#endif

#if 1
#define MVM_CAN_UNALIGNED_INT64
#endif

#if 1
#define MVM_CAN_UNALIGNED_NUM64
#endif

#define MVM_PTR_SIZE 8

#if 1
#define MVM_BOOL _Bool
#endif

/* Should we translate \n to \r\n on output? */
#define MVM_TRANSLATE_NEWLINE_OUTPUT 0
