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
#ifndef _XmPButtonGP_h
#define _XmPButtonGP_h

#include <Xm/PushBG.h>
#include <Xm/LabelGP.h>

#ifdef __cplusplus
extern "C" {
#endif

/*************************************************************/
/* The PushButton Gadget Cache Object's class and instance records*/
/*************************************************************/

typedef struct _XmPushButtonGCacheObjClassPart
{
    int foo;
} XmPushButtonGCacheObjClassPart;

					
typedef struct _XmPushButtonGCacheObjClassRec  
{
	ObjectClassPart                     object_class;
        XmExtClassPart                      ext_class;
	XmLabelGCacheObjClassPart           label_class_cache;
	XmPushButtonGCacheObjClassPart      pushbutton_class_cache;
} XmPushButtonGCacheObjClassRec;

externalref XmPushButtonGCacheObjClassRec xmPushButtonGCacheObjClassRec;


typedef struct _XmPushButtonGCacheObjPart
{
   Boolean 	    fill_on_arm;
   Pixel            arm_color;
   Pixmap	    arm_pixmap;
   Pixmap           unarm_pixmap;
   unsigned char    multiClick;     /* KEEP/DISCARD resource */
   Dimension        default_button_shadow_thickness;
		     /* New resource - always add it to gadget's dimension. */

   GC               fill_gc;
   GC               background_gc;

   /* following items have some persistence across gadget instances and are
   ** here only for data-space savings
   */
   XtIntervalId     timer;
   Widget           timer_widget;
   
} XmPushButtonGCacheObjPart;

typedef struct _XmPushButtonGCacheObjRec
{
    ObjectPart                   object;
    XmExtPart                    ext;
    XmLabelGCacheObjPart         label_cache;
    XmPushButtonGCacheObjPart    pushbutton_cache;
} XmPushButtonGCacheObjRec;


/* PushButton class structure */

typedef struct _XmPushButtonGadgetClassPart
{
    XtPointer extension;  /* Pointer to extension record */
} XmPushButtonGadgetClassPart;


/* Full class record declaration for PushButton class */

typedef struct _XmPushButtonGadgetClassRec 
{
   RectObjClassPart             rect_class;
   XmGadgetClassPart            gadget_class;
   XmLabelGadgetClassPart       label_class;
   XmPushButtonGadgetClassPart  pushbutton_class;

} XmPushButtonGadgetClassRec;


externalref XmPushButtonGadgetClassRec xmPushButtonGadgetClassRec;


/* PushButton instance record */

typedef struct _XmPushButtonGadgetPart
{
   XtCallbackList   activate_callback;
   XtCallbackList   arm_callback;
   XtCallbackList   disarm_callback;

   Dimension        show_as_default;
   Boolean 	    armed;
   int              click_count;

   Boolean	    compatible;	  /* if false it is Motif 1.1 else Motif 1.0  */
                                  /* not cached for performance reasons */
   
   XmPushButtonGCacheObjPart  *cache; /* Replace cache instance fields */
					/* with a pointer */
} XmPushButtonGadgetPart;

/* Full instance record declaration */

typedef struct _XmPushButtonGadgetRec {
   ObjectPart              object;
   RectObjPart             rectangle;
   XmGadgetPart            gadget;
   XmLabelGadgetPart       label;
   XmPushButtonGadgetPart   pushbutton;
} XmPushButtonGadgetRec;

/* MACROS */
/**********/

/* Macros for cached instance fields */

#define PBG_FillOnArm(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->fill_on_arm)
#define PBG_ArmColor(w)			(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->arm_color)
#define PBG_FillGc(w)			(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->fill_gc)
#define PBG_BackgroundGc(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->background_gc)
#define PBG_Timer(w)			(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->timer)
#define PBG_ArmPixmap(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->arm_pixmap)
#define PBG_UnarmPixmap(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.cache->unarm_pixmap)
#define PBG_MultiClick(w)      		(((XmPushButtonGadget) (w)) -> \
                       			   pushbutton.cache->multiClick)
#define PBG_DefaultButtonShadowThickness(w)     (((XmPushButtonGadget) (w)) -> \
                       pushbutton.cache->default_button_shadow_thickness)

/* Macros for uncached instance fields */

#define PBG_ActivateCallback(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.activate_callback)
#define PBG_ArmCallback(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.arm_callback)
#define PBG_DisarmCallback(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.disarm_callback)
#define PBG_Armed(w)			(((XmPushButtonGadget) (w)) -> \
					   pushbutton.armed)
#define PBG_ClickCount(w)      (((XmPushButtonGadget) (w)) -> \
                       pushbutton.click_count)
#define PBG_Compatible(w)      (((XmPushButtonGadget) (w)) -> \
                       pushbutton.compatible)
#define PBG_ShowAsDefault(w)		(((XmPushButtonGadget) (w)) -> \
					   pushbutton.show_as_default)

/******************************/
/* Convenience Macros         */
/******************************/

#define PBG_Cache(w)			(((XmPushButtonGadget)(w))->\
					   pushbutton.cache)
#define PBG_ClassCachePart(w) \
	(((XmPushButtonGadgetClass)xmPushButtonGadgetClass)->gadget_class.cache_part)


/********    Private Function Declarations    ********/

/********    End Private Function Declarations    ********/


#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmPButtonGP_h */
/* DON'T ADD ANYTHING AFTER THIS #endif */
