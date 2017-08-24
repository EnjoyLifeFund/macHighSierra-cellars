class Parallel < Formula
  desc "Shell command parallelization utility"
  homepage "https://savannah.gnu.org/projects/parallel/"
  url "https://ftp.gnu.org/gnu/parallel/parallel-20170822.tar.bz2"
  mirror "https://ftpmirror.gnu.org/parallel/parallel-20170822.tar.bz2"
  sha256 "8949bfa3057e194119a85a8cba2c8e0bdd46b5f5851eda583d2386b95c039148"
  head "https://git.savannah.gnu.org/git/parallel.git"

  conflicts_with "moreutils", :because => "both install a 'parallel' executable."

  def install
    system "./configure", "--prefix=#{prefix}"
    system "make", "install"
  end

  test do
    assert_equal "test\ntest\n",
                 shell_output("#{bin}/parallel --will-cite echo ::: test test")
  end
end
