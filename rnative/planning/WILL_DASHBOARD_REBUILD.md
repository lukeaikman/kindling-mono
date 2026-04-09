# Will Dashboard Rebuild — Implementation Plan

## Overview

Replace the current 9-item checklist dashboard with a calm, momentum-driven 3-stage view. The screen should feel like "three short steps, then done" rather than administrative overhead.

**File:** `app/will-dashboard.tsx` (replaces deleted `app/order-of-things.tsx`)

---

## Design Principles

- No percentages, no brackets in status text
- Single primary CTA ("Continue") routes to next incomplete stage
- Progressive disclosure: detailed steps live inside each flow, not on dashboard
- Calm, reassuring styling — no warning colours unless genuinely blocked
- Scrollable on small devices, single-screen target on iPhone 14/15

---

## Screen Structure

```
┌─────────────────────────────────────┐
│  Header                             │
│  "Your Will"                        │
│  "About 16 minutes start to finish" │
├─────────────────────────────────────┤
│                                     │
│  [StageCard] Your People            │
│  Status · 3 mins                    │
│                                     │
│  [StageCard] Your Estate            │
│  Status · 8 mins                    │
│                                     │
│  [StageCard] Legal Check            │
│  Status · 5 mins                    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [ReadyToSignCard]                  │
│  Lock/tick icon + eligibility copy  │
│                                     │
├─────────────────────────────────────┤
│  [Button] Continue                  │
└─────────────────────────────────────┘
```

---

## Stage Definitions

### Stage 1: Your People

**Title:** "Your People"  
**Subline:** "Family, guardians, executors & friends · 3 mins"

**What lives underneath (not shown on dashboard):**
- Executors
- Guardians
- Residual Participants (beneficiaries for residue)
- Partner collaboration decision

**Status logic:**

| Status | Condition |
|--------|-----------|
| Not started | No partner, children, or user profile data |
| In progress | Some data exists but stage incomplete |
| Complete | All of: user details complete, onboarding data complete, executors invited, guardians nominated (if children exist), residue divided |

**Completion checks:**
```typescript
const yourPeopleComplete = 
  userProfileComplete &&
  onboardingDataComplete &&
  executorsInvited &&
  (hasChildrenUnder18 ? guardiansNominated : true) &&
  residueDivided;
```

**Route:** Smart routing via `getNextYourPeopleRoute()` — enters at the first incomplete sub-flow

---

### Stage 2: Your Estate

**Title:** "Your Estate"  
**Subline:** "Assets, gifts, and who gets what · 8 mins"

**What lives underneath:**
- Asset class selection
- Asset entry per class
- Estate division visualization

**Status logic:**

| Status | Condition |
|--------|-----------|
| Not started | No assets exist |
| In progress | Some assets exist but not all sections marked complete |
| Complete | Asset classes selected, each has ≥1 asset, all sections marked complete (with timestamp) |

**New data model requirement:**
```typescript
// Add to asset/bequeathal types
interface AssetSectionCompletion {
  assetType: AssetType;
  completedAt: Date | null; // null = not complete, Date = when marked complete
}
```

**Route:** `/bequeathal/intro` (existing)

---

### Stage 3: Legal Check

**Title:** "Legal Check"  
**Subline:** "Legal safety and tax efficiency · 5 mins"

**What lives underneath:**
- Warning flags module (estranged child, ex-wife, JT property, etc.)
- Tax suggestions module (allowance optimization)

**Status logic:**

| Status | Condition |
|--------|-----------|
| Not started | Checks not run |
| In progress | Some warnings/suggestions unresolved |
| Complete | All warnings resolved AND all tax suggestions resolved |

**Stub implementation:**
```typescript
// TODO: Implement warnings and tax modules
const legalCheckComplete = false; // Stub until features built
const legalCheckStarted = false;  // Stub
```

**Route:** `/legal-check/intro` (new route needed)

---

## Signing Section

### Ready to Sign Card

**Title:** "Ready to sign"  
**Icon:** Lock (ineligible) or Tick (eligible)

**Eligibility logic:**
```typescript
const allStagesComplete = 
  yourPeopleComplete && 
  yourEstateComplete && 
  legalCheckComplete;

const invitationsAccepted = 
  executorsAccepted &&  // All invited executors accepted
  guardiansAccepted;    // All invited guardians accepted

const canSign = allStagesComplete && invitationsAccepted;
```

**Copy:**

| State | Copy |
|-------|------|
| Not eligible (stages incomplete) | "Complete all three sections to unlock signing" |
| Not eligible (awaiting acceptances) | "Waiting for executors and guardians to accept" |
| Eligible | "You're ready to sign" |

**What lives underneath Signing:**
- Review
- Smart invite to partner
- Sign ceremony

**Tap behavior:**
- If not eligible: Show friendly explanation modal, then route to next incomplete stage
- If eligible: Route to `/signing/review`

---

## Navigation Logic

### getNextRoute() Helper

```typescript
type StageStatus = 'not_started' | 'in_progress' | 'complete';

interface StageState {
  yourPeople: StageStatus;
  yourEstate: StageStatus;
  legalCheck: StageStatus;
  canSign: boolean;
}

function getNextRoute(state: StageState): string {
  // Linear progression: must complete in order
  if (state.yourPeople !== 'complete') {
    return '/your-people/intro';
  }
  if (state.yourEstate !== 'complete') {
    return '/bequeathal/intro';
  }
  if (state.legalCheck !== 'complete') {
    return '/legal-check/intro';
  }
  if (state.canSign) {
    return '/signing/review';
  }
  // All stages complete but can't sign yet (awaiting acceptances)
  return '/signing/waiting';
}
```

**User cannot skip stages.** Tapping a future stage card should either:
- Do nothing (disabled appearance)
- Show a toast: "Complete [previous stage] first"

---

## Component Specifications

### 1. StageCard

**Props:**
```typescript
interface StageCardProps {
  title: string;
  subline: string;
  status: 'Not started' | 'In progress' | 'Complete';
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}
```

**Visual:**
- Full-width card with 16px padding
- Title: 18px semibold, navy
- Status: 14px regular, muted (green for Complete)
- Subline: 14px regular, mutedForeground
- Right chevron icon
- Subtle elevation (shadow.small)
- Border radius: 12px
- Disabled state: reduced opacity, no press handler

---

### 2. ReadyToSignCard

**Props:**
```typescript
interface ReadyToSignCardProps {
  eligible: boolean;
  waitingForAcceptances: boolean;
  onPress: () => void;
  testID?: string;
}
```

**Visual:**
- Compact card with icon (Lock or CheckCircle)
- Different background for eligible state (subtle green tint)
- Same card styling as StageCard

---

### 3. WillDashboardScreen

**State derivation:**
```typescript
function useWillDashboardState() {
  const { willData, personActions, bequeathalData, estateRemainderState } = useAppState();
  
  // Derive all completion states
  const yourPeopleStatus = deriveYourPeopleStatus(...);
  const yourEstateStatus = deriveYourEstateStatus(...);
  const legalCheckStatus = deriveLegalCheckStatus(...);
  const canSign = deriveCanSign(...);
  
  return {
    yourPeopleStatus,
    yourEstateStatus,
    legalCheckStatus,
    canSign,
    nextRoute: getNextRoute({ ... }),
  };
}
```

---

## Data Model Changes Required

### 1. Asset Section Completion Tracking

```typescript
// In BequeathalData or new tracking object
interface AssetCompletionState {
  [assetType: string]: {
    completedAt: Date | null;
  };
}
```

### 2. Invitation Status Tracking

Verify existing data model supports:
```typescript
interface Person {
  // ... existing fields
  invitedAt?: Date;      // When invitation sent
  acceptedAt?: Date;     // When invitation accepted
}
```

If not present, add to Person type or create separate tracking.

### 3. Legal Check State (Stub)

```typescript
interface LegalCheckState {
  warnings: Warning[];
  taxSuggestions: TaxSuggestion[];
  // Each has a `resolvedAt: Date | null`
}
```

---

## Files Created/Modified

| File | Action | Status | Description |
|------|--------|--------|-------------|
| `app/will-dashboard.tsx` | Create | ✅ Done | Dashboard with real state, dynamic labels, progress |
| `src/components/ui/StageCard.tsx` | Create | ✅ Done | Reusable stage card |
| `src/components/ui/ReadyToSignCard.tsx` | Create | ✅ Done | Signing eligibility card |
| `src/components/ui/GlassMenu.tsx` | Create | ✅ Done | Glassmorphic bottom sheet menu |
| `src/components/ui/Celebration.tsx` | Create | ✅ Done | Confetti + "Nice Work" animation overlay |
| `src/utils/willProgress.ts` | Create | ✅ Done | Status derivation, routing, labels, progress |
| `app/guardianship/wishes.tsx` | Modify | ✅ Done | Celebration + auto-progress on completion |
| `app/executors/invitation.tsx` | Modify | ✅ Done | Celebration + auto-progress on completion |
| `app/executors/professional.tsx` | Modify | ✅ Done | Celebration + auto-progress on completion |
| `app/_layout.tsx` | Modify | ✅ Done | `GestureHandlerRootView` wrapper |
| `app/order-of-things.tsx` | Delete | ✅ Done | Legacy dashboard removed |
| 22 files (auth, splash, bequeathal, etc.) | Modify | ✅ Done | Route rename `/order-of-things` → `/will-dashboard` |
| `src/types/index.ts` | Modify | Pending | Add `AssetCompletionState`, `LegalCheckState` (Stage 2+) |
| `src/hooks/useAppState.ts` | Modify | Pending | Add legal check state management (Stage 3) |

---

## Test Plan — Phase 2 Stage 1

All functions live in `src/utils/willProgress.ts`. State interface is `WillProgressState`:

```typescript
interface WillProgressState {
  willMaker: Person | undefined;
  people: Person[];
  willData: WillData;
  estateRemainderState: EstateRemainderState;
}
```

### A. Unit Tests — deriveYourPeopleStatus()

| # | Scenario | Expected | How to verify |
|---|----------|----------|---------------|
| A1 | Empty state — no will-maker, no people | `'Not started'` | New user, no onboarding |
| A2 | Will-maker exists with first/last name but no DOB/address | `'In progress'` | Partial profile |
| A3 | Full user details + onboarding people + executors invited + residue allocated (no children) | `'Complete'` | Guardians skipped |
| A4 | Full details + children exist + no guardians nominated | `'In progress'` | Children but no guardians |
| A5 | Full details + children exist + guardians nominated + residue + executors | `'Complete'` | Full completion with children |
| A6 | Full details + onboarding done + executors NOT invited | `'In progress'` | Executors selected but not sent |
| A7 | Full details + onboarding done + residue NOT allocated | `'In progress'` | No beneficiaries chosen |

### B. Unit Tests — getNextYourPeopleRoute()

| # | Scenario | Expected Route |
|---|----------|----------------|
| B1 | Has children, guardians not nominated | `/guardianship/intro` |
| B2 | Has children, guardians done, no residue | `/bequeathal/estate-remainder-who` |
| B3 | Residue done, executors not invited | `/executors/intro` |
| B4 | All sub-flows complete | `/will-dashboard` |
| B5 | No children, no residue allocated | `/bequeathal/estate-remainder-who` (skips guardians) |
| B6 | No children, residue done, executors not invited | `/executors/intro` |

### C. Unit Tests — getNextRoute() (top-level)

| # | Scenario | Expected Route |
|---|----------|----------------|
| C1 | Stage 1 incomplete | Same as `getNextYourPeopleRoute()` |
| C2 | Stage 1 complete, Stage 2 incomplete | `/bequeathal/categories` |
| C3 | Stages 1+2 complete, Stage 3 incomplete | `/legal-check` |
| C4 | All stages complete | `/will-dashboard` |

### D. Unit Tests — getContinueLabel()

| # | Next Route | Expected Label |
|---|------------|----------------|
| D1 | `/guardianship/intro` | `'Continue to Guardians'` |
| D2 | `/bequeathal/estate-remainder-who` | `'Continue to Residue'` |
| D3 | `/executors/intro` | `'Continue to Executors'` |
| D4 | `/bequeathal/categories` | `'Continue to Your Estate'` |
| D5 | All done | `'Continue'` |

### E. Unit Tests — getYourPeopleProgress()

| # | Scenario | Expected |
|---|----------|----------|
| E1 | No sub-flows complete, has children (3 steps) | `'0/3 done'` |
| E2 | Guardians done only, has children | `'1/3 done'` |
| E3 | Guardians + residue done, has children | `'2/3 done'` |
| E4 | All 3 done, has children | `'Complete'` |
| E5 | No children, no sub-flows done (2 steps) | `'0/2 done'` |
| E6 | No children, residue + executors done | `'Complete'` |

### F. Unit Tests — canSign() and isWaitingForAcceptances()

| # | Scenario | canSign | isWaiting |
|---|----------|---------|-----------|
| F1 | Stages incomplete | `false` | `false` |
| F2 | All stages complete, executors pending | `false` | `true` |
| F3 | All stages complete, executors accepted, guardians pending | `false` | `true` |
| F4 | All stages complete, all accepted | `true` | `false` |
| F5 | All stages complete, no children, executors accepted | `true` | `false` |

### G. Manual Tests — Dashboard UI

| # | Test | Steps | Expected |
|---|------|-------|----------|
| G1 | Dashboard renders 3 stage cards + signing card | Navigate to `/will-dashboard` | 3 StageCards visible, 1 ReadyToSignCard, 1 Continue button |
| G2 | Your People status derived from real state | Check with existing onboarding data | Status reflects actual progress |
| G3 | Your Estate disabled when Stage 1 incomplete | Verify Your Estate card is dimmed | Reduced opacity, not tappable |
| G4 | Legal Check disabled when Stage 2 incomplete | Verify Legal Check card is dimmed | Reduced opacity, not tappable |
| G5 | Continue button label is dynamic | With no guardians set | Label reads "Continue to Guardians" |
| G6 | Continue button navigates correctly | Tap Continue | Navigates to correct sub-flow entry |
| G7 | Stage card subline shows progress | When 1/3 done | Subline appends " · 1/3 done" |
| G8 | Signing card shows disabled state | When stages incomplete | Reduced opacity, lock icon |
| G9 | Menu icon opens GlassMenu | Tap hamburger icon | Bottom sheet slides up |
| G10 | Back button returns to previous screen | Tap back arrow | Navigates back via stack |
| G11 | Double-tap logo opens dev dashboard | Double-tap header logo | Navigates to `/developer/dashboard` |

### H. Manual Tests — Celebration & Auto-Progress

| # | Test | Steps | Expected |
|---|------|-------|----------|
| H1 | Guardians completion triggers celebration | Complete guardian assignment, tap Continue | Confetti + "Nice Work" overlay appears |
| H2 | Celebration auto-navigates to residue | Wait ~1.5s after celebration starts | Navigates to `/bequeathal/estate-remainder-who` |
| H3 | Executor invitation triggers celebration | Complete executor flow, tap "Executors Complete" | Confetti + "Nice Work" overlay appears |
| H4 | Executor celebration auto-navigates | Wait ~1.5s | Navigates to next incomplete sub-flow or dashboard |
| H5 | Professional executor triggers celebration | Complete professional executor, tap Continue | Confetti + "Nice Work" overlay |
| H6 | Celebration is non-interactive | During animation | Overlay has `pointerEvents="none"` |

### I. Manual Tests — Back Button Behaviour

| # | Test | Steps | Expected |
|---|------|-------|----------|
| I1 | Back from guardianship returns to dashboard | Navigate via Continue, then tap Back | Returns to `/will-dashboard` |
| I2 | Back from residue returns to dashboard | Navigate via Continue, then tap Back | Returns to `/will-dashboard` |
| I3 | Back from executors returns to dashboard | Navigate via Continue, then tap Back | Returns to `/will-dashboard` |
| I4 | Back does NOT go to previous sub-flow | Complete guardians (celebrate → residue), tap Back | Returns to dashboard, not guardians |

### J. Manual Tests — Route Rename

| # | Test | Steps | Expected |
|---|------|-------|----------|
| J1 | Login redirects to will-dashboard | Log in with existing account | Lands on `/will-dashboard` |
| J2 | Splash screen routes to will-dashboard | Fresh app launch with session | Lands on `/will-dashboard` |
| J3 | Secure account routes to will-dashboard | Complete registration | Lands on `/will-dashboard` |
| J4 | Category navigation fallback correct | Complete last asset category | Returns to `/will-dashboard` |
| J5 | No references to order-of-things remain | `grep -r "order-of-things" --include="*.ts*"` | Zero results |
| J6 | Developer dashboard dropdown works | Open dev dashboard, select "Will Dashboard" | Navigates to `/will-dashboard` |

---

## Phase 2: Navigation Plumbing — Detailed Spec

### Route Audit Summary

**Total routes in app:** 54 .tsx files  
**Implemented flows:** Executors, Guardianship, Bequeathal/Assets  
**Missing flows:** Your People (dedicated), Legal Check, Signing  

---

### Exact Route Mappings

#### Stage 1: "Your People"

| Dashboard Action | Target Route | Status | Notes |
|------------------|--------------|--------|-------|
| Card tap | `/executors/intro` | EXISTS | Entry to executors flow |
| Continue button | `/executors/intro` | EXISTS | First sub-flow in stage |

**Sub-flows within "Your People" (sequential — family first per Jobs feedback):**
1. `/guardianship/intro` → `/guardianship/wishes` ✅ EXISTS (skipped if no children)
2. `/bequeathal/estate-remainder-who` → `/bequeathal/estate-remainder-split` ✅ EXISTS (residue beneficiaries)
3. `/executors/intro` → `/executors/selection` → `/executors/invitation` ✅ EXISTS

**Decision:** No new `/your-people/intro` route needed. Stage 1 uses existing sub-flows in sequence:
- Guardians (if children) → Residue → Executors

**Return routes:** ✅ DONE — Each sub-flow now triggers a celebration animation then auto-navigates to the next sub-flow via `getNextYourPeopleRoute()`. Route rename from `/order-of-things` to `/will-dashboard` completed across all files.

---

#### Stage 2: "Your Estate"

| Dashboard Action | Target Route | Status | Notes |
|------------------|--------------|--------|-------|
| Card tap | `/bequeathal/intro` | EXISTS | Entry to assets flow |
| Continue button | `/bequeathal/intro` | EXISTS | |

**Sub-flows within "Your Estate":**
1. `/bequeathal/intro` → `/bequeathal/categories` ✅ EXISTS
2. Asset type flows (property, bank-accounts, pensions, etc.) ✅ EXISTS
3. Estate division visualization (future enhancement)

**Return routes to update:** Asset flows return to `/bequeathal/categories`. Final completion should return to `/will-dashboard`.

---

#### Stage 3: "Legal Check"

| Dashboard Action | Target Route | Status | Notes |
|------------------|--------------|--------|-------|
| Card tap | `/legal-check/intro` | NEW | Stub route needed |
| Continue button | `/legal-check/intro` | NEW | |

**Sub-flows within "Legal Check" (to be built):**
1. `/legal-check/intro` → NEW
2. `/legal-check/warnings` → NEW (warning flags)
3. `/legal-check/tax-suggestions` → NEW (tax optimization)

---

#### Stage 4: "Ready to Sign"

| Dashboard Action | Target Route | Status | Notes |
|------------------|--------------|--------|-------|
| Card tap (eligible) | `/signing/review` | NEW | |
| Card tap (not eligible) | Show modal | N/A | Explain why, redirect to next incomplete |

**Sub-flows within "Signing" (to be built):**
1. `/signing/review` → NEW
2. `/signing/will-type` → NEW (optional)
3. `/signing/invite-partner` → NEW (smart invite)
4. `/signing/sign` → NEW
5. `/signing/complete` → NEW

---

### Routes to Create

| Route | Purpose | Priority |
|-------|---------|----------|
| `/legal-check/intro` | Entry stub for legal check stage | P1 |
| `/legal-check/warnings` | Warning flags list | P2 |
| `/legal-check/tax-suggestions` | Tax optimization suggestions | P2 |
| `/signing/review` | Will review before signing | P2 |
| `/signing/waiting` | Waiting for acceptances screen | P2 |
| `/signing/sign` | Signing ceremony | P3 |
| `/signing/complete` | Success/completion screen | P3 |

---

### Routes Updated (Return Navigation) ✅ DONE

All `/order-of-things` references replaced with `/will-dashboard`. Sub-flow completion screens now use celebration + auto-progress:

| File | Old Return | New Behaviour | Status |
|------|------------|---------------|--------|
| `app/executors/invitation.tsx` | `/order-of-things` | Celebration → `getNextYourPeopleRoute()` | ✅ Done |
| `app/executors/professional.tsx` | `/order-of-things` | Celebration → `getNextYourPeopleRoute()` | ✅ Done |
| `app/guardianship/wishes.tsx` | `/order-of-things` | Celebration → `getNextYourPeopleRoute()` | ✅ Done |
| `app/bequeathal/categories.tsx` | (stays in flow) | `/will-dashboard` on "Done" | Unchanged |
| `app/auth/secure-account.tsx` | `/order-of-things` | `/will-dashboard` | ✅ Done |
| `app/auth/login.tsx` | `/order-of-things` | `/will-dashboard` | ✅ Done |
| `src/components/splash/SplashScreen.tsx` | `/order-of-things` (6 refs) | `/will-dashboard` | ✅ Done |
| `src/utils/categoryNavigation.ts` | `/order-of-things` (6 refs) | `/will-dashboard` | ✅ Done |
| `src/types/index.ts` | `'order-of-things'` | `'will-dashboard'` | ✅ Done |
| 8 bequeathal entry/intro files | Comments only | Updated comments | ✅ Done |
| `app/order-of-things.tsx` | Legacy dashboard | **Deleted** | ✅ Done |

---

### Orphan Analysis

#### Currently Orphaned Routes

| Route | Status | Recommendation |
|-------|--------|----------------|
| `/will-dashboard` | ✅ Wired as main dashboard | All auth/splash routes updated |
| `/order-of-things` | ✅ **Deleted** | File removed, all references updated |
| `/video-intro` | Deep link only | Keep (attribution flow) |
| `/risk-questionnaire` | Deep link only | Keep (attribution flow) |

#### Commented-Out Routes (Never Built)

These are referenced in `order-of-things.tsx` but routes don't exist:

| Planned Route | Replacement |
|---------------|-------------|
| `/warning-flags` | `/legal-check/warnings` |
| `/optimisations` | `/legal-check/tax-suggestions` |
| `/will-type` | `/signing/will-type` |
| `/review` | `/signing/review` |
| `/sign` | `/signing/sign` |
| `/store` | `/signing/complete` |
| `/estate-summary` | TBD (maybe keep as separate feature) |

---

### Navigation Flow Diagram

```
                    ┌─────────────────────┐
                    │   /will-dashboard   │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐   ┌────────────┐   ┌────────────┐
     │Your People │   │Your Estate │   │Legal Check │
     │  Stage 1   │   │  Stage 2   │   │  Stage 3   │
     └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
           │                │                │
     ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
     │           │    │           │    │           │
     ▼           ▼    ▼           ▼    ▼           ▼
 /executors  /guardian  /bequeathal  (asset   /legal-check  /legal-check
   /intro     /intro      /intro    flows)     /warnings   /tax-suggest
     │           │          │                      │           │
     └───────────┴──────────┴──────────────────────┴───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  All 3 Complete?    │
                    └─────────┬───────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
           ┌──────────────┐    ┌──────────────┐
           │  Acceptances │    │   Can Sign   │
           │   Pending    │    │              │
           └──────┬───────┘    └──────┬───────┘
                  │                   │
                  ▼                   ▼
           /signing/waiting    /signing/review
                                      │
                                      ▼
                               /signing/sign
                                      │
                                      ▼
                              /signing/complete
```

---

### getNextRoute() Implementation ✅ IMPLEMENTED

Lives in `src/utils/willProgress.ts`. Uses `WillProgressState` (not the old `StageState`).

```typescript
// Top-level: walks stages in order
function getNextRoute(state: WillProgressState): string {
  if (deriveYourPeopleStatus(state) !== 'Complete') return getNextYourPeopleRoute(state);
  if (deriveYourEstateStatus(state) !== 'Complete') return '/bequeathal/categories';
  if (deriveLegalCheckStatus(state) !== 'Complete') return '/legal-check';
  return '/will-dashboard';
}

// Stage 1 sub-routing: Guardians → Residue → Executors
function getNextYourPeopleRoute(state: WillProgressState): string {
  if (hasChildrenUnder18(state.people) && !areGuardiansNominated(state.people, state.willData))
    return '/guardianship/intro';
  if (!isResidueAllocated(state.estateRemainderState))
    return '/bequeathal/estate-remainder-who';
  if (!areExecutorsInvited(state.people))
    return '/executors/intro';
  return '/will-dashboard';
}
```

**Also implemented:**
- `getContinueLabel()` — dynamic button text ("Continue to Guardians", etc.)
- `getYourPeopleProgress()` — fractional display ("1/3 done", "2/2 done", "Complete")
- `canSign()` — requires all stages complete + executors accepted + guardians accepted
- `isWaitingForAcceptances()` — stages done but invitees haven't all accepted

---

## Open Questions / Decisions Deferred

1. **Legal Check UI** — Detailed design for warnings and tax suggestions modules (marked as stub)

2. **Partner collaboration flow** — "Deciding this in collaboration with partner?" UX not specified

3. **Smart invite to partner** — Mirror will feature not detailed

4. **Challenge Proof section** — Noted as "hidden, add later"

5. **Existing Tax & Estate Summary button** — Remove from dashboard or relocate?

6. **Sub-flow completion tracking** — How to know executors is complete vs guardianship within Stage 1?

---

## Implementation Order

1. ~~**Create types and helpers** — `willProgress.ts` with status derivation and `getNextRoute()`~~ ✅
2. ~~**Create StageCard component** — Reusable, styled per design tokens~~ ✅
3. ~~**Create ReadyToSignCard component** — With eligible/ineligible states~~ ✅
4. ~~**Create WillDashboardScreen** — Wire up state and navigation~~ ✅
5. ~~**Create GlassMenu** — Glassmorphic bottom sheet with brand colours~~ ✅
6. ~~**Create Celebration** — Confetti + "Nice Work" animation overlay~~ ✅
7. ~~**Route rename** — `/order-of-things` → `/will-dashboard` across 22 files~~ ✅
8. ~~**Wire completion screens** — Celebration + auto-progress in guardians/executors~~ ✅
9. ~~**Delete legacy dashboard** — `app/order-of-things.tsx`~~ ✅
10. **Data model updates** — Asset completion timestamps, verify invitation tracking (Stage 2)
11. **Route stubs** — Add `/legal-check` stub, `/signing/review` stub (Stage 3+)

---

## Success Criteria

- [x] Dashboard shows exactly 3 stage cards + 1 signing card
- [x] No checkboxes visible
- [x] No individual steps listed
- [x] Single "Continue" button navigates correctly (dynamic label)
- [x] Status text uses "Not started" / "In progress" / "Complete" (no percentages)
- [x] Fractional progress display ("1/3 done") on stage sublines
- [ ] Screen fits on iPhone 14/15 without scroll in typical state (visual check needed)
- [ ] All touch targets ≥ 44pt (visual check needed)
- [x] Test cases documented for `getNextRoute()` and all helper functions
- [x] Sub-flow completion triggers celebration + auto-progress (not back to dashboard)
- [x] Dynamic button label reflects next destination
- [x] Back button returns to dashboard via stack (not to previous sub-flow)
- [x] Route rename complete — zero references to `order-of-things`
- [x] Legacy `order-of-things.tsx` deleted
- [x] GlassMenu accessible from dashboard header
