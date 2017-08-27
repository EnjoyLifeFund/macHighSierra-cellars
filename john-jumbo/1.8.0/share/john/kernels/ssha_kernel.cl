/*
   This code was largely inspired by
   pyrit opencl kernel sha1 routines, royger's sha1 sample,
   and md5_opencl_kernel.cl inside jtr.
   Copyright 2011 by Samuele Giovanni Tonon
   samu at linuxasylum dot net
   and Copyright (c) 2012 magnum
   This program comes with ABSOLUTELY NO WARRANTY; express or
   implied .
   This is free software, and you are welcome to redistribute it
   under certain conditions; as expressed here
   http://www.gnu.org/licenses/gpl-2.0.html
*/

#ifdef cl_nv_pragma_unroll
#define NVIDIA
#endif

#ifdef NVIDIA
inline uint SWAP32(uint x)
{
	x = rotate(x, 16U);
	return ((x & 0x00FF00FF) << 8) + ((x >> 8) & 0x00FF00FF);
}
#else
#define SWAP32(a)	(as_uint(as_uchar4(a).wzyx))
#endif

#define K0  0x5A827999
#define K1  0x6ED9EBA1
#define K2  0x8F1BBCDC
#define K3  0xCA62C1D6

#define H1 0x67452301
#define H2 0xEFCDAB89
#define H3 0x98BADCFE
#define H4 0x10325476
#define H5 0xC3D2E1F0

#ifndef uint32_t
#define uint32_t unsigned int
#endif



__kernel void sha1_crypt_kernel(__global uchar *salt, __global char *plain_key,  __global uint *digest){
    int t, gid, msg_pad;
    int stop, mmod;
    uint i, ulen;
    uint W[16], temp, A,B,C,D,E;
    uint num_keys = get_global_size(0);

    gid = get_global_id(0);
    msg_pad = gid * PLAINTEXT_LENGTH;

    A = H1;
    B = H2;
    C = H3;
    D = H4;
    E = H5;

#pragma unroll
    for (t = 3; t < 15; t++){
	W[t] = 0x00000000;
    }
    for(i = 0; i < PLAINTEXT_LENGTH && ((uchar) plain_key[msg_pad + i]) != 0x0 ; i++){
    }

    stop = i / 4 ;
    for (t = 0 ; t < stop ; t++){
        W[t] = ((uchar)  plain_key[msg_pad + t * 4]) << 24;
        W[t] |= ((uchar) plain_key[msg_pad + t * 4 + 1]) << 16;
        W[t] |= ((uchar) plain_key[msg_pad + t * 4 + 2]) << 8;
        W[t] |= (uchar)  plain_key[msg_pad + t * 4 + 3];
    }
    mmod = i % 4;
    if ( mmod == 3){
        W[t] = ((uchar)  plain_key[msg_pad + t * 4]) << 24;
        W[t] |= ((uchar) plain_key[msg_pad + t * 4 + 1]) << 16;
        W[t] |= ((uchar) plain_key[msg_pad + t * 4 + 2]) << 8;
        W[t] |= (uchar)  salt[0];
	W[t+2] = ((uchar) salt[5]) << 24;
        W[t+2] |=  ((uchar)  salt[6]) << 16;
        W[t+2] |=  ((uchar)  salt[7]) << 8;
        W[t+2] |=  ((uchar) 0x80) ;
	mmod = 4 - mmod;
    } else if (mmod == 2) {
        W[t] = ((uchar)  plain_key[msg_pad + t * 4]) << 24;
        W[t] |= ((uchar) plain_key[msg_pad + t * 4 + 1]) << 16;
        W[t] |= ((uchar)  salt[0]) << 8;
        W[t] |= (uchar)  salt[1];
        W[t+2] =  ((uchar)  salt[6]) << 24;
        W[t+2] |=  ((uchar)  salt[7]) << 16;
        W[t+2] |=  0x8000 ;
	mmod = 4 - mmod;
    } else if (mmod == 1) {
        W[t] = ((uchar)  plain_key[msg_pad + t * 4]) << 24;
        W[t] |= ((uchar)  salt[0]) << 16;
        W[t] |= ((uchar)  salt[1]) << 8;
        W[t] |= (uchar)  salt[2];
        W[t+2] =  ((uchar)  salt[7]) << 24;
        W[t+2] |=  0x800000 ;
	mmod = 4 - mmod;
    } else /*if (mmod == 0)*/ {
        W[t+2] =  0x80000000 ;
	t = t-1;
    }
    t = t+1;
    for(; t < (stop + 2) && mmod < 8 ; t++ ){
        W[t] = ((uchar)  salt[mmod]) << 24;
        W[t] |= ((uchar)  salt[mmod + 1]) << 16;
        W[t] |= ((uchar)  salt[mmod + 2]) << 8;
        W[t] |= ((uchar)  salt[mmod + 3]);
        mmod = mmod + 4;
    }

    i = i+8;
    ulen = (i * 8) & 0xFFFFFFFF;
    W[15] =  ulen ;

#undef R
#define R(t)                                              \
(                                                         \
    temp = W[(t -  3) & 0x0F] ^ W[(t - 8) & 0x0F] ^       \
           W[(t - 14) & 0x0F] ^ W[ t      & 0x0F],        \
    ( W[t & 0x0F] = rotate((int)temp,1) )                 \
)

#undef P
#define P(a,b,c,d,e,x)                                    \
{                                                         \
    e += rotate((int)a,5) + F(b,c,d) + K + x; b = rotate((int)b,30);\
}

#ifdef NVIDIA
#define F(x,y,z)	(z ^ (x & (y ^ z)))
#else
#define F(x,y,z)	bitselect(z, y, x)
#endif
#define K 0x5A827999

  P( A, B, C, D, E, W[0]  );
  P( E, A, B, C, D, W[1]  );
  P( D, E, A, B, C, W[2]  );
  P( C, D, E, A, B, W[3]  );
  P( B, C, D, E, A, W[4]  );
  P( A, B, C, D, E, W[5]  );
  P( E, A, B, C, D, W[6]  );
  P( D, E, A, B, C, W[7]  );
  P( C, D, E, A, B, W[8]  );
  P( B, C, D, E, A, W[9]  );
  P( A, B, C, D, E, W[10] );
  P( E, A, B, C, D, W[11] );
  P( D, E, A, B, C, W[12] );
  P( C, D, E, A, B, W[13] );
  P( B, C, D, E, A, W[14] );
  P( A, B, C, D, E, W[15] );
  P( E, A, B, C, D, R(16) );
  P( D, E, A, B, C, R(17) );
  P( C, D, E, A, B, R(18) );
  P( B, C, D, E, A, R(19) );

#undef K
#undef F

#define F(x,y,z) (x ^ y ^ z)
#define K 0x6ED9EBA1

  P( A, B, C, D, E, R(20) );
  P( E, A, B, C, D, R(21) );
  P( D, E, A, B, C, R(22) );
  P( C, D, E, A, B, R(23) );
  P( B, C, D, E, A, R(24) );
  P( A, B, C, D, E, R(25) );
  P( E, A, B, C, D, R(26) );
  P( D, E, A, B, C, R(27) );
  P( C, D, E, A, B, R(28) );
  P( B, C, D, E, A, R(29) );
  P( A, B, C, D, E, R(30) );
  P( E, A, B, C, D, R(31) );
  P( D, E, A, B, C, R(32) );
  P( C, D, E, A, B, R(33) );
  P( B, C, D, E, A, R(34) );
  P( A, B, C, D, E, R(35) );
  P( E, A, B, C, D, R(36) );
  P( D, E, A, B, C, R(37) );
  P( C, D, E, A, B, R(38) );
  P( B, C, D, E, A, R(39) );

#undef K
#undef F

#ifdef NVIDIA
#define F(x,y,z)	((x & y) | (z & (x | y)))
#else
#define F(x,y,z)	(bitselect(x, y, z) ^ bitselect(x, 0U, y))
#endif
#define K 0x8F1BBCDC

  P( A, B, C, D, E, R(40) );
  P( E, A, B, C, D, R(41) );
  P( D, E, A, B, C, R(42) );
  P( C, D, E, A, B, R(43) );
  P( B, C, D, E, A, R(44) );
  P( A, B, C, D, E, R(45) );
  P( E, A, B, C, D, R(46) );
  P( D, E, A, B, C, R(47) );
  P( C, D, E, A, B, R(48) );
  P( B, C, D, E, A, R(49) );
  P( A, B, C, D, E, R(50) );
  P( E, A, B, C, D, R(51) );
  P( D, E, A, B, C, R(52) );
  P( C, D, E, A, B, R(53) );
  P( B, C, D, E, A, R(54) );
  P( A, B, C, D, E, R(55) );
  P( E, A, B, C, D, R(56) );
  P( D, E, A, B, C, R(57) );
  P( C, D, E, A, B, R(58) );
  P( B, C, D, E, A, R(59) );

#undef K
#undef F

#define F(x,y,z) (x ^ y ^ z)
#define K 0xCA62C1D6

  P( A, B, C, D, E, R(60) );
  P( E, A, B, C, D, R(61) );
  P( D, E, A, B, C, R(62) );
  P( C, D, E, A, B, R(63) );
  P( B, C, D, E, A, R(64) );
  P( A, B, C, D, E, R(65) );
  P( E, A, B, C, D, R(66) );
  P( D, E, A, B, C, R(67) );
  P( C, D, E, A, B, R(68) );
  P( B, C, D, E, A, R(69) );
  P( A, B, C, D, E, R(70) );
  P( E, A, B, C, D, R(71) );
  P( D, E, A, B, C, R(72) );
  P( C, D, E, A, B, R(73) );
  P( B, C, D, E, A, R(74) );
  P( A, B, C, D, E, R(75) );
  P( E, A, B, C, D, R(76) );
  P( D, E, A, B, C, R(77) );
  P( C, D, E, A, B, R(78) );
  P( B, C, D, E, A, R(79) );

#undef K
#undef F
  digest[gid] = SWAP32(A + H1);
  digest[gid+1*num_keys] = SWAP32(B + H2);
  digest[gid+2*num_keys] = SWAP32(C + H3);
  digest[gid+3*num_keys] = SWAP32(D + H4);
  digest[gid+4*num_keys] = SWAP32(E + H5);
}
