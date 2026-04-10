# Epic 1 Detailed Plan: Splash, Intro Behaviour, Deep-Link Behaviour

## 1) Epic objective
Recreate the app-open path in a Rails-served Ionic/Capacitor app with strict behavior parity for:
- splash handoff,
- attribution capture (first-touch),
- onboarding state persistence,
- deep-link destination decisions.

This epic is complete when a user opening the migrated app lands on the same destination as native for equivalent state/params.

---

## 2) Scope and non-goals

### In scope
- Startup route + splash timing behavior.
- Deep-link parse and route decisions.
- Attribution + onboarding-state data contract.
- Storage, fallback, and offline behavior for startup routing.
- Telemetry for startup decision outcomes.

### Non-goals
- Rebuilding onboarding screens themselves (Epic 2).
- Changing marketing attribution schema.
- Introducing deferred deep-link provider changes in this phase.

---

## 3) Current behavior baseline (native)

Native behavior to preserve:
- `index` shows splash and navigates into intro flow.
- `open` deep-link route parses params and persists first-touch attribution.
- Existing attribution is not overwritten; routing then depends on onboarding completion state.
- Routing can send users to `/video-intro`, `/risk-questionnaire`, or `/intro`.

Primary references:
- `rnative/app/index.tsx`
- `rnative/app/open.tsx`
- `rnative/src/services/attribution.ts`

---

## 4) Target architecture (Rails way, simple)

### Simple architecture decisions
- Keep startup decision logic in a **single pure TypeScript module** used by app bootstrap.
- Rails serves the web bundle and API; routing decision remains client-side for immediate UX.
- Keep attribution contract unchanged initially; no schema innovation in Epic 1.
- Use one storage adapter interface with a minimal implementation for Capacitor/web secure storage.

### Why this is intentionally simple
- One decision engine, one data contract, one startup orchestration path.
- No event bus, no workflow engine, no micro-layered adapters.

### Rails view strategy for Capacitor + Web (decision for Epic 1)

**Recommended default:**
- Use Rails as the backend + app host, but keep mobile and web UI rendering in separate frontend view layers.
- Keep shared business logic in Rails models/domain objects and shared TypeScript decision modules where needed.
- Avoid device-branching conditionals inside a single Rails template for materially different UX.

**Practical interpretation:**
- If using Ionic/Capacitor UI, mobile screens should live in the app frontend code (not ERB).
- Rails can still serve the bundle entrypoint and API endpoints.
- Web app can have its own frontend views (ERB/Turbo or JS app) as needed.

**When to share Rails views anyway:**
- Only for truly near-identical pages with minor presentation differences.
- Prefer explicit separate templates/partials over heavy runtime device-switch logic.

**Rails-way guardrail:**
- “One controller, many concerns” is fine; “one template doing two different products” is not.
- Keep controllers resource-oriented; split by surface area via namespaces when UX diverges (e.g., `Mobile::` vs `Web::`), while sharing models/policies/services.

### DHH-style review (Rails-way sanity check)

This is not a literal review by DHH, but a Rails-principles check against his published style preferences (convention, clarity, integrated systems, anti-ceremony).

**Review verdict:** Content with this direction, with one constraint:
- ✅ Keep backend/domain logic unified in Rails.
- ✅ Keep controllers straightforward and resource-oriented.
- ✅ Prefer simple, explicit structure over abstraction layers.
- ✅ Avoid a single template that branches heavily by user agent/device.
- ✅ Prefer separate view surfaces when product experiences are materially different.
- ⚠️ Constraint: do not introduce unnecessary frontend architecture ceremony; keep the mobile/web split practical and boring.

**What would fail this check:**
- Device-detection branching across many ERB files.
- A shared “meta-template” trying to represent two products.
- Introducing service/helper abstractions before proven need.

---

## 5) Data contract to preserve

## Attribution object
- `source?`
- `campaign?`
- `location_id?`
- `show_video: number`
- `show_risk_questionnaire: number`
- `first_show: 'video' | 'risk_questionnaire'`
- `captured_at: string`
- `is_organic: boolean`
- `raw_url?`

## Onboarding state object
- `video_completed: boolean`
- `video_version?: number`
- `questionnaire_completed: boolean`
- `questionnaire_version?: number`

## Behavior rules
- First-touch attribution wins; do not overwrite existing attribution.
- Invalid numeric params resolve as native currently does.
- Missing onboarding state falls back safely to `/intro`.

---

## 6) Detailed implementation tasks

## Phase A — Freeze parity logic before coding UI
1. Extract current decision table from native code into a markdown matrix (all combinations).
2. Write pure tests for:
   - parse coercion,
   - first-touch persistence decisions,
   - destination selection decisions.
3. Add “golden cases” from observed native outcomes.

**Acceptance criteria**
- Decision module test suite passes and documents all expected outputs.

## Phase B — Build startup decision module
1. Create module: `startupRouting.ts` (name can vary, keep singular module).
2. Functions:
   - `normalizeAttributionParams(raw)`
   - `chooseStartupDestination(attribution, onboardingState)`
   - `shouldWriteFirstTouch(existingAttribution)`
3. Ensure zero UI dependencies.

**Acceptance criteria**
- Module is deterministic and fully unit-tested.

## Phase C — Storage adapter (minimal)
1. Implement a narrow storage API:
   - `getAttribution()` / `setAttribution()`
   - `getOnboardingState()` / `setOnboardingState()`
2. Implement using secure-capable storage available in target platform.
3. Keep serialization centralized.

**Acceptance criteria**
- Read/write behavior matches native key semantics and object shapes.

## Phase D — App bootstrap wiring
1. Add startup orchestrator called once on app launch.
2. If deep-link params present and no stored attribution: persist attribution + initialize onboarding state.
3. Determine destination and navigate.
4. If stored attribution exists: use onboarding progress to route.

**Acceptance criteria**
- Cold starts and deep-link starts route correctly with no double-navigation.

## Phase E — Rails integration
1. Ensure Rails serves SPA entry and supports deep-link path handoff.
2. Establish and document surface strategy:
   - mobile (Capacitor/Ionic) frontend entrypoint,
   - web frontend entrypoint,
   - shared API boundary and shared domain layer.
3. If both surfaces are server-rendered in any area, prefer separate templates (or namespaces) over device-conditional mega-templates.
4. Add request-level observability for boot path and static asset load health.
5. Keep backend concerns minimal in this epic (no new attribution business logic yet).

**Acceptance criteria**
- Rails-served app boots and deep links resolve correctly in production-like env.

## Phase F — Telemetry + operations
1. Emit startup event with:
   - source of attribution (new/existing/organic),
   - chosen destination,
   - fallback reason if any.
2. Add dashboard query/playbook for startup routing anomalies.

**Acceptance criteria**
- We can diagnose startup misroutes without reproducing locally.

---

## 7) Security and trust checks (required)
- Validate and sanitize deep-link params before persistence.
- Never execute arbitrary route from query param; use allowlisted destinations.
- Avoid storing sensitive data in attribution payload.
- Ensure storage failures fail closed to safe default route (`/intro`) with logging.
- Add abuse tests for malformed URLs and oversized params.

---

## 8) QA matrix (must pass)

## A. First launch
- No deep-link params => `/intro` path via splash.
- Deep-link with `show_video=1` => `/video-intro`.
- Deep-link with `show_risk_questionnaire=1` => `/risk-questionnaire`.
- Deep-link with both + `first_show=video` => `/video-intro`.
- Deep-link with both + `first_show=risk_questionnaire` => `/risk-questionnaire`.

## B. Existing attribution
- Existing attribution + incomplete onboarding => expected pending screen.
- Existing attribution + complete onboarding => `/intro`.
- Existing attribution + missing onboarding state => `/intro` fallback.

## C. Invalid input
- Negative values for show flags.
- Non-numeric values for show flags.
- Unexpected `first_show` value.
- Empty query string values.

## D. Reliability
- Offline launch.
- Storage read failure.
- Storage write failure.
- Rapid repeated app opens.

---

## 9) Deliverables
- Startup routing decision table (document).
- Pure startup decision module + tests.
- Storage adapter implementation + tests.
- Bootstrap integration in Rails-served Ionic app.
- Rails surface strategy note (mobile vs web views, namespace/controller guidance, and sharing boundaries).
- QA report for parity matrix.
- Ops runbook note for startup-routing diagnostics.

---

## 10) Exit criteria
Epic 1 is done when:
1. Startup destinations match native parity matrix.
2. No known misroutes in QA matrix.
3. Security checks pass for deep-link input handling.
4. Observability exists for every startup destination decision.
