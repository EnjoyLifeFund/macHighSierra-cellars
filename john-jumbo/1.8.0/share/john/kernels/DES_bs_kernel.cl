/* CAUTION:Do not change or move the next 48 lines */
#define index00 31
#define index01  0
#define index02  1
#define index03  2
#define index04  3
#define index05  4
#define index06  3
#define index07  4
#define index08  5
#define index09  6
#define index10  7
#define index11  8
#define index24 15
#define index25 16
#define index26 17
#define index27 18
#define index28 19
#define index29 20
#define index30 19
#define index31 20
#define index32 21
#define index33 22
#define index34 23
#define index35 24
#define index48 63
#define index49 32
#define index50 33
#define index51 34
#define index52 35
#define index53 36
#define index54 35
#define index55 36
#define index56 37
#define index57 38
#define index58 39
#define index59 40
#define index72 47
#define index73 48
#define index74 49
#define index75 50
#define index76 51
#define index77 52
#define index78 51
#define index79 52
#define index80 53
#define index81 54
#define index82 55
#define index83 56

/*
 * This software is Copyright (c) 2012 Sayantan Datta <std2048 at gmail dot com>
 * and it is hereby released to the general public under the following terms:
 * Redistribution and use in source and binary forms, with or without modification, are permitted.
 * Based on Solar Designer implementation of DES_bs_b.c in jtr-v1.7.9
 */

#include "opencl_DES_WGS.h"
#include "opencl_device_info.h"

#define ARCH_WORD     			int
#define DES_BS_DEPTH                    32
#define DES_bs_vector                   ARCH_WORD

typedef unsigned ARCH_WORD vtype ;

#if no_byte_addressable(DEVICE_INFO)
#define RV7xx
#endif

#if gpu_nvidia(DEVICE_INFO)
#define _NV
#endif

#if cpu(DEVICE_INFO)
#define _CPU
#endif

#if 1
#define MAYBE_GLOBAL __global
#else
#define MAYBE_GLOBAL
#endif

typedef struct{

	union {
		unsigned char c[8][8][sizeof(DES_bs_vector)] ;
		DES_bs_vector v[8][8] ;
	} xkeys ;

	int keys_changed ;
} DES_bs_transfer ;

#define vxorf(a, b) 					\
	((a) ^ (b))

#define vnot(dst, a) 					\
	(dst) = ~(a)
#define vand(dst, a, b) 				\
	(dst) = (a) & (b)
#define vor(dst, a, b) 					\
	(dst) = (a) | (b)
#define vandn(dst, a, b) 				\
	(dst) = (a) & ~(b)

#if defined(_NV)||defined(_CPU)
#define vsel(dst, a, b, c) 				\
	(dst) = (((a) & ~(c)) ^ ((b) & (c)))
#else
#define vsel(dst, a, b, c) 				\
	(dst) = bitselect((a),(b),(c))
#endif

#define vshl(dst, src, shift) 				\
	(dst) = (src) << (shift)
#define vshr(dst, src, shift) 				\
	(dst) = (src) >> (shift)

#define vzero 0

#define vones (~(vtype)0)

#define vst(dst, ofs, src) 				\
	*((MAYBE_GLOBAL vtype *)((MAYBE_GLOBAL DES_bs_vector *)&(dst) + (ofs))) = (src)

#define vst_private(dst, ofs, src) 			\
	*((__private vtype *)((__private DES_bs_vector *)&(dst) + (ofs))) = (src)

#define vxor(dst, a, b) 				\
	(dst) = vxorf((a), (b))

#define vshl1(dst, src) 				\
	vshl((dst), (src), 1)

#define kvtype vtype
#define kvand vand
#define kvor vor
#define kvshl1 vshl1
#define kvshl vshl
#define kvshr vshr


#define mask01 0x01010101
#define mask02 0x02020202
#define mask04 0x04040404
#define mask08 0x08080808
#define mask10 0x10101010
#define mask20 0x20202020
#define mask40 0x40404040
#define mask80 0x80808080


#define LOAD_V 						\
	kvtype v0 = *(MAYBE_GLOBAL kvtype *)&vp[0]; 	\
	kvtype v1 = *(MAYBE_GLOBAL kvtype *)&vp[1]; 	\
	kvtype v2 = *(MAYBE_GLOBAL kvtype *)&vp[2]; 	\
	kvtype v3 = *(MAYBE_GLOBAL kvtype *)&vp[3]; 	\
	kvtype v4 = *(MAYBE_GLOBAL kvtype *)&vp[4]; 	\
	kvtype v5 = *(MAYBE_GLOBAL kvtype *)&vp[5]; 	\
	kvtype v6 = *(MAYBE_GLOBAL kvtype *)&vp[6]; 	\
	kvtype v7 = *(MAYBE_GLOBAL kvtype *)&vp[7];

#define kvand_shl1_or(dst, src, mask) 			\
	kvand(tmp, src, mask); 				\
	kvshl1(tmp, tmp); 				\
	kvor(dst, dst, tmp)

#define kvand_shl_or(dst, src, mask, shift) 		\
	kvand(tmp, src, mask); 				\
	kvshl(tmp, tmp, shift); 			\
	kvor(dst, dst, tmp)

#define kvand_shl1(dst, src, mask) 			\
	kvand(tmp, src, mask) ;				\
	kvshl1(dst, tmp)

#define kvand_or(dst, src, mask) 			\
	kvand(tmp, src, mask); 				\
	kvor(dst, dst, tmp)

#define kvand_shr_or(dst, src, mask, shift)		\
	kvand(tmp, src, mask); 				\
	kvshr(tmp, tmp, shift); 			\
	kvor(dst, dst, tmp)

#define kvand_shr(dst, src, mask, shift) 		\
	kvand(tmp, src, mask); 				\
	kvshr(dst, tmp, shift)

#define FINALIZE_NEXT_KEY_BIT_0 { 			\
	kvtype m = mask01, va, vb, tmp; 		\
	kvand(va, v0, m); 				\
	kvand_shl1(vb, v1, m); 				\
	kvand_shl_or(va, v2, m, 2); 			\
	kvand_shl_or(vb, v3, m, 3); 			\
	kvand_shl_or(va, v4, m, 4); 			\
	kvand_shl_or(vb, v5, m, 5); 			\
	kvand_shl_or(va, v6, m, 6); 			\
	kvand_shl_or(vb, v7, m, 7); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_1 { 			\
	kvtype m = mask02, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 1); 			\
	kvand(vb, v1, m); 				\
	kvand_shl1_or(va, v2, m); 			\
	kvand_shl_or(vb, v3, m, 2); 			\
	kvand_shl_or(va, v4, m, 3); 			\
	kvand_shl_or(vb, v5, m, 4); 			\
	kvand_shl_or(va, v6, m, 5); 			\
	kvand_shl_or(vb, v7, m, 6); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_2 { 			\
	kvtype m = mask04, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 2); 			\
	kvand_shr(vb, v1, m, 1); 			\
	kvand_or(va, v2, m); 				\
	kvand_shl1_or(vb, v3, m); 			\
	kvand_shl_or(va, v4, m, 2); 			\
	kvand_shl_or(vb, v5, m, 3); 			\
	kvand_shl_or(va, v6, m, 4); 			\
	kvand_shl_or(vb, v7, m, 5); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_3 { 			\
	kvtype m = mask08, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 3); 			\
	kvand_shr(vb, v1, m, 2); 			\
	kvand_shr_or(va, v2, m, 1); 			\
	kvand_or(vb, v3, m); 				\
	kvand_shl1_or(va, v4, m); 			\
	kvand_shl_or(vb, v5, m, 2); 			\
	kvand_shl_or(va, v6, m, 3); 			\
	kvand_shl_or(vb, v7, m, 4); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_4 { 			\
	kvtype m = mask10, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 4); 			\
	kvand_shr(vb, v1, m, 3); 			\
	kvand_shr_or(va, v2, m, 2); 			\
	kvand_shr_or(vb, v3, m, 1); 			\
	kvand_or(va, v4, m); 				\
	kvand_shl1_or(vb, v5, m); 			\
	kvand_shl_or(va, v6, m, 2); 			\
	kvand_shl_or(vb, v7, m, 3); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_5 { 			\
	kvtype m = mask20, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 5); 			\
	kvand_shr(vb, v1, m, 4); 			\
	kvand_shr_or(va, v2, m, 3); 			\
	kvand_shr_or(vb, v3, m, 2); 			\
	kvand_shr_or(va, v4, m, 1); 			\
	kvand_or(vb, v5, m); 				\
	kvand_shl1_or(va, v6, m); 			\
	kvand_shl_or(vb, v7, m, 2); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_6 { 			\
	kvtype m = mask40, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 6); 			\
	kvand_shr(vb, v1, m, 5); 			\
	kvand_shr_or(va, v2, m, 4); 			\
	kvand_shr_or(vb, v3, m, 3); 			\
	kvand_shr_or(va, v4, m, 2); 			\
	kvand_shr_or(vb, v5, m, 1); 			\
	kvand_or(va, v6, m); 				\
	kvand_shl1_or(vb, v7, m); 			\
	kvor(kp[0], va, vb); 				\
	kp++; 						\
}

#define FINALIZE_NEXT_KEY_BIT_7 { 			\
	kvtype m = mask80, va, vb, tmp; 		\
	kvand_shr(va, v0, m, 7); 			\
	kvand_shr(vb, v1, m, 6); 			\
	kvand_shr_or(va, v2, m, 5); 			\
	kvand_shr_or(vb, v3, m, 4); 			\
	kvand_shr_or(va, v4, m, 3); 			\
	kvand_shr_or(vb, v5, m, 2); 			\
	kvand_shr_or(va, v6, m, 1); 			\
	kvand_or(vb, v7, m); 				\
	kvor(kp[0], va, vb); 				\
	kp++;

#define GET_BIT \
	(unsigned int)*(unsigned char *)&b[0] >> idx

inline void cmp( __private unsigned DES_bs_vector *B,
	  __global int *binary,
	  int num_loaded_hash,
	  volatile __global uint *output,
	  int section) {


	int value[2] , mask, i, bit;


	for(i = 0; i < num_loaded_hash; i++) {

		value[0] = binary[i];
		value[1] = binary[i + num_loaded_hash];

		mask = B[0] ^ -(value[0] & 1);

		for (bit = 1; bit < 32; bit++)
			mask |= B[bit] ^ -((value[0] >> bit) & 1);

		for (; bit < 64; bit += 2) {
			mask |= B[bit] ^ -((value[1] >> (bit & 0x1F)) & 1);
			mask |= B[bit + 1] ^ -((value[1] >> ((bit + 1) & 0x1F)) & 1);

			if (mask == ~(int)0) goto next_hash;
		}

		atomic_max( &output[i],section + 1) ;

	next_hash: ;
	}

}
#undef GET_BIT

inline void DES_bs_finalize_keys(unsigned int section,
				__global DES_bs_transfer *DES_bs_all,
				int local_offset_K,
				__local DES_bs_vector *K ) {

	__local DES_bs_vector *kp = (__local DES_bs_vector *)&K[local_offset_K] ;

	int ic ;
	for (ic = 0; ic < 8; ic++) {
		MAYBE_GLOBAL DES_bs_vector *vp =
		    (MAYBE_GLOBAL DES_bs_vector *)&DES_bs_all[section].xkeys.v[ic][0] ;
		LOAD_V
		FINALIZE_NEXT_KEY_BIT_0
		FINALIZE_NEXT_KEY_BIT_1
		FINALIZE_NEXT_KEY_BIT_2
		FINALIZE_NEXT_KEY_BIT_3
		FINALIZE_NEXT_KEY_BIT_4
		FINALIZE_NEXT_KEY_BIT_5
		FINALIZE_NEXT_KEY_BIT_6

	}

}

#if defined(_NV) || defined(_CPU)
#include "opencl_sboxes.h"
#else
#include "opencl_sboxes-s.h"
#endif

#define DES_bs_clear_block_8(j) 			\
	vst_private(B[j] , 0, zero); 			\
	vst_private(B[j] , 1, zero); 			\
	vst_private(B[j] , 2, zero); 			\
	vst_private(B[j] , 3, zero); 			\
	vst_private(B[j] , 4, zero); 			\
	vst_private(B[j] , 5, zero); 			\
	vst_private(B[j] , 6, zero); 			\
	vst_private(B[j] , 7, zero);

#define DES_bs_clear_block 				\
	DES_bs_clear_block_8(0); 			\
	DES_bs_clear_block_8(8); 			\
	DES_bs_clear_block_8(16); 			\
	DES_bs_clear_block_8(24); 			\
	DES_bs_clear_block_8(32); 			\
	DES_bs_clear_block_8(40); 			\
	DES_bs_clear_block_8(48); 			\
	DES_bs_clear_block_8(56);

#if (FULL_UNROLL || !HARDCODE_SALT)

#ifndef RV7xx
#define x(p) vxorf(B[ index96[p]], _local_K[_local_index768[p + k] + local_offset_K])
#define y(p, q) vxorf(B[p]       , _local_K[_local_index768[q + k] + local_offset_K])
#else
#define x(p) vxorf(B[index96[p] ], _local_K[index768[p + k] + local_offset_K])
#define y(p, q) vxorf(B[p]       , _local_K[index768[q + k] + local_offset_K])
#endif

#define z(p, q) vxorf(B[p]       , _local_K[ q + local_offset_K])

#endif

#define H1()\
	s1(x(0), x(1), x(2), x(3), x(4), x(5),\
		B,40, 48, 54, 62);\
	s2(x(6), x(7), x(8), x(9), x(10), x(11),\
		B,44, 59, 33, 49);\
	s3(y(7, 12), y(8, 13), y(9, 14),\
		y(10, 15), y(11, 16), y(12, 17),\
		B,55, 47, 61, 37);\
	s4(y(11, 18), y(12, 19), y(13, 20),\
		y(14, 21), y(15, 22), y(16, 23),\
		B,57, 51, 41, 32);\
	s5(x(24), x(25), x(26), x(27), x(28), x(29),\
		B,39, 45, 56, 34);\
	s6(x(30), x(31), x(32), x(33), x(34), x(35),\
		B,35, 60, 42, 50);\
	s7(y(23, 36), y(24, 37), y(25, 38),\
		y(26, 39), y(27, 40), y(28, 41),\
		B,63, 43, 53, 38);\
	s8(y(27, 42), y(28, 43), y(29, 44),\
		y(30, 45), y(31, 46), y(0, 47),\
		B,36, 58, 46, 52);

#define H2()\
	s1(x(48), x(49), x(50), x(51), x(52), x(53),\
		B,8, 16, 22, 30);\
	s2(x(54), x(55), x(56), x(57), x(58), x(59),\
		B,12, 27, 1, 17);\
	s3(y(39, 60), y(40, 61), y(41, 62),\
		y(42, 63), y(43, 64), y(44, 65),\
		B,23, 15, 29, 5);\
	s4(y(43, 66), y(44, 67), y(45, 68),\
		y(46, 69), y(47, 70), y(48, 71),\
		B,25, 19, 9, 0);\
	s5(x(72), x(73), x(74), x(75), x(76), x(77),\
		B,7, 13, 24, 2);\
	s6(x(78), x(79), x(80), x(81), x(82), x(83),\
		B,3, 28, 10, 18);\
	s7(y(55, 84), y(56, 85), y(57, 86),\
		y(58, 87), y(59, 88), y(60, 89),\
		B,31, 11, 21, 6);\
	s8(y(59, 90), y(60, 91), y(61, 92),\
		y(62, 93), y(63, 94), y(32, 95),\
		B,4, 26, 14, 20);

#define H1_s()\
	s1(z(index00, 0), z(index01, 1), z(index02, 2), z(index03, 3), z(index04, 4), z(index05, 5),\
		B,40, 48, 54, 62);\
	s2(z(index06, 6), z(index07, 7), z(index08, 8), z(index09, 9), z(index10, 10), z(index11, 11),\
		B,44, 59, 33, 49);\
	s3(z(7, 12), z(8, 13), z(9, 14),\
		z(10, 15), z(11, 16), z(12, 17),\
		B,55, 47, 61, 37);\
	s4(z(11, 18), z(12, 19), z(13, 20),\
		z(14, 21), z(15, 22), z(16, 23),\
		B,57, 51, 41, 32);\
	s5(z(index24, 24), z(index25, 25), z(index26, 26), z(index27, 27), z(index28, 28), z(index29, 29),\
		B,39, 45, 56, 34);\
	s6(z(index30, 30), z(index31, 31), z(index32, 32), z(index33, 33), z(index34, 34), z(index35, 35),\
		B,35, 60, 42, 50);\
	s7(z(23, 36), z(24, 37), z(25, 38),\
		z(26, 39), z(27, 40), z(28, 41),\
		B,63, 43, 53, 38);\
	s8(z(27, 42), z(28, 43), z(29, 44),\
		z(30, 45), z(31, 46), z(0, 47),\
		B,36, 58, 46, 52);

#define H2_s()\
	s1(z(index48, 48), z(index49, 49), z(index50, 50), z(index51, 51), z(index52, 52), z(index53, 53),\
		B,8, 16, 22, 30);\
	s2(z(index54, 54), z(index55, 55), z(index56, 56), z(index57, 57), z(index58, 58), z(index59, 59),\
		B,12, 27, 1, 17);\
	s3(z(39, 60), z(40, 61), z(41, 62),\
		z(42, 63), z(43, 64), z(44, 65),\
		B,23, 15, 29, 5);\
	s4(z(43, 66), z(44, 67), z(45, 68),\
		z(46, 69), z(47, 70), z(48, 71),\
		B,25, 19, 9, 0);\
	s5(z(index72, 72), z(index73, 73), z(index74, 74), z(index75, 75), z(index76, 76), z(index77, 77),\
		B,7, 13, 24, 2);\
	s6(z(index78, 78), z(index79, 79), z(index80, 80), z(index81, 81), z(index82, 82), z(index83, 83),\
		B,3, 28, 10, 18);\
	s7(z(55, 84), z(56, 85), z(57, 86),\
		z(58, 87), z(59, 88), z(60, 89),\
		B,31, 11, 21, 6);\
	s8(z(59, 90), z(60, 91), z(61, 92),\
		z(62, 93), z(63, 94), z(32, 95),\
		B,4, 26, 14, 20);

#define H1_k0()\
        s1(z(index00, 12), z(index01, 46), z(index02, 33), z(index03, 52), z(index04, 48), z(index05, 20),\
		B,40, 48, 54, 62);\
	s2(z(index06, 34), z(index07, 55), z(index08, 5), z(index09, 13), z(index10, 18), z(index11, 40),\
		B,44, 59, 33, 49);\
	s3(z(7, 4), z(8, 32), z(9, 26),\
		z(10, 27), z(11, 38), z(12, 54),\
		B,55, 47, 61, 37);\
	s4(z(11, 53), z(12, 6), z(13, 31),\
		z(14, 25), z(15, 19), z(16, 41),\
		B,57, 51, 41, 32);\
	s5(z(index24, 15), z(index25, 24), z(index26, 28), z(index27, 43), z(index28, 30), z(index29, 3),\
		B,39, 45, 56, 34);\
	s6(z(index30, 35), z(index31, 22), z(index32, 2), z(index33, 44), z(index34, 14), z(index35, 23),\
		B,35, 60, 42, 50);\
	s7(z(23, 51), z(24, 16), z(25, 29),\
		z(26, 49), z(27, 7), z(28, 17),\
		B,63, 43, 53, 38);\
	s8(z(27, 37), z(28, 8), z(29, 9),\
		z(30, 50), z(31, 42), z(0, 21),\
		B,36, 58, 46, 52);

#define H2_k0()\
	s1(z(index48, 5), z(index49, 39), z(index50, 26), z(index51, 45), z(index52, 41), z(index53, 13),\
		B,8, 16, 22, 30);\
	s2(z(index54, 27), z(index55, 48), z(index56, 53), z(index57, 6), z(index58, 11), z(index59, 33),\
		B,12, 27, 1, 17);\
	s3(z(39, 52), z(40, 25), z(41, 19),\
		z(42, 20), z(43, 31), z(44, 47),\
		B,23, 15, 29, 5);\
	s4(z(43, 46), z(44, 54), z(45, 55),\
		z(46, 18), z(47, 12), z(48, 34),\
		B,25, 19, 9, 0);\
	s5(z(index72, 8), z(index73, 17), z(index74, 21), z(index75, 36), z(index76, 23), z(index77, 49),\
		B,7, 13, 24, 2);\
	s6(z(index78, 28), z(index79, 15), z(index80, 24), z(index81, 37), z(index82, 7), z(index83, 16),\
		B,3, 28, 10, 18);\
	s7(z(55, 44), z(56, 9), z(57, 22),\
		z(58, 42), z(59, 0), z(60, 10),\
		B,31, 11, 21, 6);\
	s8(z(59, 30), z(60, 1), z(61, 2),\
		z(62, 43), z(63, 35), z(32, 14),\
		B,4, 26, 14, 20);

#define H2_k48()\
	s1(y48(index48, 12), y48(index49, 46), y48(index50, 33), y48(index51, 52), y48(index52, 48), y48(index53, 20),\
		B,8, 16, 22, 30);\
	s2(y48(index54, 34), y48(index55, 55), y48(index56, 5), y48(index57, 13), y48(index58, 18), y48(index59, 40),\
		B,12, 27, 1, 17);\
	s3(y48(39, 4), y48(40, 32), y48(41, 26),\
		y48(42, 27), y48(43, 38), y48(44, 54),\
		B,23, 15, 29, 5);\
	s4(y48(43, 53), y48(44, 6), y48(45, 31),\
		y48(46, 25), y48(47, 19), y48(48, 41),\
		B,25, 19, 9, 0);\
	s5(y48(index72, 15), y48(index73, 24), y48(index74, 28), y48(index75, 43), y48(index76, 30), y48(index77, 3),\
		B,7, 13, 24, 2);\
	s6(y48(index78, 35), y48(index79, 22), y48(index80, 2), y48(index81, 44), y48(index82, 14), y48(index83, 23),\
		B,3, 28, 10, 18);\
	s7(y48(55, 51), y48(56, 16), y48(57, 29),\
		y48(58, 49), y48(59, 7), y48(60, 17),\
		B,31, 11, 21, 6);\
	s8(y48(59, 37), y48(60, 8), y48(61, 9),\
		y48(62, 50), y48(63, 42), y48(32, 21),\
		B,4, 26, 14, 20);

#define H1_k96()\
        s1(z(index00, 46), z(index01, 25), z(index02, 12), z(index03, 31), z(index04, 27), z(index05, 54),\
		B,40, 48, 54, 62);\
	s2(z(index06, 13), z(index07, 34), z(index08, 39), z(index09, 47), z(index10, 52), z(index11, 19),\
		B,44, 59, 33, 49);\
	s3(z(7, 38), z(8, 11), z(9, 5),\
		z(10, 6), z(11, 48), z(12, 33),\
		B,55, 47, 61, 37);\
	s4(z(11, 32), z(12, 40), z(13, 41),\
		z(14, 4), z(15, 53), z(16, 20),\
		B,57, 51, 41, 32);\
	s5(z(index24, 51), z(index25, 3), z(index26, 7), z(index27, 22), z(index28, 9), z(index29, 35),\
		B,39, 45, 56, 34);\
	s6(z(index30, 14), z(index31, 1), z(index32, 10), z(index33, 23), z(index34, 50), z(index35, 2),\
		B,35, 60, 42, 50);\
	s7(z(23, 30), z(24, 24), z(25, 8),\
		z(26, 28), z(27, 43), z(28, 49),\
		B,63, 43, 53, 38);\
	s8(z(27, 16), z(28, 44), z(29, 17),\
		z(30, 29), z(31, 21), z(0, 0),\
		B,36, 58, 46, 52);

#define H2_k96()\
	s1(z(index48, 32), z(index49, 11), z(index50, 53), z(index51, 48), z(index52, 13), z(index53, 40),\
		B,8, 16, 22, 30);\
	s2(z(index54, 54), z(index55, 20), z(index56, 25), z(index57, 33), z(index58, 38), z(index59, 5),\
		B,12, 27, 1, 17);\
	s3(z(39, 55), z(40, 52), z(41, 46),\
		z(42, 47), z(43, 34), z(44, 19),\
		B,23, 15, 29, 5);\
	s4(z(43, 18), z(44, 26), z(45, 27),\
		z(46, 45), z(47, 39), z(48, 6),\
		B,25, 19, 9, 0);\
	s5(z(index72, 37), z(index73, 42), z(index74, 50), z(index75, 8), z(index76, 24), z(index77, 21),\
		B,7, 13, 24, 2);\
	s6(z(index78, 0), z(index79, 44), z(index80, 49), z(index81, 9), z(index82, 36), z(index83, 17),\
		B,3, 28, 10, 18);\
	s7(z(55, 16), z(56, 10), z(57, 51),\
		z(58, 14), z(59, 29), z(60, 35),\
		B,31, 11, 21, 6);\
	s8(z(59, 2), z(60, 30), z(61, 3),\
		z(62, 15), z(63, 7), z(32, 43),\
		B,4, 26, 14, 20);

#define H1_k192()\
        s1(z(index00, 18), z(index01, 52), z(index02, 39), z(index03, 34), z(index04, 54), z(index05, 26),\
		B,40, 48, 54, 62);\
	s2(z(index06, 40), z(index07, 6), z(index08, 11), z(index09, 19), z(index10, 55), z(index11, 46),\
		B,44, 59, 33, 49);\
	s3(z(7, 41), z(8, 38), z(9, 32),\
		z(10, 33), z(11, 20), z(12, 5),\
		B,55, 47, 61, 37);\
	s4(z(11, 4), z(12, 12), z(13, 13),\
		z(14, 31), z(15, 25), z(16, 47),\
		B,57, 51, 41, 32);\
	s5(z(index24, 23), z(index25, 28), z(index26, 36), z(index27, 51), z(index28, 10), z(index29, 7),\
		B,39, 45, 56, 34);\
	s6(z(index30, 43), z(index31, 30), z(index32, 35), z(index33, 24), z(index34, 22), z(index35, 3),\
		B,35, 60, 42, 50);\
	s7(z(23, 2), z(24, 49), z(25, 37),\
		z(26, 0), z(27, 15), z(28, 21),\
		B,63, 43, 53, 38);\
	s8(z(27, 17), z(28, 16), z(29, 42),\
		z(30, 1), z(31, 50), z(0, 29),\
		B,36, 58, 46, 52);

#define H2_k192()\
	s1(z(index48, 4), z(index49, 38), z(index50, 25), z(index51, 20), z(index52, 40), z(index53, 12),\
		B,8, 16, 22, 30);\
	s2(z(index54, 26), z(index55, 47), z(index56, 52), z(index57, 5), z(index58, 41), z(index59, 32),\
		B,12, 27, 1, 17);\
	s3(z(39, 27), z(40, 55), z(41, 18),\
		z(42, 19), z(43, 6), z(44, 46),\
		B,23, 15, 29, 5);\
	s4(z(43, 45), z(44, 53), z(45, 54),\
		z(46, 48), z(47, 11), z(48, 33),\
		B,25, 19, 9, 0);\
	s5(z(index72, 9), z(index73, 14), z(index74, 22), z(index75, 37), z(index76, 49), z(index77, 50),\
		B,7, 13, 24, 2);\
	s6(z(index78, 29), z(index79, 16), z(index80, 21), z(index81, 10), z(index82, 8), z(index83, 42),\
		B,3, 28, 10, 18);\
	s7(z(55, 17), z(56, 35), z(57, 23),\
		z(58, 43), z(59, 1), z(60, 7),\
		B,31, 11, 21, 6);\
	s8(z(59, 3), z(60, 2), z(61, 28),\
		z(62, 44), z(63, 36), z(32, 15),\
		B,4, 26, 14, 20);

#define H1_k288()\
        s1(z(index00, 45), z(index01, 55), z(index02, 11), z(index03, 6), z(index04, 26), z(index05, 53),\
		B,40, 48, 54, 62);\
	s2(z(index06, 12), z(index07, 33), z(index08, 38), z(index09, 46), z(index10, 27), z(index11, 18),\
		B,44, 59, 33, 49);\
	s3(z(7, 13), z(8, 41), z(9, 4),\
		z(10, 5), z(11, 47), z(12, 32),\
		B,55, 47, 61, 37);\
	s4(z(11, 31), z(12, 39), z(13, 40),\
		z(14, 34), z(15, 52), z(16, 19),\
		B,57, 51, 41, 32);\
	s5(z(index24, 24), z(index25, 0), z(index26, 8), z(index27, 23), z(index28, 35), z(index29, 36),\
		B,39, 45, 56, 34);\
	s6(z(index30, 15), z(index31, 2), z(index32, 7), z(index33, 49), z(index34, 51), z(index35, 28),\
		B,35, 60, 42, 50);\
	s7(z(23, 3), z(24, 21), z(25, 9),\
		z(26, 29), z(27, 44), z(28, 50),\
		B,63, 43, 53, 38);\
	s8(z(27, 42), z(28, 17), z(29, 14),\
		z(30, 30), z(31, 22), z(0, 1),\
		B,36, 58, 46, 52);

#define H2_k288()\
	s1(z(index48, 31), z(index49, 41), z(index50, 52), z(index51, 47), z(index52, 12), z(index53, 39),\
		B,8, 16, 22, 30);\
	s2(z(index54, 53), z(index55, 19), z(index56, 55), z(index57, 32), z(index58, 13), z(index59, 4),\
		B,12, 27, 1, 17);\
	s3(z(39, 54), z(40, 27), z(41, 45),\
		z(42, 46), z(43, 33), z(44, 18),\
		B,23, 15, 29, 5);\
	s4(z(43, 48), z(44, 25), z(45, 26),\
		z(46, 20), z(47, 38), z(48, 5),\
		B,25, 19, 9, 0);\
	s5(z(index72, 10), z(index73, 43), z(index74, 51), z(index75, 9), z(index76, 21), z(index77, 22),\
		B,7, 13, 24, 2);\
	s6(z(index78, 1), z(index79, 17), z(index80, 50), z(index81, 35), z(index82, 37), z(index83, 14),\
		B,3, 28, 10, 18);\
	s7(z(55, 42), z(56, 7), z(57, 24),\
		z(58, 15), z(59, 30), z(60, 36),\
		B,31, 11, 21, 6);\
	s8(z(59, 28), z(60, 3), z(61, 0),\
		z(62, 16), z(63, 8), z(32, 44),\
		B,4, 26, 14, 20);

#define H1_k384()\
        s1(z(index00, 55), z(index01, 34), z(index02, 45), z(index03, 40), z(index04, 5), z(index05, 32),\
		B,40, 48, 54, 62);\
	s2(z(index06, 46), z(index07, 12), z(index08, 48), z(index09, 25), z(index10, 6), z(index11, 52),\
		B,44, 59, 33, 49);\
	s3(z(7, 47), z(8, 20), z(9, 38),\
		z(10, 39), z(11, 26), z(12, 11),\
		B,55, 47, 61, 37);\
	s4(z(11, 41), z(12, 18), z(13, 19),\
		z(14, 13), z(15, 31), z(16, 53),\
		B,57, 51, 41, 32);\
	s5(z(index24, 3), z(index25, 36), z(index26, 44), z(index27, 2), z(index28, 14), z(index29, 15),\
		B,39, 45, 56, 34);\
	s6(z(index30, 51), z(index31, 10), z(index32, 43), z(index33, 28), z(index34, 30), z(index35, 7),\
		B,35, 60, 42, 50);\
	s7(z(23, 35), z(24, 0), z(25, 17),\
		z(26, 8), z(27, 23), z(28, 29),\
		B,63, 43, 53, 38);\
	s8(z(27, 21), z(28, 49), z(29, 50),\
		z(30, 9), z(31, 1), z(0, 37),\
		B,36, 58, 46, 52);

#define H2_k384()\
	s1(z(index48, 41), z(index49, 20), z(index50, 31), z(index51, 26), z(index52, 46), z(index53, 18),\
		B,8, 16, 22, 30);\
	s2(z(index54, 32), z(index55, 53), z(index56, 34), z(index57, 11), z(index58, 47), z(index59, 38),\
		B,12, 27, 1, 17);\
	s3(z(39, 33), z(40, 6), z(41, 55),\
		z(42, 25), z(43, 12), z(44, 52),\
		B,23, 15, 29, 5);\
	s4(z(43, 27), z(44, 4), z(45, 5),\
		z(46, 54), z(47, 48), z(48, 39),\
		B,25, 19, 9, 0);\
	s5(z(index72, 42), z(index73, 22), z(index74, 30), z(index75, 17), z(index76, 0), z(index77, 1),\
		B,7, 13, 24, 2);\
	s6(z(index78, 37), z(index79, 49), z(index80, 29), z(index81, 14), z(index82, 16), z(index83, 50),\
		B,3, 28, 10, 18);\
	s7(z(55, 21), z(56, 43), z(57, 3),\
		z(58, 51), z(59, 9), z(60, 15),\
		B,31, 11, 21, 6);\
	s8(z(59, 7), z(60, 35), z(61, 36),\
		z(62, 24), z(63, 44), z(32, 23),\
		B,4, 26, 14, 20);

#define H1_k480()\
        s1(z(index00, 27), z(index01, 6), z(index02, 48), z(index03, 12), z(index04, 32), z(index05, 4),\
		B,40, 48, 54, 62);\
	s2(z(index06, 18), z(index07, 39), z(index08, 20), z(index09, 52), z(index10, 33), z(index11, 55),\
		B,44, 59, 33, 49);\
	s3(z(7, 19), z(8, 47), z(9, 41),\
		z(10, 11), z(11, 53), z(12, 38),\
		B,55, 47, 61, 37);\
	s4(z(11, 13), z(12, 45), z(13, 46),\
		z(14, 40), z(15, 34), z(16, 25),\
		B,57, 51, 41, 32);\
	s5(z(index24, 28), z(index25, 8), z(index26, 16), z(index27, 3), z(index28, 43), z(index29, 44),\
		B,39, 45, 56, 34);\
	s6(z(index30, 23), z(index31, 35), z(index32, 15), z(index33, 0), z(index34, 2), z(index35, 36),\
		B,35, 60, 42, 50);\
	s7(z(23, 7), z(24, 29), z(25, 42),\
		z(26, 37), z(27, 24), z(28, 1),\
		B,63, 43, 53, 38);\
	s8(z(27, 50), z(28, 21), z(29, 22),\
		z(30, 10), z(31, 30), z(0, 9),\
		B,36, 58, 46, 52);

#define H2_k480()\
	s1(z(index48, 13), z(index49, 47), z(index50, 34), z(index51, 53), z(index52, 18), z(index53, 45),\
		B,8, 16, 22, 30);\
	s2(z(index54, 4), z(index55, 25), z(index56, 6), z(index57, 38), z(index58, 19), z(index59, 41),\
		B,12, 27, 1, 17);\
	s3(z(39, 5), z(40, 33), z(41, 27),\
		z(42, 52), z(43, 39), z(44, 55),\
		B,23, 15, 29, 5);\
	s4(z(43, 54), z(44, 31), z(45, 32),\
		z(46, 26), z(47, 20), z(48, 11),\
		B,25, 19, 9, 0);\
	s5(z(index72, 14), z(index73, 51), z(index74, 2), z(index75, 42), z(index76, 29), z(index77, 30),\
		B,7, 13, 24, 2);\
	s6(z(index78, 9), z(index79, 21), z(index80, 1), z(index81, 43), z(index82, 17), z(index83, 22),\
		B,3, 28, 10, 18);\
	s7(z(55, 50), z(56, 15), z(57, 28),\
		z(58, 23), z(59, 10), z(60, 44),\
		B,31, 11, 21, 6);\
	s8(z(59, 36), z(60, 7), z(61, 8),\
		z(62, 49), z(63, 16), z(32, 24),\
		B,4, 26, 14, 20);

#define H1_k576()\
        s1(z(index00, 54), z(index01, 33), z(index02, 20), z(index03, 39), z(index04, 4), z(index05, 31),\
		B,40, 48, 54, 62);\
	s2(z(index06, 45), z(index07, 11), z(index08, 47), z(index09, 55), z(index10, 5), z(index11, 27),\
		B,44, 59, 33, 49);\
	s3(z(7, 46), z(8, 19), z(9, 13),\
		z(10, 38), z(11, 25), z(12, 41),\
		B,55, 47, 61, 37);\
	s4(z(11, 40), z(12, 48), z(13, 18),\
		z(14, 12), z(15, 6), z(16, 52),\
		B,57, 51, 41, 32);\
	s5(z(index24, 0), z(index25, 37), z(index26, 17), z(index27, 28), z(index28, 15), z(index29, 16),\
		B,39, 45, 56, 34);\
	s6(z(index30, 24), z(index31, 7), z(index32, 44), z(index33, 29), z(index34, 3), z(index35, 8),\
		B,35, 60, 42, 50);\
	s7(z(23, 36), z(24, 1), z(25, 14),\
		z(26, 9), z(27, 49), z(28, 30),\
		B,63, 43, 53, 38);\
	s8(z(27, 22), z(28, 50), z(29, 51),\
		z(30, 35), z(31, 2), z(0, 10),\
		B,36, 58, 46, 52);

#define H2_k576()\
	s1(z(index48, 40), z(index49, 19), z(index50, 6), z(index51, 25), z(index52, 45), z(index53, 48),\
		B,8, 16, 22, 30);\
	s2(z(index54, 31), z(index55, 52), z(index56, 33), z(index57, 41), z(index58, 46), z(index59, 13),\
		B,12, 27, 1, 17);\
	s3(z(39, 32), z(40, 5), z(41, 54),\
		z(42, 55), z(43, 11), z(44, 27),\
		B,23, 15, 29, 5);\
	s4(z(43, 26), z(44, 34), z(45, 4),\
		z(46, 53), z(47, 47), z(48, 38),\
		B,25, 19, 9, 0);\
	s5(z(index72, 43), z(index73, 23), z(index74, 3), z(index75, 14), z(index76, 1), z(index77, 2),\
		B,7, 13, 24, 2);\
	s6(z(index78, 10), z(index79, 50), z(index80, 30), z(index81, 15), z(index82, 42), z(index83, 51),\
		B,3, 28, 10, 18);\
	s7(z(55, 22), z(56, 44), z(57, 0),\
		z(58, 24), z(59, 35), z(60, 16),\
		B,31, 11, 21, 6);\
	s8(z(59, 8), z(60, 36), z(61, 37),\
		z(62, 21), z(63, 17), z(32, 49),\
		B,4, 26, 14, 20);

#define H1_k672()\
        s1(z(index00, 26), z(index01, 5), z(index02, 47), z(index03, 11), z(index04, 31), z(index05, 34),\
		B,40, 48, 54, 62);\
	s2(z(index06, 48), z(index07, 38), z(index08, 19), z(index09, 27), z(index10, 32), z(index11, 54),\
		B,44, 59, 33, 49);\
	s3(z(7, 18), z(8, 46), z(9, 40),\
		z(10, 41), z(11, 52), z(12, 13),\
		B,55, 47, 61, 37);\
	s4(z(11, 12), z(12, 20), z(13, 45),\
		z(14, 39), z(15, 33), z(16, 55),\
		B,57, 51, 41, 32);\
	s5(z(index24, 29), z(index25, 9), z(index26, 42), z(index27, 0), z(index28, 44), z(index29, 17),\
		B,39, 45, 56, 34);\
	s6(z(index30, 49), z(index31, 36), z(index32, 16), z(index33, 1), z(index34, 28), z(index35, 37),\
		B,35, 60, 42, 50);\
	s7(z(23, 8), z(24, 30), z(25, 43),\
		z(26, 10), z(27, 21), z(28, 2),\
		B,63, 43, 53, 38);\
	s8(z(27, 51), z(28, 22), z(29, 23),\
		z(30, 7), z(31, 3), z(0, 35),\
		B,36, 58, 46, 52);

#define H2_k672()\
	s1(z(index48, 19), z(index49, 53), z(index50, 40), z(index51, 4), z(index52, 55), z(index53, 27),\
		B,8, 16, 22, 30);\
	s2(z(index54, 41), z(index55, 31), z(index56, 12), z(index57, 20), z(index58, 25), z(index59, 47),\
		B,12, 27, 1, 17);\
	s3(z(39, 11), z(40, 39), z(41, 33),\
		z(42, 34), z(43, 45), z(44, 6),\
		B,23, 15, 29, 5);\
	s4(z(43, 5), z(44, 13), z(45, 38),\
		z(46, 32), z(47, 26), z(48, 48),\
		B,25, 19, 9, 0);\
	s5(z(index72, 22), z(index73, 2), z(index74, 35), z(index75, 50), z(index76, 37), z(index77, 10),\
		B,7, 13, 24, 2);\
	s6(z(index78, 42), z(index79, 29), z(index80, 9), z(index81, 51), z(index82, 21), z(index83, 30),\
		B,3, 28, 10, 18);\
	s7(z(55, 1), z(56, 23), z(57, 36),\
		z(58, 3), z(59, 14), z(60, 24),\
		B,31, 11, 21, 6);\
	s8(z(59, 44), z(60, 15), z(61, 16),\
		z(62, 0), z(63, 49), z(32, 28),\
		B,4, 26, 14, 20);

#if (HARDCODE_SALT & FULL_UNROLL)
__kernel void DES_bs_25(constant uint *index768
#if gpu_amd(DEVICE_INFO)
                        __attribute__((max_constant_size(3072)))
#endif
                        , __global int *index96 ,
                        __global DES_bs_transfer *DES_bs_all,
                        __global DES_bs_vector *B_global,
			__global int *binary,
			  int num_loaded_hash,
			  volatile __global uint *output) {

		unsigned int section = get_global_id(0), global_offset_B ,local_offset_K;
		unsigned int local_id = get_local_id(0),i;

		global_offset_B = 64 * section;
		local_offset_K  = 56 * local_id;

		vtype B[64], tmp;

		__local DES_bs_vector _local_K[56 * WORK_GROUP_SIZE] ;

		if(!section)
			for(i = 0; i < num_loaded_hash; i++)
				output[i] = 0;


#ifndef RV7xx
		__local ushort _local_index768[768] ;
#endif
		int iterations;


		if (DES_bs_all[section].keys_changed)
			goto finalize_keys;
body:
		{
			vtype zero = vzero;
			DES_bs_clear_block
		}

		iterations = 25;

#ifndef RV7xx
		if (!local_id )
			for(i = 0; i < 768; i++)
				_local_index768[i] = index768[i];

		barrier(CLK_LOCAL_MEM_FENCE);
#endif

start:         	H1_k0();
		H2_k0();
		H1_k96();
		H2_k96();
		H1_k192();
		H2_k192();
		H1_k288();
		H2_k288();
		H1_k384();
		H2_k384();
		H1_k480();
		H2_k480();
		H1_k576();
		H2_k576();
		H1_k672();
		H2_k672();

		if (--iterations) {
			for (i = 0; i < 32; i++){
				tmp = B[i];
				B[i] = B[i + 32];
				B[i + 32] = tmp;
			}
			goto start;
		}

		cmp(B, binary, num_loaded_hash, output, section);

		tmp = 0 ;
		for (i = 0; i < num_loaded_hash; i++) {
				tmp = tmp | output[i];
			if(tmp) break ;
		}

		if(tmp || (!num_loaded_hash))
		for (i = 0; i < 64; i++)
			B_global[global_offset_B + i] = (DES_bs_vector)B[i] ;

		return;

finalize_keys:
		DES_bs_all[section].keys_changed = 0;
	        DES_bs_finalize_keys(section, DES_bs_all, local_offset_K, _local_K);
		goto body;

}

#elif  (HARDCODE_SALT & (!FULL_UNROLL))

#ifndef RV7xx
#define x(p) vxorf(B[index96[p]], _local_K[_local_index768[p + k] + local_offset_K])
#define z(p, q) vxorf(B[p]      , _local_K[ *_index768_ptr++ + local_offset_K])
#else
#define x(p) vxorf(B[index96[p]], _local_K[index768[p + k] + local_offset_K])
#define z(p, q) vxorf(B[p]      , _local_K[index768[q + k] + local_offset_K])
#endif

#define y48(p, q) vxorf(B[p]     , _local_K[q + local_offset_K])

__kernel void DES_bs_25( constant uint *index768
#if gpu_amd(DEVICE_INFO)
                         __attribute__((max_constant_size(3072)))
#endif
                         , __global int *index96 ,
                         __global DES_bs_transfer *DES_bs_all,
                         __global DES_bs_vector *B_global,
                         __global int *binary,
                         int num_loaded_hash,
                         volatile __global uint *output) {

		unsigned int section = get_global_id(0), global_offset_B, local_offset_K;
		unsigned int local_id = get_local_id(0);

		global_offset_B = 64 * section;
		local_offset_K  = 56 * local_id;

		vtype B[64],tmp;

		__local DES_bs_vector _local_K[56*WORK_GROUP_SIZE] ;
#ifndef RV7xx
		__local ushort _local_index768[768] ;
		__local ushort *_index768_ptr ;
#endif
		int iterations, rounds_and_swapped;

		long int k=0, i;

		if (DES_bs_all[section].keys_changed)
			goto finalize_keys;

body:
		{
			vtype zero = vzero;
			DES_bs_clear_block
		}

		if(!section)
			for(i = 0; i < num_loaded_hash; i++)
				output[i] = 0;


		k=0;
		rounds_and_swapped = 8;
		iterations = 25;

#ifndef RV7xx
		if (!local_id )
			for (i = 0; i < 768; i++)
				_local_index768[i] = index768[i];

		barrier(CLK_LOCAL_MEM_FENCE);
#endif

start:
#ifndef RV7xx
		_index768_ptr = _local_index768 + k ;
#endif
		H1_s();
		if (rounds_and_swapped == 0x100) goto next;
		H2_s();
		k +=96;
		rounds_and_swapped--;

		if (rounds_and_swapped > 0) goto start;
		k -= (0x300 + 48);
		rounds_and_swapped = 0x108;
		if (--iterations) goto swap;

		cmp(B, binary, num_loaded_hash, output, section);

		tmp = 0 ;
		for (i = 0; i < num_loaded_hash; i++) {
				tmp = tmp | output[i];
			if(tmp) break ;
		}

		if(tmp || (!num_loaded_hash))
		for (i = 0; i < 64; i++)
			B_global[global_offset_B + i] = (DES_bs_vector)B[i] ;

		return;

swap:
		H2_k48();
		k += 96;
		if (--rounds_and_swapped) goto start;

next:
		k -= (0x300 - 48);
		rounds_and_swapped = 8;
		iterations--;
		goto start;

finalize_keys:
		DES_bs_all[section].keys_changed = 0;
	        DES_bs_finalize_keys(section, DES_bs_all, local_offset_K, _local_K);
		goto body;
}
#endif

#if !HARDCODE_SALT

#ifdef _CPU
#define loop_body()\
		H1();\
		if (rounds_and_swapped == 0x100) goto next;\
		H2();\
		k += 96;\
		rounds_and_swapped--;\
		H1();\
		if (rounds_and_swapped == 0x100) goto next;\
		H2();\
		k += 96;\
		rounds_and_swapped--;\
                barrier(CLK_LOCAL_MEM_FENCE);
#elif defined(_NV)
#define loop_body()\
		H1();\
		if (rounds_and_swapped == 0x100) goto next;\
		H2();\
		k += 96;\
		rounds_and_swapped--;\
		barrier(CLK_LOCAL_MEM_FENCE);
#else
#define loop_body()\
		H1();\
		if (rounds_and_swapped == 0x100) goto next;\
		H2();\
		k += 96;\
		rounds_and_swapped--;
#endif

__kernel void DES_bs_25_b( constant uint *index768
#if gpu_amd(DEVICE_INFO)
                           __attribute__((max_constant_size(3072)))
#endif
                           , __global int *index96 ,
                           __global DES_bs_transfer *DES_bs_all,
                           __global DES_bs_vector *B_global,
                           __global int *binary,
                           int num_loaded_hash,
                           volatile __global uint *output)
{

		unsigned int section = get_global_id(0), global_offset_B ,local_offset_K;
		unsigned int local_id = get_local_id(0);

		global_offset_B = 64 * section;
		local_offset_K  = 56 * local_id;

		vtype B[64], tmp;

		__local DES_bs_vector _local_K[56 * WORK_GROUP_SIZE] ;
#ifndef RV7xx
		__local ushort _local_index768[768] ;
#endif
		int iterations, rounds_and_swapped;

		long int k=0, i;

		if (DES_bs_all[section].keys_changed)
			goto finalize_keys;
body:
		{
			vtype zero = vzero;
			DES_bs_clear_block
		}

		if(!section)
			for(i = 0; i < num_loaded_hash; i++)
				output[i] = 0;

		k=0;
		rounds_and_swapped = 8;
		iterations = 25;

#ifndef RV7xx
		if (!local_id )
			for (i = 0; i < 768; i++)
				_local_index768[i] = index768[i];

		barrier(CLK_LOCAL_MEM_FENCE);
#endif

start:
		loop_body();

		if (rounds_and_swapped > 0) goto start;
		k -= (0x300 + 48);
		rounds_and_swapped = 0x108;
		if (--iterations) goto swap;

		cmp(B, binary, num_loaded_hash, output, section);

		tmp = 0 ;
		for (i = 0; i < num_loaded_hash; i++) {
				tmp = tmp | output[i];
			if(tmp) break ;
		}

		if(tmp || (!num_loaded_hash))
		for (i = 0; i < 64; i++)
			B_global[global_offset_B + i] = (DES_bs_vector)B[i] ;

		return;

swap:
		H2();
		k += 96;
		if (--rounds_and_swapped) goto start;

next:
		k -= (0x300 - 48);
		rounds_and_swapped = 8;
		iterations--;
		goto start;

finalize_keys:
		DES_bs_all[section].keys_changed = 0;
	        DES_bs_finalize_keys(section, DES_bs_all, local_offset_K, _local_K);
		goto body;
}
#endif
