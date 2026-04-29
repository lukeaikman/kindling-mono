require "test_helper"

module Mobile
  class SessionsControllerTest < ActionDispatch::IntegrationTest
    setup do
      @user = User.create!(
        email_address: "one@example.com",
        password: "password",
        first_name: "Test",
        last_name: "User"
      )
    end

    test "new renders a mobile login screen" do
      get mobile_login_path

      assert_response :success
      assert_select "body.mobile-body .mobile-app"
      assert_select ".mobile-eyebrow", text: /Welcome back/i
    end

    test "failed login preserves the anonymous onboarding session" do
      onboarding_session = OnboardingSession.create!(token: SecureRandom.hex(24))
      write_signed_cookie(OnboardingSession::COOKIE_KEY, onboarding_session.token)

      post mobile_login_path, params: { email_address: @user.email_address, password: "wrong" }

      assert_response :unprocessable_entity
      assert OnboardingSession.exists?(onboarding_session.id)
    end

    test "successful login destroys the anonymous onboarding session and redirects to the mobile dashboard" do
      onboarding_session = OnboardingSession.create!(token: SecureRandom.hex(24))
      write_signed_cookie(OnboardingSession::COOKIE_KEY, onboarding_session.token)

      post mobile_login_path, params: { email_address: @user.email_address, password: "password" }

      assert_redirected_to mobile_dashboard_path
      assert_not OnboardingSession.exists?(onboarding_session.id)
      assert cookies[OnboardingSession::COOKIE_KEY].blank?
      assert cookies[:session_id].present?
    end

    # === Wave 2 Commit 4 ===

    test "successful login destroys the anonymous User cascade + clears user_token cookie" do
      anonymous = User.create!(current_step: "family")
      anonymous.people.create!(relationship_kind: "self", first_name: "Mid", last_name: "Onboarding")
      write_signed_cookie(:user_token, anonymous.token)

      post mobile_login_path, params: { email_address: @user.email_address, password: "password" }

      assert_redirected_to mobile_dashboard_path
      assert_not User.exists?(anonymous.id), "anonymous User should be destroyed on login"
      assert cookies[:user_token].blank?
      assert cookies[:session_id].present?
    end

    test "login form shows warning when an anonymous User has onboarding data" do
      anonymous = User.create!(current_step: "location")
      write_signed_cookie(:user_token, anonymous.token)

      get mobile_login_path

      assert_response :success
      assert_match(/started onboarding/i, response.body)
    end

    test "login form shows no warning when no anonymous User present" do
      get mobile_login_path

      assert_response :success
      assert_no_match(/started onboarding/i, response.body)
    end

    test "logout terminates the session and redirects to intro" do
      session = @user.sessions.create!(user_agent: "test", ip_address: "127.0.0.1")
      write_signed_cookie(:session_id, session.id)

      delete mobile_logout_path

      assert_redirected_to mobile_intro_path
      assert cookies[:session_id].blank?
      assert_not Session.exists?(session.id)
    end
  end
end
