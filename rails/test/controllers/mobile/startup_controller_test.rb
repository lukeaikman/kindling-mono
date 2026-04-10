require "test_helper"

module Mobile
  class StartupControllerTest < ActionDispatch::IntegrationTest
    test "index renders splash and embeds destination" do
      get mobile_root_path
      assert_response :success
      assert_select "#mobile-splash-root[data-destination='/mobile/intro']"
    end

    test "open creates attribution once and redirects by first_show" do
      get mobile_open_path(show_video: 1, show_risk_questionnaire: 1, first_show: "risk_questionnaire", source: "facebook")
      assert_redirected_to mobile_risk_questionnaire_path

      attribution = cookies.encrypted[Mobile::StartupRouting::ATTRIBUTION_KEY]
      state = cookies.encrypted[Mobile::StartupRouting::ONBOARDING_STATE_KEY]

      assert_equal "facebook", attribution["source"]
      assert_equal 1, attribution["show_video"]
      assert_equal 1, attribution["show_risk_questionnaire"]
      assert_equal "risk_questionnaire", attribution["first_show"]
      assert_equal false, state["video_completed"]
      assert_equal false, state["questionnaire_completed"]
    end

    test "open does not overwrite existing attribution" do
      cookies.encrypted[Mobile::StartupRouting::ATTRIBUTION_KEY] = {
        "source" => "original",
        "show_video" => 1,
        "show_risk_questionnaire" => 0,
        "first_show" => "video",
        "captured_at" => Time.current.iso8601,
        "is_organic" => false
      }
      cookies.encrypted[Mobile::StartupRouting::ONBOARDING_STATE_KEY] = {
        "video_completed" => false,
        "questionnaire_completed" => false
      }

      get mobile_open_path(source: "new-source", show_video: 0)
      assert_redirected_to mobile_video_intro_path

      attribution = cookies.encrypted[Mobile::StartupRouting::ATTRIBUTION_KEY]
      assert_equal "original", attribution["source"]
    end

    test "completion endpoints progress to intro" do
      cookies.encrypted[Mobile::StartupRouting::ATTRIBUTION_KEY] = {
        "show_video" => 1,
        "show_risk_questionnaire" => 1,
        "first_show" => "video",
        "captured_at" => Time.current.iso8601,
        "is_organic" => false
      }
      cookies.encrypted[Mobile::StartupRouting::ONBOARDING_STATE_KEY] = {
        "video_completed" => false,
        "questionnaire_completed" => false
      }

      post mobile_complete_video_path
      assert_redirected_to mobile_risk_questionnaire_path

      post mobile_complete_questionnaire_path
      assert_redirected_to mobile_intro_path
    end
  end
end
