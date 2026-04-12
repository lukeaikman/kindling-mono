# Epic 2 Detailed Plan — Onboarding (Rails-Served Mobile, For Review)

## 1. Objective

Rebuild the React Native onboarding flow inside the Rails-served mobile surface with strict route-order and question-order parity.

This plan is intentionally opinionated in a Rails-first way:

- preserve the native product flow exactly,
- simplify the server implementation where native internals are local-state hacks rather than product requirements,
- keep the mobile experience calm, fast, and beautiful inside a Capacitor shell,
- do not invent new onboarding questions, steps, branches, or summaries unless explicitly approved.

Product-approved addition for Epic 2 review:

- each child card now also asks:
  - "Is this child disabled?"
  - "Does this child lack mental capacity?"

If there is tension between "copy the native flow" and "copy the native implementation detail", we copy the flow and make the server implementation more boring.

---

## 2. Native Source Audit

This plan is based on direct reading of the following React Native code and planning docs:

- `rnative/app/intro.tsx`
- `rnative/app/onboarding/_layout.tsx`
- `rnative/app/onboarding/welcome.tsx`
- `rnative/app/onboarding/location.tsx`
- `rnative/app/onboarding/family.tsx`
- `rnative/app/onboarding/extended-family.tsx`
- `rnative/app/onboarding/wrap-up.tsx`
- `rnative/app/auth/secure-account.tsx`
- `rnative/src/hooks/useAppState.ts`
- `rnative/src/hooks/useAuth.ts`
- `rnative/src/utils/willProgress.ts`
- `rnative/src/types/index.ts`
- `rnative/src/components/ui/Input.tsx`
- `rnative/src/components/ui/DatePicker.tsx`
- `rnative/src/components/ui/Select.tsx`
- `rnative/src/components/ui/RadioGroup.tsx`
- `rnative/planning/x-remediation-complete.md`
- `rnative/planning/ONBOARDING_IMPLEMENTATION_TASK.md`
- `rnative/planning/PHASE_1A_AUTH_SCREENS.md`
- `rnative/planning/LOG-DEVELOPMENT.md`

Important note: where code and markdown disagree, this plan trusts the code.

---

## 3. Non-Negotiable Parity Rules

These must hold:

1. The route order stays:
   - `/mobile/intro`
   - `/mobile/onboarding/welcome`
   - `/mobile/onboarding/location`
   - `/mobile/onboarding/family`
   - `/mobile/onboarding/extended-family`
   - `/mobile/onboarding/wrap-up`
   - handoff to `/mobile/auth/secure-account`

2. The onboarding remains five screens for unauthenticated users. No summary screen is inserted between family and wrap-up. Authenticated users bypass onboarding and land on `/mobile/dashboard`.

3. The wrap-up screen stays static. No dynamic family recap is added.

4. The family screen keeps its inline child-card pattern. No modal child editor.

5. The family screen keeps:
   - relationship status,
   - spouse/partner first + last name only,
   - divorce dropdown,
   - children / guardianship responsibilities question,
   - per-child relationship,
   - per-child responsibility,
   - per-child capacity,
   - per-child disability flag,
   - per-child mental-capacity flag,
   - inline co-guardian add form.

6. Location and extended-family answers do not drive downstream branching in Epic 2.

7. Secure-account remains the next destination after wrap-up for unauthenticated users; implementing the real secure-account form itself is Epic 3.
8. The mobile web flow is online-only. We do not recreate the React Native offline gate behavior in Rails.

---

## 4. What The Native App Actually Does Today

## 4.1 Route flow

| Native route | Behavior |
|---|---|
| `/intro` | Entry screen with "Start Creating..." and "Login" |
| `/onboarding/welcome` | Collect first name, optional middle names, last name, DOB |
| `/onboarding/location` | Collect UK location/residency answers |
| `/onboarding/family` | Collect relationship state, partner, divorce, children, co-guardian details |
| `/onboarding/extended-family` | Collect parents/siblings answers |
| `/onboarding/wrap-up` | Static completion copy |
| `/auth/secure-account` | Create account using onboarding identity |

## 4.2 Persistence reality

The native app does not persist all onboarding answers equally:

| Step | Native persistence reality |
|---|---|
| Welcome | Persists will-maker first name, last name, DOB |
| Location | Not durably stored in domain state; local only |
| Family | Persists spouse/partner + children into person/relationship state |
| Extended family | Not durably stored in domain state; local only |
| Wrap-up | No data |

## 4.3 UI patterns worth preserving

- Each screen is a single calm card on a cream background.
- Header is minimal: back button where applicable, logo, step count.
- CTA is anchored in a dedicated footer area.
- Date input uses native picker behavior.
- Radio groups collapse after selection and reopen only when explicitly changed.
- Selects use a light-touch dropdown/sheet pattern rather than giant custom pickers.
- The wrap-up page is reassuring and static, not data-heavy.

That interaction rhythm matters. The mobile web version should feel like a product, not a CRUD wizard.

---

## 5. Rails Shape (The Boring, Correct Version)

## 5.1 Rails-side architecture

Use a single anonymous draft record plus one server-owned mobile entry routing decision.

### Proposed server objects

- `OnboardingSession` Active Record model
- extend the existing `Mobile::StartupController` so `/mobile` and `/mobile/open` remain the only top-level mobile entry points
- `Mobile::EntryRouting` PORO for the auth/startup/onboarding routing matrix
- `Mobile::OnboardingController`
- `Mobile::SessionsController` for the mobile login screen, reusing the existing Rails session auth underneath
- Small vanilla JS only where the page truly needs it:
  - family child add/remove
  - conditional section show/hide

Keep step-progress methods on `OnboardingSession` unless a second object is genuinely needed. Do not add debounced autosave.

Do not build a client-side router. Do not build a SPA. Do not create half the future estate schema just to render five screens.

Use the surface we already have:

- the existing `mobile` namespace in `rails/config/routes.rb`
- the existing mobile layout in `rails/app/views/layouts/mobile.html.erb`
- the existing plain importmap + vanilla JS setup in `rails/app/javascript/application.js`

## 5.2 Why this is the Rails way

- The app already serves HTML from Rails.
- The repo does not currently use Turbo or Stimulus.
- The current Rails auth stack already uses signed `session_id` cookies backed by `Session` rows; we should extend that rather than invent a mobile-only auth layer.
- The current Rails schema has auth tables only (`users`, `sessions`, `api_sessions`) and no estate-domain tables yet.
- Capacitor does not require us to fake native navigation with a JS framework when ordinary request/response pages will do.
- This mobile surface is explicitly online-only, so there is no value in porting the native offline routing branch.
- A pre-auth onboarding draft is a real domain concern; hiding it in cookies is too fragile, and creating full estate rows before account creation is too eager.
- The signed onboarding cookie should be only a locator; the `OnboardingSession` row should be the single source of truth for anonymous startup + onboarding progress.

## 5.3 Draft storage model

Create an `onboarding_sessions` table keyed by a signed cookie.

Create the draft the first time an unauthenticated user enters `/mobile` or `/mobile/open`, not on first welcome submit.

Suggested columns:

- `token`
- `current_step`
- `intro_seen_at`
- `last_seen_at`
- `attribution_source`
- `campaign`
- `location_id`
- `raw_url`
- `video_intro_version`
- `risk_questionnaire_version`
- `first_show`
- `video_completed_at`
- `questionnaire_completed_at`
- `first_name`
- `middle_names`
- `last_name`
- `date_of_birth`
- `country_of_residence`
- `nationality`
- `domiciled_in_uk`
- `currently_resident_in_uk`
- `relationship_status`
- `divorce_status`
- `has_children`
- `spouse_first_name`
- `spouse_last_name`
- `children_payload` as JSON
- `parents_alive`
- `parents_in_law_alive`
- `siblings_alive`
- `number_of_siblings`
- `completed_at`
- timestamps

Use the database for durability. Use the signed cookie only to find the draft. Do not store the actual onboarding payload in cookies.

Do not keep startup/deep-link progress in separate cookies once Epic 2 is implemented. Reuse the existing `Mobile::StartupRouting` rules, but feed them from `OnboardingSession` fields instead of a second anonymous state store.

Security and lifecycle rules:

- Encrypt all answer-bearing personal/sensitive columns with Rails built-in Active Record encryption. At minimum this includes names, date of birth, spouse fields, and `children_payload`.
- Refresh `last_seen_at` on ordinary startup/onboarding requests. Do not over-engineer "active" versus "passive" mobile view semantics.
- If a draft has been inactive for more than 3 hours, destroy it, clear the onboarding cookie, and start a fresh draft.
- Run a cleanup job to purge abandoned anonymous drafts that have aged past the inactivity window but were not eagerly deleted during request handling.
- Set `intro_seen_at` when the user explicitly continues from intro into onboarding, not merely when intro is rendered.

## 5.4 Validation strategy

Keep validations on `OnboardingSession` with step-specific validation contexts:

- `:welcome_step`
- `:location_step`
- `:family_step`
- `:extended_family_step`

That is simpler than five heavyweight service objects and closer to Rails conventions.

## 5.5 Promotion boundary

Do not create a real `User` during Epic 2 onboarding.

Instead:

- Epic 2 writes to `OnboardingSession`
- `secure-account` is the only path that may claim an anonymous onboarding draft
- Epic 3 `secure-account` creates the `User`, promotes onboarding data into real domain tables, destroys the anonymous draft, and clears the onboarding cookie in one transaction
- if the user chooses the plain login path instead of `secure-account`, keep the anonymous draft intact until authentication succeeds; on successful login, destroy the anonymous draft rather than trying to merge or re-home it

This is the right place to diverge from the native implementation detail. The user-visible flow remains identical, but the server does not accumulate orphaned pseudo-users.

## 5.6 Intentional Rails simplifications from native

- Valid authenticated sessions go straight to `/mobile/dashboard`; we do not preserve the native authenticated register-to-onboarding branch.
- The app is online-only; we do not port the native offline gate.
- Intro/onboarding can link to a dedicated mobile login screen. Failed login leaves the anonymous draft alone; successful login discards it instead of attempting a clever merge.
- The cohabiting parents-in-law bug is fixed intentionally by using `relationship_status`, not the native `getSpouse(...)` accessor.

---

## 6. Route Plan

Keep and extend the existing mobile entry routes:

- `GET /mobile`
- `GET /mobile/open`
- `POST /mobile/intro/continue`
- `GET /mobile/login`
- `POST /mobile/login`
- `GET /mobile/dashboard`
- `GET /mobile/auth/secure-account`

Add explicit mobile onboarding routes:

- `GET /mobile/onboarding`
- `GET /mobile/onboarding/welcome`
- `PATCH /mobile/onboarding/welcome`
- `GET /mobile/onboarding/location`
- `PATCH /mobile/onboarding/location`
- `GET /mobile/onboarding/family`
- `PATCH /mobile/onboarding/family`
- `GET /mobile/onboarding/extended-family`
- `PATCH /mobile/onboarding/extended-family`
- `GET /mobile/onboarding/wrap-up`
- `POST /mobile/onboarding/wrap-up/continue`

Behavior:

- `/mobile` and `/mobile/open` remain the only top-level entry points and use `Mobile::EntryRouting` to choose exactly one destination
- `POST /mobile/intro/continue` stamps `intro_seen_at` and redirects to `/mobile/onboarding`
- `/mobile/login` is a mobile-layout login screen that reuses the existing Rails session creation logic
- `/mobile/dashboard` is a concrete placeholder page for authenticated mobile users in Epic 2
- `/mobile/auth/secure-account` is a concrete handoff route, not a review-only dead end
- a stale or expired signed `session_id` cookie is cleared and redirected to `mobile_login_path`
- an onboarding draft inactive for more than 3 hours is destroyed and recreated before routing continues
- `/mobile/onboarding` redirects to the first incomplete step only after intro has been completed
- each `GET` action preloads the current draft
- each `PATCH` saves the step and redirects to the next step when valid
- invalid submissions re-render the same page with inline errors
- intro and onboarding screens include a visible login path to `mobile_login_path`
- failed mobile login preserves the anonymous draft
- successful mobile login destroys the anonymous draft, clears the onboarding cookie, and redirects to `/mobile/dashboard`

---

## 7. Detailed Step Plan

## 7.1 Step 1 — Welcome

### Native reference

- `rnative/app/onboarding/welcome.tsx`

### Fields

- first name
- middle names (optional, UI only in native)
- family name / surname
- date of birth

### Behavior to preserve

- welcome expects an active draft created at mobile entry
- if no active draft exists, create one as a recovery fallback
- if welcome data already exists, prefill it
- show the age warning copy when age is under 18 or over 90
- continue button disabled until required fields are present and age gate passes

### Rails implementation

- GET renders the step card
- PATCH assigns `first_name`, `middle_names`, `last_name`, `date_of_birth`
- save with `context: :welcome_step`
- on success redirect to location

### UX notes

- use native mobile date picker via HTML date input or small JS wrapper
- keep the footer CTA fixed above the safe-area inset
- do not add extra explainer copy beyond what native has

---

## 7.2 Step 2 — Location

### Native reference

- `rnative/app/onboarding/location.tsx`

### Fields

- which part of the UK do you live in?
- nationality
- domiciled in the UK?
- currently resident in the UK?

### Behavior to preserve

- all four answers required
- no extra branching
- continue goes straight to family

### Rails implementation

- persist these fields into `OnboardingSession` even though native does not store them durably
- do not let them influence downstream logic yet
- treat this persistence as resume support, not product expansion

### UX notes

- these are choice-heavy questions; large tap targets matter more than visual cleverness
- no cramped multi-column layout on mobile

---

## 7.3 Step 3 — Family

### Native reference

- `rnative/app/onboarding/family.tsx`
- `rnative/src/hooks/useAppState.ts`
- `rnative/src/types/index.ts`

### Fields

- relationship status
- spouse/partner first name
- spouse/partner last name
- divorce status
- has children / guardianship responsibilities
- repeating children cards:
  - first name
  - last name
  - date of birth (optional)
  - relationship to you
  - responsibility
  - capacity as guardian
  - is this child disabled?
  - does this child lack mental capacity?
- inline co-guardian form

### Behavior to preserve

- relationship status options stay exactly:
  - single
  - married
  - civil-partnership
  - cohabiting
  - widowed
- spouse/partner fields show only for married, civil-partnership, cohabiting
- spouse surname prefill from will-maker surname
- first child auto-adds when user answers yes
- child delete only appears when more than one child exists
- co-guardian form is inline, not modal
- family step must feel like one flowing card, not a nested admin form

### Rails implementation

- store child cards in `children_payload`
- persist `disabled` and `lacks_mental_capacity` as explicit booleans on each child payload entry
- render children with nested param names
- add/remove child rows in-page with vanilla JS
- compute validations server-side
- save the whole family step transactionally into the draft row

### UX notes

- keep both new child questions as plain yes/no controls on the child card
- place them with the other child-detail questions, not in a separate medical/legal sub-flow
- persist them exactly as booleans so later estate logic does not have to infer them from the coarse native `capacityStatus` enum

### Important Rails simplification

Native clears and recreates all onboarding-created people on submit.

Do not copy that approach literally.

In Rails, the draft row itself is the source of truth for Epic 2. Save the normalized family payload directly onto the draft. Promotion to real people/relationships happens later.

That preserves the product flow while avoiding delete-and-recreate churn on server records.

---

## 7.4 Step 4 — Extended Family

### Native reference

- `rnative/app/onboarding/extended-family.tsx`

### Fields

- are either of your parents still alive?
- are either of your partner's parents still alive?
- do you have any brothers or sisters still alive?
- how many siblings are alive?

### Behavior to preserve

- partner's parents question is conditional
- number of siblings is conditional
- no parent name collection
- no "other important people" section
- no skip button

### Rails implementation

- persist answers into `OnboardingSession`
- intentionally fix the shipped React Native cohabiting bug by showing the partner's parents question whenever `relationship_status` is `married`, `civil-partnership`, or `cohabiting`
- do not map them into estate-domain tables yet
- continue to wrap-up

---

## 7.5 Step 5 — Wrap-Up

### Native reference

- `rnative/app/onboarding/wrap-up.tsx`

### Behavior to preserve

- title remains static
- "What we've covered" remains static
- "Coming up next" remains static
- no dynamic family summary
- continue goes to secure-account

### Rails implementation

- wrap-up page reads no extra data
- continue action marks `completed_at` and redirects to `/mobile/auth/secure-account`
- `/mobile/auth/secure-account` exists as a concrete handoff route from Epic 2 onward, even if Epic 3 later replaces its internals

---

## 8. Simple Pseudo-Code For All Conditionals

## 8.1 Mobile entry routing matrix

```text
if authenticated_session_exists
  redirect to mobile_dashboard
elsif signed_session_cookie_present && authenticated_session_missing
  clear session cookie
  redirect to mobile_login
else
  onboarding_session = find_or_create_onboarding_session

  if onboarding_session.inactive_for_more_than?(3.hours)
    destroy onboarding_session
    clear onboarding cookie
    onboarding_session = create_onboarding_session
  end

  startup_destination = onboarding_session.startup_destination

  if startup_destination == video_intro
    redirect to video_intro
  elsif startup_destination == risk_questionnaire
    redirect to risk_questionnaire
  elsif !onboarding_session.intro_seen?
    redirect to intro
  elsif onboarding_session.completed?
    redirect to secure_account
  elsif onboarding_session.started?
    redirect to onboarding_session.first_incomplete_step
  else
    redirect to intro
  end
end
```

For direct onboarding step requests:

```text
if authenticated_session_exists
  redirect to mobile_dashboard
elsif signed_session_cookie_present && authenticated_session_missing
  clear session cookie
  redirect to mobile_login
elsif onboarding_session missing
  redirect to intro
elsif onboarding_session.inactive_for_more_than?(3.hours)
  destroy onboarding_session
  clear onboarding cookie
  redirect to intro
elsif !onboarding_session.intro_seen?
  redirect to intro
elsif requested_step is ahead_of first_incomplete_step
  redirect to first_incomplete_step
end
```

## 8.2 Welcome

```text
if no onboarding_session
  create onboarding_session as recovery fallback
end

if date_of_birth present
  age = calculate_age(date_of_birth)

  if age < 18
    show warning
    block continue
  elsif age > 90
    show warning
    block continue
  else
    clear warning
  end
end

continue_enabled =
  first_name.present? &&
  last_name.present? &&
  date_of_birth.present? &&
  no_age_error
```

## 8.3 Location

```text
continue_enabled =
  country_of_residence.present? &&
  nationality.present? &&
  domiciled_in_uk.present? &&
  currently_resident_in_uk.present?
```

## 8.4 Family: relationship + partner section

```text
has_partner =
  relationship_status in [married, civil-partnership, cohabiting]

if has_partner
  show spouse_partner_fields
else
  hide spouse_partner_fields
  clear spouse_first_name
  clear spouse_last_name
end

if has_partner && user_last_name.present? && spouse_last_name_not_touched
  prefill spouse_last_name with user_last_name
end

if spouse_last_name_was_prefilled && field_first_focused
  clear spouse_last_name
end
```

## 8.5 Family: children

```text
if has_children == yes && children.empty?
  append blank child card
end

if has_children == no
  clear children
end

when add_child
  guardian_ids =
    if has_partner
      [will_maker, spouse_placeholder]
    else
      [will_maker]
    end

  child_last_name =
    if spouse_last_name.present?
      user_last_name
    else
      ""
    end
end

if child_last_name_was_prefilled && field_first_focused
  clear child_last_name
end
```

## 8.6 Family: child disability / mental-capacity flags

```text
when add_child
  child.disabled_answer = unanswered
  child.lacks_mental_capacity_answer = unanswered
end

child_flags_valid =
  every child has disabled_answer in [yes, no] &&
  every child has lacks_mental_capacity_answer in [yes, no]
```

## 8.7 Family: responsibility / co-guardian

```text
if responsibility == sole-responsibility
  guardian_ids = [will_maker]
elsif responsibility == co-responsibility-with-spouse
  guardian_ids = [will_maker, spouse_placeholder]
elsif responsibility starts_with "co-guardian-"
  guardian_ids = [will_maker, chosen_co_guardian_id]
elsif responsibility == add-co-guardian
  show inline_co_guardian_form
end

if co_guardian.first_name.blank?
  do_not_add_co_guardian
else
  append co_guardian
  guardian_ids = [will_maker, new_co_guardian_id]
end
```

## 8.8 Family: validation

```text
spouse_valid =
  !has_partner || (spouse_first_name.present? && spouse_last_name.present?)

children_valid =
  has_children == no ||
  (
    children.count > 0 &&
    every child has first_name, last_name, relationship &&
    every child has disabled_answer in [yes, no] &&
    every child has lacks_mental_capacity_answer in [yes, no]
  )

continue_enabled =
  relationship_status.present? &&
  divorce_status.present? &&
  has_children.present? &&
  spouse_valid &&
  children_valid
```

## 8.9 Family: draft normalization

```text
for each child
  qualifiers = {}

  if relationship == biological-child
    qualifiers.biological = true
  elsif relationship == adopted-child
    qualifiers.adoptive = true
  elsif relationship == stepchild
    qualifiers.step = true
  elsif relationship == foster-child
    qualifiers.foster = true
  end

  child_flags =
    {
      disabled: (disabled_answer == yes),
      lacks_mental_capacity: (lacks_mental_capacity_answer == yes)
    }

  capacity_flags =
    if capacity_status == under-18
      is_under_18 = true
      in_care = true
      care_category = child-under-18
    elsif capacity_status == over-18-lacks-capacity
      is_under_18 = false
      in_care = true
      care_category = nil
    else
      is_under_18 = false
      in_care = false
      care_category = nil
    end
end
```

## 8.10 Extended family

```text
# Intentional Rails bug fix:
# cohabiting users should see partner's parents question too
show_parents_in_law =
  relationship_status in [married, civil-partnership, cohabiting]

if siblings_alive == no
  clear number_of_siblings
end

continue_enabled =
  parents_alive.present? &&
  (!show_parents_in_law || parents_in_law_alive.present?) &&
  siblings_alive.present? &&
  (siblings_alive == no || number_of_siblings.present?)
```

## 8.11 Wrap-up

```text
if user_taps_continue
  mark onboarding_session completed
  redirect to secure_account
end
```

---

## 9. Acceptance Criteria

Epic 2 is ready when:

1. `GET /mobile` and `GET /mobile/open` route through one explicit Rails-owned entry routing decision.
2. Valid authenticated sessions land on `/mobile/dashboard`.
3. Stale or expired auth sessions are cleared and redirected to `/mobile/login`.
4. The unauthenticated onboarding flow still uses the native five-screen order.
5. `intro_seen_at` controls whether intro is shown again.
6. A reload on any step restores saved answers while the draft remains active.
7. Anonymous onboarding drafts expire after 3 hours of inactivity and restart cleanly.
8. The handoff to `/mobile/auth/secure-account` is concrete and deterministic.
9. Startup/deep-link routing and onboarding routing both read from `OnboardingSession`, not from competing anonymous stores.
10. Model and controller tests cover every branch listed in the pseudo-code section.

---

## 10. Delivery Phases

## Phase A — Freeze parity spec

Acceptance criteria:

- all native references listed
- all branch logic documented
- all open product questions isolated before coding

Tasks:

- convert this plan into a parity checklist
- review flagged issues with product before implementation begins

## Phase B — Build draft persistence and route guards

Acceptance criteria:

- signed cookie identifies one anonymous onboarding draft
- `GET /mobile` and `GET /mobile/open` route through the entry routing matrix
- stale auth sessions are redirected to `/mobile/login`
- stale onboarding drafts are cleared after 3 hours inactivity
- startup/deep-link progress lives on `OnboardingSession`

Tasks:

- add `OnboardingSession`
- add `Mobile::EntryRouting`
- add `Mobile::SessionsController`
- add routes
- extend the existing mobile startup entry flow
- add route guard logic and draft lifecycle handling

## Phase C — Implement welcome and location

Acceptance criteria:

- both steps save and resume correctly
- DOB gate works exactly as agreed

Tasks:

- build views
- build validations
- add tests

## Phase D — Implement family

Acceptance criteria:

- inline child cards work
- co-guardian flow works
- surname prefill rules work
- child disability / mental-capacity booleans save and resume correctly
- conditional sections match native

Tasks:

- build nested child payload UI
- add family normalization methods
- add exhaustive tests for every branch

## Phase E — Implement extended-family and wrap-up

Acceptance criteria:

- partner's parents question is shown per agreed rule
- wrap-up is static
- continue hands off to secure-account
- authenticated mobile users have a concrete dashboard placeholder route

Tasks:

- build pages
- add tests

## Phase F — Device QA, analytics, rollback

Acceptance criteria:

- validated in browser and inside Capacitor shell
- structured logs exist for step view/save/failure
- feature can be disabled cleanly

Tasks:

- manual QA on iPhone and Android shells
- add structured onboarding logs
- add rollout flag

---

## 11. Tests To Write First

- `Mobile::EntryRouting` tests:
  - valid authenticated session -> `/mobile/dashboard`
  - stale signed `session_id` cookie -> `/mobile/login` and cookie cleared
  - startup obligations run before onboarding
  - intro is skipped only after `intro_seen_at`
  - completed onboarding + unauthenticated -> `/mobile/auth/secure-account`
  - stale onboarding draft after 3 hours inactivity resets cleanly
  - startup routing is read from `OnboardingSession`, not separate cookies
- mobile login tests:
  - renders with mobile layout
  - failed login preserves anonymous draft
  - successful login destroys anonymous draft and redirects to `/mobile/dashboard`
- `OnboardingSession` validation tests for each step context
- `OnboardingSession` progress / resume tests
- mobile onboarding controller integration tests:
  - welcome happy path
  - welcome age gate
  - location required fields
  - family partner path
  - family no-partner path
  - family yes-children auto-first-card behavior
  - family child disability / mental-capacity booleans required and persisted
  - extended-family conditional parents-in-law path
  - wrap-up handoff
- security/regression tests:
  - direct onboarding request before intro redirects to intro
  - choosing login from onboarding does not discard the anonymous draft before auth succeeds
  - stale onboarding draft cannot be resumed
  - CSRF protection remains enabled on onboarding writes
- regression tests for every flagged logic bug we intentionally fix

---

## 12. Observability And Rollback

## Observability

Log:

- onboarding session created
- onboarding session expired and reset
- step viewed
- step saved
- validation failed
- resume redirect
- stale auth session cleared
- draft discarded after successful login
- wrap-up continued

Include:

- onboarding_session_id
- step
- request_id
- validation error keys

## Rollback

- gate all mobile onboarding routes behind a feature flag
- if disabled, redirect back to `/mobile/intro`
- migrations are additive; rollback is route-level, not data-destroying

---

## 13. Business Logic Issues Flagged From The Native App

These are real issues or ambiguities seen in the code. They should be reviewed explicitly before implementation.

1. **Age gate mismatch between code and docs**
   - `welcome.tsx` disables Continue when age is under 18 or over 90.
   - `ONBOARDING_IMPLEMENTATION_TASK.md` says the user can still continue.
   - We need a product decision: warning-only, or hard stop.

2. **Location step omits Northern Ireland**
   - The native code only offers England, Wales, Scotland.
   - If we copy this literally, UK coverage is incomplete.

3. **Location answers are collected but not used anywhere**
   - Native logs them and moves on.
   - That may be intentional for now, but if so we should say so plainly.

4. **Relationship restoration in native family screen appears broken**
   - `family.tsx` loads spouse data via `relationshipActions.getSpouse(...)`, but that accessor only fetches `SPOUSE` edges.
   - The screen then checks `existingSpouse.relationship`, but `getRelatedPeople` returns `type`, not `relationship`.
   - Result: edit/resume parity for spouse vs partner is not trustworthy in current native code.

5. **Cohabiting path likely misses partner's parents question**
   - `extended-family.tsx` decides whether to show "partner's parents" by calling `getSpouse(...)`.
   - Cohabiting creates `PARTNER`, not `SPOUSE`.
   - That likely hides the question for cohabiting users.
   - Rails decision: fix this intentionally by keying off `relationship_status`.

6. **Relationship status is richer than the persisted relationship edge**
   - Native captures `married`, `civil-partnership`, `cohabiting`, `widowed`.
   - But the durable relationship layer collapses this into `SPOUSE` or `PARTNER`, and widowed is not represented as an active edge at all.
   - Rails should keep `relationship_status` as its own explicit draft field.

7. **Divorce status is required to continue, but not persisted**
   - Native makes it required in UI and then discards it.
   - Rails decision: default it to `"no"` on first Family load, keep it editable, and persist it on the draft.

8. **Child last-name prefill logic is odd**
   - New child prefill only triggers when `spouseLastName` is present.
   - But the value used is `userLastName`, not `spouseLastName`.
   - This may be intentional surname defaulting, or it may be a bug.

9. **Family-step guardian defaults may conflict with later guardianship rules**
   - Native family step defaults partner co-responsibility into child guardian ids.
   - Native guardianship planning notes say spouse/partner cannot be guardian of biological children.
   - That conflict needs a business decision before Rails encodes it.

10. **Capacity mapping is incomplete**
   - `over-18-lacks-capacity` sets `inCare = true` but leaves `careCategory` blank.
   - If later flows rely on care categories, this is semantically weak.
   - Rails should also carry explicit per-child `disabled` and `lacks_mental_capacity` booleans so later logic does not have to reverse-engineer these facts from `capacityStatus`.

11. **Secure-account password policy conflicts with Rails backend**
    - Native secure-account allows password length >= 8.
    - Current Rails `User` validation requires length >= 12 and letters + numbers.
    - Epic 2 hands off to Epic 3 here, but we should not ignore the mismatch.

---

## 14. Recommendation

Approve this implementation direction if the team agrees with four key choices:

1. Rails extends the existing mobile startup surface with one explicit entry routing decision, rather than scattering routing logic across controllers.
2. Rails stores anonymous onboarding in an encrypted draft record with a 3-hour inactivity window, not in cookies and not in premature real user/domain rows.
3. We preserve the native unauthenticated screen flow exactly where it matters, while intentionally simplifying to an online-only Rails app with authenticated users going straight to `/mobile/dashboard`.
4. We explicitly decide which of the flagged native issues are intentional product behavior and which are bugs to fix during the Rails implementation.

That is the narrow path that feels DHH-correct, security-conscious, and product-faithful.
