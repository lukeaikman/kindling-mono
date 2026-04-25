# Epic 0 — Mobile frontend shell — roadmap

Tracker for the Hotwire Native shell phases. The full roadmap narrative is in [MOBILE_FRONTEND_PLAN.md](MOBILE_FRONTEND_PLAN.md); each phase's detailed plan lives in its own subfolder.

**Status values**: `Not started`, `Planning`, `In progress`, `Shipped`, `Deferred`.

| Phase ID | Title | Summary | Status |
|---|---|---|---|
| A | [Turbo + Stimulus](phase-a-turbo-stimulus/) | Add `turbo-rails` + `stimulus-rails` gems and importmap wiring. Every mobile page gets Turbo Drive navigation. No ERB changes. | Shipped |
| B | [Stimulus controllers + design refresh](phase-b-stimulus-design-refresh/) | Convert vanilla JS modules to Stimulus controllers. Fold in design refresh from `mobile-ui-system` Phase A/B primitives. | Shipped |
| C | [iOS shell + path config v1](phase-c-ios-shell-path-config/) | Bare Hotwire Native iOS app loading Rails origin in a Navigator. Generalized `RemoteConfigStore` + first resource (`path_configuration`). | Shipped |
| D | [Android shell](phase-d-android-shell-deferred/) | Android equivalent of Phase C. Same path-config JSON drives behavior. | **Deferred** — see `phase-d-android-shell-deferred/why-deferred.md`. |
| E | [Deep-link / universal-link handoff](phase-e-deeplink/) | Production-quality deep-link routing into `Mobile::StartupRouting`. Universal Links / App Links. | Shipped |
| F | [Date picker bridge](phase-f-date-picker-bridge/) | First native bridge: `UIDatePicker` over a sheet. Replaces web date input on iOS. | Shipped |
| G | [Haptics + dev origin override](phase-g-haptics-and-dev-origin/) | Tiny haptics bridge (`UIImpactFeedbackGenerator`) + dev tooling for swapping the origin URL on-device. | Shipped |
| H | [Offline / error presentation](phase-h-offline-error-deferred/) | Native offline screen via Hotwire `ErrorPresenter`. Audit `Cache-Control` headers. Turbo snapshot cache leveraged. | **Deferred** — see `phase-h-offline-error-deferred/why-deferred.md`. |
| I | [Push notifications](phase-i-push-notifications/) | APNs registration, `Device` model, tap-to-open routing through `Navigator.route(url:)`. v1 plumbing only — sends come later. | Shipped |
| J | [Camera bridge](phase-j-camera-bridge-deferred/) | Native camera + library picker bridged to `<input type="file">` parity flow. | **Deferred** — see `phase-j-camera-bridge-deferred/why-deferred.md`. Will land inside Epic 5. |
| K | (RN decommission) | Removed from roadmap by design — RN simply stops being deployed once Hotwire Native reaches parity. | N/A |

## How to use this roadmap

- **Update a phase**: when status changes, update the row here in the same commit as the underlying work.
- **Defer a phase**: rename the folder with a `-deferred` suffix, add a `why-deferred.md`, set status to `Deferred`. Keep all existing planning artefacts inside.
- **Pick a phase back up**: drop the `-deferred` suffix, archive `why-deferred.md` under `archived/` inside the folder if useful, set status back to `Planning` or `In progress`.
