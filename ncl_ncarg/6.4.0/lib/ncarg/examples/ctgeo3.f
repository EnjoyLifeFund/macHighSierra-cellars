

      PROGRAM CTGEO3
C
C Define the error file, the Fortran unit number, the workstation type,
C and the workstation ID to be used in calls to GKS routines.  Use one
C of the following:
C
C       PARAMETER (IERF=6,LUNI=2,IWTY=1 ,IWID=1)  !  NCGM
C       PARAMETER (IERF=6,LUNI=2,IWTY=8 ,IWID=1)  !  X Windows
C       PARAMETER (IERF=6,LUNI=2,IWTY=20,IWID=1)  !  PostScript
C       PARAMETER (IERF=6,LUNI=2,IWTY=11,IWID=1)  !  PDF, Portrait
C       PARAMETER (IERF=6,LUNI=2,IWTY=12,IWID=1)  !  PDF, Landscape
C
        PARAMETER (IERF=6,LUNI=2,IWTYPE=1,IWTY=IWTYPE,IWID=1)
C
C The object of this program is to produce a set of plots illustrating
C the use of a geodesic mesh (which is inherently a triangular mesh) on
C the surface of the globe.  The data for the geodesic mesh were down-
C loaded from the Web site with the following URL:
C
C   http://kiwi.atmos.colostate.edu:16080/BUGS/projects/geodesic/
C
C (It seems that this URL no longer works; the scientists mentioned
C included David Randall and Ross Heikes.)
C
C The dataset is of interest for a couple of reasons:
C
C   The scientists who created it found a way of slightly altering the
C   mesh to make all its triangles have nearly the same surface area.
C   This is a difficult thing to do, and I would like to know how they
C   did it.
C
C   The dataset is presented in a somewhat different format; ingenuity
C   is required to extract the triangular mesh from it.  The vertices
C   of the geodesic mesh are given and each is accompanied by a list of
C   points forming a five- or six-sided polygonal patch around it.  In
C   order to connect adjacent vertices to form a triangular mesh, one
C   must first determine which vertices are adjacent.  This proves to
C   be a little tricky to do efficiently.  See the routine "GTGEO3",
C   which reads in the data and constructs the triangular mesh, for a
C   solution and for more information.
C
C Selected frames are drawn for each of four different viewpoints.  If
C (CLAT,CLON) is the approximate position of the "center point" of the
C mesh (which is defined somewhat arbitrarily for this mesh), the four
C viewpoints used will be as follows: (CLAT+45,CLON), (CLAT-45,CLON),
C (CLAT+45,CLON+180), and (CLAT-45,CLON+180).
C
C At each of the four viewpoints, up to four different frames may be
C drawn:
C
C   1) A frame showing the triangular mesh on the globe.  This frame
C      is drawn only if the parameter IMSH is non-zero.
C
C   2) A frame showing simple contours on the globe.  This frame is
C      drawn only if the parameter ICON is non-zero.
C
C   3) A frame showing color-filled contour bands on the globe, drawn
C      using filled areas.  This frame is drawn only if the parameter
C      ICOL is non-zero.
C
C   4) A frame showing color-filled contour bands on the globe, drawn
C      using a cell array.  This frame is drawn only if the parameter
C      ICAP is non-zero.
C
C Define the parameter that says whether or not the frame showing the
C triangular mesh is to be drawn (frame 1):
C
C       PARAMETER (IMSH=0)  !  triangular mesh not drawn
C       PARAMETER (IMSH=1)  !  triangular mesh drawn
C
        PARAMETER (IMSH=1)
C
C Define the parameter that says whether or not to draw simple contours
C (frame 2):
C
C       PARAMETER (ICON=0)  !  contours not drawn
C       PARAMETER (ICON=1)  !  contours drawn
C
        PARAMETER (ICON=1)
C
C Define the parameter that says whether or not to draw color-filled
C contours (frame 3):
C
C       PARAMETER (ICOL=0)  !  no color fill done
C       PARAMETER (ICOL=1)  !  color fill done
C
        PARAMETER (ICOL=1)
C
C Define the parameter that says whether or not to draw a cell array
C plot (frame 4):
C
C       PARAMETER (ICAP=0)  !  cell array plot not drawn
C       PARAMETER (ICAP=1)  !  cell array plot drawn
C
        PARAMETER (ICAP=1)
C
C To represent the triangular mesh, we use three singly-dimensioned
C arrays: RPNT holds points, IEDG holds edges, and ITRI holds triangles.
C The elements of each array form "nodes" having lengths as follows:
C
        PARAMETER (LOPN=5)
C
C The five elements of a point node are
C
C   1. the X coordinate of the point;
C   2. the Y coordinate of the point;
C   3. the Z coordinate of the point;
C   4. the field value at the point;
C   5. any additional value desired by the user.
C
        PARAMETER (LOEN=5)
C
C The five elements of an edge node are
C
C   1. the base index, in RPNT, of point 1 of the edge;
C   2. the base index, in RPNT, of point 2 of the edge;
C   3. the index, in ITRI, of the pointer to the edge in the triangle to
C      the left of the edge (-1 if there is no triangle to the left);
C   4. the index, in ITRI, of the pointer to the edge in the triangle to
C      the right of the edge (-1 if there is no triangle to the right);
C   5. a utility flag for use by algorithms that scan the structure.
C
C The "left" and "right" sides of an edge are defined as they would be
C by an observer standing on the globe at point 1 of the edge, looking
C toward point 2 of the edge.  It is possible, if there are "holes" in
C the mesh, that there will be no triangle to the left or to the right
C of an edge, but there must be a triangle on one side or the other.
C
        PARAMETER (LOTN=4)
C
C The four elements of a triangle node are
C
C   1. the base index, in IEDG, of edge 1 of the triangle;
C   2. the base index, in IEDG, of edge 2 of the triangle;
C   3. the base index, in IEDG, of edge 3 of the triangle;
C   4. a flag set non-zero to block use of the triangle, effectively
C      removing it from the mesh (not used for this mesh).
C
C The "base index" of a point node, an edge node, or a triangle node is
C always a multiple of the length of the node, to which can be added an
C offset to get the index of a particular element of the node.  For
C example, if I is the base index of a triangle of interest, ITRI(I+1)
C is its first element (the base index of its first edge).  Similarly,
C IEDG(ITRI(I+1)+2) is the base index of the second point of the first
C edge of the triangle with base index I, and RPNT(IEDG(ITRI(I+1)+2)+3)
C is the third (Z) coordinate of the second point of the first edge of
C the triangle with base index I.
C
C It is the pointers from the edge nodes back to the triangle nodes that
C allow CONPACKT to navigate the mesh, moving from triangle to triangle
C as it follows a contour line, but these pointers are tricky to define:
C if IPTE is the base index of an edge node and IEDG(IPTE+3) is zero or
C more, saying that there is a triangle to the left of the edge, then
C IEDG(IPTE+3) is the actual index of that element of the triangle node
C that points to the edge node; i.e., ITRI(IEDG(IPTE+3))=IPTE.  The base
C index of the triangle node defining that triangle is IPTT, where
C IPTT=LOTN*((IEDG(IPTE+3)-1)/LOTN), and the index of the pointer to
C the edge within the triangle node is IPTI=IEDG(IPTE+3)-IPTT, so that
C ITRI(IPTT+IPTI)=IPTE.  Similar comments apply to element 4 of an edge
C node, which points into the triangle node defining the triangle to the
C right of the edge.
C
C The maximum number of points, edges, and triangles (MNOP, MNOE, and
C MNOT) in a geodesic mesh can be computed directly from the parameter
C NDIV, which determines the order of the geodesic mesh.  For the grid
C we downloaded, the correct value is 16.
C
        PARAMETER (NDIV=16)
C
        PARAMETER (MNOP=10*NDIV*NDIV+2)
        PARAMETER (MNOE=30*NDIV*NDIV)
        PARAMETER (MNOT=20*NDIV*NDIV)
C
C Define the space reserved for the triangular mesh:
C
        PARAMETER (MPNT=MNOP*LOPN)
        PARAMETER (MEDG=MNOE*LOEN)
        PARAMETER (MTRI=MNOT*LOTN)
C
C Declare the arrays to hold point nodes, edge nodes, and triangle nodes
C defining the triangular mesh.
C
        DIMENSION RPNT(MPNT),IEDG(MEDG),ITRI(MTRI)
C
C Declare sort arrays to be used to keep track of where points and
C edges were put in the structure defining the triangular mesh.
C
        DIMENSION IPPP(2,MNOP),IPPE(2,MNOE)
C
C Declare real and integer workspaces needed by CONPACKT.
C
        PARAMETER (LRWK=10000,LIWK=1000)
C
        DIMENSION RWRK(LRWK),IWRK(LIWK)
C
C Declare the area map array needed to do solid fill.
C
        PARAMETER (LAMA=200000)
C
        DIMENSION IAMA(LAMA)
C
C Declare workspace arrays to be used in calls to ARSCAM.
C
        PARAMETER (NCRA=LAMA/10,NGPS=2)
C
        DIMENSION XCRA(NCRA),YCRA(NCRA),IAAI(NGPS),IAGI(NGPS)
C
C Declare arrays in which to generate a cell-array picture of the data
C on the triangular mesh.
C
C       PARAMETER (ICAM=1024,ICAN=1024)
        PARAMETER (ICAM= 512,ICAN= 512)
C
        DIMENSION ICRA(ICAM,ICAN)
C
C Declare external the routine that draws masked contour lines.
C
        EXTERNAL DRWMCL
C
C Declare external the routine that does color fill of contour bands.
C
        EXTERNAL DCFOCB
C
C Define a common block in which to keep track of the maximum space used
C in the arrays XCRA and YCRA.
C
        COMMON /COMONA/ MAXN
C
C Define the out-of-range flag.
C
        DATA OORV / 1.E12 /
C
C Define the tension on the splines to be used in smoothing contours.
C
C       DATA T2DS / 0.0 /  !  smoothing off
C       DATA T2DS / 2.5 /  !  smoothing on
C
        DATA T2DS / 0.0 /
C
C Define the distance between points on smoothed contour lines.
C
        DATA RSSL / .002 /
C
C Define the amount of real workspace to be used in drawing contours.
C
        DATA IRWC / 500 /
C
C Define the label-positioning flag.
C
C       DATA ILLP / 0 /  !  no labels
C       DATA ILLP / 1 /  !  dash-package writes labels
C       DATA ILLP / 2 /  !  regular scheme
C       DATA ILLP / 3 /  !  penalty scheme
C
        DATA ILLP / 2 /
C
C Define the high/low search radius.
C
        DATA HLSR / .075 /
C
C Define the high/low label overlap flag.
C
        DATA IHLO / 11 /
C
C Define the hachuring flag, hachure length, and hachure spacing.
C
C       DATA IHCF,HCHL,HCHS /  0 , +.004 , .010 /  !  off
C       DATA IHCF,HCHL,HCHS / +1 , -.004 , .020 /  !  on, all, uphill
C
        DATA IHCF,HCHL,HCHS /  0 , +.004 , .010 /
C
C Define a constant to convert from radians to degrees.
C
        DATA RTOD / 57.2957795130823 /
C
C Read data and generate the required triangular mesh.
C
        PRINT * , ' '
        PRINT * , 'READING TRIANGULAR MESH:'
C
        CALL GTGEO3 (RPNT,MPNT,NPNT,LOPN,
     +               IEDG,MEDG,NEDG,LOEN,
     +               ITRI,MTRI,NTRI,LOTN,
     +               IPPP,IPPE,CLAT,CLON)
C
C Print the number of points, edges, and triangles.
C
        PRINT * , '  NUMBER OF POINTS:    ',NPNT/LOPN
        PRINT * , '  NUMBER OF EDGES:     ',NEDG/LOEN
        PRINT * , '  NUMBER OF TRIANGLES: ',NTRI/LOTN
C
C Write the contents of the point list, the edge list, and the triangle
C list to "fort.11" in a readable form.
C
c       WRITE (11,'(''P'',I8,5F10.4)')
c    +        (I,RPNT(I+1),RPNT(I+2),RPNT(I+3),RPNT(I+4),RPNT(I+5),
c    +                                               I=0,NPNT-LOPN,LOPN)
c       WRITE (11,'(''E'',I8,5I10)')
c    +        (I,IEDG(I+1),IEDG(I+2),IEDG(I+3),IEDG(I+4),IEDG(I+5),
c    +                                               I=0,NEDG-LOEN,LOEN)
c       WRITE (11,'(''T'',I8,4I10)')
c    +        (I,ITRI(I+1),ITRI(I+2),ITRI(I+3),ITRI(I+4),
c    +                                               I=0,NTRI-LOTN,LOTN)
C
C Open GKS.
C
        PRINT * , 'OPENING AND INITIALIZING GKS'
C
        CALL GOPKS (IERF,0)
        CALL GOPWK (IWID,LUNI,IWTY)
        CALL GACWK (IWID)
C
C Turn off the clipping indicator.
C
        CALL GSCLIP (0)
C
C Define a basic set of colors (0 = white, background; 1 = black,
C foreground; 2 = yellow; 3 = magenta; 4 = red; 5 = cyan; 6 = green;
C 7 = blue; 8 = darker light gray; 9 = lighter light gray; 10 = dark
C yellow; 11 = dark gray; 12 = medium gray; 13 = light red, for
C geographic lines; 14 = light blue, for lat/lon lines).
C
        CALL GSCR   (IWID, 0,1.,1.,1.)
        CALL GSCR   (IWID, 1,0.,0.,0.)
        CALL GSCR   (IWID, 2,1.,1.,0.)
        CALL GSCR   (IWID, 3,1.,0.,1.)
        CALL GSCR   (IWID, 4,1.,0.,0.)
        CALL GSCR   (IWID, 5,0.,1.,1.)
        CALL GSCR   (IWID, 6,0.,1.,0.)
        CALL GSCR   (IWID, 7,0.,0.,1.)
        CALL GSCR   (IWID, 8,.5,.5,.5)
        CALL GSCR   (IWID, 9,.8,.8,.8)
        CALL GSCR   (IWID,10,.3,.3,0.)
        CALL GSCR   (IWID,11,.3,.3,.3)
        CALL GSCR   (IWID,12,.5,.5,.5)
        CALL GSCR   (IWID,13,.8,.5,.5)
        CALL GSCR   (IWID,14,.5,.5,.8)
C
C Define 100 colors, associated with color indices 151 through 250, to
C be used for color-filled contour bands and in cell arrays, ranging
C from blue to red.
C
        CALL DFCLRS (IWID,151,250,0.,0.,1.,1.,0.,0.)
C
C Set parameters in the utilities.
C
        PRINT * , 'SETTING PARAMETERS IN CONPACKT, EZMAP, AND PLOTCHAR'
C
C Set the mapping flag.
C
        CALL CTSETI ('MAP - MAPPING FLAG',1)
C
C Set the out-of-range flag value.
C
        CALL CTSETR ('ORV - OUT-OF-RANGE VALUE',OORV)
C
C Turn on the drawing of the mesh edge and set the area identifier for
C areas outside the mesh.
C
        CALL CTSETI ('PAI - PARAMETER ARRAY INDEX',-1)
        CALL CTSETI ('CLU - CONTOUR LEVEL USE FLAG',1)
        CALL CTSETI ('AIA - AREA IDENTIFIER FOR AREA',1001)
C
C Set the area identifier for areas in "out-of-range" areas.
C
C       CALL CTSETI ('PAI',-2)
C       CALL CTSETI ('AIA - AREA IDENTIFIER FOR AREA',1002)
C
C Set the 2D smoother flag.
C
        CALL CTSETR ('T2D - TENSION ON 2D SPLINES',T2DS)
C
C Set the distance between points on smoothed lines.
C
        CALL CTSETR ('SSL - SMOOTHED SEGMENT LENGTH',RSSL)
C
C Set the amount of real workspace to be used in drawing contours.
C
        CALL CTSETI ('RWC - REAL WORKSPACE FOR CONTOURS',IRWC)
C
C Set the label-positioning flag.
C
        CALL CTSETI ('LLP - LINE LABEL POSITIONING FLAG',ILLP)
C
C Set the high/low search radius.
C
        CALL CTSETR ('HLR - HIGH/LOW SEARCH RADIUS',HLSR)
C
C Set the high/low label overlap flag.
C
        CALL CTSETI ('HLO - HIGH/LOW LABEL OVERLAP FLAG',IHLO)
C
C Set the hachuring flag, hachure length, and hachure spacing.
C
        CALL CTSETI ('HCF - HACHURING FLAG',IHCF)
        CALL CTSETR ('HCL - HACHURE LENGTH',HCHL)
        CALL CTSETR ('HCS - HACHURE SPACING',HCHS)
C
C Set the cell array flag.
C
        CALL CTSETI ('CAF - CELL ARRAY FLAG',-1)
C
C Tell CONPACKT not to do its own call to SET, since EZMAP will have
C done it.
C
        CALL CTSETI ('SET - DO-SET-CALL FLAG', 0)
C
C Move the informational label up a little.
C
        CALL CTSETR ('ILY - INFORMATIONAL LABEL Y POSITION',-.005)
C
C Tell EZMAP not to draw the perimeter.
C
        CALL MPSETI ('PE',0)
C
C Tell EZMAP to use solid lat/lon lines.
C
        CALL MPSETI ('DA',65535)
C
C Tell PLOTCHAR to use one of the filled fonts and to outline each
C character.
C
        CALL PCSETI ('FN',25)
        CALL PCSETI ('OF',1)
C
C Tell PLOTCHAR to expect a character other than a colon as the
C function-control signal character.
C
        CALL PCSETC ('FC','|')
C
C Loop through four different viewing angles.
C
        DO 104 IDIR=1,4
C
          PRINT * , ' '
          PRINT * , 'VIEW FROM DIRECTION NUMBER: ',IDIR
C
C Tell EZMAP what projection to use and what its limits are.
C
          IF      (IDIR.EQ.1) THEN
            CALL MAPROJ ('OR',CLAT+45.,CLON,      0.)
          ELSE IF (IDIR.EQ.2) THEN
            CALL MAPROJ ('OR',CLAT-45.,CLON,      0.)
          ELSE IF (IDIR.EQ.3) THEN
            CALL MAPROJ ('OR',CLAT+45.,CLON+180., 0.)
          ELSE IF (IDIR.EQ.4) THEN
            CALL MAPROJ ('OR',CLAT-45.,CLON+180., 0.)
          END IF
C
          CALL MAPSET ('MA',0.,0.,0.,0.)
C
C Initialize EZMAP.
C
          CALL MAPINT
C
C If the triangular mesh is to be drawn, do it.
C
          IF (IMSH.NE.0) THEN
C
            PRINT * , 'DRAWING TRIANGULAR MESH'
C
            DO 101 IPTE=0,NEDG-LOEN,LOEN
C
              IFLL=0
C
              IF (IEDG(IPTE+3).GE.0) THEN
                IF (ITRI(LOTN*((IEDG(IPTE+3)-1)/LOTN)+4).EQ.0) IFLL=1
              END IF
C
              IFLR=0
C
              IF (IEDG(IPTE+4).GE.0) THEN
                IF (ITRI(LOTN*((IEDG(IPTE+4)-1)/LOTN)+4).EQ.0) IFLR=1
              END IF
C
              IF (IFLL.NE.0.OR.IFLR.NE.0) THEN
                CALL PLOTIT (0,0,2)
                CALL GSPLCI (8)
              ELSE
                CALL PLOTIT (0,0,2)
                CALL GSPLCI (9)
              END IF
C
              ALAT=RTOD*ASIN(RPNT(IEDG(IPTE+1)+3))
C
              IF (RPNT(IEDG(IPTE+1)+1).EQ.0..AND.
     +            RPNT(IEDG(IPTE+1)+2).EQ.0.) THEN
                ALON=0.
              ELSE
                ALON=RTOD*ATAN2(RPNT(IEDG(IPTE+1)+2),
     +                          RPNT(IEDG(IPTE+1)+1))
              END IF
C
              BLAT=RTOD*ASIN(RPNT(IEDG(IPTE+2)+3))
C
              IF (RPNT(IEDG(IPTE+2)+1).EQ.0..AND.
     +            RPNT(IEDG(IPTE+2)+2).EQ.0.) THEN
                BLON=0.
              ELSE
                BLON=RTOD*ATAN2(RPNT(IEDG(IPTE+2)+2),
     +                          RPNT(IEDG(IPTE+2)+1))
              END IF
C
              CALL DRSGCR (ALAT,ALON,BLAT,BLON)
C
  101       CONTINUE
C
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (13)
            CALL MAPGRD
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (14)
            CALL MAPLOT
C
C Draw the edges and vertices of the generating icosahedron.
C
            CALL DRGEAV
C
C Label the first frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'GEODESIC',.024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.906),'(USER-DEFINED)',
     +                                                      .016,0.,-1.)
C
            IF (     IDIR.EQ.1) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 1',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.2) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 2',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.3) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 3',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.4) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 4',
     +                                                      .012,0.,-1.)
            END IF
C
            CALL PLCHHQ (CFUX(.97),CFUY(.950),'DERIVED TRIANGULAR MESH',
     +.012,0.,1.)
C
            CALL PLCHHQ (CFUX(.97),CFUY(.928),
     +                   'This mesh was created by subdividing',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.908),
     +                   'the faces of an icosahedron into',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.888),
     +                   'N x N equilateral triangles',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.868),
     +                   'and projecting those',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.848),
     +                   'onto the surface',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.828),
     +                   'of the globe',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.808),
     +                   '(shown for',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.788),
     +                   'N=16).',
     +                                                       .010,0.,1.)
C
            CALL PLCHHQ (CFUX(.97),CFUY(.183),
     +                   'Mesh was',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.163),
     +                   'then modified',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.143),
     +                   'in such a way as',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.123),
     +                   'to make all triangles',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.103),
     +                   'have nearly the same area.',
     +                                                       .010,0.,1.)
C
            CALL PLCHHQ (CFUX(.97),CFUY(.073),
     +                   'Projections of the edges and',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.053),
     +                   'vertices of the original icosahedron',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.033),
     +                   'are drawn using bold black lines and dots.',
     +                                                       .010,0.,1.)
C
            CALL PLCHHQ (CFUX(.03),CFUY(.084),'Mesh is gray.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.060),'Shorelines are blue.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.036),'Parallels/meridians are r
     +ed.',.012,0.,-1.)
C
C Advance the frame.
C
            CALL FRAME
C
          END IF
C
C If a frame showing simple contours is to be drawn, do it next (adding
C an overlay of lat/lon lines and continental outlines in light gray).
C
          IF (ICON.NE.0) THEN
C
            PRINT * , 'DRAWING PLOT SHOWING SIMPLE CONTOURS'
C
C Initialize CONPACKT.
C
            PRINT * , 'CALLING CTMESH'
C
            CALL CTMESH (RPNT,NPNT,LOPN,
     +                   IEDG,NEDG,LOEN,
     +                   ITRI,NTRI,LOTN,
     +                   RWRK,LRWK,
     +                   IWRK,LIWK)
C
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (1)
C
C Proceed as implied by the setting of the label-positioning flag.
C
            IF (ABS(ILLP).EQ.1) THEN
C
C Draw the contour lines with labels generated by the dash package.
C
              PRINT * , 'CALLING CTCLDR'
              CALL CTCLDR (RPNT,IEDG,ITRI,RWRK,IWRK)
C
C Add the informational and high/low labels.
C
              PRINT * , 'CALLING CTLBDR'
              CALL CTLBDR (RPNT,IEDG,ITRI,RWRK,IWRK)
C
            ELSE IF (ABS(ILLP).GT.1) THEN
C
C Create an area map for masking of labels.
C
              MAXN=0
C
              PRINT * , 'CALLING ARINAM'
              CALL ARINAM (IAMA,LAMA)
C
              PRINT * , 'CALLING CTLBAM'
              CALL CTLBAM (RPNT,IEDG,ITRI,RWRK,IWRK,IAMA)
C
C Draw the contour lines masked by the area map.
C
              PRINT * , 'CALLING CTCLDM'
              CALL CTCLDM (RPNT,IEDG,ITRI,RWRK,IWRK,IAMA,DRWMCL)
C
              PRINT * , 'AREA MAP SPACE REQUIRED:         ',
     +                                         IAMA(1)-IAMA(6)+IAMA(5)+1
C
              PRINT * , 'NUMBER OF POINTS IN LONGEST LINE:',MAXN
C
C Draw all the labels.
C
              PRINT * , 'CALLING CTLBDR'
              CALL CTLBDR (RPNT,IEDG,ITRI,RWRK,IWRK)
C
            END IF
C
            CALL CTGETI ('IWU - INTEGER WORKSPACE USED',IIWU)
            PRINT * , 'INTEGER WORKSPACE REQUIRED:      ',IIWU
C
            CALL CTGETI ('RWU -    REAL WORKSPACE USED',IRWU)
            PRINT * , 'REAL WORKSPACE REQUIRED:         ',IRWU
C
C Add lat/lon lines and continental outlines.
C
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (13)
            CALL MAPGRD
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (14)
            CALL MAPLOT
C
C Label the second frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'GEODESIC',.024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.906),'(USER-DEFINED)',
     +                                                      .016,0.,-1.)
C
            IF (     IDIR.EQ.1) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 1',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.2) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 2',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.3) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 3',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.4) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 4',
     +                                                      .012,0.,-1.)
            END IF
C
            CALL PLCHHQ (CFUX(.97),CFUY(.950),'SIMPLE CONTOURS ON',
     +                                                       .012,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.926),'TRIANGULAR MESH',
     +                                                       .012,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.904),'Dummy data are used.',
     +                                                       .010,0.,1.)
C
            CALL PLCHHQ (CFUX(.03),CFUY(.060),'Shorelines are blue.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.036),'Parallels/meridians are r
     +ed.',.012,0.,-1.)
C
C Advance the frame.
C
            CALL FRAME
C
          END IF
C
C If a frame showing color-filled contours is to be drawn, do it next.
C
          IF (ICOL.NE.0) THEN
C
            PRINT * , 'DRAWING PLOT SHOWING COLOR-FILLED CONTOURS'
C
            PRINT * , 'CALLING CTMESH'
C
            CALL CTMESH (RPNT,NPNT,LOPN,
     +                   IEDG,NEDG,LOEN,
     +                   ITRI,NTRI,LOTN,
     +                   RWRK,LRWK,
     +                   IWRK,LIWK)
C
            MAXN=0
C
            PRINT * , 'CALLING CTPKCL'
            CALL CTPKCL (RPNT,IEDG,ITRI,RWRK,IWRK)
C
            PRINT * , 'CALLING ARINAM'
            CALL ARINAM (IAMA,LAMA)
C
            PRINT * , 'CALLING CTCLAM'
            CALL CTCLAM (RPNT,IEDG,ITRI,RWRK,IWRK,IAMA)
C
C           PRINT * , 'CALLING CTLBAM'
C           CALL CTLBAM (RPNT,IEDG,ITRI,RWRK,IWRK,IAMA)
C
            PRINT * , 'CALLING ARSCAM'
            CALL ARSCAM (IAMA,XCRA,YCRA,NCRA,IAAI,IAGI,NGPS,DCFOCB)
C
            PRINT * , 'SPACE REQUIRED IN AREA MAP:      ',
     +                                         IAMA(1)-IAMA(6)+IAMA(5)+1
C
            PRINT * , 'NUMBER OF POINTS IN LARGEST AREA:',MAXN
C
            CALL CTGETI ('IWU - INTEGER WORKSPACE USED',IIWU)
            PRINT * , 'INTEGER WORKSPACE REQUIRED:      ',IIWU
C
            CALL CTGETI ('RWU -    REAL WORKSPACE USED',IRWU)
            PRINT * , 'REAL WORKSPACE REQUIRED:         ',IRWU
C
            CALL GSFACI (1)
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (13)
            CALL MAPGRD
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (14)
            CALL MAPLOT
C
C Label the third frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'GEODESIC',.024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.906),'(USER-DEFINED)',
     +                                                      .016,0.,-1.)
C
            IF (     IDIR.EQ.1) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 1',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.2) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 2',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.3) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 3',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.4) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 4',
     +                                                      .012,0.,-1.)
            END IF
C
            CALL PLCHHQ (CFUX(.97),CFUY(.950),'COLORED CONTOUR BANDS ON'
     +,.012,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.926),'TRIANGULAR MESH',
     +                                                       .012,0.,1.)
C
            CALL PLCHHQ (CFUX(.97),CFUY(.904),'Dummy data are used.',
     +                                                       .010,0.,1.)
C
            CALL PLCHHQ (CFUX(.03),CFUY(.132),'Off-mesh',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.108),'areas of the',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.084),'globe are yellow.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.060),'Shorelines are blue.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.036),'Parallels/meridians are r
     +ed.',.012,0.,-1.)
C
C Advance the frame.
C
            CALL FRAME
C
          END IF
C
C If the flag for it is set, do a cell array plot.
C
          IF (ICAP.NE.0) THEN
C
            PRINT * , 'DRAWING CELL-ARRAY PLOT OF DATA VALUES'
C
            PRINT * , 'CALLING CTMESH'
C
            CALL CTMESH (RPNT,NPNT,LOPN,
     +                   IEDG,NEDG,LOEN,
     +                   ITRI,NTRI,LOTN,
     +                   RWRK,LRWK,
     +                   IWRK,LIWK)
C
            CALL GETSET (XVPL,XVPR,YVPB,YVPT,XWDL,XWDR,YWDB,YWDT,LNLG)
C
            PRINT * , 'CALLING CTCICA'
            CALL CTCICA (RPNT,IEDG,ITRI,RWRK,IWRK,ICRA,ICAM,ICAM,ICAN,
     +                                            XVPL,YVPB,XVPR,YVPT)
C
            PRINT * , 'CALLING GCA'
            CALL GCA (XWDL,YWDB,XWDR,YWDT,ICAM,ICAN,1,1,ICAM,ICAN,ICRA)
C
            CALL CTGETI ('IWU - INTEGER WORKSPACE USED',IIWU)
            PRINT * , 'INTEGER WORKSPACE REQUIRED:      ',IIWU
C
            CALL CTGETI ('RWU -    REAL WORKSPACE USED',IRWU)
            PRINT * , 'REAL WORKSPACE REQUIRED:         ',IRWU
C
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (13)
            CALL MAPGRD
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (14)
            CALL MAPLOT
C
C Label the fourth frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'GEODESIC',.024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.906),'(USER-DEFINED)',
     +                                                      .016,0.,-1.)
C
            IF (     IDIR.EQ.1) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 1',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.2) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 2',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.3) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 3',
     +                                                      .012,0.,-1.)
            ELSE IF (IDIR.EQ.4) THEN
              CALL PLCHHQ (CFUX(.03),CFUY(.874),'VIEWPOINT 4',
     +                                                      .012,0.,-1.)
            END IF
C
            CALL PLCHHQ (CFUX(.97),CFUY(.950),'CELL ARRAY DERIVED FROM',
     +.012,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.926),'TRIANGULAR MESH',
     +                                                       .012,0.,1.)
C
            CALL PLCHHQ (CFUX(.97),CFUY(.904),'Dummy data are used.',
     +                                                       .010,0.,1.)
C
            CALL PLCHHQ (CFUX(.03),CFUY(.132),'Off-mesh',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.108),'areas of the',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.084),'globe are yellow.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.060),'Shorelines are blue.',
     +                                                      .012,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.036),'Parallels/meridians are r
     +ed.',.012,0.,-1.)
C
C Advance the frame.
C
            CALL FRAME
C
          END IF
C
  104   CONTINUE
C
C Close GKS.
C
        CALL GDAWK (IWID)
        CALL GCLWK (IWID)
        CALL GCLKS
C
C Done.
C
        STOP
C
      END


      SUBROUTINE DFCLRS (IWID,IOFC,IOLC,REDF,GRNF,BLUF,REDL,GRNL,BLUL)
C
C This routine defines color indices IOFC through IOLC on workstation
C IWID by interpolating values from REDF/GRNF/BLUF to REDL/GRNL/BLUL.
C
        DO 101 I=IOFC,IOLC
          P=REAL(IOLC-I)/REAL(IOLC-IOFC)
          Q=REAL(I-IOFC)/REAL(IOLC-IOFC)
          CALL GSCR (IWID,I,P*REDF+Q*REDL,P*GRNF+Q*GRNL,P*BLUF+Q*BLUL)
  101   CONTINUE
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE GTGEO3 (RPNT,MPNT,NPNT,LOPN,
     +                   IEDG,MEDG,NEDG,LOEN,
     +                   ITRI,MTRI,NTRI,LOTN,
     +                   IPPP,IPPE,PLAT,PLON)
C
        DIMENSION RPNT(MPNT),IEDG(MEDG),ITRI(MTRI),IPPP(2,*),IPPE(2,*)
C
C Construct a triangular mesh representing a geodesic sphere from data
C downloaded from a user site.
C
C Include definitions that "NetCDF" needs (now commented out, because
C the data are being read from an ASCII file, instead).
C
C       include 'netcdf.inc'
C
C GTGEO3 calls a routine (CTTMTL) that allows one to easily create an
C arbitrary triangular mesh.  The "tree-sorts" used by the method are
C very inefficient for objects that are partially ordered, so, as the
C triangles of the mesh are generated, they are stored in a triangle
C buffer from which they can be dumped in random order by calls to the
C routine CTTMTL.  The following declarations create an array to use
C as the buffer for the triangles.  Up to a point, making this buffer
C larger will result in more randomization of the triangles and speed
C up the process.  MBUF is the number of triangles that will fit in the
C buffer at once, and KBUF is the number of those to be dumped whenever
C the buffer is found to be full.  Because the call and loop set-up
C time for CTTMTL are non-trivial, it's better to dump a significant
C number of triangles while you're there, but I'm not sure what value
C might work best.  Use MBUF > KBUF > 1 and play with the values a bit
C to see what causes improvement.  (I tend to use numbers that are
C relatively prime, but I'm not sure if that makes any difference.)
C
        PARAMETER (MBUF=5021,KBUF=173)
C
        DIMENSION TBUF(12,MBUF)
C
C Declare arrays into which to read the user's geodesic data.  VLAT
C and VLON hold the latitudes and longitudes of the 2562 vertices of
C the mesh, IOLF is an array of ocean/land flags, and ZDAT is an
C array of data (land elevations, in meters?).
C
        DIMENSION VLAT(2562),VLON(2562),IOLF(2562),ZDAT(2562)
C
C CLAT and CLON hold the latitudes and longitudes of the six (for some
C vertices, only five) corner points of a polygonal cell centered at the
C vertex.
C
        DIMENSION CLAT(6,2562),CLON(6,2562)
C
C In XCOV, YCOV, and ZCOV, we compute the Cartesian coordinates of the
C vertices and in IADJ we put the indices of adjacent polygonal patches.
C (The triangular mesh consists of the lines joining the vertices at the
C centers of adjacent patches.)  IWRK is an index array allowing us to
C order the vertices in such a way as to permit efficient searching for
C adjacent polygonal patches.
C
        DIMENSION XCOV(2562),YCOV(2562),ZCOV(2562)
        DIMENSION IADJ(2562,6)
        DIMENSION IWRK(2562)
C
C Dimension a variable needed for timing below.
C
C       DIMENSION TIME(2)
C
C Define needed conversion constants.
C
        DATA DTOR / .017453292519943 /
        DATA RTOD / 57.2957795130823 /
C
C The data for this example were originally read from a user's "NetCDF"
C file.  The code used for the purpose follows, but has been commented
C out, as the data are now read from an ASCII file.  This gets around
C certain procedural problems in running the example from "ncargex".
C
C Open the "NetCDF" file containing the geodesic data and read it.
C
C       ISTA=NF_OPEN('C02562.orog.nc',0,NCID)
C
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_OPEN: ',ISTA
C         STOP
C       END IF
C
C Read the array of latitudes of point nodes.
C
C       ISTA=NF_INQ_VARID(NCID,'grid_center_lat',IVID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_INQ_VARID: ',ISTA
C         STOP
C       END IF
C       ISTA=NF_GET_VAR_REAL(NCID,IVID,VLAT)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_GET_VAR_REAL: ',ISTA
C         STOP
C       END IF
C
C Read the array of longitudes of point nodes.
C
C       ISTA=NF_INQ_VARID(NCID,'grid_center_lon',IVID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_INQ_VARID: ',ISTA
C         STOP
C       END IF
C       ISTA=NF_GET_VAR_REAL(NCID,IVID,VLON)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_GET_VAR_REAL: ',ISTA
C         STOP
C       END IF
C
C Read the grid mask (ocean/land flag?) array.
C
C       ISTA=NF_INQ_VARID(NCID,'grid_imask',IVID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_INQ_VARID: ',ISTA
C         STOP
C       END IF
C       ISTA=NF_GET_VAR_INT(NCID,IVID,IOLF)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_GET_VAR_REAL: ',ISTA
C         STOP
C       END IF
C
C Read an array of data at the point nodes.
C
C       ISTA=NF_INQ_VARID(NCID,'zs',IVID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_INQ_VARID: ',ISTA
C         STOP
C       END IF
C       ISTA=NF_GET_VAR_REAL(NCID,IVID,ZDAT)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_GET_VAR_REAL: ',ISTA
C         STOP
C       END IF
C
C Read the array of latitudes of corner points.
C
C       ISTA=NF_INQ_VARID(NCID,'grid_corner_lat',IVID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_INQ_VARID: ',ISTA
C         STOP
C       END IF
C       ISTA=NF_GET_VAR_REAL(NCID,IVID,CLAT)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_GET_VAR_REAL: ',ISTA
C         STOP
C       END IF
C
C Read the array of longitudes of corner points.
C
C       ISTA=NF_INQ_VARID(NCID,'grid_corner_lon',IVID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_INQ_VARID: ',ISTA
C         STOP
C       END IF
C       ISTA=NF_GET_VAR_REAL(NCID,IVID,CLON)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_GET_VAR_REAL: ',ISTA
C         STOP
C       END IF
C
C Close the "NetCDF" file.
C
C       ISTA=NF_CLOSE(NCID)
C       IF (ISTA.NE.NF_NOERR) THEN
C         PRINT * , 'ERROR RETURN FROM NF_CLOSE: ',ISTA
C         STOP
C       END IF
C
C Write the data to unit 11.  (These statements are commented out; they
C were used to create a "fort.11" which was then renamed "ctgeo3.dat".)
C
C       WRITE (11,'(5E16.8)') VLAT
C       WRITE (11,'(5E16.8)') VLON
C       WRITE (11,'(5E16.8)') ZDAT
C       WRITE (11,'(5E16.8)') CLAT
C       WRITE (11,'(5E16.8)') CLON
C       WRITE (11,'(  10I8)') IOLF
C
C Read the required data from the ASCII file "ctgeo3.dat".
C
        OPEN (11,FILE='ctgeo3.dat',STATUS='OLD',FORM='FORMATTED')
C
        READ (11,'(5E16.8)') VLAT
        READ (11,'(5E16.8)') VLON
        READ (11,'(5E16.8)') ZDAT
        READ (11,'(5E16.8)') CLAT
        READ (11,'(5E16.8)') CLON
        READ (11,'(  10I8)') IOLF
C
        CLOSE (11)
C
C Convert the latitudes and longitudes of the mesh points to degrees,
C compute equivalent X, Y, and Z coordinates on the unit sphere, and
C identify those polygonal patches having five vertices instead of six,
C replacing the latitude for any duplicate by the value 99.
C
        DO 104 I=1,2562
          VLAT(I)=RTOD*VLAT(I)
          VLON(I)=RTOD*VLON(I)
          XCOV(I)=COS(DTOR*VLAT(I))*COS(DTOR*VLON(I))
          YCOV(I)=COS(DTOR*VLAT(I))*SIN(DTOR*VLON(I))
          ZCOV(I)=SIN(DTOR*VLAT(I))
          DO 101 J=1,6
            CLAT(J,I)=RTOD*CLAT(J,I)
            CLON(J,I)=RTOD*CLON(J,I)
  101     CONTINUE
          DO 103 J=1,6
            JM1=MOD(J+4,6)+1
            IF (CLAT(J,I).EQ.CLAT(JM1,I).AND.
     +          CLON(J,I).EQ.CLON(JM1,I)) THEN
              DO 102 K=J,5
                CLAT(K,I)=CLAT(K+1,I)
                CLON(K,I)=CLON(K+1,I)
  102         CONTINUE
              CLAT(6,I)=99.
              GO TO 104
            END IF
  103     CONTINUE
  104   CONTINUE
C
C Print initial timing (commented out to avoid compiler problems on some
C machines).
C
C       PRINT * , ' '
C       PRINT * , 'BEFORE CREATING ADJACENCY INDEX ARRAY:'
C       IF (DTIME(TIME).GE.0.) THEN
C         PRINT * , '  USER TIME:  ',TIME(1)
C         PRINT * , '  SYSTEM TIME:',TIME(2)
C       ELSE
C         PRINT * , '  GTGEO3 - STOP - ERROR IN DTIME'
C       END IF
C
C Set up the adjacency index array (time-consuming brute-force method).
C This code is commented out, but I have left it here because it's a bit
C easier to read than the code that replaced it.  The idea is to examine
C each side of each of the 2562 five- or six-sided polygonal patches
C (having a center defined by VLAT(I) and VLON(I) and corners defined
C by the contents of CLAT(J,I) and CLON(J,I) for J from 1 to NOJS) and
C find a matching side in one of the other polygonal patches.  We take
C advantage of the fact that the corners are given in counterclockwise
C order.  We define the contents of an "adjacency array" so that, once
C we are done, we have the indices of the five or six neighbors of each
C of the polygonal patches.  Given this adjacency array, the triangles
C of the triangular mesh can be formed (by just connecting the center
C points of neighboring patches).
C
C       DO 108 I=1,2562
C         IF (CLAT(6,I).EQ.99.) THEN
C           IADJ(I,6)=-1
C           NOJS=5
C         ELSE
C           NOJS=6
C         END IF
C         DO 107 J=1,NOJS
C           JM1=MOD(J+NOJS-2,NOJS)+1
C           DO 106 K=1,2562
C             IF (K.NE.I) THEN
C               IF (CLAT(6,K).EQ.99.) THEN
C                 NOLS=5
C               ELSE
C                 NOLS=6
C               END IF
C               DO 105 L=1,NOLS
C                 LP1=MOD(L,NOLS)+1
C                 IF (CLAT(J  ,I).EQ.CLAT(L  ,K).AND.
C    +                CLON(J  ,I).EQ.CLON(L  ,K).AND.
C    +                CLAT(JM1,I).EQ.CLAT(LP1,K).AND.
C    +                CLON(JM1,I).EQ.CLON(LP1,K)) THEN
C                   IADJ(I,J)=K
C                   GO TO 107
C                 END IF
C 105           CONTINUE
C             END IF
C 106       CONTINUE
C 107     CONTINUE
C 108   CONTINUE
C
C Set up the adjacency index array (better method).  This is just like
C the brute-force method commented out above, but is about an order of
C magnitude faster because we order the vertices of the center points
C of the polygonal patches by latitude, making it possible to look for
C matching edges in nearby polygonal patches first.  (If we're trying
C to find a match for a side of the Ith polygonal patch (sorted order),
C we look at polygonal patches for IC = I+1, I-1, I+2, I-2, and so on,
C until we find the one we want.  If IC becomes less than 1 or greater
C than 2562, we just finish out the rest of the list by stepping through
C the remaining elements on the opposite end of it; IM implements the
C logic to manage this.
C
        CALL CTSORT (VLAT,2562,IWRK)
C
        DO 108 I=1,2562
          IF (CLAT(6,IWRK(I)).EQ.99.) THEN
            IADJ(IWRK(I),6)=-1
            NOJS=5
          ELSE
            NOJS=6
          END IF
          DO 107 J=1,NOJS
            JM1=MOD(J+NOJS-2,NOJS)+1
            IC=I
            IM=0
            DO 106 K=1,2561
              IF (IM.EQ.0) THEN
                IF (MOD(K,2).EQ.0) THEN
                  IC=IC-K
                  IF (IC.LT.1) THEN
                    IC=IC+K+1
                    IM=+1
                  END IF
                ELSE
                  IC=IC+K
                  IF (IC.GT.2562) THEN
                    IC=IC-K-1
                    IM=-1
                  END IF
                END IF
              ELSE
                IC=IC+IM
              END IF
              IF (CLAT(6,IWRK(IC)).EQ.99.) THEN
                NOLS=5
              ELSE
                NOLS=6
              END IF
              DO 105 L=1,NOLS
                LP1=MOD(L,NOLS)+1
                IF (CLAT(J  ,IWRK(I)).EQ.CLAT(L  ,IWRK(IC)).AND.
     +              CLON(J  ,IWRK(I)).EQ.CLON(L  ,IWRK(IC)).AND.
     +              CLAT(JM1,IWRK(I)).EQ.CLAT(LP1,IWRK(IC)).AND.
     +              CLON(JM1,IWRK(I)).EQ.CLON(LP1,IWRK(IC))) THEN
                  IADJ(IWRK(I),J)=IWRK(IC)
                  GO TO 107
                END IF
  105         CONTINUE
  106       CONTINUE
  107     CONTINUE
  108   CONTINUE
C
C Print final timing (commented out to avoid compiler problems on some
C machines).
C
C       PRINT * , ' '
C       PRINT * , 'AFTER CREATING ADJACENCY INDEX ARRAY:'
C       IF (DTIME(TIME).GE.0.) THEN
C         PRINT * , '  USER TIME:  ',TIME(1)
C         PRINT * , '  SYSTEM TIME:',TIME(2)
C       ELSE
C         PRINT * , '  GTGEO3 - STOP - ERROR IN DTIME'
C       END IF
C
C Build structures forming the triangular mesh.  First, initialize the
C variables used to keep track of items in the sort arrays for points
C and edges, in the triangle buffer, and in the triangle list.
C
        MPPP=MPNT/LOPN
        NPPP=0
C
        MPPE=MEDG/LOEN
        NPPE=0
C
        NBUF=0
C
        NTRI=0
C
C Loop through the vertices of the geodesic grid.
C
        DO 110 I=1,2562
C
C Set the index of vertex 1 of the triangle.
C
          IOV1=I
C
C Determine how many vertices are connected to vertex IOV1.
C
          IF (IADJ(I,6).LT.0) THEN
            NOJS=5
          ELSE
            NOJS=6
          END IF
C
C Examine all of the 5 or 6 triangles meeting at vertex IOV1, taking
C advantage of the fact that the vertices are given in counterclockwise
C order.
C
          DO 109 J=1,NOJS
C
            JP1=MOD(J,NOJS)+1
C
C Set the indices of vertices 2 and 3 of the triangle.
C
            IOV2=IADJ(I,J)
            IOV3=IADJ(I,JP1)
C
C Process a triangle only if the index of the 1st vertex is less than
C the indices of the other two vertices.  This will ensure that each
C triangle is processed only once, even though we see it three times.
C
            IF (IOV1.LT.IOV2.AND.IOV1.LT.IOV3) THEN
C
C If the triangle buffer is full, dump a few randomly-chosen triangles
C from it to make room for the new one.
C
              IF (NBUF.EQ.MBUF) THEN
                CALL CTTMTL (KBUF,TBUF,MBUF,NBUF,
     +                       IPPP,MPPP,NPPP,
     +                       IPPE,MPPE,NPPE,
     +                       RPNT,MPNT,NPNT,LOPN,
     +                       IEDG,MEDG,NEDG,LOEN,
     +                       ITRI,MTRI,NTRI,LOTN)
              END IF
C
C Put the new triangle in the triangle buffer.
C
              NBUF=NBUF+1

              TBUF( 1,NBUF)=XCOV(IOV1)
              TBUF( 2,NBUF)=YCOV(IOV1)
              TBUF( 3,NBUF)=ZCOV(IOV1)
              TBUF( 4,NBUF)=ZDAT(IOV1)
C
              TBUF( 5,NBUF)=XCOV(IOV2)
              TBUF( 6,NBUF)=YCOV(IOV2)
              TBUF( 7,NBUF)=ZCOV(IOV2)
              TBUF( 8,NBUF)=ZDAT(IOV2)
C
              TBUF( 9,NBUF)=XCOV(IOV3)
              TBUF(10,NBUF)=YCOV(IOV3)
              TBUF(11,NBUF)=ZCOV(IOV3)
              TBUF(12,NBUF)=ZDAT(IOV3)
C
            END IF
C
  109     CONTINUE
C
  110   CONTINUE
C
C Output all triangles remaining in the buffer.
C
        IF (NBUF.NE.0) THEN
          CALL CTTMTL (NBUF,TBUF,MBUF,NBUF,
     +                 IPPP,MPPP,NPPP,
     +                 IPPE,MPPE,NPPE,
     +                 RPNT,MPNT,NPNT,LOPN,
     +                 IEDG,MEDG,NEDG,LOEN,
     +                 ITRI,MTRI,NTRI,LOTN)
        END IF
C
C Set the pointers that tell the caller how many points and edges were
C created.
C
        NPNT=NPPP*LOPN
        NEDG=NPPE*LOEN
C
C Initialize the dummy-data generator and get data values for all the
C points of the mesh.
C
        CALL TDGDIN (-1.,1.,-1.,1.,-1.,1.,21,21)
C
        DO 111 I=0,NPNT-LOPN,LOPN
          RPNT(I+4)=TDGDVA(RPNT(I+1),RPNT(I+2),RPNT(I+3))
  111   CONTINUE
C
C Return the latitude and longitude of the approximate center point of
C the mesh on the globe (arbitrary for this mesh).
C
        PLAT=0.
        PLON=0.
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE DRWMCL (XCRA,YCRA,NCRA,IAAI,IAGI,NGPS)
C
        DIMENSION XCRA(*),YCRA(*),IAAI(*),IAGI(*)
C
C This routine draws the curve defined by the points (XCRA(I),YCRA(I)),
C for I = 1 to NCRA, if and only if none of the area identifiers for the
C area containing the polyline are negative.  It calls either CURVE or
C CURVED to do the drawing, depending on the value of the internal
C parameter 'DPU'.
C
C It keeps track of the maximum value used for NCRA in a common block.
C
        COMMON /COMONA/ MAXN
C
        MAXN=MAX(MAXN,NCRA)
C
C Retrieve the value of the internal parameter 'DPU'.
C
        CALL CTGETI ('DPU - DASH PACKAGE USED',IDUF)
C
C Turn on drawing.
C
        IDRW=1
C
C If any area identifier is negative, turn off drawing.
C
        DO 101 I=1,NGPS
          IF (IAAI(I).LT.0) IDRW=0
  101   CONTINUE
C
C If drawing is turned on, draw the polyline.
C
        IF (IDRW.NE.0) THEN
          IF (IDUF.EQ.0) THEN
            CALL CURVE  (XCRA,YCRA,NCRA)
          ELSE IF (IDUF.LT.0) THEN
            CALL DPCURV (XCRA,YCRA,NCRA)
          ELSE
            CALL CURVED (XCRA,YCRA,NCRA)
          END IF
        END IF
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE DCFOCB (XCRA,YCRA,NCRA,IAAI,IAGI,NGPS)
C
C This routine fills the area defined by the points (XCRA(I),YCRA(I)),
C for I = 1 to NCRA, if and only if none of the area identifiers for
C the area are negative.  The color used is determined from the area
C identifier of the area relative to group 3; it is assumed that 100
C colors are defined having color indices 151 through 250.
C
        DIMENSION XCRA(*),YCRA(*),IAAI(*),IAGI(*)
C
C It keeps track of the maximum value used for NCRA in a common block.
C
        COMMON /COMONA/ MAXN
C
        MAXN=MAX(MAXN,NCRA)
C
C Retrieve the number of contour levels being used.
C
        CALL CTGETI ('NCL - NUMBER OF CONTOUR LEVELS',NOCL)
C
C If the number of contour levels is non-zero and the area has more
C than two points, fill it.
C
        IF (NOCL.NE.0.AND.NCRA.GT.2) THEN
C
          IAI3=-1
C
          DO 101 I=1,NGPS
            IF (IAGI(I).EQ.3) IAI3=IAAI(I)
  101     CONTINUE
C
          IF (IAI3.GE.1.AND.IAI3.LE.NOCL+1) THEN
            CALL GSFACI (151+INT(((REAL(IAI3)-.5)/REAL(NOCL+1))*100.))
            CALL GFA    (NCRA,XCRA,YCRA)
          ELSE IF (IAI3.EQ.1001) THEN
            CALL GSFACI (2)
            CALL GFA    (NCRA,XCRA,YCRA)
          ELSE IF (IAI3.EQ.1002) THEN
            CALL GSFACI (3)
            CALL GFA    (NCRA,XCRA,YCRA)
          END IF
C
        END IF
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE DRSGCR (ALAT,ALON,BLAT,BLON)
C
C (DRSGCR = DRaw Shortest Great Circle Route)
C
C This routine draws the shortest great circle route joining two points
C on the globe.  Note that MPTS = INT(180./SIZE) + 1.
C
        PARAMETER (MPTS=181,SIZE=1.)
C
        DIMENSION QLAT(MPTS),QLON(MPTS)
C
        NPTS=MAX(1,MIN(MPTS,INT(ADSGCR(ALAT,ALON,BLAT,BLON)/SIZE)))
C
        CALL MAPGCI (ALAT,ALON,BLAT,BLON,NPTS,QLAT,QLON)
C
        CALL MAPIT (ALAT,ALON,0)
C
        DO 101 I=1,NPTS
          CALL MAPIT (QLAT(I),QLON(I),1)
  101   CONTINUE
C
        CALL MAPIT (BLAT,BLON,2)
C
        CALL MAPIQ
C
        RETURN
C
      END


      FUNCTION ADSGCR (ALAT,ALON,BLAT,BLON)
C
C (ADSGCR = Angle in Degrees along Shortest Great Circle Route)
C
C This function returns the shortest great circle distance, in degrees,
C between two points, A and B, on the surface of the globe.
C
        DATA DTOR / .017453292519943 /
        DATA RTOD / 57.2957795130823 /
C
        XCOA=COS(DTOR*ALAT)*COS(DTOR*ALON)
        YCOA=COS(DTOR*ALAT)*SIN(DTOR*ALON)
        ZCOA=SIN(DTOR*ALAT)
C
        XCOB=COS(DTOR*BLAT)*COS(DTOR*BLON)
        YCOB=COS(DTOR*BLAT)*SIN(DTOR*BLON)
        ZCOB=SIN(DTOR*BLAT)
C
        ADSGCR=2.*RTOD*ASIN(SQRT((XCOA-XCOB)**2+
     +                           (YCOA-YCOB)**2+
     +                           (ZCOA-ZCOB)**2)/2.)
C
        RETURN
C
      END


      SUBROUTINE TDGDIN (XMIN,XMAX,YMIN,YMAX,ZMIN,ZMAX,MLOW,MHGH)
C
C This is a routine to generate test data for three-dimensional graphics
C routines.  The function used is a sum of exponentials.
C
C "MLOW" and "MHGH" are each forced to be greater than or equal to 1 and
C less than or equal to 25.
C
        COMMON /TDGDCO/ XRNG,YRNG,ZRNG,NCNT,CCNT(4,50)
        SAVE   /TDGDCO/
C
        XRNG=XMAX-XMIN
        YRNG=YMAX-YMIN
        ZRNG=ZMAX-ZMIN
C
        NLOW=MAX(1,MIN(25,MLOW))
        NHGH=MAX(1,MIN(25,MHGH))
        NCNT=NLOW+NHGH
C
        DO 101 ICNT=1,NCNT
          CCNT(1,ICNT)=XMIN+XRNG*FRAN()
          CCNT(2,ICNT)=YMIN+YRNG*FRAN()
          CCNT(3,ICNT)=ZMIN+ZRNG*FRAN()
          IF (ICNT.LE.NLOW) THEN
            CCNT(4,ICNT)=-1.
          ELSE
            CCNT(4,ICNT)=+1.
          END IF
  101   CONTINUE
C
        RETURN
C
      END


      FUNCTION TDGDVA (XPOS,YPOS,ZPOS)
C
        COMMON /TDGDCO/ XRNG,YRNG,ZRNG,NCNT,CCNT(4,50)
        SAVE   /TDGDCO/
C
        TDGDVA=0.
C
        DO 101 ICNT=1,NCNT
          TEMP=-50.*(((XPOS-CCNT(1,ICNT))/XRNG)**2+
     +               ((YPOS-CCNT(2,ICNT))/YRNG)**2+
     +               ((ZPOS-CCNT(3,ICNT))/YRNG)**2)
          IF (TEMP.GE.-20.) TDGDVA=TDGDVA+CCNT(4,ICNT)*EXP(TEMP)
  101   CONTINUE
C
C Done.
C
        RETURN
C
      END


      FUNCTION FRAN ()
C
C Pseudo-random-number generator.
C
        DOUBLE PRECISION X
        SAVE X
C
        DATA X / 2.718281828459045D0 /
C
        X=MOD(9821.D0*X+.211327D0,1.D0)
        FRAN=REAL(X)
C
        RETURN
C
      END


      SUBROUTINE DRGEAV
C
C Draw the edges and vertices of the icosahedron used to generate a
C geodesic grid.
C
C Declare arrays to hold information describing an icosahedron.
C
        DIMENSION JEDG(2,30),XCVI(12),YCVI(12),ZCVI(12)
C
C Declare arrays to hold the latitudes and longitudes of the vertices
C (to be computed).
C
        DIMENSION RLAT(12),RLON(12)
C
C Define the thirty edges of the icosahedron (pointers to vertices).
C
        DATA JEDG(1, 1),JEDG(2, 1) /  1, 3 /
        DATA JEDG(1, 2),JEDG(2, 2) /  1, 5 /
        DATA JEDG(1, 3),JEDG(2, 3) /  1, 7 /
        DATA JEDG(1, 4),JEDG(2, 4) /  1, 9 /
        DATA JEDG(1, 5),JEDG(2, 5) /  1,11 /
        DATA JEDG(1, 6),JEDG(2, 6) /  2, 4 /
        DATA JEDG(1, 7),JEDG(2, 7) /  2, 6 /
        DATA JEDG(1, 8),JEDG(2, 8) /  2, 8 /
        DATA JEDG(1, 9),JEDG(2, 9) /  2,10 /
        DATA JEDG(1,10),JEDG(2,10) /  2,12 /
        DATA JEDG(1,11),JEDG(2,11) /  3, 5 /
        DATA JEDG(1,12),JEDG(2,12) /  3, 8 /
        DATA JEDG(1,13),JEDG(2,13) /  3,10 /
        DATA JEDG(1,14),JEDG(2,14) /  3,11 /
        DATA JEDG(1,15),JEDG(2,15) /  4, 6 /
        DATA JEDG(1,16),JEDG(2,16) /  4, 7 /
        DATA JEDG(1,17),JEDG(2,17) /  4, 9 /
        DATA JEDG(1,18),JEDG(2,18) /  4,12 /
        DATA JEDG(1,19),JEDG(2,19) /  5, 7 /
        DATA JEDG(1,20),JEDG(2,20) /  5,10 /
        DATA JEDG(1,21),JEDG(2,21) /  5,12 /
        DATA JEDG(1,22),JEDG(2,22) /  6, 8 /
        DATA JEDG(1,23),JEDG(2,23) /  6, 9 /
        DATA JEDG(1,24),JEDG(2,24) /  6,11 /
        DATA JEDG(1,25),JEDG(2,25) /  7, 9 /
        DATA JEDG(1,26),JEDG(2,26) /  7,12 /
        DATA JEDG(1,27),JEDG(2,27) /  8,10 /
        DATA JEDG(1,28),JEDG(2,28) /  8,11 /
        DATA JEDG(1,29),JEDG(2,29) /  9,11 /
        DATA JEDG(1,30),JEDG(2,30) / 10,12 /
C
C Define the 12 vertices of the icosahedron (note radius less than one).
C
        DATA XCVI / .0000000000000 ,  .0000000000000 , -.8506508083520 ,
     +              .8506508083520 , -.2628655560596 ,  .2628655560596 ,
     +              .6881909602356 , -.6881909602356 ,  .6881909602356 ,
     +             -.6881909602356 , -.2628655560595 ,  .2628655560596 /
        DATA YCVI / .0000000000000 ,  .0000000000000 ,  .0000000000000 ,
     +              .0000000000000 , -.8090169943749 ,  .8090169943749 ,
     +             -.5000000000000 ,  .5000000000000 ,  .5000000000000 ,
     +             -.5000000000000 ,  .8090169943749 , -.8090169943749 /
        DATA ZCVI / .9510565162952 , -.9510565162951 ,  .4253254041760 ,
     +             -.4253254041760 ,  .4253254041760 , -.4253254041760 ,
     +              .4253254041760 , -.4253254041760 ,  .4253254041760 ,
     +             -.4253254041760 ,  .4253254041760 , -.4253254041760 /
C
C Define a constant to convert from radians to degrees.
C
        DATA RTOD / 57.2957795130823 /
C
C Enlarge the icosahedron to have a radius of one and compute lat/lon
C coordinates of the points.
C
        DO 101 I=1,12
          DNOM=SQRT(XCVI(I)**2+YCVI(I)**2+ZCVI(I)**2)
          XCVI(I)=XCVI(I)/DNOM
          YCVI(I)=YCVI(I)/DNOM
          ZCVI(I)=ZCVI(I)/DNOM
          RLAT(I)=RTOD*ASIN(ZCVI(I))
          IF (XCVI(I).EQ.0..AND.YCVI(I).EQ.0.) THEN
            RLON(I)=0.
          ELSE
            RLON(I)=RTOD*ATAN2(YCVI(I),XCVI(I))
          END IF
  101   CONTINUE
C
C Draw the edges of the icosahedron, projected outwards onto the surface
C of the sphere.
C
        CALL PLOTIF (0.,0.,2)
        CALL GSLWSC (2.)
        CALL GSPLCI (1)
        CALL GSFACI (1)
C
        DO 102 I=1,30
          CALL DRSGCR (RLAT(JEDG(1,I)),RLON(JEDG(1,I)),
     +                 RLAT(JEDG(2,I)),RLON(JEDG(2,I)))
  102   CONTINUE
C
        CALL PLOTIF (0.,0.,2)
        CALL GSLWSC (1.)
C
C Mark the vertices of the icosahedron.
C
        DO 103 I=1,12
          CALL MAPTRA (RLAT(I),RLON(I),XVAL,YVAL)
          IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
            CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),.0075,.0075,0.,4.)
          END IF
  103   CONTINUE
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE ELLIPS (XCFR,YCFR,RADA,RADB,ROTD,DSTP)
C
C This routine fills an ellipse.  The arguments are as follows:
C
C   XCFR and YCFR are the coordinates of the center of the ellipse, in
C   the fractional coordinate system.
C
C   RADA is the length of the semimajor axis of the ellipse (i.e., the
C   distance from the center of the ellipse to one of the two points on
C   the ellipse which are furthest from the center).  This is a distance
C   in the fractional coordinate system.
C
C   RADB is the length of the semiminor axis of the ellipse (i.e., the
C   distance from the center of the ellipse to one of the two points on
C   the ellipse which are nearest to the center).  This is a distance in
C   the fractional coordinate system.
C
C   ROTD is a rotation angle, in degrees.  If ROTD is 0, the major axis
C   of the ellipse is horizontal.  If ROTD is 90, the major axis is
C   vertical.
C
C   DSTP is the step size, in degrees, between any two consecutive
C   points used to draw the ellipse.  The actual value used will be
C   limited to the range from .1 degrees (3600 points used to draw
C   the ellipse) to 90 degrees (4 points used to draw the ellipse).
C
C Declare work arrays to hold the coordinates.
C
        DIMENSION XCRA(3601),YCRA(3601)
C
C DTOR is pi over 180, used to convert an angle from degrees to radians.
C
        DATA DTOR / .017453292519943 /
C
C Get the rotation angle in radians.
C
        ROTR=DTOR*ROTD
C
C Compute the number of steps to be used to draw the ellipse and the
C actual number of degrees for each step.
C
        NSTP=MAX(4,MIN(3600,INT(360./MAX(.1,MIN(90.,DSTP)))))
        RSTP=360./NSTP
C
C Compute coordinates for the ellipse (just some trigonometry).
C
        DO 101 ISTP=0,NSTP
          ANGL=DTOR*REAL(ISTP)*RSTP
          XTMP=RADA*COS(ANGL)
          YTMP=RADB*SIN(ANGL)
          XCRA(ISTP+1)=CFUX(XCFR+XTMP*COS(ROTR)-YTMP*SIN(ROTR))
          YCRA(ISTP+1)=CFUY(YCFR+XTMP*SIN(ROTR)+YTMP*COS(ROTR))
  101   CONTINUE
C
C Fill it.
C
        CALL GFA (NSTP+1,XCRA,YCRA)
C
C Draw it.
C
        CALL GPL (NSTP+1,XCRA,YCRA)
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE SORTEM (RWRK,NRWK,IORD,IWRK)
C
        DIMENSION RWRK(NRWK),IWRK(NRWK)
C
C Given an array of NRWK reals in an array RWRK and an order flag
C IORD, this routine returns a permutation vector IWRK such that, for
C every I and J such that 1.LE.I.LE.J.LE.NRWK, if IORD is zero, then
C RWRK(IWRK(I)).LE.RWRK(IWRK(J)), else RWRK(IWRK(I)).GE.RWRK(IWRK(J)).
C
        DO 101 I=1,NRWK
          IWRK(I)=I
  101   CONTINUE
C                                                                       
        K=0
C
  102   IF (3*K+1.LT.NRWK) THEN
          K=3*K+1
          GO TO 102
        END IF
C                                                                       
        IF (IORD.EQ.0) THEN
C
  103     IF (K.GT.0) THEN
C
            DO 105 I=1,NRWK-K
C
              J=I
C
  104         IF (RWRK(IWRK(J)).LE.RWRK(IWRK(J+K))) GO TO 105
              ITMP=IWRK(J)
              IWRK(J)=IWRK(J+K)
              IWRK(J+K)=ITMP
              J=J-K
              IF (J.LT.1) GO TO 105
              GO TO 104
C
  105       CONTINUE
C
            K=(K-1)/3
C
            GO TO 103
C
          END IF
C
        ELSE
C
  106     IF (K.GT.0) THEN
C
            DO 108 I=1,NRWK-K
C
              J=I
C
  107         IF (RWRK(IWRK(J)).GE.RWRK(IWRK(J+K))) GO TO 108
              ITMP=IWRK(J)
              IWRK(J)=IWRK(J+K)
              IWRK(J+K)=ITMP
              J=J-K
              IF (J.LT.1) GO TO 108
              GO TO 107
C
  108       CONTINUE
C
            K=(K-1)/3
C
            GO TO 106
C
          END IF
C
        END IF
C
C Done.
C
        RETURN
C
      END                                                               


      SUBROUTINE CTSCAE (ICRA,ICA1,ICAM,ICAN,XCPF,YCPF,XCQF,YCQF,
     +                                       IND1,IND2,ICAF,IAID)
        DIMENSION ICRA(ICA1,*)
C
C This routine is called by CTCICA when the internal parameter 'CAF' is
C given a negative value.  Each call is intended to create a particular
C element in the user's cell array.  The arguments are as follows:
C
C ICRA is the user's cell array.
C
C ICA1 is the first dimension of the FORTRAN array ICRA.
C
C ICAM and ICAN are the first and second dimensions of the cell array
C stored in ICRA.
C
C (XCPF,YCPF) is the point at that corner of the rectangular area
C into which the cell array maps that corresponds to the cell (1,1).
C The coordinates are given in the fractional coordinate system (unlike
C what is required in a call to GCA, in which the coordinates of the
C point P are in the world coordinate system).
C
C (XCQF,YCQF) is the point at that corner of the rectangular area into
C which the cell array maps that corresponds to the cell (ICAM,ICAN).
C The coordinates are given in the fractional coordinate system (unlike
C what is required in a call to GCA, in which the coordinates of the
C point Q are in the world coordinate system).
C
C IND1 is the 1st index of the cell that is to be updated.
C
C IND2 is the 2nd index of the cell that is to be updated.
C
C ICAF is the current value of the internal parameter 'CAF'.  This
C value will always be an integer which is less than zero (because
C when 'CAF' is zero or greater, this routine is not called).
C
C IAID is the area identifier associated with the cell.  It will have
C been given one of the values from the internal parameter array 'AIA'
C (the one for 'PAI' = -2 if the cell lies in an out-of-range area, the
C one for 'PAI' = -1 if the cell lies off the data grid, or the one for
C some value of 'PAI' between 1 and 'NCL' if the cell lies on the data
C grid).  The value zero may occur if the cell falls in an out-of-range
C area and the value of 'AIA' for 'PAI' = -2 is 0 or if the cell lies
C off the data grid and the value of 'AIA' for 'PAI' = -1 is 0, or if
C the cell falls on the data grid, but no contour level below the cell
C has a non-zero 'AIA' and no contour level above the cell has a
C non-zero 'AIB'.  Note that, if the values of 'AIA' for 'PAI' = -1
C and -2 are given non-zero values, IAID can only be given a zero
C value in one way.
C
C The default behavior of CTSCAE is as follows:  If the area identifier
C is non-negative, it is treated as a color index, to be stored in the
C appropriate cell in the cell array; but if the area identifier is
C negative, a zero is stored for the color index.  The user may supply
C a version of CTSCAE that does something different; it may simply map
C the area identifiers into color indices or it may somehow modify the
C existing cell array element to incorporate the information provided
C by the area identifier.
C
C       ICRA(IND1,IND2)=MAX(0,IAID)
C
C What follows is not the default behavior; instead, it is the behavior
C expected by many of the example programs for CONPACKT.
C
        CALL CTGETI ('NCL - NUMBER OF CONTOUR LEVELS',NOCL)
C
        IF (IAID.GE.1.AND.IAID.LE.NOCL+1) THEN
          ICRA(IND1,IND2)=151+INT(((REAL(IAID)-.5)/REAL(NOCL+1))*100.)
        ELSE IF (IAID.EQ.1001) THEN
          ICRA(IND1,IND2)=2
        ELSE IF (IAID.EQ.1002) THEN
          ICRA(IND1,IND2)=3
        END IF
C
        RETURN
C
      END
