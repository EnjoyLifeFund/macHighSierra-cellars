class Jansson < Formula
  desc "C library for encoding, decoding, and manipulating JSON"
  homepage "http://www.digip.org/jansson/"
  url "http://www.digip.org/jansson/releases/jansson-2.10.tar.gz"
  sha256 "78215ad1e277b42681404c1d66870097a50eb084be9d771b1d15576575cf6447"

  def install
    system "./configure", "--disable-dependency-tracking",
                          "--prefix=#{prefix}"
    system "make", "install"
  end

  test do
    (testpath/"test.c").write <<-EOS.undent
      #include <jansson.h>
      #include <assert.h>

      int main()
      {
        json_t *json;
        json_error_t error;
        json = json_loads("\\"foo\\"", JSON_DECODE_ANY, &error);
        assert(json && json_is_string(json));
        json_decref(json);
        return 0;
      }
    EOS
    system ENV.cc, "test.c", "-L#{lib}", "-ljansson", "-o", "test"
    system "./test"
  end
end
