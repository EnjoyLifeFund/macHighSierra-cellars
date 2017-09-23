module Gem
  class << self
    alias :old_default_dir :default_dir
    alias :old_default_path :default_path
    alias :old_default_bindir :default_bindir
    alias :old_ruby :ruby
  end

  def self.default_dir
    path = [
      "/usr/local",
      "lib",
      "ruby",
      "gems",
      "2.4.0"
    ]

    @default_dir ||= File.join(*path)
  end

  def self.private_dir
    path = if defined? RUBY_FRAMEWORK_VERSION then
             [
               File.dirname(RbConfig::CONFIG['sitedir']),
               'Gems',
               RbConfig::CONFIG['ruby_version']
             ]
           elsif RbConfig::CONFIG['rubylibprefix'] then
             [
              RbConfig::CONFIG['rubylibprefix'],
              'gems',
              RbConfig::CONFIG['ruby_version']
             ]
           else
             [
               RbConfig::CONFIG['libdir'],
               ruby_engine,
               'gems',
               RbConfig::CONFIG['ruby_version']
             ]
           end

    @private_dir ||= File.join(*path)
  end

  def self.default_path
    if Gem.user_home && File.exist?(Gem.user_home)
      [user_dir, default_dir, private_dir]
    else
      [default_dir, private_dir]
    end
  end

  def self.default_bindir
    "/usr/local/bin"
  end

  def self.ruby
    "/usr/local/opt/ruby/bin/ruby"
  end
end
