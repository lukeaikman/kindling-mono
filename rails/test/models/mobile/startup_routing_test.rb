require "test_helper"

module Mobile
  class StartupRoutingTest < ActiveSupport::TestCase
    test "parse_int_param uses default for blank" do
      assert_equal 1, StartupRouting.parse_int_param(nil, 1)
      assert_equal 0, StartupRouting.parse_int_param("", 0)
    end

    test "parse_int_param uses 1 for invalid existing values" do
      assert_equal 1, StartupRouting.parse_int_param("abc", 0)
      assert_equal 1, StartupRouting.parse_int_param("-2", 0)
    end

    test "parse_int_param keeps valid values" do
      assert_equal 0, StartupRouting.parse_int_param("0", 1)
      assert_equal 3, StartupRouting.parse_int_param("3", 1)
    end

    test "next_destination falls back to intro when state missing" do
      assert_equal "/mobile/intro", StartupRouting.next_destination(attribution: nil, onboarding_state: {})
      assert_equal "/mobile/intro", StartupRouting.next_destination(attribution: { "show_video" => 1 }, onboarding_state: nil)
    end

    test "next_destination routes by first_show when both required" do
      attribution = { "show_video" => 1, "show_risk_questionnaire" => 1, "first_show" => "video" }
      state = { "video_completed" => false, "questionnaire_completed" => false }
      assert_equal "/mobile/video-intro", StartupRouting.next_destination(attribution: attribution, onboarding_state: state)

      attribution["first_show"] = "risk_questionnaire"
      assert_equal "/mobile/risk-questionnaire", StartupRouting.next_destination(attribution: attribution, onboarding_state: state)
    end

    test "next_destination routes to intro when complete" do
      attribution = { "show_video" => 1, "show_risk_questionnaire" => 1, "first_show" => "video" }
      state = { "video_completed" => true, "questionnaire_completed" => true }

      assert_equal "/mobile/intro", StartupRouting.next_destination(attribution: attribution, onboarding_state: state)
    end
  end
end
