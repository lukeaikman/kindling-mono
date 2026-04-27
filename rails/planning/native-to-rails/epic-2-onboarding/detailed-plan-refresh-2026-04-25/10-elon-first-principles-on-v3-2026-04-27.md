# Elon first principles on v3 — 2026-04-27

QA found six real bugs. Now Elon strips back to physics: is v3 still solving the right problem with the simplest structure?

## What v3 actually delivers

When v3 ships:
1. Anonymous Users are first-class (no separate OnboardingSession entity).
2. Onboarding captures real Person + Parentage + Marriage rows (not JSON).
3. Family-step UX captures per-child co-parent data.
4. PII is encrypted at rest.
5. Login + register flows wired up against the unified User shape.
6. Cleanup job for abandoned anonymous Users.
7. NI users can pick their location.
8. One Capybara happy-path test.

## The first-principles question — what is this whole plan actually for?

**Stated goal**: Epic 2 ready for internal testing, Epic 3 polish to follow.

**Honest test**: would internal testers notice if Wave 2 didn't ship? Walking through:

- Anonymous-User concept (vs OnboardingSession): **invisible to testers**. Same UX.
- Person + Parentage + Marriage rows (vs JSON): **invisible to testers**. Same UX.
- Per-child co-parent UX: **visible to testers** — they see new questions during the family step. New product surface.
- Encryption: **invisible**. No UX change.
- Login/register flows wired against unified shape: **invisible**. Same UX as if they were wired against OnboardingSession.
- Cleanup job: **invisible**. Backend cron.
- NI in location: **visible** to NI testers. Tiny.
- Capybara test: **invisible**. CI infrastructure.

So of v3's 9 days, **only ~2.5 days are user-visible**: the per-child co-parent UX (2 days) and NI (5 minutes). The other 6.5 days are architecture work that has zero impact on what testers see.

## Elon's question

**Could we ship Wave 1 + the per-child co-parent UX + NI alone, and defer everything else?**

That's a v3-lite. ~3 days total. Internal testers get the new UX surface; the architecture stays as-is until later.

**The cost of v3-lite**: the architecture stays unfortunate. OnboardingSession entity remains. Person + Parentage rows don't exist; children are still JSON. Encryption isn't applied. Login/register flows wire against OnboardingSession, then have to be rewritten when consolidation happens.

**The cost of v3 (full)**: 9 days of work where most of it is invisible to testers.

Elon's instinct: **defer the architecture work**. Ship the user-visible stuff. Architecture migrations cost the same in 3 months as today; user feedback only happens when users see the surface.

## But — counter-arguments

### CA1. Wave 2 is the bedrock for everything else

If we defer Wave 2, everything Epic 3 onwards ships against the OnboardingSession-backed schema. Then when consolidation happens, **Epic 3+'s code has to be rewritten too**. The longer we wait, the more code we rewrite.

This is the standard "shift refactoring left" argument. Doing it now is cheaper than doing it after Epics 3, 4, 5 have layered on top.

### CA2. The user-visible features need the architecture

The per-child co-parent UX needs Parentage rows to record the data. Can't capture "Sarah is biologically Alice's parent" in JSON without designing a JSON-shape that mirrors the table-shape. We'd be designing the schema in JSON, then re-designing it in tables later. Zero saving.

### CA3. We've been planning for 4 conversation hours

The planning effort has surfaced + resolved many subtle issues. Throwing v3 away now wastes that.

This isn't an Elon argument — Elon would say "throw away anything that doesn't serve the goal." But pragmatically, the team has bought into the design.

## Elon's harder questions

### E1. Does Wave 2 actually need 9 days, or is it inflated?

QA pass 3 added ~6 hours. So Wave 2 is now ~10 days. That's a substantial single push.

**Could Wave 2 split into independently-shippable sub-waves?** Looking at the workstreams:

- **Sub-wave A** (3 days): Schema migrations (W2.1) + AR encryption (W2.2). No code change visible to users. Internal test: cold-start the app, verify it works, encryption is applied. Ship.
- **Sub-wave B** (3 days): User model refactor (W2.3) + BaseController (W2.4) + OnboardingController (W2.5) + cleanup job (W2.10) + login warning UX (W2.9). Now the app uses anonymous Users instead of OnboardingSessions. Internal test: complete an onboarding flow start to finish. Ship.
- **Sub-wave C** (2 days): SessionsController (W2.6) + AuthController (W2.7) + Will-from-day-one. Login + register work. Ship.
- **Sub-wave D** (2 days): Family-step UX expansion (W2.8) + tests (W2.12). The user-visible feature lands. Ship.

Each sub-wave is independently testable. Failure in any one doesn't block the others. Net effort same; risk lower.

**Elon's call**: yes, split. Especially because earlier sub-waves are pure infrastructure (no UX risk) and can ship faster than later ones.

### E2. Is "anonymous User from day one" actually simpler than two-stage promotion?

User row exists for every visitor. Will row exists for every visitor. Cleanup runs hourly. We're committing every visit to durable DB writes.

Alternative simpler architecture: **don't materialize anything until the user crosses a threshold** (e.g., completes welcome step). Pre-welcome, the app is just a marketing page. No DB writes.

This is actually simpler and aligns with how most marketing-driven apps work. The cost: the welcome step has to do "finalize this draft" work — but only once per real user.

**Elon's instinct**: this is cleaner than v3's "every visit creates a User." Fewer DB writes, less bot pressure, simpler mental model.

**But**: requires a UX shift. Currently `/mobile/intro` is part of the onboarding flow with attribution capture. Marketing data needs to be captured BEFORE the welcome step. So either:
- Marketing pages (intro, video-intro, risk-questionnaire) use a separate lightweight cookie + attribution mechanism that doesn't create User rows.
- OR User row IS created at the welcome step, and pre-welcome data lives in cookies / signed tokens.

**Elon's harder call**: rebuild the early-onboarding capture without Users. Significant change to v3. Maybe defer this critique to v5.

QA's Q2 fix (only create User on meaningful action) is the **first half** of this — block User creation on marketing-page visits. Going further (no User at all until welcome step submits) is the **full version**.

### E3. Will-from-day-one is over-eager

If User-from-day-one is questionable, Will-from-day-one is more so. The Will row is created via callback — for every visitor, including bots, including users who never reach welcome step.

The justification was "downstream code can rely on User.draft_will being non-nil." But that justification only matters when downstream code exists (Epic 4+).

**Elon's call**: defer Will creation. Create the Will when the user starts will-drafting (Epic 4). For Epic 2, no Wills are created.

Cost: trivial. v3's `User.after_create :create_initial_will` callback gets dropped. Wills table can be created in Epic 4 instead of Epic 2.

**Reverses the Will-from-day-one decision the user just made.** Worth raising.

### E4. The Stimulus + window.confirm login warning is ugly

`window.confirm()` is a native browser dialog. Inconsistent with the app's design language. Modern apps would use an inline modal.

Counter: zero cost. Functional. Modal would be 50+ lines of code for a feature that fires only on a rare edge case.

**Elon's call**: keep window.confirm. Pragmatic. Polish to inline modal in Epic 3 if user feedback says so.

### E5. The 12-workstream Wave 2 is a CI nightmare

If each workstream is its own commit, the deploy pipeline has 12 commits to land in order. Any one breaking blocks the rest. CI runs each commit + the chain.

**Elon's call**: bundle related workstreams into 4-5 commits, not 12. E.g.:
- Commit 1: All schema migrations (W2.1) + encryption (W2.2). Atomic schema change.
- Commit 2: User model + BaseController refactor (W2.3 + W2.4). Atomic auth-flow plumbing.
- Commit 3: OnboardingController + family-step UX expansion (W2.5 + W2.8). Atomic onboarding-flow change.
- Commit 4: Sessions + Auth controllers + login warning (W2.6 + W2.7 + W2.9). Atomic registration plumbing.
- Commit 5: Cleanup job + tests (W2.10 + W2.12). Atomic infra.

5 commits, not 12. Each commit is a logically-coherent unit. Reviewable. Deployable.

## What Elon would push DHH to change in v4

| Change | Reason |
|---|---|
| Adopt all 6 QA-pass-3 ship-bug fixes (Q1-Q4, Q6-Q7) | Real bugs |
| Adopt Q11, Q12 (encryption + cookie tests) | Test coverage gaps |
| Defer Q14 (Will-from-day-one): drop the after_create callback; create Will only when needed | Wasted DB rows for non-completing users |
| Defer per-child co-parent UX **iff** the user explicitly wants v3-lite | (Probably not — user has signed off on this feature) |
| Split Wave 2 into 4-5 atomic commits, not 12 | CI / deployability |
| Implement Q2 fix at the `requires_user!` level | DB pressure under bot traffic |

## What Elon affirms in v3

- Children-as-records refactor (deferring to JSON would just push the work)
- Encryption (cheap to do now, expensive to defer)
- The Person + Parentage + Marriage shape is correct
- Wave 1 / Wave 2 split is correct
- The unified anonymous-User-from-day-one architecture is correct **if** Q2 (don't materialize on marketing-page visits) is also adopted

## E3 specifically — should we revisit Will-from-day-one?

The user just confirmed Will-from-day-one yesterday. Reversing now feels like backtracking. But Elon's argument is real: a Will row for every visitor is wasted.

**Mitigating fact**: with QA Q2 in place (User only created on meaningful action), Will-from-day-one means "every onboarding-engaged user has a Will." That's reasonable — onboarding-engaged users are likely to need a Will eventually.

So if we ALSO adopt Q2, Will-from-day-one isn't "every visitor" anymore — it's "every onboarding-engaged user." Acceptable.

**Elon's revised call**: keep Will-from-day-one IF we adopt Q2. The combination is acceptable.

## Net effort with Elon refinements

- Q1-Q4, Q6-Q7, Q11, Q12 fixes: +0.75 day (from QA pass 3 estimate)
- Q2 (controller filter): already counted
- Wave 2 commit consolidation: free
- Sub-wave structure: free (just better packaging of same work)

**Total**: ~10 days for Wave 2.

Plus Wave 1: 1 day.

**Total Epic 2**: ~11 days.

Slightly larger than v3's 9 days, but the value-density is higher.
