module Mobile
  # Wave 2 Commit 4 — secure-account / register.
  #
  # The end of the onboarding journey: the anonymous User row carrying all
  # the Person + Marriage + Parentage data gets `email_address` +
  # `password_digest` set, upgrading in place. No data is migrated — the
  # User row IS the same row, only newly authenticated.
  #
  # Cookie cutover at success: the signed `:user_token` cookie (anonymous
  # identity) is deleted; a Session row + signed `:session_id` cookie
  # (authenticated identity) is started in its place. From then on
  # `current_user` resolves via the registered-user branch and
  # `authenticated?` is true.
  class AuthController < BaseController
    allow_unauthenticated_access
    rate_limit to: 10, within: 3.minutes, only: :register,
      with: -> { redirect_to mobile_secure_account_path, alert: "Try again in a moment." }

    def secure_account
      return redirect_to mobile_dashboard_path if authenticated?
      return redirect_to mobile_intro_path unless current_user
      return redirect_to current_user.first_incomplete_path unless current_user.completed_at.present?

      @user = current_user
    end

    def register
      return redirect_to mobile_dashboard_path if authenticated?
      return redirect_to mobile_intro_path unless current_user

      @user = current_user
      @user.assign_attributes(register_params)

      if @user.save(context: :register)
        cookies.delete(:user_token)
        start_new_session_for(@user)
        redirect_to mobile_dashboard_path, notice: "Welcome aboard."
      else
        render :secure_account, status: :unprocessable_entity
      end
    end

    private

    def register_params
      params.require(:user).permit(:email_address, :password, :password_confirmation)
    end
  end
end
