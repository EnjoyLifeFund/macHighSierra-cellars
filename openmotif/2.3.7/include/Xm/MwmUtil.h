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
#ifndef _XmMwmUtil_h
#define _XmMwmUtil_h

#include <X11/X.h>	/* for Window typedefs */
#include <X11/Xmd.h>	/* for protocol typedefs */

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Contents of the _MWM_HINTS property.
 */

typedef struct
{
    /* These correspond to XmRInt resources. (VendorSE.c) */
    int	         flags;
    int		 functions;
    int		 decorations;
    int		 input_mode;
    int		 status;
} MotifWmHints;

typedef MotifWmHints	MwmHints;

/* bit definitions for MwmHints.flags */
#define MWM_HINTS_FUNCTIONS	(1L << 0)
#define MWM_HINTS_DECORATIONS	(1L << 1)
#define MWM_HINTS_INPUT_MODE	(1L << 2)
#define MWM_HINTS_STATUS	(1L << 3)

/* bit definitions for MwmHints.functions */
#define MWM_FUNC_ALL		(1L << 0)
#define MWM_FUNC_RESIZE		(1L << 1)
#define MWM_FUNC_MOVE		(1L << 2)
#define MWM_FUNC_MINIMIZE	(1L << 3)
#define MWM_FUNC_MAXIMIZE	(1L << 4)
#define MWM_FUNC_CLOSE		(1L << 5)

/* bit definitions for MwmHints.decorations */
#define MWM_DECOR_ALL		(1L << 0)
#define MWM_DECOR_BORDER	(1L << 1)
#define MWM_DECOR_RESIZEH	(1L << 2)
#define MWM_DECOR_TITLE		(1L << 3)
#define MWM_DECOR_MENU		(1L << 4)
#define MWM_DECOR_MINIMIZE	(1L << 5)
#define MWM_DECOR_MAXIMIZE	(1L << 6)


/* definitions for running automated tests */


#define WINDOW_MINIMIZE_INFO	    	0
#define WINDOW_MAXIMIZE_INFO	        1
#define WINDOW_MOVE_INFO	        2
#define WINDOW_RAISE_INFO	        3
#define WINDOW_RESIZE_NORTH_INFO       	4
#define WINDOW_RESIZE_SOUTH_INFO       	5
#define WINDOW_RESIZE_EAST_INFO        	6
#define WINDOW_RESIZE_WEST_INFO        	7
#define WINDOW_RESIZE_NORTHEAST_INFO   	8
#define WINDOW_RESIZE_NORTHWEST_INFO   	9
#define WINDOW_RESIZE_SOUTHEAST_INFO   	10
#define WINDOW_RESIZE_SOUTHWEST_INFO   	11
#define WINDOW_MENU_ITEM_SELECT_INFO    12  
#define WINDOW_DEICONIFY_INFO          	13
#define WINDOW_MENU_POST_INFO   	14
#define WINDOW_FOCUS_INFO              	15  
#define WINDOW_MENU_UNPOST_INFO  	16
#define WINDOW_MENU_ITEM_CHECK_INFO  	17
#define ICON_MOVE_INFO   	        18
#define ICON_MENU_POST_INFO   	        19
#define ICON_MENU_UNPOST_INFO   	20
#define ICON_MENU_ITEM_SELECT_INFO   	21

#define WM_NORTHWEST                    0
#define WM_NORTH                        1
#define WM_NORTHEAST                    2
#define WM_WEST                         3
#define WM_EAST                         4
#define WM_SOUTHWEST                    5
#define WM_SOUTH                        6
#define WM_SOUTHEAST                    7

#define INVALID -1
#define MAX_MENU_ITEMS 20
#define MAX_NAME_LEN 95


/* values for MwmHints.input_mode */
#define MWM_INPUT_MODELESS			0
#define MWM_INPUT_PRIMARY_APPLICATION_MODAL	1
#define MWM_INPUT_SYSTEM_MODAL			2
#define MWM_INPUT_FULL_APPLICATION_MODAL	3

/* bit definitions for MwmHints.status */
#define MWM_TEAROFF_WINDOW	(1L << 0)

/*
 * The following is for compatibility only. It use is deprecated.
 */
#define MWM_INPUT_APPLICATION_MODAL	MWM_INPUT_PRIMARY_APPLICATION_MODAL


/*
 * Contents of the _MWM_INFO property.
 */

typedef struct
{
    long	flags;
    Window	wm_window;
} MotifWmInfo;

typedef MotifWmInfo	MwmInfo;

/* bit definitions for MotifWmInfo .flags */
#define MWM_INFO_STARTUP_STANDARD	(1L << 0)
#define MWM_INFO_STARTUP_CUSTOM		(1L << 1)



/*
 * Definitions for the _MWM_HINTS property.
 */

typedef struct
{
    /* 32-bit property items are stored as long on the client (whether
     * that means 32 bits or 64).  XChangeProperty handles the conversion
     * to the actual 32-bit quantities sent to the server.
     */
    unsigned long	flags;
    unsigned long	functions;
    unsigned long	decorations;
    long 	        inputMode;
    unsigned long	status;
} PropMotifWmHints;

typedef PropMotifWmHints	PropMwmHints;


/* number of elements of size 32 in _MWM_HINTS */
#define PROP_MOTIF_WM_HINTS_ELEMENTS	5
#define PROP_MWM_HINTS_ELEMENTS		PROP_MOTIF_WM_HINTS_ELEMENTS

/* atom name for _MWM_HINTS property */
#define _XA_MOTIF_WM_HINTS	"_MOTIF_WM_HINTS"
#define _XA_MWM_HINTS		_XA_MOTIF_WM_HINTS

/*
 * Definitions for the _MWM_MESSAGES property.
 */

#define _XA_MOTIF_WM_MESSAGES	"_MOTIF_WM_MESSAGES"
#define _XA_MWM_MESSAGES	_XA_MOTIF_WM_MESSAGES

/* atom that enables client frame offset messages */
#define _XA_MOTIF_WM_OFFSET	"_MOTIF_WM_OFFSET"

/*
 * Definitions for the _MWM_MENU property.
 */

/* atom name for _MWM_MENU property */
#define _XA_MOTIF_WM_MENU	"_MOTIF_WM_MENU"
#define _XA_MWM_MENU		_XA_MOTIF_WM_MENU


/*
 * Definitions for the _MWM_INFO property.
 */

typedef struct
{
  /* 32-bit property items are stored as long on the client (whether
   * that means 32 bits or 64).  XChangeProperty handles the conversion
   * to the actual 32-bit quantities sent to the server.
   */
  long		flags;
  Window	wmWindow;
} PropMotifWmInfo;

typedef PropMotifWmInfo	PropMwmInfo;


/* number of elements of size 32 in _MWM_INFO */
#define PROP_MOTIF_WM_INFO_ELEMENTS	2
#define PROP_MWM_INFO_ELEMENTS		PROP_MOTIF_WM_INFO_ELEMENTS

/* atom name for _MWM_INFO property */
#define _XA_MOTIF_WM_INFO	"_MOTIF_WM_INFO"
#define _XA_MWM_INFO		_XA_MOTIF_WM_INFO


/*
 * Miscellaneous atom definitions
 */

/* atom for motif input bindings */
#define _XA_MOTIF_BINDINGS	"_MOTIF_BINDINGS"

#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmMwmUtil_h */
