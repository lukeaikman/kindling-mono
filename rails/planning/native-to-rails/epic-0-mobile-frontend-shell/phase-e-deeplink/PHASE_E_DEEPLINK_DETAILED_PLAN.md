# Phase E — Deep-link handoff

> **For the agent**: this plan tells you to write eight tests and one log line. That's it. No Swift. No entitlements. No `.well-known/` route. No new module, no new model, no new controller, no new service object. If you find yourself opening Xcode, you're on the wrong plan. Read "Why we're not building Universal Links" first and believe it.

## Why we're not building Universal Links

The canonical plan scoped Phase E as Universal Links + App Site Association + Associated Domains + a delegate handler + physical-device verification. We're skipping all of it.

Universal Links only earn their keep when someone, somewhere, taps a `kindling.app` URL in Mail, Messages, or an ad creative. Today nobody does. No emails go out. No ads run. No SMS. No TestFlight audience. Building UL plumbing for zero inbound traffic is busywork dressed up as infrastructure.

It's also busywork you can't finish. UL verification requires a production domain, a real Team ID, a signed IPA on a real device. Apple's CDN fetches the AASA file and validates the signature against the installed app. None of those pieces are pinned yet. Wiring UL against placeholders produces something that looks fine on inspection and fails the first real tap.

The right time to build UL is the week before the first campaign goes out. That's not this week.

What the iOS shell already does: boots into `/mobile/open`. `StartupController#open` parses the query string, writes first-touch attribution to `OnboardingSession`, redirects. Organic cold-start works. That's the only link surface live right now.

So Phase E's job is small: close the test gaps around `/mobile/open`, log the decision so we can see it in production, and write down the deferred UL work precisely enough that someone can pick it up later without re-deriving it.

## What we ship

Three changes. One commit. Rails only.

- Eight new tests in `rails/test/controllers/mobile/startup_controller_test.rb`.
- One `Rails.logger.info` line in `rails/app/controllers/mobile/startup_controller.rb`.
- One new entry in `rails/planning/PRE_LAUNCH_TODO.md`.

Branch `mobile-phase-e`. Commit message:

```
Phase E — deep-link parity tests + startup decision log

- test/controllers/mobile/startup_controller_test.rb: +8 cases
  for the EPIC_1 §8 parity matrix.
- app/controllers/mobile/startup_controller.rb: one log line.
- rails/planning/PRE_LAUNCH_TODO.md: universal-link v2 entry.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Merge `--no-ff` to `main` when the suite is green. Don't push without a go-ahead.

## Before you touch anything

Run these and check the numbers match. If they don't, stop — the plan was written against a specific state.

```bash
wc -l rails/app/models/mobile/startup_routing.rb                        # 71
grep -c "module_function" rails/app/models/mobile/startup_routing.rb    # 1
grep -n "def open" rails/app/controllers/mobile/startup_controller.rb   # 16
grep -c "^    test " rails/test/controllers/mobile/startup_controller_test.rb  # 5
```

The five existing tests are, verbatim:

1. `"index creates an organic onboarding session and embeds the startup destination"`
2. `"open stores deep link values on the onboarding session once and redirects by first_show"`
3. `"open does not overwrite existing startup attribution"`
4. `"completion endpoints progress through startup before onboarding"`
5. `"index routes intro-complete sessions into onboarding"`

If the grep returns different tests or a different count, something moved. Report back before editing.

## The eight tests

All eight go in `rails/test/controllers/mobile/startup_controller_test.rb`, inside the existing `module Mobile; class StartupControllerTest < ActionDispatch::IntegrationTest`. Plain Rails integration tests. No helpers, no shared setup, no factories — match the style of what's already in the file.

Each test here maps to a case from EPIC_1 §8 that the current five tests don't cover. Every one is a URL someone could plausibly fire — either a marketing team's email template, or an attacker's curl. None of them are defensive theatre.

**`show_video=1` alone → video-intro.**

```ruby
test "open with show_video=1 only routes to video-intro" do
  get mobile_open_path(show_video: 1)

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal 1, onboarding_session.video_intro_version
  assert_nil onboarding_session.risk_questionnaire_version
end
```

**`show_risk_questionnaire=1` alone → risk-questionnaire.**

```ruby
test "open with show_risk_questionnaire=1 only routes to risk-questionnaire" do
  get mobile_open_path(show_risk_questionnaire: 1)

  assert_redirected_to mobile_risk_questionnaire_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal 1, onboarding_session.risk_questionnaire_version
end
```

**Both flags with `first_show=video` → video-intro.** The existing test 2 covers the `first_show=risk_questionnaire` branch; this one covers the other.

```ruby
test "open with both show flags and first_show=video routes to video-intro" do
  get mobile_open_path(show_video: 1, show_risk_questionnaire: 1, first_show: "video")

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal "video", onboarding_session.first_show
end
```

**Negative `show_video` coerces to 1.** This one matters. `parse_int_param` in the routing module deliberately turns `-2` into `1`, not `0`. A negative value must *not* be treated as "don't show the video" — that would silently skip the intro for anyone whose URL got mangled. The module's unit test covers the function; this test pins the controller wiring to the same behavior.

```ruby
test "open with negative show_video coerces to 1 and routes to video-intro" do
  get mobile_open_path(show_video: -3)

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal 1, onboarding_session.video_intro_version
end
```

**Non-numeric `show_video` coerces to 1.**

```ruby
test "open with non-numeric show_video coerces to 1 and routes to video-intro" do
  get mobile_open_path(show_video: "banana")

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal 1, onboarding_session.video_intro_version
end
```

**Garbage `first_show` falls back to video ordering.** `parse_first_show` only honors the string `"risk_questionnaire"`; everything else is `"video"`. Handy when someone drops a template var like `first_show=drop_tables` into a URL.

```ruby
test "open with unexpected first_show value defaults to video ordering" do
  get mobile_open_path(show_video: 1, show_risk_questionnaire: 1, first_show: "drop_tables")

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal "video", onboarding_session.first_show
end
```

**Empty-string params behave like absent ones.** Mail clients that stamp template variables sometimes leave `?source=&campaign=` when the variable was empty. Those should come out organic, not mis-attributed.

```ruby
test "open with empty-string params uses organic defaults" do
  get mobile_open_path(source: "", campaign: "", show_video: "", show_risk_questionnaire: "")

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal 1, onboarding_session.video_intro_version
  assert_nil onboarding_session.risk_questionnaire_version
  assert_nil onboarding_session.attribution_source
end
```

**Oversized `source` stores verbatim without crashing.** We don't truncate, we don't validate length. `attribution_source` is a plain `:string` column, it doesn't feed dynamic SQL, and ERB escapes on render. If a future change adds a length constraint, this test fails and forces the question. Until then: store what arrives.

```ruby
test "open with oversized source param persists verbatim without error" do
  big_source = "x" * 2048

  get mobile_open_path(source: big_source, show_video: 1)

  assert_redirected_to mobile_video_intro_path

  onboarding_session = OnboardingSession.find_by!(token: read_signed_cookie(:mobile_onboarding_session_token))
  assert_equal big_source, onboarding_session.attribution_source
end
```

Once all eight are in:

```bash
cd rails && bin/rails test test/controllers/mobile/startup_controller_test.rb
```

Expect `13 runs, 0 failures, 0 errors`. If anything fails, the failure is in the test, not in the controller — the controller behavior is already covered by the existing Phase A/B work and the routing module's own unit tests. Re-read `Mobile::StartupRouting` before suspecting the controller.

## The one log line

`/mobile/open` is the decision point for every cold-start attribution, organic or otherwise. Right now we can't see in production which URL turned into which destination, and when someone reports "I tapped the email link and landed on the wrong screen," we have nothing to correlate. One `Rails.logger.info` fixes that.

One line. Plain `key=value`. Greppable tag. No structured logger, no JSON, no tagged logging wrapper, no new `app/services/` file. If ops later wants structured output, that's a different conversation with a different PR.

The existing `#open` method, lines 16–36:

```ruby
def open
  if authenticated?
    redirect_to mobile_dashboard_path, allow_other_host: false
    return
  end

  if stale_authenticated_cookie?
    clear_stale_authenticated_cookie!
    redirect_to mobile_login_path, allow_other_host: false
    return
  end

  find_or_create_onboarding_session!
  touch_onboarding_session!
  onboarding_session.apply_startup_attribution!(
    params.permit(:source, :campaign, :location_id, :show_video, :show_risk_questionnaire, :first_show).to_h.symbolize_keys,
    raw_url: request.original_url
  )

  redirect_to mobile_entry_destination, allow_other_host: false
end
```

Change: capture `apply_startup_attribution!`'s return value (it's `true` when this request wrote first-touch, `false` when attribution was already set), compute the destination once, log, redirect:

```ruby
def open
  if authenticated?
    redirect_to mobile_dashboard_path, allow_other_host: false
    return
  end

  if stale_authenticated_cookie?
    clear_stale_authenticated_cookie!
    redirect_to mobile_login_path, allow_other_host: false
    return
  end

  find_or_create_onboarding_session!
  touch_onboarding_session!
  first_touch = onboarding_session.apply_startup_attribution!(
    params.permit(:source, :campaign, :location_id, :show_video, :show_risk_questionnaire, :first_show).to_h.symbolize_keys,
    raw_url: request.original_url
  )

  destination = mobile_entry_destination
  Rails.logger.info "[mobile.startup] open session=#{onboarding_session.id} first_touch=#{first_touch} source=#{onboarding_session.attribution_source.inspect} destination=#{destination}"

  redirect_to destination, allow_other_host: false
end
```

The variable is `first_touch`. Don't rename it. That's the term the data contract uses and the term the log reader will search for.

Don't log the full URL — Rails already logs `request.original_url` on every request. Don't log on the authenticated or stale-cookie branches — those are already obvious from the redirect line Rails emits. Don't log when the user is hitting `/mobile/open` on warm-start with attribution already stored — well, actually, do: `first_touch=false` is exactly the signal that tells us "they came back through the deep-link URL but we kept the original attribution." That's useful.

Run the suite:

```bash
cd rails && bin/rails test test/controllers/mobile/startup_controller_test.rb
cd rails && bin/rails test test/models/mobile/startup_routing_test.rb
cd rails && bin/rails test
```

All three green. The log line must not affect any assertion. The routing module is untouched, so its 5 tests should stay at 5 and pass.

Optional smoke test, user-run:

```bash
cd rails && bin/rails s
# Another shell:
curl -sI 'http://localhost:3000/mobile/open?source=email&campaign=welcome&show_video=1'
# Rails log should include: [mobile.startup] open session=... first_touch=true source="email" destination=/mobile/video-intro
```

## The PRE_LAUNCH_TODO entry

Append to `rails/planning/PRE_LAUNCH_TODO.md`. Match the existing file's entry format: `## Title`, `**What**`, `**Why**`, `**Effort**`, `**Origin**`. Append at the end is fine.

The content needs to be specific enough that whoever picks it up — agent or human — doesn't have to Google Apple docs or re-derive method signatures. That's the whole point of writing it down now.

```markdown
## Universal Link verification — deep-link handoff v2

**What**: wire Apple Universal Links so `kindling.app/mobile/open?...` links tapped in Mail / Messages / Safari / ad creatives open the iOS shell directly, skipping the Safari-tap-then-"Open in Kindling"-banner dance.

Four pieces. All four required together — partial wiring silently fails the first tap from a real device.

1. **Rails — AASA file.** Serve `apple-app-site-association` at `https://<prod-domain>/.well-known/apple-app-site-association`. Content-Type MUST be `application/json`. The URL MUST NOT have a file extension (no `.json` in the path). Apple's CDN fetches once at install and caches up to a week. Body:

   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         { "appID": "<TEAM_ID>.app.kindling.ios",
           "paths": ["/mobile/*"] }
       ]
     }
   }
   ```

   Add a route: `get "/.well-known/apple-app-site-association", to: "well_known#aasa"`. Controller action renders the JSON inline (from a constant or `config/well_known/aasa.json`). Public, no CSRF, no auth.

2. **Xcode — Associated Domains entitlement.** Open `ios/Kindling.xcodeproj`, target `Kindling`, Signing & Capabilities → `+ Capability` → Associated Domains. Add:
   - `applinks:kindling.app`
   - `applinks:staging.kindling.app` (if staging exists at v2 time)

   This writes a new `Kindling.entitlements` file referenced by Debug + Release build configs.

3. **AppDelegate — handler.** Add to `ios/Kindling/AppDelegate.swift`:

   ```swift
   func application(
     _ application: UIApplication,
     continue userActivity: NSUserActivity,
     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
   ) -> Bool {
     guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL else { return false }
     Navigator.shared?.route(url)
     return true
   }
   ```

   Navigator currently lives on `SceneController` as a `lazy var`. You'll need to expose it — either store it on the scene delegate and reach it from AppDelegate, or move URL handling into `SceneController`'s `scene(_:continue:)` (preferred on iOS 13+). Pick one, don't do both.

4. **Physical-device verification.** UL signatures validate against Apple's CDN-cached AASA, which means simulator cannot test this — the check passes in simulator regardless of wiring. Must be a TestFlight build or signed ad-hoc IPA on a real device, with the real domain reachable. Sequence: cold-kill Kindling → in Notes, paste `https://kindling.app/mobile/open?source=email&campaign=welcome&show_video=1` → tap → app opens directly (no Safari flash) → lands on `/mobile/video-intro`. Warm-start from the same link works identically. Repeat with attribution already stored (`first_touch=false` in the log) — destination should still respect onboarding state, not the URL params.

**Why**: deferred from Phase E v1 because no external link surface existed at that time. Gated on four prerequisites any one of which blocks real verification:
- production domain + DNS
- Apple Developer Team ID + App Store Connect record
- signed TestFlight or ad-hoc build
- physical iOS device in hand

Building UL against placeholder values produces plumbing that looks fine on inspection and fails the first real-device tap — worse than having none.

**Effort**: 1–2 days once prerequisites are met. Longer if domain/DNS/TestFlight need bootstrapping. Write as `PHASE_E2_UNIVERSAL_LINKS_DETAILED_PLAN.md` mirroring Phase C's structure when the first campaign date is set.

**Origin**: Phase E detail plan — deferred deliberately. See `rails/planning/native-to-rails/epic-0-mobile-frontend-shell/phase-e-deeplink/PHASE_E_DEEPLINK_DETAILED_PLAN.md`.
```

## Things not to do

A few specific wrong turns this plan has to pre-empt, because they're all plausible if you skim-read.

**Don't edit `Mobile::StartupRouting`.** The module is 71 lines, `module_function`, covers parse + coerce + decision in one place, and has its own unit tests. The new tests here exercise controller wiring around it. If a new test fails and your first instinct is "the module's wrong" — re-read the module source. It isn't.

**Don't add a Universal Link surface "while you're already in there."** You're not. The AASA route without the entitlement, the handler, and the device verification is worse than nothing — it produces observable success at the HTTP layer and silent failure at every tap. The v2 work is one atomic piece that ships when the prerequisites land. Not in pieces.

**Don't structured-log.** One `Rails.logger.info "[mobile.startup] ..."` with plain `key=value` text does the job. `ActiveSupport::TaggedLogging`, JSON, a log subscriber, a new module in `app/services/` — all of those are the wrong shape for what a grep needs. We'll upgrade the day an ops query needs it. Not before.

**Don't validate or truncate `source` / `campaign`.** Test 2.8 pins the store-verbatim behavior. Attribution is a marketing tag, not user-entered HTML. ERB escapes on render. The column is a plain string and doesn't feed dynamic SQL. Adding a length cap without a product reason just loses data silently.

**Don't touch iOS.** Zero Swift lines. No Xcode. No entitlements. No `Info.plist`. No new Swift files. No deletions. If you've opened Xcode, you're on the wrong plan.

**Don't rename `first_touch`.** It's the term the data contract uses. `apply_startup_attribution!` returns `true` for first-touch, `false` for repeat. Call the local anything else — `new_attribution`, `is_first`, `applied` — and the log line stops matching the mental model of whoever reads it in production.

## When to come back and write Phase E.2

When all four are true:

1. Production domain (`kindling.app` or equivalent) DNS-resolvable and Rails-served.
2. Apple Developer Team ID known, App Store Connect record exists.
3. First external-link campaign (email, SMS, ad, referral) scheduled within the next 4 weeks.
4. Physical iOS device reachable for verification.

Not earlier. UL is verification-heavy and verification only works against real infrastructure. Speculation wastes days.

## Checklist

- [ ] Verification greps in "Before you touch anything" return the expected numbers.
- [ ] Eight tests added, verbatim, to `startup_controller_test.rb`.
- [ ] `bin/rails test test/controllers/mobile/startup_controller_test.rb` → 13 runs, 0 failures.
- [ ] Log line added to `StartupController#open`, `first_touch` variable captures `apply_startup_attribution!` return.
- [ ] `bin/rails test test/controllers/mobile/startup_controller_test.rb` → still 13/0.
- [ ] `bin/rails test test/models/mobile/startup_routing_test.rb` → 5/0, module untouched.
- [ ] `bin/rails test` → full suite green.
- [ ] PRE_LAUNCH_TODO entry appended.
- [ ] One commit on `mobile-phase-e`, message from "What we ship" above.
- [ ] Hand back to user before pushing.
