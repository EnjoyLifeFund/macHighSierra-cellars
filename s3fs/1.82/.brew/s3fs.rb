class S3fs < Formula
  desc "FUSE-based file system backed by Amazon S3"
  homepage "https://github.com/s3fs-fuse/s3fs-fuse/wiki"
  url "https://github.com/s3fs-fuse/s3fs-fuse/archive/v1.82.tar.gz"
  sha256 "8a40f0b11b558b6d733eeff4fcc025cc416df37b6732001bb0c630f6d6d760dd"

  head "https://github.com/s3fs-fuse/s3fs-fuse.git"

  depends_on "pkg-config" => :build
  depends_on "autoconf" => :build
  depends_on "automake" => :build
  depends_on "gnutls"
  depends_on "nettle"
  depends_on "libgcrypt"

  depends_on :osxfuse

  def install
    # Fix "error: no matching function for call to 'clock_gettime'"
    # Reported 14 May 2017 https://github.com/s3fs-fuse/s3fs-fuse/issues/600
    if MacOS.version >= :sierra
      inreplace "src/cache.cpp", "return clock_gettime(clk_id, ts);",
                                 "return clock_gettime((clockid_t)clk_id, ts);"

    end

    system "./autogen.sh"
    system "./configure", "--disable-dependency-tracking", "--with-gnutls", "--prefix=#{prefix}"
    system "make", "install"
  end

  def caveats; <<-EOS.undent
    Be aware that s3fs has some caveats concerning S3 "directories"
    that have been created by other tools. See the following issue for
    details:

      https://code.google.com/p/s3fs/issues/detail?id=73
    EOS
  end

  test do
    system "#{bin}/s3fs", "--version"
  end
end
