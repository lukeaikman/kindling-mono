# Epic 3 — Registration and auth — roadmap

Tracker for sub-pieces of Epic 3. Full epic context in [NATIVE_TO_RAILS_EPICS.md](../NATIVE_TO_RAILS_EPICS.md#epic-3--registration-and-auth).

Epic 3 is **not started** in the Hotwire Native era. Auth flows will use Rails session cookies via the `WKWebView` cookie jar — no separate mobile auth client needed. The API-token endpoints scaffolded at `/api/v1/auth/*` remain dormant.

The RN-era auth plans (kindling-api Phases 4–6) are archived under [`rn-archive-ref/`](rn-archive-ref/) for reference when this epic is picked up.

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Piece ID | Title | Summary | Status |
|---|---|---|---|
| 3.0 | [ERD — Version B (target, now canonical)](01-erd-target-2026-04-27.mmd) | The canonical domain ERD (Epic 2 Wave 2 ships against this directly per v3 plan). Version A from Epic 2 is no longer in use. See [implementation notes](01-erd-target-implementation-notes-2026-04-27.md). | Active |
| 3.1 | Detailed plan | TBD when Epic 3 is picked up — covers the auth-flow polish below. The structural foundation (consolidation) is shipped as Epic 2 Wave 2. | Not started |
| 3.2 | OnboardingSession → User consolidation | **Subsumed into Epic 2 Wave 2** per v3 plan (2026-04-27). The detailed plan is at [02-piece-3-2-consolidation-detailed-plan-2026-04-27.md](02-piece-3-2-consolidation-detailed-plan-2026-04-27.md). | Subsumed (see Epic 2 Wave 2) |
| 3.3 | Register flow polish | Form UX, password strength meter, error display, accessibility audit. The plumbing (`AuthController#create` setting email + password on existing anonymous User) is in Epic 2 Wave 2. | Not started |
| 3.4 | Login flow polish | Form UX, "forgot password" link wiring, error display. The plumbing (`SessionsController` destroying anonymous User and starting authenticated session) is in Epic 2 Wave 2. | Not started |
| 3.5 | Secure-account → dashboard transition | Polish the dashboard placeholder; confirmation of successful registration. The handoff itself is in Epic 2 Wave 2. | Not started |
| 3.6 | Session refresh / offline behavior | Cached session, offline tolerance, fresh-install cleanup. | Not started |
| 3.7 | Auth error instrumentation | Request IDs surfaced to logs; refresh failures observable; anonymous-user-cannot-authenticate audit log for security forensics. | Not started |
| 3.8 | Anonymous-User cleanup job polish | The hourly cleanup job ships in Epic 2 Wave 2 ([W2.10](../epic-2-onboarding/detailed-plan-refresh-2026-04-25/08-dhh-v3-final-merged-2026-04-27.md)); Epic 3 adds metrics + alerting. | Not started |
| 3.9 | Push-notification dedup switch | Switch `Device` dedup from `vendor_id` to `(user_id, platform)`. Available immediately once Epic 2 Wave 2 ships (User exists for every Device from day one). Closes the memory note from Phase I. | Not started |

## RN archive reference

Files under `rn-archive-ref/` describe the API-side work done for the React Native app. They predate the Hotwire Native shell decision and should be read as **parity intent**, not as plans to execute as-is:

- `AUTH_PHASE_PLAN.md` — overall auth phasing (Phases 4–6 of the kindling-api project)
- `PHASE_5_PLAN.md` — login & logout
- `PHASE_6_PLAN.md` — session validation, refresh, profile retrieval

## How to use this roadmap

When Epic 3 starts, write the detailed plan first (use lplan), then break the workstream into sub-pieces and update this table.
