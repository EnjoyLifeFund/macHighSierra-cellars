class Rtmpdump < Formula
  desc "Tool for downloading RTMP streaming media"
  homepage "https://rtmpdump.mplayerhq.hu/"
  url "https://mirrors.ocf.berkeley.edu/debian/pool/main/r/rtmpdump/rtmpdump_2.4+20151223.gitfa8646d.1.orig.tar.gz"
  mirror "https://mirrorservice.org/sites/ftp.debian.org/debian/pool/main/r/rtmpdump/rtmpdump_2.4%2b20151223.gitfa8646d.1.orig.tar.gz"
  version "2.4+20151223"
  sha256 "5c032f5c8cc2937eb55a81a94effdfed3b0a0304b6376147b86f951e225e3ab5"

  head "https://git.ffmpeg.org/rtmpdump", :shallow => false

  depends_on "openssl"

  conflicts_with "flvstreamer", :because => "both install 'rtmpsrv', 'rtmpsuck' and 'streams' binary"

  def install
    ENV.deparallelize
    system "make", "CC=#{ENV.cc}",
                   "XCFLAGS=#{ENV.cflags}",
                   "XLDFLAGS=#{ENV.ldflags}",
                   "MANDIR=#{man}",
                   "SYS=darwin",
                   "prefix=#{prefix}",
                   "sbindir=#{bin}",
                   "install"
  end

  test do
    system "#{bin}/rtmpdump", "-h"
  end
end
