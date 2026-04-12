module Mobile
  class BaseController < ApplicationController
    layout "mobile"

    private

    def request_authentication
      session[:return_to_after_authenticating] = request.url
      redirect_to mobile_login_path
    end

    def after_authentication_url
      session.delete(:return_to_after_authenticating) || mobile_dashboard_path
    end

    def stale_authenticated_cookie?
      cookies.signed[:session_id].present? && !authenticated?
    end

    def clear_stale_authenticated_cookie!
      cookies.delete(:session_id)
    end

    def onboarding_session
      return @onboarding_session if defined?(@onboarding_session)

      token = cookies.signed[OnboardingSession::COOKIE_KEY]
      @onboarding_session = token.present? ? OnboardingSession.find_by(token: token) : nil

      clear_onboarding_session_cookie! if token.present? && @onboarding_session.nil?

      if @onboarding_session&.inactive_for_more_than?(3.hours)
        @onboarding_session.destroy!
        clear_onboarding_session_cookie!
        @onboarding_session = nil
      end

      @onboarding_session
    end

    def find_or_create_onboarding_session!
      @onboarding_session = onboarding_session || create_onboarding_session!
    end

    def create_onboarding_session!(attributes = {})
      onboarding_session = OnboardingSession.create!({ last_seen_at: Time.current }.merge(attributes))
      cookies.signed[OnboardingSession::COOKIE_KEY] = {
        value: onboarding_session.token,
        expires: 3.hours.from_now,
        httponly: true,
        same_site: :lax
      }
      onboarding_session
    end

    def clear_onboarding_session_cookie!
      cookies.delete(OnboardingSession::COOKIE_KEY)
    end

    def destroy_onboarding_session!
      onboarding_session&.destroy!
      clear_onboarding_session_cookie!
      @onboarding_session = nil
    end

    def touch_onboarding_session!
      return unless onboarding_session.present?

      onboarding_session.touch_last_seen!
      if cookies.signed[OnboardingSession::COOKIE_KEY].present?
        cookies.signed[OnboardingSession::COOKIE_KEY] = {
          value: onboarding_session.token,
          expires: 3.hours.from_now,
          httponly: true,
          same_site: :lax
        }
      end
    end

    def mobile_entry_destination
      Mobile::EntryRouting.new(
        authenticated: authenticated?,
        stale_authenticated_cookie: stale_authenticated_cookie?,
        onboarding_session: onboarding_session
      ).destination
    end
  end
end
