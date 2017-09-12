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
#ifndef _XmListP_h
#define _XmListP_h

#include <Xm/List.h>
#include <Xm/PrimitiveP.h>
#include <Xm/ScrollBar.h>
#include <Xm/ScrolledW.h>
#include <Xm/XmosP.h>

#ifdef __cplusplus
extern "C" {
#endif

/* List struct passed to Convert proc for drag and drop */
typedef struct _XmListDragConvertStruct
{
  Widget    w;
  XmString *strings;
  int       num_strings;
} XmListDragConvertStruct;

/* List class structure */
typedef struct _XmListClassPart
{
  XtPointer extension;		/* Pointer to extension record */
} XmListClassPart;


/* Full class record declaration for List class */
typedef struct _XmListClassRec
{
  CoreClassPart        core_class;
  XmPrimitiveClassPart primitive_class;
  XmListClassPart      list_class;
} XmListClassRec;

externalref XmListClassRec xmListClassRec;

/* Internal form of the list elements. */
typedef	struct {
  Dimension	 height;
  Dimension	 width;
  Boolean	 selected;
  Boolean	 last_selected;
  Boolean	 LastTimeDrawn;
  int		 length;
  wchar_t	 first_char;
} Element, *ElementPtr;

/* The List instance record */
typedef struct _XmListPart
{
  Dimension	    spacing;
  short             ItemSpacing;
  Dimension         margin_width;
  Dimension    	    margin_height;
  XmFontList 	    font;
  XmString	   *items;
  int		    itemCount;
  XmString	   *selectedItems;
  int              *selectedPositions;	/* "selectedIndices" in Motif 1.2 */
  int		    selectedItemCount;
  int 		    visibleItemCount;
  int 		    LastSetVizCount;
  unsigned char	    SelectionPolicy;
  unsigned char	    ScrollBarDisplayPolicy;
  unsigned char	    SizePolicy;
  XmStringDirection StrDir;

  XtEnum	    AutoSelect;
  Boolean	    DidSelection;
  Boolean	    FromSetSB;
  Boolean	    FromSetNewSize;
  unsigned char	    SelectionMode;	/* "Boolean AddMode" in Motif 1.2 */
  unsigned char	    LeaveDir;
  unsigned char	    HighlightThickness;
  int 		    ClickInterval;
  XtIntervalId	    DragID;
  XtCallbackList    SingleCallback;
  XtCallbackList    MultipleCallback;
  XtCallbackList    ExtendCallback;
  XtCallbackList    BrowseCallback;
  XtCallbackList    DefaultCallback;
  
  
  GC		NormalGC;	
  GC		InverseGC;
  GC		HighlightGC;
  Pixmap        DashTile;	/* unused in Motif 1.2 */
  ElementPtr   *InternalList;
  int		LastItem;	/* position of last item in list */
  int		FontHeight;	/* unused in Motif 1.2 */
  int		top_position;
  char		Event;
  int		LastHLItem;

  /* These fields specify the boundaries of the selection (i.e.
   * the current selection) as specified by the "selected" field
   * of the InternalList elements and the boundaries of the 
   * last_selected selection (i.e. the previous selection) as
   * specified by the "last_selected" field of the InternalList
   * elements.
   */
  int		StartItem;
  int		OldStartItem;
  int		EndItem;
  int		OldEndItem;

  Position	BaseX;
  Position	BaseY;

  /* MouseMoved: unused resource from Motif1.2, used now in the
   * CheckSetRenderTable default proc (see List.c). 
   */
  Boolean	MouseMoved;

  Boolean	AppendInProgress;
  Boolean	Traversing;
  Boolean	KbdSelection;
  short		DownCount;
  Time		DownTime;
  int		CurrentKbdItem;	/* position of location cursor */
  unsigned char	SelectionType;
  GC		InsensitiveGC;
  
  int vmin;			/* unused in Motif 1.2 */
  int vmax;			/* unused in Motif 2.0 */
  int vOrigin;			/* unused in Motif 2.0 */
  int vExtent;			/* unused in Motif 2.0 */
  
  int hmin;			/* slider minimum coordiate position */
  int hmax;			/* slider maximum coordiate position */
  int hOrigin;			/* slider edge location              */
  int hExtent;			/* slider size                       */

  Dimension	MaxWidth;
  Dimension	CharWidth;	/* unused in Motif 1.2 */
  Position	XOrigin;
	
  XmScrollBarWidget	  hScrollBar;
  XmScrollBarWidget	  vScrollBar;
  XmScrolledWindowWidget  Mom;
  Dimension		  MaxItemHeight;

  /*--- New fields in Motif 2.0. ---*/
  int		selectedPositionCount;

  unsigned char	matchBehavior;

  /* The AutoSelectionType is used to designate where in the selection
   * process the user currently is when auto select is enabled. For
   * instance, during an extended select, there is a beginning to
   * the selection, possible mouse motions and finally a button release
   * resulting in either a selection identical to what was selected
   * before the beginning or to a selection that is different.
   */
  unsigned char	AutoSelectionType;

  /* PrimaryOwnership is used to describe how the list show take
   * ownership of the primary selection when the user selects list
   * items, with a possible value of NEVER.
   */
  unsigned char	PrimaryOwnership;

  XtCallbackList DestinationCallback;

  /* Selection rendition fields */
  XmRendition	scratchRend;
  Pixel		selectColor;

  /* This field is used to house the top position of the list before a
   * scrolling action begins. If the scrolling action is cancelled, then
   * we restore the list top position by using this field. When scrolling
   * by directly using the scroll bar, we don't need this field since the
   * scroll frame trait handles the reset. When scrolling by selecting
   * items and dragging off the edge of the list, we need to use this
   * field to reset the list position when a user presses the cancel key.
   */
  int		previous_top_position;

  XtIntervalId	drag_start_timer;
  char *	drag_abort_action;
  XEvent	drag_event;
  XmListDragConvertStruct *drag_conv;
} XmListPart;


/* Full instance record declaration */
typedef struct _XmListRec
{
  CorePart	  core;
  XmPrimitivePart primitive;
  XmListPart	  list;
} XmListRec;


#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmListP_h */
/* DON'T ADD ANYTHING AFTER THIS #endif */
