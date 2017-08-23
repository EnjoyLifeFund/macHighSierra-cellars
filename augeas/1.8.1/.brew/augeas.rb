class Augeas < Formula
  desc "Configuration editing tool and API"
  homepage "http://augeas.net"
  url "http://download.augeas.net/augeas-1.8.1.tar.gz"
  sha256 "65cf75b5a573fee2a5c6c6e3c95cad05f0101e70d3f9db10d53f6cc5b11bc9f9"

  head do
    url "https://github.com/hercules-team/augeas.git"

    depends_on "autoconf" => :build
    depends_on "automake" => :build
    depends_on "libtool" => :build
    depends_on "bison" => :build
  end

  depends_on "pkg-config" => :build
  depends_on "readline"

  def install
    args = %W[--disable-debug --disable-dependency-tracking --prefix=#{prefix}]

    if build.head?
      system "./autogen.sh", *args
    else
      system "./configure", *args
    end

    system "make", "install"
  end

  def caveats; <<-EOS.undent
    Lenses have been installed to:
      #{HOMEBREW_PREFIX}/share/augeas/lenses/dist
    EOS
  end

  test do
    system bin/"augtool", "print", etc
  end
end
