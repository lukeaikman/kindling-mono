# Step 6 — Elon first principles (2026-04-27)

QA found real bugs. Now Elon strips back to the physics: is the plan solving the right problem in the simplest possible structure?

## What is this plan actually achieving?

Stated goal: get Epic 2 (onboarding) to "ready for internal testing."

Concrete deliverables when v1 ships:
1. The family-form bug stops blocking onboarding completion.
2. The onboarding flow captures more accurate Parentage data.
3. PII is encrypted at rest.
4. Northern Ireland users can pick their location.
5. There's one happy-path test that proves the plumbing works.

## The simplest version of each deliverable

If we strip every "should" back to "must":

### Deliverable 1: family-form bug

**Must-do**: the conditional reveal (partner fields appear when "Married" is picked; children section appears when "Yes children") works.

**The plan does**: rebuilds the entire family form to support per-child co-parent capture, plus fixes the bug as a side effect.

**First-principles question**: could we fix just the bug, ship that, and add the co-parent UX as a separate workstream later?

The bug is one Stimulus controller change — maybe 10 lines, half a day. The co-parent UX is 2-3 days plus its dependencies. Bundling them means the bug fix waits for the larger feature.

**But**: the co-parent UX needs the children-as-records refactor anyway. And once we're refactoring the family form, it's cheaper to do the UX expansion in the same touch than to come back to it.

Elon's call: **bundle is correct iff we commit to ship the bundle in one push**. If there's any chance of partial deploys, separate them. Given this is a single-PR ship, bundling stands.

### Deliverable 2: better Parentage data

**Must-do**: capture user's relationship to each child + co-parent's relationship to each child.

**The plan does**: creates Person rows + Parentage rows + sometimes Marriage rows, with a new `FamilyStepUpdate` model encapsulating the multi-row write logic.

**First-principles question**: do we need separate Person rows for the partner from day one of onboarding, or could we just store the partner's name on the will-maker Person until promotion?

If partner is just `Person.partner_first_name` and `Person.partner_last_name` columns on the will-maker, we avoid creating a partner Person row. But then:
- Partner can't appear in the people graph (Epic 4 surface broken)
- Partner can't be a Parentage parent (the whole reason for this plan)
- Partner can't receive an Invitation later

So no — partner must be a Person from day one for the data graph to work.

What about co-parents in the "someone else" case? Same logic: they need to be Person rows to appear in the graph and be invited later.

**Elon's call**: **Person rows from day one is correct**. There's no simpler structure that captures the data we've decided to capture.

### Deliverable 3: PII encryption

**Must-do**: PII at rest isn't readable from a DB dump.

**The plan does**: declares `encrypts :first_name, ...` on Person and User with deterministic mode.

**First-principles question**: is encryption-at-rest needed for internal testing? Internal testers' data is fictional.

Pure first-principles: no, internal testing doesn't need encryption.

But: encryption is half a day of work and zero ongoing cost. Adding it later means re-encrypting any test data accumulated before launch.

**Elon's call**: **defer-able, but the cost of doing it now is negligible**. Keep in v1 because deferring saves nothing meaningful and adds re-migration risk later.

### Deliverable 4: Northern Ireland

**Must-do**: NI users can pick their location.

**The plan does**: adds one option to a radio group.

**Elon's call**: keep. 5 minutes of work.

### Deliverable 5: one happy-path test

**Must-do**: there's automated proof the onboarding flow works end-to-end.

**The plan does**: one Capybara system test driving Chrome through the full flow.

**First-principles question**: do we already have proof that onboarding works? The existing request specs cover the happy path; the family-form bug is the only known break.

Honest answer: yes, request specs cover most of it. But Stimulus interactions (the conditional reveals, the new co-parent UX) aren't testable from request specs. Capybara is the only way to verify Stimulus + Turbo + Rails together.

**Elon's call**: keep. One test, not three.

## Are any of the additions overkill?

Walking through the QA fixes:

- **B1 (partial unique indexes)**: necessary. Belt-and-braces for race conditions. Cost: 2 lines.
- **B2 (cascade-delete on Person → Parentage)**: necessary. Otherwise B3 fails.
- **B3 (removed-child cleanup)**: necessary. Without it, edits leak orphan rows.
- **B4 (cohabitation start date validation)**: necessary for legal correctness.
- **B5 (workstream order)**: necessary for the migration to work.
- **B6 (find_or_initialize)**: necessary. find_or_create_by with block doesn't update.
- **U1 (widowed confirmation prompt)**: nice-to-have. The state change is destructive. Could ship without it and add when first user complains.
- **U2 (validation error rendering)**: necessary. Already implicit in Rails patterns; the plan just needs to verify the existing pattern works.
- **P1 (someone-else test branch)**: necessary. Currently the "someone else" path is untested.
- **P2 (relationship-change cascade test)**: necessary. The destroy_existing_partnership! logic is non-trivial.
- **P3 (data migration also creates will-maker + partner Persons)**: critical. Without this, deploying the migration to TestFlight wipes existing testers' data.
- **P4 (cohabitation started_at test)**: necessary, ties to B4.

Net QA additions: nearly all necessary. U1 is the only candidate for cutting.

## The actually-deeper question: what could go wrong with this plan?

Beyond bugs in the implementation, the plan has structural risks:

### R1. The `FamilyStepUpdate` PORO is doing too much

`apply_partner!` + `apply_children!` + `apply_co_parent!` + `apply_guardianship!` (via the implementation) all in one class. This is the classic "service object that grew." The plan calls it a "model" to dodge the service-object prohibition, but functionally it's a service object.

**Counter**: it's encapsulated, single-purpose ("apply the family step's submitted data"), and replaces a controller method that would be even uglier. If we tried to put this in the controller, `update_family` becomes 80+ lines of nested conditionals.

**Elon's instinct**: extract the partner logic and the children logic into separate methods on `OnboardingSession` itself (fat model). Then `FamilyStepUpdate` is just an orchestrator with 3 method calls. Or: skip the orchestrator, put the logic directly on OnboardingSession.

```ruby
class OnboardingSession < ApplicationRecord
  def apply_family_step!(params)
    transaction do
      apply_partner!(params)
      apply_children!(params)
    end
  end

  def apply_partner!(params)
    # ... 30 lines ...
  end

  def apply_children!(params)
    # ... 50 lines ...
  end
end
```

Controller becomes:
```ruby
def update_family
  onboarding_session.apply_family_step!(family_params)
  onboarding_session.update!(current_step: "extended_family")
  redirect_to mobile_onboarding_extended_family_path
rescue ActiveRecord::RecordInvalid
  render :family, status: :unprocessable_entity
end
```

DHH-er. No new class. OnboardingSession gets fatter but it's already the natural home for "this is the user's onboarding state." The orchestrator class earns its own existence only when there are multiple distinct callers — there aren't.

**Elon's call**: **drop `FamilyStepUpdate`**. Move the logic to `OnboardingSession`. v2 plan should reflect this.

### R2. Two-FK-direction Person ↔ User is risky

Person.user_id (graph ownership) + User.will_maker_person_id (will-maker identification) + circular nullable FKs + the will_maker_person partial unique index per session... this is a lot of moving pieces.

The simpler structure: `Person.is_will_maker` boolean on Person, with a partial unique index ensuring at most one will_maker per User.

```ruby
add_index :people, :user_id,
  unique: true,
  where: "is_will_maker = true",
  name: "index_people_on_user_will_maker"
```

Then User doesn't need `will_maker_person_id` at all. To find the will-maker:

```ruby
class User < ApplicationRecord
  has_many :people
  has_one :will_maker_person, -> { where(is_will_maker: true) }, class_name: "Person"
end
```

**Elon's call**: **simpler shape. Drop User.will_maker_person_id. Add Person.is_will_maker boolean.** Removes the circular FK problem entirely. The user's repeated questions about the User↔Person circular FK in earlier rounds suggested this was confusing; this fixes it.

But: this contradicts an earlier ERD decision that the user signed off on. Worth raising as DHH-v2 synthesis question.

### R3. The plan changes seven things at once

Schema migrations + encryption + children-as-records + family UX expansion + family-form bug fix + NI + Capybara test. Seven workstreams across ~8 days.

**First-principles question**: what's the minimum path to "internal testing unblocked"?

The actual blocker for internal testing is the family-form bug. Everything else is "while we're in there." If the bug is fixed and only the bug, internal testers can walk through onboarding TODAY.

The other items are scope expansion that the user has explicitly signed off on (capture better data, encrypt PII, add NI, etc.). They're not blockers — they're improvements.

**Elon's instinct**: ship in two waves.
- **Wave 1 (1 day)**: family-form bug fix + NI + Capybara test for the existing flow. Internal testing immediately unblocked.
- **Wave 2 (~6 days)**: children-as-records + family UX expansion + encryption + the other QA fixes. Ships when ready.

Wave 1 is "ship today, validate the bug fix works in the wild." Wave 2 takes the time it takes; v1 plan effort estimate stays the same total but the value lands faster.

**Elon's call**: **split. Wave 1 ships in a day. Wave 2 follows.** This is a real first-principles win.

### R4. Are we testing the wrong things?

The Capybara test verifies the new co-parent UX flow. But the high-value tests for an estate-planning app are:
- "Married + children produces correct Parentage rows" (in plan)
- "Cohabiting partner produces Marriage with kind=cohabiting" (not explicitly tested)
- "Step-child with partner-as-biological-parent produces correct two-Parentage shape" (not explicitly tested)
- "User changes from married to single mid-flow → Marriage destroyed but children retained" (P2 covers this — good)

**Elon's call**: P1 + P2 are the valuable test additions. The happy-path Capybara test is plumbing-validation, not data-correctness validation. Both are needed but be honest about which is which.

## What Elon would push DHH to change in v2

| Change | Reason |
|---|---|
| Drop `FamilyStepUpdate` PORO; put logic on `OnboardingSession` | DHH-er; fewer classes; the orchestrator earns its existence only with multiple callers |
| Drop `User.will_maker_person_id`; add `Person.is_will_maker` boolean | Removes circular FK; simpler |
| Split into Wave 1 (bug fix only) + Wave 2 (everything else) | Get value to internal testers in 1 day instead of 8 |
| U1 (widowed confirmation) is optional; cut if needed | Nice-to-have, not blocker |
| Add explicit data-correctness tests for cohabiting and step-child Parentage shapes | The Capybara plumbing test doesn't cover these |

## What Elon affirms in DHH v1

- Children-as-records refactor: correct, no simpler structure works
- Encryption: cheap to do now, expensive to defer
- Person rows for partner from day one: correct
- One Capybara test (not three): correct
- Cascade-delete test moved to PRE_LAUNCH: correct

## Net effort with Elon refinements

If DHH adopts the FamilyStepUpdate→OnboardingSession move and the Person.is_will_maker change:
- Saves ~0.5 day on writing/testing FamilyStepUpdate
- Saves ~0.5 day on the User.will_maker_person_id migration + null-handling

If DHH adopts Wave 1 / Wave 2 split:
- Wave 1: 1 day (bug fix + NI + 1 Capybara test for existing flow)
- Wave 2: ~6 days (everything else)
- Total: same ~7 days but value-delivery accelerates

Revised total: **~7 days, with value front-loaded** (1 day to unblock testing, 6 days to add the data-quality features).
