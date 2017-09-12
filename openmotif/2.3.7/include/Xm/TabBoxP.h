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
#ifndef _XmTabBoxP_h_
#define _XmTabBoxP_h_

#include <Xm/XmP.h>
#include <Xm/ManagerP.h>
#include <Xm/ExtP.h>
#include <Xm/TabBox.h>
#include <Xm/TabList.h>

#ifdef __cplusplus
extern "C" {
#endif


typedef struct _XmTabBoxClassPart {
    XtPointer extension;
} XmTabBoxClassPart;

typedef struct _XmTabBoxClassRec {
    CoreClassPart        core_class;
    CompositeClassPart	 composite_class;
    ConstraintClassPart  constraint_class;
    XmManagerClassPart   manager_class;
    XmTabBoxClassPart    tab_box_class;
} XmTabBoxClassRec;

externalref XmTabBoxClassRec xmTabBoxClassRec;

typedef struct _XmTabBoxPart {
    XmFontList          font_list;
    XmTabStyle          tab_style;
    XmTabMode           tab_mode;
    XmTabbedStackList           tab_list;
    XmTabOrientation    tab_orientation;
    XmTabEdge           tab_edge;
    XmTabArrowPlacement arrow_placement;
    unsigned char       orientation;
    Dimension           tab_margin_width;
    Dimension           tab_margin_height;
    Dimension           tab_label_spacing;
    Dimension           highlight_thickness;
    int                 tab_corner_percent;
    Dimension           tab_offset;
    Boolean	        uniform_tab_size;
    Boolean		tab_auto_select;
    Boolean		use_image_cache;

    Pixel		select_color;
    Pixmap		select_pixmap;

    int                 num_stacks;
    int			selected_index;
    int			traversal_index;

    Boolean		stacked_effect;
    
    XtCallbackList      select_callback;
    XtCallbackList      unselect_callback;

    /* Private */
    GC               _tab_GC;
    GC               _text_GC;
    Pixmap           _gray_stipple;
    XRectangle       *_wanted;
    int              _num_wanted;
    struct _XmTabRect *_actual;
    int              _num_actual;
    int              _selected;
    int		     _keyboard;

    int		     _armed_tab;
    
    int              _scroll_x;
    XRectangle	     _scroll_rect;

    int              _corner_size;

    int		     _num_columns;
    int		     _num_rows;

    /*
     * The following data memebers are used for the rotation of 
     * the pixmap and the text.
     */
    int              _bitmap_width;
    int		     _bitmap_height;
    Pixmap           _bitmap;

    GC		     _zero_GC;
    GC		     _one_GC;

    Widget	     _canvas;
    Widget           _left_arrow;
    Widget           _right_arrow;

    Boolean          _inited;

    struct _XmCache *_cache;
    int              _cache_size;
    
    Boolean		check_set_render_table;
} XmTabBoxPart;

/*
 * Access macros for instance variables
 */

#define XmTabBox_font_list(w) (((XmTabBoxWidget)(w))->tab_box.font_list)
#define XmTabBox_tab_style(w) (((XmTabBoxWidget)(w))->tab_box.tab_style)
#define XmTabBox_tab_mode(w) (((XmTabBoxWidget)(w))->tab_box.tab_mode)
#define XmTabBox_tab_list(w) (((XmTabBoxWidget)(w))->tab_box.tab_list)
#define XmTabBox_tab_orientation(w) (((XmTabBoxWidget)(w))->tab_box.tab_orientation)
#define XmTabBox_tab_edge(w) (((XmTabBoxWidget)(w))->tab_box.tab_edge)
#define XmTabBox_arrow_placement(w) (((XmTabBoxWidget)(w))->tab_box.arrow_placement)
#define XmTabBox_orientation(w) (((XmTabBoxWidget)(w))->tab_box.orientation)
#define XmTabBox_tab_margin_width(w) (((XmTabBoxWidget)(w))->tab_box.tab_margin_width)
#define XmTabBox_tab_margin_height(w) (((XmTabBoxWidget)(w))->tab_box.tab_margin_height)
#define XmTabBox_tab_label_spacing(w) (((XmTabBoxWidget)(w))->tab_box.tab_label_spacing)
#define XmTabBox_highlight_thickness(w) (((XmTabBoxWidget)(w))->tab_box.highlight_thickness)
#define XmTabBox_tab_corner_percent(w) (((XmTabBoxWidget)(w))->tab_box.tab_corner_percent)
#define XmTabBox_tab_offset(w) (((XmTabBoxWidget)(w))->tab_box.tab_offset)
#define XmTabBox_uniform_tab_size(w) (((XmTabBoxWidget)(w))->tab_box.uniform_tab_size)
#define XmTabBox_tab_auto_select(w) (((XmTabBoxWidget)(w))->tab_box.tab_auto_select)
#define XmTabBox_use_image_cache(w) (((XmTabBoxWidget)(w))->tab_box.use_image_cache)
#define XmTabBox_select_color(w) (((XmTabBoxWidget)(w))->tab_box.select_color)
#define XmTabBox_select_pixmap(w) (((XmTabBoxWidget)(w))->tab_box.select_pixmap)
#define XmTabBox_num_stacks(w) (((XmTabBoxWidget)(w))->tab_box.num_stacks)
#define XmTabBox_selected_index(w) (((XmTabBoxWidget)(w))->tab_box.selected_index)
#define XmTabBox_traversal_index(w) (((XmTabBoxWidget)(w))->tab_box.traversal_index)
#define XmTabBox_stacked_effect(w) (((XmTabBoxWidget)(w))->tab_box.stacked_effect)
#define XmTabBox_select_callback(w) (((XmTabBoxWidget)(w))->tab_box.select_callback)
#define XmTabBox_unselect_callback(w) (((XmTabBoxWidget)(w))->tab_box.unselect_callback)
#define XmTabBox__tab_GC(w) (((XmTabBoxWidget)(w))->tab_box._tab_GC)
#define XmTabBox__text_GC(w) (((XmTabBoxWidget)(w))->tab_box._text_GC)
#define XmTabBox__gray_stipple(w) (((XmTabBoxWidget)(w))->tab_box._gray_stipple)
#define XmTabBox__wanted(w) (((XmTabBoxWidget)(w))->tab_box._wanted)
#define XmTabBox__num_wanted(w) (((XmTabBoxWidget)(w))->tab_box._num_wanted)
#define XmTabBox__actual(w) (((XmTabBoxWidget)(w))->tab_box._actual)
#define XmTabBox__num_actual(w) (((XmTabBoxWidget)(w))->tab_box._num_actual)
#define XmTabBox__selected(w) (((XmTabBoxWidget)(w))->tab_box._selected)
#define XmTabBox__keyboard(w) (((XmTabBoxWidget)(w))->tab_box._keyboard)
#define XmTabBox__armed_tab(w) (((XmTabBoxWidget)(w))->tab_box._armed_tab)
#define XmTabBox__scroll_x(w) (((XmTabBoxWidget)(w))->tab_box._scroll_x)
#define XmTabBox__scroll_rect(w) (((XmTabBoxWidget)(w))->tab_box._scroll_rect)
#define XmTabBox__corner_size(w) (((XmTabBoxWidget)(w))->tab_box._corner_size)
#define XmTabBox__num_columns(w) (((XmTabBoxWidget)(w))->tab_box._num_columns)
#define XmTabBox__num_rows(w) (((XmTabBoxWidget)(w))->tab_box._num_rows)
#define XmTabBox__bitmap_width(w) (((XmTabBoxWidget)(w))->tab_box._bitmap_width)
#define XmTabBox__bitmap_height(w) (((XmTabBoxWidget)(w))->tab_box._bitmap_height)
#define XmTabBox__bitmap(w) (((XmTabBoxWidget)(w))->tab_box._bitmap)
#define XmTabBox__zero_GC(w) (((XmTabBoxWidget)(w))->tab_box._zero_GC)
#define XmTabBox__one_GC(w) (((XmTabBoxWidget)(w))->tab_box._one_GC)
#define XmTabBox__canvas(w) (((XmTabBoxWidget)(w))->tab_box._canvas)
#define XmTabBox__left_arrow(w) (((XmTabBoxWidget)(w))->tab_box._left_arrow)
#define XmTabBox__right_arrow(w) (((XmTabBoxWidget)(w))->tab_box._right_arrow)
#define XmTabBox__inited(w) (((XmTabBoxWidget)(w))->tab_box._inited)
#define XmTabBox__cache(w) (((XmTabBoxWidget)(w))->tab_box._cache)
#define XmTabBox__cache_size(w) (((XmTabBoxWidget)(w))->tab_box._cache_size)

typedef struct _XmTabBoxRec {
    CorePart        core;
    CompositePart   composite;
    ConstraintPart  constraint;
    XmManagerPart   manager;
    XmTabBoxPart    tab_box;
} XmTabBoxRec;

#ifdef __cplusplus
} /* Close scope of 'extern "C"' declaration */
#endif

#if defined(VMS) || defined(__VMS)
#include <X11/apienvrst.h>
#endif

#endif /* __TabBoxP_h__ */
