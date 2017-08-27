
      PROGRAM CCPCLL
C
C Define the error file, the Fortran unit number, the workstation type,
C and the workstation ID to be used in calls to GKS routines.
C
C     PARAMETER (IERRF=6, LUNIT=2, IWTYPE=1,  IWKID=1)   ! NCGM
C     PARAMETER (IERRF=6, LUNIT=2, IWTYPE=8,  IWKID=1)   ! X Windows
C     PARAMETER (IERRF=6, LUNIT=2, IWTYPE=11, IWKID=1)   ! PDF
C     PARAMETER (IERRF=6, LUNIT=2, IWTYPE=20, IWKID=1)   ! PostScript
C
      PARAMETER (IERRF=6, LUNIT=2, IWTYPE=1,  IWKID=1)

      PARAMETER (K=40,N=40,LRWK=1000,LIWK=1000)
      REAL Z(K,N), RWRK(LRWK)
      INTEGER I, M, IWRK(LIWK)
      
      CALL GETDAT (Z, K, M, N) 
C
C  Open GKS, open and activate a workstation.
C
      CALL GOPKS (IERRF, ISZDM)
      CALL GOPWK (IWKID, LUNIT, IWTYPE)
      CALL GACWK (IWKID)
C
C Call conpack normally
C
      CALL CPRECT(Z,K,M,N,RWRK,LRWK,IWRK,LIWK)
C  
      CALL CPPKCL(Z, RWRK, IWRK)
C
C Set a different line width for each contour line
C
      CALL CPGETI('NCL - NUMBER OF CONTOUR LEVELS',NCON)
      DO 11, I=1,NCON
         CALL CPSETI('PAI - PARAMETER ARRAY INDEX',I)
         CALL CPSETR('CLL - CONTOUR LINE LINE WIDTH',REAL(I)/3.)
 11   CONTINUE
      
      CALL CPBACK(Z, RWRK, IWRK)
      CALL CPCLDR(Z,RWRK,IWRK)
C
C Close frame and close GKS
C
      CALL FRAME
C
C Deactivate and close workstation, close GKS.
C
      CALL GDAWK (IWKID)
      CALL GCLWK (IWKID)
      CALL GCLKS
      
      STOP
      END

      SUBROUTINE GETDAT (Z, K, M, N)
      INTEGER I,J,K,M,N
      REAL Z(K,N)
      
      M=K
      DO 10, I=1,M
         DO 20, J=1,N
            Z(I,J)= 10.E-5*(-16.*REAL(I**2*J) +
     1           34*REAL(I*J**2) - REAL(6*I) + 93.)
 20      CONTINUE
 10   CONTINUE
      
      RETURN
      END
