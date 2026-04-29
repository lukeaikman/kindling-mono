# Step 1 — Claude draft (2026-04-29)

> First-pass plan, optimistic. Subsequent personas push back.

## Sub-commit packaging — 5 commits

Each commit is end-to-end (controller action + view + tests + any model nibble). Lets us verify in browser between steps.

| # | Sub-commit | Touches | Risk |
|---|---|---|---|
| 3a | Eager will-maker Person + welcome step | `User#after_create`, `welcome_params`, `update_welcome`, `_welcome` view, tests | Low. Pattern-setter for the rest. |
| 3b | Location step | `update_location`, view | Low. Same Person, more fields. |
| 3c | Family step | `update_family` + `sync_partner` + `sync_children` + `Marriage#end!` + `Parentage` shape, view, tests | High. Half the commit. |
| 3d | Extended-family step | `update_extended_family`, view | Low. |
| 3e | Wrap-up step + `summary_facts` rewrite | `update_wrap_up`, wrap_up view, `OnboardingSession#summary_facts` → `User#summary_facts` (or similar) | Low-medium. |

## Resolutions to the open questions

### Q-A. Person creation: `User#after_create`

```ruby
# app/models/user.rb
after_create :create_initial_will
after_create :create_will_maker_person  # NEW

private

def create_will_maker_person
  person = people.create!(relationship_kind: "self")
  update_column(:will_maker_person_id, person.id)
end
```

**Why `after_create` not a controller filter**: matches the structural reasoning we used for the Will. A User without a will-maker Person is incoherent in our domain. A controller filter would let some User flows skip Person creation, which we don't want.

**Why `update_column`**: avoids a circular validation. The User just saved; we add the Person; setting `will_maker_person_id` via `update!` would re-run all validations. `update_column` skips them.

### Q-B. Children form params — stable client_id pattern

Reuse the existing `id => SecureRandom.hex(6)` pattern from the JSON era, but treat it as a *form-only* identifier:

```html
<input type="hidden" name="children[][client_id]" value="abc123">
<input type="hidden" name="children[][id]" value="42">  <!-- present after first save -->
```

Backend logic:
```ruby
def sync_children(children_params)
  submitted = children_params.map { |attrs| attrs.with_defaults("client_id" => SecureRandom.hex(6)) }

  # Match by DB id when present, by client_id otherwise.
  existing = current_user.will_maker_person.children_via_parentage.includes(:user).index_by(&:id)

  submitted.each do |attrs|
    person =
      if attrs["id"].present? && existing[attrs["id"].to_i]
        existing[attrs["id"].to_i]
      else
        current_user.people.build(relationship_kind: "child")
      end
    person.assign_attributes(attrs.except("id", "client_id", "co_parent_type", :co_parent))
    person.save!
    sync_co_parent_for(person, attrs)
  end

  # Children removed from the form — destroy
  surviving_ids = submitted.map { |a| a["id"]&.to_i }.compact
  existing.except(*surviving_ids).each_value(&:destroy)
end
```

**Why client_id**: the form re-render after a validation error needs to keep card identity stable so user inputs aren't reshuffled. Real DB id only exists post-save; client_id covers the gap.

**Why not `accepts_nested_attributes_for`**: our shape isn't 1-1 (child is one Person + N Parentage rows + maybe a co-parent Person). The nested-attributes pattern fights us. Manual sync is clearer.

### Q-C. `co_parent_type` → Parentage rows

Each child Person gets at minimum one Parentage from the will-maker. `co_parent_type` adds (or doesn't) a second Parentage from the co-parent.

| `co_parent_type` | will-maker → child | second co-parent → child |
|---|---|---|
| `yes_with_partner` | yes | spouse Person, kind from `co_parent_partner_relationship_to_child` |
| `yes_with_other` | yes | ad-hoc Person (relationship_kind=`co_parent`), kind from `co_parent_other_relationship_to_child` |
| `no_deceased` | yes | none |
| `no_sole` | yes | none |
| (blank) | yes | none |

**Type-changes**: when `co_parent_type` changes, drop the prior second-Parentage (and the ad-hoc `co_parent` Person if any), then build the new one. Ad-hoc rows are always re-created on type-change — simpler than tracking edits.

The will-maker→child Parentage's `kind` reflects the *will-maker's* relationship to the child — i.e. the form field labelled "What is this child's relationship to you?" (biological / adopted / step / foster). The co-parent's relationship to the child is a separate field, captured per co-parent.

### Q-D. Validation contexts — yes, per step

```ruby
# app/models/person.rb
with_options on: :welcome_step do
  validates :first_name, :last_name, :date_of_birth, presence: true
  validate :date_of_birth_within_supported_range
end

with_options on: :location_step do
  validates :country_of_residence, :nationality, :domiciled_in_uk, :currently_resident_in_uk, presence: true
end

with_options on: :extended_family_step do
  validates :parents_alive, :siblings_alive, presence: true
end
```

Controller calls `person.save!(context: :welcome_step)` etc. Same pattern OnboardingSession used; Person inherits it.

For child Person rows: `validates :first_name, :relationship_kind, presence: true, on: :family_step`.

For Marriage / Parentage: only invariant validations (kind in KINDS, etc.). They never validate "presence on step X" — they're orchestrated by the controller and only created when their data is present.

### Q-E. Removed children: destroy

Cascade-delete via `dependent: :destroy` on Parentage. The Person row goes; its Parentages go with it. If the user re-adds "Charlie" later, that's a new Person.

### Q-F. `summary_facts` rewrite

Move the method off OnboardingSession and onto User. Reads from `will_maker_person`, `marriages.active.first`, `parentages` chain.

```ruby
# app/models/user.rb
def summary_facts
  facts = [you_fact, location_fact, relationship_fact]
  facts << children_fact if has_children_in_session?
  facts << parents_fact
  facts << parents_in_law_fact if active_marriage.present?
  facts << siblings_fact
  facts.compact
end

private

def you_fact
  p = will_maker_person
  { label: "You", value: "#{p.full_name}, born #{p.date_of_birth.strftime("%-d %B %Y")}" }
end
# ... etc
```

`OnboardingSession#summary_facts` deleted. The wrap-up view now reads `current_user.summary_facts`.

### Q-G. Sub-commit packaging — 5 commits, accept the half-and-half

Yes the controller is half-converted in the middle, but each commit is verifiable in the browser before moving on. The risk of "let me do all 5 in one shot and miss something" is greater than the cost of the controller looking unbalanced for a few commits.

## Per-commit detail

### 3a — Eager Person + welcome

**Files**: `app/models/user.rb`, `app/controllers/mobile/onboarding_controller.rb`, `app/views/mobile/onboarding/welcome.html.erb`, `test/models/user_test.rb`, `test/controllers/mobile/onboarding_controller_test.rb`.

**`User#after_create`** adds will-maker Person creation (as above).

**Controller** for welcome:
```ruby
class Mobile::OnboardingController < Mobile::BaseController
  before_action :requires_user!
  # ... other actions still on OnboardingSession until 3b–3e land

  def update_welcome
    current_user.will_maker_person.update!(welcome_params.merge(context: :welcome_step))
    current_user.update!(current_step: "location") unless current_user.current_step == "completed"
    redirect_to mobile_onboarding_location_path
  rescue ActiveRecord::RecordInvalid
    render :welcome, status: :unprocessable_entity
  end

  private

  def welcome_params
    params.require(:person).permit(:first_name, :middle_names, :last_name, :date_of_birth)
  end
end
```

Note: `update!(attrs.merge(context:))` doesn't actually accept context — needs to be `assign_attributes` + `save!(context:)`:
```ruby
person = current_user.will_maker_person
person.assign_attributes(welcome_params)
person.save!(context: :welcome_step)
```

**View** swaps `form_with model: @onboarding_session` → `form_with model: current_user.will_maker_person, scope: :person, url: mobile_onboarding_welcome_path`. Field names go from `onboarding_session[first_name]` to `person[first_name]`.

**Tests**: existing welcome-step controller tests update field names. Add a model test for `User#after_create` creating the will-maker Person.

### 3b — Location

Same Person, additional fields: `country_of_residence`, `nationality`, `domiciled_in_uk`, `currently_resident_in_uk`. Controller mirrors welcome but with a `:location_step` context. View field-name swap.

### 3c — Family (the big one)

**Files**: `app/controllers/mobile/onboarding_controller.rb` (large change), `app/views/mobile/onboarding/family.html.erb` (large change), `app/views/mobile/onboarding/_child_fields.html.erb` (large change), `app/javascript/controllers/family_form_controller.js` (modest — element selectors), `app/models/marriage.rb`, `app/models/person.rb`, tests.

**Controller**:
```ruby
def update_family
  ActiveRecord::Base.transaction do
    sync_partner(family_params[:partner])           # see below
    sync_children(family_params[:children] || [])
    will_maker = current_user.will_maker_person
    will_maker.assign_attributes(
      relationship_kind: nil,  # User-level relationship_status sits on Marriage now
      times_divorced: family_params[:times_divorced],
      times_widowed: family_params[:times_widowed]
    )
    will_maker.save!(context: :family_step)
    current_user.update!(current_step: "extended_family")
  end
  redirect_to mobile_onboarding_extended_family_path
rescue ActiveRecord::RecordInvalid
  render :family, status: :unprocessable_entity
end

private

def sync_partner(partner_params)
  active = current_user.active_marriage
  if family_params[:relationship_kind].in?(Marriage::KINDS)
    spouse = active&.partner_person || current_user.people.create!(relationship_kind: "spouse")
    spouse.assign_attributes(partner_params.slice(:first_name, :last_name))
    spouse.save!(context: :family_step)
    if active
      active.update!(kind: family_params[:relationship_kind], started_at: partner_params[:started_at])
    else
      Marriage.create!(
        will_maker_person: current_user.will_maker_person,
        partner_person: spouse,
        kind: family_params[:relationship_kind],
        phase: "active",
        started_at: partner_params[:started_at]
      )
    end
  elsif active
    active.end!(reason: family_params[:relationship_kind])  # transitions to ended phase
  end
end

def sync_children(children_params)
  # see Q-B / Q-C resolution
end
```

**Marriage#end!**:
```ruby
def end!(reason:)
  update!(phase: %w[separated divorced widowed].include?(reason) ? reason : "separated", ended_at: Date.current)
end
```

**View**: replace `@onboarding_session.relationship_status` with derived value from `current_user.active_marriage&.kind || current_user.will_maker_person.former_relationship_kind` (TBD shape). Form field name changes from `onboarding_session[relationship_status]` to `relationship_kind`.

### 3d — Extended family

Identity-shape: `parents_alive`, `parents_in_law_alive`, `siblings_alive`, `number_of_siblings` move to the will-maker Person. Controller writes them via `assign_attributes` + `save!(context: :extended_family_step)`. View swaps field names.

### 3e — Wrap-up + summary_facts

Move `summary_facts` from OnboardingSession to User. Wrap-up controller marks `completed_at`. Wrap-up view reads `current_user.summary_facts`.

After 3e: `Mobile::OnboardingController` has no references to OnboardingSession. The base controller's `onboarding_session` / `find_or_create_onboarding_session!` / `destroy_onboarding_session!` / `touch_onboarding_session!` methods become dead code, removed in Commit 5.

## Risks

- **Family-step view rewrite is invasive**. The current view has `@onboarding_session.children_payload` references in many places, plus `@onboarding_session.relationship_status` cascades. Easy to miss something on first pass. Mitigation: type each transformation against the running test suite.
- **`Marriage#end!` reason mapping**. `relationship_kind` changing from `married` to `divorced` should end the prior Marriage with `phase: "divorced"`. From `married` to `single` → `separated`. The mapping needs care.
- **`times_divorced` / `times_widowed`** counters live on Person but are conceptually about Marriage history. Could be derived from `Marriage.where(phase: ...).count`. For now keep the counter columns (the form captures them directly); leave derivation as a follow-up.

## Effort estimate

| Sub-commit | Effort |
|---|---|
| 3a — Welcome | 0.5 day |
| 3b — Location | 0.5 day |
| 3c — Family | 1.5 days |
| 3d — Extended-family | 0.5 day |
| 3e — Wrap-up | 0.5 day |
| **Total** | **3.5 days** |

vs v4 plan estimate of 3 days for all of Commit 3 — slightly more because the family-step orchestration is more invasive than v4 acknowledged.
