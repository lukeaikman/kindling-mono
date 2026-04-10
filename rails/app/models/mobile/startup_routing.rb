module Mobile
  module StartupRouting
    module_function

    ATTRIBUTION_KEY = "kindling_attribution".freeze
    ONBOARDING_STATE_KEY = "kindling_onboarding_state".freeze

    def parse_int_param(value, default_value)
      return default_value if value.nil? || value == ""

      parsed = Integer(value, exception: false)
      return 1 if parsed.nil? || parsed.negative?

      parsed
    end

    def parse_first_show(value)
      value == "risk_questionnaire" ? "risk_questionnaire" : "video"
    end

    def build_attribution(params, captured_at: Time.current)
      {
        "source" => params[:source],
        "campaign" => params[:campaign],
        "location_id" => params[:location_id],
        "show_video" => parse_int_param(params[:show_video], 1),
        "show_risk_questionnaire" => parse_int_param(params[:show_risk_questionnaire], 0),
        "first_show" => parse_first_show(params[:first_show]),
        "captured_at" => captured_at.iso8601,
        "is_organic" => false,
        "raw_url" => params[:raw_url]
      }.compact
    end

    def build_organic_attribution(captured_at: Time.current)
      {
        "show_video" => 1,
        "show_risk_questionnaire" => 0,
        "first_show" => "video",
        "captured_at" => captured_at.iso8601,
        "is_organic" => true
      }
    end

    def build_onboarding_state(attribution)
      {
        "video_completed" => false,
        "video_version" => attribution["show_video"].to_i.positive? ? attribution["show_video"] : nil,
        "questionnaire_completed" => false,
        "questionnaire_version" => attribution["show_risk_questionnaire"].to_i.positive? ? attribution["show_risk_questionnaire"] : nil
      }.compact
    end

    def next_destination(attribution:, onboarding_state:)
      return "/mobile/intro" if attribution.blank? || onboarding_state.blank?

      needs_video = attribution["show_video"].to_i.positive? && !onboarding_state["video_completed"]
      needs_questionnaire = attribution["show_risk_questionnaire"].to_i.positive? && !onboarding_state["questionnaire_completed"]

      if needs_video && needs_questionnaire
        attribution["first_show"] == "video" ? "/mobile/video-intro" : "/mobile/risk-questionnaire"
      elsif needs_video
        "/mobile/video-intro"
      elsif needs_questionnaire
        "/mobile/risk-questionnaire"
      else
        "/mobile/intro"
      end
    end
  end
end
