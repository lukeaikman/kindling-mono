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
    # `requires_user!` mints (or finds) the anonymous User for this visitor
    # — added in Wave 2 Commit 3a so welcome/location/extended-family/
    # wrap-up actions can write to current_user.will_maker_person. The
    # legacy onboarding_session below still drives the family step (Commit
    # 3b folds it into current_user); both cookie systems coexist until
    # Commit 5 reaps the legacy machinery.
    before_action :requires_user!
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

    # ---- Welcome (Wave 2 Commit 3a — writes to current_user) ----
    #
    # Mirror-write pattern during 3a: Person is the new canonical source
    # but OnboardingSession is also updated so legacy consumers
    # (Mobile::EntryRouting, family step's still-legacy code path,
    # OnboardingSession validations) keep working. Commit 3b drops the
    # OnboardingSession leg; Commit 5 drops the table.

    def welcome
      touch_onboarding_session!
      @person = will_maker_person_with_legacy_hydration
    end

    def update_welcome
      @person = current_user.people.find_or_initialize_by(relationship_kind: "self")
      @person.assign_attributes(welcome_params)
      onboarding_session.assign_attributes(welcome_params)
      onboarding_session.current_step = "welcome"

      if @person.save(context: :welcome_step) && onboarding_session.save(context: :welcome_step)
        current_user.update!(will_maker_person: @person) if current_user.will_maker_person_id != @person.id
        bump_current_step!("location")
        redirect_to mobile_onboarding_location_path
      else
        @person.errors.merge!(onboarding_session.errors) if onboarding_session.errors.any?
        render :welcome, status: :unprocessable_entity
      end
    end

    # ---- Location (3a) ----

    def location
      touch_onboarding_session!
      @person = will_maker_person_with_legacy_hydration
    end

    def update_location
      @person = current_user.people.find_or_initialize_by(relationship_kind: "self")
      @person.assign_attributes(location_params)
      onboarding_session.assign_attributes(location_params)
      onboarding_session.current_step = "location"

      if @person.save(context: :location_step) && onboarding_session.save(context: :location_step)
        current_user.update!(will_maker_person: @person) if current_user.will_maker_person_id != @person.id
        bump_current_step!("family")
        redirect_to mobile_onboarding_family_path
      else
        @person.errors.merge!(onboarding_session.errors) if onboarding_session.errors.any?
        render :location, status: :unprocessable_entity
      end
    end

    # ---- Family (still on OnboardingSession until Commit 3b) ----

    def family
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
        bump_current_step!("extended_family")
        redirect_to mobile_onboarding_extended_family_path
      else
        render :family, status: :unprocessable_entity
      end
    end

    # ---- Extended family (3a) ----

    def extended_family
      touch_onboarding_session!
      @person = will_maker_person_with_legacy_hydration
    end

    def update_extended_family
      @person = current_user.people.find_or_initialize_by(relationship_kind: "self")
      @person.assign_attributes(extended_family_params)
      onboarding_session.assign_attributes(extended_family_params)
      onboarding_session.current_step = "extended_family"

      if @person.save(context: :extended_family_step) && onboarding_session.save(context: :extended_family_step)
        current_user.update!(will_maker_person: @person) if current_user.will_maker_person_id != @person.id
        bump_current_step!("wrap_up")
        redirect_to mobile_onboarding_wrap_up_path
      else
        @person.errors.merge!(onboarding_session.errors) if onboarding_session.errors.any?
        render :extended_family, status: :unprocessable_entity
      end
    end

    # ---- Wrap-up (3a) ----

    def wrap_up
      touch_onboarding_session!
      @summary_facts = current_user.summary_facts
    end

    def continue_wrap_up
      current_user.update!(completed_at: Time.current, current_step: "completed")
      # Keep marking the legacy OnboardingSession too so any straggler reads
      # of `onboarding_session.completed?` (Mobile::EntryRouting, etc.) stay
      # accurate until Commit 5 reaps the model.
      onboarding_session.update!(completed_at: Time.current, current_step: "wrap_up", last_seen_at: Time.current)
      redirect_to mobile_secure_account_path
    end

    private

    # Wave 2 Commit 3a transitional helper. The will-maker Person is the
    # new canonical source of identity/location/extended-family data, but
    # users mid-flight (or tests using `create_onboarding_session`) may
    # have data only on the legacy OnboardingSession row. On every GET we
    # find-or-build the Person; if it's brand new, copy the relevant
    # fields out of OnboardingSession so the form re-renders with the
    # values the user already supplied. Once Commit 3b lands and Commit
    # 5 drops OnboardingSession, this helper goes away.
    def will_maker_person_with_legacy_hydration
      person = current_user.people.find_or_initialize_by(relationship_kind: "self")
      return person if person.persisted?

      person.assign_attributes(
        first_name: onboarding_session.first_name,
        middle_names: onboarding_session.middle_names,
        last_name: onboarding_session.last_name,
        date_of_birth: onboarding_session.date_of_birth,
        country_of_residence: onboarding_session.country_of_residence,
        nationality: onboarding_session.nationality,
        domiciled_in_uk: onboarding_session.domiciled_in_uk,
        currently_resident_in_uk: onboarding_session.currently_resident_in_uk,
        parents_alive: onboarding_session.parents_alive,
        parents_in_law_alive: onboarding_session.parents_in_law_alive,
        siblings_alive: onboarding_session.siblings_alive,
        number_of_siblings: onboarding_session.number_of_siblings
      )
      person
    end

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

    # Mid-state during Wave 2 Commit 3a: bump `current_user.current_step`
    # alongside any OnboardingSession write so `User#first_incomplete_path`
    # tracks reality once the OnboardingController fully migrates in 3b.
    # Idempotent and safe to call multiple times for the same step.
    def bump_current_step!(step)
      return if current_user.current_step == "completed"
      current_user.update!(current_step: step) unless current_user.current_step == step
    end

    def welcome_params
      params.require(:person).permit(:first_name, :middle_names, :last_name, :date_of_birth)
    end

    def location_params
      params.require(:person).permit(:country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk)
    end

    def family_params
      params.require(:onboarding_session).permit(
        :relationship_status,
        :spouse_first_name,
        :spouse_last_name,
        :partner_started_at,
        :times_divorced,
        :times_widowed,
        :has_children,
        children_payload: %i[
          id
          first_name
          last_name
          date_of_birth
          relationship
          capacity_status
          disabled_answer
          lacks_mental_capacity_answer
          co_parent_type
          co_parent_partner_relationship_to_child
          co_parent_other_first_name
          co_parent_other_last_name
          co_parent_other_relationship_to_child
        ]
      )
    end

    def extended_family_params
      params.require(:person).permit(:parents_alive, :parents_in_law_alive, :siblings_alive, :number_of_siblings)
    end
  end
end
