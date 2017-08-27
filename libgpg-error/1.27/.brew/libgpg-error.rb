class LibgpgError < Formula
  desc "Common error values for all GnuPG components"
  homepage "https://www.gnupg.org/related_software/libgpg-error/"
  url "https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.27.tar.bz2"
  mirror "https://mirrors.ocf.berkeley.edu/debian/pool/main/libg/libgpg-error/libgpg-error_1.27.orig.tar.bz2"
  sha256 "4f93aac6fecb7da2b92871bb9ee33032be6a87b174f54abf8ddf0911a22d29d2"

  def install
    system "./configure", "--disable-dependency-tracking",
                          "--disable-silent-rules",
                          "--prefix=#{prefix}",
                          "--enable-static"
    system "make", "install"

    # avoid triggering mandatory rebuilds of software that hard-codes this path
    inreplace bin/"gpg-error-config", prefix, opt_prefix
  end

  test do
    system "#{bin}/gpg-error-config", "--libs"
  end
end
