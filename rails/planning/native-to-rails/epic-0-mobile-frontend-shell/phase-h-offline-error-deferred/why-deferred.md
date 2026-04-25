# Why Phase H (Offline / error presentation) is deferred

**Deferred**: 2026-04-25.

## Reasoning

Phase H is polish, not plumbing. The three layers it adds (native `ErrorPresenter` for hard offline, `Cache-Control` audit, Turbo snapshot leverage) are all worth having — but none of them block any other phase or any epic from progressing.

The earlier memory note from this project records the deliberate sequencing: H runs *after* I (push) and J (camera) so that polish lands when the app is in real users' hands and we can prioritise the offline failure modes that actually bite, rather than the ones we imagine in dev.

With J now also deferred (subsumed into Epic 5), the natural slot for H is: pick up after Epic 2 stabilises, when the app is being used end-to-end and the real "what feels broken under bad network" list is short and concrete.

There is no debt accumulating here. Linear onboarding is preload-heavy, not lazy-load-heavy, so a flaky connection mid-flow is more annoying than catastrophic — and the failure mode is "screen takes a moment longer", not "data lost".

## What's required to un-defer

1. App in real users' hands (TestFlight at minimum).
2. A short, concrete list of observed offline failure modes from those users — not pre-empted from imagined scenarios.
3. The list narrows the scope: which screens get the native error VC, which `Cache-Control` headers actually matter, which Turbo snapshot behaviours are noticed.

## Picked-up procedure

1. Drop the `-deferred` suffix from this folder.
2. Move this `why-deferred.md` to `archived/why-deferred-2026-04-25.md` inside the same folder.
3. Update [Epic 0 roadmap](../epic-0-mobile-frontend-shell-roadmap.md) status to `Planning` or `In progress`.
4. Run `/lplan` to write the detailed Phase H plan, scoped to the observed failure modes.
