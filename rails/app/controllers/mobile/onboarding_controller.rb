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

    # ---- Family (Wave 2 Commit 3b — writes to Marriage + Parentage rows) ----

    def family
      touch_onboarding_session!
      ensure_will_maker_person!
      @person = current_user.will_maker_person
      @active_marriage = current_user.active_marriage
      @children_params = build_children_params_from_db
    end

    def update_family
      ensure_will_maker_person!
      ActiveRecord::Base.transaction do
        sync_partner!(family_params)
        sync_children!(family_params[:children] || {}, family_params[:has_children])

        will_maker = current_user.will_maker_person
        will_maker.assign_attributes(
          times_divorced: family_params[:times_divorced].to_i,
          times_widowed: family_params[:times_widowed].to_i
        )
        will_maker.save!
        bump_current_step!("extended_family")
      end
      redirect_to mobile_onboarding_extended_family_path
    rescue ActiveRecord::RecordInvalid => e
      current_user.reload  # drop transaction-rolled-back association cache
      @person = current_user.will_maker_person
      @active_marriage = current_user.active_marriage
      @children_params = build_children_params_from_form
      flash.now[:alert] = e.record.errors.full_messages.first
      render :family, status: :unprocessable_entity
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

    PARTNER_KINDS = %w[married civil_partnership cohabiting].freeze
    NON_PARTNER_KINDS = %w[single widowed divorced].freeze
    PARENTAGE_KIND_BY_FORM_VALUE = {
      "biological-child" => "biological",
      "adopted-child"    => "adoptive",
      "stepchild"        => "step",
      "foster-child"     => "foster"
    }.freeze
    FORM_VALUE_BY_PARENTAGE_KIND = PARENTAGE_KIND_BY_FORM_VALUE.invert.freeze

    def family_params
      base = params.permit(:relationship_kind, :times_divorced, :times_widowed, :has_children)
      partner = params.fetch(:partner, {}).permit(:first_name, :last_name, :started_at)
      raw_children = params.fetch(:children, {})
      raw_children = raw_children.to_unsafe_h if raw_children.respond_to?(:to_unsafe_h)
      children = (raw_children || {}).each_with_object({}) do |(index, child_params), h|
        next unless child_params.respond_to?(:[])
        permitted_params = child_params.respond_to?(:permit) ? child_params : ActionController::Parameters.new(child_params.to_h)
        h[index] = permitted_params.permit(
          :id, :position, :first_name, :last_name, :date_of_birth,
          :relationship, :disabled_answer, :lacks_mental_capacity_answer,
          :co_parent_type, :co_parent_partner_relationship_to_child,
          :co_parent_other_first_name, :co_parent_other_last_name,
          :co_parent_other_relationship_to_child
        )
      end
      base.merge(partner: partner, children: children)
    end

    # Builds an Array of Hashes (one per existing child row) shaped exactly
    # like the form params would be on submit. Lets the family view template
    # iterate the same way whether the data came from the DB or from a
    # rejected form submission.
    def build_children_params_from_db
      will_maker = current_user.will_maker_person
      return [] if will_maker.nil? || will_maker.new_record?

      will_maker.outbound_parentages
                .includes(:child_person)
                .joins(:child_person)
                .where(people: { relationship_kind: "child" })
                .order(:position, :id).map.with_index do |parentage, idx|
        child = parentage.child_person
        second = Parentage.where(child_person: child).where.not(id: parentage.id).first
        second_parent = second&.parent_person
        co_type = derive_co_parent_type(second_parent)
        {
          "id" => child.id.to_s,
          "position" => parentage.position || idx,
          "first_name" => child.first_name,
          "last_name" => child.last_name,
          "date_of_birth" => child.date_of_birth,
          "relationship" => FORM_VALUE_BY_PARENTAGE_KIND[parentage.kind] || "biological-child",
          "capacity_status" => "under-18",
          "disabled_answer" => child.disabled ? "yes" : "no",
          "lacks_mental_capacity_answer" => child.lacks_mental_capacity ? "yes" : "no",
          "co_parent_type" => co_type,
          "co_parent_partner_relationship_to_child" => (second.kind if second_parent&.relationship_kind == "spouse"),
          "co_parent_other_first_name" => (second_parent.first_name if second_parent&.relationship_kind == "co_parent"),
          "co_parent_other_last_name" => (second_parent.last_name if second_parent&.relationship_kind == "co_parent"),
          "co_parent_other_relationship_to_child" => (second.kind if second_parent&.relationship_kind == "co_parent")
        }
      end
    end

    def build_children_params_from_form
      (family_params[:children] || {}).values.sort_by { |c| c[:position].to_i }.map(&:to_h)
    end

    def derive_co_parent_type(second_parent)
      return nil if second_parent.nil?
      case second_parent.relationship_kind
      when "spouse"    then "yes_with_partner"
      when "co_parent" then "yes_with_other"
      end
    end

    def ensure_will_maker_person!
      return if current_user.will_maker_person.present?
      person = current_user.people.find_or_create_by!(relationship_kind: "self")
      current_user.update!(will_maker_person: person)
    end

    # Sync the will-maker's active partnership against form input. Three
    # cases: partner kind (married/civil_partnership/cohabiting), non-partner
    # kind (single/widowed/divorced) with prior active marriage (end it),
    # non-partner kind with no prior (no-op).
    def sync_partner!(params)
      new_kind = params[:relationship_kind].presence
      partner_attrs = params[:partner] || {}
      will_maker = current_user.will_maker_person
      active = current_user.active_marriage

      if new_kind.in?(PARTNER_KINDS)
        spouse = active&.partner_person ||
                 current_user.people.where(relationship_kind: "spouse").first ||
                 current_user.people.create!(relationship_kind: "spouse")
        spouse.assign_attributes(
          first_name: partner_attrs[:first_name],
          last_name: partner_attrs[:last_name]
        )
        spouse.save!(context: :family_step)

        started_at = partner_attrs[:started_at].presence
        if active
          active.update!(kind: new_kind, started_at: started_at)
        else
          Marriage.create!(
            will_maker_person: will_maker,
            partner_person: spouse,
            kind: new_kind,
            phase: "active",
            started_at: started_at
          )
        end
      elsif active
        active.update!(phase: "separated", ended_at: Date.current)
      end
    end

    # Sync the will-maker's children against form input. Builds/updates
    # Person rows for each child + their will-maker → child Parentage,
    # delegates co-parent handling to sync_co_parent!. Removed children
    # are destroyed (cascade-deletes Parentage rows; orphaned ad-hoc
    # co-parents tidied up).
    def sync_children!(children_attrs, has_children)
      will_maker = current_user.will_maker_person

      if has_children != "yes"
        # User toggled to no children; destroy any existing.
        destroy_children!(will_maker, will_maker.outbound_parentages.includes(:child_person)
                                              .joins(:child_person)
                                              .where(people: { relationship_kind: "child" }))
        return
      end

      submitted = children_attrs.values.sort_by { |c| c[:position].to_i }
      existing_parentages = will_maker.outbound_parentages.includes(:child_person)
                                      .joins(:child_person)
                                      .where(people: { relationship_kind: "child" })
                                      .index_by { |p| p.child_person_id }

      survivors = []

      submitted.each_with_index do |attrs, index|
        child_id = attrs[:id].presence&.to_i
        parentage = existing_parentages[child_id] if child_id
        person = parentage&.child_person ||
                 current_user.people.build(relationship_kind: "child")

        person.assign_attributes(
          first_name: attrs[:first_name],
          last_name: attrs[:last_name],
          date_of_birth: attrs[:date_of_birth].presence,
          disabled: attrs[:disabled_answer] == "yes",
          lacks_mental_capacity: attrs[:lacks_mental_capacity_answer] == "yes"
        )
        person.save!(context: :family_step)

        kind = PARENTAGE_KIND_BY_FORM_VALUE.fetch(attrs[:relationship], "biological")
        if parentage
          parentage.update!(kind: kind, position: index)
        else
          parentage = Parentage.create!(
            parent_person: will_maker,
            child_person: person,
            kind: kind,
            position: index
          )
        end

        sync_co_parent!(person, parentage, attrs)
        survivors << person.id
      end

      # Remove children no longer in the form.
      orphaned = existing_parentages.values.reject { |p| survivors.include?(p.child_person_id) }
      destroy_children!(will_maker, orphaned)
    end

    def destroy_children!(_will_maker, parentages)
      parentages.each do |orphaned_parentage|
        child = orphaned_parentage.child_person
        # Capture co_parent Persons that will be orphaned by this child's
        # removal. Cascade-delete on child takes their Parentages with it,
        # but the Person rows themselves need explicit cleanup.
        second_parents = Parentage.where(child_person: child)
                                  .where.not(id: orphaned_parentage.id)
                                  .map(&:parent_person)
                                  .select { |p| p.relationship_kind == "co_parent" }
        child.destroy
        second_parents.each do |p|
          p.destroy if Parentage.where(parent_person: p).count.zero?
        end
      end
    end

    # Per-child co-parent shape. Branches on co_parent_type:
    #   yes_with_partner — second Parentage points at the active spouse
    #   yes_with_other   — second Parentage points at an ad-hoc co_parent Person
    #   no_deceased / no_sole / nil — no second Parentage; remove if present
    #
    # When co_parent_type changes (e.g. yes_with_other → yes_with_partner),
    # the prior ad-hoc co_parent Person is destroyed if it has no other
    # Parentages.
    def sync_co_parent!(child_person, will_maker_parentage, attrs)
      co_type = attrs[:co_parent_type].presence
      second_parentage = Parentage.where(child_person: child_person).where.not(id: will_maker_parentage.id).first
      prior_parent_person = second_parentage&.parent_person

      case co_type
      when "yes_with_partner"
        spouse = current_user.active_marriage&.partner_person
        return if spouse.nil?  # no partner — silently skip; form should hide this option

        if second_parentage
          second_parentage.update!(parent_person: spouse, kind: attrs[:co_parent_partner_relationship_to_child])
        else
          Parentage.create!(parent_person: spouse, child_person: child_person, kind: attrs[:co_parent_partner_relationship_to_child])
        end
        cleanup_orphaned_co_parent(prior_parent_person) if prior_parent_person && prior_parent_person != spouse
      when "yes_with_other"
        other = (prior_parent_person if prior_parent_person&.relationship_kind == "co_parent") ||
                current_user.people.create!(relationship_kind: "co_parent")
        other.assign_attributes(
          first_name: attrs[:co_parent_other_first_name],
          last_name: attrs[:co_parent_other_last_name]
        )
        other.save!(context: :family_step)
        if second_parentage
          second_parentage.update!(parent_person: other, kind: attrs[:co_parent_other_relationship_to_child])
        else
          Parentage.create!(parent_person: other, child_person: child_person, kind: attrs[:co_parent_other_relationship_to_child])
        end
        cleanup_orphaned_co_parent(prior_parent_person) if prior_parent_person && prior_parent_person != other
      when "no_deceased", "no_sole", nil
        if second_parentage
          second_parentage.destroy
          cleanup_orphaned_co_parent(prior_parent_person)
        end
      end
    end

    def cleanup_orphaned_co_parent(person)
      return unless person&.relationship_kind == "co_parent"
      return if Parentage.where(parent_person: person).any?
      person.destroy
    end

    def extended_family_params
      params.require(:person).permit(:parents_alive, :parents_in_law_alive, :siblings_alive, :number_of_siblings)
    end
  end
end
