# Native → Rails-Served App: Epic Breakdown (Detailed Discovery + Delivery Backlog)

This plan is intentionally structured for **behavior parity first** (especially trust logic), then UI migration.

---

## Epic 1 — Splash screens, intro behavior, and deep link behavior manipulation

### Goal
Reproduce app-open, first-touch attribution, splash timing, and deep-link routing exactly in the Rails-served Ionic/Capacitor shell.

### Discovery tasks
- Inventory all entry routes and startup transitions:
  - `app/index.tsx` splash entry
  - `app/open.tsx` deep-link handler
  - `app/intro.tsx` first manual branching
- Map attribution and onboarding-state storage contract in SecureStore:
  - key names, payload shape, and defaults (`kindling_attribution`, `kindling_onboarding_state`)
  - integer coercion rules for `show_video` / `show_risk_questionnaire`
  - first-touch behavior (do not overwrite existing attribution)
- Capture existing route decision table for all combinations:
  - new attribution + `first_show`
  - existing attribution + partially completed onboarding state
  - missing/invalid onboarding state fallback
- Document dev-only hidden affordances (logo taps / debug routes) and decide whether retained for internal builds only.

### Delivery tasks
- Implement Rails-hosted web entry route that mirrors splash handoff behavior.
- Implement Capacitor deep-link bridge + parser preserving current URL param semantics.
- Implement secure client-side persistence for attribution + onboarding state (web equivalent of SecureStore strategy).
- Port routing decision engine to a tested pure module.
- Add analytics hooks for `open`, deep-link source/campaign capture, and first destination chosen.
- Add kill-switch/feature flag for routing experiments without changing deep-link contract.

### QA / parity matrix
- Cold start with no attribution.
- Deep-link open with full params.
- Deep-link open with invalid numeric params.
- Repeat open after onboarding partially completed.
- Repeat open after onboarding fully completed.
- Offline open behavior.

---

## Epic 2 — Onboarding

### Goal
Migrate all onboarding steps with parity in conditional questions, relationship semantics, data writes, and progression.

### Discovery tasks
- Build canonical spec for each step:
  1) `onboarding/welcome` (identity + DOB + age warnings)
  2) `onboarding/location` (residency/domicile questions)
  3) `onboarding/family` (relationship status, spouse/partner, children, guardian defaults, co-guardians)
  4) `onboarding/extended-family` (parents/siblings capture currently mostly informational)
  5) `onboarding/wrap-up` (transition to account security)
- Identify where onboarding writes durable domain state vs temporary collection only.
- Extract child/spouse/relationship transformation rules and defaulting behavior into testable functions.
- Catalogue all branching conditions and pre-population rules:
  - spouse and child surname prefill behavior
  - auto-add first child behavior
  - partner-dependent guardian defaults
- Confirm relationship edge creation/migration expectations against `relationshipActions` and `useAppState` migrations.

### Delivery tasks
- Create Rails API endpoints for onboarding payloads (idempotent and resumable).
- Build Ionic onboarding wizard pages with route guards and step resume.
- Port validation + conditional visibility logic into shared TS domain package (no UI-coupled rules).
- Add explicit data model fields for currently TODO/non-persisted onboarding data where product wants retention.
- Implement autosave + draft-resume for each onboarding step.
- Ensure all onboarding writes are scoped to active will-maker namespace/session.

### QA / parity matrix
- Fresh onboarding, complete path.
- Mid-flow reload/resume.
- Partner path vs no-partner path.
- Children/no-children path.
- Edge ages (under 18, over 90 warning).
- Back/forward navigation without data loss.

---

## Epic 3 — Registration and auth

### Goal
Preserve current auth UX and offline safeguards while moving session authority to Rails APIs.

### Discovery tasks
- Document every auth entry point and divergence:
  - `auth/register`
  - `auth/login`
  - `auth/secure-account` (onboarding-completion gated flow)
- Map `useAuth` lifecycle in detail:
  - token persistence keys
  - fresh install cleanup behavior
  - scope/namespace loading behavior
  - session validation/refresh fallback behavior when offline
- Confirm network state dependencies and manual connectivity override behavior.
- Extract exact profile-writeback behavior to local will-maker record (`serverId`, email).
- Define expected behavior for biometric toggle and device metadata in web/cap context.

### Delivery tasks
- Implement final Rails auth endpoints contract parity (validate-email, register, login, validate, refresh, logout, profile).
- Introduce shared auth client usable by Ionic app (browser + native wrapper).
- Implement secure token storage strategy for web + capacitor (with clear threat model).
- Recreate fresh-install/stale credential cleanup semantics in new platform constraints.
- Preserve onboarding-to-auth handoff (secure-account route) and post-auth route outcomes.
- Instrument auth errors and refresh failures with request IDs surfaced to logs.

### QA / parity matrix
- Register success/failure.
- Login success/failure.
- Expired access token + refresh success/failure.
- Offline with cached session.
- Offline without cached session.
- Namespace loading after login for existing user.

---

## Epic 4 — Dashboard and “Your People”

### Goal
Migrate progression engine + stage cards + “Your People” flows without breaking legal-flow gating.

### Discovery tasks
- Produce definitive progression specification from `willProgress.ts`:
  - `deriveYourPeopleStatus`, `getNextYourPeopleRoute`, `getNextRoute`, CTA label logic
  - stage completion dependencies (guardians → residue → executors → invitations)
- Inventory all dependent screens and flows:
  - will dashboard (`will-dashboard.tsx`)
  - people summary (`people/summary.tsx`)
  - guardianship intro/wishes
  - estate remainder who/split
  - executors intro/selection/professional
  - invitations confirm
- Extract invitation acceptance semantics for executors + guardians.
- Confirm regressions behavior: if a complete stage becomes incomplete after edit, CTA should route to repair path.
- Document required sentence-generation parity for summary cards and status messaging.

### Delivery tasks
- Move progression and CTA logic into a shared, fully unit-tested rules package.
- Build Rails-backed endpoints for guardianship assignments, executor roles/status, invitations, residue split state, beneficiary groups.
- Recreate dashboard stage card states and disabled/future gating exactly.
- Recreate people-summary narrative rendering and edit deep-links.
- Add regression tests for every stage-gating permutation.
- Add audit logging for legally meaningful transitions (executor/guardian assignment changes).

### QA / parity matrix
- No children vs children path.
- Guardians incomplete/complete permutations.
- Residue incomplete/complete permutations.
- Executors selected/invited/accepted permutations.
- Post-complete regression path routing.

---

## Epic 5 — Asset Entry (by asset type, one by one)

### Goal
Migrate estate/asset CRUD with category completeness semantics and trust-sensitive logic preserved.

### 5.0 Shared estate infrastructure (must be done before each type)
- Port category model + ordering + selected/completed semantics.
- Port estate net/gross/trust valuation logic.
- Port category completion tracking (`categoryStatus.completedAt`) semantics.
- Port draft autosave strategy (`useDraftAutoSave`) and unsaved-change recovery pattern.
- Create common asset-entry framework for:
  - edit vs create mode
  - beneficiary selection (person + group)
  - percentage validation
  - value known/unknown patterns
  - toast/feedback deltas for net worth changes

### 5.1 Property (highest risk)
- Deep-spec all conditional branches in:
  - `property/entry.tsx`
  - `property/trust-details.tsx`
  - `property/trustDataMapping.ts`
- Extract and freeze trust mapping rules to pure TS tests before UI migration.
- Port occupancy/mortgage/net-value/trust-transfer interplay.
- Add exhaustive scenario matrix tests per trust type + user role + creation timing.

### 5.2 Bank accounts
- Port account type + institution handling.
- Preserve “not sure” valuation behavior.
- Confirm mapping quirks where investment handling appears in bank flow and normalize safely.

### 5.3 Investments
- Port beneficiary allocation including zero-percent detection/confirmation flows.
- Preserve provider + value capture + percentage validation.
- Ensure beneficiary groups interop exactly.

### 5.4 Pensions
- Preserve nomination logic (`beneficiaryNominated` yes/no/not-sure).
- Preserve conditional requirement of beneficiaries only when nomination = yes.
- Retain special “outside estate / trust-like” explanatory behavior.

### 5.5 Life insurance
- Preserve held-in-trust conditional UI and beneficiary section gating.
- Preserve allocation mode behavior and clearing behavior when trust status changes.

### 5.6 Private company shares
- Preserve ownership mode behavior (percentage vs share count).
- Preserve qualifying conditions (active trading, holding period, holding company questions).
- Preserve beneficiary allocation and validations.

### 5.7 Assets held through business
- Preserve business linkage dependency and conditional validations.
- Preserve unknown-value handling and category completion rules.

### 5.8 Agricultural assets
- Port agricultural-specific fields + tax-relevant conditionals.
- Confirm net value impact and category completion behavior.

### 5.9 Important items
- Port item-level beneficiary assignment with mixed person/group selection.
- Preserve value capture and completion logic.

### 5.10 Crypto currency
- Port platform + wallet/account details + unknown-value behavior.
- Preserve category completion and valuation inclusion/exclusion rules.

### Cross-cutting acceptance for every asset type
- Create/edit/delete parity.
- Draft restore/discard parity.
- Validation parity.
- Beneficiary/group parity.
- Net value update parity.
- Category completion timestamp parity.

---

## Trust Logic Protection Track (parallel to all epics)

Because trust logic is the major risk, run this parallel track from day one:

- Build a “golden scenario” catalog for trust/property and estate remainder behaviors.
- Snapshot expected state transitions from current TypeScript rules.
- Create contract tests that run against both current native rules and new shared rules.
- Require parity test pass before each migrated screen is accepted.
- Add legal-signoff checkpoints for trust-related rule changes.

---

## Why this decomposition is Rails-friendly

- Most non-trust areas are CRUD + workflow-gating and are good Rails API + web UI candidates.
- The non-negotiable is to **extract and lock trust/progression rules first**, then re-render UI.
- This keeps Rails as system-of-record without rewriting legal logic blindly in templates/controllers.
