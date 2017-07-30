class Asio < Formula
  desc "Cross-platform C++ Library for asynchronous programming"
  homepage "https://think-async.com/Asio"
  url "https://downloads.sourceforge.net/project/asio/asio/1.10.8%20%28Stable%29/asio-1.10.8.tar.bz2"
  sha256 "26deedaebbed062141786db8cfce54e77f06588374d08cccf11c02de1da1ed49"
  revision 1
  head "https://github.com/chriskohlhoff/asio.git"

  devel do
    url "https://downloads.sourceforge.net/project/asio/asio/1.11.0%20%28Development%29/asio-1.11.0.tar.bz2"
    sha256 "4f7e13260eea67412202638ec111cb5014f44bdebe96103279c60236874daa50"
  end

  option "with-boost-coroutine", "Use Boost.Coroutine to implement stackful coroutines"
  option :cxx11

  depends_on "autoconf" => :build
  depends_on "automake" => :build

  depends_on "boost" => :optional
  depends_on "boost" if build.with?("boost-coroutine")
  depends_on "openssl"

  needs :cxx11 if build.without? "boost"

  def install
    ENV.cxx11 if build.cxx11? || build.without?("boost")

    if build.head?
      cd "asio"
      system "./autogen.sh"
    else
      system "autoconf"
    end
    args = %W[
      --disable-dependency-tracking
      --disable-silent-rules
      --prefix=#{prefix}
      --with-boost=#{(build.with?("boost") || build.with?("boost-coroutine")) ? Formula["boost"].opt_include : "no"}
    ]
    args << "--enable-boost-coroutine" if build.with? "boost-coroutine"

    system "./configure", *args
    system "make", "install"
    pkgshare.install "src/examples"
  end

  test do
    found = [pkgshare/"examples/cpp11/http/server/http_server",
             pkgshare/"examples/cpp03/http/server/http_server"].select(&:exist?)
    raise "no http_server example file found" if found.empty?
    pid = fork do
      exec found.first, "127.0.0.1", "8080", "."
    end
    sleep 1
    begin
      assert_match /404 Not Found/, shell_output("curl http://127.0.0.1:8080")
    ensure
      Process.kill 9, pid
      Process.wait pid
    end
  end
end
