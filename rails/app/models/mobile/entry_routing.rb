module Mobile
  class EntryRouting
    def initialize(authenticated:, stale_authenticated_cookie: false, onboarding_session: nil)
      @authenticated = authenticated
      @stale_authenticated_cookie = stale_authenticated_cookie
      @onboarding_session = onboarding_session
    end

    def destination
      return "/mobile/dashboard" if @authenticated
      return "/mobile/login" if @stale_authenticated_cookie
      return "/mobile/intro" if @onboarding_session.nil?

      startup_destination = @onboarding_session.startup_destination
      return startup_destination if startup_destination != "/mobile/intro"
      return "/mobile/intro" unless @onboarding_session.intro_seen?
      return "/mobile/auth/secure-account" if @onboarding_session.completed?

      @onboarding_session.first_incomplete_path
    end
  end
end
