class H5utils < Formula
  desc "Utilities to work with scientific data in HDF5"
  homepage "http://ab-initio.mit.edu/wiki/index.php/H5utils"
  url "https://github.com/stevengj/h5utils/releases/download/1.13/h5utils-1.13.tar.gz"
  #sha256 "7290290ca5d5d4451d757a70c86baaa70d23a28edb09c951b6b77c22b924a38d"
  revision 6

  depends_on "libpng"
  depends_on "hdf5"

  # A patch is required in order to build h5utils with libpng 1.5
#  patch :p0 do
#    url "https://trac.macports.org/export/102291/trunk/dports/science/h5utils/files/patch-writepng.c"
#    sha256 "b8737b5e4cd6597570b39ce911ffea5bd0173e0e7a6b32620df188b2d260280f"
#  end

  def install
    system "./configure", "--disable-debug", "--disable-dependency-tracking",
                          "--prefix=#{prefix}",
                          "--without-octave"
    system "make", "install"
  end

  test do
    system bin/"h5fromtxt", "-h"
  end
end
