# Step 5b — QA pass 2 (bedrock review, Epic 2 + Epic 3)

> Both Epic 2 v2 and Epic 3 are foundational to all later epics. This second QA pass focuses on cross-epic interactions, migration ordering, and second-order bugs that the first review missed.

## Section A — Epic 2 v2 plan: additional bugs

### B7. Guardianship migration in Wave 2 has a broken FK reference

`W2.1 #4 — Create guardianships` declares:
```ruby
t.references :will, foreign_key: true, null: true
```

But the `wills` table doesn't exist in Epic 2. The migration **fails at run time** because the FK constraint can't be created against a non-existent target.

Beyond the technical failure: re-reading W2.5 (`apply_co_parent!`) and the family-step UX flow, **Guardianship is never actually inserted into during Epic 2.** The user's "share legal responsibility" question creates Parentage rows (for partner or someone-else co-parents), not Guardianship rows. Guardianship only kicks in at will-drafting time, which is Epic 4 or 5.

**Fix**: drop the Guardianship migration from Wave 2 entirely. Defer to whichever epic creates the `wills` table (likely Epic 4 / Epic 5). When that epic runs, Guardianship is created with the proper Will FK in place.

If a v1 use case for "draft guardianship intent before any will exists" surfaces later, add Guardianship at that time. Don't create dead schema.

### B8. Data migration loses `relationship_status: "widowed"` legacy data

`MigrateOnboardingDataToRecords#create_will_maker_for` does:
```ruby
times_widowed: 0  # always 0 from the default
```

But for legacy OnboardingSession rows where `relationship_status == "widowed"`, the user explicitly answered "I've been widowed." Setting `times_widowed: 0` loses that signal — no Marriage row is created (no spouse data exists for the deceased), AND the counter says "never widowed."

**Fix**: in `create_will_maker_for`:
```ruby
times_widowed: session.relationship_status == "widowed" ? 1 : 0
times_divorced: session.divorce_status == "yes" ? 1 : 0
```

Worth a test: TestFlight user said "widowed" → migrate → re-open onboarding → see the widowed flag persists.

### B9. Person uniqueness constraint can deadlock with the family-step transaction

The partial unique indexes (B1 fix) on `(onboarding_session_id) WHERE relationship_kind = 'self'` and `WHERE relationship_kind = 'spouse'` are fine in theory. But `apply_partner!` in W2.5 does:

```ruby
partner = partner_person ||
          people.create!(relationship_kind: "spouse")
partner.assign_attributes(...)
partner.save!(context: :family_step)
```

If the user submits the family form twice quickly (double-click, or laggy network retry), two requests can both hit `partner_person.nil?`, both try to create, second one hits the unique-index conflict and raises `ActiveRecord::RecordNotUnique`. Currently the controller's `rescue ActiveRecord::RecordInvalid` doesn't catch this.

**Fix**: rescue `ActiveRecord::RecordNotUnique` too, or use Rails 7+ `upsert_all` semantics, or add a lookup retry:

```ruby
def apply_partner!(params)
  case params[:relationship_kind]
  when "spouse", "partner", "married", "civil_partnership", "cohabiting"
    partner = partner_person || begin
      people.create!(relationship_kind: "spouse")
    rescue ActiveRecord::RecordNotUnique
      reload
      partner_person  # the other transaction won the race
    end
    # ...
  end
end
```

### B10. Drop-OnboardingSession-columns migration runs against active onboarding flows

W2.4 (`CleanUpOnboardingSession`) drops 18 columns from `onboarding_sessions`. If this migration runs while users are mid-onboarding (TestFlight users), their request hits a controller that PATCHes these columns. The PATCH fails because the columns no longer exist. User loses their session state and falls back to intro.

**Fix**: ensure W2.4 is part of a deploy with the new code (which writes to Person rows, not OnboardingSession columns). Specifically:

1. Deploy the new code that writes to Person + Parentage. Old controller methods continue to fall through to OnboardingSession columns (for in-flight users).
2. Run W2.3 (data migration) to convert existing OnboardingSession data into Person rows.
3. Run W2.4 to drop the old columns.

The current v2 plan places these in the order W2.1 → W2.2 → W2.3 → W2.4 → W2.5. W2.5 is "refactor controller + add fat-model methods" — but that means the *controller is still using OnboardingSession columns* until W2.5 completes. If W2.4 runs before W2.5 deploys, the controller breaks.

**Fix**: re-order to W2.1 → W2.2 → W2.5 (controller refactor goes first, alongside view changes from W2.6) → W2.3 (data migration) → W2.4 (drop columns). Or bundle all W2 into a single deploy and run migrations + code change atomically.

### B11. The "self" marker bites Epic 4 UI

`Person.relationship_kind = "self"` is used as a marker for "this Person is the will-maker." But `relationship_kind` is also the descriptor surfaced in Epic 4's "Your People" UI (e.g., "Sarah — your spouse").

When Epic 4 renders the people list, it must filter out the `relationship_kind = "self"` row (you don't render yourself in your own people list). Easy to forget.

**Recommendation**: document this in the Epic 4 placeholder roadmap. When Epic 4 starts, the first thing the people-list query does is `.where.not(relationship_kind: "self")`. Or: use a separate `is_will_maker` boolean column (Elon R2 reprised) — but that was rejected.

Mitigation: leave the rejected decision standing, but **add a code comment + a model scope** in Epic 2 v2 to head off the gotcha:

```ruby
class Person < ApplicationRecord
  # `relationship_kind = "self"` is the marker for the will-maker Person.
  # Epic 4 + later UIs that surface "your people" must exclude this row.
  scope :other_people, -> { where.not(relationship_kind: "self") }
end
```

### B12. Email/phone validation gap on co-parent "someone_else" Person

In `apply_co_parent!` for the "someone_else" case:
```ruby
co_parent = people.find_or_initialize_by(
  relationship_kind: "other",
  first_name: co_parent_params[:first_name],
  last_name: co_parent_params[:last_name]
)
```

If two children happen to have the same first/last name for their "someone else" co-parent — say Bob Smith is the biological father of two of the user's children from a previous relationship — the `find_or_initialize_by` will REUSE the same Person row for both children. That's actually correct behaviour.

BUT: if the user enters "Robert Smith" for child 1 and "Bob Smith" for child 2, and they're the same person, we'd create two Person rows. There's no auto-dedup based on similar names. Acceptable for v1 — the user can clean up in Epic 4 if needed.

**Document**: "someone_else" co-parents may have duplicate Person rows if the user types names inconsistently. Epic 4 needs a "merge persons" feature.

## Section B — Epic 3: structural concerns (no detailed plan exists yet)

Epic 3 is bedrock and has 9 roadmap pieces but no detailed plan. The big risks are in piece 3.2 (the consolidation migration) — not in the auth flows themselves. Without a detailed plan, these gaps are likely to bite during Epic 3 implementation:

### C1. The consolidation migration needs concrete design, not a roadmap row

Piece 3.2 says "OnboardingSession → User consolidation: migrate columns from `onboarding_sessions` table into `users`; backfill anonymous Users; drop the legacy table." That's not a plan — that's a TODO.

The consolidation needs concrete answers for:

1. **Data migration ordering**: when a deploy ships the consolidation, in-flight requests are hitting the OLD endpoints with `onboarding_session_id` cookies. The migration must not break these mid-deploy.

2. **Idempotency**: if the migration script crashes halfway (network, OOM, deploy failure), can it be re-run safely? The current v2 has a similar concern (W2.3) but isn't tested.

3. **Anonymous-User-with-NULL-email semantics**: `User.authenticate_by` and `has_secure_password` must skip Users where email is NULL. Otherwise an attacker could potentially POST `/mobile/login` with `email=null&password=anything` and authenticate as an anonymous user. Critical security check.

4. **Cookie transition**: the old `onboarding_session_id` cookie becomes the new... what? Rails session cookie? A separate `user_token` cookie? The plan doesn't say.

5. **Email uniqueness constraint shift**: from `UNIQUE NOT NULL` to `UNIQUE WHERE email IS NOT NULL` (partial unique index). The migration must handle this without losing data.

**Recommendation**: write a detailed plan for piece 3.2 BEFORE Epic 2 Wave 2 ships. The Epic 2 v2 plan assumes consolidation works cleanly later — if it doesn't, Epic 2's choices become harder to undo. Spend a half-day on a concrete 3.2 plan now.

### C2. Will table location — which epic creates it?

The Version B ERD shows Will + WillExecutor + WillWitness + WillResidueAllocation + Bequest as part of Epic 3. The Epic 3 roadmap doesn't include creating any of these tables. Implicit gap.

Possible answers:
- (a) Epic 3 includes Will + WillExecutor + WillWitness creation as part of secure-account ("creates an empty Will for the new User").
- (b) Will + relatives belong to Epic 4 (Will-drafting).
- (c) Will + relatives belong to Epic 5 (after Asset entry, since Bequests reference Assets).

The original NATIVE_TO_RAILS_EPICS doc has Epic 4 = "Dashboard and Your People" and Epic 5 = "Asset Entry." Will-drafting isn't explicitly an epic.

**Recommendation**: clarify in the native-to-rails-roadmap. Likely (b) or a new Epic 6 "Will drafting." Don't let it remain implicit.

### C3. Login-from-onboarding warning is missing from the design

When a mid-onboarding user clicks "Log in instead," the plan destroys their anonymous draft. But the user has just spent 5+ minutes entering names and DOBs. Discarding all that without a confirmation prompt is a user-experience failure.

**Recommendation**: Epic 3 piece 3.4 (login flow) needs a UX requirement: when the user is mid-onboarding (Person rows exist with `onboarding_session_id` set / anonymous User has Persons attached) and clicks "Log in," show a confirm: "Logging in will discard the information you've entered. Continue?" with explicit yes/no.

### C4. Cookie story across the consolidation boundary

Pre-consolidation:
- Anonymous user has `onboarding_session_id` cookie (signed)
- Authenticated user has `session_id` cookie (Rails session)

Post-consolidation:
- Anonymous user has... `user_token` cookie? Same `session_id` cookie but for anonymous Session? Different mechanism?

The Epic 3 plan needs an explicit decision. Options:

- **Option A**: Anonymous User has a `Session` row that's marked "unauthenticated." Cookie is the standard `session_id`. Cleaner but means the Sessions table has both real and pseudo rows.
- **Option B**: Anonymous User uses a separate `User.token` column (the absorbed `OnboardingSession.token`). Cookie is `user_token` for anonymous, swaps to `session_id` on signup. Two cookies during transition.

I'd lean (A) — one cookie, one mental model. But this needs explicit decision in Epic 3 piece 3.2 design.

### C5. Production migration rollout has no plan

Both Epic 2 v2 (W2.3) and Epic 3 (3.2) include real data migrations. Neither has:
- A staging dry-run plan
- A production deployment runbook
- A rollback decision tree (when to revert vs roll forward)

For internal testing this is acceptable. **Before any public launch, both migrations need explicit rollout plans.** Add to PRE_LAUNCH_TODO.

### C6. Email uniqueness across pre-existing User rows

If pre-existing User rows have email + password (real test users created by a developer), the migration to nullable email + partial-unique-index works fine. No data lost.

But: if there's an existing User with `email_address = ""` (empty string, not NULL), the partial unique index might have edge cases. Check that all pre-existing emails are either NULL or non-empty before deploying.

```ruby
class CheckEmailDataBeforeConsolidation < ActiveRecord::Migration[8.1]
  def up
    # Sanity check before nullable-email migration
    bad_count = User.where(email_address: "").count
    raise "Found #{bad_count} Users with empty-string email_address — clean up first" if bad_count > 0
  end
end
```

## Section C — Cross-epic concerns

### X1. Person.user_id transition during consolidation

In Epic 2 v2: Person.user_id is NULL during onboarding (only set at promotion).
In Epic 3 consolidation: Person.user_id is set to the consolidated User ID.

The transition is one big UPDATE statement: `UPDATE people SET user_id = (SELECT users.id FROM users WHERE users.consolidated_from_onboarding_session_id = people.onboarding_session_id) WHERE people.user_id IS NULL`.

Plus DROP `Person.onboarding_session_id`.

**Verify**: Wave 2's CHECK constraint `user_id IS NOT NULL OR onboarding_session_id IS NOT NULL` must be DROPPED in the consolidation migration BEFORE adding `user_id NOT NULL`.

### X2. Epic 2 v2 + Epic 3 deploy strategy

Two big migrations in two separate deploys:
1. Epic 2 v2 ships (data migration runs).
2. Some time passes; users use the system.
3. Epic 3 ships (consolidation migration runs).

Between (1) and (3), the system is in an "intermediate state" — children-as-records is real, but OnboardingSession exists. This is the design.

**Risk**: anything in Epic 4+ that touches OnboardingSession or Person rows must work in BOTH the intermediate state AND the post-consolidation state. If Epic 4 development starts before Epic 3 consolidation, dev faces two schemas. Slows things down.

**Recommendation**: prioritize Epic 3 consolidation BEFORE Epic 4 development starts. Epic 4 should ship against the post-consolidation schema only.

### X3. Encryption key management

Epic 2 v2 introduces AR encryption keys. Epic 3 uses the same keys. Where are they stored?

- Development: `config/credentials/development.yml.enc` — committed to the repo, key in `master.key`.
- Test: `config/credentials/test.yml.enc` — same.
- Production: `config/credentials/production.yml.enc` + `RAILS_MASTER_KEY` env var.
- TestFlight: same as production?

**Recommendation**: explicit doc in Epic 2 v2 plan + Epic 3 plan: where the keys live, how they rotate, what happens if `master.key` leaks. Plus a runbook for key rotation (re-encrypt all encrypted columns with a new key).

### X4. Re-encryption migration (deterministic → per-column) is its own future work

The "AR encryption mode audit" PRE_LAUNCH_TODO entry says "re-encrypt with new config" as a one-time migration. But: this migration runs against potentially TB of test data, takes time, locks tables. Has its own rollout plan needs.

For internal testing, this isn't blocking. For public launch, plan needed.

## Section D — Tests that need adding

Beyond what's in v2 plan and v1 QA review:

### T1. Epic 2 v2 migration idempotency test

Test that running `MigrateOnboardingDataToRecords` twice produces the same result as running it once. Real migration safety.

```ruby
RSpec.describe "MigrateOnboardingDataToRecords idempotency" do
  it "produces the same result on re-run" do
    # Setup: existing OnboardingSession with full data
    session = create(:onboarding_session, :with_legacy_data)

    MigrateOnboardingDataToRecords.new.up
    first_state = capture_db_state

    MigrateOnboardingDataToRecords.new.up
    second_state = capture_db_state

    expect(first_state).to eq(second_state)
  end
end
```

### T2. Cohabitation date legal threshold (B4 has its own validation, but the legal-significance test isn't covered)

```ruby
it "captures cohabitation start date for IHT-1975-Act eligibility computation" do
  visit mobile_onboarding_family_path
  choose "Cohabiting"
  fill_in "Partner's first name", with: "Bob"
  fill_in "Partner's last name", with: "Smith"
  fill_in "When did you start living together?", with: "2020-06-15"
  click_button "Continue"

  marriage = Marriage.last
  expect(marriage.kind).to eq "cohabiting"
  expect(marriage.started_at).to eq Date.parse("2020-06-15")
  expect((Date.current - marriage.started_at).to_i).to be >= (2 * 365)  # 2-year threshold
end
```

This test confirms the data is captured in a form that downstream IHT-eligibility computation can use.

### T3. Step-child Parentage shape

```ruby
it "creates correct Parentage when child is step-child of user, biological of partner" do
  # Walk through onboarding: married + 1 step-child + partner-as-biological-parent

  child = Person.last_child
  parentages = Parentage.where(child_person: child)
  user_parentage = parentages.find_by(parent_person: User.last.will_maker_person)
  partner_parentage = parentages.find_by(parent_person: OnboardingSession.last.partner_person)

  expect(user_parentage.kind).to eq "step"
  expect(partner_parentage.kind).to eq "biological"
end
```

### T4. Authentication does NOT match anonymous users

For Epic 3:
```ruby
it "does not authenticate Users with NULL email_address" do
  anonymous = User.create!(email_address: nil, password_digest: nil)
  result = User.authenticate_by(email: nil, password: "anything")
  expect(result).to be_nil
end
```

Critical to prevent "log in as any anonymous user" attack vector.

## Net-net additions

Adding to Epic 2 v2 plan:
- Drop the Guardianship migration (it shouldn't be there)
- Update data migration to honor legacy `widowed` status
- Handle `RecordNotUnique` race in `apply_partner!`
- Re-order workstreams to ensure controller refactor + new code deploys before old columns drop
- Add the `Person.other_people` scope helper for Epic 4
- Add T1 (idempotency) and T3 (step-child) tests

Adding to Epic 3 work that needs definition before Epic 2 Wave 2 ships:
- Concrete piece 3.2 plan (consolidation migration)
- Cookie story decision
- Login-from-onboarding warning UX requirement
- Will table ownership decision (which epic creates it)

Adding to PRE_LAUNCH_TODO:
- Production migration rollout plans for both Epic 2 W2.3 and Epic 3 piece 3.2
- Re-encryption migration (deterministic → per-column)
- Encryption key rotation runbook
- Email-empty-string sanity check before consolidation

## Estimated effort delta from this QA pass 2

For Epic 2 v2:
- B7 (drop Guardianship migration): saves time
- B8, B9, B10 fixes: ~half day
- B11, B12 documentation: ~30 mins
- T1, T3 tests: ~half day

For Epic 3 piece 3.2 design (NEW): half-day before Epic 2 Wave 2 ships, to verify Epic 2 assumptions hold.

**Revised total estimate**:
- Epic 2 Wave 1: 1 day
- Epic 2 Wave 2: 6 days + 1 day from QA-2 fixes = **~7 days**
- Epic 3 piece 3.2 detailed plan: half-day
- Total before Wave 2 implementation: **~8 days for Epic 2 + half-day Epic 3 design = ~8.5 days**

The half-day on Epic 3 piece 3.2 is the most valuable single thing — derisks both epics by clarifying assumptions before Wave 2 commits to them.
