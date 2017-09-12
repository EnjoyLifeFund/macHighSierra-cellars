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
 * 
 */
#ifndef _XmPicture_h
#define _XmPicture_h

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <X11/Intrinsic.h>

typedef  struct _XmPictureRec*       XmPicture;
typedef  struct _XmPictureStateRec*  XmPictureState;

#ifdef __cplusplus
extern "C" {
#endif
    
XmPicture      XmParsePicture           (char*);
XmPictureState XmGetNewPictureState     (XmPicture);
char*          XmPictureProcessCharacter(XmPictureState, char, Boolean*);
void           XmPictureDelete          (XmPicture);
void           XmPictureDeleteState     (XmPictureState);
char*          XmPictureGetCurrentString(XmPictureState);
char*          XmPictureDoAutoFill      (XmPictureState);

#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif
/* DON'T ADD ANYTHING AFTER THIS #endif */
