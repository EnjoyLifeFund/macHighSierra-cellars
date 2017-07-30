class M4 < Formula
  desc "Macro processing language"
  homepage "https://www.gnu.org/software/m4"
  url "https://ftp.gnu.org/gnu/m4/m4-1.4.18.tar.xz"
  mirror "https://ftpmirror.gnu.org/m4/m4-1.4.18.tar.xz"
  sha256 "f2c1e86ca0a404ff281631bdc8377638992744b175afb806e25871a24a934e07"

  keg_only :provided_by_osx

  def install
    system "./configure", "--disable-dependency-tracking", "--prefix=#{prefix}"
    system "make"
    system "make", "install"
  end

  test do
    assert_match "Homebrew",
      pipe_output("#{bin}/m4", "define(TEST, Homebrew)\nTEST\n")
  end
end
