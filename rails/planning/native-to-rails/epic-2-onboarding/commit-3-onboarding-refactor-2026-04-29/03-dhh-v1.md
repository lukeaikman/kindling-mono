# Step 3 — DHH v1 (2026-04-29)

> Synthesise Claude's draft + Elon's challenges into a concrete Rails-y plan. Pick a shape and commit to it.

## Adopting from Elon

- **Lazy Person creation** (not eager). Claude's eager-on-User-create argument falls apart on inspection: there's nothing to attach before welcome runs. The structural-with-Will analogy is wrong. Build the will-maker Person on first `update_welcome`, with one `||` build, in one method. The rest of the codebase can rely on `will_maker_person` being non-nil because welcome has run by the time anything else writes.
- **2 sub-commits, not 5.** 3a covers the trivial fields (welcome + location + extended-family + wrap-up + `summary_facts`). 3b is the family step on its own. Don't pre-split.
- **No `Marriage#end!`.** Inline the update. It's two lines and the form doesn't ask "how did your prior marriage end?" so we don't pretend.
- **`position` integer for child ordering**, not `client_id`. Simpler, sufficient.

## Rejecting from Elon

- **"This is PRE_LAUNCH-class, not feature."** True at the meta level, but the user wants to ship it now. Don't argue about timing. Plan as if executing.
- **"Drop validation contexts."** Elon dithered then conceded. Keep contexts. Cleaner than per-action presence checks.

## Final shape

### Models

#### `User` (additions only)

```ruby
class User < ApplicationRecord
  # ... existing ...

  has_many :marriages, through: :will_maker_person, source: :marriage_as_will_maker
  # NB: only the will-maker side; the partner Person's other Marriages
  # don't belong on User. Keeping it explicit.

  has_one :active_marriage, -> { where(phase: "active") }, through: :will_maker_person, source: :marriage_as_will_maker

  def summary_facts
    return [] unless will_maker_person

    facts = [you_fact, location_fact, relationship_fact]
    facts << children_fact if children_via_parentage.any?
    facts << parents_fact
    facts << parents_in_law_fact if active_marriage.present?
    facts << siblings_fact
    facts.compact
  end

  private

  # All the *_fact private methods that previously lived on OnboardingSession.
  # Read from will_maker_person, active_marriage, children_via_parentage.
  # (Detail in v2-final; same structure as the current OnboardingSession#summary_facts.)
end
```

`children_via_parentage` is convenience accessor that returns the Person rows linked from will-maker via Parentage:

```ruby
# user.rb
has_many :will_maker_parentages, through: :will_maker_person, source: :outbound_parentages
has_many :children_via_parentage, through: :will_maker_parentages, source: :child_person
```

#### `Person` (additions only)

```ruby
class Person < ApplicationRecord
  # ... existing ...

  with_options on: :welcome_step do
    validates :first_name, :last_name, :date_of_birth, presence: true
    validate :date_of_birth_within_supported_range
  end

  with_options on: :location_step do
    validates :country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk, presence: true
  end

  with_options on: :family_step do
    validates :first_name, presence: true, if: -> { relationship_kind.in?(%w[spouse child co_parent]) }
    # Last name only required for spouse + child Persons; co_parent (someone-else)
    # captures last name too. The validation is the same.
    validates :last_name, presence: true, if: -> { relationship_kind.in?(%w[spouse child co_parent]) }
  end

  with_options on: :extended_family_step do
    validates :parents_alive, :siblings_alive, presence: true
    validates :parents_in_law_alive, presence: true, if: :will_maker?
    validates :number_of_siblings, numericality: { greater_than: 0 }, if: -> { will_maker? && siblings_alive == "yes" }
  end

  def will_maker?
    relationship_kind == "self"
  end

  def date_of_birth_within_supported_range
    return if date_of_birth.blank?
    age = ((Time.zone.today - date_of_birth).to_i / 365.25).floor
    return if age.between?(18, 90)
    errors.add(:date_of_birth, "must reflect an age between 18 and 90")
  end
end
```

NB: `parents_alive` etc. live on the will-maker Person (per the schema). The `if: :will_maker?` guards them so they're not required on spouse/child/etc. Persons.

#### `Marriage`

No changes from Commit 2. The orchestration in the controller does the writes.

#### `Parentage`

No changes from Commit 2.

### Controller

```ruby
class Mobile::OnboardingController < Mobile::BaseController
  before_action :requires_user!

  def welcome
    @person = current_user.will_maker_person || current_user.people.build(relationship_kind: "self")
  end

  def update_welcome
    person = current_user.will_maker_person || current_user.people.build(relationship_kind: "self")
    person.assign_attributes(welcome_params)
    person.save!(context: :welcome_step)
    current_user.update!(will_maker_person: person, current_step: "location")
    redirect_to mobile_onboarding_location_path
  rescue ActiveRecord::RecordInvalid
    @person = person
    render :welcome, status: :unprocessable_entity
  end

  def location
    @person = current_user.will_maker_person
  end

  def update_location
    person = current_user.will_maker_person
    person.assign_attributes(location_params)
    person.save!(context: :location_step)
    current_user.update!(current_step: "family")
    redirect_to mobile_onboarding_family_path
  rescue ActiveRecord::RecordInvalid
    @person = person
    render :location, status: :unprocessable_entity
  end

  def family
    @person = current_user.will_maker_person
    @active_marriage = current_user.active_marriage
    @children = current_user.will_maker_parentages.includes(:child_person).order(:position)
  end

  def update_family
    ActiveRecord::Base.transaction do
      sync_partner!(family_params)
      sync_children!(family_params[:children] || {})

      will_maker = current_user.will_maker_person
      will_maker.assign_attributes(
        times_divorced: family_params[:times_divorced].to_i,
        times_widowed: family_params[:times_widowed].to_i
      )
      will_maker.save!(context: :family_step)
      current_user.update!(current_step: "extended_family")
    end
    redirect_to mobile_onboarding_extended_family_path
  rescue ActiveRecord::RecordInvalid
    @person = current_user.will_maker_person
    @active_marriage = current_user.active_marriage
    @children = current_user.will_maker_parentages.includes(:child_person).order(:position)
    render :family, status: :unprocessable_entity
  end

  def extended_family
    @person = current_user.will_maker_person
  end

  def update_extended_family
    person = current_user.will_maker_person
    person.assign_attributes(extended_family_params)
    person.save!(context: :extended_family_step)
    current_user.update!(current_step: "wrap_up")
    redirect_to mobile_onboarding_wrap_up_path
  rescue ActiveRecord::RecordInvalid
    @person = person
    render :extended_family, status: :unprocessable_entity
  end

  def wrap_up
    # No write — just renders summary_facts.
  end

  def wrap_up_continue
    current_user.update!(completed_at: Time.current, current_step: "completed")
    redirect_to mobile_secure_account_path
  end

  private

  def welcome_params
    params.require(:person).permit(:first_name, :middle_names, :last_name, :date_of_birth)
  end

  def location_params
    params.require(:person).permit(:country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk)
  end

  def family_params
    params.permit(
      :relationship_kind, :times_divorced, :times_widowed,
      partner: [:first_name, :last_name, :started_at],
      children: {}  # complex nested shape; allow all under children, validate per-key
    ).tap do |p|
      # Children come in as a hash keyed by position index from the form.
      # Permit each child's allowed keys explicitly.
      next unless p[:children].is_a?(ActionController::Parameters) || p[:children].is_a?(Hash)
      permitted_child_keys = [
        :id, :position, :first_name, :last_name, :date_of_birth,
        :relationship, :disabled_answer, :lacks_mental_capacity_answer,
        :co_parent_type, :co_parent_partner_relationship_to_child,
        :co_parent_other_first_name, :co_parent_other_last_name,
        :co_parent_other_relationship_to_child
      ]
      p[:children].each_value { |child| child.permit!(*permitted_child_keys) if child.respond_to?(:permit!) }
    end
  end

  def extended_family_params
    params.require(:person).permit(:parents_alive, :parents_in_law_alive, :siblings_alive, :number_of_siblings)
  end

  def sync_partner!(params)
    new_kind = params[:relationship_kind].presence
    is_partner_kind = new_kind.in?(Marriage::KINDS)

    active = current_user.active_marriage

    if is_partner_kind
      spouse = current_user.spouse_person || current_user.people.create!(relationship_kind: "spouse")
      spouse.assign_attributes(params[:partner].slice(:first_name, :last_name).to_h)
      spouse.save!(context: :family_step)

      if active
        active.update!(kind: new_kind, started_at: params[:partner][:started_at])
      else
        Marriage.create!(
          will_maker_person: current_user.will_maker_person,
          partner_person: spouse,
          kind: new_kind,
          phase: "active",
          started_at: params[:partner][:started_at]
        )
      end
    elsif active
      # Transition to ended; keep the row for history.
      active.update!(phase: "separated", ended_at: Date.current)
    end
  end

  def sync_children!(children_attrs)
    submitted = children_attrs.values.sort_by { |c| c[:position].to_i }

    existing = current_user.will_maker_parentages
                           .includes(:child_person)
                           .index_by { |p| p.child_person_id }

    survivors = []

    submitted.each_with_index do |attrs, index|
      child_id = attrs[:id].presence&.to_i
      parentage = existing.values.find { |p| p.child_person_id == child_id } if child_id
      person = parentage&.child_person || current_user.people.build(relationship_kind: "child")

      person.assign_attributes(
        first_name: attrs[:first_name],
        last_name: attrs[:last_name],
        date_of_birth: attrs[:date_of_birth].presence,
        disabled: attrs[:disabled_answer] == "yes",
        lacks_mental_capacity: attrs[:lacks_mental_capacity_answer] == "yes"
      )
      person.save!(context: :family_step)

      parentage ||= Parentage.create!(
        parent_person: current_user.will_maker_person,
        child_person: person,
        kind: parentage_kind_for(attrs[:relationship])
      )
      parentage.update!(kind: parentage_kind_for(attrs[:relationship]), position: index)

      sync_co_parent!(person, parentage, attrs)
      survivors << person.id
    end

    # Children no longer in the form — destroy.
    existing.values.reject { |p| survivors.include?(p.child_person_id) }.each do |orphaned_parentage|
      orphaned_parentage.child_person.destroy  # cascade-deletes Parentage rows
    end
  end

  def sync_co_parent!(child_person, will_maker_parentage, attrs)
    co_type = attrs[:co_parent_type].presence
    second_parentage = Parentage.where(child_person: child_person).where.not(id: will_maker_parentage.id).first

    case co_type
    when "yes_with_partner"
      ensure_co_parentage(second_parentage, current_user.spouse_person, child_person,
        attrs[:co_parent_partner_relationship_to_child])
      cleanup_orphan_co_parent_if_needed(second_parentage)
    when "yes_with_other"
      co_parent = second_parentage&.parent_person
      co_parent = nil if co_parent && co_parent.relationship_kind != "co_parent"  # was spouse before
      co_parent ||= current_user.people.create!(relationship_kind: "co_parent")
      co_parent.assign_attributes(
        first_name: attrs[:co_parent_other_first_name],
        last_name: attrs[:co_parent_other_last_name]
      )
      co_parent.save!(context: :family_step)
      ensure_co_parentage(second_parentage, co_parent, child_person,
        attrs[:co_parent_other_relationship_to_child])
    when "no_deceased", "no_sole", nil
      # No second parentage; remove if present.
      if second_parentage
        prior_other = second_parentage.parent_person if second_parentage.parent_person.relationship_kind == "co_parent"
        second_parentage.destroy
        prior_other&.destroy
      end
    end
  end

  def ensure_co_parentage(existing, parent_person, child_person, kind)
    if existing
      existing.update!(parent_person: parent_person, kind: kind)
    else
      Parentage.create!(parent_person: parent_person, child_person: child_person, kind: kind)
    end
  end

  def cleanup_orphan_co_parent_if_needed(prior_parentage)
    return unless prior_parentage
    prior = prior_parentage.parent_person
    prior.destroy if prior.relationship_kind == "co_parent" && Parentage.where(parent_person: prior).count.zero?
  end

  def parentage_kind_for(form_value)
    # Form sends "biological-child" / "adopted-child" / "stepchild" / "foster-child"
    case form_value
    when "biological-child" then "biological"
    when "adopted-child"    then "adoptive"
    when "stepchild"        then "step"
    when "foster-child"     then "foster"
    else "biological"
    end
  end
end
```

Long, but every line is doing something. The orchestration belongs here.

### Views

Five view files change. Each follows the same pattern: `@onboarding_session.X` → `@person.X` (or `@active_marriage.X`, `@children`, etc.). Field names go from `onboarding_session[X]` → `person[X]` / `partner[X]` / `children[index][X]`.

Detailed view changes are mechanical — defer to v2-final.

### Tests

- Model tests (User): `summary_facts` against the new shape.
- Model tests (Person): validation contexts each rejecting/accepting at their step.
- Controller tests: each step's update action, both success and validation-failure paths.
- Integration test: walk through all 5 steps, verify the resulting User/Person/Marriage/Parentage rows match expected shape.

System tests: existing 3 should pass with field-name updates. Expand to add a happy-path "full onboarding" walk.

## Sub-commit packaging

- **3a — Lazy Person + welcome + location + extended_family + wrap_up + summary_facts** — ~1.5 days. After this lands, single users without children can complete onboarding.
- **3b — Family step (sync_partner / sync_children / sync_co_parent)** — ~1.5 days. After this lands, all flows complete.

Browser-verify between 3a and 3b. If 3a is going long, fine — split it.

## What's not in this plan

- Drop OnboardingSession (Commit 5)
- Sessions/Auth controller cookie-cutover (Commit 4)
- Login warning UX (Commit 4)
- Backfilling existing OnboardingSession data into the new model. Don't bother — no live data.

## Open issues remaining for QA

- Stimulus controller (`family_form_controller.js`) does live partner-name updates and add/remove children — does it need any backend-aware changes (e.g. sending a clean DELETE for removed children)? Probably no — destroy happens on form-submit server-side. The Stimulus controller just manages the DOM.
- Pre-existing `data-prefilled` hidden field on partner last name — does its semantic change with the new shape? (The current logic auto-fills partner last name from will-maker last name unless user has typed something. Should still work; partner Person has its own last_name column.)
- `children_payload` in OnboardingSession is currently kept in sync with form params during Wave 1 saves. After Commit 3, that column goes ignored. Mid-flight users (those who started onboarding before this commit and resume after) will lose their session-cookie data. **Acceptable** — not live, sessions are 3-hour TTL.
