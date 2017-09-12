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

/********************************************
 *
 *   No new fields need to be defined
 *   for the Toggle widget class record
 *
 ********************************************/

#ifndef _XmToggleButtonGP_h
#define _XmToggleButtonGP_h

#include <Xm/ToggleBG.h>
#include <Xm/LabelGP.h>

#ifdef __cplusplus
extern "C" {
#endif

/*************************************************************/
/* The  ToggleButton Gadget Cache Object's class and instance records*/
/*************************************************************/


typedef struct _XmToggleButtonGCacheObjClassPart
{
    int foo;
} XmToggleButtonGCacheObjClassPart;


typedef struct _XmToggleButtonGCacheObjClassRec 
{
	ObjectClassPart                     object_class;
        XmExtClassPart                      ext_class;
	XmLabelGCacheObjClassPart           label_class_cache;
	XmToggleButtonGCacheObjClassPart    toggle_class_cache;
} XmToggleButtonGCacheObjClassRec;

externalref XmToggleButtonGCacheObjClassRec xmToggleButtonGCacheObjClassRec;


typedef struct _XmToggleButtonGCacheObjPart
{ 
   unsigned char	ind_type;
   Boolean		visible;
   Dimension		spacing;
   Dimension		indicator_dim;
   Pixmap		on_pixmap; 
   Pixmap		insen_pixmap; 
   unsigned char	ind_on;
   Boolean		fill_on_select;
   Pixel		select_color;
   GC			select_GC;
   GC			background_gc;
   GC                   arm_GC;    /* used in menus when enableEtchedInMenu 
				      is set. */
   unsigned char        toggle_mode;
   Boolean		reversed_select;
   Pixmap               indeterminate_pixmap;
   Pixmap               indeterminate_insensitive_pixmap;
   Pixel                unselect_color;
   GC                   unselect_GC;
   GC                   indeterminate_GC;
   GC                   indeterminate_box_GC;
   Dimension		ind_left_delta;
   Dimension		ind_right_delta;
   Dimension		ind_top_delta;
   Dimension		ind_bottom_delta;
} XmToggleButtonGCacheObjPart;

typedef struct _XmToggleButtonGCacheObjRec
{
    ObjectPart                              object;
    XmExtPart                		    ext;
    XmLabelGCacheObjPart     		    label_cache;
    XmToggleButtonGCacheObjPart             toggle_cache;
} XmToggleButtonGCacheObjRec;


/****************************************************
 *
 * Full class record declaration for Toggle class
 *
 ****************************************************/

typedef struct _XmToggleButtonGadgetClassPart
 {
   XtPointer				   extension;
 } XmToggleButtonGadgetClassPart;


typedef struct _XmToggleButtonGadgetClassRec {
    RectObjClassPart  	 	  	rect_class;
    XmGadgetClassPart  			gadget_class;
    XmLabelGadgetClassPart 	    	label_class;
    XmToggleButtonGadgetClassPart	toggle_class;
} XmToggleButtonGadgetClassRec;


externalref XmToggleButtonGadgetClassRec xmToggleButtonGadgetClassRec;


typedef struct _XmToggleButtonGadgetPart
{ 
   Boolean		indicator_set;
   unsigned char	set;
   unsigned char      	visual_set; /* used for visuals and does not reflect
   		                            the true state of the button */
   Boolean     		Armed;
   XtCallbackList       value_changed_CB,
			arm_CB,
		        disarm_CB;

   XmToggleButtonGCacheObjPart  *cache; /* Replace cache instance fields */
					/* with a pointer */

   Dimension detail_shadow_thickness ;
} XmToggleButtonGadgetPart;



/****************************************************************
 *
 * Full instance record declaration
 *
 ****************************************************************/

typedef struct _XmToggleButtonGadgetRec {
    ObjectPart			object;
    RectObjPart			rectangle;
    XmGadgetPart		gadget;
    XmLabelGadgetPart		label;
    XmToggleButtonGadgetPart	toggle;
} XmToggleButtonGadgetRec;


/**********/
/* MACROS */
/**********/
 
/* Macros for cached instance fields */

#define TBG_IndType(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->ind_type)
#define TBG_Visible(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->visible)
#define TBG_Spacing(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->spacing)
#define TBG_IndicatorDim(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->indicator_dim)
#define TBG_OnPixmap(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->on_pixmap)
#define TBG_InsenPixmap(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->insen_pixmap)
#define TBG_IndOn(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->ind_on)
#define TBG_FillOnSelect(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->fill_on_select)
#define TBG_ReversedSelect(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->reversed_select)
#define TBG_SelectColor(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->select_color)
#define TBG_SelectGC(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->select_GC)
#define TBG_BackgroundGC(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->background_gc)
#define TBG_ArmGC(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->arm_GC)
#define TBG_ToggleMode(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->toggle_mode)
#define TBG_IndeterminatePixmap(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->indeterminate_pixmap)
#define TBG_IndeterminateInsensitivePixmap(w)	\
	(((XmToggleButtonGadget) (w)) ->	\
	 toggle.cache->indeterminate_insensitive_pixmap)
#define TBG_IndeterminateGC(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->indeterminate_GC)
#define TBG_IndeterminateBoxGC(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->indeterminate_box_GC)
#define TBG_UnselectColor(w)    \
	(((XmToggleButtonGadget) (w)) -> toggle.cache->unselect_color)
#define TBG_UnselectGC(w)       \
	(((XmToggleButtonGadget) (w)) -> toggle.cache->unselect_GC)
#define TBG_IndLeftDelta(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->ind_left_delta)
#define TBG_IndRightDelta(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->ind_right_delta)
#define TBG_IndTopDelta(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->ind_top_delta)
#define TBG_IndBottomDelta(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.cache->ind_bottom_delta)

/***************************************/
/* Macros for uncached instance fields */

#define TBG_IndicatorSet(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.indicator_set)
#define TBG_Set(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.set)
#define TBG_VisualSet(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.visual_set)
#define TBG_ValueChangedCB(w)	\
	(((XmToggleButtonGadget) (w)) -> toggle.value_changed_CB)
#define TBG_ArmCB(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.arm_CB)
#define TBG_DisarmCB(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.disarm_CB)
#define TBG_Armed(w)		\
	(((XmToggleButtonGadget) (w)) -> toggle.Armed)

/******************************/
/* Convenience Macros         */
/******************************/

#define TBG_Cache(w)		(((XmToggleButtonGadget)(w))->toggle.cache)
#define TBG_ClassCachePart(w)	\
        (((XmToggleButtonGadgetClass)xmToggleButtonGadgetClass)->gadget_class.cache_part)


#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmToggleButtonGP_h */
/* DON'T ADD ANYTHING AFTER THIS #endif */
