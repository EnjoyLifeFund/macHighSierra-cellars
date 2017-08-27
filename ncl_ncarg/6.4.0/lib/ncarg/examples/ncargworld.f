      PROGRAM EXAMPL
C
C Define error file, Fortran unit number, and workstation type,
C and workstation ID.
C
        PARAMETER (IERRF=6, LUNIT=2, IWTYPE=1, IWKID=1)
C
C This program creates a colorful picture to serve as a test for the
C translator.  It is based on EZMAP example 10 and parts of the new
C PLOTCHAR test program.
C
C Assume you have a FORTRAN function that, given the position of a
C point on the surface of the earth, returns the real value of some
C physical quantity there.  You would like to split the full range of
C values of the quantity into intervals, associate a different color
C with each interval, and then draw a colored map of the resulting
C globe.  One way to do this is to use the contouring package CONPACK;
C another way to do it is given below.
C
C This program constructs a rectangular cell array covering the part
C of the plotter frame occupied by a selected map of the globe.  Each
C element of the cell array occupies a small rectangular portion of
C the plotter frame.  The EZMAP routine MAPTRI, which does the inverse
C transformations, is used to find the values of latitude and longitude
C associated with each cell; these can be used to obtain the value of
C the physical quantity and therefore the color index associated with
C the cell.  When the cell array is complete, it is drawn by a call to
C the GKS routine GCA.
C
C Define an integer array in which to build the cell array.
C
        DIMENSION ICRA(1000,1000)
C
C Declare some required variables.
C
        CHARACTER*2 PROJ,JLTS
        DIMENSION PLM1(2),PLM2(2),PLM3(2),PLM4(2)
C
C NCLS specifies the number of cells along each edge of the cell array.
C Use a positive value less than or equal to 1000.
C
        DATA NCLS / 300 /
C
C NCLR specifies the number of different colors to be used.
C
        DATA NCLR / 64 /
C
C PROJ is the desired projection type.  Use one of 'LC', 'ST', 'OR',
C 'LE', 'GN', 'AE', 'SV', 'CE', 'ME', or 'MO'.
C
        DATA PROJ / 'OR' /
C
C PLAT and PLON are the desired latitude and longitude of the center of
C the projection, in degrees.
C
	DATA PLAT,PLON / 20. , -105. /
C
C ROTA is the desired final rotation of the map, in degrees.
C
	DATA ROTA / 15. /
C
C SALT, ALFA, and BETA are the desired values of the parameters 'SA',
C 'S1', and 'S2', which are only used with a satellite-view projection.
C SALT is the distance of the satellite from the center of the earth,
C in units of earth radii.  ALFA is the angle, in degrees, between the
C line of sight and the line to the center of the earth.  BETA is used
C only when ALFA is non-zero; it is the angle, in degrees, measured
C counterclockwise, from the plane passing through the satellite, the
C center of the earth, and the point which is due east on the horizon
C to the plane in which the line of sight and the line to the center
C of the earth both lie.
C
        DATA SALT,ALFA,BETA / 1.25 , 15. , 90. /
C
C JLTS, PLM1, PLM2, PLM3, and PLM4 are the required arguments of the
C EZMAP routine MAPSET, which determines the boundaries of the map.
C
        DATA JLTS / 'MA' /
        DATA PLM1(1),PLM2(1),PLM3(1),PLM4(1) / 0. , 0. , 0. , 0. /
        DATA PLM1(2),PLM2(2),PLM3(2),PLM4(2) / 0. , 0. , 0. , 0. /
C
C IGRD is the spacing, in degrees, of the EZMAP grid of latitudes and
C longitudes.  IGRD = 0 turns the grid off.
C
	DATA IGRD / 0 /
C
C Define the constant used to convert from degrees to radians.
C
        DATA DTOR / .017453292519943 /
C
C Open GKS.
C
        CALL GOPKS (IERRF, ISZDM)
        CALL GOPWK (IWKID, LUNIT, IWTYPE)
        CALL GACWK (IWKID)
C
C Define the color indices required.  0 and 1 are used for black and
C white (as is customary); the next NCLR values are distributed between
C pure blue (color 2) and pure red (color NCLR+1).  The colors NCLR+2,
C NCLR+3, and NCLR+4 are used for character shadows, outlines, and
C principal bodies, respectively.
C
        CALL GSCR (1,0,0.,0.,0.)
        CALL GSCR (1,1,1.,1.,1.)
C
        DO 101 ICLR=1,NCLR
          CALL GSCR (1,1+ICLR,REAL(ICLR-1)/REAL(NCLR-1),0.,
     +                        REAL(NCLR-ICLR)/REAL(NCLR-1))
  101   CONTINUE
C
	CALL GSCR (1,NCLR+2,0.,0.,0.)
	CALL GSCR (1,NCLR+3,1.,1.,0.)
	CALL GSCR (1,NCLR+4,0.,1.,1.)
C
C Set the EZMAP projection parameters.
C
        CALL MAPROJ (PROJ,PLAT,PLON,ROTA)
        IF (PROJ.EQ.'SV') THEN
          CALL MAPSTR ('SA',SALT)
          CALL MAPSTR ('S1',ALFA)
          CALL MAPSTR ('S2',BETA)
        END IF
C
C Set the limits of the map.
C
        CALL MAPSET (JLTS,PLM1,PLM2,PLM3,PLM4)
C
C Set the grid spacing.
C
        CALL MAPSTI ('GR - GRID SPACING',IGRD)
C
C Turn off the drawing of labels.
C
	CALL MAPSTI ('LA - LABELLING',0)
C
C Turn off the drawing of the perimeter.
C
	CALL MAPSTI ('PE - PERIMETER',0)
C
C Initialize EZMAP, so that calls to MAPTRI will work properly.
C
        CALL MAPINT
C
C Fill the cell array.  The data generator is rigged to create
C values between 0 and 1, so as to make it easy to interpolate to
C get a color index to be used.  Obviously, the statement setting
C DVAL can be replaced by one that yields a value of some real data
C field of interest (normalized to the range from 0 to 1).
C
        DO 103 I=1,NCLS
          X=CFUX(.05+.90*(REAL(I-1)+.5)/REAL(NCLS))
          DO 102 J=1,NCLS
            Y=CFUY(.05+.90*(REAL(J-1)+.5)/REAL(NCLS))
            CALL MAPTRI (X,Y,RLAT,RLON)
            IF (RLAT.NE.1.E12) THEN
	      DVAL=.25*(1.+COS(DTOR*15.*RLAT))+
     +             .25*(1.+SIN(DTOR*15.*RLON))*COS(DTOR*RLAT)
              ICRA(I,J)=MAX(2,MIN(NCLR+1,2+INT(DVAL*REAL(NCLR))))
            ELSE
              ICRA(I,J)=0
            END IF
  102     CONTINUE
  103   CONTINUE
C
C Draw the cell array.
C
        CALL GCA (CFUX(.05),CFUY(.05),CFUX(.95),CFUY(.95),1000,1000,
     +                                           1,1,NCLS,NCLS,ICRA)
C
C Quadruple the line width and put a map on top of the cell array.
C
	CALL PLOTIF (0.,0.,2)
	CALL GSLWSC (4.)
        CALL MAPDRW
C
C Using a doubled line width, put a bunch of logos on the globe.
C
	CALL PLOTIF (0.,0.,2)
	CALL GSLWSC (2.)
	CALL PCSETI ('MA - MAPPING FLAG',1)
	CALL PCSETR ('OR - OUT-OF-RANGE FLAG',1.E12)
	CALL PCSETI ('SF - SHADOW FLAG',1)
	CALL PCSETR ('SX - SHADOW OFFSET IN X',-.09)
	CALL PCSETR ('SY - SHADOW OFFSET IN Y',-.06)
	CALL PCSETI ('OF - OUTLINE FLAG',1)
	CALL PCSETI ('SC - SHADOW COLOR   ',NCLR+2)
	CALL PCSETI ('OC - OUTLINE COLOR  ',NCLR+3)
	CALL PCSETI ('CC - CHARACTER COLOR',NCLR+4)
	CALL PLCHHQ (-225.,-60.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-225.,-30.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-225.,  0.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-225.,+30.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-225.,+60.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-105.,-60.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-105.,-30.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-105.,  0.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-105.,+30.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ (-105.,+60.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ ( +15.,-60.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ ( +15.,-30.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ ( +15.,  0.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ ( +15.,+30.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
	CALL PLCHHQ ( +15.,+60.,':F25Y250:NCAR GRAPHICS',8.,0.,0.)
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
