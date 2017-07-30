class Ninja < Formula
  desc "Small build system for use with gyp or CMake"
  homepage "https://ninja-build.org/"
  url "https://github.com/ninja-build/ninja/archive/v1.7.2.tar.gz"
  sha256 "2edda0a5421ace3cf428309211270772dd35a91af60c96f93f90df6bc41b16d9"
  head "https://github.com/ninja-build/ninja.git"

  option "without-test", "Don't run build-time tests"

  deprecated_option "without-tests" => "without-test"

  resource "gtest" do
    url "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/googletest/gtest-1.7.0.zip"
    sha256 "247ca18dd83f53deb1328be17e4b1be31514cedfc1e3424f672bf11fd7e0d60d"
  end

  def install
    system "python", "configure.py", "--bootstrap"

    if build.with? "test"
      (buildpath/"gtest").install resource("gtest")
      system "./configure.py", "--with-gtest=gtest"
      system "./ninja", "ninja_test"
      system "./ninja_test", "--gtest_filter=-SubprocessTest.SetWithLots"
    end

    bin.install "ninja"
    bash_completion.install "misc/bash-completion" => "ninja-completion.sh"
    zsh_completion.install "misc/zsh-completion" => "_ninja"
  end

  test do
    (testpath/"build.ninja").write <<-EOS.undent
      cflags = -Wall

      rule cc
        command = gcc $cflags -c $in -o $out

      build foo.o: cc foo.c
    EOS
    system bin/"ninja", "-t", "targets"
  end
end
