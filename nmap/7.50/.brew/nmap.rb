class Nmap < Formula
  desc "Port scanning utility for large networks"
  homepage "https://nmap.org/"
  url "https://nmap.org/dist/nmap-7.50.tar.bz2"
  sha256 "e9a96a8e02bfc9e80c617932acc61112c23089521ee7d6b1502ecf8e3b1674b2"
  head "https://svn.nmap.org/nmap/"

  option "with-pygtk", "Build Zenmap GUI"

  depends_on "openssl"
  depends_on "pygtk" => :optional

  conflicts_with "ndiff", :because => "both install `ndiff` binaries"

  def install
    ENV.deparallelize

    args = %W[
      --prefix=#{prefix}
      --with-libpcre=included
      --with-liblua=included
      --with-openssl=#{Formula["openssl"].opt_prefix}
      --without-nmap-update
      --disable-universal
    ]

    args << "--without-zenmap" if build.without? "pygtk"

    system "./configure", *args
    system "make" # separate steps required otherwise the build fails
    system "make", "install"
  end

  test do
    system "#{bin}/nmap", "-p80,443", "google.com"
  end
end
