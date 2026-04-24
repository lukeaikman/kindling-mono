# Phase I — Push notifications (v1: plumbing)

> **Scope**: capture permission, register with APNs, POST the device token to Rails, store it. No actual sends. When product decides triggers, v2 adds the APNs sender and delivery pipeline.

## What ships (v1, this branch)

**Rails:**
- `Device` model — `belongs_to :onboarding_session, optional: true; belongs_to :user, optional: true; unique on :apns_token`. Supports device-first lifecycle: the token lives across anonymous → authenticated session transitions.
- `POST /mobile/devices` — upserts by `apns_token`. 201 on success, 422 on validation fail (e.g. unknown platform), 400 on missing params. Session-cookie auth (same as the rest of the mobile namespace). CSRF skipped on this endpoint because Swift posts from `URLSession`, not a form.
- Request specs — 5 cases (fresh register, token rotation, anonymous register, invalid platform, missing param).

**iOS:**
- `PushComponent.swift` — `BridgeComponent` named `"push"`. Handles `request-permission` event → calls `PushRegistration.requestAuthorizationAndRegister()`.
- `PushRegistration.swift` — two statics: one triggers the system permission prompt + APNs registration; the other forwards the token to `POST /mobile/devices` via `URLSession.shared` (cookie jar is shared with WKWebView, so the onboarding session cookie rides along).
- `AppDelegate.didRegisterForRemoteNotificationsWithDeviceToken` → forwards to `PushRegistration.deliverToken`.
- Registration of `PushComponent` alongside the existing `DatePickerComponent` + `HapticsComponent`.

**Rails ERB + JS:**
- `push_permission_controller.js` — `BridgeComponent`, component `"push"`. Sends `request-permission` on element click. Silent in browser.
- `mobile/startup/intro.html.erb` — the "Create your will and estate plan" button carries `data-controller="haptic push-permission"`. Two controllers on one button: haptic fires on every tap, push-permission fires only in the shell. Tapping triggers the system permission prompt at the moment the user commits to the flow — a product-natural prompt-with-context (Apple's guideline).

## Decisions pinned

1. **Permission timing** — at tap on "Create will and estate plan". User has just committed to the flow; notification value is "we'll remind you to finish" or "your plan is ready." Apple rejects apps that prompt at app launch without context.
2. **Token storage** — standalone `Device` model. Tokens belong to devices, not sessions or users. Upsert by token (APNs tokens rotate on reinstall / device restore).
3. **Endpoint** — `POST /mobile/devices` under the existing mobile namespace. Session-cookie auth (WKWebView shares the jar with `URLSession.shared`). RESTful `resources :devices, only: :create`.
4. **Deep-link on tap** — deferred. When sends land, notification payload will carry a `url` field. Tap handler calls `Navigator.route(url)` — same primitive Phase E's UL work will eventually use.

## Out of scope (v2 later)

- The APNs sender. Rails doesn't currently hold p8 credentials or have an APNs client gem. When product defines triggers, v2 adds:
  - Rails credentials: `apns_team_id`, `apns_key_id`, `apns_p8_key`.
  - Gem / HTTP client for APNs (candidates: `apnotic`, `rpush`, or raw `httpx` + JWT signing).
  - Trigger logic: background job fires sends based on product rules.
- Rich payloads, action buttons, image attachments.
- Silent background push (`content-available: 1`) for data sync.
- Badge count management.
- Android / FCM. Separate provider, separate wiring.

## Commit strategy

Two commits on `mobile-phase-i`:

1. **Agent commit**: all Rails + iOS source + JS + ERB changes + this plan. Rails tests green. Xcode build broken until commit 2 adds two new Swift files + enables Push Notifications capability.

2. **User Xcode commit**:
   - Apple Developer portal — create APNs auth key (p8) for the Team ID + Bundle ID `app.kindling.ios`. Save Key ID + download p8 file. **Stash for v2** — we don't need it to register tokens, only to send.
   - Xcode target → Signing & Capabilities → `+ Capability` → Push Notifications. Writes an entitlements file.
   - Add `ios/Kindling/PushRegistration.swift` + `ios/Kindling/Bridge/PushComponent.swift` to the Kindling target.
   - Build on device, test: tap intro CTA → permission prompt appears → grant → APNs registers → Rails console shows a `Device.count` increment.

## Device verification

1. Build + run on physical iPhone via ngrok/LT tunnel (Phase G's dev origin chooser).
2. On the intro screen, tap "Create your will and estate plan."
3. iOS presents the native "Kindling would like to send you notifications" prompt.
4. Tap **Allow**.
5. `AppDelegate.didRegisterForRemoteNotificationsWithDeviceToken` fires. Xcode console logs `[PushRegistration] token registered`.
6. From Rails: `bin/rails c` → `Device.count` → expect 1 (or incremented). `Device.last.apns_token` shows the hex string.
7. Tap **Don't Allow**: no crash, no token registration, no Rails request. App continues to `/mobile/onboarding/welcome` normally.
8. Reset simulator / device state between runs to re-trigger the prompt.

## Things not to do

- **Don't request permission at app launch.** Apple rejects that. Keep it tied to the user's action.
- **Don't store the APNs key anywhere near source.** It's Rails credentials territory, v2 work.
- **Don't bake send logic into the controller.** `DevicesController#create` is register-only. Delivery is a separate concern (v2).
- **Don't introduce API tokens for this.** Session cookie is the right auth boundary. The mobile shell already has cookies via WKWebView; `URLSession.shared` picks them up.
- **Don't add Android plumbing.** Separate provider (FCM), separate phase, separate table shape probably. Kept out of scope deliberately.

## Pitfalls that apply

From `~/.claude/plans/in-this-repo-you-moonlit-lantern.md:442`:
- **Pitfall 14** — "Never expand remote config to hold secrets." APNs keys never go in path-configuration. Rails credentials only.
- **Pitfall 17** — device-only QA. Permission prompts don't behave reliably in simulator; test on hardware.
