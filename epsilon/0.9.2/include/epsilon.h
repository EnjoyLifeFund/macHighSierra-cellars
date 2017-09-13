/*
 * $Id: epsilon.h,v 1.61 2010/02/05 23:50:22 simakov Exp $
 *
 * EPSILON - wavelet image compression library.
 * Copyright (C) 2006,2007,2010 Alexander Simakov, <xander@entropyware.info>
 *
 * This file is part of EPSILON
 *
 * EPSILON is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EPSILON is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with EPSILON.  If not, see <http://www.gnu.org/licenses/>.
 *
 * http://epsilon-project.sourceforge.net
 */

/** \file
 *
 *  \brief Top-level library interface
 *
 *  This file contains top-level library interface. This is the
 *  only header that user program needs to include. */

/** \mainpage EPSILON - wavelet image compression library
 *
 *  \section about_sec About
 *
 *  EPSILON is an OpenSource wavelet image compression library.
 *  The library consists of several independed modules and have
 *  very simple and clear layout. Each module is intensively
 *  tested and carefully documented. This manual can be thought
 *  as an exhaustive library API reference. It covers top-level
 *  library interface as well as library internals. Being included
 *  into the source code the information presented here is
 *  always up to date.
 *
 *  \section contact_sec Contact
 *
 *  Feedback, bug-reports and patches are welcome.
 *  Feel free to write: Alexander Simakov,
 *  &lt;<a href="mailto:xander@entropyware.info">xander@entropyware.info</a>&gt;
 *
 *  <a href="http://epsilon-project.sourceforge.net">http://epsilon-project.sourceforge.net</a><br> */

#ifndef __EPSILON_H__
#define __EPSILON_H__

#ifdef __cplusplus
extern "C" {
#endif

#include <inttypes.h>

/** \addtogroup toplevel Top-level library interface */
/*@{*/

/** Block marker
 *
 *  Each block in the stream should be terminated
 *  with one or more \ref EPS_MARKER values. This
 *  technique greatly improves overall system
 *  robustness and leads to quick stream
 *  resynchronization. */
#define EPS_MARKER              0x00

/** GRAYSCALE block
 *
 *  This type of blocks is intended for storing grayscale
 *  image data. */
#define EPS_GRAYSCALE_BLOCK     1

/** TRUECOLOR block
 *
 *  This type of blocks is intended for storing truecolor
 *  image data. */
#define EPS_TRUECOLOR_BLOCK     2

/** Maximal (recomended) block width and height */
#define EPS_MAX_BLOCK_SIZE       1024
/** Minimal (recomended) block width and height */
#define EPS_MIN_BLOCK_SIZE       32

/** Minimal (mandatory) buffer size for GRAYSCALE block */
#define EPS_MIN_GRAYSCALE_BUF   256
/** Maximal (recomended) buffer size for GRAYSCALE block */
#define EPS_MAX_GRAYSCALE_BUF   2 * EPS_MAX_BLOCK_SIZE * EPS_MAX_BLOCK_SIZE
/** Minimal (mandatory) buffer size for TRUECOLOR block */
#define EPS_MIN_TRUECOLOR_BUF   256
/** Maximal (recomended) buffer size for TRUECOLOR block */
#define EPS_MAX_TRUECOLOR_BUF   6 * EPS_MAX_BLOCK_SIZE * EPS_MAX_BLOCK_SIZE

/** Normal mode
 *
 *  This mode assumes that image is square and height = width = 2 ^ N. */
#define EPS_MODE_NORMAL         0

/** OTLPF mode
 *
 *  This mode also assumes that image is square, but height = width = (2 ^ N) + 1.
 *  In a few words, OTLPF is some kind of hack to reduce boundary artefacts
 *  when image is broken into several tiles. Due to mathematical constrains
 *  this method can be applied to biorthogonal filters only. */
#define EPS_MODE_OTLPF          1

/** Data or header CRC is correct */
#define EPS_GOOD_CRC            0
/** Data or header CRC is incorrect */
#define EPS_BAD_CRC             1

/** Extract all filterbank IDs */
#define EPS_FB_ID               0
/** Extract all filterbank names */
#define EPS_FB_NAME             1
/** Extract all filterbank orthogonality types */
#define EPS_FB_TYPE             2

/** Default bit-budget percent for the Y channel */
#define EPS_Y_RT                90
/** Default bit-budget percent for the Cb channel */
#define EPS_Cb_RT               5
/** Default bit-budget percent for the Cr channel */
#define EPS_Cr_RT               5

/** Minimal value for bit-budget percent value */
#define EPS_MIN_RT              1
/** Maximal value for bit-budget percent value */
#define EPS_MAX_RT              98

/** Perform no image resampling */
#define EPS_RESAMPLE_444        0
/** Resample image according to the 4:2:0 scheme */
#define EPS_RESAMPLE_420        1

/** Successful operation */
#define EPS_OK                  0
/** Incorrect function parameter */
#define EPS_PARAM_ERROR         1
/** Incorrect data format */
#define EPS_FORMAT_ERROR        2
/** Specified filterbank is not supported */
#define EPS_UNSUPPORTED_FB      3

/** Type definition for CRC32 value */
typedef uint32_t crc32_t;

/** GRAYSCALE block header */
typedef struct gs_hdr_tag {
    /** Image width */
    int W;
    /** Image height */
    int H;
    /** Block width */
    int w;
    /** Block height */
    int h;
    /** Block X coordinate */
    int x;
    /** Block Y coordinate */
    int y;
    /** Either \ref EPS_MODE_NORMAL or \ref EPS_MODE_OTLPF */
    int mode;
    /** DC value */
    int dc;
    /** Filterbank ID (should not be modified or released) */
    char *fb_id;
} gs_hdr;

/** TRUECOLOR block header */
typedef struct tc_hdr_tag {
    /** Image width */
    int W;
    /** Image height */
    int H;
    /** Block width */
    int w;
    /** Block height */
    int h;
    /** Block X coordinate */
    int x;
    /** Block Y coordinate */
    int y;
    /** Either \ref EPS_MODE_NORMAL or \ref EPS_MODE_OTLPF */
    int mode;
    /** Either \ref EPS_RESAMPLE_444 or \ref EPS_RESAMPLE_420 */
    int resample;
    /** DC value of the Y channel */
    int dc_Y;
    /** DC value of the Cb channel */
    int dc_Cb;
    /** DC value of the Cr channel */
    int dc_Cr;
    /** Initial ratio of the Y channel */
    int Y_rt;
    /** Initial ratio of the Cb channel */
    int Cb_rt;
    /** Initial ratio of the Cr channel */
    int Cr_rt;
    /** Filterbank ID (should not be modified or released) */
    char *fb_id;
} tc_hdr;

/** Generic block header */
typedef struct eps_block_header_tag {
    /** Block type
     *
     *  Either \ref EPS_GRAYSCALE_BLOCK or \ref EPS_TRUECOLOR_BLOCK. */
    int block_type;

    /** Header size in bytes */
    int hdr_size;
    /** Data size in bytes */
    int data_size;

    /** Header CRC */
    crc32_t chk;
    /** Data CRC */
    crc32_t crc;

    /** Header CRC flag
     *
     *  Either \ref EPS_GOOD_CRC or \ref EPS_BAD_CRC */
    int chk_flag;
    /** Data CRC flag
     *
     *  Either \ref EPS_GOOD_CRC or \ref EPS_BAD_CRC */
    int crc_flag;

    union {
        /** Special information for GRAYSCALE blocks */
        gs_hdr gs;
        /** Special information for TRUECOLOR blocks */
        tc_hdr tc;
    } hdr_data;
} eps_block_header;

/** Query available filterbanks
 *
 *  Depending on the \a type parameter this function
 *  composes a \c NULL terminated list of all available
 *  filterbank IDs, names or orthogonality types.
 *
 *  \note The caller should subsequently release allocated list
 *  (using \ref eps_free_fb_info function) when it is no longer
 *  required.
 *
 *  \note The caller should not modify allocated structure.

 *  \param type Type of information: either \ref EPS_FB_ID or
 *  \ref EPS_FB_NAME or \ref EPS_FB_TYPE
 *
 *  \return List of strings */
char **eps_get_fb_info(int type);

/** Release filterbank information
 *
 *  This function releases filterbank infomation,
 *  allocated by the \ref eps_get_fb_info function.
 *
 *  \param info List of strings
 *
 *  \return \c VOID */
void eps_free_fb_info(char **info);

/** Memory allocation
 *
 *  This function allocates one-dimensional array of desired size.
 *
 *  \param size Size in bytes
 *
 *  \return Array pointer
 *
 *  \warning This function halts the program if all virtual memory
 *  is exhausted. */
void **eps_xmalloc(int size);

/** 2D-malloc
 *
 *  This function allocates two-dimensional array of desired size.
 *
 *  \param width Array width
 *  \param height Array height
 *  \param size Element size
 *
 *  \return Array pointer
 *
 *  \warning This function halts the program if all virtual memory
 *  is exhausted. */
void **eps_malloc_2D(int width, int height, int size);

/** 2D-free
 *
 *  This function releases two-dimensional array allocated by \ref eps_malloc_2D.
 *
 *  \param ptr Array pointer
 *  \param width Array width
 *  \param height Array height
 *
 *  \return \c VOID */
void eps_free_2D(void **ptr, int width, int height);

/** Read block header
 *
 *  This function performes a broad range of tasks:
 *
 *  <ul>
 *  <li>Read and parse block header</li>
 *  <li>Check header consistency</li>
 *  <li>Check header and data CRC</li>
 *  <li>Fill special \ref eps_block_header structure with
 *  gathered information (it is worthwhile to mention that
 *  all decoding functions in the library rely on this
 *  structure)</li>
 *  </ul>
 *
 *  The \ref eps_block_header structure consists of two parts:
 *  general part and special part. The first one holds information
 *  that is common for all block types. The second one holds
 *  information that is specific for a particular block type.
 *
 *  \note The data buffer \a buf should hold \b whole block
 *  without markers.
 *
 *  \param buf Data buffer
 *  \param buf_size Buffer size
 *  \param hdr Block header
 *
 *  \return The function returns either \ref EPS_OK (the header
 *  is well-formed, the \a hdr structure is filled appropriately)
 *  or \ref EPS_PARAM_ERROR (your should not get this error
 *  unless you pass a \c NULL pointer, negative buffer size or
 *  something like that) or \ref EPS_FORMAT_ERROR (the header is
 *  malformed, block should be ignored). */
int eps_read_block_header(unsigned char *buf, int buf_size,
                          eps_block_header *hdr);

/** Encode a GRAYSCALE block
 *
 *  This function encodes a signle grayscale image \a block of
 *  size \a w by \a h pixels as block of type \ref EPS_GRAYSCALE_BLOCK.
 *  It is assumed that the \a block is taken from the image of size
 *  \a W by \a H pixels at position (\a x, \a y). All these parameters
 *  should be consistent. The encoded data is stored in the \a buf
 *  of size \a buf_size.
 *
 *  \note The most surprising thing here is that you can choose almost
 *  any (see note below) \a buf_size you wish! Thus you can precisely
 *  control encoding bit-rate. This technique is called embedded coding.
 *  In a few words, any encoded prefix can be used to decode a whole
 *  image. So, you can safely truncate stream at any point.
 *
 *  \note The caller should allocate at least \ref EPS_MIN_GRAYSCALE_BUF
 *  bytes for the \a buf.
 *
 *  \note On successful return, the value pointed by the \a buf_size
 *  will be overwritten with a real amount of bytes used in the
 *  \a buf (it will be less then or equal to the original \a buf_size
 *  value).
 *
 *  \note Depending on the \a mode parameter maximal \a block
 *  width or height is either \ref EPS_MAX_BLOCK_SIZE (if \a mode =
 *  \ref EPS_MODE_NORMAL) or \ref EPS_MAX_BLOCK_SIZE + 1
 *  (if \a mode = \ref EPS_MODE_OTLPF).
 *
 *  \note There is no restrictions on the image size itself.
 *
 *  \note The caller should select a value for the \a fb_id
 *  parameter from the list generated by the \ref eps_get_fb_info
 *  function.
 *
 *  \note The caller should not use orthogonal filterbanks
 *  with \a mode = \ref EPS_MODE_OTLPF. Orthogonality type
 *  can be queried with the \ref eps_get_fb_info function.
 *
 *  \param block Image block
 *  \param W Image width
 *  \param H Image height
 *  \param w Block width
 *  \param h Block height
 *  \param x Block X coordinate
 *  \param y Block Y coordinate
 *  \param buf Buffer
 *  \param buf_size Buffer size
 *  \param fb_id Filterbank ID
 *  \param mode Either \ref EPS_MODE_NORMAL or \ref EPS_MODE_OTLPF
 *
 *  \return The function returns either \ref EPS_OK (the block is
 *  successfully encoded), or \ref EPS_PARAM_ERROR (one or more
 *  parameters are incorrect) or \ref EPS_UNSUPPORTED_FB (filterbank with
 *  specified \a fb_id not found). */
int eps_encode_grayscale_block(unsigned char **block, int W, int H, int w, int h,
                               int x, int y, unsigned char *buf, int *buf_size,
                               char *fb_id, int mode);

/** Decode a GRAYSCALE block
 *
 *  This function decodes a GRAYSCALE image \a block from
 *  the \a buf. Block and image dimensions as well as other
 *  necessary information is taken from the \a hdr structure
 *  filled by the \ref eps_read_block_header function
 *  beforehand.
 *
 *  \note The caller should not invoke this function if the \a buf
 *  contains no data, i.e. \ref eps_block_header::data_size = 0.
 *
 *  \note The caller should allocate an image \a block
 *  beforehand. Block dimensions as well as other information
 *  is available in the \a hdr structure.
 *
 *  \param block Image block
 *  \param buf Buffer
 *  \param hdr Block header
 *
 *  \return The function returns either \ref EPS_OK (the block is
 *  successfully decoded), or \ref EPS_PARAM_ERROR (one or more
 *  parameters are incorrect) or \ref EPS_UNSUPPORTED_FB (filterbank
 *  used by encoder not found). */
int eps_decode_grayscale_block(unsigned char **block, unsigned char *buf,
                               eps_block_header *hdr);

/** Encode a TRUECOLOR block
 *
 *  This function encodes a generic RGB truecolor image block.
 *  The original RGB data is arranged in three arrays: \a block_R,
 *  \a block_G and \a block_B respectively. All components should
 *  have equal dimensions: \a w by \a h pixels. It is assumed that
 *  the block is taken from the image of size \a W by \a H pixels
 *  at position (\a x, \a y). All these parameters should be
 *  consistent. The encoded data is stored in the \a buf of size
 *  \a buf_size.
 *
 *  \note The most surprising thing here is that you can choose almost
 *  any (see note below) \a buf_size you wish! Thus you can precisely
 *  control encoding bit-rate. This technique is called embedded coding.
 *  In a few words, any encoded prefix can be used to decode a whole
 *  image. So, you can safely truncate stream at any point.
 *
 *  \note The caller should allocate at least \ref EPS_MIN_TRUECOLOR_BUF
 *  bytes for the \a buf.
 *
 *  \note The overall bit-budget available for the encoder is
 *  \a buf_size bytes. The caller should divide it between
 *  three channels (Y, Cb, Cr) using the following parameters:
 *  \a Y_rt, \a Cb_rt and \a Cr_rt. The function will report an
 *  error unless  \a Y_rt + \a Cb_rt + \a Cr_rt equals to 100%.
 *  If no matter you can use default values: \ref EPS_Y_RT,
 *  \ref EPS_Cb_RT and \ref EPS_Cr_RT.
 *
 *  \note On successful return, the value pointed by the \a buf_size
 *  will be overwritten with a real amount of bytes used in the
 *  \a buf (it will be less then or equal to the original \a buf_size
 *  value).
 *
 *  \note Depending on the \a mode parameter maximal block
 *  width or height is either \ref EPS_MAX_BLOCK_SIZE (if \a mode =
 *  \ref EPS_MODE_NORMAL) or \ref EPS_MAX_BLOCK_SIZE + 1
 *  (if \a mode = \ref EPS_MODE_OTLPF).
 *
 *  \note There is no restrictions on the image size itself.
 *
 *  \note The caller should select a value for the \a fb_id
 *  parameter from the list generated by the \ref eps_get_fb_info
 *  function.
 *
 *  \note The caller should not use orthogonal filterbanks
 *  with \a mode = \ref EPS_MODE_OTLPF. Orthogonality type
 *  can be queried with the \ref eps_get_fb_info function.
 *
 *  \param block_R Red component
 *  \param block_G Green component
 *  \param block_B Blue component
 *  \param W Image width
 *  \param H Image height
 *  \param w Block width
 *  \param h Block height
 *  \param x Block X coordinate
 *  \param y Block Y coordinate
 *  \param resample Resampling scheme: either \ref EPS_RESAMPLE_444 or \ref EPS_RESAMPLE_420
 *  \param buf Buffer
 *  \param buf_size Buffer size
 *  \param Y_rt Bit-budget percent for the Y channel
 *  \param Cb_rt Bit-budget percent for the Cb channel
 *  \param Cr_rt Bit-budget percent for the Cr channel
 *  \param fb_id Filterbank ID
 *  \param mode Either \ref EPS_MODE_NORMAL or \ref EPS_MODE_OTLPF
 *
 *  \return The function returns either \ref EPS_OK (the block is
 *  successfully encoded), or \ref EPS_PARAM_ERROR (one or more
 *  parameters are incorrect) or \ref EPS_UNSUPPORTED_FB (filterbank
 *  with specified \a fb_id not found). */
int eps_encode_truecolor_block(unsigned char **block_R,
                               unsigned char **block_G,
                               unsigned char **block_B,
                               int W, int H, int w, int h,
                               int x, int y, int resample,
                               unsigned char *buf, int *buf_size,
                               int Y_rt, int Cb_rt, int Cr_rt,
                               char *fb_id, int mode);

/** Decode a TRUECOLOR block
 *
 *  This function decodes a TRUECOLOR image block from
 *  the \a buf. The resulted RGB data will be stored in the
 *  \a block_R, \a block_G, and \a block_B arrays
 *  respectively. Block and image dimensions as well as
 *  other necessary information is taken from the \a hdr
 *  structure filled by the \ref eps_read_block_header
 *  function beforehand.
 *
 *  \note The caller should not invoke this function if the \a buf
 *  contains no data, i.e. \ref eps_block_header::data_size = 0.
 *
 *  \note The caller should allocate \a block_R, \a block_G,
 *  and \a block_B arrays beforehand. Block dimensions as well
 *  as other information is available in the \a hdr structure.
 *
 *  \param block_R Red component
 *  \param block_G Green component
 *  \param block_B Blue component
 *  \param buf Buffer
 *  \param hdr Block header
 *
 *  \return The function returns either \ref EPS_OK (the block is
 *  successfully decoded), or \ref EPS_PARAM_ERROR (one or more
 *  parameters are incorrect) or \ref EPS_UNSUPPORTED_FB (filterbank
 *  used by encoder not found) or \ref EPS_FORMAT_ERROR
 *  (unsupported data format). */
int eps_decode_truecolor_block(unsigned char **block_R,
                               unsigned char **block_G,
                               unsigned char **block_B,
                               unsigned char *buf,
                               eps_block_header *hdr);

/** Truncate block
 *
 *  This function truncates already encoded GRAYSCALE
 *  or TRUECOLOR block. Due to embedded encoding
 *  truncation is equivalent to block re-compression.
 *
 *  \param buf_in Input buffer
 *  \param buf_out Output buffer
 *  \param hdr Block header
 *  \param truncate_size Desired truncated block size
 *
 *  \note On successful return, the value pointed by the
 *  \a truncate_size parameter will be overwritten with a
 *  real amount of bytes used in the \a buf_out (it will
 *  be less then or equal to the original \a truncate_size value).
 *
 *  \note Minimal value for the \a truncate_size parameter can be
 *  calculated as MAX(\ref EPS_MIN_GRAYSCALE_BUF, \ref EPS_MIN_TRUECOLOR_BUF).
 *
 *  \return The function returns either \ref EPS_OK (the block is
 *  successfully truncated), or \ref EPS_PARAM_ERROR (one or more
 *  parameters are incorrect). */
int eps_truncate_block(unsigned char *buf_in, unsigned char *buf_out,
                       eps_block_header *hdr, int *truncate_size);

/*@}*/

#ifdef __cplusplus
}
#endif

#endif /* __EPSILON_H__ */
