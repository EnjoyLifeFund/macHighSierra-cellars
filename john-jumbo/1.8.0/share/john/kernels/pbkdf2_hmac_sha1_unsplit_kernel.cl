/*
 * This software is Copyright (c) 2012 Lukas Odzioba <ukasz@openwall.net>
 * and Copyright (c) 2012 magnum
 * and it is hereby released to the general public under the following terms:
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted.
 *
 * Pass this kernel -DKEYLEN=x -DOUTLEN=y -DSALTLEN=z for generic use.
 *
 * KEYLEN  should be PLAINTEXT_LENGTH for passwords or 20 for hash
 * OUTLEN  should be sizeof(outbuffer->v)
 * SALTLEN should be sizeof(currentsalt.salt)
 */

#include "opencl_device_info.h"

/* Macros for reading/writing chars from int32's */
#if gpu_amd(DEVICE_INFO) || no_byte_addressable(DEVICE_INFO)
/* These use 32-bit stores */
#define XORCHAR_BE(buf, index, val) (buf)[(index)>>2] = ((buf)[(index)>>2]) ^ ((val) << ((((index) & 3) ^ 3) << 3))
#define PUTCHAR(buf, index, val) (buf)[(index)>>2] = ((buf)[(index)>>2] & ~(0xffU << (((index) & 3) << 3))) + ((val) << (((index) & 3) << 3))
#define PUTCHAR_BE(buf, index, val) (buf)[(index)>>2] = ((buf)[(index)>>2] & ~(0xffU << ((((index) & 3) ^ 3) << 3))) + ((val) << ((((index) & 3) ^ 3) << 3))
#define PUTCHAR_G	PUTCHAR
#define PUTCHAR_BE_G	PUTCHAR_BE
#else
/* These use byte-adressed stores */
#define XORCHAR_BE(buf, index, val) ((uchar*)(buf))[(index) ^ 3] ^= (val)
#define PUTCHAR(buf, index, val) ((uchar*)(buf))[(index)] = (val)
#define PUTCHAR_G(buf, index, val) ((__global uchar*)(buf))[(index)] = (val)
#define PUTCHAR_BE(buf, index, val) ((uchar*)(buf))[(index) ^ 3] = (val)
#define PUTCHAR_BE_G(buf, index, val) ((__global uchar*)(buf))[(index) ^ 3] = (val)
#endif

#ifdef SCALAR
inline uint SWAP32(uint x)
{
	x = rotate(x, 16U);
	return ((x & 0x00FF00FF) << 8) + ((x >> 8) & 0x00FF00FF);
}
#else
#define SWAP32(a)	(as_uint(as_uchar4(a).wzyx))
#endif

#define INIT_A			0x67452301
#define INIT_B			0xefcdab89
#define INIT_C			0x98badcfe
#define INIT_D			0x10325476
#define INIT_E			0xc3d2e1f0

#define SQRT_2			0x5a827999
#define SQRT_3			0x6ed9eba1

#define SHA1_DIGEST_LENGTH	20

#define K1			0x5a827999
#define K2			0x6ed9eba1
#define K3			0x8f1bbcdc
#define K4			0xca62c1d6

#ifdef USE_BITSELECT
#define F1(x,y,z)	bitselect(z, y, x)
#else
#define F1(x,y,z)	(z ^ (x & (y ^ z)))
#endif
#define F2(x,y,z)	(x ^ y ^ z)
#ifdef USE_BITSELECT
#define F3(x,y,z)	(bitselect(x, y, z) ^ bitselect(x, 0U, y))
#else
#define F3(x,y,z)	((x & y) | (z & (x | y)))
#endif
#define F4(x,y,z)	(x ^ y ^ z)

#ifndef GET_WORD_32_BE
#define GET_WORD_32_BE(n,b,i)                           \
{                                                       \
    (n) = ( (unsigned long) (b)[(i)    ] << 24 )        \
        | ( (unsigned long) (b)[(i) + 1] << 16 )        \
        | ( (unsigned long) (b)[(i) + 2] <<  8 )        \
        | ( (unsigned long) (b)[(i) + 3]       );       \
}
#endif

#ifndef PUT_WORD_32_BE
#define PUT_WORD_32_BE(n,b,i)                           \
{                                                       \
    (b)[(i)    ] = (unsigned char) ( (n) >> 24 );       \
    (b)[(i) + 1] = (unsigned char) ( (n) >> 16 );       \
    (b)[(i) + 2] = (unsigned char) ( (n) >>  8 );       \
    (b)[(i) + 3] = (unsigned char) ( (n)       );       \
}
#endif

#if 0
#define S(x, n) (rotate((x), (uint)(n)))
#else
#define S(x, n) ((x << n) | ((x) >> (32 - n)))
#endif

#define R(t)                                            \
(                                                       \
    temp = W[(t -  3) & 0x0F] ^ W[(t - 8) & 0x0F] ^     \
           W[(t - 14) & 0x0F] ^ W[ t      & 0x0F],      \
    ( W[t & 0x0F] = S(temp,1) )                         \
)

#define R2(t)                                            \
(                                                       \
    S((W[(t -  3) & 0x0F] ^ W[(t - 8) & 0x0F] ^     \
     W[(t - 14) & 0x0F] ^ W[ t      & 0x0F]),1)          \
)

#define P1(a,b,c,d,e,x)                                  \
{                                                       \
    e += S(a,5) + F1(b,c,d) + K1 + x; b = S(b,30);        \
}

#define P2(a,b,c,d,e,x)                                  \
{                                                       \
    e += S(a,5) + F2(b,c,d) + K2 + x; b = S(b,30);        \
}

#define P3(a,b,c,d,e,x)                                  \
{                                                       \
    e += S(a,5) + F3(b,c,d) + K3 + x; b = S(b,30);        \
}

#define P4(a,b,c,d,e,x)                                  \
{                                                       \
    e += S(a,5) + F4(b,c,d) + K4 + x; b = S(b,30);        \
}

#define PZ(a,b,c,d,e)                                  \
{                                                       \
    e += S(a,5) + F1(b,c,d) + K1 ; b = S(b,30);        \
}

#define SHA1(A,B,C,D,E,W) \
    P1(A, B, C, D, E, W[0] );\
    P1(E, A, B, C, D, W[1] );\
    P1(D, E, A, B, C, W[2] );\
    P1(C, D, E, A, B, W[3] );\
    P1(B, C, D, E, A, W[4] );\
    P1(A, B, C, D, E, W[5] );\
    P1(E, A, B, C, D, W[6] );\
    P1(D, E, A, B, C, W[7] );\
    P1(C, D, E, A, B, W[8] );\
    P1(B, C, D, E, A, W[9] );\
    P1(A, B, C, D, E, W[10]);\
    P1(E, A, B, C, D, W[11]);\
    P1(D, E, A, B, C, W[12]);\
    P1(C, D, E, A, B, W[13]);\
    P1(B, C, D, E, A, W[14]);\
    P1(A, B, C, D, E, W[15]);\
    P1(E, A, B, C, D, R(16));\
    P1(D, E, A, B, C, R(17));\
    P1(C, D, E, A, B, R(18));\
    P1(B, C, D, E, A, R(19));\
    P2(A, B, C, D, E, R(20));\
    P2(E, A, B, C, D, R(21));\
    P2(D, E, A, B, C, R(22));\
    P2(C, D, E, A, B, R(23));\
    P2(B, C, D, E, A, R(24));\
    P2(A, B, C, D, E, R(25));\
    P2(E, A, B, C, D, R(26));\
    P2(D, E, A, B, C, R(27));\
    P2(C, D, E, A, B, R(28));\
    P2(B, C, D, E, A, R(29));\
    P2(A, B, C, D, E, R(30));\
    P2(E, A, B, C, D, R(31));\
    P2(D, E, A, B, C, R(32));\
    P2(C, D, E, A, B, R(33));\
    P2(B, C, D, E, A, R(34));\
    P2(A, B, C, D, E, R(35));\
    P2(E, A, B, C, D, R(36));\
    P2(D, E, A, B, C, R(37));\
    P2(C, D, E, A, B, R(38));\
    P2(B, C, D, E, A, R(39));\
    P3(A, B, C, D, E, R(40));\
    P3(E, A, B, C, D, R(41));\
    P3(D, E, A, B, C, R(42));\
    P3(C, D, E, A, B, R(43));\
    P3(B, C, D, E, A, R(44));\
    P3(A, B, C, D, E, R(45));\
    P3(E, A, B, C, D, R(46));\
    P3(D, E, A, B, C, R(47));\
    P3(C, D, E, A, B, R(48));\
    P3(B, C, D, E, A, R(49));\
    P3(A, B, C, D, E, R(50));\
    P3(E, A, B, C, D, R(51));\
    P3(D, E, A, B, C, R(52));\
    P3(C, D, E, A, B, R(53));\
    P3(B, C, D, E, A, R(54));\
    P3(A, B, C, D, E, R(55));\
    P3(E, A, B, C, D, R(56));\
    P3(D, E, A, B, C, R(57));\
    P3(C, D, E, A, B, R(58));\
    P3(B, C, D, E, A, R(59));\
    P4(A, B, C, D, E, R(60));\
    P4(E, A, B, C, D, R(61));\
    P4(D, E, A, B, C, R(62));\
    P4(C, D, E, A, B, R(63));\
    P4(B, C, D, E, A, R(64));\
    P4(A, B, C, D, E, R(65));\
    P4(E, A, B, C, D, R(66));\
    P4(D, E, A, B, C, R(67));\
    P4(C, D, E, A, B, R(68));\
    P4(B, C, D, E, A, R(69));\
    P4(A, B, C, D, E, R(70));\
    P4(E, A, B, C, D, R(71));\
    P4(D, E, A, B, C, R(72));\
    P4(C, D, E, A, B, R(73));\
    P4(B, C, D, E, A, R(74));\
    P4(A, B, C, D, E, R(75));\
    P4(E, A, B, C, D, R(76));\
    P4(D, E, A, B, C, R(77));\
    P4(C, D, E, A, B, R(78));\
    P4(B, C, D, E, A, R(79));

#define SHA1shortBEG(A,B,C,D,E,W) \
    P1(A, B, C, D, E, W[0]);\
    P1(E, A, B, C, D, W[1]);\
    P1(D, E, A, B, C, W[2]);\
    P1(C, D, E, A, B, W[3]);\
    P1(B, C, D, E, A, W[4]);\
    P1(A, B, C, D, E, W[5]);\
    PZ(E, A, B, C, D);\
    PZ(D, E, A, B, C);\
    PZ(C, D, E, A, B);\
    PZ(B, C, D, E, A);\
    PZ(A, B, C, D, E);\
    PZ(E, A, B, C, D);\
    PZ(D, E, A, B, C);\
    PZ(C, D, E, A, B);\
    PZ(B, C, D, E, A);\
    P1(A, B, C, D, E, W[15]);\

#define Q16 (W[0] = S((W[2] ^ W[0]),1))
#define Q17 (W[1] = S((W[3] ^ W[1]),1))
#define Q18 (W[2] = S((W[15] ^ W[4] ^ W[2]),1))
#define Q19 (W[3] = S((W[0]  ^ W[5] ^ W[3]),1))
#define Q20 (W[4] = S((W[1]  ^ W[4]),1))
#define Q21 (W[5] = S((W[2] ^ W[5]),1))
#define Q22 (W[6] = S(W[3],1))
#define Q23 (W[7] = S((W[4] ^ W[15]),1))
#define Q24 (W[8] = S((W[5] ^ W[0]),1))
#define Q25 (W[9] = S((W[6] ^ W[1]),1))
#define Q26 (W[10] = S((W[7] ^ W[2]),1))
#define Q27 (W[11] = S((W[8] ^ W[3]),1))
#define Q28 (W[12] = S((W[9] ^ W[4]),1))
#define Q29 (W[13] = S((W[10] ^ W[5] ^ W[15]),1))
#define Q30 (W[14] = S((W[11] ^ W[6] ^ W[0]),1))
#define SHA1shortEND(A,B,C,D,E,W)\
    P1(E, A, B, C, D, Q16);\
    P1(D, E, A, B, C, Q17);\
    P1(C, D, E, A, B, Q18);\
    P1(B, C, D, E, A, Q19);\
    P2(A, B, C, D, E, Q20);\
    P2(E, A, B, C, D, Q21);\
    P2(D, E, A, B, C, Q22);\
    P2(C, D, E, A, B, Q23);\
    P2(B, C, D, E, A, Q24);\
    P2(A, B, C, D, E, Q25);\
    P2(E, A, B, C, D, Q26);\
    P2(D, E, A, B, C, Q27);\
    P2(C, D, E, A, B, Q28);\
    P2(B, C, D, E, A, Q29);\
    P2(A, B, C, D, E, Q30);\
    P2(E, A, B, C, D, R(31));\
    P2(D, E, A, B, C, R(32));\
    P2(C, D, E, A, B, R(33));\
    P2(B, C, D, E, A, R(34));\
    P2(A, B, C, D, E, R(35));\
    P2(E, A, B, C, D, R(36));\
    P2(D, E, A, B, C, R(37));\
    P2(C, D, E, A, B, R(38));\
    P2(B, C, D, E, A, R(39));\
    P3(A, B, C, D, E, R(40));\
    P3(E, A, B, C, D, R(41));\
    P3(D, E, A, B, C, R(42));\
    P3(C, D, E, A, B, R(43));\
    P3(B, C, D, E, A, R(44));\
    P3(A, B, C, D, E, R(45));\
    P3(E, A, B, C, D, R(46));\
    P3(D, E, A, B, C, R(47));\
    P3(C, D, E, A, B, R(48));\
    P3(B, C, D, E, A, R(49));\
    P3(A, B, C, D, E, R(50));\
    P3(E, A, B, C, D, R(51));\
    P3(D, E, A, B, C, R(52));\
    P3(C, D, E, A, B, R(53));\
    P3(B, C, D, E, A, R(54));\
    P3(A, B, C, D, E, R(55));\
    P3(E, A, B, C, D, R(56));\
    P3(D, E, A, B, C, R(57));\
    P3(C, D, E, A, B, R(58));\
    P3(B, C, D, E, A, R(59));\
    P4(A, B, C, D, E, R(60));\
    P4(E, A, B, C, D, R(61));\
    P4(D, E, A, B, C, R(62));\
    P4(C, D, E, A, B, R(63));\
    P4(B, C, D, E, A, R(64));\
    P4(A, B, C, D, E, R(65));\
    P4(E, A, B, C, D, R(66));\
    P4(D, E, A, B, C, R(67));\
    P4(C, D, E, A, B, R(68));\
    P4(B, C, D, E, A, R(69));\
    P4(A, B, C, D, E, R(70));\
    P4(E, A, B, C, D, R(71));\
    P4(D, E, A, B, C, R(72));\
    P4(C, D, E, A, B, R(73));\
    P4(B, C, D, E, A, R(74));\
    P4(A, B, C, D, E, R(75));\
    P4(E, A, B, C, D, R(76));\
    P4(D, E, A, B, C, R2(77));\
    P4(C, D, E, A, B, R2(78));\
    P4(B, C, D, E, A, R2(79));

#define  SHA1short(A,B,C,D,E,W)	  \
	SHA1shortBEG(A,B,C,D,E,W) SHA1shortEND(A,B,C,D,E,W)


typedef struct {
	uint length;
	uchar v[KEYLEN];
} pbkdf2_password;

typedef struct {
	uint v[(OUTLEN+3)/4];
} pbkdf2_hash;

typedef struct {
	uchar length;
	uchar salt[SALTLEN];
	uint iterations;
	uint outlen;
} pbkdf2_salt;

inline void preproc(__global const uchar * key, uint keylen,
    __private uint * state, uint padding)
{
	uint i;
	uint W[16], temp;

	for (i = 0; i < 16; i++)
		W[i] = padding;

	for (i = 0; i < keylen; i++)
		XORCHAR_BE(W, i, key[i]);

	uint A = INIT_A;
	uint B = INIT_B;
	uint C = INIT_C;
	uint D = INIT_D;
	uint E = INIT_E;

	SHA1(A, B, C, D, E, W);

	state[0] = A + INIT_A;
	state[1] = B + INIT_B;
	state[2] = C + INIT_C;
	state[3] = D + INIT_D;
	state[4] = E + INIT_E;

}

inline void hmac_sha1(__private uint * output,
    __private uint * ipad_state,
    __private uint * opad_state,
    __global const uchar * salt, int saltlen, uchar add)
{
	int i;
	uint temp, W[16];
	uint A, B, C, D, E;
	uchar buf[64];
	uint *src = (uint *) buf;
	i = 64 / 4;
	while (i--)
		*src++ = 0;
	//_memcpy(buf, salt, saltlen);
	for (i = 0; i < saltlen; i++)
		buf[i] = salt[i];

	buf[saltlen + 4] = 0x80;
	buf[saltlen + 3] = add;
	PUT_WORD_32_BE((64 + saltlen + 4) << 3, buf, 60);

	A = ipad_state[0];
	B = ipad_state[1];
	C = ipad_state[2];
	D = ipad_state[3];
	E = ipad_state[4];

	for (i = 0; i < 16; i++)
		GET_WORD_32_BE(W[i], buf, i * 4);

	SHA1(A, B, C, D, E, W);

	A += ipad_state[0];
	B += ipad_state[1];
	C += ipad_state[2];
	D += ipad_state[3];
	E += ipad_state[4];

	PUT_WORD_32_BE(A, buf, 0);
	PUT_WORD_32_BE(B, buf, 4);
	PUT_WORD_32_BE(C, buf, 8);
	PUT_WORD_32_BE(D, buf, 12);
	PUT_WORD_32_BE(E, buf, 16);
	PUT_WORD_32_BE(0, buf, 20);
	PUT_WORD_32_BE(0, buf, 24);


	buf[20] = 0x80;
	PUT_WORD_32_BE(0x2A0, buf, 60);

	A = opad_state[0];
	B = opad_state[1];
	C = opad_state[2];
	D = opad_state[3];
	E = opad_state[4];

	for (i = 0; i < 16; i++)
		GET_WORD_32_BE(W[i], buf, i * 4);

	SHA1short(A, B, C, D, E, W);

	A += opad_state[0];
	B += opad_state[1];
	C += opad_state[2];
	D += opad_state[3];
	E += opad_state[4];

	output[0] = A;
	output[1] = B;
	output[2] = C;
	output[3] = D;
	output[4] = E;
}



inline void big_hmac_sha1(__private uint * input, uint inputlen,
    __private uint * ipad_state,
    __private uint * opad_state, __private uint * tmp_out, int iterations)
{
	int i, lo;
	uint temp, W[16];
	uint A, B, C, D, E;

	for (i = 0; i < 5; i++)
		W[i] = input[i];

	for (lo = 1; lo < iterations; lo++) {

		A = ipad_state[0];
		B = ipad_state[1];
		C = ipad_state[2];
		D = ipad_state[3];
		E = ipad_state[4];

		W[5] = 0x80000000;
		W[15] = 0x2A0;

		SHA1short(A, B, C, D, E, W);

		A += ipad_state[0];
		B += ipad_state[1];
		C += ipad_state[2];
		D += ipad_state[3];
		E += ipad_state[4];

		W[0] = A;
		W[1] = B;
		W[2] = C;
		W[3] = D;
		W[4] = E;
		W[5] = 0x80000000;
		W[15] = 0x2A0;

		A = opad_state[0];
		B = opad_state[1];
		C = opad_state[2];
		D = opad_state[3];
		E = opad_state[4];

		SHA1short(A, B, C, D, E, W);

		A += opad_state[0];
		B += opad_state[1];
		C += opad_state[2];
		D += opad_state[3];
		E += opad_state[4];

		W[0] = A;
		W[1] = B;
		W[2] = C;
		W[3] = D;
		W[4] = E;

		tmp_out[0] ^= A;
		tmp_out[1] ^= B;
		tmp_out[2] ^= C;
		tmp_out[3] ^= D;
		tmp_out[4] ^= E;
	}
}

inline void pbkdf2(__global const uchar * pass, uint passlen,
                   __global const uchar * salt, uint saltlen, uint iterations,
                   __global uint * out, uint outlen)
{
	uint ipad_state[5];
	uint opad_state[5];
	uint r, t = 0;

	preproc(pass, passlen, ipad_state, 0x36363636);
	preproc(pass, passlen, opad_state, 0x5c5c5c5c);

	for (r = 1; r <= (outlen + 19) / 20; r++) {
		uint tmp_out[5];
		int i;

		hmac_sha1(tmp_out, ipad_state, opad_state, salt, saltlen, r);

		big_hmac_sha1(tmp_out, SHA1_DIGEST_LENGTH,
		              ipad_state, opad_state,
		              tmp_out, iterations);

		for (i = 0; i < 20 && t < (outlen + 3) / 4 * 4; i++, t++)
			PUTCHAR_BE_G(out, t, ((uchar*)tmp_out)[i]);
	}
}

__kernel void derive_key(__global const pbkdf2_password *inbuffer,
    __global pbkdf2_hash *outbuffer, __global const pbkdf2_salt *salt)
{
	uint idx = get_global_id(0);

	pbkdf2(inbuffer[idx].v, inbuffer[idx].length,
	       salt->salt, salt->length,
	       salt->iterations, outbuffer[idx].v, salt->outlen);
}
