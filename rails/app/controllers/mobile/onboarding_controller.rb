module Mobile
  class OnboardingController < BaseController
    STEP_ORDER = {
      welcome: 1,
      location: 2,
      family: 3,
      extended_family: 4,
      wrap_up: 5
    }.freeze

    allow_unauthenticated_access
    before_action :redirect_authenticated_or_stale_session!
    before_action :require_onboarding_session!
    before_action :assign_onboarding_session
    before_action :redirect_completed_session!, except: %i[wrap_up continue_wrap_up]
    before_action :require_intro_seen!, except: :index
    before_action -> { redirect_if_step_locked!(:welcome) }, only: %i[welcome update_welcome]
    before_action -> { redirect_if_step_locked!(:location) }, only: %i[location update_location]
    before_action -> { redirect_if_step_locked!(:family) }, only: %i[family update_family]
    before_action -> { redirect_if_step_locked!(:extended_family) }, only: %i[extended_family update_extended_family]
    before_action -> { redirect_if_step_locked!(:wrap_up) }, only: %i[wrap_up continue_wrap_up]

    def index
      redirect_to mobile_intro_path and return unless onboarding_session.intro_seen?
      redirect_to mobile_secure_account_path and return if onboarding_session.completed?

      touch_onboarding_session!
      redirect_to onboarding_session.first_incomplete_path
    end

    def welcome
      touch_onboarding_session!
    end

    def update_welcome
      onboarding_session.assign_attributes(welcome_params)
      onboarding_session.current_step = "welcome"

      if onboarding_session.save(context: :welcome_step)
        redirect_to mobile_onboarding_location_path
      else
        render :welcome, status: :unprocessable_entity
      end
    end

    def location
      touch_onboarding_session!
    end

    def update_location
      onboarding_session.assign_attributes(location_params)
      onboarding_session.current_step = "location"

      if onboarding_session.save(context: :location_step)
        redirect_to mobile_onboarding_family_path
      else
        render :location, status: :unprocessable_entity
      end
    end

    def family
      onboarding_session.divorce_status = "no" if onboarding_session.divorce_status.blank?
      touch_onboarding_session!
    end

    def update_family
      onboarding_session.assign_attributes(family_params.except(:children_payload))
      onboarding_session.children_payload = if family_params[:has_children] == "yes"
        family_params[:children_payload]
      else
        []
      end
      onboarding_session.current_step = "family"

      if onboarding_session.save(context: :family_step)
        redirect_to mobile_onboarding_extended_family_path
      else
        render :family, status: :unprocessable_entity
      end
    end

    def extended_family
      touch_onboarding_session!
    end

    def update_extended_family
      onboarding_session.assign_attributes(extended_family_params)
      onboarding_session.current_step = "extended_family"

      if onboarding_session.save(context: :extended_family_step)
        redirect_to mobile_onboarding_wrap_up_path
      else
        render :extended_family, status: :unprocessable_entity
      end
    end

    def wrap_up
      touch_onboarding_session!
    end

    def continue_wrap_up
      onboarding_session.update!(completed_at: Time.current, current_step: "wrap_up", last_seen_at: Time.current)
      redirect_to mobile_secure_account_path
    end

    private

    def redirect_authenticated_or_stale_session!
      if authenticated?
        redirect_to mobile_dashboard_path
      elsif stale_authenticated_cookie?
        clear_stale_authenticated_cookie!
        redirect_to mobile_login_path
      end
    end

    def require_onboarding_session!
      redirect_to mobile_intro_path unless onboarding_session.present?
    end

    def assign_onboarding_session
      @onboarding_session = onboarding_session
    end

    def redirect_completed_session!
      redirect_to mobile_secure_account_path if onboarding_session.completed?
    end

    def require_intro_seen!
      redirect_to mobile_intro_path unless onboarding_session.intro_seen?
    end

    def redirect_if_step_locked!(requested_step)
      first_incomplete = onboarding_session.first_incomplete_path
      first_incomplete_step = path_to_step(first_incomplete)
      return if first_incomplete_step.nil?
      return if STEP_ORDER[requested_step] <= STEP_ORDER[first_incomplete_step]

      redirect_to first_incomplete
    end

    def path_to_step(path)
      OnboardingSession::STEP_PATHS.key(path)
    end

    def welcome_params
      params.require(:onboarding_session).permit(:first_name, :middle_names, :last_name, :date_of_birth)
    end

    def location_params
      params.require(:onboarding_session).permit(:country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk)
    end

    def family_params
      params.require(:onboarding_session).permit(
        :relationship_status,
        :spouse_first_name,
        :spouse_last_name,
        :divorce_status,
        :has_children,
        children_payload: %i[
          id
          first_name
          last_name
          date_of_birth
          relationship
          responsibility
          capacity_status
          disabled_answer
          lacks_mental_capacity_answer
          co_guardian_first_name
          co_guardian_last_name
          co_guardian_relationship
        ]
      )
    end

    def extended_family_params
      params.require(:onboarding_session).permit(:parents_alive, :parents_in_law_alive, :siblings_alive, :number_of_siblings)
    end
  end
end
