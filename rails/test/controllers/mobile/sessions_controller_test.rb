require "test_helper"

module Mobile
  class SessionsControllerTest < ActionDispatch::IntegrationTest
    setup do
      @user = users(:one)
    end

    test "new renders a mobile login screen" do
      get mobile_login_path

      assert_response :success
      assert_select "body .mobile-shell"
      assert_select "h1", text: /Welcome back/i
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
      assert_nil cookies[OnboardingSession::COOKIE_KEY]
      assert cookies[:session_id].present?
    end
  end
end
