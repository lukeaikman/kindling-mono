# Why Phase D (Android shell) is deferred

**Deferred**: 2026-04-20 (decision baked into the original MOBILE_FRONTEND_PLAN at sequencing time).

## Reasoning

Phase C (iOS shell) is gated to ship to TestFlight and validate with real users *before* Android starts. The plan's own words: cycle-time and debug-time both halve when only one shell is in production at a time. We learn what matters on iOS, then apply those learnings on Android instead of debugging two shells in parallel against the same evolving Rails surface.

## What's required to un-defer

1. iOS shell shipped to TestFlight and used by real users.
2. Lessons-learned doc captured (path-config edge cases, bridge component patterns that survived contact with reality, anything that needs to change in the canonical pattern).
3. Then create `kindling-monorepo/android/` from the hotwire-native-android demo, port `RemoteConfigStore` to Kotlin (mirroring the Swift implementation), bundle the same `path-configuration.json` byte-identically, and walk the Phase C verification matrix on the Android emulator.

## Picked-up procedure

1. Drop the `-deferred` suffix from this folder.
2. Move this `why-deferred.md` to `archived/why-deferred-2026-04-20.md` inside the same folder for historical record.
3. Update [Epic 0 roadmap](../epic-0-mobile-frontend-shell-roadmap.md) status to `Planning` or `In progress`.
4. Run `/lplan` to write the detailed Phase D plan.
