module Mobile
  # Wave 2 Commit 4 — login + logout for already-registered Users.
  #
  # If a visitor logs in mid-onboarding, their anonymous User (with all
  # its Person/Marriage/Parentage/Will rows) gets destroyed before the
  # registered Session is started. The login form's #new action exposes
  # @has_onboarding_data so the view can warn the user that login will
  # discard their in-progress onboarding (Q8 — server-side backup for
  # the client-side warning).
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
      @has_onboarding_data = current_user&.anonymous? && current_user.current_step.present?
    end

    def create
      if (registered = User.authenticate_by(**params.permit(:email_address, :password).to_h.symbolize_keys))
        destroy_anonymous_user_if_present!
        destroy_onboarding_session! if onboarding_session.present?  # legacy cookie tidy
        cookies.delete(:user_token)
        start_new_session_for(registered)
        redirect_to mobile_dashboard_path
      else
        @email_address = params[:email_address].to_s
        flash.now[:alert] = "Try another email address or password."
        render :new, status: :unprocessable_entity
      end
    end

    def destroy
      terminate_session if Current.session
      cookies.delete(:user_token)
      destroy_onboarding_session! if onboarding_session.present?
      redirect_to mobile_intro_path
    end

    private

    # Anonymous Users are durable rows; logging in to a registered account
    # while one is around means the visitor explicitly chose to discard
    # the in-progress onboarding (the warning banner on #new tells them
    # so). Cascade-delete via has_many :people / wills + ON DELETE SET
    # NULL on users.will_maker_person_id takes the dependents.
    def destroy_anonymous_user_if_present!
      return unless current_user&.anonymous?
      current_user.destroy
      @current_user = nil
    end
  end
end
