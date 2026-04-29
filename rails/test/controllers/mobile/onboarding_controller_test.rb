require "test_helper"

module Mobile
  class OnboardingControllerTest < ActionDispatch::IntegrationTest
    test "intro continue stamps intro seen and redirects to onboarding welcome" do
      onboarding_session = create_onboarding_session(video_intro_version: 1, video_completed_at: Time.current)

      post mobile_intro_continue_path

      assert_redirected_to mobile_onboarding_welcome_path
      assert onboarding_session.reload.intro_seen_at.present?
    end

    test "onboarding index redirects to first incomplete step" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1)
      )

      get mobile_onboarding_path

      assert_redirected_to mobile_onboarding_location_path
    end

    test "welcome blocks under-age submissions" do
      create_onboarding_session(video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current)

      patch mobile_onboarding_welcome_path, params: {
        person: {
          first_name: "Ava",
          last_name: "Young",
          date_of_birth: 17.years.ago.to_date.iso8601
        }
      }

      assert_response :unprocessable_entity
      assert_select ".mobile-form-error"
    end

    test "location uses collapsible radio groups" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1)
      )

      get mobile_onboarding_location_path

      assert_response :success
      assert_select ".mobile-radio-group[data-choice-group-collapsible-value='true']", minimum: 2
    end

    test "location step offers Northern Ireland as a country option" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1)
      )

      get mobile_onboarding_location_path

      assert_response :success
      assert_match(/Northern Ireland/, response.body)
      assert_match(/northern_ireland/, response.body)
    end

    test "location step accepts northern_ireland as a valid country_of_residence" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1)
      )

      patch mobile_onboarding_location_path, params: {
        person: {
          country_of_residence: "northern_ireland",
          nationality: "british",
          domiciled_in_uk: "yes",
          currently_resident_in_uk: "yes"
        }
      }

      assert_redirected_to mobile_onboarding_family_path
    end

    test "family form has correct conditional-reveal wiring (data-action, data-role, hidden state)" do
      # Single user — partner-fields should be hidden, children-section should be hidden
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "single",
        divorce_status: "no",
        has_children: "no"
      )

      get mobile_onboarding_family_path

      assert_response :success

      # Form has the correct Stimulus controller + action wiring
      assert_select "form[data-controller~='family-form']"
      assert_select "form[data-action*='change->family-form#formChange']"
      assert_select "form[data-action*='click->family-form#formClick']"

      # The relationship_status choice-group has the data-role marker the controller looks for
      assert_select "[data-role='relationship-status'][data-controller='choice-group']"

      # The has_children choice-group has the data-role marker
      assert_select "[data-role='has-children'][data-controller='choice-group']"

      # Partner fields and children section exist with correct data-role markers
      assert_select "[data-role='partner-fields'][hidden]", count: 1
      assert_select "[data-role='children-section'][hidden]", count: 1

      # Children list and template exist (always rendered, just inside hidden parent)
      assert_select "[data-children-list]", count: 1
      assert_select "[data-child-template]", count: 1

      # Each radio in the relationship-status group has the choice-group action wiring
      assert_select "[data-role='relationship-status'] input[type='radio'][data-action*='change->choice-group#select']", minimum: 5
    end

    test "family form reveals partner fields when state is married (server-side)" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "married",
        spouse_first_name: "Sarah",
        spouse_last_name: "Aikman",
        divorce_status: "no",
        has_children: "no"
      )

      get mobile_onboarding_family_path

      assert_response :success

      # Server-side: partner fields should NOT be hidden when married
      assert_select "[data-role='partner-fields']:not([hidden])"
      # And spouse name fields are present (new shape: partner[first_name])
      assert_select "input[name='partner[first_name]']"
      assert_select "input[name='partner[last_name]']"
    end

    test "family form reveals children section + renders existing child cards (server-side)" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "single",
        divorce_status: "no",
        has_children: "yes",
        children_payload: [{
          "first_name" => "Charlie", "last_name" => "Aikman",
          "relationship" => "biological-child"
        }]
      )

      get mobile_onboarding_family_path

      assert_response :success

      # Server-side: children section should NOT be hidden when Parentage rows exist
      assert_select "[data-role='children-section']:not([hidden])"
      assert_select "[data-child-card]", minimum: 1
    end

    test "family co-parent radio renders smart partner label when partnered" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "married",
        spouse_first_name: "Sarah",
        spouse_last_name: "Aikman",
        has_children: "yes",
        children_payload: []
      )

      get mobile_onboarding_family_path

      assert_response :success
      # Co-parent radio shows the partner-name option as the top choice
      assert_select "[data-role='co-parent-type'] input[value='yes_with_partner']"
      assert_match(/Yes, with Sarah/, response.body)
      # Plus the always-shown options
      assert_select "[data-role='co-parent-type'] input[value='yes_with_other']"
      assert_select "[data-role='co-parent-type'] input[value='no_deceased']"
      assert_select "[data-role='co-parent-type'] input[value='no_sole']"
    end

    test "family co-parent radio omits 'with partner' option when not partnered" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "single",
        has_children: "yes",
        children_payload: []
      )

      get mobile_onboarding_family_path

      assert_response :success
      # No yes_with_partner option when single
      assert_select "[data-role='co-parent-type'] input[value='yes_with_partner']", count: 0
      # The "yes_with_other" option exists, labelled simply "Yes" (no "with someone else")
      assert_select "[data-role='co-parent-type'] input[value='yes_with_other']"
      assert_select "[data-role='co-parent-type'] input[value='no_deceased']"
      assert_select "[data-role='co-parent-type'] input[value='no_sole']"
    end

    test "family persists child capacity flags and co-parent answer; redirects to extended family" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes"
      )

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "single",
        times_divorced: "0",
        times_widowed: "0",
        has_children: "yes",
        children: {
          "0" => {
            position: "0",
            first_name: "Alex",
            last_name: "Aikman",
            relationship: "biological-child",
            disabled_answer: "no",
            lacks_mental_capacity_answer: "no",
            co_parent_type: "no_sole"
          }
        }
      }

      assert_redirected_to mobile_onboarding_extended_family_path

      will_maker = User.where(email_address: nil).order(:created_at).last.will_maker_person
      assert_equal 0, will_maker.times_divorced
      assert_equal 0, will_maker.times_widowed

      child = will_maker.children_via_parentage.first
      assert_equal "Alex", child.first_name
      assert_equal false, child.disabled
      assert_equal false, child.lacks_mental_capacity
      # co_parent_type "no_sole" → no second Parentage
      assert_equal 1, Parentage.where(child_person: child).count
    end

    test "family rejects cohabiting submission without partner_started_at" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes"
      )

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "cohabiting",
        partner: { first_name: "Sam", last_name: "Partner" },  # no started_at
        times_divorced: "0",
        has_children: "no"
      }

      assert_response :unprocessable_entity
      assert_match(/required when cohabiting/i, response.body)
    end

    test "family accepts cohabiting submission with partner_started_at" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes"
      )

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "cohabiting",
        partner: { first_name: "Sam", last_name: "Partner", started_at: "2020-06-15" },
        times_divorced: "0",
        has_children: "no"
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      user = User.where(email_address: nil).order(:created_at).last
      assert_equal Date.new(2020, 6, 15), user.active_marriage.started_at
    end

    test "family persists times_divorced + times_widowed counters on the will-maker Person" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes"
      )

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "single",
        times_divorced: "2",
        times_widowed: "0",
        has_children: "no"
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      user = User.where(email_address: nil).order(:created_at).last
      assert_equal 2, user.will_maker_person.times_divorced
      assert_equal 0, user.will_maker_person.times_widowed
    end

    # === Wave 2 Commit 3b — Marriage + Parentage shape ===

    test "update_family married creates a spouse Person and active Marriage row" do
      seed_welcome_complete

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "married",
        partner: { first_name: "Sarah", last_name: "Aikman" },
        times_divorced: "0", times_widowed: "0",
        has_children: "no"
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      user = anonymous_user
      assert user.active_marriage.present?, "active_marriage should be set"
      assert_equal "married", user.active_marriage.kind
      assert_equal "Sarah", user.active_marriage.partner_person.first_name
      assert_equal "spouse", user.active_marriage.partner_person.relationship_kind
    end

    test "update_family transitioning married -> single ends the active Marriage" do
      create_onboarding_session(
        video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current,
        first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england", nationality: "british",
        domiciled_in_uk: "yes", currently_resident_in_uk: "yes",
        relationship_status: "married", spouse_first_name: "Sarah", spouse_last_name: "Aikman",
        has_children: "no"
      )
      assert anonymous_user.active_marriage.present?, "test setup should seed an active marriage"

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "single",
        times_divorced: "0", times_widowed: "0",
        has_children: "no"
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      user = anonymous_user
      assert_nil user.active_marriage, "active marriage should be ended"
      ended = user.will_maker_person.marriages_as_will_maker.first
      assert_equal "separated", ended.phase
      assert_equal Date.current, ended.ended_at
    end

    test "update_family yes_with_other creates an ad-hoc co_parent Person + second Parentage" do
      seed_welcome_complete

      patch mobile_onboarding_family_path, params: {
        relationship_kind: "single",
        times_divorced: "0", times_widowed: "0",
        has_children: "yes",
        children: {
          "0" => {
            position: "0",
            first_name: "Charlie", last_name: "Aikman",
            relationship: "biological-child",
            disabled_answer: "no", lacks_mental_capacity_answer: "no",
            co_parent_type: "yes_with_other",
            co_parent_other_first_name: "Dawn", co_parent_other_last_name: "Other",
            co_parent_other_relationship_to_child: "biological"
          }
        }
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      user = anonymous_user
      child = user.will_maker_person.children_via_parentage.first
      assert_equal "Charlie", child.first_name

      parentages = Parentage.where(child_person: child)
      assert_equal 2, parentages.count, "expected will-maker + co-parent Parentage rows"
      co_parent = parentages.find { |p| p.parent_person.relationship_kind == "co_parent" }.parent_person
      assert_equal "Dawn", co_parent.first_name
    end

    test "update_family removing a child destroys child Person and cleans up orphaned co_parent" do
      seed_welcome_complete
      # First request: create child + ad-hoc co-parent
      patch mobile_onboarding_family_path, params: {
        relationship_kind: "single",
        times_divorced: "0", times_widowed: "0",
        has_children: "yes",
        children: {
          "0" => {
            position: "0",
            first_name: "Charlie", last_name: "Aikman",
            relationship: "biological-child",
            disabled_answer: "no", lacks_mental_capacity_answer: "no",
            co_parent_type: "yes_with_other",
            co_parent_other_first_name: "Dawn", co_parent_other_last_name: "Other",
            co_parent_other_relationship_to_child: "biological"
          }
        }
      }
      assert_response :redirect
      user = anonymous_user
      assert_equal 2, user.people.where(relationship_kind: %w[child co_parent]).count

      # Second request: user removes children entirely
      patch mobile_onboarding_family_path, params: {
        relationship_kind: "single",
        times_divorced: "0", times_widowed: "0",
        has_children: "no"
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      user.reload
      assert_equal 0, user.will_maker_person.children_via_parentage.count
      # Orphaned co-parent should be destroyed too.
      assert_equal 0, user.people.where(relationship_kind: "co_parent").count
    end

    test "extended family requires partner parents answer for cohabiting users" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "cohabiting",
        spouse_first_name: "Sam",
        spouse_last_name: "Partner",
        partner_started_at: Date.new(2020, 6, 15),
        has_children: "no"
      )

      patch mobile_onboarding_extended_family_path, params: {
        person: {
          parents_alive: "both",
          siblings_alive: "no"
        }
      }

      assert_response :unprocessable_entity
      assert_select ".mobile-form-error"
    end

    test "wrap up continue marks the onboarding session and current_user complete, redirects to secure account" do
      create_onboarding_session(
        video_intro_version: 1,
        video_completed_at: Time.current,
        intro_seen_at: Time.current,
        first_name: "Luke",
        last_name: "Aikman",
        date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england",
        nationality: "british",
        domiciled_in_uk: "yes",
        currently_resident_in_uk: "yes",
        relationship_status: "single",
        divorce_status: "no",
        has_children: "no",
        parents_alive: "both",
        siblings_alive: "no"
      )

      post mobile_onboarding_wrap_up_continue_path

      assert_redirected_to mobile_secure_account_path
      assert OnboardingSession.last.reload.completed_at.present?
      anonymous = User.where(email_address: nil).order(:created_at).last
      assert anonymous.completed_at.present?, "current_user.completed_at should be stamped"
    end

    private

    def seed_welcome_complete
      create_onboarding_session(
        video_intro_version: 1, video_completed_at: Time.current, intro_seen_at: Time.current,
        first_name: "Luke", last_name: "Aikman", date_of_birth: Date.new(1988, 1, 1),
        country_of_residence: "england", nationality: "british",
        domiciled_in_uk: "yes", currently_resident_in_uk: "yes"
      )
    end

    def anonymous_user
      User.where(email_address: nil).order(:created_at).last
    end

    PARTNER_KIND_TRANSLATION = {
      "married"           => "married",
      "civil-partnership" => "civil_partnership",
      "cohabiting"        => "cohabiting"
    }.freeze

    PARENTAGE_KIND_BY_FORM_VALUE = {
      "biological-child" => "biological",
      "adopted-child"    => "adoptive",
      "stepchild"        => "step",
      "foster-child"     => "foster"
    }.freeze

    PERSON_IDENTITY_KEYS = %i[first_name middle_names last_name date_of_birth
      country_of_residence nationality domiciled_in_uk currently_resident_in_uk
      parents_alive parents_in_law_alive siblings_alive number_of_siblings
      times_divorced times_widowed].freeze

    # Seeds both a legacy OnboardingSession (for intro/EntryRouting gates) and
    # the matching User + Person + Marriage + Parentage rows the new shape
    # reads from. Same attribute hash drives both — translates relationship_status
    # and children_payload into typed rows.
    def create_onboarding_session(attributes = {})
      attrs = attributes.dup

      onboarding_session = OnboardingSession.create!({ token: SecureRandom.hex(24) }.merge(attrs))
      write_signed_cookie(OnboardingSession::COOKIE_KEY, onboarding_session.token)

      user = User.create!(
        intro_seen_at: attrs[:intro_seen_at],
        video_completed_at: attrs[:video_completed_at],
        questionnaire_completed_at: attrs[:questionnaire_completed_at]
      )
      write_signed_cookie(:user_token, user.token)

      if attrs.slice(*PERSON_IDENTITY_KEYS).any? { |_, v| v.present? }
        person_attrs = attrs.slice(*PERSON_IDENTITY_KEYS).compact
        person = user.people.create!(relationship_kind: "self", **person_attrs)
        user.update!(will_maker_person: person)
      end

      kind = PARTNER_KIND_TRANSLATION[attrs[:relationship_status]]
      if kind && attrs[:spouse_first_name].present?
        spouse = user.people.create!(
          relationship_kind: "spouse",
          first_name: attrs[:spouse_first_name],
          last_name: attrs[:spouse_last_name]
        )
        Marriage.create!(
          will_maker_person: user.will_maker_person,
          partner_person: spouse,
          kind: kind,
          phase: "active",
          started_at: attrs[:partner_started_at]
        )
      end

      if attrs[:has_children] == "yes" && attrs[:children_payload].present?
        attrs[:children_payload].each_with_index do |child, idx|
          c_person = user.people.create!(
            relationship_kind: "child",
            first_name: child["first_name"],
            last_name: child["last_name"],
            date_of_birth: child["date_of_birth"]
          )
          Parentage.create!(
            parent_person: user.will_maker_person,
            child_person: c_person,
            kind: PARENTAGE_KIND_BY_FORM_VALUE[child["relationship"]] || "biological",
            position: idx
          )
        end
      end

      onboarding_session
    end
  end
end
