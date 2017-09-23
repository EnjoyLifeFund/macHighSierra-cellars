class Libuvc < Formula
  desc "Cross-platform library for USB video devices"
  homepage "https://github.com/ktossell/libuvc"
  url "https://github.com/ktossell/libuvc/archive/v0.0.6.tar.gz"
  sha256 "42175a53c1c704365fdc782b44233925e40c9344fbb7f942181c1090f06e2873"

  head "https://github.com/ktossell/libuvc.git"

  depends_on "cmake" => :build
  depends_on "pkg-config" => :build
  depends_on "libusb"
  depends_on "jpeg" => :optional

  def install
    system "cmake", ".", *std_cmake_args
    system "make"
    system "make", "install"
  end
end
