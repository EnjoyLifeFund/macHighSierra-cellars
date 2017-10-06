/* xdr-datatypes-config.h.  Generated from xdr-datatypes-config.h.in by configure.  */

/*
  Determine at compile-time the sizes of various XDR datatypes. This uses
  symbols defined by configure (See configure.in). pcw 08/13/07
*/

#ifndef __XDR_DATATYPES__
#define __XDR_DATATYPES__

#ifdef WIN32
#include <rpc.h>
#include <winsock2.h>
#include <xdr.h>
#else
#include <rpc/types.h>
#include <netinet/in.h>
#include <rpc/xdr.h>
#endif


#define XDR_INT32 xdr_int32_t
#define XDR_UINT32 xdr_u_int32_t

#define XDR_INT16 xdr_int16_t
#define XDR_UINT16 xdr_u_int16_t

#define XDR_FLOAT64 xdr_double
#define XDR_FLOAT32 xdr_float

#endif /* __XDR_DATATYPES__ */
