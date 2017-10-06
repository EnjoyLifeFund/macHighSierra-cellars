class Openjpeg < Formula
  desc "Library for JPEG-2000 image manipulation"
  homepage "http://www.openjpeg.org/"
  url "https://github.com/uclouvain/openjpeg/archive/v2.3.0.tar.gz"
  sha256 "3dc787c1bb6023ba846c2a0d9b1f6e179f1cd255172bde9eb75b01f1e6c7d71a"
  head "https://github.com/uclouvain/openjpeg.git"

  option "without-doxygen", "Do not build HTML documentation."
  option "with-static", "Build a static library."

  depends_on "cmake" => :build
  depends_on "doxygen" => [:build, :recommended]
  depends_on "little-cms2"
  depends_on "libtiff"
  depends_on "libpng"

  def install
    args = std_cmake_args
    args << "-DBUILD_SHARED_LIBS=OFF" if build.with? "static"
    args << "-DBUILD_DOC=ON" if build.with? "doxygen"
    system "cmake", ".", *args
    system "make", "install"
  end

  test do
    (testpath/"test.c").write <<-EOS.undent
      #include <openjpeg.h>

      int main () {
        opj_image_cmptparm_t cmptparm;
        const OPJ_COLOR_SPACE color_space = OPJ_CLRSPC_GRAY;

        opj_image_t *image;
        image = opj_image_create(1, &cmptparm, color_space);

        opj_image_destroy(image);
        return 0;
      }
    EOS
    system ENV.cc, "-I#{include.children.first}", "-L#{lib}", "-lopenjp2",
           testpath/"test.c", "-o", "test"
    system "./test"
  end
end
