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
/******************************************************************************
 *
 *	File:	SSpinB.h
 *	Date:	June 1, 1995
 *	Author:	Mitchell Greess
 *
 *	Contents:
 *		Public header file for the XmSimpleSpinBox widget.
 *		Implements the XmSimpleSpinBox.
 *
 ******************************************************************************/

#ifndef _XmSSpinB_h
#define _XmSSpinB_h

#include <Xm/Xm.h>

#ifdef __cplusplus
extern "C" {
#endif

/* XmSimpleSpinBox Widget */
externalref WidgetClass xmSimpleSpinBoxWidgetClass;

typedef struct _XmSimpleSpinBoxClassRec *XmSimpleSpinBoxWidgetClass;
typedef struct _XmSimpleSpinBoxRec      *XmSimpleSpinBoxWidget;

/* Spin externs for application accessible functions */
extern Widget XmCreateSimpleSpinBox(
		Widget		parent,
		char		*name,
		ArgList		arglist,
		Cardinal	argcount);

extern void XmSimpleSpinBoxAddItem(
                Widget          widget,
                XmString        item,
                int             pos);

extern void XmSimpleSpinBoxDeletePos(
                Widget          widget,
                int             pos);

extern void XmSimpleSpinBoxSetItem(
                Widget          widget,
                XmString        item);

/*
 * Variable argument list functions
 */

extern Widget XmVaCreateSimpleSpinBox(
                        Widget parent,
                        char *name,
                        ...);

extern Widget XmVaCreateManagedSimpleSpinBox(
                        Widget parent,
                        char *name,
                        ...);

#ifdef __cplusplus
}
#endif

#endif /* _SSpinB_h */

