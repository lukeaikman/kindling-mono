# Epic 2 — Onboarding — roadmap

Tracker for sub-pieces of Epic 2. Full epic context in [NATIVE_TO_RAILS_EPICS.md](../NATIVE_TO_RAILS_EPICS.md#epic-2--onboarding). Detailed plan in [EPIC_2_ONBOARDING_DETAILED_PLAN.md](EPIC_2_ONBOARDING_DETAILED_PLAN.md).

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Piece ID | Title | Summary | Status |
|---|---|---|---|
| 2.1 | Detailed plan (RN-era) | Discovery + delivery + QA matrix for welcome → location → family → extended-family → wrap-up. | Shipped (superseded once 2.1a lands) |
| 2.1a | [Plan refresh — 2026-04-25](detailed-plan-refresh-2026-04-25/) | lplan refinement of 2.1. Final output: [11-dhh-v4-final-2026-04-27.md](detailed-plan-refresh-2026-04-25/11-dhh-v4-final-2026-04-27.md) — supersedes v3. v4 ran v3 through fresh QA + Elon first-principles passes; folds in 8 fixes (cookie security via token_digest, deferred User creation on marketing pages, email normalisation, numericality validation, encryption-at-rest test, server-side login-warning backup) and packages Wave 2 as 5 atomic commits. | In progress |
| 2.1b | [ERD](../epic-3-auth/01-erd-target-2026-04-27.mmd) | Canonical domain ERD = Epic 3's Version B (unified shape). v3 ships against this directly; the transitional Version A ERD is no longer in use. | Planning |
| 2.10 | Wave 1 — internal-testing unblock | Family-form conditional-reveal bug fix + NI added to location step + 1 Capybara happy-path test. ~1 day. Shipped 2026-04-27 in commits `b5fc414` (NI) and `00f723f` (bug fix + Capybara setup + tests). | **Shipped** |
| 2.11 | Wave 2 — unified-shape ship | Schema migrations (drop OnboardingSession, add Person/Parentage/Marriage/Will) + AR encryption + family-step UX expansion (per-child co-parent + person-picker) + login flow + register/secure-account flow + cleanup job + login warning UX + tests. ~9 days. Ships after Wave 1. **Subsumes Epic 3 piece 3.2** (consolidation). | In progress |
| 2.11a | Commit 1 — schema migrations + encryption setup | 7 additive migrations land (`040ac9e`); per-environment AR encryption keys for dev + test (`0b2dc83`); production-keys-on-launch tracked in PRE_LAUNCH_TODO. | **Shipped 2026-04-28** |
| 2.11b | Commit 2 — User model + Person/Marriage/Parentage/Will + BaseController + cleanup job | Anonymous-from-day-one User, encrypts email_address, will-from-day-one, Mobile::BaseController extended with current_user / requires_user! / cleanup_stale_user!, AbandonedAnonymousUserCleanupJob. (`824bb7b`) | **Shipped 2026-04-28** |
| 2.11c | [Commit 3 — OnboardingController refactor onto current_user](commit-3-onboarding-refactor-2026-04-29/) | lplanned 2026-04-29. Final spec: [06-dhh-v2-final.md](commit-3-onboarding-refactor-2026-04-29/06-dhh-v2-final.md). 2 sub-commits: 3a trivial steps + summary_facts, 3b family step (Marriage/Parentage orchestration). ~3 days. | Planning |
| 2.11d | Commit 4 — Sessions + Auth controllers + login warning UX | Cookie cutover at registration (Q12), login-warning Stimulus + server-side backup (Q8), rate-limited authentication. Per v4 plan §Commit 4. ~1.5 days. | Not started |
| 2.11e | Commit 5 — drop onboarding_sessions table + verification | Migration 8 (drop legacy table); cleanup of dead BaseController code; verification tests (encryption-at-rest, cookie cutover, anonymous-User-not-on-marketing-page). ~1.5 days. | Not started |
| 2.2 | Welcome step | Identity + DOB + age warnings. | Audit needed |
| 2.3 | Location step | Residency / domicile questions. | Audit needed |
| 2.4 | Family step | Relationship status, spouse/partner, children, guardian defaults, co-guardians. | Audit needed |
| 2.5 | Extended-family step | Parents/siblings (informational). | Audit needed |
| 2.6 | Wrap-up step | Transition to account security. | Audit needed |
| 2.7 | Autosave + draft-resume | Idempotent + resumable per step. | Audit needed |
| 2.8 | Conditional-visibility shared module | Validation + visibility rules in pure Ruby/JS, decoupled from views. | Audit needed |
| 2.9 | Cascade-delete integration test | Moved to [PRE_LAUNCH_TODO](../../PRE_LAUNCH_TODO.md) per Elon scope challenge — GDPR right-to-erasure readiness, not internal-testing readiness. | Deferred (PRE_LAUNCH) |

> **Audit pending**: rows 2.2–2.8 carry `Audit needed` because shipped status across these substeps wasn't part of the lplan reorg context. First action when picking up Epic 2 is to walk the codebase and replace `Audit needed` with the real status.

## How to use this roadmap

Update the table whenever a piece changes status. When a piece grows into a substantial workstream, give it its own subfolder with a detailed plan.
