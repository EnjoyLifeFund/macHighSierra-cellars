class Gradle < Formula
  desc "Build system based on the Groovy language"
  homepage "https://www.gradle.org/"
  url "https://services.gradle.org/distributions/gradle-4.2.1-all.zip"
  sha256 "7897b59fb45148cd8a79f078e5e4cef3861a252dd1a1af729d0c6e8a0a8703a8"

  bottle :unneeded

  option "with-all", "Installs Javadoc, examples, and source in addition to the binaries"

  depends_on :java => "1.7+"

  def install
    rm_f Dir["bin/*.bat"]
    libexec.install %w[bin lib]
    libexec.install %w[docs media samples src] if build.with? "all"
    (bin/"gradle").write_env_script libexec/"bin/gradle", Language::Java.overridable_java_home_env
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/gradle --version")
  end
end
