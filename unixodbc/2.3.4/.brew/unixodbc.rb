class Unixodbc < Formula
  desc "ODBC 3 connectivity for UNIX"
  homepage "http://www.unixodbc.org/"
  url "https://downloads.sourceforge.net/project/unixodbc/unixODBC/2.3.4/unixODBC-2.3.4.tar.gz"
  mirror "ftp://ftp.unixodbc.org/pub/unixODBC/unixODBC-2.3.4.tar.gz"
  sha256 "2e1509a96bb18d248bf08ead0d74804957304ff7c6f8b2e5965309c632421e39"

  keg_only "Shadows system iODBC header files" if MacOS.version < :mavericks

  conflicts_with "virtuoso", :because => "Both install `isql` binaries."

  def install
    system "./configure", "--disable-debug",
                          "--disable-dependency-tracking",
                          "--prefix=#{prefix}",
                          "--enable-static",
                          "--enable-gui=no"
    system "make", "install"
  end

  test do
    system bin/"odbcinst", "-j"
  end
end
