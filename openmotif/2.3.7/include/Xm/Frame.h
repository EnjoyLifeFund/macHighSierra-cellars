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
#ifndef _XmFrame_h
#define _XmFrame_h

#include <Xm/Xm.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifndef XmIsFrame
#define XmIsFrame(w) XtIsSubclass(w, xmFrameWidgetClass)
#endif /* XmIsFrame */

/* Class record constants */

externalref WidgetClass xmFrameWidgetClass;

typedef struct _XmFrameClassRec * XmFrameWidgetClass;
typedef struct _XmFrameRec      * XmFrameWidget;


/********    Public Function Declarations    ********/

extern Widget XmCreateFrame( 
                        Widget parent,
                        char *name,
                        ArgList arglist,
                        Cardinal argcount) ;
extern Widget XmVaCreateFrame(
                        Widget parent,
                        char *name,
                        ...);
extern Widget XmVaCreateManagedFrame(
                        Widget parent,
                        char *name,
                        ...);

/********    End Public Function Declarations    ********/


#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmFrame_h */
/* DON'T ADD ANYTHING AFTER THIS #endif */
