class E2fsprogs < Formula
  desc "Utilities for the ext2, ext3, and ext4 file systems"
  homepage "https://e2fsprogs.sourceforge.io/"
  url "https://downloads.sourceforge.net/project/e2fsprogs/e2fsprogs/v1.43.4/e2fsprogs-1.43.4.tar.gz"
  mirror "https://fossies.org/linux/misc/e2fsprogs-1.43.4.tar.gz"
  sha256 "a648a90a513f1b25113c7f981af978b8a19f832b3a32bd10707af3ff682ba66d"

  head "https://git.kernel.org/pub/scm/fs/ext2/e2fsprogs.git"

  keg_only "This brew installs several commands which override macOS-provided file system commands."

  depends_on "pkg-config" => :build
  depends_on "gettext"

  def install
    system "./configure", "--prefix=#{prefix}", "--disable-e2initrd-helper"
    system "make"
    system "make", "install"
    system "make", "install-libs"
  end

  test do
    assert_equal 36, shell_output("#{bin}/uuidgen").strip.length
    system bin/"lsattr", "-al"
  end
end
