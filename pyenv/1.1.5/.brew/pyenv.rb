class Pyenv < Formula
  desc "Python version management"
  homepage "https://github.com/pyenv/pyenv"
  url "https://github.com/pyenv/pyenv/archive/v1.1.5.tar.gz"
  sha256 "438abaef82c7e044239822f9dedf0ca76aed43e46959997ccce1b99883e68452"
  version_scheme 1
  head "https://github.com/pyenv/pyenv.git"

  depends_on "autoconf" => [:recommended, :run]
  depends_on "pkg-config" => [:recommended, :run]
  depends_on "openssl" => :recommended
  depends_on "readline" => [:recommended, :run]

  def install
    inreplace "libexec/pyenv", "/usr/local", HOMEBREW_PREFIX

    system "src/configure"
    system "make", "-C", "src"

    prefix.install Dir["*"]
    %w[pyenv-install pyenv-uninstall python-build].each do |cmd|
      bin.install_symlink "#{prefix}/plugins/python-build/bin/#{cmd}"
    end
  end

  test do
    shell_output("eval \"$(#{bin}/pyenv init -)\" && pyenv versions")
  end
end
