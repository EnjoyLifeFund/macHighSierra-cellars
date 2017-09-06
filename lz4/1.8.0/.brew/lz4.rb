class Lz4 < Formula
  desc "Extremely Fast Compression algorithm"
  homepage "http://www.lz4.org/"
  url "https://github.com/lz4/lz4/archive/v1.8.0.tar.gz"
  sha256 "2ca482ea7a9bb103603108b5a7510b7592b90158c151ff50a28f1ca8389fccf6"
  head "https://github.com/lz4/lz4.git"

  def install
    system "make", "install", "PREFIX=#{prefix}"
  end

  test do
    input = "testing compression and decompression"
    input_file = testpath/"in"
    input_file.write input
    output_file = testpath/"out"
    system "sh", "-c", "cat #{input_file} | #{bin}/lz4 | #{bin}/lz4 -d > #{output_file}"
    assert_equal output_file.read, input
  end
end
