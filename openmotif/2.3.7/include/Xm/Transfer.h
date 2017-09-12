/* $TOG: Transfer.h /main/8 1998/02/03 14:55:22 csn $ */
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

#ifndef _XmTransfer_H
#define _XmTransfer_H

#include <Xm/DragC.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Proc typedefs */

#define XmConvertCallbackProc 		XtCallbackProc
#define XmSelectionDoneProc   		XtSelectionDoneProc
#define XmCancelSelectionProc 		XtCancelConvertSelectionProc
#define XmDestinationCallbackProc	XtCallbackProc
#define XmSelectionCallbackProc		XtSelectionCallbackProc

/* Flags */

typedef enum { XmTRANSFER_DONE_SUCCEED = 0, XmTRANSFER_DONE_FAIL, 
	       XmTRANSFER_DONE_CONTINUE, XmTRANSFER_DONE_DEFAULT 
	     } XmTransferStatus;

enum { XmSELECTION_DEFAULT = 0, XmSELECTION_INCREMENTAL,
       XmSELECTION_PERSIST, XmSELECTION_SNAPSHOT,
       XmSELECTION_TRANSACT };

enum { XmCONVERTING_NONE = 0, 
       XmCONVERTING_SAME = 1, 
       XmCONVERTING_TRANSACT = 2,
       XmCONVERTING_PARTIAL = 4 };

enum { XmCONVERT_DEFAULT = 0, XmCONVERT_MORE, 
       XmCONVERT_MERGE, XmCONVERT_REFUSE, XmCONVERT_DONE };

/* Callback structures */

typedef struct {
	int		reason;
	XEvent		*event;
	Atom		selection;
	Atom		target;
	XtPointer	source_data;
	XtPointer	location_data;
	int		flags;
	XtPointer	parm;
	int		parm_format;
	unsigned long	parm_length;
	Atom		parm_type;
	int		status;
	XtPointer	value;
	Atom		type;
	int		format;
	unsigned long	length;
} XmConvertCallbackStruct;

typedef struct {
	int		reason;
  	XEvent		*event;
	Atom		selection;
	XtEnum		operation;	
	int		flags;
	XtPointer	transfer_id;
	XtPointer	destination_data;
	XtPointer	location_data;
	Time		time;
} XmDestinationCallbackStruct;

typedef struct {
	int		reason;
  	XEvent		*event;
	Atom		selection;
	Atom		target;
	Atom		type;
	XtPointer	transfer_id;
	int		flags;
	int		remaining;
	XtPointer	value;
	unsigned long	length;
	int		format;
} XmSelectionCallbackStruct;

typedef struct {
	int		reason;
  	XEvent		*event;
	Atom		selection;
	XtPointer	transfer_id;
	XmTransferStatus	status;
	XtPointer	client_data;
} XmTransferDoneCallbackStruct;

typedef void (*XmSelectionFinishedProc)(Widget, XtEnum,
					XmTransferDoneCallbackStruct*);

void XmTransferDone(XtPointer, XmTransferStatus);
void XmTransferValue(XtPointer, Atom, XtCallbackProc,
		     XtPointer,	Time);
void XmTransferSetParameters(XtPointer, XtPointer, int,	unsigned long, Atom);
void XmTransferStartRequest(XtPointer);
void XmTransferSendRequest(XtPointer, Time);

#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmTransfer_H */
