

      PROGRAM CTFITE
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
C the use of a triangular mesh created from a POP grid on the surface
C of the globe.  The triangular mesh is created from the rectangular
C grid by calling the CONPACKT routine CTTMRG.  The data on the grid
C were obtained from Marika Holland and represent ice thickness, in
C meters.
C
C Selected frames are drawn for each of four different viewpoints.  If
C (CLAT,CLON) is the approximate position of the "center point" of the
C mesh (which is defined somewhat arbitrarily for certain meshes), the
C four viewpoints used are as follows: (CLAT+45,CLON), (CLAT-45,CLON),
C (CLAT+45,CLON+180), and (CLAT-45,CLON+180).
C
C At each of the four viewpoints, up to six different frames are drawn:
C
C   1) A frame that attempts to show how the original rectangular
C      grid is mapped onto the globe.  A little reference image of
C      the rectangular grid appears in the lower left corner of the
C      frame and a large image of the grid wrapped around the globe
C      appears in the middle of the frame.  Each image is colored using
C      a 10x10 rectangular array of different colors and, on each, the
C      corner points, the midpoints of the edges and the midpoint of
C      the whole grid are marked.  This frame is drawn only if the
C      parameter IMSH = 1, 3, 5, or 7.
C
C   2) A frame showing the original rectangular grid on the globe.
C      This frame is drawn only if the parameter IMSH = 2, 3, 6, or 7.
C
C   3) A frame showing the triangular mesh on the globe.  This frame
C      is drawn only if the parameter IMSH = 4, 5, 6, or 7.
C
C   4) A frame showing simple contours on the globe.  This frame is
C      drawn only if the parameter ICON is non-zero.
C
C   5) A frame showing color-filled contour bands on the globe, drawn
C      using filled areas.  This frame is drawn only if the parameter
C      ICOL is non-zero.
C
C   6) A frame showing color-filled contour bands on the globe, drawn
C      using a cell array.  This frame is drawn only if the parameter
C      ICAP is non-zero.
C
C Define the parameter that says which frames showing the rectangular
C grid and/or the triangular mesh are to be drawn (frames 1 through 3):
C
C       PARAMETER (IMSH=0)  !  none of the three
C       PARAMETER (IMSH=1)  !  colored rectangular grid only
C       PARAMETER (IMSH=2)  !  simple rectangular grid only
C       PARAMETER (IMSH=3)  !  colored and simple rectangular grids
C       PARAMETER (IMSH=4)  !  triangular only
C       PARAMETER (IMSH=5)  !  colored rectangular and triangular
C       PARAMETER (IMSH=6)  !  simple rectangular and triangular
C       PARAMETER (IMSH=7)  !  all three
C
        PARAMETER (IMSH=7)
C
C Define the parameter that says whether or not to draw simple contours
C (frame 4):
C
C       PARAMETER (ICON=0)  !  contours not drawn
C       PARAMETER (ICON=1)  !  contours drawn
C
        PARAMETER (ICON=1)
C
C Define the parameter that says whether or not to draw color-filled
C contours (frame 5):
C
C       PARAMETER (ICOL=0)  !  no color fill done
C       PARAMETER (ICOL=1)  !  color fill done
C
        PARAMETER (ICOL=1)
C
C Define the parameter that says whether or not to draw a cell array
C plot (frame 6):
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
C      removing it from the mesh.
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
C The maximum numbers of points, edges, and triangles in a triangular
C mesh can be computed in the following manner:  Since the triangular
C mesh is created from a rectangular one by splitting each rectangular
C cell in half, we can declare the largest values we expect to use for
C the dimensions of that mesh:
C
        PARAMETER (IDIM=321,JDIM=384,IDM1=IDIM-1,JDM1=JDIM-1)
C
C and then compute from those values the maximum number of points,
C edges, and triangles that the triangular mesh arrays will need to
C hold.  The computed values will be exactly as required if no points
C or edges of the rectangular grid are repeated in it; if there are
C repeating points or edges, space for slightly fewer points and edges
C will be needed:
C
        PARAMETER (MNOP=IDIM*JDIM)
        PARAMETER (MNOE=3*IDM1*JDM1+IDM1+JDM1)
        PARAMETER (MNOT=2*IDM1*JDM1)
C
C Once we know how many points, edges, and triangles we're going to use
C (at most), we can set parameters defining the space reserved for the
C triangular mesh:
C
        PARAMETER (MPNT=MNOP*LOPN)
        PARAMETER (MEDG=MNOE*LOEN)
        PARAMETER (MTRI=MNOT*LOTN)
C
C Declare the arrays to hold the point nodes, edge nodes, and triangle
C nodes defining the triangular mesh.
C
        DIMENSION RPNT(MPNT),IEDG(MEDG),ITRI(MTRI)
C
C Declare real and integer workspaces needed by CONPACKT.
C
        PARAMETER (LRWK=10000,LIWK=1000)
C
        DIMENSION RWRK(LRWK),IWRK(LIWK)
C
C Declare the area map array needed to do solid fill.
C
        PARAMETER (LAMA=400000)
C
        DIMENSION IAMA(LAMA)
C
C Declare workspace arrays to be used in calls to ARSCAM.
C
        PARAMETER (NCRA=LAMA/10,NGPS=2)
C
        DIMENSION XCRA(NCRA),YCRA(NCRA),IAAI(NGPS),IAGI(NGPS)
C
C Declare arrays in which to generate a cell array picture of the
C data on the triangular mesh.
C
C       PARAMETER (ICAM=1024,ICAN=1024)
        PARAMETER (ICAM= 512,ICAN= 512)
C
        DIMENSION ICRA(ICAM,ICAN)
C
C Declare arrays to hold color components for colors to be used at the
C four corners of an illustrative drawing of the rectangular grid.
C
        DIMENSION CCLL(3),CCLR(3),CCUL(3),CCUR(3)
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
C Define the colors to be used in the lower left, lower right, upper
C left, and upper right corners of the rectangular grid when a drawing
C of it is made for the purpose of illustrating how it is wrapped around
C the globe.
C
        DATA CCLL / 0.2 , 0.2 , 0.2 /
        DATA CCLR / 1.0 , 0.0 , 1.0 /
        DATA CCUL / 0.0 , 1.0 , 1.0 /
        DATA CCUR / 1.0 , 1.0 , 0.0 /
C
C Define a constant to convert from radians to degrees.
C
        DATA RTOD / 57.2957795130823 /
C
C Read data and generate the required triangular mesh.
C
        PRINT * , ' '
        PRINT * , 'CREATING TRIANGULAR MESH:'
C
        CALL GTFITE (RPNT,MPNT,NPNT,LOPN,
     +               IEDG,MEDG,NEDG,LOEN,
     +               ITRI,MTRI,NTRI,LOTN,
     +               CLAT,CLON)
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
C Define 100 colors, associated with color indices 51 through 150, to
C be used in making an illustrative drawing of the rectangular grid.
C
        CALL DCFGRD (IWID,51,10,10,CCLL,CCLR,CCUL,CCUR)
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
C If the rectangular grid and/or the triangular mesh are to be drawn,
C do it.
C
          IF (IMSH.NE.0) THEN
C
            PRINT * , 'DRAWING MESHES'
C
C Colored rectangular grid:
C
            IF (MOD(IMSH,2).NE.0) THEN
C
              PRINT * , 'DRAWING COLORED RECTANGULAR GRID'
C
              CALL DCFITE
C
C Label the first frame.
C
              CALL PLCHHQ (CFUX(.03),CFUY(.946),'POP GRID',
     +                                                      .024,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.908),'(from Marika Holland)',
     +                                                      .014,0.,-1.)
              IF      (IDIR.EQ.1) THEN
                CALL PLCHHQ (CFUX(.45),CFUY(.84),
     +                       'The top edge of the grid maps,',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.82),
     +                       'not to the North Pole, but to',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.80),
     +                       'a little circle over Greenland.',
     +                                                       .010,0.,1.)
              ELSE IF (IDIR.EQ.2) THEN
                CALL PLCHHQ (CFUX(.55),CFUY(.29),
     +                       'The bottom edge of the grid maps',
     +                                                      .010,0.,-1.)
                CALL PLCHHQ (CFUX(.55),CFUY(.27),
     +                       'to a circle around the South Pole.',
     +                                                      .010,0.,-1.)
              ELSE IF (IDIR.EQ.3) THEN
                CALL PLCHHQ (CFUX(.55),CFUY(.79),
     +                       'The top edge of the grid maps,',
     +                                                      .010,0.,-1.)
                CALL PLCHHQ (CFUX(.55),CFUY(.77),
     +                       'not to the North Pole, but to',
     +                                                      .010,0.,-1.)
                CALL PLCHHQ (CFUX(.55),CFUY(.75),
     +                       'a little circle over Greenland.',
     +                                                      .010,0.,-1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.52),
     +                       'Left and right edges of',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.50),
     +                       'the grid map to a "seam"',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.48),
     +                       'on one of the meridians.',
     +                                                       .010,0.,1.)
              ELSE IF (IDIR.EQ.4) THEN
                CALL PLCHHQ (CFUX(.45),CFUY(.44),
     +                       'The bottom edge of the grid maps',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.42),
     +                       'to a circle around the South Pole.',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.72),
     +                       'Left and right edges of',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.70),
     +                       'the grid map to a "seam"',
     +                                                       .010,0.,1.)
                CALL PLCHHQ (CFUX(.45),CFUY(.68),
     +                       'on one of the meridians.',
     +                                                       .010,0.,1.)
              END IF
C
              IF      (IDIR.EQ.1) THEN
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
              CALL PLCHHQ (CFUX(.97),CFUY(.950),'MAPPING OF THE GRID',
     +                                                       .012,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.926),'ONTO THE GLOBE',
     +                                                       .012,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.904),'(Color swatches, bold'
     +                                                      ,.010,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.884),'edges, and big dots',
     +                                                       .010,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.864),'are all intended',
     +                                                       .010,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.844),'to clarify the',
     +                                                       .010,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.824),'mapping.)',
     +                                                       .010,0.,1.)
C
              CALL PLCHHQ (CFUX(.97),CFUY(.060),'Shorelines are blue.',
     +                                                       .012,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.036),'Parallels/meridians are
     + red.',.012,0.,1.)
C
C Advance the frame.
C
              CALL FRAME
C
            END IF
C
C Simple rectangular grid:
C
            IF (MOD(IMSH/2,2).NE.0) THEN
C
              PRINT * , 'DRAWING SIMPLE RECTANGULAR GRID'
C
              CALL DSFITE
C
C Label the second frame.
C
              CALL PLCHHQ (CFUX(.03),CFUY(.946),'POP GRID',
     +                                                      .024,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.908),'(from Marika Holland)',
     +                                                      .014,0.,-1.)
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
              CALL PLCHHQ (CFUX(.97),CFUY(.950),'ORIGINAL RECTANGULAR GR
     +ID',.012,0.,1.)
C
              CALL PLCHHQ (CFUX(.97),CFUY(.928),
     +                     'Portions of the grid with missing data',
     +                                                       .010,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.908),
     +                     '(over land areas) are drawn',
     +                                                       .010,0.,1.)
              CALL PLCHHQ (CFUX(.97),CFUY(.888),
     +                     'in a lighter gray.',
     +                                                       .010,0.,1.)
C
              CALL PLCHHQ (CFUX(.03),CFUY(.084),'Grid is gray.',
     +                                                      .012,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.060),'Shorelines are blue.',
     +                                                      .012,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.036),'Parallels/meridians are
     + red.',.012,0.,-1.)
C
C Advance the frame.
C
              CALL FRAME
C
            END IF
C
C Triangular mesh (with edges between blocked triangles somewhat fainter
C than the rest):
C
            IF (MOD(IMSH/4,2).NE.0) THEN
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
     +              RPNT(IEDG(IPTE+1)+2).EQ.0.) THEN
                  ALON=0.
                ELSE
                  ALON=RTOD*ATAN2(RPNT(IEDG(IPTE+1)+2),
     +                            RPNT(IEDG(IPTE+1)+1))
                END IF
C
                BLAT=RTOD*ASIN(RPNT(IEDG(IPTE+2)+3))
C
                IF (RPNT(IEDG(IPTE+2)+1).EQ.0..AND.
     +              RPNT(IEDG(IPTE+2)+2).EQ.0.) THEN
                  BLON=0.
                ELSE
                  BLON=RTOD*ATAN2(RPNT(IEDG(IPTE+2)+2),
     +                            RPNT(IEDG(IPTE+2)+1))
                END IF
C
                CALL DRSGCR (ALAT,ALON,BLAT,BLON)
C
  101         CONTINUE
C
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (13)
              CALL MAPGRD
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (14)
              CALL MAPLOT
C
C Label the third frame.
C
              CALL PLCHHQ (CFUX(.03),CFUY(.946),'POP GRID',
     +                                                      .024,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.908),'(from Marika Holland)',
     +                                                      .014,0.,-1.)
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
              CALL PLCHHQ (CFUX(.97),CFUY(.950),'DERIVED TRIANGULAR MESH
     +',.012,0.,1.)
C
              CALL PLCHHQ (CFUX(.03),CFUY(.084),'Mesh is gray.',
     +                                                      .012,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.060),'Shorelines are blue.',
     +                                                      .012,0.,-1.)
              CALL PLCHHQ (CFUX(.03),CFUY(.036),'Parallels/meridians are
     + red.',.012,0.,-1.)
C
C Advance the frame.
C
              CALL FRAME
C
            END IF
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
C Label the fourth frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'POP GRID',
     +                                                      .024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.908),'(from Marika Holland)',
     +                                                      .014,0.,-1.)
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
C
            CALL PLCHHQ (CFUX(.97),CFUY(.904),'Data on the mesh show',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.884),'sea-ice thickness',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.864),'in meters.',
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
C Label the fifth frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'POP GRID',
     +                                                      .024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.908),'(from Marika Holland)',
     +                                                      .014,0.,-1.)
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
            CALL PLCHHQ (CFUX(.97),CFUY(.904),'Data on the mesh show',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.884),'sea-ice thickness',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.864),'in meters.',
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
C Label the sixth frame.
C
            CALL PLCHHQ (CFUX(.03),CFUY(.946),'POP GRID',
     +                                                      .024,0.,-1.)
            CALL PLCHHQ (CFUX(.03),CFUY(.908),'(from Marika Holland)',
     +                                                      .014,0.,-1.)
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
            CALL PLCHHQ (CFUX(.97),CFUY(.904),'Data on the mesh show',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.884),'sea-ice thickness',
     +                                                       .010,0.,1.)
            CALL PLCHHQ (CFUX(.97),CFUY(.864),'in meters.',
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


      SUBROUTINE GTFITE (RPNT,MPNT,NPNT,LOPN,
     +                   IEDG,MEDG,NEDG,LOEN,
     +                   ITRI,MTRI,NTRI,LOTN,
     +                             CLAT,CLON)
C
        DIMENSION RPNT(MPNT),IEDG(MEDG),ITRI(MTRI)
C
C The grid for this example is basically a POP grid: it is rectangular
C and, at each point, we have a latitude, a longitude, and a data value;
C values over land have a special value that marks them as "missing".
C From this, we construct a triangular mesh.  First, define dimensions:
C
        PARAMETER (IDIM=321,JDIM=384)
        PARAMETER (IDM1=IDIM-1,JDM1=JDIM-1)
C
C Declare arrays to receive the data.  XLAT is the array of latitudes,
C XLON the array of longitudes, and ZDAT the array of ice thicknesses.
C Each of these arrays has one point of overlap in the first dimension:
C for each value of J from 1 to JDIM, a value indexed [1,J] is the same
C as a value indexed [IDIM,J].
C
        COMMON /CMFITE/ XLAT(IDIM,JDIM),XLON(IDIM,JDIM),ZDAT(IDIM,JDIM)
        SAVE   /CMFITE/
C
C Each cell of the rectangular grid for which data is available at all
C four corners is split in half along one of its diagonals; resulting
C triangles form the triangular mesh.  As we create the triangular mesh,
C we have to keep track of where the points and edges of the rectangular
C grid were put (so as to avoid the problem of duplicating points and
C edges in the structure).  The array ISCR is used for this.
C
        DIMENSION ISCR(4,IDIM,JDIM)
C
C Declare external a routine to tell CTTMRG about points of overlap on
C the POP grid.
C
        EXTERNAL MIFITE
C
C Define the value that indicates a missing datum in this grid.
C
        DATA SVAL / 1.E30 /
C
C Read the data from an ASCII input file.
C
        OPEN (11,FILE='ctfite.dat',STATUS='OLD',FORM='FORMATTED')
C
        READ (11,'(5E16.0)') ((XLAT(I,J),I=1,IDIM),J=1,JDIM)
        READ (11,'(5E16.0)') ((XLON(I,J),I=1,IDIM),J=1,JDIM)
        READ (11,'(5E16.0)') ((ZDAT(I,J),I=1,IDIM),J=1,JDIM)
C
        CLOSE (11)
C
C Call a general-purpose subroutine that accepts a rectangular grid
C mapped onto the surface of the globe and returns a triangular mesh
C equivalent to it.
C
        CALL CTTMRG (IDIM,JDIM,XLAT,XLON,ZDAT,ISCR,SVAL,MIFITE,
     +               RPNT,MPNT,NPNT,LOPN,
     +               IEDG,MEDG,NEDG,LOEN,
     +               ITRI,MTRI,NTRI,LOTN)
C
C Return the latitude and longitude of the approximate center point of
C the mesh on the globe.
C
        CLAT=XLAT(IDIM/2,JDIM/2)
        CLON=XLON(IDIM/2,JDIM/2)
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE MIFITE (IDIM,JDIM,IINI,JINI,IINO,JINO)
C
C Given the dimensions, IDIM and JDIM, of a simple lat/lon grid on the
C globe, and the indices, IINI and JINI, of a point on the grid, this
C routine returns the indices, IINO and JINO, of that coincident point
C on the grid which is to be used to represent it.  This version assumes
C that the right and left edges of the grid lie on top of each other.
C
        IF (IINI.EQ.IDIM) THEN
          IINO=1
          JINO=JINI
        ELSE
          IINO=IINI
          JINO=JINI
        END IF
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE DSFITE
C
C Draw the original grid, using data passed in a common block.
C
        PARAMETER (IDIM=321,JDIM=384,IDM1=IDIM-1,JDM1=JDIM-1)
C
        COMMON /CMFITE/ XLAT(IDIM,JDIM),XLON(IDIM,JDIM),ZDAT(IDIM,JDIM)
        SAVE   /CMFITE/
C
C Define the value that indicates a missing datum in this grid.
C
        DATA SVAL / 1.E30 /
C
C Draw the grid.
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (8)
C
        DO 102 I=1,IDM1
          DO 101 J=1,JDM1
            IF (ZDAT(I,J).NE.SVAL.AND.ZDAT(I,J+1).NE.SVAL) THEN
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (8)
            ELSE
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (9)
            END IF
            CALL DRSGCR (XLAT(I,J),XLON(I,J),XLAT(I,J+1),XLON(I,J+1))
  101     CONTINUE
  102   CONTINUE
C
        DO 104 J=1,JDIM
          DO 103 I=1,IDM1
            IF (ZDAT(I,J).NE.SVAL.AND.ZDAT(I+1,J).NE.SVAL) THEN
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (8)
            ELSE
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (9)
            END IF
            CALL DRSGCR (XLAT(I,J),XLON(I,J),XLAT(I+1,J),XLON(I+1,J))
  103     CONTINUE
  104   CONTINUE
C
C Draw the continental outlines and lat/lon grid.
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (13)
        CALL MAPGRD
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (14)
        CALL MAPLOT
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE DCFITE
C
C Draw the original grid, using data passed in a common block.
C
        PARAMETER (IDIM=321,JDIM=384,IDM1=IDIM-1,JDM1=JDIM-1)
C
        COMMON /CMFITE/ XLAT(IDIM,JDIM),XLON(IDIM,JDIM),ZDAT(IDIM,JDIM)
        SAVE   /CMFITE/
C
        COMMON /CMGRID/ IWID,IFCI,MCOL,NCOL
        SAVE   /CMGRID/
C
C Declare arrays to use for solid fill.
C
        DIMENSION XBOX(4),YBOX(4)
C
C Define the major and minor axes of the ellipses that mark selected
C points on the grid.
C
        DATA RADA,RADB / .010,.010 /
C
C Define a constant to convert from degrees to radians.
C
        DATA DTOR / .017453292519943 /
C
C Fill the grid box by box.
C
        DO 102 I=1,IDM1
          ICOL=INT(10.*REAL(I-1)/REAL(IDM1))
          DO 101 J=1,JDM1
            JCOL=INT(10.*REAL(J-1)/REAL(JDM1))
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (51+10*ICOL+JCOL)
            CALL GSFACI (51+10*ICOL+JCOL)
            XCOA=COS(DTOR*XLAT(I  ,J  ))*COS(DTOR*XLON(I  ,J  ))
            YCOA=COS(DTOR*XLAT(I  ,J  ))*SIN(DTOR*XLON(I  ,J  ))
            ZCOA=SIN(DTOR*XLAT(I  ,J  ))
            CALL CTMXYZ (1,XCOA,YCOA,ZCOA,XBOX(1),YBOX(1))
            IF (XBOX(1).EQ.1.E12.OR.YBOX(1).EQ.1.E12) GO TO 101
            XCOA=COS(DTOR*XLAT(I+1,J  ))*COS(DTOR*XLON(I+1,J  ))
            YCOA=COS(DTOR*XLAT(I+1,J  ))*SIN(DTOR*XLON(I+1,J  ))
            ZCOA=SIN(DTOR*XLAT(I+1,J  ))
            CALL CTMXYZ (1,XCOA,YCOA,ZCOA,XBOX(2),YBOX(2))
            IF (XBOX(2).EQ.1.E12.OR.YBOX(2).EQ.1.E12) GO TO 101
            XCOA=COS(DTOR*XLAT(I+1,J+1))*COS(DTOR*XLON(I+1,J+1))
            YCOA=COS(DTOR*XLAT(I+1,J+1))*SIN(DTOR*XLON(I+1,J+1))
            ZCOA=SIN(DTOR*XLAT(I+1,J+1))
            CALL CTMXYZ (1,XCOA,YCOA,ZCOA,XBOX(3),YBOX(3))
            IF (XBOX(3).EQ.1.E12.OR.YBOX(3).EQ.1.E12) GO TO 101
            XCOA=COS(DTOR*XLAT(I  ,J+1))*COS(DTOR*XLON(I  ,J+1))
            YCOA=COS(DTOR*XLAT(I  ,J+1))*SIN(DTOR*XLON(I  ,J+1))
            ZCOA=SIN(DTOR*XLAT(I  ,J+1))
            CALL CTMXYZ (1,XCOA,YCOA,ZCOA,XBOX(4),YBOX(4))
            IF (XBOX(4).EQ.1.E12.OR.YBOX(4).EQ.1.E12) GO TO 101
            CALL GFA (4,XBOX,YBOX)
  101     CONTINUE
  102   CONTINUE
C
C Draw the continental outlines and lat/lon grid.
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (13)
        CALL MAPGRD
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (14)
        CALL MAPLOT
C
C In gray, draw those interior lines of the grid that separate boxes of
C different colors.
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (11)
C
        DO 104 I=2,IDM1
          DO 103 J=1,JDM1
            IF (INT(10.*REAL(I-1)/REAL(IDM1)).EQ.
     +          INT(10.*REAL(I-2)/REAL(IDM1))) GO TO 103
            CALL DRSGCR (XLAT(I,J),XLON(I,J),XLAT(I,J+1),XLON(I,J+1))
  103     CONTINUE
  104   CONTINUE
C
        DO 106 J=2,JDM1
          DO 105 I=1,IDM1
            IF (INT(10.*REAL(J-1)/REAL(JDM1)).EQ.
     +          INT(10.*REAL(J-2)/REAL(JDM1))) GO TO 105
            CALL DRSGCR (XLAT(I,J),XLON(I,J),XLAT(I+1,J),XLON(I+1,J))
  105     CONTINUE
  106   CONTINUE
C
C In the foreground color, outline the grid (using a thickened line).
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (1)
        CALL GSLWSC (2.)
C
        DO 108 I=1,IDIM,IDIM-1
          DO 107 J=1,JDM1
            CALL DRSGCR (XLAT(I,J),XLON(I,J),XLAT(I,J+1),XLON(I,J+1))
  107     CONTINUE
  108   CONTINUE
C
        DO 110 J=1,JDIM,JDIM-1
          DO 109 I=1,IDM1
            CALL DRSGCR (XLAT(I,J),XLON(I,J),XLAT(I+1,J),XLON(I+1,J))
  109     CONTINUE
  110   CONTINUE
C
        CALL PLOTIT (0,0,2)
        CALL GSLWSC (1.)
C
C Mark nine different reference points on the grid.
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (1)
        CALL GSFACI (1)
C
        CALL MAPTRA (XLAT(1,JDIM),XLON(1,JDIM),XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        CALL MAPTRA (XLAT(IDIM,JDIM),XLON(IDIM,JDIM),XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        CALL MAPTRA (XLAT(1,1),XLON(1,1),XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        CALL MAPTRA (XLAT(IDIM,1),XLON(IDIM,1),XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (1)
        CALL GSFACI (0)
C
        IF (MOD(IDIM,2).EQ.0) THEN
          CALL FPSGCR (XLAT(IDIM/2  ,JDIM),XLON(IDIM/2  ,JDIM),
     +                 XLAT(IDIM/2+1,JDIM),XLON(IDIM/2+1,JDIM),
     +                                                     .5,CLAT,CLON)
        ELSE
          CLAT=XLAT(IDIM/2+1,JDIM)
          CLON=XLON(IDIM/2+1,JDIM)
        END IF
        CALL MAPTRA (CLAT,CLON,XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        IF (MOD(JDIM,2).EQ.0) THEN
          CALL FPSGCR (XLAT(1,JDIM/2  ),XLON(1,JDIM/2  ),
     +                 XLAT(1,JDIM/2+1),XLON(1,JDIM/2+1),
     +                                                     .5,CLAT,CLON)
        ELSE
          CLAT=XLAT(1,JDIM/2+1)
          CLON=XLON(1,JDIM/2+1)
        END IF
        CALL MAPTRA (CLAT,CLON,XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        IF (MOD(JDIM,2).EQ.0) THEN
          CALL FPSGCR (XLAT(IDIM,JDIM/2  ),XLON(IDIM,JDIM/2  ),
     +                 XLAT(IDIM,JDIM/2+1),XLON(IDIM,JDIM/2+1),
     +                                                     .5,CLAT,CLON)
        ELSE
          CLAT=XLAT(IDIM,JDIM/2+1)
          CLON=XLON(IDIM,JDIM/2+1)
        END IF
        CALL MAPTRA (CLAT,CLON,XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        IF (MOD(IDIM,2).EQ.0) THEN
          CALL FPSGCR (XLAT(IDIM/2  ,1),XLON(IDIM/2  ,1),
     +                 XLAT(IDIM/2+1,1),XLON(IDIM/2+1,1),
     +                                                     .5,CLAT,CLON)
        ELSE
          CLAT=XLAT(IDIM/2+1,1)
          CLON=XLON(IDIM/2+1,1)
        END IF
        CALL MAPTRA (CLAT,CLON,XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
        CALL PLOTIT (0,0,2)
        CALL GSPLCI (1)
        CALL GSFACI (4)
C
        IF (MOD(IDIM,2).EQ.0) THEN
          IF (MOD(JDIM,2).EQ.0) THEN
            CALL IPIQOS(XLAT(IDIM/2  ,JDIM/2  ),XLON(IDIM/2  ,JDIM/2  ),
     +                  XLAT(IDIM/2+1,JDIM/2  ),XLON(IDIM/2+1,JDIM/2  ),
     +                  XLAT(IDIM/2  ,JDIM/2+1),XLON(IDIM/2  ,JDIM/2+1),
     +                  XLAT(IDIM/2+1,JDIM/2+1),XLON(IDIM/2+1,JDIM/2+1),
     +                                                  .5,.5,CLAT,CLON)
          ELSE
            CALL FPSGCR(XLAT(IDIM/2  ,JDIM/2+1),XLON(IDIM/2  ,JDIM/2+1),
     +                  XLAT(IDIM/2+1,JDIM/2+1),XLON(IDIM/2+1,JDIM/2+1),
     +                                                     .5,CLAT,CLON)
          END IF
        ELSE
          IF (MOD(JDIM,2).EQ.0) THEN
            CALL FPSGCR(XLAT(IDIM/2+1,JDIM/2  ),XLON(IDIM/2+1,JDIM/2  ),
     +                  XLAT(IDIM/2+1,JDIM/2+1),XLON(IDIM/2+1,JDIM/2+1),
     +                                                    .5,CLAT,CLON)
          ELSE
           CLAT=XLAT(IDIM/2+1,JDIM/2+1)
           CLON=XLON(IDIM/2+1,JDIM/2+1)
          END IF
        END IF
        CALL MAPTRA (CLAT,CLON,XVAL,YVAL)
        IF (XVAL.NE.1.E12.AND.YVAL.NE.1.E12) THEN
          CALL ELLIPS (CUFX(XVAL),CUFY(YVAL),RADA,RADB,0.,4.)
        END IF
C
C Draw a shaded reference grid in the lower left corner of the frame.
C
        CALL SHDGRD (.03,.28,.03,.30,IDM1,JDM1,3,7)
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


      SUBROUTINE DCFGRD (IAR1,IAR2,IAR3,IAR4,CCLL,CCLR,CCUL,CCUR)
C
        DIMENSION CCLL(3),CCLR(3),CCUL(3),CCUR(3),CCGC(3)
C
C This routine defines the colors to be used by SHDGRD.  CCLL, CCLR,
C CCUL, and CCUR define the RGB color components for the lower-left
C corner, the lower-right corner, the upper-left corner, and the
C upper-right corner, respectively, of the grid.  Other colors to be
C used are defined by interpolation.
C
        COMMON /CMGRID/ IWID,IFCI,MCOL,NCOL
        SAVE   /CMGRID/
C
C Transfer first four arguments to common block shared with SHDGRD.
C
        IWID=IAR1
        IFCI=IAR2
        MCOL=IAR3
        NCOL=IAR4
C
        DO 103 I=0,MCOL-1
          P=REAL(I)/REAL(MCOL-1)
          DO 102 J=0,NCOL-1
            Q=REAL(J)/REAL(NCOL-1)
            DO 101 K=1,3
              CCGC(K)=(1.-P)*((1.-Q)*CCLL(K)+Q*CCUL(K))+
     +                    P *((1.-Q)*CCLR(K)+Q*CCUR(K))
  101       CONTINUE
            CALL GSCR (IWID,IFCI+NCOL*I+J,
     +                 MAX(0.,MIN(1.,CCGC(1))),
     +                 MAX(0.,MIN(1.,CCGC(2))),
     +                 MAX(0.,MIN(1.,CCGC(3))))
  102     CONTINUE
  103   CONTINUE
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE SHDGRD (XVPL,XVPR,YVPB,YVPT,IMAX,JMAX,ITYP,IMRK)
C
C This routine draws a representation of a grid of IMAX by JMAX boxes
C (having IMAX+1 vertical lines and JMAX+1 horizontal lines) in the part
C of the plotter frame specified by XVPL, XVPR, YVPB, and YVPT.  Colors
C used are those specified by a superimposed grid of MCOL by NCOL colors
C with indices IFCI through IFCI+MCOL*NCOL-1.  If ITYP is 0, the grid
C is drawn, but not filled.  If ITYP is 1, the grid is filled.  If ITYP
C is 2, the grid is filled and then outlined in the foreground color.
C If ITYP is 3, the grid is filled, some of the interior grid lines (the
C ones between boxes of different colors) are drawn in gray, and then
C the grid is outlined in the foreground color.  If ITYP is 4, the grid
C is filled, all of the interior grid lines are drawn in gray, and then
C the grid is outlined in the foreground color.  If IMRK is 0, no points
C of the grid are marked with filled circles; if IMRK is 1, the corner
C points are marked with black-filled circles; if IMRK is 2, the edge
C points are marked with white-filled black circles; if IMRK is 4, the
C center point is marked with a red-filled black circle; sums of these
C values can be used to get combinations of behaviors.
C
        COMMON /CMGRID/ IWID,IFCI,MCOL,NCOL
        SAVE   /CMGRID/
C
        DIMENSION XBOX(5),YBOX(5)
C
C Define the major and minor axes of the ellipses that mark selected
C points on the grid.
C
        DATA RADA,RADB / .005,.005 /
C
C Save the current SET call.
C
        CALL GETSET (EVPL,EVPR,EVPB,EVPT,EWDL,EWDR,EWDB,EWDT,LNLG)
C
C Compute the coordinates of the center of the viewport in which the
C grid is to be drawn, its half-height, and its half-width.
C
        XVPC=(XVPR+XVPL)/2.
        YVPC=(YVPB+YVPT)/2.
        HVPW=(XVPR-XVPL)/2.
        HVPH=(YVPT-YVPB)/2.
C
C Compute values defining the exact viewport in which the grid is to
C be drawn and redo the set call appropriately.
C
        IF (REAL(IMAX)/REAL(JMAX).LE.(XVPR-XVPL)/(YVPT-YVPB)) THEN
          SVPL=XVPC-HVPH*(REAL(IMAX)/REAL(JMAX))
          SVPR=XVPC+HVPH*(REAL(IMAX)/REAL(JMAX))
          SVPB=YVPB
          SVPT=YVPT
        ELSE
          SVPL=XVPL
          SVPR=XVPR
          SVPB=YVPC-HVPW*(REAL(JMAX)/REAL(IMAX))
          SVPT=YVPC+HVPW*(REAL(JMAX)/REAL(IMAX))
        END IF
C
        CALL SET (SVPL,SVPR,SVPB,SVPT,0.,REAL(IMAX),0.,REAL(JMAX),1)
C
C If the lines are to be drawn in different colors ...
C
        IF (ITYP.EQ.0) THEN
C
C ... do it.
C
          DO 102 I=0,IMAX-1
            ICOL=INT(REAL(MCOL)*REAL(I)/REAL(IMAX))
            DO 101 J=0,JMAX-1
              JCOL=INT(REAL(NCOL)*REAL(J)/REAL(JMAX))
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (IFCI+NCOL*ICOL+JCOL)
              XBOX(1)=REAL(I)
              XBOX(2)=REAL(I+1)
              XBOX(3)=REAL(I+1)
              XBOX(4)=REAL(I)
              XBOX(5)=REAL(I)
              YBOX(1)=REAL(J)
              YBOX(2)=REAL(J)
              YBOX(3)=REAL(J+1)
              YBOX(4)=REAL(J+1)
              YBOX(5)=REAL(J)
              CALL GPL (5,XBOX,YBOX)
  101       CONTINUE
  102     CONTINUE
C
C Otherwise, the boxes are to be filled in different colors, so ...
C
        ELSE
C
C ... do it.
C
          DO 104 I=0,IMAX-1
            ICOL=INT(REAL(MCOL)*REAL(I)/REAL(IMAX))
            DO 103 J=0,JMAX-1
              JCOL=INT(REAL(NCOL)*REAL(J)/REAL(JMAX))
              CALL GSFACI (IFCI+NCOL*ICOL+JCOL)
              XBOX(1)=REAL(I)
              XBOX(2)=REAL(I+1)
              XBOX(3)=REAL(I+1)
              XBOX(4)=REAL(I)
              YBOX(1)=REAL(J)
              YBOX(2)=REAL(J)
              YBOX(3)=REAL(J+1)
              YBOX(4)=REAL(J+1)
              CALL GFA (4,XBOX,YBOX)
  103       CONTINUE
  104     CONTINUE
C
C In addition, if specified, draw lines on the grid ...
C
          IF (ITYP.GT.1) THEN
C
C ... either just the border ...
C
            IF (ITYP.GT.2) THEN
C
C ... or all the lines ...
C
              CALL PLOTIT (0,0,2)
              CALL GSPLCI (11)
C
              DO 105 I=1,IMAX-1
                IF (ITYP.GT.3.OR.
     +              INT(REAL(MCOL)*REAL(I-1)/REAL(IMAX)).NE.
     +              INT(REAL(MCOL)*REAL(I  )/REAL(IMAX)))
     +            CALL LINE (REAL(I),0.,REAL(I),REAL(JMAX))
  105         CONTINUE
C
              DO 106 J=1,JMAX-1
                IF (ITYP.GT.3.OR.
     +              INT(REAL(NCOL)*REAL(J-1)/REAL(JMAX)).NE.
     +              INT(REAL(NCOL)*REAL(J  )/REAL(JMAX)))
     +          CALL LINE (0.,REAL(J),REAL(IMAX),REAL(J))
  106         CONTINUE
C
            END IF
C
            CALL PLOTIT (0,0,2)
            CALL GSPLCI (1)
            CALL GSLWSC (2.)
C
            CALL LINE (        0.,        0.,REAL(IMAX),        0.)
            CALL LINE (REAL(IMAX),        0.,REAL(IMAX),REAL(JMAX))
            CALL LINE (REAL(IMAX),REAL(JMAX),        0.,REAL(JMAX))
            CALL LINE (        0.,REAL(JMAX),        0.,        0.)
C
            CALL PLOTIT (0,0,2)
            CALL GSLWSC (1.)
C
          END IF
C
        END IF
C
C If specified, mark a selected subset of nine different points of
C reference on the grid.
C
        IF (MOD(IMRK,2).NE.0) THEN
C
          CALL PLOTIT (0,0,2)
          CALL GSPLCI (1)
          CALL GSFACI (1)
C
          CALL ELLIPS (SVPL,SVPT,RADA,RADB,0.,4.)
          CALL ELLIPS (SVPR,SVPT,RADA,RADB,0.,4.)
          CALL ELLIPS (SVPL,SVPB,RADA,RADB,0.,4.)
          CALL ELLIPS (SVPR,SVPB,RADA,RADB,0.,4.)
C
        END IF
C
        IF (MOD(IMRK/2,2).NE.0) THEN
C
          CALL PLOTIT (0,0,2)
          CALL GSPLCI (1)
          CALL GSFACI (0)
C
          CALL ELLIPS (.5*(SVPL+SVPR),SVPT,RADA,RADB,0.,4.)
          CALL ELLIPS (SVPL,.5*(SVPB+SVPT),RADA,RADB,0.,4.)
          CALL ELLIPS (SVPR,.5*(SVPB+SVPT),RADA,RADB,0.,4.)
          CALL ELLIPS (.5*(SVPL+SVPR),SVPB,RADA,RADB,0.,4.)
C
        END IF
C
        IF (MOD(IMRK/4,2).NE.0) THEN
C
          CALL PLOTIT (0,0,2)
          CALL GSPLCI (1)
          CALL GSFACI (4)
C
          CALL ELLIPS (.5*(SVPL+SVPR),.5*(SVPB+SVPT),RADA,RADB,0.,4.)
C
        END IF
C
        CALL GSFACI (1)
C
C Label the bottom of the grid.
C
        CALL PLCHHQ (CFUX(.5*(SVPL+SVPR)),CFUY(SVPB-.018),
     +                                                'I-->',.012,0.,0.)
C
C Label the left edge of the grid.
C
        CALL PLCHHQ (CFUX(SVPL-.018),CFUY(.5*(SVPB+SVPT)),
     +                                               'J-->',.012,90.,0.)
C
C Restore the original SET call.
C
        CALL SET (EVPL,EVPR,EVPB,EVPT,EWDL,EWDR,EWDB,EWDT,LNLG)
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


      SUBROUTINE IPIQOS (ALAT,ALON,BLAT,BLON,CLAT,CLON,DLAT,DLON,
     +                                       XFRA,YFRA,ELAT,ELON)
C
C (IPIQOS = Interpolate Point In Quadrilateral on Sphere)
C
C This routine, given the latitudes and longitudes of four points (A, B,
C C, and D) forming a "quadrilateral" on the globe and two interpolation
C fractions (XFRA and YFRA, each between 0 and 1, inclusive), finds the
C point E defined by the following diagram and returns its latitude and
C longitude.
C
C                              C------Q----D
C                              |      |    |
C                              |      E    |
C                              |      |    |
C                              |      |    |
C                              A------P----B
C
C P and Q are positioned such that AP/AB = CQ/CD = XFRA and then E is
C positioned such that PE/PQ = YFRA (where "XY" is interpreted to mean
C "the shortest great circle distance from X to Y").
C
C It is assumed that the "quadrilateral" ABDC is "convex" (a working
C definition of which might be that none of the four great circles
C defined by its edges - the ones through A and B, B and D, D and C,
C and C and A - cross it anywhere.  However, this is not verified.
C
C The code is easy:
C
        CALL FPSGCR (ALAT,ALON,BLAT,BLON,XFRA,PLAT,PLON)
        CALL FPSGCR (CLAT,CLON,DLAT,DLON,XFRA,QLAT,QLON)
        CALL FPSGCR (PLAT,PLON,QLAT,QLON,YFRA,ELAT,ELON)
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE FPSGCR (ALAT,ALON,BLAT,BLON,FRCT,FLAT,FLON)
C
C (FPSGCR = Find Point on Shortest Great Circle Route)
C
        REAL    ALAT,ALON,BLAT,BLON,FRCT,FLAT,FLON
C
C This routine, given the latitudes and longitudes of two points A and
C B on the surface of the globe and a fraction FRCT, between 0. and 1.,
C interpolates a point F along the shortest great circle route joining
C A to B such that the distance from A to F, divided by the distance
C from A to B, is equal to FRCT, and returns its latitude and longitude
C in FLAT and FLON.
C
C Define the constants used to convert from degrees to radians and
C vice-versa.
C
        DATA DTOR / .017453292519943 /
        DATA RTOD / 57.2957795130823 /
C
C Compute the X, Y, and Z coordinates (on a unit sphere) of the point B.
C
        CALL LLPXYZ (BLAT,BLON,XCPB,YCPB,ZCPB)
C
C Rotating about the Z axis by the angle -ALON would carry A into the XZ
C plane.
C
        CALL ROTXYZ (3,-ALON,XCPB,YCPB,ZCPB)
C
C Then, rotating about the Y axis by the angle ALAT would carry A into
C the point on the X axis with coordinates (1,0,0).
C
        CALL ROTXYZ (2,ALAT,XCPB,YCPB,ZCPB)
C
C Then, rotating about the X axis by the angle ALPH = -ATAN(ZCPB/YCPB)
C would leave the position of A unchanged but carry B into a point in
C the XY plane.
C
        IF (ZCPB.NE.0..OR.YCPB.NE.0.) THEN
          ALPH=-RTOD*ATAN2(ZCPB,YCPB)
        ELSE
          ALPH=0.
        END IF
C
        CALL ROTXYZ (1,ALPH,XCPB,YCPB,ZCPB)
C
C The angle BETA from A to B can now be computed easily.
C
        IF (XCPB.NE.0..OR.YCPB.NE.0.) THEN
          BETA=ATAN2(YCPB,XCPB)
        ELSE
          BETA=0.
        END IF
C
C Interpolate a point at the desired position between the points A and
C B, map it back to its original position on the great circle route from
C A to B, and get its latitude and longitude to return to the caller.
C
        GAMA=FRCT*BETA
C
        XCPF=COS(GAMA)
        YCPF=SIN(GAMA)
        ZCPF=0.
C
        CALL ROTXYZ (1,-ALPH,XCPF,YCPF,ZCPF)
        CALL ROTXYZ (2,-ALAT,XCPF,YCPF,ZCPF)
        CALL ROTXYZ (3, ALON,XCPF,YCPF,ZCPF)
C
        CALL XYZLLP (XCPF,YCPF,ZCPF,FLAT,FLON)
C
C Done.
C
        RETURN
C
      END


      SUBROUTINE LLPXYZ (RLAT,RLON,RVOX,RVOY,RVOZ)
C
C (LLPXYZ = Lat/Lon Position to XYZ coordinates)
C
C Given the latitude and longitude of a point on the globe, return its
C X, Y, and Z coordinates.
C
        DATA DTOR / .017453292519943 /
C
        RVOX=COS(DTOR*RLAT)*COS(DTOR*RLON)
        RVOY=COS(DTOR*RLAT)*SIN(DTOR*RLON)
        RVOZ=SIN(DTOR*RLAT)
C
        RETURN
C
      END


      SUBROUTINE XYZLLP (RVOX,RVOY,RVOZ,RLAT,RLON)
C
C (XYZLLP = XYZ coordinates to Lat/Lon Position)
C
C Given the X, Y, and Z coordinates of a point on the globe, return its
C latitude and longitude.
C
        DATA RTOD / 57.2957795130823 /
C
        RLAT=RTOD*ASIN(RVOZ)
C
        IF (RVOX.NE.0.OR.RVOY.NE.0.) THEN
          RLON=RTOD*ATAN2(RVOY,RVOX)
        ELSE
          RLON=0.
        END IF
C
        RETURN
C
      END


      SUBROUTINE ROTXYZ (IAXS,ANGL,XCRD,YCRD,ZCRD)
C
C (ROTXYZ = ROTate a point defined by its X, Y, and Z coordinates)
C
C This is a modified version of a routine in the NCAR Graphics package,
C which is used in some of the examples.  It rotates the point having
C coordinates (XCRD,YCRD,ZCRD) by an angle ANGL about the axis specified
C by IAXS (1 for the X axis, 2 for the Y axis, 3 for the Z axis).
C
C One assumes a right-handed system with X, Y, and Z axes.  Rotating by
C an angle "a" about the X axis maps the point (x,y,z) into the point
C (x',y',z'), where
C
C       x' = x
C       y' = y cos(a) - z sin(a)
C       z' = z cos(a) + y sin(a)
C
C A positive value of "a" represents rotation in the direction from the
C Y axis to the Z axis.
C
C Similarly, rotating by an angle "a" about the Y axis maps the point
C (x,y,z) into the point (x',y',z'), where
C
C       x' = x cos(a) + z sin(a)
C       y' = y
C       z' = z cos(a) - x sin(a)
C
C A positive value of "a" represents rotation in the direction from the
C Z axis to the X axis.
C
C Rotating by an angle "a" about the Z axis maps the point (x,y,z) into
C the point (x',y',z'), where
C
C       x' = x cos(a) - y sin(a)
C       y' = y cos(a) + x sin(a)
C       y' = y
C
C A positive value of "a" represents rotation in the direction from the
C X axis to the Y axis.
C
C Define a multiplicative constant to convert from degrees to radians.
C
        DATA DTOR / .017453292519943 /
C
C Trigonometry.
C
        SINA=SIN(DTOR*ANGL)
        COSA=COS(DTOR*ANGL)
C
        XTMP=XCRD
        YTMP=YCRD
        ZTMP=ZCRD
C
        IF (IAXS.EQ.1) THEN
          YCRD=YTMP*COSA-ZTMP*SINA
          ZCRD=ZTMP*COSA+YTMP*SINA
        ELSE IF (IAXS.EQ.2) THEN
          XCRD=XTMP*COSA+ZTMP*SINA
          ZCRD=ZTMP*COSA-XTMP*SINA
        ELSE
          XCRD=XTMP*COSA-YTMP*SINA
          YCRD=YTMP*COSA+XTMP*SINA
        END IF
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
