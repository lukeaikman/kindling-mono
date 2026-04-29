# Pre-launch TODO

Items deferred during phase work that MUST be addressed before the app ships to TestFlight / production. Each entry: what, why, rough effort, origin phase.

## Cache-Control header on `Mobile::ConfigController#show`

**What**: add `expires_in` or explicit `Cache-Control` header to the `path_configuration.json` response so CDNs and proxies can cache-and-revalidate.

```ruby
def show
  return head :not_found unless params[:resource] == "path_configuration"

  path = Rails.root.join("config/mobile/path_configuration.json")
  expires_in 5.minutes, public: true, must_revalidate: true
  if stale?(etag: path, last_modified: path.mtime)
    render json: path.read
  end
end
```

**Why**: Phase C's `stale?` sets `ETag` and `Last-Modified` but no `Cache-Control`. A Rails-direct client (URLSession) respects ETag/Last-Modified anyway. A Cloudflare / Fastly / nginx layer in front of production would not know how to cache the response without `Cache-Control: public, max-age=...`. Adding it reduces origin load once real traffic hits.

**Effort**: 1 line. Add a request spec that asserts `Cache-Control` is present.

**Origin**: Phase C detail plan (§1.2 ConfigController). Deferred because no CDN fronts the dev environment and Phase C's scope doesn't include production infrastructure tuning.

---

<!-- Add new entries below as they land. Keep each self-contained: what, why, effort, origin. -->

---


## Universal Link verification — deep-link handoff v2

**What**: wire Apple Universal Links so `kindling.app/mobile/open?...` links tapped in Mail / Messages / Safari / ad creatives open the iOS shell directly, skipping the Safari-tap-then-"Open in Kindling"-banner dance.

Four pieces. All four required together — partial wiring silently fails the first tap from a real device.

1. **Rails — AASA file.** Serve `apple-app-site-association` at `https://<prod-domain>/.well-known/apple-app-site-association`. Content-Type MUST be `application/json`. The URL MUST NOT have a file extension (no `.json` in the path). Apple's CDN fetches once at install and caches up to a week. Body:

   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         { "appID": "<TEAM_ID>.app.kindling.ios",
           "paths": ["/mobile/*"] }
       ]
     }
   }
   ```

   Add a route: `get "/.well-known/apple-app-site-association", to: "well_known#aasa"`. Controller action renders the JSON inline (from a constant or `config/well_known/aasa.json`). Public, no CSRF, no auth.

2. **Xcode — Associated Domains entitlement.** Open `ios/Kindling.xcodeproj`, target `Kindling`, Signing & Capabilities → `+ Capability` → Associated Domains. Add:
   - `applinks:kindling.app`
   - `applinks:staging.kindling.app` (if staging exists at v2 time)

   This writes a new `Kindling.entitlements` file referenced by Debug + Release build configs.

3. **AppDelegate — handler.** Add to `ios/Kindling/AppDelegate.swift`:

   ```swift
   func application(
     _ application: UIApplication,
     continue userActivity: NSUserActivity,
     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
   ) -> Bool {
     guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL else { return false }
     Navigator.shared?.route(url)
     return true
   }
   ```

   Navigator currently lives on `SceneController` as a `lazy var`. You'll need to expose it — either store it on the scene delegate and reach it from AppDelegate, or move URL handling into `SceneController`'s `scene(_:continue:)` (preferred on iOS 13+). Pick one, don't do both.

4. **Physical-device verification.** UL signatures validate against Apple's CDN-cached AASA, which means simulator cannot test this — the check passes in simulator regardless of wiring. Must be a TestFlight build or signed ad-hoc IPA on a real device, with the real domain reachable. Sequence: cold-kill Kindling → in Notes, paste `https://kindling.app/mobile/open?source=email&campaign=welcome&show_video=1` → tap → app opens directly (no Safari flash) → lands on `/mobile/video-intro`. Warm-start from the same link works identically. Repeat with attribution already stored (`first_touch=false` in the log) — destination should still respect onboarding state, not the URL params.

**Why**: deferred from Phase E v1 because no external link surface existed at that time. Gated on four prerequisites any one of which blocks real verification:
- production domain + DNS
- Apple Developer Team ID + App Store Connect record
- signed TestFlight or ad-hoc build
- physical iOS device in hand

Building UL against placeholder values produces plumbing that looks fine on inspection and fails the first real-device tap — worse than having none.

**Effort**: 1–2 days once prerequisites are met. Longer if domain/DNS/TestFlight need bootstrapping. Write as `PHASE_E2_UNIVERSAL_LINKS_DETAILED_PLAN.md` mirroring Phase C's structure when the first campaign date is set.

**Origin**: Phase E detail plan — deferred deliberately. See `rails/planning/native-to-rails/epic-0-mobile-frontend-shell/phase-e-deeplink/PHASE_E_DEEPLINK_DETAILED_PLAN.md`.

---

## Postgres-level constraint hardening for string enums

**What**: replace controller-level enum validation with Postgres native enums or `CHECK (column IN (...))` constraints for every enum-style string column.

Affected columns (non-exhaustive, refresh from ERD before implementing):
- `Will.status`: `draft | active | superseded`
- `Marriage.kind`: `married | civil_partnership | cohabiting`
- `Marriage.phase`: `active | separated | divorced | widowed`
- `Parentage.kind`: `biological | adoptive | step | foster`
- `Person.relationship_kind`: `spouse | partner | child | parent | sibling | extended_family | friend | professional | other`
- `Invitation.role_type`: `executor | guardian`
- `Invitation.status`: `draft | sent | accepted | declined | expired | revoked`
- `Asset.held_in_trust`: `yes | no | not_sure`
- All `ownership_type`, `account_type`, `policy_type`, `pension_type`, `share_class`, `crypto_type`, `debt_kind`, `trust_type` columns

Decide between Postgres native ENUM types (immutable, requires migration ceremony to add values) and CHECK constraints (mutable, simpler). Recommendation: CHECK constraints — fewer schema migrations as product evolves.

**Why**: app-level validation can be bypassed via raw SQL, console mistakes, or migration scripts. For an estate-planning app where bad enum values cause silent will-rendering bugs ("this person's role is 'exectutor'" — typo never flagged) the DB-level guarantee matters.

**Effort**: 2–4 hours migration writing + per-column CHECK constraint add. Plus updating model enums to match. Test by attempting to insert invalid values via raw SQL.

**Origin**: ERD CTO review 2026-04-27. Deferred because Epic 2 v2 plan ships with controller-level validation; DB hardening is launch-readiness, not feature work.

---

## Provision Active Record encryption keys for production

**What**: production credentials must contain an `active_record_encryption:` block with **fresh** keys — not the dev/test keys committed in `config/credentials/{development,test}.yml.enc`.

Steps when prod credentials are accessible (i.e. the host has `config/master.key` or `RAILS_MASTER_KEY` set):

```bash
bin/rails db:encryption:init                                  # prints fresh keys
EDITOR="..." RAILS_ENV=production bin/rails credentials:edit  # paste the block
```

The block looks like:

```yaml
active_record_encryption:
  primary_key: <fresh value>
  deterministic_key: <fresh value>
  key_derivation_salt: <fresh value>
```

**Why**: every `encrypts ...` declaration on `Person` / `User` (added in Wave 2 Commit 2) reads from `Rails.application.config.active_record.encryption.*`, which Rails populates from credentials. If prod boots without those keys, every encrypted-column read or write raises — onboarding is dead. Dev and test ship with shared dev-only keys (committed in per-environment credentials so any developer / CI run can decrypt locally); prod keys are deliberately separate and never travel through dev hands.

Reusing the dev keys in prod would also defeat the threat model — anyone with repo read access could decrypt a prod DB dump.

**Effort**: 5–10 minutes once you have `config/master.key` (or the prod master key in the deployment env). One-time.

**Origin**: Epic 2 Wave 2 Commit 1 (2026-04-28). Dev + test keys provisioned at the same time; prod deferred because prod master key was not on the dev workstation.

---

## Encrypt `Person.date_of_birth` (column-type change)

**What**: change `people.date_of_birth` from `:date` to `:string` (or `:text`) and add `encrypts :date_of_birth, deterministic: true` on the model. The model will need to round-trip the value through `Date.parse` on read and `value.iso8601` on write so existing callers keep treating it as a Date.

**Why**: Wave 2 Commit 3a left `Person.date_of_birth` plaintext because AR encryption serialises encrypted column values as JSON envelopes (`{"p":"...","h":{...}}`) which Postgres rejects when the column type is `date`. Date of birth is direct PII for an estate-planning app — leaving it plaintext at rest is unacceptable for public launch.

**Effort**: half a day. New migration (`change_column :people, :date_of_birth, :string`), model encrypts + virtual-attribute coercion, test that round-tripping works (write a Date, read a Date, assert equality), encryption-at-rest test confirming raw column is ciphertext.

**Origin**: Wave 2 Commit 3a (2026-04-29). Discovered while writing model tests — `PG::InvalidDatetimeFormat: invalid input syntax for type date` against the encrypted JSON.

---

## Active Record encryption mode audit

**What**: review every `encrypted` column and decide deterministic vs non-deterministic mode based on actual usage.

For v1 internal-testing, every encrypted column defaults to `deterministic: true` (allows querying / dedupe but is the weaker mode — vulnerable to frequency analysis with DB access). Before public launch, audit and flip to `deterministic: false` (stronger) for any column that doesn't need to be searched.

Expected outcome of audit:

| Column | Final mode | Rationale |
|---|---|---|
| `User.email_address`, `Person.email`, `Invitation.recipient_email` | deterministic | needed for unique-index lookup, dedupe, invite-match |
| `Person.phone`, `Invitation.recipient_phone` | non-deterministic | not searched directly |
| Names (`first_name`, `middle_names`, `last_name`) | non-deterministic | privacy; no unique-by-name semantics |
| `date_of_birth` | non-deterministic | privacy |
| Address fields | non-deterministic | privacy |
| Account / policy / sort numbers | non-deterministic | high-sensitivity PII |

Re-encryption migration runs once: load all rows, decrypt with old config, re-encrypt with new config, save.

**Why**: deterministic encryption is the weaker AR encryption mode. For an estate-planning app holding wills, DOBs, account numbers, and health-relevant data (disability, capacity), the threat model on a future production breach is non-trivial. Defaulting deterministic is fine for dev/internal-testing where data is fictional, but going public with deterministic-everywhere would be a privacy regression vs the stronger mode.

**Effort**: 30 min audit + 1 hour migration + integration test verifying decrypted reads still work.

**Origin**: ERD CTO review 2026-04-27. Deferred per "make all deterministic in dev, lock down before golive" call.

---

## Audit trail (paper_trail or equivalent) for legal-significance documents

**What**: introduce versioned change history on tables holding legally-meaningful data:
- `Will`, `Bequest`, `BequestAllocation`, `WillResidueAllocation`
- `Asset` and all 12 delegated children
- `Marriage`, `Parentage`, `Guardianship`, `WillExecutor`, `WillWitness`
- `Trust` and role joins (when Trust epic activates)

Likely implementation: `paper_trail` gem with `has_paper_trail` on each model. Stores a `versions` table with full row snapshots + who/when changes happened.

**Why**: estate-planning documents are legal artefacts. "Bob says I left him 20% but the will shows 10% — what changed and when?" must have a clean answer for any user complaint, dispute, or legal proceeding. Without an audit trail this becomes unanswerable.

**Effort**: half-day setup (gem add, migration, decorate models). Plus retro-fill question: do we backfill versions for rows created before the audit ships, or accept that pre-audit rows have no history? Recommendation: accept no-history for pre-audit rows, document that.

**Origin**: ERD CTO review 2026-04-27. Mandatory before public launch; not blocking for internal testing.

---

## Cascade-delete integration test (GDPR right-to-erasure readiness)

**What**: one Capybara/RSpec integration test that:
1. Builds a fully-populated `User` (will-maker `Person` + spouse + N children + `Marriage` + N `Parentage` + `Will` + `Bequest` + `BequestAllocation` + N `Asset` + delegated asset rows + `AssetPhoto` Active Storage attachments + `Invitation`s sent + `BeneficiaryGroup`s + `Trust` + role joins + `Business`).
2. Calls `User.destroy`.
3. Asserts every domain table has zero rows referencing that user.
4. Asserts Active Storage blobs in S3/disk are removed.
5. Asserts polymorphic associations (`BequestAllocation`, `WillResidueAllocation`) cleaned.

**Why**: GDPR Article 17 right-to-erasure mandates complete deletion on request. Without this test, a single missing `dependent: :destroy` on a model association leaves dangling PII rows after a "delete my account" request — direct GDPR violation. Easy to break with one sloppy migration.

**Effort**: 1 day. Plus fixing whatever the test surfaces (likely 1-2 missing cascade-delete declarations).

**Origin**: ERD CTO review 2026-04-27, deferred from Epic 2 v1 per Elon scope challenge — internal testers won't trigger right-to-erasure, so it's launch readiness, not Epic 2 finish.

---

## Soft-delete consistency (`paranoia` or `deleted_at` everywhere)

**What**: introduce a uniform soft-delete pattern across all domain tables, replacing the current mix of hard-delete and ad-hoc `is_active` flags.

Likely implementation: `paranoia` gem (or hand-rolled `acts_as_paranoid` equivalent), adds `deleted_at` column to every domain table, default scope excludes soft-deleted rows, hard-delete remains available via `.really_destroy!`.

Tables affected: `Person`, `Marriage`, `Parentage`, `Will`, `WillExecutor`, `WillWitness`, `Guardianship`, `Invitation`, `Asset`, all 12 delegate types, `Bequest`, `BequestAllocation`, `WillResidueAllocation`, `BeneficiaryGroup`, `Trust`, all role joins, `Business`. Auth tables (`User`, `Session`, `ApiSession`, `Device`) and `OnboardingSession` continue to hard-delete.

**Why**: estate documents change over time; users delete a beneficiary, the next month want to undo. Soft-delete + 30-day retention beats forensic data recovery. Plus: GDPR right-to-erasure overrides soft-delete with explicit hard-delete on user request — soft-delete doesn't violate GDPR if hard-delete is available.

**Effort**: 1 day (gem add, per-table migration adding `deleted_at`, model decoration, default-scope tests).

**Origin**: ERD CTO review 2026-04-27. Particularly valuable for early-release / private-beta where users will make mistakes and want undo.
