/* $XConsortium: IconGP.h /main/9 1995/10/25 20:06:59 cde-sun $ */
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
#ifndef _XmIconGP_h
#define _XmIconGP_h

#include <Xm/XmP.h>
#include <Xm/ManagerP.h>
#include <Xm/GadgetP.h>
#include <Xm/IconG.h>
#include <Xm/ExtObjectP.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef Widget (*XmGetContainerParentProc)(Widget) ;

#define XmInheritGetContainerParentProc ((XmGetContainerParentProc) _XtInherit)


/* IconGadget class record */
typedef struct _XmIconGadgetClassPart
	{
	XmGetContainerParentProc	get_container_parent;
	XtPointer extension ;
	} 	XmIconGadgetClassPart;


/* Full class record declaration */
typedef struct _XmIconGadgetClassRec
	{
	RectObjClassPart	rect_class;
	XmGadgetClassPart	gadget_class;
	XmIconGadgetClassPart	icong_class;
	} 	XmIconGadgetClassRec;

extern	XmIconGadgetClassRec 	xmIconGadgetClassRec;

/*****************************************************************/
/* The Icon Gadget Cache Object's class and instance records*/
/*****************************************************************/

typedef struct _XmIconGCacheObjClassPart
{
    XtPointer extension;
} XmIconGCacheObjClassPart;


typedef struct _XmIconGCacheObjClassRec  /* Icon cache class record */
{
    ObjectClassPart                     object_class;
    XmExtClassPart                      ext_class;
    XmIconGCacheObjClassPart            icon_class_cache;
} XmIconGCacheObjClassRec;

externalref XmIconGCacheObjClassRec xmIconGCacheObjClassRec;

/*  The Icon Gadget Cache instance record  */

typedef struct _XmIconGCacheObjPart
{
   XmRenderTable    render_table;		/* XmNrenderTable */
   GC               selected_GC;
   GC               inverse_GC;
 	
   Pixel            background;
   Pixel            foreground;
   Pixel            top_shadow_color;
   Pixel            bottom_shadow_color;
   Pixel            highlight_color;

   Pixmap           background_pixmap;
   Pixmap           top_shadow_pixmap;
   Pixmap           bottom_shadow_pixmap;
   Pixmap           highlight_pixmap;

   GC               normal_GC;
   GC               background_GC;
   GC               insensitive_GC;
   GC               top_shadow_GC;
   GC               bottom_shadow_GC;
   GC               highlight_GC;
  
   unsigned char    alignment;
   Dimension        spacing;
   Dimension        margin_width;
   Dimension        margin_height;
#ifdef FIX_1381
   GC               shadow_GC;
#endif
} XmIconGCacheObjPart;

typedef struct _XmIconGCacheObjRec
{
  ObjectPart                object;
  XmExtPart		    ext;
  XmIconGCacheObjPart       icon_cache;
} XmIconGCacheObjRec;

typedef struct _XmIconGCacheObjRec   * XmIconGCacheObject;

/* IconGadget instance record */
typedef struct _XmIconGadgetPart
	{
	XmString	label_string;		/* XmNlabelString */
	Pixmap		large_icon_mask;	/* XmNlargeIconMask */
	Pixmap		large_icon_pixmap;	/* XmNlargeIconPixmap */
	Pixmap		small_icon_mask;	/* XmNsmallIconMask */
	Pixmap		small_icon_pixmap;	/* XmNsmallIconPixmap */
	unsigned char	viewtype;		/* XmNviewType */
	unsigned char	visual_emphasis;	/* XmNvisualEmphasis */
	XmString *	detail;	                /* XmNdetail */
	Cardinal	detail_count;	        /* XmNdetailCount */
	/* Private variables */
	Dimension	label_rect_width ;
	Dimension	label_rect_height ;
	Dimension	large_icon_rect_width;
	Dimension	large_icon_rect_height;
	Dimension	small_icon_rect_width;
	Dimension	small_icon_rect_height;
	String          large_pixmap_name ;
	String          small_pixmap_name ;

	XmIconGCacheObjPart  *cache;
   	Boolean	        check_set_render_table;
} XmIconGadgetPart;

/* Full instance record declaration */
typedef struct _XmIconGadgetRec
	{
	ObjectPart	object;
	RectObjPart	rectangle;
	XmGadgetPart	gadget;
	XmIconGadgetPart icong;
	} 	XmIconGadgetRec;


/* Useful macros */
#define	IG_LabelString(w)	(((XmIconGadget)(w))->icong.label_string)
#define	IG_LargeIconMask(w)	(((XmIconGadget)(w))->icong.large_icon_mask)
#define	IG_LargeIconPixmap(w)	(((XmIconGadget)(w))->icong.large_icon_pixmap)
#define	IG_SmallIconMask(w)	(((XmIconGadget)(w))->icong.small_icon_mask)
#define IG_SmallIconPixmap(w)	(((XmIconGadget)(w))->icong.small_icon_pixmap)
#define	IG_ViewType(w)		(((XmIconGadget)(w))->icong.viewtype)
#define	IG_VisualEmphasis(w)	(((XmIconGadget)(w))->icong.visual_emphasis)
#define	IG_Detail(w)	        (((XmIconGadget)(w))->icong.detail)
#define	IG_DetailCount(w)	(((XmIconGadget)(w))->icong.detail_count)
#define	IG_LabelRectWidth(w)	(((XmIconGadget)(w))->icong.label_rect_width)
#define	IG_LabelRectHeight(w)	(((XmIconGadget)(w))->icong.label_rect_height)
#define	IG_LargeIconRectWidth(w) \
                (((XmIconGadget)(w))->icong.large_icon_rect_width)
#define	IG_LargeIconRectHeight(w) \
		(((XmIconGadget)(w))->icong.large_icon_rect_height)
#define	IG_SmallIconRectWidth(w) \
		(((XmIconGadget)(w))->icong.small_icon_rect_width)
#define	IG_SmallIconRectHeight(w) \
		(((XmIconGadget)(w))->icong.small_icon_rect_height)
#define	IG_LargePixmapName(w) (((XmIconGadget)(w))->icong.large_pixmap_name)
#define	IG_SmallPixmapName(w) (((XmIconGadget)(w))->icong.small_pixmap_name)

/* XmNrecomputeSize didn't make it as a resource, but since the
   code is already written, I'll keep it and force its value here.
   If it's ever wanted back, just replace that macro by:
 #define IG_RecomputeSize(w)	(((XmIconGadget)(w))->icong.recompute_size) */
#define	IG_RecomputeSize(w)	(True) 

#define	IG_LayoutDirection(w)	(((XmIconGadget)(w))->gadget.layout_direction)
#define	IG_Highlighted(w)	(((XmIconGadget)(w))->gadget.highlighted)
#define	IG_HLThickness(w)     (((XmIconGadget)(w))->gadget.highlight_thickness)
#define	IG_ShadowThickness(w)	(((XmIconGadget)(w))->gadget.shadow_thickness)
#define	IG_Depth(w)		(((XmManagerWidget) \
			      (((XmGadget)(w))->object.parent))->core.depth)

/* cached resources for IconGadget */
#define	IG_RenderTable(w)	(((XmIconGadget)(w))-> \
				 icong.cache->render_table)
#define	IG_SelectedGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->selected_GC)
#define	IG_InverseGC(w)	        (((XmIconGadget)(w))-> \
				 icong.cache->inverse_GC)

/** These are gadget resources really. hopefully in 2.1,
    that will be replaced by stuff like:
    #define	IG_Background(w)    Gad_Background(w)
    #define	IG_BackgroundGC(w)  Gad_BackgroundGC(w)
    etc, etc ***/
#define	IG_Background(w)	(((XmIconGadget)(w))-> \
				 icong.cache->background)
#define	IG_Foreground(w)	(((XmIconGadget)(w))-> \
				 icong.cache->foreground)
#define	IG_TopShadowColor(w)	(((XmIconGadget)(w))-> \
				 icong.cache->top_shadow_color)
#define	IG_BottomShadowColor(w)	(((XmIconGadget)(w))-> \
				 icong.cache->bottom_shadow_color)
#define	IG_HighlightColor(w)	(((XmIconGadget)(w))-> \
				 icong.cache->highlight_color)

#define	IG_BackgroundPixmap(w)	(((XmIconGadget)(w))-> \
				 icong.cache->background_pixmap)
#define	IG_TopShadowPixmap(w)	(((XmIconGadget)(w))-> \
				 icong.cache->top_shadow_pixmap)
#define	IG_BottomShadowPixmap(w)	(((XmIconGadget)(w))-> \
				 icong.cache->bottom_shadow_pixmap)
#define	IG_HighlightPixmap(w)	(((XmIconGadget)(w))-> \
				 icong.cache->highlight_pixmap)

#define	IG_NormalGC(w)	        (((XmIconGadget)(w))-> \
				 icong.cache->normal_GC)
#define	IG_BackgroundGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->background_GC)
#define	IG_InsensitiveGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->insensitive_GC)
#ifdef FIX_1381
#define	IG_ShadowGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->shadow_GC)
#endif
#define	IG_TopShadowGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->top_shadow_GC)
#define	IG_BottomShadowGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->bottom_shadow_GC)
#define	IG_HighlightGC(w)	(((XmIconGadget)(w))-> \
				 icong.cache->highlight_GC)
#define	IG_Alignment(w) 	(((XmIconGadget)(w))-> \
				 icong.cache->alignment)
#define	IG_Spacing(w) 	 	(((XmIconGadget)(w))-> \
				 icong.cache->spacing)
#define	IG_MarginWidth(w) 	(((XmIconGadget)(w))-> \
				 icong.cache->margin_width)
#define	IG_MarginHeight(w) 	(((XmIconGadget)(w))-> \
				 icong.cache->margin_height)


/* Convenience Macros */
#define IG_Cache(w)            (((XmIconGadget)(w))->icong.cache)
#define IG_ClassCachePart(w)   (((XmIconGadgetClass)xmIconGadgetClass)->\
				gadget_class.cache_part)

#ifdef __cplusplus
}  /* Close scope of 'extern "C"' declaration which encloses file. */
#endif

#endif /* _XmIconGP_h */
/* DON'T ADD ANYTHING AFTER THIS #endif */
