class Giflib < Formula
  desc "Library and utilities for processing GIFs"
  homepage "https://giflib.sourceforge.io/"
  url "https://downloads.sourceforge.net/project/giflib/giflib-5.1.4.tar.bz2"
  sha256 "df27ec3ff24671f80b29e6ab1c4971059c14ac3db95406884fc26574631ba8d5"

  def install
    system "./configure", "--prefix=#{prefix}", "--disable-dependency-tracking"
    system "make", "install"
  end

  test do
    assert_match /Screen Size - Width = 1, Height = 1/, shell_output("#{bin}/giftext #{test_fixtures("test.gif")}")
  end
end
