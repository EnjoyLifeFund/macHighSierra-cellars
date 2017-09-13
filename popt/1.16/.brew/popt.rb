class Popt < Formula
  desc "Library like getopt(3) with a number of enhancements"
  homepage "http://rpm5.org"
  url "http://rpm5.org/files/popt/popt-1.16.tar.gz"
  sha256 "e728ed296fe9f069a0e005003c3d6b2dde3d9cad453422a10d6558616d304cc8"

  def install
    system "./configure", "--disable-debug", "--disable-dependency-tracking",
                          "--prefix=#{prefix}"
    system "make", "install"
  end
end
