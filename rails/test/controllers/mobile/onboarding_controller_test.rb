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
        onboarding_session: {
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
        onboarding_session: {
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
      # And spouse name fields are present
      assert_select "input[name='onboarding_session[spouse_first_name]']"
      assert_select "input[name='onboarding_session[spouse_last_name]']"
    end

    test "family form reveals children section when has_children is yes (server-side)" do
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
        has_children: "yes"
      )

      get mobile_onboarding_family_path

      assert_response :success

      # Server-side: children section should NOT be hidden when has_children=yes
      assert_select "[data-role='children-section']:not([hidden])"
      # And at least one child card should be rendered
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
        onboarding_session: {
          relationship_status: "single",
          times_divorced: "0",
          times_widowed: "0",
          has_children: "yes",
          children_payload: [
            {
              "first_name" => "Alex",
              "last_name" => "Aikman",
              "relationship" => "biological-child",
              "capacity_status" => "under-18",
              "disabled_answer" => "no",
              "lacks_mental_capacity_answer" => "no",
              "co_parent_type" => "no_sole"
            }
          ]
        }
      }

      assert_redirected_to mobile_onboarding_extended_family_path

      session = OnboardingSession.last
      assert_equal 0, session.times_divorced
      assert_equal 0, session.times_widowed

      child = session.children_payload.first
      assert_equal false, child["disabled"]
      assert_equal false, child["lacks_mental_capacity"]
      assert_equal "no_sole", child["co_parent_type"]
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
        onboarding_session: {
          relationship_status: "cohabiting",
          spouse_first_name: "Sam",
          spouse_last_name: "Partner",
          # NB: no partner_started_at
          times_divorced: "0",
          has_children: "no"
        }
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
        onboarding_session: {
          relationship_status: "cohabiting",
          spouse_first_name: "Sam",
          spouse_last_name: "Partner",
          partner_started_at: "2020-06-15",
          times_divorced: "0",
          has_children: "no"
        }
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      assert_equal Date.new(2020, 6, 15), OnboardingSession.last.partner_started_at
    end

    test "times_widowed resets to zero when relationship_status is not widowed" do
      session = create_onboarding_session(
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
        relationship_status: "widowed",
        times_widowed: 2,
        has_children: "no"
      )

      patch mobile_onboarding_family_path, params: {
        onboarding_session: {
          relationship_status: "single",
          times_widowed: "5",  # user attempts to set, but model resets it
          has_children: "no"
        }
      }

      assert_redirected_to mobile_onboarding_extended_family_path
      assert_equal 0, session.reload.times_widowed
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
        onboarding_session: {
          parents_alive: "yes",
          siblings_alive: "no"
        }
      }

      assert_response :unprocessable_entity
      assert_select ".mobile-form-error"
    end

    test "wrap up continue marks the onboarding session complete and redirects to secure account" do
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
        parents_alive: "yes",
        siblings_alive: "no"
      )

      post mobile_onboarding_wrap_up_continue_path

      assert_redirected_to mobile_secure_account_path
      assert OnboardingSession.last.reload.completed_at.present?
    end

    private

    def create_onboarding_session(attributes = {})
      onboarding_session = OnboardingSession.create!({ token: SecureRandom.hex(24) }.merge(attributes))
      write_signed_cookie(OnboardingSession::COOKIE_KEY, onboarding_session.token)
      onboarding_session
    end
  end
end
