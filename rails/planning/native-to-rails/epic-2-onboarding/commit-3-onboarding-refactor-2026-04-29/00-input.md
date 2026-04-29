# Step 0 — Input (2026-04-29)

## What we're planning

**Wave 2 Commit 3** of the Epic 2 onboarding refactor: switch `Mobile::OnboardingController` off `OnboardingSession` (the legacy JSON-blob-on-a-row pattern) and onto `current_user` + the unified-shape models (`Person`, `Marriage`, `Parentage`, `Will`) shipped in Commit 2.

After this commit, OnboardingController has zero references to `OnboardingSession`. The `onboarding_sessions` table can then be dropped in Commit 5.

The 5 onboarding step actions all need refactoring: welcome, location, family, extended_family, wrap_up.

## What's already shipped (don't redo)

- **Commit 1** (`040ac9e`, `0b2dc83`) — schema migrations 1–7 (additive, `users` lifecycle/attribution columns, `people`, `parentages`, `marriages`, `wills`, `users.will_maker_person_id`); per-environment encryption keys; PRE_LAUNCH entry for prod-key provisioning.
- **Commit 2** (`824bb7b`) — `User` rewritten anonymous-from-day-one, `encrypts :email_address`; `Person`/`Marriage`/`Parentage`/`Will` models with deterministic encryption on PII; `Mobile::BaseController` extended with `current_user` / `requires_user!` / `create_anonymous_user!` / `cleanup_stale_user!` (legacy `onboarding_session` machinery preserved alongside); `AbandonedAnonymousUserCleanupJob` runs hourly via Solid Queue.
- **Wave 1 / family-step UX** (Apr 27–28) — partner section, smart partner labels, per-child co-parent radio, two-up name layouts, "Add another" gate, scroll-into-view, no-first 2-up disability/mental-capacity. Already validated in browser. **The view is correct UX-wise**; this commit only swaps the data backing it.

## Decisions already made (don't re-litigate)

These came from the conversation pre-lplan. They constrain what follows.

1. **Eager will-maker `Person` creation.** `User#after_create` builds a `Person(relationship_kind: "self")` stub alongside the draft `Will`. Same justification as the eager Will: other rows attach to it (`Marriage`, `Parentage`), so making it always-present removes nil-handling everywhere and matches the Will's structural logic. Cleanup-on-bail is already paid for via cascade-delete + the cleanup job.

2. **No `apply_*_step!` fat-model methods.** The previous v4 plan packaged form-handling into one method per step on User; that's controller work in DHH terms. Domain methods on the right model only when they enforce a real invariant (e.g. `Marriage#end!`).

3. **Family-step orchestration is inline in the controller**, with private helpers (`sync_partner`, `sync_children`). It's ~50 lines, but they're orchestration lines, sitting in the orchestration layer. Moving them to a fat-model method would just be relocating, not abstracting.

4. **Eager creation pattern applies only to the will-maker Person.** Spouse/child/co-parent Persons are created lazily on first family-step submit, the natural way.

5. **Cookie cutover stays for Commit 4.** During Commit 3 the controller switches reads/writes to `current_user`; the cookie is already issued by `Mobile::BaseController#requires_user!` (Commit 2). Sessions-controller cookie-swap-at-registration lands in Commit 4.

6. **`onboarding_sessions` table stays for now.** Migration 8 (drop) lands in Commit 5, after all callsites are off it. Keeping it around mid-flight is the safe path.

## Plan's forbidden list (carried from v4)

- No `app/services/`. No form objects, presenter objects, policy objects.
- No new gems beyond the Gemfile.
- No premature extraction of helpers/concerns/shared modules until ≥3 duplicates exist.
- No defensive code for cases that can't happen.
- No `rescue` for exceptions you don't have a specific recovery for.
- Multi-row write logic on the relevant Active Record model as fat-model methods (where it earns it), not service-object classes.
- No default scopes.

## Open questions for the lplan to resolve

These are the actual design questions for this commit. Each persona should weigh in.

**Q-A. Does Person get created in `User#after_create` or in a `before_action :ensure_will_maker_person!` filter on the controller?**

If we genuinely commit to "eager", `after_create` is the right place — it's an invariant of the User. But if we want to avoid coupling User creation to onboarding (e.g. in case future flows create Users without onboarding), a controller filter is more decoupled. Decision needed.

**Q-B. Children in form params — array of hashes with stable IDs across re-renders?**

The current OnboardingSession approach uses `id => SecureRandom.hex(6)` per child, kept in the JSON blob, so re-renders preserve order/identity even on validation failure. With Person rows, we have real DB IDs *if* the Person was saved; new-but-not-yet-saved children need a placeholder ID that's also reflected back to the form. How do we handle this without leaking DB IDs to the URL on first render?

Options:
- Reuse the SecureRandom.hex(6) pattern: form carries `client_id`, backend matches on it
- Use `param.permit(children_attributes: [...])` Rails nested-attributes pattern — natural for `Parentage` but our shape is more complex (Person + Parentage + co-parent)
- Mix: client_id for new rows, real DB id for existing rows

**Q-C. How does `co_parent_type` map to Parentage rows?**

Current types:
- `yes_with_partner` → 2 Parentages: (will-maker → child, kind=biological/etc) and (spouse → child, kind=will-maker-says)
- `yes_with_other` → 2 Parentages: (will-maker → child) and (ad-hoc co-parent Person → child)
- `no_deceased` / `no_sole` → 1 Parentage: (will-maker → child)

But: when the user picks `yes_with_partner` then changes to `yes_with_other`, what happens to the prior spouse-Parentage row? Created/destroyed each time? Updated?

Also: child's `relationship` field (biological/adopted/step/foster) — is that the will-maker→child Parentage's `kind`, or a separate Person field?

**Q-D. Validation context for onboarding-step writes.**

`Person` has `validates :relationship_kind, presence: true, inclusion: { in: ... }`. But field-level validations for "first_name presence" only matter at certain steps. Do we use AR validation contexts (e.g. `:welcome_step`, `:family_step`) or rely on the controller to gate?

**Q-E. Children removal — destroy Person row or leave orphaned?**

User adds Charlie + Alex, then removes Alex. Do we:
- destroy the `Person` row for Alex (and cascade Parentage rows)
- soft-delete (paranoia gem — but plan forbids new gems)
- leave it but mark inactive

If destroy is fine, what about Charlie's Person if user later adds Charlie back? New row each time? (Probably yes — "removed and re-added Charlie" is two operations, not "edit-undo-edit".)

**Q-F. Wrap-up `summary_facts` rewrite.**

Currently reads from OnboardingSession columns. Needs to read from `current_user.will_maker_person`, `current_user.active_marriage` (or `marriages.find_by(phase: 'active')`), `Parentage` chain for children. Direct shape change in the model. Existing tests need updating.

**Q-G. Sub-commit packaging.**

The big question: do we ship 3a → 3e as 5 commits (one per step) or as one fat commit?

5 commits arguments: each end-to-end verifiable in browser; small blast radius; easy revert.

1 commit arguments: the OnboardingController is one file; partial refactor leaves it half-and-half mid-stream, which is uglier than getting it done.

## Out of scope for this commit

- Drop `onboarding_sessions` table (Commit 5)
- Sessions controller / Auth controller cookie-cutover-at-registration (Commit 4)
- Login warning UX (Commit 4)
- API v1 controllers (legacy, dead — separate cleanup if at all)
- Person-merge feature for the co-parent person-picker UX (Epic 4)
- Audit-trail / paranoia / postgres CHECK enums (PRE_LAUNCH_TODO)

## Definition of done for the commit

1. `Mobile::OnboardingController` references neither `OnboardingSession` nor `@onboarding_session`.
2. Every onboarding view reads from `current_user` / `current_user.will_maker_person` / `current_user.marriages` / `current_user.parentages` / etc. instead of `@onboarding_session`.
3. Wave 1 family-step UX behaviour preserved exactly: same fields, same conditional reveals, same Stimulus controllers, same browser feel.
4. All existing controller + system tests still pass (after attribute-name updates).
5. New tests cover the Person/Marriage/Parentage write paths (one per step minimum).
6. `summary_facts` reads from the new shape.
7. `OnboardingSession` model + table still exist (don't break Commit 5's migration 8 contract).
