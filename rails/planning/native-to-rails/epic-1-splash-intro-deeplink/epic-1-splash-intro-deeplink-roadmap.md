# Epic 1 — Splash, intro, deep-link parity — roadmap

Tracker for sub-pieces of Epic 1. Full epic context in [NATIVE_TO_RAILS_EPICS.md](../NATIVE_TO_RAILS_EPICS.md#epic-1--splash-screens-intro-behavior-and-deep-link-behavior-manipulation). Detailed plan in [EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md](EPIC_1_SPLASH_INTRO_DEEPLINK_DETAILED_PLAN.md).

Epic 1's delivery surface was effectively built *as* the verification target for shell phases A–G and I (Epic 0). It does not have its own implementation phases — every line of behavior parity lives in the `Mobile::StartupRouting` module + its specs + the screens those phases brought online.

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Piece ID | Title | Summary | Status |
|---|---|---|---|
| 1.1 | Detailed plan | Captured discovery + delivery + QA matrix for splash, intro, attribution, deep-link routing. | Shipped |
| 1.2 | `Mobile::StartupRouting` parity | Pure Ruby routing module + RSpec parity matrix mirroring RN behavior. | Shipped (delivered alongside Phase E). |
| 1.3 | Universal Link / App Link handoff | iOS Universal Links via `apple-app-site-association`. Android App Links pending Phase D shell. | iOS shipped; Android pending Phase D (deferred). |
| 1.4 | First-touch attribution + analytics | Attribution captured at `/mobile/open`; first-touch-wins; coercion + validation. | Shipped |

## How to use this roadmap

When work expands into new sub-pieces, append rows. When pieces are scoped into their own subfolders (with detailed plans), link to the subfolder from the table.
