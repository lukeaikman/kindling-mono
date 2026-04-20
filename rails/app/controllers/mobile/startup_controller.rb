module Mobile
  class StartupController < BaseController
    allow_unauthenticated_access

    def index
      if stale_authenticated_cookie?
        clear_stale_authenticated_cookie!
        @destination = mobile_login_path
        return
      end

      prepare_entry_session!
      @destination = mobile_entry_destination
    end

    def open
      if authenticated?
        redirect_to mobile_dashboard_path, allow_other_host: false
        return
      end

      if stale_authenticated_cookie?
        clear_stale_authenticated_cookie!
        redirect_to mobile_login_path, allow_other_host: false
        return
      end

      find_or_create_onboarding_session!
      touch_onboarding_session!
      onboarding_session.apply_startup_attribution!(
        params.permit(:source, :campaign, :location_id, :show_video, :show_risk_questionnaire, :first_show).to_h.symbolize_keys,
        raw_url: request.original_url
      )

      redirect_to mobile_entry_destination, allow_other_host: false
    end

    def intro
      redirect_authenticated_or_stale_session!
      return if performed?

      prepare_entry_session!
      touch_onboarding_session!
    end

    def video_intro
      redirect_authenticated_or_stale_session!
      return if performed?

      prepare_entry_session!
      touch_onboarding_session!
      @video_url = view_context.video_path("mobile/intro-v1.mp4")
    end

    def risk_questionnaire
      redirect_authenticated_or_stale_session!
      return if performed?

      prepare_entry_session!
      touch_onboarding_session!
    end

    def complete_video
      redirect_authenticated_or_stale_session!
      return if performed?

      prepare_entry_session!
      onboarding_session.mark_video_completed!
      redirect_to mobile_entry_destination, allow_other_host: false
    end

    def complete_questionnaire
      redirect_authenticated_or_stale_session!
      return if performed?

      prepare_entry_session!
      onboarding_session.mark_questionnaire_completed!
      redirect_to mobile_entry_destination, allow_other_host: false
    end

    def continue_intro
      redirect_authenticated_or_stale_session!
      return if performed?

      prepare_entry_session!
      onboarding_session.mark_intro_seen!
      redirect_to onboarding_session.first_incomplete_path, allow_other_host: false
    end

    private

    def prepare_entry_session!
      return if authenticated?
      return if stale_authenticated_cookie?

      find_or_create_onboarding_session!
      onboarding_session.ensure_startup_defaults!
      touch_onboarding_session!
    end

    def redirect_authenticated_or_stale_session!
      if authenticated?
        redirect_to mobile_dashboard_path
      elsif stale_authenticated_cookie?
        clear_stale_authenticated_cookie!
        redirect_to mobile_login_path
      end
    end
  end
end
