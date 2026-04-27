# ERD implementation notes — Epic 3 (Version B, target — 2026-04-27)

Companion to [`01-erd-target-2026-04-27.mmd`](01-erd-target-2026-04-27.mmd). This is the **post-Epic-3 target** schema — where the codebase lands once Epic 3 collapses `OnboardingSession` into `User`.

> **Differs from Epic 2's transitional ERD ([../epic-2-onboarding/detailed-plan-refresh-2026-04-25/01-erd-2026-04-27.mmd](../epic-2-onboarding/detailed-plan-refresh-2026-04-25/01-erd-2026-04-27.mmd)) only in the OnboardingSession consolidation.** Same domain, same Person / Marriage / Parentage / Will / Asset / etc. The 30+ other entities are byte-identical.

## What changes from Version A → Version B

| Concern | Version A (Epic 2) | Version B (Epic 3 target) |
|---|---|---|
| Onboarding draft | Separate `OnboardingSession` table with token, current_step, attribution, lifecycle fields | Absorbed into `User` — anonymous Users are Users with `email_address IS NULL` |
| `User.email_address` | NOT NULL, UNIQUE | Nullable; partial UNIQUE index `WHERE email_address IS NOT NULL` |
| `User.password_digest` | NOT NULL | Nullable |
| `Person.user_id` | Nullable (NULL during draft phase) | NOT NULL (always set; draft Persons belong to anonymous User) |
| `Person.onboarding_session_id` | Present (FK to OnboardingSession) | **Gone** |
| `Device.onboarding_session_id` | Present (FK to OnboardingSession, for pre-auth registration) | **Gone** — Device.user_id is always set since User exists from day one |
| Promotion ceremony | Multi-step transactional copy from OnboardingSession + draft Persons → registered User + durable Persons | Trivial: `user.update!(email_address: …, password: …)` on the existing anonymous User row |
| Cleanup of abandoned drafts | `DELETE FROM onboarding_sessions WHERE last_seen_at < 3.hours.ago` (cascades to draft Persons) | `DELETE FROM users WHERE email_address IS NULL AND last_seen_at < 3.hours.ago` (cascades to Persons, Marriages, etc.) |
| Person CHECK constraint | `NOT (user_id IS NULL AND onboarding_session_id IS NULL)` | Just `user_id NOT NULL` |
| Device push dedup | `vendor_id` (Phase I shipping) → switch to `(user_id, platform)` once auth lands | Can use `(user_id, platform)` from day one — collapses the Phase I "after Epic 3 ships auth, switch dedupe" memory note |

## Migration path (Epic 3 work)

The OnboardingSession→User consolidation is **a discrete piece of Epic 3 work**. Specifically:

1. **Schema migration** (one transaction):
   - Make `users.email_address` and `users.password_digest` nullable.
   - Add `users.token`, `users.current_step`, `users.intro_seen_at`, `users.last_seen_at`, `users.completed_at`, attribution fields, startup obligation fields.
   - Backfill: for every active OnboardingSession, create a corresponding User row with the OnboardingSession's data and `email_address NULL`. Update Person and Device rows that referenced the OnboardingSession to reference the new User instead.
   - Drop `persons.onboarding_session_id` and `devices.onboarding_session_id` columns.
   - Drop `onboarding_sessions` table.

2. **Code refactor**:
   - `OnboardingSession` model → delete; methods migrate to `User`.
   - `Mobile::EntryRouting` and `Mobile::StartupRouting` reference `current_user` instead of `onboarding_session`.
   - `Mobile::BaseController#onboarding_session` → renamed to `current_user_or_create_anonymous` (or similar).
   - `Mobile::SessionsController#create` (login): on successful login, destroy the current anonymous User row before starting the new authenticated session.
   - All onboarding controllers reference `current_user` for state.

3. **Validations**:
   - `User` validation context `:registered` requires `email_address` and `password_digest` present.
   - `User` validation context `:anonymous` (or no context) allows them NULL.
   - Authentication code (`User.authenticate_by`) must skip Users with `email_address IS NULL`.

4. **Cleanup job**:
   - Replace the abandoned-draft cleanup query that targeted OnboardingSession with one that targets anonymous Users.
   - Ensure cascade-delete chain works (Person, Marriage, Parentage, Will, etc.) with no dangling rows.

5. **Tests**:
   - Existing OnboardingSession tests rewrite to test User-with-NULL-email behavior.
   - Cascade-delete integration test for anonymous-User cleanup.
   - End-to-end onboarding flow test: anonymous User created on `/mobile/open`, fills out onboarding, signs up at secure-account → same User row updated with email/password (no row creation/deletion).

## Schema-level details (same as Version A unless noted)

The following details apply identically to Version A and Version B; documented in [Epic 2's implementation notes](../epic-2-onboarding/detailed-plan-refresh-2026-04-25/01-erd-implementation-notes-2026-04-27.md):

- Money column precisions
- UNIQUE constraints (Will, Marriage, Parentage, allocations, Trust roles)
- CHECK constraints
- Active Record encryption mode strategy
- Cascade-delete strategy (on User.destroy)
- Polymorphic association safety
- Index strategy

## What's different in Version B's constraints

Beyond what's listed above:

- **`User.email_address`**: change from `UNIQUE NOT NULL` to nullable with **partial unique index** `WHERE email_address IS NOT NULL`. This allows many anonymous Users (each with NULL email) but only one registered User per email.
- **`Person.user_id`**: NOT NULL constraint (no longer needs the "or onboarding_session_id" alternative).
- **No CHECK on Person about belonging-to-graph-or-draft**: now always belongs to a User (which itself may be anonymous or registered). Simpler.

## What stays exactly the same

- Every domain entity except User, Person, Device
- All relationships except those involving OnboardingSession
- All Asset / Bequest / Will / Marriage / Parentage / Trust / Business modelling
- Encryption strategy
- Index strategy (minus the OnboardingSession-specific indexes)
- Polymorphic association decisions
- Audit trail / paper_trail / paranoia plans (all in PRE_LAUNCH_TODO)
