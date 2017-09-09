class Gpp < Formula
  desc "General-purpose preprocessor with customizable syntax"
  homepage "http://en.nothingisreal.com/wiki/GPP"
  url "https://files.nothingisreal.com/software/gpp/gpp-2.25.tar.bz2"
  sha256 "16ba9329208f587f96172f951ad3d24a81afea6a5b7836fe87955726eacdd19f"

  def install
    system "./configure", "--disable-debug", "--disable-dependency-tracking",
                          "--prefix=#{prefix}", "--mandir=#{man}"
    system "make"
    system "make", "check"
    system "make", "install"
  end
end
