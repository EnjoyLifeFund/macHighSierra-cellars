class Zeromq < Formula
  desc "High-performance, asynchronous messaging library"
  homepage "http://www.zeromq.org/"
  url "https://github.com/zeromq/libzmq/releases/download/v4.2.2/zeromq-4.2.2.tar.gz"
  sha256 "5b23f4ca9ef545d5bd3af55d305765e3ee06b986263b31967435d285a3e6df6b"

  head do
    url "https://github.com/zeromq/libzmq.git"

    depends_on "autoconf" => :build
    depends_on "automake" => :build
    depends_on "libtool" => :build
  end

  option "with-libpgm", "Build with PGM extension"
  option "with-norm", "Build with NORM extension"
  option "with-drafts", "Build and install draft classes and methods"

  deprecated_option "with-pgm" => "with-libpgm"

  depends_on "asciidoc" => :build
  depends_on "pkg-config" => :build
  depends_on "xmlto" => :build
  depends_on "libpgm" => :optional
  depends_on "libsodium" => :optional
  depends_on "norm" => :optional

  def install
    ENV["XML_CATALOG_FILES"] = "#{etc}/xml/catalog"

    args = ["--disable-dependency-tracking", "--prefix=#{prefix}"]

    args << "--with-pgm" if build.with? "libpgm"
    args << "--with-libsodium" if build.with? "libsodium"
    args << "--with-norm" if build.with? "norm"
    args << "--enable-drafts" if build.with?("drafts")

    ENV["LIBUNWIND_LIBS"] = "-framework System"
    ENV["LIBUNWIND_CFLAGS"] = "-I#{MacOS.sdk_path}/usr/include"

    system "./autogen.sh" if build.head?
    system "./configure", *args
    system "make"
    system "make", "install"
  end

  test do
    (testpath/"test.c").write <<-EOS.undent
      #include <assert.h>
      #include <zmq.h>

      int main()
      {
        zmq_msg_t query;
        assert(0 == zmq_msg_init_size(&query, 1));
        return 0;
      }
    EOS
    system ENV.cc, "test.c", "-L#{lib}", "-lzmq", "-o", "test"
    system "./test"
  end
end
