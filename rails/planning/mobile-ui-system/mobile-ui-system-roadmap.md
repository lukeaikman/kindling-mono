# mobile-ui-system roadmap

Tracker for the Rails-native mobile UI system rollout. The full plan is in [MOBILE_RAILS_UI_SYSTEM_PLAN.md](MOBILE_RAILS_UI_SYSTEM_PLAN.md). Companion docs: [MOBILE_RAILS_UI_REFERENCE.md](MOBILE_RAILS_UI_REFERENCE.md), [HOTWIRE_MOBILE_DESIGN_AUDIT.md](HOTWIRE_MOBILE_DESIGN_AUDIT.md).

This UI-system work shipped *concurrently* with the [Epic 0 mobile frontend shell](../native-to-rails/epic-0-mobile-frontend-shell/) phases — the design refresh for Phase B of the shell pulled in much of UI Phases A and B. Status here may need an audit pass to reflect what actually shipped vs the plan as written.

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`, `Audit needed`.

| Phase ID | Title | Summary | Status |
|---|---|---|---|
| A | Foundation | Add `mobile.css` + `mobile.js`, strip inline CSS from layout, full-height + sticky-footer capable layout. | Audit needed (likely shipped during shell Phases A/B) |
| B | Primitive kit | Build `ScreenHeader`, `StepProgress`, `GroupedSection`, `FormRow`, `StickyActions`, `ChoiceGroup`. | Audit needed (likely shipped during shell Phase B design refresh) |
| C | Onboarding refactor | Refactor welcome / location / family / extended-family / wrap-up to use the primitive kit. | Audit needed (overlaps Epic 2) |
| D | Startup/auth refactor | Refactor intro / video-intro / risk-questionnaire / login / secure-account. | Audit needed (overlaps Epic 1 + Epic 3) |
| E | Picker upgrade | Replace `select`-based fields with `PickerRow` + `BottomSheet`. | Shipped (delivered as shell Phase F native date picker; list-picker pivot folded in) |
| F | Polish + QA | Safe-area checks, keyboard behavior, scroll behavior, motion consistency, touch-target audit, iPhone + Android WebView QA. | Audit needed (overlaps shell Phase H — deferred) |

## How to use this roadmap

- The phase labels here are **the UI system's phases**, not the shell's. Status often depends on shell-phase or epic-level work that happened in parallel — note overlap when relevant.
- When picking up an `Audit needed` row, walk the codebase, update status, and capture any drift between plan and reality in the underlying plan doc.
- New UI-system workstreams (e.g. dark mode, accessibility audit) should be added as new rows here rather than new top-level docs.
