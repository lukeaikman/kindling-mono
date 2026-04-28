module Mobile
  class SessionsController < BaseController
    allow_unauthenticated_access only: %i[new create]
    rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to mobile_login_path, alert: "Try again later." }

    def new
      if authenticated?
        redirect_to mobile_dashboard_path
        return
      end

      clear_stale_authenticated_cookie! if stale_authenticated_cookie?
      @email_address = params[:email_address].to_s
    end

    def create
      if (user = User.authenticate_by(**params.permit(:email_address, :password).to_h.symbolize_keys))
        destroy_onboarding_session! if onboarding_session.present?
        start_new_session_for(user)
        redirect_to mobile_dashboard_path
      else
        @email_address = params[:email_address].to_s
        flash.now[:alert] = "Try another email address or password."
        render :new, status: :unprocessable_entity
      end
    end
  end
end
