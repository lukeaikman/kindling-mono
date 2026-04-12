require "test_helper"

module Mobile
  class EntryRoutingTest < ActiveSupport::TestCase
    test "routes authenticated users to the mobile dashboard" do
      routing = EntryRouting.new(authenticated: true)

      assert_equal "/mobile/dashboard", routing.destination
    end

    test "routes stale authenticated cookies to mobile login" do
      routing = EntryRouting.new(authenticated: false, stale_authenticated_cookie: true)

      assert_equal "/mobile/login", routing.destination
    end

    test "routes startup obligations before intro and onboarding" do
      onboarding_session = Struct.new(:startup_destination).new("/mobile/video-intro")
      routing = EntryRouting.new(authenticated: false, onboarding_session: onboarding_session)

      assert_equal "/mobile/video-intro", routing.destination
    end

    test "routes intro-complete users to their first incomplete onboarding step" do
      onboarding_session = Struct.new(:startup_destination, :intro_seen?, :completed?, :first_incomplete_path).new("/mobile/intro", true, false, "/mobile/onboarding/family")
      routing = EntryRouting.new(authenticated: false, onboarding_session: onboarding_session)

      assert_equal "/mobile/onboarding/family", routing.destination
    end

    test "routes completed onboarding users to secure account" do
      onboarding_session = Struct.new(:startup_destination, :intro_seen?, :completed?, :first_incomplete_path).new("/mobile/intro", true, true, "/mobile/onboarding/welcome")
      routing = EntryRouting.new(authenticated: false, onboarding_session: onboarding_session)

      assert_equal "/mobile/auth/secure-account", routing.destination
    end
  end
end
