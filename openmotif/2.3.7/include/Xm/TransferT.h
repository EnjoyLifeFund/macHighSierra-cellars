/* $XConsortium: TransferT.h /main/4 1995/07/15 20:56:34 drk $ */
/*
 * Motif
 *
 * Copyright (c) 1987-2012, The Open Group. All rights reserved.
 *
 * These libraries and programs are free software; you can
 * redistribute them and/or modify them under the terms of the GNU
 * Lesser General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 * These libraries and programs are distributed in the hope that
 * they will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with these librararies and programs; if not, write
 * to the Free Software Foundation, Inc., 51 Franklin Street, Fifth
 * Floor, Boston, MA 02110-1301 USA
 */
/*
 * HISTORY
 */

#ifndef _XmTransferT_H
#define _XmTransferT_H

#include <Xm/Xm.h>
#include <Xm/TransferP.h>

#ifdef __cplusplus
extern "C" {
#endif

externalref XrmQuark XmQTtransfer;

/* Trait structures and typedefs, place typedefs first */

/* Version 0: initial release. */

typedef struct _XmTransferTraitRec {
  int				version;		/* 0 */
  XmConvertCallbackProc		convertProc;
  XmDestinationCallbackProc	destinationProc;
  XmDestinationCallbackProc	destinationPreHookProc;
} XmTransferTraitRec, *XmTransferTrait;

#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmTransferT_H */
