require "test_helper"

module Mobile
  class DateFieldBranchTest < ActionDispatch::IntegrationTest
    setup do
      session = OnboardingSession.create!(
        token: SecureRandom.hex(24),
        video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current
      )
      write_signed_cookie(OnboardingSession::COOKIE_KEY, session.token)
    end

    # The Hotwire Native iOS shell injects "bridge-components: [...]" into the
    # user-agent. The bridge library uses that to gate BridgeComponent.shouldLoad.
    # Without it, the date-field Stimulus controller never registers in JS — so
    # the bridge-button branch must NOT render in any context that lacks the
    # shell signature, including mobile browsers (Dia, Safari, etc.).

    test "renders plain native <input type=date> for desktop UA" do
      get mobile_onboarding_welcome_path,
          headers: { "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" }

      assert_response :success
      assert_match(/<input type="date" name="person\[date_of_birth\]"[^>]*class="mobile-input"/, response.body)
      assert_no_match(/data-controller="date-field"/, response.body)
    end

    test "renders plain native <input type=date> for mobile-browser UA without shell signature" do
      # iPhone Safari outside the Hotwire shell, Dia, mobile Chrome, etc. all
      # match /Mobile|iPhone/ regex but lack "bridge-components: [...]" in UA.
      get mobile_onboarding_welcome_path,
          headers: { "User-Agent" => "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" }

      assert_response :success
      assert_match(/<input type="date" name="person\[date_of_birth\]"[^>]*class="mobile-input"/, response.body)
      assert_no_match(/data-controller="date-field"/, response.body)
    end

    test "renders bridge-button only when UA carries Hotwire shell's bridge-components signature" do
      get mobile_onboarding_welcome_path,
          headers: { "User-Agent" => "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Mobile/15E148 Hotwire Native iOS; bridge-components: [date-picker haptics push-permission]" }

      assert_response :success
      assert_match(/<button[^>]*data-controller="date-field"/, response.body)
    end
  end
end
