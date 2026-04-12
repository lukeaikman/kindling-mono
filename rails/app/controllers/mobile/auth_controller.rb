module Mobile
  class AuthController < BaseController
    allow_unauthenticated_access

    def secure_account
      if authenticated?
        redirect_to mobile_dashboard_path
        return
      end

      @onboarding_session = onboarding_session
      unless @onboarding_session&.completed?
        redirect_to mobile_intro_path
        return
      end
    end
  end
end
