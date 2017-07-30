class Libunistring < Formula
  desc "C string library for manipulating Unicode strings"
  homepage "https://www.gnu.org/software/libunistring/"
  url "https://ftp.gnu.org/gnu/libunistring/libunistring-0.9.7.tar.xz"
  mirror "https://ftpmirror.gnu.org/libunistring/libunistring-0.9.7.tar.xz"
  sha256 "2e3764512aaf2ce598af5a38818c0ea23dedf1ff5460070d1b6cee5c3336e797"


  def install
    system "./configure", "--disable-dependency-tracking",
                          "--disable-silent-rules",
                          "--prefix=#{prefix}"
    system "make"
    system "make", "check"
    system "make", "install"
  end
end
