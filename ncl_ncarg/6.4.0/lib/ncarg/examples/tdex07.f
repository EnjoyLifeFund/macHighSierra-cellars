
      PROGRAM TDEX07
C
C Define the error file, the Fortran unit number, the workstation type,
C and the workstation ID to be used in calls to GKS routines.
C
C       PARAMETER (IERRF=6, LUNIT=2, IWTYPE=1,  IWKID=1)   ! NCGM
C       PARAMETER (IERRF=6, LUNIT=2, IWTYPE=8,  IWKID=1)   ! X Windows
C       PARAMETER (IERRF=6, LUNIT=2, IWTYPE=11, IWKID=1)   ! PDF
C       PARAMETER (IERRF=6, LUNIT=2, IWTYPE=20, IWKID=1)   ! PostScript
C
        PARAMETER (IERRF=6, LUNIT=2, IWTYPE=1,  IWKID=1)
C
C Create parameters specifying the maximum sizes of the arrays defining
C data, the arrays required for dealing with the list of triangles, and
C the arrays of points defining a curve.
C
        PARAMETER (IMAX=41,JMAX=41,KMAX=41,MTRI=200000,NCRA=1001)
C
C Declare local dimensioned variables to hold data defining a simple
C surface and an isosurface.
C
        DIMENSION U(IMAX),V(JMAX),W(KMAX),S(IMAX,JMAX),F(IMAX,JMAX,KMAX)
C
C Declare a local array to hold the triangle list and a couple of
C temporary variables to be used in sorting the list.
C
        DIMENSION RTRI(10,MTRI),RTWK(MTRI,2),ITWK(MTRI)
C
C Declare variables to hold labels.
C
        CHARACTER*64 UNLB,VNLB,WNLB,UILB,VILB,WILB
C
C Declare variables to hold the coordinates of points defining a curve.
C
        DIMENSION UCRA(NCRA),VCRA(NCRA),WCRA(NCRA)
C
C Set the desired minimum and maximum values of U, V, and W.
C
        DATA UMIN,VMIN,WMIN,UMAX,VMAX,WMAX / -1.,-1.,-1.,1.,1.,1. /
C
C Set the desired values of the dimensions of the data arrays.  Note
C that IDIM must not exceed IMAX, that JDIM must not exceed JMAX, and
C that KDIM must not exceed KMAX.
C
        DATA IDIM,JDIM,KDIM / 31,31,31 /
C
C Set the desired values of parameters determining the eye position.
C ANG1 is a bearing angle, ANG2 is an elevation angle, and RMUL is a
C multiplier of the length of the diagonal of the data box, specifying
C the distance from the center of the box to the eye.
C
        DATA ANG1,ANG2,RMUL / -35.,25.,2.9 /
C
C ISTE is a flag that says whether to do a simple image (ISTE=0),
C a one-frame stereo image (ISTE=-1), or a two-frame stereo image
C (ISTE=+1).
C
        DATA ISTE / -1 /
C
C ASTE is the desired angle (in degrees) between the lines of sight for
C a pair of stereo views.
C
        DATA ASTE / 4. /
C
C WOSW is the width of the stereo windows to be used in one-frame stereo
C images; the width is stated as a fraction of the width of the plotter
C frame.  (The windows are centered vertically; horizontally, they are
C placed as far apart as possible in the plotter frame.)  The value used
C must be positive and non-zero; it may be slightly greater than .5, if
C it is desired that the stereo windows should overlap slightly.
C
        DATA WOSW / .5 /
C
C Set the desired value of the flag that says whether the basic color
C scheme will be white on black (IBOW=0) or black on white (IBOW=1).
C
        DATA IBOW / 1 /
C
C Set the desired value of the flag that says whether shading of the
C surfaces will be done using gray scales (ICLR=0) or colors (ICLR=1).
C
        DATA ICLR / 1 /
C
C Set the desired values of the shading parameters.  Values of SHDE
C near 0 give brighter colors and values near 1 give pastel shades.
C Values of SHDR near 0 give a narrow range of shades and values near
C 1 give a wide range of shades.
C
        DATA SHDE,SHDR / .1 , .8 /
C
C Set the desired values of the rendering-style indices for the
C isosurface and the simple surface, respectively.
C
        DATA IIRS,ISRS / 2,3 /
C
C Define the conversion constant from degrees to radians.
C
        DATA DTOR / .017453292519943 /
C
C Define labels for the edges of the box.
C
        DATA UNLB / ' -1 -.8 -.6 -.4 -.2 0 .2 .4 .6 .8 1 ' /
        DATA VNLB / ' -1 -.8 -.6 -.4 -.2 0 .2 .4 .6 .8 1 ' /
        DATA WNLB / ' -1 -.8 -.6 -.4 -.2 0 .2 .4 .6 .8 1 ' /
C
        DATA UILB / 'U Coordinate Values' /
        DATA VILB / 'V Coordinate Values' /
        DATA WILB / 'W Coordinate Values' /
C
C Open GKS.
C
        CALL GOPKS (IERRF, ISZDM)
        CALL GOPWK (IWKID, LUNIT, IWTYPE)
        CALL GACWK (IWKID)
C
C Turn clipping off.
C
        CALL GSCLIP (0)
C
C Double the line width.
C
        CALL GSLWSC (2.)
C
C Define colors to use.
C
        CALL TDCLRS (1,IBOW,SHDE,SHDR,11,42,5)
C
C Fill data arrays defining a simple surface and an isosurface.  The
C simple surface is defined by the equation "w=s(u,v)"; the function
C "s" is approximated by the contents of the array S: S(I,J) is the
C value of s(U(I),V(J)), where I goes from 1 to IDIM and J from 1 to
C JDIM.  The isosurface is defined by the equation f(u,v,w)=1.; the
C function f is approximated by the contents of the array F: F(I,J,K)
C is the value of f(U(I),V(J),W(K)), where I goes from 1 to IDIM, J
C from 1 to JDIM, and K from 1 to KDIM.
C
        DO 102 I=1,IDIM
          U(I)=UMIN+(REAL(I-1)/REAL(IDIM-1))*(UMAX-UMIN)
  102   CONTINUE
C
        DO 103 J=1,JDIM
          V(J)=VMIN+(REAL(J-1)/REAL(JDIM-1))*(VMAX-VMIN)
  103   CONTINUE
C
        DO 104 K=1,KDIM
          W(K)=WMIN+(REAL(K-1)/REAL(KDIM-1))*(WMAX-WMIN)
  104   CONTINUE
C
        DO 107 I=1,IDIM
          DO 106 J=1,JDIM
            S(I,J)=2.*EXP(-4.*(U(I)**2+V(J)**2))-1.
            DO 105 K=1,KDIM
              F(I,J,K)=1.25*U(I)**2+3.0*V(J)**2+5.*W(K)**2
  105       CONTINUE
  106     CONTINUE
  107   CONTINUE
C
C Select font number 25, turn on the outlining of filled fonts, set the
C line width to 1, and turn off the setting of the outline color.
C
        CALL PCSETI ('FN - FONT NUMBER',25)
        CALL PCSETI ('OF - OUTLINE FLAG',1)
        CALL PCSETR ('OL - OUTLINE LINE WIDTH',1.)
        CALL PCSETR ('OC - OUTLINE LINE COLOR',-1.)
C
C Make TDPACK characters a bit bigger.
C
        CALL TDSETR ('CS1',1.25)
C
C Define TDPACK rendering styles 1 through 7, using black-and-white
C shading or colored shading, whichever is selected.  The indices
C 1-7 can then be used as arguments in calls to TDITRI, TDSTRI, and
C TDMTRI.
C
        IF (ICLR.EQ.0) THEN
C
C Rendering styles 1-7 are all gray on both sides:
C
          CALL TDSTRS (1,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (2,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (3,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (4,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (5,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (6,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (7,43,74, 43, 74,-1,-1,1,0.,0.,0.)
C
        ELSE
C
C Rendering styles 1-7 are all gray on one side.  The other side is
C 1) gray, 2) red, 3) green, 4) blue, 5) cyan, 6) magenta, 7) yellow.
C
          CALL TDSTRS (1,43,74, 43, 74,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (2,43,74, 75,106,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (3,43,74,107,138,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (4,43,74,139,170,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (5,43,74,171,202,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (6,43,74,203,234,-1,-1,1,0.,0.,0.)
          CALL TDSTRS (7,43,74,235,266,-1,-1,1,0.,0.,0.)
C
        END IF
C
C Initialize the count of triangles in the triangle list.
C
        NTRI=0
C
C Add to the triangle list triangles representing a simple surface.
C
        CALL TDSTRI (U,IDIM,V,JDIM,S,IMAX,RTRI,MTRI,NTRI,ISRS)
C
        IF (NTRI.EQ.MTRI) THEN
          PRINT * , 'TRIANGLE LIST OVERFLOW IN TDSTRI'
          STOP
        END IF
C
C Add to the triangle list triangles representing an isosurface.
C
        CALL TDITRI (U,IDIM,V,JDIM,W,KDIM,F,IMAX,JMAX,1.,
     +                               RTRI,MTRI,NTRI,IIRS)
C
        IF (NTRI.EQ.MTRI) THEN
          PRINT * , 'TRIANGLE LIST OVERFLOW IN TDITRI'
          STOP
        END IF
C
C Add to the triangle list triangles representing a series of marks
C along a curve.
C
        DO 108 ICRA=1,NCRA
          TEMP=REAL(ICRA-1)/REAL(NCRA-1)
          RADI=(MIN(UMAX-UMIN,VMAX-VMIN)/2.)*(.75+(TEMP-.5)**2)
          ANGD=720.*TEMP
          UCRA(ICRA)=(UMIN+UMAX)/2.+RADI*COS(.017453292519943*ANGD)
          VCRA(ICRA)=(VMIN+VMAX)/2.+RADI*SIN(.017453292519943*ANGD)
          WCRA(ICRA)=WMIN+TEMP*(WMAX-WMIN)
  108   CONTINUE
C
        RMRK=MIN(UMAX-UMIN,VMAX-VMIN,WMAX-WMIN)/50.
C
        CALL TDTTRI (UCRA,VCRA,WCRA,NCRA,5,RMRK,RMRK/8.,RTRI,MTRI,NTRI,
     +                                 4,UMIN,VMIN,WMIN,UMAX,VMAX,WMAX)
C
C Find the midpoint of the data box (to be used as the point looked at).
C
        UMID=.5*(UMIN+UMAX)
        VMID=.5*(VMIN+VMAX)
        WMID=.5*(WMIN+WMAX)
C
C Determine the distance (R) from which the data box will be viewed and,
C given that, the eye position.
C
        R=RMUL*SQRT((UMAX-UMIN)**2+(VMAX-VMIN)**2+(WMAX-WMIN)**2)
C
        UEYE=UMID+R*COS(DTOR*ANG1)*COS(DTOR*ANG2)
        VEYE=VMID+R*SIN(DTOR*ANG1)*COS(DTOR*ANG2)
        WEYE=WMID+R*SIN(DTOR*ANG2)
C
C Initialize the stereo offset argument to do either a single view or
C a left-eye view (whichever is selected by the value of ISTE).
C
        IF (ISTE.EQ.0) THEN
          OTEP=0.
        ELSE
          OTEP=-R*TAN(DTOR*ASTE/2.)
        END IF
C
C Initialize TDPACK.
C
  109   CALL TDINIT (UEYE,VEYE,WEYE,UMID,VMID,WMID,
     +                              UMID,VMID,WMID+R,OTEP)
C
C If stereo views are being done, do the requested thing, either by
C redoing the SET call to put them side by side on the same frame,
C or by calling FRAME to put them on separate frames.
C
        IF (OTEP.NE.0.) THEN
          IF (ISTE.LT.0) THEN
            CALL GETSET (XVPL,XVPR,YVPB,YVPT,XWDL,XWDR,YWDB,YWDT,LNLG)
            IF (OTEP.LT.0.) THEN
              CALL SET  (1.-WOSW,1.,.5-.5*WOSW,.5+.5*WOSW,
     +                           XWDL,XWDR,YWDB,YWDT,LNLG)
            ELSE
              CALL SET  (  0., WOSW,.5-.5*WOSW,.5+.5*WOSW,
     +                           XWDL,XWDR,YWDB,YWDT,LNLG)
            END IF
          ELSE
            IF (OTEP.GT.0.) CALL FRAME
          END IF
        END IF
C
C Order the triangles in the triangle list.
C
        CALL TDOTRI (RTRI,MTRI,NTRI,RTWK,ITWK,1)
C
        IF (NTRI.EQ.MTRI) THEN
          PRINT * , 'TRIANGLE LIST OVERFLOW IN TDOTRI'
          STOP
        END IF
C
C Draw labels for the axes.
C
        CALL TDLBLS (UMIN,VMIN,WMIN,UMAX,VMAX,WMAX,
     +               UNLB,VNLB,WNLB,UILB,VILB,WILB,1)
C
C Draw the sides of the box that could be hidden.
C
        CALL TDGRDS (UMIN,VMIN,WMIN,UMAX,VMAX,WMAX,
     +               .1*(UMAX-UMIN),.1*(VMAX-VMIN),.1*(WMAX-WMIN),
     +                                                       12,1)
C
C Draw the triangles in the triangle list.
C
        CALL TDDTRI (RTRI,MTRI,NTRI,ITWK)
C
C Draw the sides of the box that could not be hidden.
C
        CALL TDGRDS (UMIN,VMIN,WMIN,UMAX,VMAX,WMAX,
     +               .1*(UMAX-UMIN),.1*(VMAX-VMIN),.1*(WMAX-WMIN),
     +                                                       12,0)
C
C If a left-eye view has just been done, loop back for a right-eye view.
C
        IF (OTEP.LT.0.) THEN
          OTEP=-OTEP
          GO TO 109
        END IF
C
C Advance the frame.
C
        CALL FRAME
C
C Close GKS.
C
        CALL GDAWK (IWKID)
        CALL GCLWK (IWKID)
        CALL GCLKS
C
C Done.
C
        STOP
C
      END
