class Libnet < Formula
  desc "C library for creating IP packets"
  homepage "https://github.com/sam-github/libnet"
  url "https://downloads.sourceforge.net/project/libnet-dev/libnet-1.1.6.tar.gz"
  sha256 "d392bb5825c4b6b672fc93a0268433c86dc964e1500c279dc6d0711ea6ec467a"

  depends_on "automake" => :build
  depends_on "autoconf" => :build
  depends_on "libtool" => :build

  # Fix raw sockets support
  patch :p0 do
    url "https://raw.githubusercontent.com/Homebrew/formula-patches/a689647/libnet/patch-configure.in.diff"
    sha256 "3c1ca12609d83372cf93223d69e903eb6e137ed7a4749a8ee19c21bd43f97f18"
  end

  def install
    system "autoreconf", "-fvi"
    system "./configure", "--disable-dependency-tracking",
                          "--prefix=#{prefix}"
    inreplace "src/libnet_link_bpf.c", "#include <net/bpf.h>", "" # Per MacPorts
    system "make", "install"
  end
end
