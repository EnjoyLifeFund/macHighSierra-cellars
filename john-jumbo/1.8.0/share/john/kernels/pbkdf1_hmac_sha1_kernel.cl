/*
 * This software is Copyright (c) 2014 magnum,
 * and it is hereby released to the general public under the following terms:
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted.
 *
 * This is pbkdf1 but using hmac-sha1 (NetBSD crypt)
 *
 * Build-time (at run-time for host code) defines:
 * -DHASH_LOOPS is number of rounds (of 2 x SHA1) per call to loop kernel.
 *
 * For a fixed iterations count, define ITERATIONS. Otherwise salt->iterations
 * will be used (slower).
 *
 * For a fixed output length, define OUTLEN. Otherwise salt->outlen will be
 * used.
 *
 * Example for 4096 iterations and output length 20:
 * -DITERATIONS=4095
 * -DHASH_LOOPS=105 (made by factors of 4095)
 * -DOUTLEN=20
 * pbkdf1_init()
 * for (ITERATIONS / HASH_LOOPS)
 *     pbkdf1_loop()
 * pbkdf1_final()
 *
 *
 * Example for variable iterations count and length:
 * -DHASH_LOOPS=100
 * pbkdf1_init()
 * for ((salt.iterations - 1) / HASH_LOOPS)
 *     pbkdf1_loop()
 * pbkdf1_final() // first 20 bytes of output
 * for ((salt.iterations - 1) / HASH_LOOPS)
 *     pbkdf1_loop()
 * pbkdf1_final() // next 20 bytes of output
 * ...
 */

#include "opencl_device_info.h"

#ifdef ITERATIONS
#if ITERATIONS % HASH_LOOPS
#error HASH_LOOPS must be a divisor of ITERATIONS
#endif
#endif

#define CONCAT(TYPE,WIDTH)	TYPE ## WIDTH
#define VECTOR(x, y)		CONCAT(x, y)

/* host code may pass -DV_WIDTH=2 or some other width */
#if defined(V_WIDTH) && V_WIDTH > 1
#define MAYBE_VECTOR_UINT	VECTOR(uint, V_WIDTH)
#else
#define MAYBE_VECTOR_UINT	uint
#define SCALAR
#endif

/* MAYBE_VECTOR_UINT need to be defined before this header */
#include "opencl_pbkdf1_hmac_sha1.h"

#if gpu_amd(DEVICE_INFO)
#define USE_BITSELECT
#endif

/* Workaround for problem seen with 9600GT */
#if 0 //gpu_nvidia(DEVICE_INFO)
#define MAYBE_CONSTANT	__global const
#else
#define MAYBE_CONSTANT	__constant
#endif

inline uint SWAP32(uint x)
{
	x = rotate(x, 16U);
	return ((x & 0x00FF00FF) << 8) + ((x >> 8) & 0x00FF00FF);
}

#if gpu_amd(DEVICE_INFO) || no_byte_addressable(DEVICE_INFO) || !defined(SCALAR)
#define PUTCHAR_BE(buf, index, val) (buf)[(index)>>2] = ((buf)[(index)>>2] & ~(0xffU << ((((index) & 3) ^ 3) << 3))) + ((val) << ((((index) & 3) ^ 3) << 3))
#define XORCHAR_BE(buf, index, val) (buf)[(index)>>2] = ((buf)[(index)>>2]) ^ ((val) << ((((index) & 3) ^ 3) << 3))
#else
#define PUTCHAR_BE(buf, index, val) ((uchar*)(buf))[(index) ^ 3] = (val)
#define XORCHAR_BE(buf, index, val) ((uchar*)(buf))[(index) ^ 3] ^= (val)
#endif

#if gpu_nvidia(DEVICE_INFO) /* Lukas' original SHA-1 */

#define INIT_A			0x67452301
#define INIT_B			0xefcdab89
#define INIT_C			0x98badcfe
#define INIT_D			0x10325476
#define INIT_E			0xc3d2e1f0

#define SQRT_2			0x5a827999
#define SQRT_3			0x6ed9eba1

#define K1			0x5a827999
#define K2			0x6ed9eba1
#define K3			0x8f1bbcdc
#define K4			0xca62c1d6

#ifdef USE_BITSELECT
#define F1(x, y, z)	bitselect(z, y, x)
#else
#define F1(x, y, z)	(z ^ (x & (y ^ z)))
#endif

#define F2(x, y, z)		(x ^ y ^ z)

#ifdef USE_BITSELECT
#define F3(x, y, z)	(bitselect(x, y, z) ^ bitselect(x, 0U, y))
#else
#define F3(x, y, z)	((x & y) | (z & (x | y)))
#endif

#define F4(x, y, z)		(x ^ y ^ z)

#if 1 // Significantly faster, at least on nvidia
#define S(x, n)	rotate((x), (uint)(n))
#else
#define S(x, n)	((x << n) | ((x) >> (32 - n)))
#endif

#define R(t)	  \
	( \
		temp = W[(t -  3) & 0x0F] ^ W[(t - 8) & 0x0F] ^ \
		W[(t - 14) & 0x0F] ^ W[ t      & 0x0F], \
		( W[t & 0x0F] = S(temp, 1) ) \
		)

#define R2(t)	  \
	( \
		S((W[(t -  3) & 0x0F] ^ W[(t - 8) & 0x0F] ^ \
		   W[(t - 14) & 0x0F] ^ W[ t      & 0x0F]), 1) \
		)

#define P1(a, b, c, d, e, x)	  \
	{ \
		e += S(a, 5) + F1(b, c, d) + K1 + x; b = S(b, 30); \
	}

#define P2(a, b, c, d, e, x)	  \
	{ \
		e += S(a, 5) + F2(b, c, d) + K2 + x; b = S(b, 30); \
	}

#define P3(a, b, c, d, e, x)	  \
	{ \
		e += S(a, 5) + F3(b, c, d) + K3 + x; b = S(b, 30); \
	}

#define P4(a, b, c, d, e, x)	  \
	{ \
		e += S(a, 5) + F4(b, c, d) + K4 + x; b = S(b, 30); \
	}

#define PZ(a, b, c, d, e)	  \
	{ \
		e += S(a, 5) + F1(b, c, d) + K1 ; b = S(b, 30); \
	}

#define SHA1(A, B, C, D, E, W)	  \
	P1(A, B, C, D, E, W[0] ); \
	P1(E, A, B, C, D, W[1] ); \
	P1(D, E, A, B, C, W[2] ); \
	P1(C, D, E, A, B, W[3] ); \
	P1(B, C, D, E, A, W[4] ); \
	P1(A, B, C, D, E, W[5] ); \
	P1(E, A, B, C, D, W[6] ); \
	P1(D, E, A, B, C, W[7] ); \
	P1(C, D, E, A, B, W[8] ); \
	P1(B, C, D, E, A, W[9] ); \
	P1(A, B, C, D, E, W[10]); \
	P1(E, A, B, C, D, W[11]); \
	P1(D, E, A, B, C, W[12]); \
	P1(C, D, E, A, B, W[13]); \
	P1(B, C, D, E, A, W[14]); \
	P1(A, B, C, D, E, W[15]); \
	P1(E, A, B, C, D, R(16)); \
	P1(D, E, A, B, C, R(17)); \
	P1(C, D, E, A, B, R(18)); \
	P1(B, C, D, E, A, R(19)); \
	P2(A, B, C, D, E, R(20)); \
	P2(E, A, B, C, D, R(21)); \
	P2(D, E, A, B, C, R(22)); \
	P2(C, D, E, A, B, R(23)); \
	P2(B, C, D, E, A, R(24)); \
	P2(A, B, C, D, E, R(25)); \
	P2(E, A, B, C, D, R(26)); \
	P2(D, E, A, B, C, R(27)); \
	P2(C, D, E, A, B, R(28)); \
	P2(B, C, D, E, A, R(29)); \
	P2(A, B, C, D, E, R(30)); \
	P2(E, A, B, C, D, R(31)); \
	P2(D, E, A, B, C, R(32)); \
	P2(C, D, E, A, B, R(33)); \
	P2(B, C, D, E, A, R(34)); \
	P2(A, B, C, D, E, R(35)); \
	P2(E, A, B, C, D, R(36)); \
	P2(D, E, A, B, C, R(37)); \
	P2(C, D, E, A, B, R(38)); \
	P2(B, C, D, E, A, R(39)); \
	P3(A, B, C, D, E, R(40)); \
	P3(E, A, B, C, D, R(41)); \
	P3(D, E, A, B, C, R(42)); \
	P3(C, D, E, A, B, R(43)); \
	P3(B, C, D, E, A, R(44)); \
	P3(A, B, C, D, E, R(45)); \
	P3(E, A, B, C, D, R(46)); \
	P3(D, E, A, B, C, R(47)); \
	P3(C, D, E, A, B, R(48)); \
	P3(B, C, D, E, A, R(49)); \
	P3(A, B, C, D, E, R(50)); \
	P3(E, A, B, C, D, R(51)); \
	P3(D, E, A, B, C, R(52)); \
	P3(C, D, E, A, B, R(53)); \
	P3(B, C, D, E, A, R(54)); \
	P3(A, B, C, D, E, R(55)); \
	P3(E, A, B, C, D, R(56)); \
	P3(D, E, A, B, C, R(57)); \
	P3(C, D, E, A, B, R(58)); \
	P3(B, C, D, E, A, R(59)); \
	P4(A, B, C, D, E, R(60)); \
	P4(E, A, B, C, D, R(61)); \
	P4(D, E, A, B, C, R(62)); \
	P4(C, D, E, A, B, R(63)); \
	P4(B, C, D, E, A, R(64)); \
	P4(A, B, C, D, E, R(65)); \
	P4(E, A, B, C, D, R(66)); \
	P4(D, E, A, B, C, R(67)); \
	P4(C, D, E, A, B, R(68)); \
	P4(B, C, D, E, A, R(69)); \
	P4(A, B, C, D, E, R(70)); \
	P4(E, A, B, C, D, R(71)); \
	P4(D, E, A, B, C, R(72)); \
	P4(C, D, E, A, B, R(73)); \
	P4(B, C, D, E, A, R(74)); \
	P4(A, B, C, D, E, R(75)); \
	P4(E, A, B, C, D, R(76)); \
	P4(D, E, A, B, C, R(77)); \
	P4(C, D, E, A, B, R(78)); \
	P4(B, C, D, E, A, R(79));

#define SHA1_SHORT_BEG(A, B, C, D, E, W)	  \
	P1(A, B, C, D, E, W[0]); \
	P1(E, A, B, C, D, W[1]); \
	P1(D, E, A, B, C, W[2]); \
	P1(C, D, E, A, B, W[3]); \
	P1(B, C, D, E, A, W[4]); \
	P1(A, B, C, D, E, W[5]); \
	PZ(E, A, B, C, D); \
	PZ(D, E, A, B, C); \
	PZ(C, D, E, A, B); \
	PZ(B, C, D, E, A); \
	PZ(A, B, C, D, E); \
	PZ(E, A, B, C, D); \
	PZ(D, E, A, B, C); \
	PZ(C, D, E, A, B); \
	PZ(B, C, D, E, A); \
	P1(A, B, C, D, E, W[15]);

#define Q16 (W[0] = S((W[2] ^ W[0]), 1))
#define Q17 (W[1] = S((W[3] ^ W[1]), 1))
#define Q18 (W[2] = S((W[15] ^ W[4] ^ W[2]), 1))
#define Q19 (W[3] = S((W[0]  ^ W[5] ^ W[3]), 1))
#define Q20 (W[4] = S((W[1]  ^ W[4]), 1))
#define Q21 (W[5] = S((W[2] ^ W[5]), 1))
#define Q22 (W[6] = S(W[3], 1))
#define Q23 (W[7] = S((W[4] ^ W[15]), 1))
#define Q24 (W[8] = S((W[5] ^ W[0]), 1))
#define Q25 (W[9] = S((W[6] ^ W[1]), 1))
#define Q26 (W[10] = S((W[7] ^ W[2]), 1))
#define Q27 (W[11] = S((W[8] ^ W[3]), 1))
#define Q28 (W[12] = S((W[9] ^ W[4]), 1))
#define Q29 (W[13] = S((W[10] ^ W[5] ^ W[15]), 1))
#define Q30 (W[14] = S((W[11] ^ W[6] ^ W[0]), 1))

#define SHA1_SHORT_END(A, B, C, D, E, W)	  \
	P1(E, A, B, C, D, Q16); \
	P1(D, E, A, B, C, Q17); \
	P1(C, D, E, A, B, Q18); \
	P1(B, C, D, E, A, Q19); \
	P2(A, B, C, D, E, Q20); \
	P2(E, A, B, C, D, Q21); \
	P2(D, E, A, B, C, Q22); \
	P2(C, D, E, A, B, Q23); \
	P2(B, C, D, E, A, Q24); \
	P2(A, B, C, D, E, Q25); \
	P2(E, A, B, C, D, Q26); \
	P2(D, E, A, B, C, Q27); \
	P2(C, D, E, A, B, Q28); \
	P2(B, C, D, E, A, Q29); \
	P2(A, B, C, D, E, Q30); \
	P2(E, A, B, C, D, R(31)); \
	P2(D, E, A, B, C, R(32)); \
	P2(C, D, E, A, B, R(33)); \
	P2(B, C, D, E, A, R(34)); \
	P2(A, B, C, D, E, R(35)); \
	P2(E, A, B, C, D, R(36)); \
	P2(D, E, A, B, C, R(37)); \
	P2(C, D, E, A, B, R(38)); \
	P2(B, C, D, E, A, R(39)); \
	P3(A, B, C, D, E, R(40)); \
	P3(E, A, B, C, D, R(41)); \
	P3(D, E, A, B, C, R(42)); \
	P3(C, D, E, A, B, R(43)); \
	P3(B, C, D, E, A, R(44)); \
	P3(A, B, C, D, E, R(45)); \
	P3(E, A, B, C, D, R(46)); \
	P3(D, E, A, B, C, R(47)); \
	P3(C, D, E, A, B, R(48)); \
	P3(B, C, D, E, A, R(49)); \
	P3(A, B, C, D, E, R(50)); \
	P3(E, A, B, C, D, R(51)); \
	P3(D, E, A, B, C, R(52)); \
	P3(C, D, E, A, B, R(53)); \
	P3(B, C, D, E, A, R(54)); \
	P3(A, B, C, D, E, R(55)); \
	P3(E, A, B, C, D, R(56)); \
	P3(D, E, A, B, C, R(57)); \
	P3(C, D, E, A, B, R(58)); \
	P3(B, C, D, E, A, R(59)); \
	P4(A, B, C, D, E, R(60)); \
	P4(E, A, B, C, D, R(61)); \
	P4(D, E, A, B, C, R(62)); \
	P4(C, D, E, A, B, R(63)); \
	P4(B, C, D, E, A, R(64)); \
	P4(A, B, C, D, E, R(65)); \
	P4(E, A, B, C, D, R(66)); \
	P4(D, E, A, B, C, R(67)); \
	P4(C, D, E, A, B, R(68)); \
	P4(B, C, D, E, A, R(69)); \
	P4(A, B, C, D, E, R(70)); \
	P4(E, A, B, C, D, R(71)); \
	P4(D, E, A, B, C, R(72)); \
	P4(C, D, E, A, B, R(73)); \
	P4(B, C, D, E, A, R(74)); \
	P4(A, B, C, D, E, R(75)); \
	P4(E, A, B, C, D, R(76)); \
	P4(D, E, A, B, C, R2(77)); \
	P4(C, D, E, A, B, R2(78)); \
	P4(B, C, D, E, A, R2(79));

#define SHA1_SHORT(A, B, C, D, E, W) SHA1_SHORT_BEG(A, B, C, D, E, W) SHA1_SHORT_END(A, B, C, D, E, W)

#define sha1_init(o) {	  \
		o[0] = INIT_A; \
		o[1] = INIT_B; \
		o[2] = INIT_C; \
		o[3] = INIT_D; \
		o[4] = INIT_E; \
	}

#define sha1_block(b, o) {	\
		A = o[0]; \
		B = o[1]; \
		C = o[2]; \
		D = o[3]; \
		E = o[4]; \
		SHA1(A, B, C, D, E, b); \
		o[0] += A; \
		o[1] += B; \
		o[2] += C; \
		o[3] += D; \
		o[4] += E; \
	}

#define sha1_block_short(b, o) {	\
		A = o[0]; \
		B = o[1]; \
		C = o[2]; \
		D = o[3]; \
		E = o[4]; \
		SHA1_SHORT(A, B, C, D, E, b); \
		o[0] += A; \
		o[1] += B; \
		o[2] += C; \
		o[3] += D; \
		o[4] += E; \
	}

#else // Milen's SHA-1, faster for AMD

#ifdef USE_BITSELECT
#define F_00_19(bb, cc, dd) (bitselect((dd), (cc), (bb)))
#define F_20_39(bb, cc, dd)  ((bb) ^ (cc) ^ (dd))
#define F_40_59(bb, cc, dd) (bitselect((cc), (bb), ((dd)^(cc))))
#define F_60_79(bb, cc, dd)  F_20_39((bb), (cc), (dd))
#else
#define F_00_19(bb, cc, dd)  ((((cc) ^ (dd)) & (bb)) ^ (dd))
#define F_20_39(bb, cc, dd)  ((cc) ^ (bb) ^ (dd))
#define F_40_59(bb, cc, dd)  (((bb) & (cc)) | (((bb)|(cc)) & (dd)))
#define F_60_79(bb, cc, dd)  F_20_39(bb, cc, dd)
#endif

#define ROTATE1(aa, bb, cc, dd, ee, x) (ee) = (ee) + rotate((aa), S2) + F_00_19((bb), (cc), (dd)) + (x); (ee) = (ee) + K; (bb) = rotate((bb), S3)
#define ROTATE1_NULL(aa, bb, cc, dd, ee)  (ee) = (ee) + rotate((aa), S2) + F_00_19((bb), (cc), (dd)) + K; (bb) = rotate((bb), S3)
#define ROTATE2_F(aa, bb, cc, dd, ee, x) (ee) = (ee) + rotate((aa), S2) + F_20_39((bb), (cc), (dd)) + (x) + K; (bb) = rotate((bb), S3)
#define ROTATE3_F(aa, bb, cc, dd, ee, x) (ee) = (ee) + rotate((aa), S2) + F_40_59((bb), (cc), (dd)) + (x) + K; (bb) = rotate((bb), S3)
#define ROTATE4_F(aa, bb, cc, dd, ee, x) (ee) = (ee) + rotate((aa), S2) + F_60_79((bb), (cc), (dd)) + (x) + K; (bb) = rotate((bb), S3)

#define S1 1U
#define S2 5U
#define S3 30U

#define H0 (uint)0x67452301
#define H1 (uint)0xEFCDAB89
#define H2 (uint)0x98BADCFE
#define H3 (uint)0x10325476
#define H4 (uint)0xC3D2E1F0

/* raw'n'lean sha1, context kept in output buffer.
   Note that we thrash the input buffer! */
/* The extra a-e variables are a workaround for an AMD bug in Cat 14.6b */
#define sha1_block(W, output) {	  \
		MAYBE_VECTOR_UINT a, b, c, d, e; \
		a = A = output[0]; \
		b = B = output[1]; \
		c = C = output[2]; \
		d = D = output[3]; \
		e = E = output[4]; \
		K = 0x5A827999; \
		ROTATE1(A, B, C, D, E, W[0]); \
		ROTATE1(E, A, B, C, D, W[1]); \
		ROTATE1(D, E, A, B, C, W[2]); \
		ROTATE1(C, D, E, A, B, W[3]); \
		ROTATE1(B, C, D, E, A, W[4]); \
		ROTATE1(A, B, C, D, E, W[5]); \
		ROTATE1(E, A, B, C, D, W[6]); \
		ROTATE1(D, E, A, B, C, W[7]); \
		ROTATE1(C, D, E, A, B, W[8]); \
		ROTATE1(B, C, D, E, A, W[9]); \
		ROTATE1(A, B, C, D, E, W[10]); \
		ROTATE1(E, A, B, C, D, W[11]); \
		ROTATE1(D, E, A, B, C, W[12]); \
		ROTATE1(C, D, E, A, B, W[13]); \
		ROTATE1(B, C, D, E, A, W[14]); \
		ROTATE1(A, B, C, D, E, W[15]); \
		temp = rotate((W[13] ^ W[8] ^ W[2] ^ W[0]), S1); ROTATE1(E, A, B, C, D, temp); \
		W[0] = rotate((W[14] ^ W[9] ^ W[3] ^ W[1]), S1); ROTATE1(D, E, A, B, C, W[0]); \
		W[1] = rotate((W[15] ^ W[10] ^ W[4] ^ W[2]), S1); ROTATE1(C, D, E, A, B, W[1]); \
		W[2] = rotate((temp ^ W[11] ^ W[5] ^ W[3]), S1);  ROTATE1(B, C, D, E, A, W[2]); \
		K = 0x6ED9EBA1; \
		W[3] = rotate((W[0] ^ W[12] ^ W[6] ^ W[4]), S1); ROTATE2_F(A, B, C, D, E, W[3]); \
		W[4] = rotate((W[1] ^ W[13] ^ W[7] ^ W[5]), S1); ROTATE2_F(E, A, B, C, D, W[4]); \
		W[5] = rotate((W[2] ^ W[14] ^ W[8] ^ W[6]), S1); ROTATE2_F(D, E, A, B, C, W[5]); \
		W[6] = rotate((W[3] ^ W[15] ^ W[9] ^ W[7]), S1); ROTATE2_F(C, D, E, A, B, W[6]); \
		W[7] = rotate((W[4] ^ temp ^ W[10] ^ W[8]), S1); ROTATE2_F(B, C, D, E, A, W[7]); \
		W[8] = rotate((W[5] ^ W[0] ^ W[11] ^ W[9]), S1); ROTATE2_F(A, B, C, D, E, W[8]); \
		W[9] = rotate((W[6] ^ W[1] ^ W[12] ^ W[10]), S1); ROTATE2_F(E, A, B, C, D, W[9]); \
		W[10] = rotate((W[7] ^ W[2] ^ W[13] ^ W[11]), S1); ROTATE2_F(D, E, A, B, C, W[10]); \
		W[11] = rotate((W[8] ^ W[3] ^ W[14] ^ W[12]), S1); ROTATE2_F(C, D, E, A, B, W[11]); \
		W[12] = rotate((W[9] ^ W[4] ^ W[15] ^ W[13]), S1); ROTATE2_F(B, C, D, E, A, W[12]); \
		W[13] = rotate((W[10] ^ W[5] ^ temp ^ W[14]), S1); ROTATE2_F(A, B, C, D, E, W[13]); \
		W[14] = rotate((W[11] ^ W[6] ^ W[0] ^ W[15]), S1); ROTATE2_F(E, A, B, C, D, W[14]); \
		W[15] = rotate((W[12] ^ W[7] ^ W[1] ^ temp), S1); ROTATE2_F(D, E, A, B, C, W[15]); \
		temp = rotate((W[13] ^ W[8] ^ W[2] ^ W[0]), S1); ROTATE2_F(C, D, E, A, B, temp); \
		W[0] = rotate(W[14] ^ W[9] ^ W[3] ^ W[1], S1); ROTATE2_F(B, C, D, E, A, W[0]); \
		W[1] = rotate(W[15] ^ W[10] ^ W[4] ^ W[2], S1); ROTATE2_F(A, B, C, D, E, W[1]); \
		W[2] = rotate(temp ^ W[11] ^ W[5] ^ W[3], S1); ROTATE2_F(E, A, B, C, D, W[2]); \
		W[3] = rotate(W[0] ^ W[12] ^ W[6] ^ W[4], S1); ROTATE2_F(D, E, A, B, C, W[3]); \
		W[4] = rotate(W[1] ^ W[13] ^ W[7] ^ W[5], S1); ROTATE2_F(C, D, E, A, B, W[4]); \
		W[5] = rotate(W[2] ^ W[14] ^ W[8] ^ W[6], S1); ROTATE2_F(B, C, D, E, A, W[5]); \
		K = 0x8F1BBCDC; \
		W[6] = rotate(W[3] ^ W[15] ^ W[9] ^ W[7], S1); ROTATE3_F(A, B, C, D, E, W[6]); \
		W[7] = rotate(W[4] ^ temp ^ W[10] ^ W[8], S1); ROTATE3_F(E, A, B, C, D, W[7]); \
		W[8] = rotate(W[5] ^ W[0] ^ W[11] ^ W[9], S1); ROTATE3_F(D, E, A, B, C, W[8]); \
		W[9] = rotate(W[6] ^ W[1] ^ W[12] ^ W[10], S1); ROTATE3_F(C, D, E, A, B, W[9]); \
		W[10] = rotate(W[7] ^ W[2] ^ W[13] ^ W[11], S1); ROTATE3_F(B, C, D, E, A, W[10]); \
		W[11] = rotate(W[8] ^ W[3] ^ W[14] ^ W[12], S1); ROTATE3_F(A, B, C, D, E, W[11]); \
		W[12] = rotate(W[9] ^ W[4] ^ W[15] ^ W[13], S1); ROTATE3_F(E, A, B, C, D, W[12]); \
		W[13] = rotate(W[10] ^ W[5] ^ temp ^ W[14], S1); ROTATE3_F(D, E, A, B, C, W[13]); \
		W[14] = rotate(W[11] ^ W[6] ^ W[0] ^ W[15], S1); ROTATE3_F(C, D, E, A, B, W[14]); \
		W[15] = rotate(W[12] ^ W[7] ^ W[1] ^ temp, S1); ROTATE3_F(B, C, D, E, A, W[15]); \
		temp = rotate(W[13] ^ W[8] ^ W[2] ^ W[0], S1); ROTATE3_F(A, B, C, D, E, temp); \
		W[0] = rotate(W[14] ^ W[9] ^ W[3] ^ W[1], S1); ROTATE3_F(E, A, B, C, D, W[0]); \
		W[1] = rotate(W[15] ^ W[10] ^ W[4] ^ W[2], S1); ROTATE3_F(D, E, A, B, C, W[1]); \
		W[2] = rotate(temp ^ W[11] ^ W[5] ^ W[3], S1); ROTATE3_F(C, D, E, A, B, W[2]); \
		W[3] = rotate(W[0] ^ W[12] ^ W[6] ^ W[4], S1); ROTATE3_F(B, C, D, E, A, W[3]); \
		W[4] = rotate(W[1] ^ W[13] ^ W[7] ^ W[5], S1); ROTATE3_F(A, B, C, D, E, W[4]); \
		W[5] = rotate(W[2] ^ W[14] ^ W[8] ^ W[6], S1); ROTATE3_F(E, A, B, C, D, W[5]); \
		W[6] = rotate(W[3] ^ W[15] ^ W[9] ^ W[7], S1); ROTATE3_F(D, E, A, B, C, W[6]); \
		W[7] = rotate(W[4] ^ temp ^ W[10] ^ W[8], S1); ROTATE3_F(C, D, E, A, B, W[7]); \
		W[8] = rotate(W[5] ^ W[0] ^ W[11] ^ W[9], S1); ROTATE3_F(B, C, D, E, A, W[8]); \
		K = 0xCA62C1D6; \
		W[9] = rotate(W[6] ^ W[1] ^ W[12] ^ W[10], S1); ROTATE4_F(A, B, C, D, E, W[9]); \
		W[10] = rotate(W[7] ^ W[2] ^ W[13] ^ W[11], S1); ROTATE4_F(E, A, B, C, D, W[10]); \
		W[11] = rotate(W[8] ^ W[3] ^ W[14] ^ W[12], S1); ROTATE4_F(D, E, A, B, C, W[11]); \
		W[12] = rotate(W[9] ^ W[4] ^ W[15] ^ W[13], S1); ROTATE4_F(C, D, E, A, B, W[12]); \
		W[13] = rotate(W[10] ^ W[5] ^ temp ^ W[14], S1); ROTATE4_F(B, C, D, E, A, W[13]); \
		W[14] = rotate(W[11] ^ W[6] ^ W[0] ^ W[15], S1); ROTATE4_F(A, B, C, D, E, W[14]); \
		W[15] = rotate(W[12] ^ W[7] ^ W[1] ^ temp, S1); ROTATE4_F(E, A, B, C, D, W[15]); \
		temp = rotate(W[13] ^ W[8] ^ W[2] ^ W[0], S1); ROTATE4_F(D, E, A, B, C, temp); \
		W[0] = rotate(W[14] ^ W[9] ^ W[3] ^ W[1], S1); ROTATE4_F(C, D, E, A, B, W[0]); \
		W[1] = rotate(W[15] ^ W[10] ^ W[4] ^ W[2], S1); ROTATE4_F(B, C, D, E, A, W[1]); \
		W[2] = rotate(temp ^ W[11] ^ W[5] ^ W[3], S1); ROTATE4_F(A, B, C, D, E, W[2]); \
		W[3] = rotate(W[0] ^ W[12] ^ W[6] ^ W[4], S1); ROTATE4_F(E, A, B, C, D, W[3]); \
		W[4] = rotate(W[1] ^ W[13] ^ W[7] ^ W[5], S1); ROTATE4_F(D, E, A, B, C, W[4]); \
		W[5] = rotate(W[2] ^ W[14] ^ W[8] ^ W[6], S1); ROTATE4_F(C, D, E, A, B, W[5]); \
		W[6] = rotate(W[3] ^ W[15] ^ W[9] ^ W[7], S1); ROTATE4_F(B, C, D, E, A, W[6]); \
		W[7] = rotate(W[4] ^ temp ^ W[10] ^ W[8], S1); ROTATE4_F(A, B, C, D, E, W[7]); \
		W[8] = rotate(W[5] ^ W[0] ^ W[11] ^ W[9], S1); ROTATE4_F(E, A, B, C, D, W[8]); \
		W[9] = rotate(W[6] ^ W[1] ^ W[12] ^ W[10], S1); ROTATE4_F(D, E, A, B, C, W[9]); \
		W[10] = rotate(W[7] ^ W[2] ^ W[13] ^ W[11], S1); ROTATE4_F(C, D, E, A, B, W[10]); \
		W[11] = rotate(W[8] ^ W[3] ^ W[14] ^ W[12], S1); ROTATE4_F(B, C, D, E, A, W[11]); \
		output[0] = a + A; \
		output[1] = b + B; \
		output[2] = c + C; \
		output[3] = d + D; \
		output[4] = e + E; \
	}

#define sha1_init(output) {	  \
		output[0] = H0; \
		output[1] = H1; \
		output[2] = H2; \
		output[3] = H3; \
		output[4] = H4; \
	}
#endif /* Lukas or Milen */

#define dump_stuff_msg(msg, x, size) {	  \
		uint ii; \
		printf("%s : ", msg); \
		for (ii = 0; ii < (size)/4; ii++) \
			printf("%08x ", x[ii]); \
		printf("\n"); \
	}

inline void hmac_sha1(__global MAYBE_VECTOR_UINT *state,
                      __global MAYBE_VECTOR_UINT *ipad,
                      __global MAYBE_VECTOR_UINT *opad,
                      MAYBE_CONSTANT uchar *salt, uint saltlen)
{
	uint i;
	MAYBE_VECTOR_UINT W[16];
	MAYBE_VECTOR_UINT output[5];
#if !gpu_nvidia(DEVICE_INFO)
	MAYBE_VECTOR_UINT K;
#endif
	MAYBE_VECTOR_UINT A, B, C, D, E, temp;

	for (i = 0; i < 5; i++)
		output[i] = ipad[i];

	for (i = 0; i < 15; i++)
		W[i] = 0;

	for (i = 0; i < saltlen; i++)
		PUTCHAR_BE(W, i, salt[i]);
	PUTCHAR_BE(W, saltlen, 0x80);
	W[15] = (64 + saltlen) << 3;
	sha1_block(W, output);

	for (i = 0; i < 5; i++)
		W[i] = output[i];
	W[5] = 0x80000000;
	W[15] = (64 + 20) << 3;

	for (i = 0; i < 5; i++)
		output[i] = opad[i];
#if gpu_nvidia(DEVICE_INFO)
	sha1_block_short(W, output);
#else
	for (i = 6; i < 15; i++)
		W[i] = 0;
	sha1_block(W, output);
#endif

	for (i = 0; i < 5; i++)
		state[i] = output[i];
}

inline void preproc(__global const MAYBE_VECTOR_UINT *key,
                    __global MAYBE_VECTOR_UINT *state, uint padding)
{
	uint i;
	MAYBE_VECTOR_UINT W[16];
	MAYBE_VECTOR_UINT output[5];
#if !gpu_nvidia(DEVICE_INFO)
	MAYBE_VECTOR_UINT K;
#endif
	MAYBE_VECTOR_UINT A, B, C, D, E, temp;

	for (i = 0; i < 16; i++)
		W[i] = key[i] ^ padding;

	sha1_init(output);
	sha1_block(W, output);

	for (i = 0; i < 5; i++)
		state[i] = output[i];
}

__kernel
__attribute__((vec_type_hint(MAYBE_VECTOR_UINT)))
void pbkdf1_init(__global const MAYBE_VECTOR_UINT *inbuffer,
                 MAYBE_CONSTANT pbkdf1_salt *salt,
                 __global pbkdf1_state *state)
{
	uint gid = get_global_id(0);
	uint i;

	preproc(&inbuffer[gid * 16], state[gid].ipad, 0x36363636);
	preproc(&inbuffer[gid * 16], state[gid].opad, 0x5c5c5c5c);

	hmac_sha1(state[gid].out, state[gid].ipad, state[gid].opad,
	          salt->salt, salt->length);

	for (i = 0; i < 5; i++)
		state[gid].W[i] = state[gid].out[i];

#ifndef ITERATIONS
	state[gid].iter_cnt = salt->iterations - 1;
#endif
	state[gid].pass = 0;
}

__kernel
__attribute__((vec_type_hint(MAYBE_VECTOR_UINT)))
void pbkdf1_loop(__global pbkdf1_state *state)
{
	uint gid = get_global_id(0);
	uint i, j;
#if !gpu_nvidia(DEVICE_INFO)
	MAYBE_VECTOR_UINT K;
#endif
	MAYBE_VECTOR_UINT A, B, C, D, E, temp;
	MAYBE_VECTOR_UINT W[16];
	MAYBE_VECTOR_UINT ipad[5];
	MAYBE_VECTOR_UINT opad[5];
	MAYBE_VECTOR_UINT output[5];
#if defined ITERATIONS
#define iterations HASH_LOOPS
#else
	uint iterations = state[gid].iter_cnt > HASH_LOOPS ?
		HASH_LOOPS : state[gid].iter_cnt;
#endif
	for (i = 0; i < 5; i++)
		W[i] = state[gid].W[i];
	for (i = 0; i < 5; i++)
		ipad[i] = state[gid].ipad[i];
	for (i = 0; i < 5; i++)
		opad[i] = state[gid].opad[i];

	for (j = 0; j < iterations; j++) {
		for (i = 0; i < 5; i++)
			output[i] = ipad[i];
		W[5] = 0x80000000;
		W[15] = (64 + 20) << 3;
#if gpu_nvidia(DEVICE_INFO)
		sha1_block_short(W, output);
#else
		for (i = 6; i < 15; i++)
			W[i] = 0;
		sha1_block(W, output);
#endif

		for (i = 0; i < 5; i++)
			W[i] = output[i];
		W[5] = 0x80000000;
		W[15] = (64 + 20) << 3;
		for (i = 0; i < 5; i++)
			output[i] = opad[i];
#if gpu_nvidia(DEVICE_INFO)
		sha1_block_short(W, output);
#else
		for (i = 6; i < 15; i++)
			W[i] = 0;
		sha1_block(W, output);
#endif

		for (i = 0; i < 5; i++)
			W[i] = output[i];
	}

	for (i = 0; i < 5; i++)
		state[gid].W[i] = W[i];
	for (i = 0; i < 5; i++)
		state[gid].out[i] = W[i];

#ifndef ITERATIONS
	state[gid].iter_cnt -= iterations;
#endif
}

#ifndef OUTLEN
#define OUTLEN salt->outlen
#endif

__kernel
__attribute__((vec_type_hint(MAYBE_VECTOR_UINT)))
void pbkdf1_final(MAYBE_CONSTANT pbkdf1_salt *salt,
                  __global pbkdf1_out *out,
                  __global pbkdf1_state *state)
{
	uint gid = get_global_id(0);
	uint i, base;

	base = state[gid].pass++ * 5;

	// First/next 20 bytes of output
	for (i = 0; i < 5; i++)
#ifdef SCALAR
		out[gid].dk[base + i] = SWAP32(state[gid].out[i]);
#else

#define VEC_OUT(NUM)	  \
	out[gid * V_WIDTH + 0x##NUM].dk[base + i] = \
		SWAP32(state[gid].out[i].s##NUM)

	{
		VEC_OUT(0);
		VEC_OUT(1);
#if V_WIDTH > 2
		VEC_OUT(2);
#if V_WIDTH > 3
		VEC_OUT(3);
#if V_WIDTH > 4
		VEC_OUT(4);
		VEC_OUT(5);
		VEC_OUT(6);
		VEC_OUT(7);
#if V_WIDTH > 8
		VEC_OUT(8);
		VEC_OUT(9);
		VEC_OUT(a);
		VEC_OUT(b);
		VEC_OUT(c);
		VEC_OUT(d);
		VEC_OUT(e);
		VEC_OUT(f);
#endif
#endif
#endif
#endif
	}
#endif

	/* Was this the last pass? If not, prepare for next one */
	if (4 * base + 20 < OUTLEN) {
		hmac_sha1(state[gid].out, state[gid].ipad, state[gid].opad,
		          salt->salt, salt->length);

		for (i = 0; i < 5; i++)
			state[gid].W[i] = state[gid].out[i];

#ifndef ITERATIONS
		state[gid].iter_cnt = salt->iterations - 1;
#endif
	}
}
