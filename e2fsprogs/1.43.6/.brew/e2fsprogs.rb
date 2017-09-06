class E2fsprogs < Formula
  desc "Utilities for the ext2, ext3, and ext4 file systems"
  homepage "https://e2fsprogs.sourceforge.io/"
  url "https://downloads.sourceforge.net/project/e2fsprogs/e2fsprogs/v1.43.6/e2fsprogs-1.43.6.tar.gz"
  sha256 "60139d75802925b0c23d451da8e4fc84c5e7cf94626cc324b59295495c0fdc80"

  head "https://git.kernel.org/pub/scm/fs/ext2/e2fsprogs.git"

  keg_only "this installs several executables which shadow macOS system commands"

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
