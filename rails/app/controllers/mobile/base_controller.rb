module Mobile
  class BaseController < ApplicationController
    layout "mobile"

    helper_method :current_user

    before_action :touch_user_if_present

    # Wave 2 Commit 2 — anonymous-from-day-one User machinery.
    #
    # Why two cookie systems for the moment:
    # `current_user` (signed `:user_token` cookie) is the unified-shape
    # path: anonymous Users land here on intro-continue, upgrade in place
    # at registration. The legacy `onboarding_session` (signed
    # `OnboardingSession::COOKIE_KEY` cookie) below is what the live
    # OnboardingController still reads. Commit 3 swaps OnboardingController
    # over to `current_user` and the legacy cookie machinery deletes.
    # Until then both code paths coexist.
    private

    def current_user
      @current_user ||= find_current_user
    end

    def find_current_user
      if (user_id = session[:user_id])
        registered = User.find_by(id: user_id)
        return registered if registered

        session.delete(:user_id)  # stale id; clear
      end

      if (cookie_token = cookies.signed[:user_token])
        anonymous = User.find_by_cookie_token(cookie_token)
        return anonymous if anonymous && !user_stale?(anonymous)

        # Cookie present but no matching anonymous User — either an admin
        # deleted the row in Motor / console, or the cleanup job got there
        # first. Either way the cookie is dead; clear it (and the legacy
        # OnboardingSession cookie + row, since they reference each other
        # via the user's browser session).
        if anonymous
          cleanup_stale_user!(anonymous)
        else
          clear_orphaned_user_cookies!
        end
      end

      nil
    end

    # Onboarding + auth controllers call this to guarantee a User exists
    # for the request. Marketing pages (intro, video-intro,
    # risk-questionnaire) deliberately do NOT call it — they should be
    # visitable by bots and link-checkers without minting a User row each
    # time. Q2 fix from the v4 plan.
    def requires_user!
      @current_user = current_user || create_anonymous_user!
    end

    def create_anonymous_user!
      user = User.create!
      cookies.signed[:user_token] = {
        value: user.token,  # plaintext; DB stores token_digest
        expires: 3.hours.from_now,
        httponly: true,
        same_site: :lax,
        secure: Rails.env.production?
      }
      user
    end

    def user_stale?(user)
      user.last_seen_at.present? && user.last_seen_at < 3.hours.ago
    end

    def cleanup_stale_user!(stale_user)
      stale_user.destroy
      clear_orphaned_user_cookies!
    end

    # Clears the user_token cookie + the legacy OnboardingSession state
    # (cookie and row), so the next request starts onboarding from
    # welcome instead of routing back into a partially-completed flow
    # that no longer has a User behind it. Used both when the cookie is
    # present-but-orphaned (User deleted out from under us) and when the
    # User row was just destroyed by the cleanup-job path.
    def clear_orphaned_user_cookies!
      cookies.delete(:user_token)
      destroy_onboarding_session! if onboarding_session.present?
      @current_user = nil
    end

    def touch_user_if_present
      current_user&.touch_last_seen! if current_user&.anonymous?
    end

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
