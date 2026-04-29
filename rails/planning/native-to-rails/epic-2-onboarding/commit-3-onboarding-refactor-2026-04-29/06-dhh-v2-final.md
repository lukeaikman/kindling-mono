# Step 6 — DHH v2 final (2026-04-29)

> Executable plan. Folds in QA findings + Elon FP refinements. v2 is what we ship against.

## Changes from v1

**Adopted from QA**:
- B1: fix `has_many through:` chain — Person `has_many :marriages_as_will_maker`
- B2: drop `User#spouse_person` shortcut; derive from `active_marriage&.partner_person`
- B4: `current_user.reload` in family-step rescue branch
- B8: explicit per-child permit list
- B10: capture prior parent_person before update, then check orphan
- G2: `former_spouse` added to RELATIONSHIP_KINDS (no — see E6 below; we drop the spouse_person shortcut so `former_spouse` is unnecessary)
- G4: family-step re-render builds input names directly; `@children_params` is an Array of Hashes
- G5: Stimulus selector audit
- T1–T4: tests added

**Adopted from Elon FP**:
- E3: `find_or_initialize_by(relationship_kind: "self")` for the will-maker
- E5: inline orchestration, constant for parentage-kind lookup
- E7: plain method `User#active_marriage`, not `has_one through:`
- E8: confirmed (G4 from QA covers this)

**Rejected**:
- E1's "is normalisation worth it?" — yes, Epic 4 needs it; ship now
- E4's "drop second-Parentage row for someone-else co-parents" — Path A wins; full Person rows for future Epic 4 features
- G2's `former_spouse` relationship_kind — superseded by E6 dropping `spouse_person` entirely

## Forbidden list (carried)

- No service objects. No form objects. No new gems.
- No premature extraction until ≥3 duplicates.
- No defensive code for impossible cases.
- No `rescue` without specific recovery.
- No default scopes.

---

## Wave structure

- **3a — trivial-step refactor + summary_facts** (~1.5 days)
- **3b — family step orchestration** (~1.5 days)
- Browser-verify between 3a and 3b. If 3a runs long, split.

---

## 3a — Trivial-step refactor

### 3a.1 Person model — validation contexts

```ruby
# app/models/person.rb additions

with_options on: :welcome_step do
  validates :first_name, :last_name, :date_of_birth, presence: true
  validate :date_of_birth_within_supported_range
end

with_options on: :location_step do
  validates :country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk, presence: true
end

with_options on: :extended_family_step do
  validates :parents_alive, :siblings_alive, presence: true
  validates :parents_in_law_alive, presence: true, if: :will_maker_with_active_marriage?
  validates :number_of_siblings, numericality: { greater_than: 0, only_integer: true }, if: :siblings_yes?
end

def will_maker?
  relationship_kind == "self"
end

def will_maker_with_active_marriage?
  will_maker? && user.active_marriage.present?
end

def siblings_yes?
  will_maker? && siblings_alive == "yes"
end

private

def date_of_birth_within_supported_range
  return if date_of_birth.blank?
  age = ((Time.zone.today - date_of_birth).to_i / 365.25).floor
  return if age.between?(18, 90)
  errors.add(:date_of_birth, "must reflect an age between 18 and 90")
end
```

### 3a.2 User model — `summary_facts` + `active_marriage`

```ruby
# app/models/user.rb additions

# Plain method, not has_one through. Cleaner.
def active_marriage
  will_maker_person&.marriages_as_will_maker&.find_by(phase: "active")
end

def children_via_parentage
  return Person.none unless will_maker_person
  Person.joins(:inbound_parentages).where(parentages: { parent_person: will_maker_person })
end

def summary_facts
  return [] unless will_maker_person
  facts = [you_fact, location_fact, relationship_fact]
  facts << children_fact if children_via_parentage.any?
  facts << parents_fact
  facts << parents_in_law_fact if active_marriage.present?
  facts << siblings_fact
  facts.compact
end

# Constants matching the existing OnboardingSession version.
COUNTRY_LABELS = {
  "england" => "England", "wales" => "Wales", "scotland" => "Scotland",
  "northern_ireland" => "Northern Ireland"
}.freeze
NATIONALITY_LABELS = {
  "british" => "British", "american" => "American", "canadian" => "Canadian",
  "australian" => "Australian", "other" => "Other"
}.freeze

private

def you_fact
  p = will_maker_person
  parts = [p.full_name.presence, p.date_of_birth&.strftime("%-d %B %Y")].compact
  { label: "You", value: parts.join(", born ") }
end

def location_fact
  p = will_maker_person
  parts = [
    COUNTRY_LABELS[p.country_of_residence] || p.country_of_residence&.humanize,
    "#{NATIONALITY_LABELS[p.nationality] || p.nationality&.humanize} citizen"
  ].compact_blank
  parts << "UK domiciled" if p.domiciled_in_uk == "yes"
  parts << "UK resident" if p.currently_resident_in_uk == "yes"
  { label: "Location", value: parts.join(" · ") }
end

def relationship_fact
  active = active_marriage
  value =
    if active
      partner_full_name = active.partner_person.full_name
      kind_phrase = case active.kind
                    when "married" then "Married to"
                    when "civil_partnership" then "Civil partnership with"
                    when "cohabiting" then "Cohabiting with"
                    end
      partner_full_name ? "#{kind_phrase} #{partner_full_name}" : kind_phrase.sub(/\s+(to|with)$/, "").strip
    else
      previous_marriages = will_maker_person&.marriages_as_will_maker&.where.not(phase: "active") || []
      n_div = will_maker_person&.times_divorced.to_i
      n_wid = will_maker_person&.times_widowed.to_i
      if n_div > 0
        n_div > 1 ? "Divorced (#{n_div} times)" : "Divorced"
      elsif n_wid > 0
        n_wid > 1 ? "Widowed (#{n_wid} times)" : "Widowed"
      else
        "Single"
      end
    end
  { label: "Relationship", value: value }
end

def children_fact
  names = children_via_parentage.map { |c| c.first_name.to_s.strip.presence }.compact
  count = children_via_parentage.size
  value = names.any? ? names.join(", ") : "#{count} #{'child'.pluralize(count)}"
  { label: "Children", value: value }
end

def parents_fact
  { label: "Parents", value: alive_label(will_maker_person.parents_alive) }
end

def parents_in_law_fact
  { label: "In-laws", value: alive_label(will_maker_person.parents_in_law_alive) }
end

def siblings_fact
  p = will_maker_person
  value =
    if p.siblings_alive == "yes"
      n = p.number_of_siblings.to_i
      "#{n} #{'sibling'.pluralize(n)}"
    else
      "None"
    end
  { label: "Siblings", value: value }
end

def alive_label(value)
  case value
  when "both"      then "Both alive"
  when "one-alive" then "One alive"
  when "no"        then "Neither alive"
  else value.to_s.humanize.presence || "—"
  end
end
```

### 3a.3 OnboardingController — welcome / location / extended_family / wrap_up

```ruby
class Mobile::OnboardingController < Mobile::BaseController
  before_action :requires_user!

  def welcome
    @person = current_user.will_maker_person ||
              current_user.people.new(relationship_kind: "self")
  end

  def update_welcome
    person = current_user.people.find_or_initialize_by(relationship_kind: "self")
    person.assign_attributes(welcome_params)
    person.save!(context: :welcome_step)
    current_user.update!(will_maker_person: person, current_step: "location") if current_user.will_maker_person_id != person.id
    current_user.update!(current_step: "location") unless current_user.current_step == "completed"
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
    current_user.update!(current_step: "family") unless current_user.current_step == "completed"
    redirect_to mobile_onboarding_family_path
  rescue ActiveRecord::RecordInvalid
    @person = person
    render :location, status: :unprocessable_entity
  end

  def extended_family
    @person = current_user.will_maker_person
  end

  def update_extended_family
    person = current_user.will_maker_person
    person.assign_attributes(extended_family_params)
    person.save!(context: :extended_family_step)
    current_user.update!(current_step: "wrap_up") unless current_user.current_step == "completed"
    redirect_to mobile_onboarding_wrap_up_path
  rescue ActiveRecord::RecordInvalid
    @person = person
    render :extended_family, status: :unprocessable_entity
  end

  def wrap_up
    @summary_facts = current_user.summary_facts
  end

  def wrap_up_continue
    current_user.update!(completed_at: Time.current, current_step: "completed")
    redirect_to mobile_secure_account_path
  end

  # Family step — see 3b

  private

  def welcome_params
    params.require(:person).permit(:first_name, :middle_names, :last_name, :date_of_birth)
  end

  def location_params
    params.require(:person).permit(:country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk)
  end

  def extended_family_params
    params.require(:person).permit(:parents_alive, :parents_in_law_alive, :siblings_alive, :number_of_siblings)
  end
end
```

### 3a.4 Views

Mechanical swap. For each of welcome, location, extended_family:
- `form_with model: @onboarding_session, url: ...` → `form_with model: @person, scope: :person, url: ...`
- `@onboarding_session.first_name` → `@person.first_name` (etc.)
- Field names auto-update via `form_with model:`
- Error display via `@person.errors`

`wrap_up.html.erb` — already iterates `summary_facts`. Update controller to set `@summary_facts = current_user.summary_facts` (instead of `@onboarding_session.summary_facts`); template needs only the `current_user` source change.

### 3a.5 Tests landing in 3a

Model tests:
- `Person` valid?(:welcome_step) requires first_name + last_name + date_of_birth
- `Person` valid?(:location_step) requires country fields
- `Person` valid?(:extended_family_step) gates `parents_in_law_alive` on active marriage, `number_of_siblings` on `siblings_alive == "yes"`
- `User#summary_facts` returns expected shape for: single user; married user; user with 2 children; user with siblings_alive=no
- `User#active_marriage` returns nil when none, returns the active row when present
- `User#after_create` does NOT create a will-maker Person (lazy)
- Encryption-at-rest for Person — first_name stored as ciphertext

Controller tests:
- `update_welcome` with valid params creates will-maker Person + sets `current_user.will_maker_person`
- `update_welcome` with invalid params re-renders 422
- `update_welcome` second time updates same Person
- `update_location` writes location fields
- `update_extended_family` validation gates work
- `wrap_up_continue` sets `completed_at`

System test additions:
- Existing `family_step_conditional_reveal_test.rb` continues passing (will need attribute-name updates)
- New: `welcome_to_wrap_up_happy_path_test.rb` walks all 5 steps with simple data

### 3a.6 Backwards-compat shimming

Until 3b lands, the family step still reads from `@onboarding_session`. The new welcome/location/extended_family/wrap_up actions don't touch OnboardingSession at all — they write to User+Person.

This means: **a User who completes welcome via 3a but had a prior OnboardingSession** has their progress on `current_user`, not `@onboarding_session`. The family step's read of `@onboarding_session.relationship_status` etc. will return nil/empty. The user effectively starts the family step fresh.

**Acceptable**: not live, sessions short. Document in commit message.

To avoid weirdness during 3a → 3b transition, the `Mobile::BaseController#find_or_create_onboarding_session!` callsite in the family controller actions should NOT be invoked by the welcome/location/extended_family/wrap_up actions. That's already the case if we just don't call it.

---

## 3b — Family step

### 3b.1 OnboardingController — family + update_family

```ruby
def family
  @person = current_user.will_maker_person
  @active_marriage = current_user.active_marriage
  @children_params = params_for_existing_children
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
    will_maker.save!  # no context — these are open-ended counters, no required-on-step
    current_user.update!(current_step: "extended_family") unless current_user.current_step == "completed"
  end
  redirect_to mobile_onboarding_extended_family_path
rescue ActiveRecord::RecordInvalid
  current_user.reload  # B4: drop transaction-rolled-back association cache
  @person = current_user.will_maker_person
  @active_marriage = current_user.active_marriage
  @children_params = (family_params[:children] || {}).values.sort_by { |c| c[:position].to_i }.map(&:to_h)
  render :family, status: :unprocessable_entity
end

private

# Constant lookup (E5) instead of a method.
PARENTAGE_KIND_BY_FORM_VALUE = {
  "biological-child" => "biological",
  "adopted-child"    => "adoptive",
  "stepchild"        => "step",
  "foster-child"     => "foster"
}.freeze

def family_params
  base = params.permit(:relationship_kind, :times_divorced, :times_widowed)
  partner = params.fetch(:partner, {}).permit(:first_name, :last_name, :started_at)
  children = params.fetch(:children, {}).each_with_object({}) do |(index, child_params), h|
    h[index] = child_params.permit(
      :id, :position, :first_name, :last_name, :date_of_birth,
      :relationship, :disabled_answer, :lacks_mental_capacity_answer,
      :co_parent_type, :co_parent_partner_relationship_to_child,
      :co_parent_other_first_name, :co_parent_other_last_name,
      :co_parent_other_relationship_to_child
    )
  end
  base.merge(partner: partner, children: children)
end

def params_for_existing_children
  current_user.will_maker_person.outbound_parentages
              .includes(:child_person)
              .joins(:child_person)
              .where(people: { relationship_kind: "child" })
              .order(:position).map do |parentage|
    child = parentage.child_person
    second = Parentage.where(child_person: child).where.not(id: parentage.id).first
    second_parent = second&.parent_person
    {
      id: child.id,
      position: parentage.position,
      first_name: child.first_name,
      last_name: child.last_name,
      date_of_birth: child.date_of_birth,
      relationship: PARENTAGE_KIND_BY_FORM_VALUE.invert[parentage.kind],
      disabled_answer: child.disabled ? "yes" : "no",
      lacks_mental_capacity_answer: child.lacks_mental_capacity ? "yes" : "no",
      co_parent_type: derive_co_parent_type(second_parent, second),
      co_parent_partner_relationship_to_child: (second.kind if second_parent&.relationship_kind == "spouse"),
      co_parent_other_first_name: (second_parent.first_name if second_parent&.relationship_kind == "co_parent"),
      co_parent_other_last_name: (second_parent.last_name if second_parent&.relationship_kind == "co_parent"),
      co_parent_other_relationship_to_child: (second.kind if second_parent&.relationship_kind == "co_parent")
    }
  end
end

def derive_co_parent_type(second_parent, second_parentage)
  return nil if second_parent.nil?
  case second_parent.relationship_kind
  when "spouse"    then "yes_with_partner"
  when "co_parent" then "yes_with_other"
  end
end

def sync_partner!(params)
  new_kind = params[:relationship_kind].presence
  is_partner_kind = new_kind.in?(Marriage::KINDS)
  active = current_user.active_marriage

  if is_partner_kind
    spouse = active&.partner_person ||
             current_user.people.where(relationship_kind: "spouse").first ||
             current_user.people.create!(relationship_kind: "spouse")
    spouse.assign_attributes(params[:partner].slice(:first_name, :last_name).to_h.symbolize_keys)
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
    active.update!(phase: "separated", ended_at: Date.current)
  end
end

def sync_children!(children_attrs)
  submitted = children_attrs.values.sort_by { |c| c[:position].to_i }
  will_maker = current_user.will_maker_person

  existing_parentages = will_maker.outbound_parentages.includes(:child_person)
                                  .joins(:child_person).where(people: { relationship_kind: "child" })
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

    if parentage
      parentage.update!(kind: PARENTAGE_KIND_BY_FORM_VALUE.fetch(attrs[:relationship], "biological"), position: index)
    else
      parentage = Parentage.create!(
        parent_person: will_maker,
        child_person: person,
        kind: PARENTAGE_KIND_BY_FORM_VALUE.fetch(attrs[:relationship], "biological"),
        position: index
      )
    end

    sync_co_parent!(person, parentage, attrs)
    survivors << person.id
  end

  # Cascade-delete removed children. The Person row goes; Parentages cascade
  # via dependent: :destroy. Ad-hoc co_parent rows orphaned by this cleanup
  # also need destroying.
  to_destroy = existing_parentages.values.reject { |p| survivors.include?(p.child_person_id) }
  to_destroy.each do |orphaned_parentage|
    child = orphaned_parentage.child_person
    second_parentages = Parentage.where(child_person: child).where.not(id: orphaned_parentage.id)
    co_parents_to_orphan = second_parentages.map(&:parent_person).select { |p| p.relationship_kind == "co_parent" }
    child.destroy
    co_parents_to_orphan.each { |p| p.destroy if Parentage.where(parent_person: p).count.zero? }
  end
end

def sync_co_parent!(child_person, will_maker_parentage, attrs)
  co_type = attrs[:co_parent_type].presence
  second_parentage = Parentage.where(child_person: child_person).where.not(id: will_maker_parentage.id).first
  prior_parent_person = second_parentage&.parent_person  # B10: capture before update

  case co_type
  when "yes_with_partner"
    spouse = current_user.active_marriage&.partner_person
    if spouse.nil?
      # No partner — silently no-op the co-parent. Form should hide this option
      # in this state, but defensive against mid-form changes.
      return
    end
    if second_parentage
      second_parentage.update!(
        parent_person: spouse,
        kind: attrs[:co_parent_partner_relationship_to_child]
      )
    else
      Parentage.create!(
        parent_person: spouse,
        child_person: child_person,
        kind: attrs[:co_parent_partner_relationship_to_child]
      )
    end
    cleanup_if_orphaned_co_parent(prior_parent_person)
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
      Parentage.create!(
        parent_person: other,
        child_person: child_person,
        kind: attrs[:co_parent_other_relationship_to_child]
      )
    end
    cleanup_if_orphaned_co_parent(prior_parent_person) if prior_parent_person != other
  when "no_deceased", "no_sole", nil
    if second_parentage
      second_parentage.destroy
      cleanup_if_orphaned_co_parent(prior_parent_person)
    end
  end
end

def cleanup_if_orphaned_co_parent(prior_parent_person)
  return unless prior_parent_person&.relationship_kind == "co_parent"
  return if Parentage.where(parent_person: prior_parent_person).any?
  prior_parent_person.destroy
end
```

### 3b.2 Family view

`app/views/mobile/onboarding/family.html.erb` — substantial rewrite.

Form's outer `form_with` becomes:
```erb
<%= form_with url: mobile_onboarding_family_path, method: :patch, html: { data: { controller: "family-form", action: "..." } } do |form| %>
```

Note: NOT `model: @something` because we have multiple targets (Person + Marriage + children). Use field names directly:
- `relationship_kind` → `name="relationship_kind"`
- partner section → `name="partner[first_name]"`, etc.
- children → `name="children[#{i}][first_name]"`, etc.

The relationship_kind picker uses `@active_marriage.kind` (or nil for non-partnered) as initial value; otherwise reads `@person.times_divorced` etc.

`_child_fields.html.erb` — partial, takes a Hash (from `@children_params`) plus an index. The partial reads `child[:first_name]` etc. — string keys/symbols depending on whether it's from params or DB. Normalise in controller before passing in.

### 3b.3 Stimulus controller updates (E11)

`app/javascript/controllers/family_form_controller.js` selectors:

| Pre-Commit-3 | Post-Commit-3 |
|---|---|
| `input[name="onboarding_session[relationship_status]"]:checked` | `input[name="relationship_kind"]:checked` |
| `input[name="onboarding_session[spouse_first_name]"]` | `input[name="partner[first_name]"]` |
| `input[name="onboarding_session[spouse_last_name]"]` | `input[name="partner[last_name]"]` |
| `input[name="onboarding_session[partner_started_at]"]` | `input[name="partner[started_at]"]` |
| `input[name^="onboarding_session[children_payload]"][name$="[first_name]"]` | `input[name^="children["][name$="][first_name]"]` |
| (etc. for last_name, dob, co_parent_type, co_parent_*) | (analogous) |

Field-add ("Add another") creates a new child card with name patterns `children[<position>][...]`. Position increments on each add.

### 3b.4 Tests landing in 3b

Model tests:
- `Marriage` create with active phase succeeds
- `Marriage` second-active for same will-maker fails (partial unique index)
- `Parentage` create requires distinct persons (check constraint)
- `Person` validation context `:family_step` rejects spouse without first_name

Controller tests:
- `update_family` for single user (no partner, no children) succeeds
- `update_family` for partnered user (married, with spouse first_name) creates spouse Person + Marriage row
- `update_family` adds children with correct Parentage rows
- `update_family` co_parent_type yes_with_other creates ad-hoc co_parent Person + 2nd Parentage
- `update_family` co_parent_type change from yes_with_partner → yes_with_other reuses or rebuilds correctly
- `update_family` removing a child destroys child Person + cascades to Parentage rows + cleans up orphaned co_parent Person
- `update_family` transitioning married → single ends the active Marriage (phase: separated)

System test:
- Walking the family step in browser end-to-end, with married + 2 children + co-parent yes_with_partner

Existing system tests (`family_step_conditional_reveal_test.rb`) — update field-name selectors. Should pass with the new shape.

Encryption test:
- Create child Person; raw column inspection confirms first_name is ciphertext.

### 3b.5 Stimulus controller test

`family_form_controller.js` is plain JS — covered by the Capybara system test (which exercises real browser behaviour). No separate JS unit test framework in this project.

---

## Done-when

After 3a + 3b ship:

1. ✓ `Mobile::OnboardingController` references neither `OnboardingSession` nor `@onboarding_session`.
2. ✓ All onboarding views read from `current_user` + `@person` + `@active_marriage` + `@children_params` instead of `@onboarding_session`.
3. ✓ Family-step Wave 1 UX preserved exactly (same fields, conditional reveals, Stimulus behaviour).
4. ✓ `summary_facts` lives on User, reads from will-maker Person + active Marriage + Parentage chain.
5. ✓ All controller + system tests pass.
6. ✓ `OnboardingSession` model + table still exist (Commit 5 drops them).
7. ✓ `Mobile::BaseController#find_or_create_onboarding_session!` + friends still exist (dead code, Commit 5 removes them).

## Out of scope (defer to later commits)

- Drop OnboardingSession (Commit 5)
- Sessions/Auth controller cookie cutover (Commit 4)
- Login warning UX (Commit 4)
- Backfill of in-flight OnboardingSession rows — none, no live data
- Person-merge feature for the co-parent picker (Epic 4)
- Audit-trail / paranoia (PRE_LAUNCH_TODO)

## Estimated effort

| Sub-commit | Effort |
|---|---|
| 3a — trivial-step refactor + summary_facts | ~1.5 days |
| 3b — family step + Stimulus updates | ~1.5 days |
| **Total** | **~3 days** |

Browser-verify between 3a and 3b. Don't preempt-split 3a unless it actually grows past 1.5 days in execution.
