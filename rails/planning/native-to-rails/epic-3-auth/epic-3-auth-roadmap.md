# Epic 3 — Registration and auth — roadmap

Tracker for sub-pieces of Epic 3. Full epic context in [NATIVE_TO_RAILS_EPICS.md](../NATIVE_TO_RAILS_EPICS.md#epic-3--registration-and-auth).

Epic 3 is **not started** in the Hotwire Native era. Auth flows will use Rails session cookies via the `WKWebView` cookie jar — no separate mobile auth client needed. The API-token endpoints scaffolded at `/api/v1/auth/*` remain dormant.

The RN-era auth plans (kindling-api Phases 4–6) are archived under [`rn-archive-ref/`](rn-archive-ref/) for reference when this epic is picked up.

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Piece ID | Title | Summary | Status |
|---|---|---|---|
| 3.1 | Detailed plan | TBD when Epic 3 is picked up. Cross-reference RN-era archive for parity intent. | Not started |
| 3.2 | Register flow | Hotwire-rendered `/mobile/auth/register` with Rails session cookies. | Not started |
| 3.3 | Login flow | Hotwire-rendered `/mobile/login`. | Not started |
| 3.4 | Secure-account handoff | Onboarding → auth bridge at `/mobile/auth/secure-account`. | Not started |
| 3.5 | Session refresh / offline behavior | Cached session, offline tolerance, fresh-install cleanup. | Not started |
| 3.6 | Auth error instrumentation | Request IDs surfaced to logs; refresh failures observable. | Not started |

## RN archive reference

Files under `rn-archive-ref/` describe the API-side work done for the React Native app. They predate the Hotwire Native shell decision and should be read as **parity intent**, not as plans to execute as-is:

- `AUTH_PHASE_PLAN.md` — overall auth phasing (Phases 4–6 of the kindling-api project)
- `PHASE_5_PLAN.md` — login & logout
- `PHASE_6_PLAN.md` — session validation, refresh, profile retrieval

## How to use this roadmap

When Epic 3 starts, write the detailed plan first (use lplan), then break the workstream into sub-pieces and update this table.
