# Will Dashboard Rebuild — Implementation Plan

## Overview

Replace the current 9-item checklist dashboard with a calm, momentum-driven 3-stage view. The screen should feel like "three short steps, then done" rather than administrative overhead.

**Current file:** `app/order-of-things.tsx`  
**New file:** `app/will-dashboard.tsx` (or replace in-place)

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
**Subline:** "Add partner, children, guardians · 3 mins"

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

**Route:** `/your-people/intro` (or existing flow entry point)

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

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/will-dashboard.tsx` | Create | New dashboard screen |
| `src/components/ui/StageCard.tsx` | Create | Reusable stage card |
| `src/components/ui/ReadyToSignCard.tsx` | Create | Signing eligibility card |
| `src/utils/willProgress.ts` | Create | `getNextRoute()` and status derivation helpers |
| `src/utils/__tests__/willProgress.test.ts` | Create | Unit tests for navigation logic |
| `src/types/index.ts` | Modify | Add `AssetCompletionState`, `LegalCheckState` |
| `src/hooks/useAppState.ts` | Modify | Add legal check state management |
| `app/_layout.tsx` | Modify | Update routing if needed |

---

## Test Cases for getNextRoute()

```typescript
describe('getNextRoute', () => {
  it('returns your-people route when stage 1 incomplete', () => {
    expect(getNextRoute({
      yourPeople: 'in_progress',
      yourEstate: 'not_started',
      legalCheck: 'not_started',
      canSign: false,
    })).toBe('/your-people/intro');
  });

  it('returns bequeathal route when stage 1 complete, stage 2 incomplete', () => {
    expect(getNextRoute({
      yourPeople: 'complete',
      yourEstate: 'in_progress',
      legalCheck: 'not_started',
      canSign: false,
    })).toBe('/bequeathal/intro');
  });

  it('returns legal-check route when stages 1-2 complete', () => {
    expect(getNextRoute({
      yourPeople: 'complete',
      yourEstate: 'complete',
      legalCheck: 'not_started',
      canSign: false,
    })).toBe('/legal-check/intro');
  });

  it('returns signing review when all complete and can sign', () => {
    expect(getNextRoute({
      yourPeople: 'complete',
      yourEstate: 'complete',
      legalCheck: 'complete',
      canSign: true,
    })).toBe('/signing/review');
  });

  it('returns waiting screen when complete but acceptances pending', () => {
    expect(getNextRoute({
      yourPeople: 'complete',
      yourEstate: 'complete',
      legalCheck: 'complete',
      canSign: false,
    })).toBe('/signing/waiting');
  });
});
```

---

## Open Questions / Decisions Deferred

1. **Legal Check UI** — Detailed design for warnings and tax suggestions modules (marked as stub)

2. **Partner collaboration flow** — "Deciding this in collaboration with partner?" UX not specified

3. **Smart invite to partner** — Mirror will feature not detailed

4. **Challenge Proof section** — Noted as "hidden, add later"

5. **Existing Tax & Estate Summary button** — Remove from dashboard or relocate?

---

## Implementation Order

1. **Create types and helpers** — `willProgress.ts` with status derivation and `getNextRoute()`
2. **Create StageCard component** — Reusable, styled per design tokens
3. **Create ReadyToSignCard component** — With eligible/ineligible states
4. **Create WillDashboardScreen** — Wire up state and navigation
5. **Add unit tests** — Cover `getNextRoute()` logic
6. **Data model updates** — Asset completion timestamps, verify invitation tracking
7. **Route updates** — Add `/legal-check/intro` stub, `/signing/waiting` stub
8. **Remove/deprecate** — Old `order-of-things.tsx` when ready

---

## Success Criteria

- [ ] Dashboard shows exactly 3 stage cards + 1 signing card
- [ ] No checkboxes visible
- [ ] No individual steps listed
- [ ] Single "Continue" button navigates correctly
- [ ] Status text uses "Not started" / "In progress" / "Complete" (no percentages)
- [ ] Screen fits on iPhone 14/15 without scroll in typical state
- [ ] All touch targets ≥ 44pt
- [ ] Unit tests pass for `getNextRoute()`
