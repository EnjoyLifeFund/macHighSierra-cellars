class Itstool < Formula
  desc "Make XML documents translatable through PO files"
  homepage "http://itstool.org/"
  url "http://files.itstool.org/itstool/itstool-2.0.3.tar.bz2"
  sha256 "8c7a5c639eb4714a91ad829910fd06c1c677abcbbb60aee9211141faa7fb02c7"

  head do
    url "https://github.com/itstool/itstool.git"

    depends_on "autoconf" => :build
    depends_on "automake" => :build
  end

  depends_on :python if MacOS.version <= :snow_leopard
  depends_on "libxml2"

  def install
    ENV.append_path "PYTHONPATH", "#{Formula["libxml2"].opt_lib}/python2.7/site-packages"

    system "./autogen.sh" if build.head?
    system "./configure", "--prefix=#{libexec}"
    system "make", "install"

    bin.install Dir["#{libexec}/bin/*"]
    bin.env_script_all_files(libexec/"bin", :PYTHONPATH => ENV["PYTHONPATH"])
    pkgshare.install_symlink libexec/"share/itstool/its"
    man1.install_symlink libexec/"share/man/man1/itstool.1"
  end

  test do
    (testpath/"test.xml").write <<-EOS.undent
      <tag>Homebrew</tag>
    EOS
    system bin/"itstool", "-o", "test.pot", "test.xml"
    assert_match "msgid \"Homebrew\"", File.read("test.pot")
  end
end
