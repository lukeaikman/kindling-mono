# Step 5 — Elon first-principles pass on DHH v1 + QA (2026-04-29)

> Strip back to physics. What's the simplest thing that could possibly work?

## E1. Re-examine the whole Person/Marriage/Parentage shape

We're moving FROM:
- One `OnboardingSession` row with: `relationship_status`, `spouse_first_name`, `spouse_last_name`, `partner_started_at`, `times_divorced`, `times_widowed`, `has_children`, `children_payload` (JSON blob with all child info + co-parent shape).

TO:
- `User` (anonymous), `Person` (will-maker, with country/nationality/parents-alive/etc.), `Person` (spouse), `Person`s (children), `Person`s (ad-hoc co-parents), `Marriage` (will-maker × partner, with phase + dates), `Parentage` rows linking parents to children.

Per-form-submit, that's potentially 1 + 1 + 1 + N + M + 1 + (N + L) rows. For a married user with 2 kids and 1 step-relation: 11 rows.

**Fundamental question**: is this shape *necessary* now, or is it premature normalisation?

The argument for normalisation: domain integrity, encryption (PII per-row), Epic 4 (your-people) needs Person rows.

The argument against: a JSON blob in a single row models the same family structure with one row total. Encryption can be applied to the JSON column too (`encrypts :children_payload, deterministic: false`). Domain integrity can be enforced via Active Record validations on the deserialised hash.

**First-principles answer**: the value of normalisation isn't in onboarding (where data flows in from a form once). It's in **Epic 4**, where users edit individual people, invite them as guardians, etc. Without Person rows, every edit becomes "deserialise the whole family blob, mutate, re-serialise" — that *will* fight us when we have 50 person editing operations across the app.

So the normalisation is justified — but **only if Epic 4 is the next thing**. If Epic 4 is months away and we're doing other work in between, we'd be carrying maintenance cost on a refactor that hasn't paid back yet.

**Recommendation**: confirm Epic 4 is the next epic. If yes, ship Commit 3 now. If "next" is Epic 5/6, defer Commit 3 to just-in-time before Epic 4.

(Per current roadmap, Epic 3 = auth — most of that work is in Wave 2 already. Epic 4 = your-people. So Commit 3 → Epic 4 is the path. Justified.)

## E2. The "two sub-commits" claim

DHH v1 packages 3a (4 of 5 steps) + 3b (family). Elon-scope said yes. QA didn't push back.

**Re-test**: is 3a actually one coherent chunk, or three pretending to be one?

3a covers: welcome (3 fields on will-maker Person) + location (4 fields on same Person) + extended-family (4 fields on same Person + a number_of_siblings) + wrap-up (mark completed_at on User) + summary_facts rewrite.

Each step is "form submit → one Person update → next step". The pattern is identical for welcome / location / extended-family. Wrap-up is just `completed_at`. Summary_facts is a read-side rewrite.

So 3a is **homogeneous**. Five trivially-similar things, none of which has unique risk. One commit is correct.

**Verdict**: 3a + 3b stands. 

## E3. Re-examine the "lazy Person creation"

DHH v1 (after Elon-scope) chose lazy. The trick is that `update_welcome` does:

```ruby
person = current_user.will_maker_person || current_user.people.build(relationship_kind: "self")
```

But after first save, `current_user.will_maker_person` is nil until the User row is reloaded — because `will_maker_person_id` was just set on `current_user` in the same request via `current_user.update!(will_maker_person: person, ...)`. AR is smart enough to populate the association cache, so a subsequent call to `current_user.will_maker_person` returns the just-saved Person. OK.

But: is the `||` build really needed at all? Once we accept eager-on-first-form-submit, we'd just do:

```ruby
def update_welcome
  person = current_user.people.find_or_initialize_by(relationship_kind: "self")
  person.assign_attributes(welcome_params)
  person.save!(context: :welcome_step)
  current_user.update!(will_maker_person: person, current_step: "location") if current_user.will_maker_person_id.nil?
  redirect_to mobile_onboarding_location_path
rescue ActiveRecord::RecordInvalid
  ...
end
```

`find_or_initialize_by` is the Rails idiom for "find one or build a new one with these attrs". Two characters cleaner than `||` build.

**Adopted**: use `find_or_initialize_by(relationship_kind: "self")`.

## E4. The whole `sync_co_parent!` machinery

QA found multiple bugs (B3, B10) in DHH v1's co_parent sync. Let me re-examine if the *shape* of the orchestration is the issue.

Current shape: per-child, branch on `co_parent_type`, manage a "second parentage" + ad-hoc `co_parent` Person row.

Alternative shape: **don't model the second parentage explicitly**. Just store `co_parent_type` on the child Person itself (or on the Parentage), plus the co_parent details (name, relationship_to_child) when the co-parent is "someone else". Don't create a separate `co_parent` Person row.

What we lose: the co-parent isn't a Person, so they can't be invited as a guardian, can't be referenced as a beneficiary, etc. (Epic 4 features.)

But — most "someone else" co-parents *won't* be guardians/beneficiaries. They're an ex-partner the user mentions for legal completeness, not someone who participates in the will. The will-maker probably doesn't want to invite their ex.

**Hmm.** This is a real architectural call. Two paths:

**Path A** (DHH v1): co-parent is always a full Person row, even when it's "someone else". Future-proof for Epic 4 invites.

**Path B**: co-parent details are denormalised onto the child's Parentage row. Co-parent is a Person *only* when it's the spouse (already a Person for other reasons). "Someone else" → just stored fields on Parentage.

**First principles**: Path B is simpler today. But Epic 4 will hit a wall when "make this co-parent a guardian" requires retrofitting the data.

**Pragmatic verdict**: Path A. The QA bugs (B3, B10) are real but fixable; the shape is right.

## E5. Reduce the family controller orchestration

DHH v1's `update_family` has 4 private helpers (`sync_partner!`, `sync_children!`, `sync_co_parent!`, `ensure_co_parentage`, `cleanup_orphan_co_parent_if_needed`, `parentage_kind_for`). That's 6 methods.

Test: which of these is mandatory and which is decomposition for clarity?

- `sync_partner!` — mandatory (the partner-vs-no-partner branch is a real division)
- `sync_children!` — mandatory (per-child loop)
- `sync_co_parent!` — could fold into `sync_children!` since it's per-child too
- `ensure_co_parentage` — could fold (it's 1 of 2 lines)
- `cleanup_orphan_co_parent_if_needed` — could fold (it's 4 lines)
- `parentage_kind_for` — should be a constant lookup, not a method

**Simplification**: keep `sync_partner!` + `sync_children!`; inline the rest. Use a constant for the parentage-kind lookup:

```ruby
PARENTAGE_KIND_BY_FORM_VALUE = {
  "biological-child" => "biological",
  "adopted-child"    => "adoptive",
  "stepchild"        => "step",
  "foster-child"     => "foster"
}.freeze
```

Adopted in v2.

## E6. Drop `User#spouse_person`

QA's B2 already calls for this. Strong agreement on first-principles grounds: dual sources of truth (`spouse_person` association vs `active_marriage.partner_person`) is a maintenance bug magnet. Pick one; pick the one anchored in the relationship table (`active_marriage`).

**Where it's used today**:
- `OnboardingSession#partner_display_name` — but that's getting deleted in this commit
- DHH v1's `sync_partner!` — uses `current_user.spouse_person`, change to `current_user.active_marriage&.partner_person`

After deletion, no lingering callsites.

## E7. The `has_many :marriages, through: :will_maker_person` chain

QA's B1. The `has_many through:` chain only works if Person `has_many :marriages_as_will_maker` (plural). That's a Person-level change.

**Adopted**:
```ruby
# person.rb
has_many :marriages_as_will_maker, class_name: "Marriage", foreign_key: :will_maker_person_id, dependent: :destroy
has_many :marriages_as_partner, class_name: "Marriage", foreign_key: :partner_person_id, dependent: :destroy
has_one :active_marriage_as_will_maker, -> { where(phase: "active") }, class_name: "Marriage", foreign_key: :will_maker_person_id

# user.rb
has_many :marriages, through: :will_maker_person, source: :marriages_as_will_maker
has_one :active_marriage, through: :will_maker_person, source: :active_marriage_as_will_maker
```

Wait — `has_one through: has_one` doesn't compose well either. Test it. If problematic, do:
```ruby
def active_marriage
  will_maker_person&.active_marriage_as_will_maker
end
```

Plain method, no association cache, but trivially correct. Two lines.

**Adopted**: plain method.

## E8. Form-only view models for re-render

QA's G4. Re-rendering on validation failure with form-param-derived view models, not DB-derived ones.

This is a real complexity bump. Rails' `form_with model: @children[i]` expects an Active Record object (or duck-typed equivalent) per child — Active Record provides `errors`, `to_param`, `model_name`, etc.

Options:
- **OpenStruct** (QA's suggestion) — duck-typed but missing `errors`, `model_name`. Form helpers may fail.
- **Person.new(child_params)** in the rescue block — full AR object, but means we built but didn't save Persons. Errors get attached to the most-recently-failing one only.
- **Re-render iterates form params directly** — no model-bound `form_with`; build inputs manually.

Cleanest: iterate form params in re-render, pass each child as a Hash, the view template just reads keys:
```erb
<% (@children_params || []).each_with_index do |attrs, i| %>
  <%= text_field_tag "children[#{i}][first_name]", attrs[:first_name], class: "mobile-input" %>
  ...
<% end %>
```

The view doesn't use `form_with model:` for individual children — it uses `text_field_tag` with the position-indexed name. We were already going to need this for the "new child added but not yet saved" case anyway.

**Adopted**: form template builds input names directly; controller passes `@children_params` (an Array of Hashes) when re-rendering for errors, or builds same shape from DB rows on success.

## E9. Validation contexts vs presence checks

DHH v1 + QA both kept validation contexts. Reconsider.

Person has fields whose required-ness varies by step. Welcome step requires first_name; family step doesn't (a freshly-built spouse Person doesn't have first_name yet during validation). With contexts:
```ruby
with_options on: :welcome_step do
  validates :first_name, presence: true
end
```

Without contexts, the controller checks:
```ruby
if person.first_name.blank?
  person.errors.add(:first_name, "can't be blank")
  raise ActiveRecord::RecordInvalid, person
end
```

The contexts version is shorter and uses Rails' built-in machinery. Keep.

## E10. Single source of truth for relationship-step values

The `times_divorced` / `times_widowed` form fields write to Person columns. They're also derivable from Marriage rows (count of phase: "divorced" historic Marriages). The columns + derivation are dual sources.

**First principles**: the form captures `times_divorced` directly; user is unlikely to fill out historic Marriages explicitly during onboarding. So the column is the truth. Marriage rows for prior partnerships are aspirational future data.

Keep the columns; don't derive. (Same as Elon-scope said. Confirmed.)

## E11. Stimulus controller updates

QA's G5. The `family_form_controller.js` has element selectors keyed on `onboarding_session[...]` field names. Need to update to `person[...]` / `partner[...]` / `children[index][...]`.

**Audit needed**: list every selector in `family_form_controller.js` and its post-Commit-3 equivalent. This is a 30-minute task; bake into 3b.

## E12. Tests that don't yet exist

QA's T1-T4. Specifics:
- T1 (full-onboarding integration): use Capybara, walk all 5 steps.
- T2 (validation contexts): direct model unit tests.
- T3 (relationship transition): controller integration test with a married → single transition.
- T4 (encryption-at-rest for child): Person test, raw column inspection.

All trivial to add. Ship them in 3b alongside the family-step changes.

## Summary of v2 changes from Elon-FP

Adopted on top of QA findings:
- **E3**: `find_or_initialize_by(relationship_kind: "self")` instead of `||` build
- **E5**: inline `ensure_co_parentage` and `cleanup_orphan_co_parent_if_needed`; use a constant for parentage-kind lookup
- **E7**: plain method for `User#active_marriage`, not `has_one through:`
- **E8**: re-render builds input names directly, no form_with-bound model per child; `@children_params` array of Hashes

Confirmed/strengthened:
- Path A for co-parent (full Person rows for everyone)
- Validation contexts
- Counter columns (no derivation)
- 3a + 3b sub-commits

What Elon-FP did NOT do:
- Did NOT challenge the Person/Marriage/Parentage shape. It's correct, just expensive in the short term.
- Did NOT challenge the lazy Person creation. Find_or_initialize_by tightens it up.
- Did NOT add new sub-commits.
