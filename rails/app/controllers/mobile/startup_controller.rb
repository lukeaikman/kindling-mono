module Mobile
  class StartupController < ApplicationController
    layout "mobile"
    allow_unauthenticated_access

    def index
      @destination = Mobile::StartupRouting.next_destination(
        attribution: stored_attribution,
        onboarding_state: stored_onboarding_state
      )
    end

    def open
      attribution = stored_attribution

      if attribution.blank?
        attribution = Mobile::StartupRouting.build_attribution(
          params.permit(:source, :campaign, :location_id, :show_video, :show_risk_questionnaire, :first_show)
            .to_h.symbolize_keys
            .merge(raw_url: request.original_url)
        )

        write_attribution(attribution)
        write_onboarding_state(Mobile::StartupRouting.build_onboarding_state(attribution))
      end

      redirect_to Mobile::StartupRouting.next_destination(
        attribution: attribution,
        onboarding_state: stored_onboarding_state
      ), allow_other_host: false
    end

    def intro
    end

    def video_intro
      @video_url = view_context.video_path("mobile/intro-v1.mp4")
    end

    def risk_questionnaire
    end

    def complete_video
      update_onboarding_state("video_completed" => true)
      redirect_to next_destination_after_completion, allow_other_host: false
    end

    def complete_questionnaire
      update_onboarding_state("questionnaire_completed" => true)
      redirect_to next_destination_after_completion, allow_other_host: false
    end

    private

    def stored_attribution
      cookies.encrypted[Mobile::StartupRouting::ATTRIBUTION_KEY].presence
    end

    def stored_onboarding_state
      cookies.encrypted[Mobile::StartupRouting::ONBOARDING_STATE_KEY].presence
    end

    def write_attribution(value)
      cookies.encrypted[Mobile::StartupRouting::ATTRIBUTION_KEY] = {
        value: value,
        expires: 1.year.from_now,
        httponly: true,
        same_site: :lax
      }
    end

    def write_onboarding_state(value)
      cookies.encrypted[Mobile::StartupRouting::ONBOARDING_STATE_KEY] = {
        value: value,
        expires: 1.year.from_now,
        httponly: true,
        same_site: :lax
      }
    end

    def update_onboarding_state(updates)
      state = stored_onboarding_state || {}
      write_onboarding_state(state.merge(updates))
    end

    def next_destination_after_completion
      Mobile::StartupRouting.next_destination(
        attribution: stored_attribution,
        onboarding_state: stored_onboarding_state
      )
    end
  end
end
