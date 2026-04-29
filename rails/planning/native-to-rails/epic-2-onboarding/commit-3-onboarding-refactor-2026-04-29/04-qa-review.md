# Step 4 — QA review on DHH v1 (2026-04-29)

> Hunt for edge cases, gaps, footguns. Each finding gets a tag (B = bug, G = gap, T = test).

## Findings

### B1. `has_many through:` chain mis-shaped

```ruby
has_many :marriages, through: :will_maker_person, source: :marriage_as_will_maker
```

Doesn't work. `marriage_as_will_maker` on Person is a `has_one`, not `has_many` — and `has_many through: has_one` produces a one-row collection, not what's wanted.

Person has at most one *active* Marriage (enforced by partial unique index), but multiple historic ones. The Person schema:

```ruby
has_one :marriage_as_will_maker, class_name: "Marriage", foreign_key: :will_maker_person_id, dependent: :destroy
```

That `has_one` is wrong on Person too — it should be `has_many` (a person can have multiple ended marriages plus one active). The partial unique index on `phase = 'active'` enforces "one active", but historically there can be many.

**Fix**: Change Person's `marriage_as_will_maker` (and `marriage_as_partner`) to `has_many`. Add a separate `has_one :active_marriage_as_will_maker, -> { where(phase: 'active') }, class_name: "Marriage", foreign_key: :will_maker_person_id` for the singular case.

User-side then becomes:
```ruby
has_many :marriages, through: :will_maker_person, source: :marriages_as_will_maker
has_one :active_marriage, through: :will_maker_person, source: :active_marriage_as_will_maker
```

### B2. `current_user.spouse_person` after relationship transitions

`User#spouse_person` is defined as:
```ruby
has_one :spouse_person, -> { where(relationship_kind: "spouse") }, class_name: "Person", inverse_of: :user
```

Once a user transitions out of a partnership (relationship_kind goes from married → single), `sync_partner!` ends the active Marriage but does *not* touch the spouse Person. Result: `current_user.spouse_person` still returns the now-orphaned spouse Person.

If the user later picks `married` again, the controller does:
```ruby
spouse = current_user.spouse_person || current_user.people.create!(relationship_kind: "spouse")
```

…and reuses the prior spouse. That's wrong — the new spouse is a different person.

**Fix**: when `sync_partner!` ends an active marriage, also flip the spouse Person's `relationship_kind` to something inert (e.g. `former_spouse`). Then the `has_one :spouse_person` filter drops them, and the next "married" entry creates a fresh Person.

Alternative: drop the `spouse_person` shortcut entirely; always derive from `active_marriage&.partner_person`. Simpler — one source of truth.

**Recommend**: drop the shortcut. Replace `current_user.spouse_person` with `current_user.active_marriage&.partner_person`. Update User model + base controller + any view that referenced it.

### B3. Co-parent `yes_with_partner` with no active partner

`sync_co_parent!` for `co_type == "yes_with_partner"`:
```ruby
ensure_co_parentage(second_parentage, current_user.spouse_person, child_person, ...)
```

If `current_user.spouse_person` is nil (e.g. user unchecked partner mid-form), this passes nil into `parent_person:` which violates the FK. Crash on save.

**Fix**: in `sync_partner!`, run partner sync FIRST (already the case in DHH v1). Then in `sync_co_parent!`, fall back to `nil` co_type if spouse is missing — or surface a validation error. Simpler: if `co_type == "yes_with_partner"` and active marriage is nil after partner sync, treat as `no_sole`.

Actually cleaner: validate at the Parentage level — `validates :parent_person, presence: true` is implicit via belongs_to. Let it crash, catch in transaction rollback, surface error to user. The form should hide `yes_with_partner` when no partner exists anyway (the view conditional already does this).

### B4. Race on transactional rollback during family step

Family step `update_family` runs the whole thing in a transaction. If `sync_children!` validation fails halfway through, the transaction rolls back. Good — partial state isn't persisted.

But: `current_user.people.create!(relationship_kind: "child")` inside `sync_children!` — when this is called for child 1 (succeeds), then child 2 fails, child 1's create is rolled back. Yes, transactional. OK.

Wait: subtle issue. `current_user.people` is a collection — `current_user.people.create!` adds to it. If the transaction rolls back, the row is gone but `current_user.people` association cache still holds the now-dead Active Record object. Re-renders that read `current_user.people` may show ghost rows.

**Fix**: in the rescue branch, `current_user.reload` (or specifically `current_user.people.reset`) before re-rendering. Alternatively, build via `Person.new(user: current_user, ...)` and save individually — but that loses transactional grouping.

**Recommend**: `current_user.reload` in the rescue branch.

### B5. `current_user.update!(will_maker_person: person, ...)` after `person.save!`

In `update_welcome`:
```ruby
person.save!(context: :welcome_step)
current_user.update!(will_maker_person: person, current_step: "location")
```

Two writes. Not a real race because they're in the same request, but: if `update_welcome` is called when `current_user.will_maker_person_id` is already set (resume scenario), then the second update is a no-op for `will_maker_person:` and useful only for `current_step:`.

Cleaner:
```ruby
person.save!(context: :welcome_step)
current_user.update!(will_maker_person_id: person.id) if current_user.will_maker_person_id.nil?
current_user.update!(current_step: "location") unless current_user.current_step == "completed"
```

Or: wrap both writes in a transaction. Or: build the will-maker-person link in a single `current_user.assign_attributes(...).save!` call.

**Pragmatic**: leave as-is. The double-write is two small UPDATEs; real cost is negligible. Optimise later if measured.

### B6. `welcome_params` requires `:person` key — what if missing?

`params.require(:person).permit(...)` raises `ActionController::ParameterMissing` if `:person` key absent. The controller doesn't catch this; it bubbles to a 400.

**Fix**: not strictly required (the form always submits `:person`), but defensive `params[:person] || {}` is friendlier. Or rescue and re-render the form with errors.

For Wave 1 we accepted `ActionController::ParameterMissing` bubbling because the form always sends the key. Same applies here.

**Recommend**: leave as-is.

### B7. Form-name change breaks submission of legacy in-flight onboarding

A user who started onboarding pre-deploy has cookies pointing at OnboardingSession. After deploy, the welcome view renders form fields named `person[first_name]` instead of `onboarding_session[first_name]`. If they hit submit on a *cached page* (browser back-forward), the controller receives `onboarding_session` params, can't find them under `person`, and crashes.

**Mitigation 1**: cache-bust on form by adding a `data-turbo-track="reload"` indicator. Forms re-render on first request after deploy.
**Mitigation 2**: delete OnboardingSession cookies on first request after deploy via a middleware once.
**Mitigation 3**: ignore the issue. We're not live. Browser-hold-state is short-lived.

**Recommend**: Mitigation 3. Document in commit message.

### B8. Children form-params shape (`children: {}` → hash keyed by index)

Rails form helpers for `text_field_tag "children[#{i}][first_name]"` produce flat parameter names. Rails parses these into `params[:children]` as a Hash with string keys "0", "1", … 

DHH v1's `family_params` permits `children: {}` (empty hash means "all keys allowed"), then iterates `p[:children].each_value`. Works, but the wildcard permit is the loosest possible — any malicious user could submit junk keys. Rails' `permit!` flag on each child's params lets unrelated keys through.

**Fix**: explicitly permit each child's allowed keys:
```ruby
def family_params
  base = params.permit(:relationship_kind, :times_divorced, :times_widowed)
  partner = params.fetch(:partner, {}).permit(:first_name, :last_name, :started_at)
  children = params.fetch(:children, {}).map do |index, child_params|
    [index, child_params.permit(
      :id, :position, :first_name, :last_name, :date_of_birth,
      :relationship, :disabled_answer, :lacks_mental_capacity_answer,
      :co_parent_type, :co_parent_partner_relationship_to_child,
      :co_parent_other_first_name, :co_parent_other_last_name,
      :co_parent_other_relationship_to_child
    )]
  end.to_h
  base.merge(partner: partner, children: children)
end
```

Verbose but explicit and safe.

### B9. `assign_attributes(...)` with stripped attrs

```ruby
person.assign_attributes(
  first_name: attrs[:first_name],
  ...
)
```

`attrs[:first_name]` could be nil (if the form field was blanked). `assign_attributes` overwrites with nil. If the prior value should be preserved on resume, that's wrong.

But: form re-render shows current values, so user blanking a field is intentional. Nil is the correct write.

**Recommend**: leave as-is.

### B10. Co-parent type changing from `yes_with_other` to `yes_with_partner`

`sync_co_parent!` for `yes_with_partner`:
```ruby
ensure_co_parentage(second_parentage, current_user.spouse_person, child_person, ...)
cleanup_orphan_co_parent_if_needed(second_parentage)
```

`second_parentage` here references the *prior* parentage (the ad-hoc co_parent's parentage). After `ensure_co_parentage(existing: prior, ...)` runs, the prior parentage is *updated* to point at the spouse. The ad-hoc co_parent Person is now orphaned. `cleanup_orphan_co_parent_if_needed` checks if the prior co_parent has no remaining parentages and destroys them — good.

But: in `ensure_co_parentage`, when `existing` is given, we update it. The check in `cleanup_orphan_co_parent_if_needed` looks at `prior_parentage.parent_person` — but `prior_parentage` has been updated to point at `spouse`, not the ad-hoc. So the check is wrong: it'd try to destroy the spouse's parent_person if it has no other parentages.

**Fix**: `cleanup_orphan_co_parent_if_needed` needs to take the *prior* parent_person before the update, not after. Refactor:
```ruby
prior_parent_person = second_parentage&.parent_person
ensure_co_parentage(second_parentage, current_user.active_marriage.partner_person, child_person, ...)
prior_parent_person.destroy if prior_parent_person&.relationship_kind == "co_parent" && Parentage.where(parent_person: prior_parent_person).count.zero?
```

Add an explicit "remember the old, update, then check" pattern.

### B11. Removing partner cascade — does it remove children?

When user changes from `married` to `single`, `sync_partner!` ends the marriage. Spouse Person stays (or `relationship_kind: former_spouse`).

For each child where `co_parent_type: yes_with_partner`, the spouse is the second parent. After partner ends, those Parentage rows still exist and still point at the (now ex-)spouse. **This is correct** — the child still has two parents, even if those parents are no longer married.

But: the Stimulus controller might re-render the family-step view with `co_parent_type: yes_with_partner` showing... but with no active partner? The view's `partnered_options` (with "Yes, with [Sarah]") would no longer be valid options. The form's `co_parent_type` for that child becomes inconsistent.

**Mitigation**: when relationship transitions out of partnered, re-render the family step view re-evaluating `partnered_options`. The user picks fresh values.

But that's a cross-step problem (extended-family step doesn't re-show family). Do we re-flag those children with `co_parent_type: yes_with_other` and surface the (now ex-)spouse as a `co_parent`-kind Person? Or leave the Parentage as-is (the ex-spouse still parented these kids)?

**Recommend**: leave Parentage alone (correct domain modelling). On any future re-edit of family step, the form shows current options, user updates if desired.

### G1. Anonymous-User auto-cleanup nukes mid-flight Onboarding

`AbandonedAnonymousUserCleanupJob` runs hourly, destroys anonymous Users idle past 3 hours. Cascade-deletes Person/Will/etc. Good.

But: a user mid-onboarding who walks away for 3+ hours and comes back — their will-maker Person is gone. Welcome resumes from blank. Is that the intended UX?

It IS the cookie's expiry — `cookies.signed[:user_token]` expires in 3 hours. So the cookie is gone too; the returning user gets a fresh anonymous User on intro-continue. Behaviour: their session is lost, they restart onboarding. That's the explicit design.

**Test**: integration test verifying the 3-hour rule.

### G2. Person.relationship_kind allowed values audit

Person's `RELATIONSHIP_KINDS` from Commit 2:
```ruby
%w[self spouse child co_parent parent parent_in_law sibling friend professional other]
```

DHH v1 introduces `former_spouse` (B2). Add to the list.

Also: should we use `co_parent` vs `coparent` (no underscore)? The schema says `co_parent_type` for the form value. Internal Person `relationship_kind` value should be consistent. Use `co_parent` (with underscore).

### G3. `summary_facts` re-derivation cost

Old `summary_facts` reads from a single OnboardingSession row. New `summary_facts` reads from User + will_maker_person + active_marriage + (partner_person via active_marriage) + parents_alive scaffold + N children Persons + their Parentages.

That's a lot of associations. For a fully-populated User, ~5 SQL queries. Is that acceptable for the wrap-up screen? Almost certainly yes — wrap-up is a single-page view per user, hit once at end of onboarding. Don't optimise.

### G4. Partial render of validation errors

Family step has 1 partner section + N children. On validation failure (e.g. Child 2 missing first_name), the form re-renders. DHH v1 reloads `@children = current_user.will_maker_parentages.includes(:child_person).order(:position)` — but transaction rolled back, so the new children submitted in this request aren't in the DB.

**Fix**: re-render uses the form params, not the DB rows. This is what Rails does naturally for `form_with`-bound objects. Build an in-memory representation in the rescue branch:

```ruby
rescue ActiveRecord::RecordInvalid
  @person = current_user.will_maker_person
  @active_marriage = current_user.active_marriage
  @children = build_children_view_models_from_params(family_params[:children])
  render :family, status: :unprocessable_entity
end

def build_children_view_models_from_params(children_params)
  (children_params || {}).values.sort_by { |c| c[:position].to_i }.map do |c|
    OpenStruct.new(c.to_h)
  end
end
```

Or use `Person.new(...)` instances bound to the form. The view template then reads `child.first_name` etc. — works for both DB rows and form-only OpenStructs.

This is a real gap in DHH v1; needs cleaning up in v2.

### G5. Stimulus `family_form_controller.js` partner-name live update

The Stimulus controller live-updates child labels to show "Yes, with Sarah" when the user types the partner's first name. It does this by reading the input field's value and re-rendering labels in JS.

After Commit 3, the input field's name is `partner[first_name]` instead of `onboarding_session[spouse_first_name]`. The Stimulus controller selector needs to update.

Same for: child first-name field for the "Add another" button gate, and the relationship_status radio for the partner-section show/hide.

**Recommend**: audit and update the Stimulus controller's element selectors. Keep behaviour identical.

### T1. Test: walking through all 5 steps end-to-end

The current Capybara test (`family_step_conditional_reveal_test.rb`) only covers the family step. Add a system test that walks all 5 steps with happy-path values and asserts the final User+Person+Marriage+Parentage+Will shape.

### T2. Test: validation context boundaries

Person should `valid?(:welcome_step)` with first_name/last_name/dob set, regardless of country fields. And vice versa for location_step. Add direct model tests for each context.

### T3. Test: relationship transition cascades

User goes married → single, prior Marriage transitions to phase: separated. Spouse Person flips to former_spouse. Add a model-level test (`User#sync_partner!` is private though — test via controller integration).

### T4. Test: encryption-at-rest for child names

Add a test: create a child Person, fetch raw column from DB, assert it's not plaintext. The Commit 2 plan called for this for Person.first_name; verify it covers the family-step write path too.

## Summary of changes for v2

- **B1**: fix `has_many through:` chain — Person has_many marriages, separate has_one for active.
- **B2**: drop `User#spouse_person` shortcut; derive from `active_marriage`.
- **B4**: `current_user.reload` in family-step rescue branch.
- **B8**: explicit per-child permit list.
- **B10**: capture prior parent_person before update, then check orphan.
- **G2**: add `former_spouse` to RELATIONSHIP_KINDS.
- **G4**: family-step re-render builds view models from params, not DB rows.
- **G5**: audit Stimulus selectors.
- **T1–T4**: tests added to v2.

Things that are fine as-is: B5, B6, B7, B9, B11, G1, G3.
