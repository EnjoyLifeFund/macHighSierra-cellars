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
/*   $XConsortium: mainE.h /main/6 1995/07/14 10:03:41 drk $ */

#if ( defined main_h )
#define extern 
#endif

extern void SetSensitive(Widget cascade, String item, Boolean sensitive);

extern void ViewError(ViewPtr this, XmString s1, XmString s2);

extern void ViewWarning(ViewPtr this, XmString s1, XmString s2);

extern XmString FetchString(ViewPtr this, String name);


#if ( defined main_h )
#define extern 
#endif
