require "test_helper"

module Mobile
  class StartupControllerTest < ActionDispatch::IntegrationTest
    test "index creates an organic onboarding session and embeds the startup destination" do
      get mobile_root_path

      assert_response :success

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))

      assert_equal 1, onboarding_session.video_intro_version
      assert_nil onboarding_session.risk_questionnaire_version
      assert_select "[data-controller~='splash-redirect'][data-splash-redirect-url-value='#{mobile_video_intro_path}']"
    end

    test "open stores deep link values on the onboarding session once and redirects by first_show" do
      get mobile_open_path(show_video: 1, show_risk_questionnaire: 1, first_show: "risk_questionnaire", source: "facebook")

      assert_redirected_to mobile_risk_questionnaire_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))

      assert_equal "facebook", onboarding_session.attribution_source
      assert_equal 1, onboarding_session.video_intro_version
      assert_equal 1, onboarding_session.risk_questionnaire_version
      assert_equal "risk_questionnaire", onboarding_session.first_show
      assert_nil onboarding_session.video_completed_at
      assert_nil onboarding_session.questionnaire_completed_at
    end

    test "open does not overwrite existing startup attribution" do
      onboarding_session = OnboardingSession.create!(
        token: SecureRandom.hex(24),
        attribution_source: "original",
        video_intro_version: 1,
        first_show: "video"
      )

      write_signed_cookie(:mobile_onboarding_session_token, onboarding_session.token)

      get mobile_open_path(source: "new-source", show_video: 0)

      assert_redirected_to mobile_video_intro_path
      assert_equal "original", onboarding_session.reload.attribution_source
      assert_equal 1, onboarding_session.video_intro_version
    end

    test "completion endpoints progress through startup before onboarding" do
      onboarding_session = OnboardingSession.create!(
        token: SecureRandom.hex(24),
        video_intro_version: 1,
        risk_questionnaire_version: 1,
        first_show: "video"
      )

      write_signed_cookie(:mobile_onboarding_session_token, onboarding_session.token)

      post mobile_complete_video_path
      assert_redirected_to mobile_risk_questionnaire_path

      post mobile_complete_questionnaire_path
      assert_redirected_to mobile_intro_path
    end

    test "index routes intro-complete sessions into onboarding" do
      onboarding_session = OnboardingSession.create!(
        token: SecureRandom.hex(24),
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current
      )

      write_signed_cookie(:mobile_onboarding_session_token, onboarding_session.token)

      get mobile_root_path

      assert_response :success
      assert_select "[data-controller~='splash-redirect'][data-splash-redirect-url-value='#{mobile_onboarding_welcome_path}']"
    end

    test "open with show_video=1 only routes to video-intro" do
      get mobile_open_path(show_video: 1)

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal 1, onboarding_session.video_intro_version
      assert_nil onboarding_session.risk_questionnaire_version
    end

    test "open with show_video=0 and show_risk_questionnaire=1 routes to risk-questionnaire" do
      get mobile_open_path(show_video: 0, show_risk_questionnaire: 1)

      assert_redirected_to mobile_risk_questionnaire_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_nil onboarding_session.video_intro_version
      assert_equal 1, onboarding_session.risk_questionnaire_version
    end

    test "open with both show flags and first_show=video routes to video-intro" do
      get mobile_open_path(show_video: 1, show_risk_questionnaire: 1, first_show: "video")

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal "video", onboarding_session.first_show
    end

    test "open with negative show_video coerces to 1 and routes to video-intro" do
      get mobile_open_path(show_video: -3)

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal 1, onboarding_session.video_intro_version
    end

    test "open with non-numeric show_video coerces to 1 and routes to video-intro" do
      get mobile_open_path(show_video: "banana")

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal 1, onboarding_session.video_intro_version
    end

    test "open with unexpected first_show value defaults to video ordering" do
      get mobile_open_path(show_video: 1, show_risk_questionnaire: 1, first_show: "drop_tables")

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal "video", onboarding_session.first_show
    end

    test "open with empty-string params uses organic defaults" do
      get mobile_open_path(source: "", campaign: "", show_video: "", show_risk_questionnaire: "")

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal 1, onboarding_session.video_intro_version
      assert_nil onboarding_session.risk_questionnaire_version
      assert onboarding_session.attribution_source.blank?
    end

    test "open with oversized source param persists verbatim without error" do
      big_source = "x" * 2048

      get mobile_open_path(source: big_source, show_video: 1)

      assert_redirected_to mobile_video_intro_path

      onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
      assert_equal big_source, onboarding_session.attribution_source
    end
  end
end
