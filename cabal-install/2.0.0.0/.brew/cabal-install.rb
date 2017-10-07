class CabalInstall < Formula
  desc "Command-line interface for Cabal and Hackage"
  homepage "https://www.haskell.org/cabal/"
  url "https://hackage.haskell.org/package/cabal-install-2.0.0.0/cabal-install-2.0.0.0.tar.gz"
  sha256 "5f370bac2f18f0d96f525e33d723f248e50d73f452076d49425a752bba062b2d"
  head "https://github.com/haskell/cabal.git", :branch => "2.0"

  depends_on "ghc"

  fails_with :clang if MacOS.version <= :lion # Same as ghc.rb

  def install
    cd "cabal-install" if build.head?

    system "sh", "bootstrap.sh", "--sandbox"
    bin.install ".cabal-sandbox/bin/cabal"
    bash_completion.install "bash-completion/cabal"
  end

  test do
    system "#{bin}/cabal", "--config-file=#{testpath}/config", "info", "cabal"
  end
end
