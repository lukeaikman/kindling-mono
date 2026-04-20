# Phase A Detailed Plan — Turbo + Stimulus into the mobile bundle

> Detail-plan for Phase A of the Hotwire Native roadmap (master plan: `~/.claude/plans/in-this-repo-you-moonlit-lantern.md`). This doc is written once, executed against, and left in the repo afterwards as the historical record of how Phase A actually landed.

## Context

Phase A is the **foundation** for every subsequent phase. It adds Turbo and Stimulus to the Rails mobile bundle so that:

1. Every `/mobile/*` page navigation feels instant (Turbo Drive intercepts link clicks and form submits, fetches the next page as HTML, swaps `<body>` in place — no full browser reload).
2. The existing vanilla-JS modules can be converted to Stimulus controllers in Phase B without re-architecting the JS pipeline again.
3. The Hotwire Native shells in Phase C/D can rely on Turbo being present (they hook into Turbo's visit lifecycle to know when to push/pop the native nav stack).

**Phase A deliberately changes nothing the user can see.** Zero ERB edits. Zero CSS edits. Zero styling decisions. The screens look exactly the same before and after — they just navigate faster. Styling work is tracked separately in `HOTWIRE_MOBILE_DESIGN_AUDIT.md` and lands in Phase B+.

## Pitfalls to carry into this phase

Pulled from the master plan's Pitfalls list. These are the specific ones Phase A touches.

**Pitfall 1 — `window.location.href` bypasses Turbo.** Before we start, grep the repo for `window.location.href`, `window.location.assign`, `window.location.replace`. Any of these in the mobile JS modules will silently bypass Turbo Drive once it's installed, and the native shell in Phase C won't know a new page was navigated to. The existing `splash_redirect.js` uses `window.location.assign` — this IS the one we need to change. Note this now; fix it as part of step 6.

**Pitfall 6 — form submits must go through Turbo.** If any existing form submit handler calls `fetch()` directly or invokes `form.submit()` programmatically, the submit bypasses Turbo's lifecycle. The existing mobile forms all use standard `<%= form_with %>` or plain `<form>` + submit button, so they're fine by default. Verify during step 5's grep pass.

**Pitfall 7 — `DOMContentLoaded` fires once under Turbo Drive.** Turbo Drive doesn't reload the whole document on navigation — it swaps `<body>` in place. That means `DOMContentLoaded` fires on the initial load only. Any init code listening to `DOMContentLoaded` will NOT re-run on subsequent page visits. The existing `mobile.js` has exactly this pattern — it calls five `initXxx()` functions on `DOMContentLoaded`. In Phase A we apply the minimum-viable interim fix (add `turbo:load` as a second listener) so existing interactions keep working. Phase B replaces those init functions with Stimulus controllers, which auto-connect on every navigation without needing either event. Do not try to do Phase B's work here.

**Pitfall 16 — bridge JS must load before Turbo dispatches the first `turbo:load`.** No bridge components exist yet (Phase F adds them), but the import order we set up in Phase A has to accommodate them later. Specifically: in `app/javascript/mobile.js`, `import "@hotwired/turbo-rails"` must stay at the top. Any future bridge imports go below it. Document this in a code comment so the invariant survives future PRs.

## Git strategy

### Branch topology (current state)

```
* main                        ← working branch, all monorepo work lands here
  rails-main                  ← historical import-preservation (original Rails-only repo)
  rnative-flags               ← historical import-preservation (original RN repo)
  remotes/rails-import/main   ← remote reference, do not touch
  remotes/rnative-import/*    ← remote reference, do not touch
```

`rails-main` and `rnative-flags` are **not** feature branches — they preserve the original git histories that were merged into the monorepo. Leave them alone. All work happens on / branches off `main`.

### Phase-by-phase branching

For each Hotwire Native phase, create a dedicated feature branch off `main`, do the work, open a PR (or direct-merge if working solo), merge back, delete the branch. Rationale:

- One PR per phase = one reviewable unit with a clear before/after
- `main` is always in a shippable state between phases
- Easy revert path (revert the merge commit if a phase breaks something)
- No long-lived divergent branch that becomes painful to merge later
- Later phases can cherry-pick or rebase on main without history archaeology

### Phase A branch

```bash
git switch -c phase-a-turbo-stimulus
```

All Phase A work commits to `phase-a-turbo-stimulus`. When done, merge to main:

```bash
git switch main
git merge --no-ff phase-a-turbo-stimulus
git branch -d phase-a-turbo-stimulus
# git push origin main  # only if you're ready to publish
```

`--no-ff` preserves the phase as a single merge-commit group in history, so `git log --first-parent` gives a clean phase-by-phase view.

## Scope

### In scope (Phase A changes)

- `rails/Gemfile` — add `turbo-rails ~> 2.0` and `stimulus-rails ~> 1.3`
- `rails/Gemfile.lock` — updated by bundle
- `rails/config/importmap.rb` — pins added by installers for `@hotwired/turbo-rails` and `@hotwired/stimulus`
- `rails/app/javascript/mobile.js` — imports Turbo, starts a Stimulus application
- `rails/app/javascript/controllers/application.js` + `index.js` — generated by stimulus installer
- `rails/app/javascript/mobile/splash_redirect.js` — minor edit to not use `window.location.assign` (switch to `Turbo.visit`) — this is a Pitfall 1 fix
- Any other mobile JS module with a `DOMContentLoaded` listener — add a `turbo:load` listener next to it (interim; replaced in Phase B)
- `rails/app/views/layouts/admin.html.erb` (or wherever admin layout lives) — **verify NOT broken** by importmap changes; admin uses its own importmap bundle

### Out of scope

- ERB template changes
- CSS / stylesheet changes
- Stimulus controller conversions (Phase B)
- Any Hotwire Native SDK, iOS/Android project creation
- Any route additions
- Any path-configuration work
- Admin UI changes (admin is a separate importmap bundle named `application`, untouched)

## Steps

### 1. Create the branch

```bash
cd rails
git switch -c phase-a-turbo-stimulus
```

### 2. Pre-flight: grep for pitfall 1

```bash
# Run from monorepo root
grep -rn "window.location" rails/app/javascript/ rails/app/views/
```

Expected matches:

- `rails/app/javascript/mobile/splash_redirect.js` — `window.location.assign(destination)`

If any ERB template or other JS has `window.location.href = "…"` navigation, note it for fixing in step 6. **Do not silently leave it — Turbo installation flips it from "works but slow" to "works but native shell doesn't see the navigation."**

### 3. Add the gems

```bash
cd rails
bundle add turbo-rails stimulus-rails
```

Bundler picks the latest compatible versions. Verify `Gemfile.lock` updates and no existing gem versions shift unexpectedly.

### 4. Run the Rails installers

```bash
bin/rails turbo:install:importmap
bin/rails stimulus:install:importmap
```

These generate / modify:

- `config/importmap.rb` — adds `pin "@hotwired/turbo-rails", to: "turbo.min.js"` and `pin "@hotwired/stimulus", to: "stimulus.min.js"`, plus `pin "@hotwired/stimulus-loading"`, plus `pin_all_from "app/javascript/controllers", under: "controllers"`
- `app/javascript/controllers/application.js` — starts a Stimulus application instance
- `app/javascript/controllers/index.js` — eager-loads all controllers in `app/javascript/controllers/`
- `app/javascript/controllers/hello_controller.js` — generated sample controller (we delete this)

Inspect the generated `importmap.rb` carefully. It should now look something like:

```ruby
pin "application"
pin "mobile"
pin_all_from "app/javascript/mobile", under: "mobile"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/turbo", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
```

Delete `app/javascript/controllers/hello_controller.js` — we don't ship sample code.

### 5. Wire Turbo + Stimulus into the mobile JS entry point

Edit `app/javascript/mobile.js`. Target state:

```js
// Turbo loads before any bridge-component imports (Phase F onward depend on this).
import "@hotwired/turbo-rails"
import { Application } from "@hotwired/stimulus"

import { initChoiceGroups } from "mobile/choice_group"
import { initExtendedFamilyForm } from "mobile/extended_family_form"
import { initFamilyForm } from "mobile/family_form"
import { initPickerSheets } from "mobile/picker_sheet"
import { initSplashRedirect } from "mobile/splash_redirect"

Application.start()

document.documentElement.classList.add("js")

const runInit = () => {
  initChoiceGroups()
  initPickerSheets()
  initFamilyForm()
  initExtendedFamilyForm()
  initSplashRedirect()
}

// Interim double-listener (DOMContentLoaded + turbo:load) bridges to Phase B's
// Stimulus controller conversion. Each initXxx must be idempotent.
document.addEventListener("DOMContentLoaded", runInit)
document.addEventListener("turbo:load", runInit)
```

Key points:

- Turbo import is first (pitfall 16 invariant).
- `Application.start()` kicks off Stimulus. No controllers are registered yet — Phase B adds them under `app/javascript/controllers/`, where the installer-generated `index.js` eager-loads them automatically.
- The existing `initXxx()` calls stay as-is — interim bridge until Phase B.
- Both `DOMContentLoaded` and `turbo:load` call `runInit`. Risk: double-initialization on the very first page load. Verify each init function is idempotent during step 7 (most are; if any isn't, add a `data-initialized` guard inside it).

### 6. Fix `splash_redirect.js` (pitfall 1)

Edit `app/javascript/mobile/splash_redirect.js` to use `Turbo.visit` instead of `window.location.assign`. Current code:

```js
// before
window.location.assign(destination)
```

Target:

```js
// after
import { Turbo } from "@hotwired/turbo-rails"
// ... inside the redirect handler:
Turbo.visit(destination, { action: "replace" })
```

Why `action: "replace"`: the splash screen should not appear in the back-stack. `"replace"` swaps the current history entry rather than pushing a new one, matching the semantic of "splash hands off to intro." In Phase C this maps neatly onto the path-config rule `"presentation": "replace_root"`.

### 7. Smoke-test in the browser

```bash
bin/dev
```

Open `http://localhost:3000/mobile/open?show_video=1` in Chrome.

Verify in order:

1. **Page loads.** No JS errors in devtools console. No Rails boot errors.
2. **Turbo is live.** DevTools → Network tab → filter "Doc". Navigate splash → intro. The second navigation should be an XHR (`fetch`) fetching HTML, not a full document load. You can also see `turbo:load` events firing in the console if you add a temporary `console.log("turbo:load fired")` listener.
3. **Stimulus is live.** DevTools console → `Stimulus` should be defined and have an `Application` instance.
4. **Existing interactions still work.** Walk through one full onboarding flow: welcome → location → family → extended-family → wrap-up. Choice groups select and collapse. Picker opens and selects. Family form add/remove rows works. Back/forward browser buttons navigate.
5. **Splash handoff works.** Cold-load `/mobile/open?show_video=1` → splash renders briefly → automatically replaces with `/mobile/video-intro`. The replaced navigation should NOT add a history entry for `/mobile/open` (hitting back should go to whatever was before, not back to splash).
6. **No double-initialization bugs.** Walk onboarding and confirm that e.g. clicking a choice-group option doesn't toggle twice because both `DOMContentLoaded` and `turbo:load` fired. If it does, add a `data-initialized` guard inside `initChoiceGroups` and similar.

### 8. Run the test suite

```bash
bin/rails test
```

All existing tests must pass. If any Capybara system tests reference `page.driver.browser.navigate` or depend on full document loads, they may need small updates to accommodate Turbo. Note any that need fixing — simple ones fix here, complex ones file a follow-up note in the PR description.

### 9. Commit and merge

```bash
git add -A
git status   # verify only the files listed in "In scope" changed
git commit -m "Phase A — Turbo + Stimulus into the mobile bundle

- bundle add turbo-rails + stimulus-rails
- import Turbo + start Stimulus in app/javascript/mobile.js
- splash_redirect.js uses Turbo.visit (was window.location.assign)
- interim double-listener (DOMContentLoaded + turbo:load) bridging to
  Phase B's Stimulus controller conversion

No ERB or CSS changes — phase A is foundation only. Existing interactions
unchanged visually; navigation now uses Turbo Drive."
```

Then merge back:

```bash
git switch main
git merge --no-ff phase-a-turbo-stimulus
git branch -d phase-a-turbo-stimulus
```

Do NOT push without explicit go-ahead.

## Verification checklist (end of Phase A)

Targeted to get us to Phase B quickly. If all six pass, Phase A is done.

- [ ] `bin/rails test` — all tests pass.
- [ ] `bin/dev` starts cleanly with no errors.
- [ ] Cold-load `/mobile/open?show_video=1` → redirects to `/mobile/video-intro`. Browser back does NOT return to splash (confirms `Turbo.visit(_, { action: "replace" })` is working).
- [ ] Navigate splash → intro → video-intro. DevTools Network tab: second + third navigations are XHRs (Turbo Drive), not full document loads.
- [ ] Walk onboarding welcome → wrap-up. Choice-groups select + collapse. Picker opens + selects + closes. Family-form add/remove rows works. DevTools console shows no JS errors.
- [ ] After Turbo navigation (e.g. welcome → family → back → welcome), interactions still respond — proves the `turbo:load` listener is re-running init successfully.

Simulator smoke-test is not applicable to Phase A (iOS shell doesn't exist until Phase C). Phase A is browser-only.

## Done criteria

Phase A is complete when:

1. All verification checklist items pass.
2. The Phase A commit(s) are merged to `main`.
3. The branch `phase-a-turbo-stimulus` is deleted.

## Handoff to Phase B

After Phase A merges, Phase B begins — converting the five vanilla JS modules to Stimulus controllers. Phase B's detail plan should be written at that point (do not pre-write Phase B now; use what we learn from Phase A to inform it). Phase B replaces the interim double-listener + `initXxx` imports in `mobile.js` with Stimulus controllers registered under `app/javascript/controllers/`, which auto-connect on every navigation without needing either event listener.

Phase B is ALSO the right moment to start closing the design gap documented in `HOTWIRE_MOBILE_DESIGN_AUDIT.md`. Phase B touches ERB partials to add `data-controller` attributes anyway, so it's an efficient time to also update the CSS tokens and component styles to match the RN reference. Do not scope-creep into design work within Phase A — it's a pure-foundation commit.
