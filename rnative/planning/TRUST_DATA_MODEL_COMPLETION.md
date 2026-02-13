# Trust Data Model Completion Plan

**Problem:** The trust-details form collects 60+ fields via its `TrustData` interface but the persistent `Trust` entity in `src/types/index.ts` only stores ~15 of them. When a user saves a trust and later returns to edit it, most conditional fields (bare trust beneficiary details, life interest sharing, discretionary settings, etc.) are lost.

**Goal:** Persist all fields the form collects across the correct entities, complete the bidirectional mapping (save and load), and do so without breaking the macro structure.

**Constraints:**
- Treat the current `Trust` and `PropertyAsset` interfaces as true north — extend, don't replace
- Maintain the role-based nested object pattern (`settlor?`, `beneficiary?`, `trustee?`)
- No changes to `useAppState.ts` or the `TrustActions` / `BequeathalActions` APIs
- Pre-beta: no backward compatibility baggage. Delete stale fields rather than deprecating. Purge AsyncStorage before testing.

**Design principles:**
- Each field belongs to the entity it is a property of (trust, asset, or role-relationship)
- DRY — if a concept appears across many type+role combinations, it belongs on the parent, not duplicated in sub-objects
- Sub-objects only when there are 2+ fields genuinely specific to that combination; single fields flatten to the parent
- Calculated/derived fields are not persisted
- On save, only populate sub-objects relevant to the current `trustType + trustRole` — stale data from a previously selected role must not leak through

---

## 1. Current State

### What the Trust interface stores today

```typescript
Trust {
  // Core: id, userId, name, type, creationMonth, creationYear, creationDate
  // Roles: isUserSettlor, isUserBeneficiary, isUserTrustee
  
  settlor?: {
    reservedBenefit: 'none' | 'yes';
    benefitDescription?: string;
    beneficiaries: TrustBeneficiary[];
    trusteeIds: string[];
  };
  
  beneficiary?: {
    entitlementType?: string;
    isIPDI?: string;
    rightOfOccupation?: boolean;
    benefitDescription?: string;
    isSettlorOfThisTrust?: string;
    spouseExcludedFromBenefit?: string;
  };
  
  trustee?: { duties?: string[]; coTrusteeIds?: string[]; };
  
  assetIds: string[];
  remaindermanTransferDateUnsure?: boolean;   // DELETE
  remaindermanTransferValueUnsure?: boolean;  // DELETE
  createdAt, updatedAt, createdInContext
}
```

### What PropertyAsset stores today

```typescript
PropertyAsset extends BaseAsset {
  // BaseAsset: id, type, title, estimatedValue, netValue, heldInTrust, ...
  address, usage, propertyType, ownershipType, ownershipPercentage,
  primaryResidence, hasLivedThere, acquisitionMonth, acquisitionYear,
  hasMortgage, mortgage, trustId,
  // + FHL, agricultural, mixed-use, buy-to-let, joint, company fields
}
```

### What the form collects but does NOT persist

The form's `TrustData` interface (in `trust-details.tsx`, lines 40-142) has fields for all 9 implemented trust type + role combinations. Additionally, three separate state arrays (`remaindermen`, `bareBeneficiaries`, `bareCoBeneficiaries`) are managed outside `TrustData`. The vast majority are initialised to defaults during load-from-store.

---

## 2. Where Each Field Belongs

Before designing the interface, we assign every unpersisted field to the entity it is genuinely a property of.

### Asset-level fields → `PropertyAsset`

Transfer value and transfer date describe *when a specific asset entered a trust and what it was worth at that moment*. A trust can hold multiple assets (`assetIds[]`), each transferred at different times and values. These are properties of the asset, not the trust or any role.

| Form fields (all aliases for the same concept) | Belongs on |
|---|---|
| `settlorTransferValue`, `remaindermanTransferValue`, `bareValueAtTransfer`, `discretionaryValueAtTransfer`, `discretionaryBeneficiaryValueAtTransfer` | `PropertyAsset.trustTransferValue` |
| `settlorTransferMonth/Year`, `remaindermanTransferMonth/Year`, `discretionaryTransferMonth/Year`, `discretionaryBeneficiaryTransferMonth/Year` | `PropertyAsset.trustTransferMonth/Year` |
| All `*DateUnknown` / `*ValueUnknown` variants for the above | `PropertyAsset.trustTransferDateUnknown/ValueUnknown` |
| `settlorTransferWithin7Years` | `PropertyAsset.trustTransferWithin7Years` — user-asserted when exact date unknown; not derivable when `trustTransferDateUnknown === true`. The 7-year rule is material to IHT calculation. String → boolean: form `'yes'` → `true`, `'no'` → `false`, `''` → `undefined` (no polarity inversion). |
| `currentlyLiveInProperty` | `PropertyAsset.occupiedByOwner` |

**`occupiedByOwner` vs `primaryResidence`:** These are legally distinct.
- `primaryResidence` = "Is this your main home?" — relevant for **Private Residence Relief** (CGT exemption). You can only have one primary residence.
- `occupiedByOwner` = "Do you currently live in this trust-owned property?" — relevant for **Gift with Reservation of Benefit** (IHT). If you transferred a property into a trust but continue to live in it, HMRC treats it as if you still own it for IHT purposes.

A property can be your primary residence without being trust-owned (no GROB issue). A trust-owned property you occupy may not be your primary residence. The legal contexts do not overlap. GROB risk is derivable: `trustId !== undefined && occupiedByOwner === true`.

### Trust-level fields → `Trust` top-level

Some fields describe the trust itself, independent of any role.

| Form field | Belongs on |
|---|---|
| `chainedTrustStructure` | `Trust.chainedTrustStructure` — the trust has (or doesn't have) a chained structure |
| `lifeInterestTrustCreationDate` | `Trust.preFinanceAct2006` — whether the trust predates the Finance Act 2006; affects IIP treatment |
| `trustRole` | `Trust.userRole` — the exact sub-role string, not just boolean flags |

### Role-relationship fields → `Trust.settlor?` / `Trust.beneficiary?` sub-objects

Everything remaining is genuinely about the user's role-relationship with the trust. These stay in the role-based nested objects.

---

## 3. Proposed Changes

### 3A. Extend `PropertyAsset`

**File:** `src/types/index.ts`

Add alongside the existing `trustId?: string`:

```typescript
export interface PropertyAsset extends BaseAsset {
  // ... existing fields ...
  
  // Trust reference (existing)
  trustId?: string;
  
  // NEW — Trust transfer details (when this asset entered the trust)
  trustTransferMonth?: string;
  trustTransferYear?: string;
  trustTransferDateUnknown?: boolean;
  trustTransferValue?: number;
  trustTransferValueUnknown?: boolean;
  /** User-asserted "within last 7 years" when exact date unknown. Material to IHT 7-year rule.
   *  true = within 7 years (PET still in window), false = over 7 years (fully exempt), undefined = not asked.
   *  Only meaningful when trustTransferDateUnknown === true. */
  trustTransferWithin7Years?: boolean;
  /** Does the user currently live in this trust-owned property? Relevant for GROB detection.
   *  Distinct from primaryResidence (PPR/CGT) — see plan Section 2 for legal distinction. */
  occupiedByOwner?: boolean;
}
```

### 3B. Extend `Trust` top-level

**File:** `src/types/index.ts`

Delete `remaindermanTransferDateUnsure` and `remaindermanTransferValueUnsure` (pre-beta, no production data to migrate).

```typescript
export interface Trust {
  // ... existing core fields ...
  
  // NEW — Explicit sub-role (source of truth for the specific role the user selected)
  userRole?: string;  // e.g. 'life_interest', 'remainderman', 'settlor', 'settlor_and_beneficial_interest', 'beneficiary', 'settlor_and_beneficiary'
  
  // NEW — Trust-level characteristics
  chainedTrustStructure?: boolean;
  preFinanceAct2006?: 'before_2006' | 'on_or_after_2006';  // undefined = not yet answered
  
  // ... role objects, assetIds, metadata ...
  
  // DELETE these two fields (were remainderman-specific, now on PropertyAsset):
  // remaindermanTransferDateUnsure?: boolean;
  // remaindermanTransferValueUnsure?: boolean;
}
```

### 3C. Extend `Trust.settlor?`

The existing `settlor` fields (`reservedBenefit`, `benefitDescription`, `beneficiaries`, `trusteeIds`) are unchanged.

```typescript
settlor?: {
  // Existing fields (UNCHANGED)
  reservedBenefit: 'none' | 'yes';
  benefitDescription?: string;
  beneficiaries: TrustBeneficiary[];
  trusteeIds: string[];
  
  // NEW — Life Interest Settlor fields
  lifeInterest?: {
    noBenefitConfirmed: boolean;
    payingMarketRent: 'yes' | 'no' | '';
    lifeInterestEndingEvents: string;
    remaindermen: TrustBeneficiary[];
    // Settlor + Beneficial Interest sub-role
    beneficialInterestType: string;
    wantsReview: boolean;
  };
  
  // NEW — Discretionary Settlor (single field, flattened)
  discretionaryComplexSituation?: boolean;
};
```

**Note:** `settlor.bare` sub-object is not needed — after moving transfer fields to `PropertyAsset`, bare trust settlor data is fully captured by core `settlor` fields + asset-level transfer fields.

### 3D. Extend `Trust.beneficiary?`

The existing `beneficiary` fields are unchanged.

```typescript
beneficiary?: {
  // Existing fields (UNCHANGED)
  entitlementType?: 'right_to_income' | 'right_to_use' | 'both' | 'other';
  isIPDI?: 'yes' | 'no' | 'not-sure';
  rightOfOccupation?: boolean;
  benefitDescription?: string;
  isSettlorOfThisTrust?: 'yes' | 'no';
  spouseExcludedFromBenefit?: 'yes' | 'no' | 'not_sure';
  
  // NEW — Life Interest Beneficiary (life tenant) fields
  lifeInterest?: {
    spouseSuccession: 'yes' | 'no' | '';
    sharing: 'not_shared' | 'shared_equally' | 'shared_unequally' | 'successive' | '';
    equalSharingCount: number;
    unequalSharingPercentage: number;
    successiveCurrentTenant: string;
    successiveCurrentStatus: 'not_started' | 'active' | 'not_sure' | '';
    hasComplexCircumstances: boolean;
  };
  
  // NEW — Life Interest Remainderman fields
  remainderman?: {
    lifeTenantAlive: 'yes' | 'no' | 'not_sure' | '';
    ownershipClarification: 'now_own' | 'not_sure' | '';
    lifeTenantAge: number;
    settlorAlive: 'yes' | 'no' | 'not_sure' | '';
    successionBeneficiary: string;
  };
  
  // NEW — Bare Trust Beneficiary fields (also holds coBeneficiaries for S&B context)
  bare?: {
    percentage: number;
    percentageUnknown: boolean;
    shareWithOthers: 'yes' | 'no' | '';
    numberOfOthers: string;
    giftedByLivingSettlor: 'yes_less_than_7' | 'yes_more_than_7' | 'no_not_sure' | '';
    giftMonth: string;
    giftYear: string;
    coBeneficiaries: TrustBeneficiary[];
  };
  
  // NEW — Discretionary Beneficiary (single field, flattened)
  discretionaryInsurancePolicy?: 'yes' | 'no' | 'unsure' | '';
  
  // NEW — Discretionary Settlor & Beneficiary (flattened)
  discretionarySettlorBeneficiarySpouseExcluded?: 'yes' | 'no' | 'not_sure' | '';
  discretionarySettlorBeneficiaryComplexSituation?: boolean;
};
```

**Note:** `bareSettlorAndBeneficiary` sub-object removed. After moving `currentlyLiveInProperty` to `PropertyAsset.occupiedByOwner` and `valueAtTransfer` to `PropertyAsset.trustTransferValue`, the only remaining field was `coBeneficiaries[]`. Since the form uses a single `bareCoBeneficiaries` state variable for both bare beneficiary and bare S&B contexts, the co-beneficiaries array is consolidated on `beneficiary.bare.coBeneficiaries`. The role (`isUserSettlor` + `isUserBeneficiary`) determines the context.

**IMPORTANT — Bare S&B save scoping:** When `trustType === 'bare'` and `trustRole === 'settlor_and_beneficiary'`, create `beneficiary.bare` with **only** `{ coBeneficiaries }`. Do NOT populate `percentage`, `percentageUnknown`, `shareWithOthers`, `numberOfOthers`, `giftedByLivingSettlor`, `giftMonth`, or `giftYear` — those are bare-beneficiary-only fields (asked only when `trustRole === 'beneficiary'`). The interface defines all fields on one sub-object for simplicity, but on save, only the fields relevant to the current role are written.

### 3E. `Trust.trustee?` — UNCHANGED

No new fields needed for the 9 implemented combinations.

---

## 4. Design Decisions

| Decision | Reasoning |
|---|---|
| Transfer value/date/unknown on `PropertyAsset`, not `Trust` | A trust can hold multiple assets; each has its own transfer event. Storing once on the asset eliminates 6 duplicate value fields and 4 duplicate date field pairs. |
| `trustTransferWithin7Years` on `PropertyAsset` | When the user doesn't know the exact transfer date, they may still know whether it was within the last 7 years. The 7-year rule is material to IHT. Polarity matches the form question directly — no inversion needed. Only relevant when `trustTransferDateUnknown === true`. |
| `occupiedByOwner` on `PropertyAsset`, separate from `primaryResidence` | Legally distinct: `primaryResidence` = PPR/CGT, `occupiedByOwner` = GROB/IHT. A property can be trust-owned and occupied without being your primary residence. |
| `chainedTrustStructure` on Trust top-level | A property of the trust deed, not of any role. |
| `preFinanceAct2006` as `'before_2006' \| 'on_or_after_2006' \| undefined` | Three-state: before, after, or not yet answered. A boolean would conflate "not yet answered" with one of the states. Direct mapping to/from the form — no encode/decode needed. |
| `userRole` on Trust top-level | The exact sub-role string (`'life_interest'`, `'remainderman'`, `'settlor_and_beneficial_interest'`, etc.). Eliminates fragile inference from `isUserSettlor` + `isUserBeneficiary` + "which sub-object is populated" on load. Boolean flags kept for quick checks. |
| Delete `remaindermanTransferDateUnsure/ValueUnsure` from Trust | Pre-beta, no production data. These belong on PropertyAsset now. Clean delete, no deprecation baggage. |
| No `settlor.bare` sub-object | After moving transfer fields to PropertyAsset, bare trust settlor has zero role-specific fields. |
| No `bareSettlorAndBeneficiary` sub-object | After moving `currentlyLiveInProperty` and `valueAtTransfer` to PropertyAsset, only `coBeneficiaries[]` remained. Consolidated on `beneficiary.bare.coBeneficiaries`. |
| Discretionary single fields flattened to parent | `settlor.discretionaryComplexSituation` and `beneficiary.discretionaryInsurancePolicy` are single booleans/enums. Sub-objects for one field add nesting without benefit. |
| `beneficiary.lifeInterest.isIPDI` NOT duplicated | Already exists at `beneficiary.isIPDI`. One source of truth. |
| `bareBeneficiaryEstimatedPercentage`, `bareBeneficiaryTotalUnknownBeneficiaries`, `benefitType` NOT persisted | Calculated/derived from other fields. Recalculate on load. |
| Role-aware switch for save mapping, not OR-chains | JavaScript `\|\|` treats `0` as falsy (a gifted property has value 0). Stale values from a previously-selected role can leak through. A `trustType + trustRole` switch picks exactly one correct alias. Use `??` within branches. |
| On save, only populate sub-objects for the current role | Prevents stale data from a previous role selection persisting. If a user fills settlor fields then switches to beneficiary, settlor sub-objects are not written. |
| `'other'` trust type is a pass-through | No new sub-objects, no transfer fields, no role-specific mapping needed. Only core fields (name, type, creationMonth/Year) are persisted. The save and load functions should handle `'other'` by writing/reading core fields only and returning `undefined` for all role-aware switch helpers. |

---

## 5. Dead Code — Audit Complete

All 9 dead `TrustData` fields have been audited. **All are dead code — remove.**

| Field | UI input? | Rendered? | Only usage | Verdict |
|---|---|---|---|---|
| `propertyValueAtTransfer` | No `updateTrustData` call | No | Default init only | **DEAD — remove** |
| `settlorStillLiving` | No | No | Legacy validation block (line 2286) | **DEAD — remove** |
| `lifeInterestBeganOnPassing` | No | No | Legacy validation block (line 2286) | **DEAD — remove** |
| `lifeInterestBeganWhen` | No | No | Legacy validation block (line 2292) | **DEAD — remove** |
| `shareLifeInterestWithOthers` | No | No | Legacy validation block (line 2287) | **DEAD — remove** |
| `lifeInterestPercentage` | No | No | Legacy validation block (line 2293) | **DEAD — remove** |
| `capitalInterestPercentage` | No | No | Legacy validation block (line 2299) | **DEAD — remove** |
| `lifeTenantAge` (string) | No | No — helper key at line 1257 uses a string literal, not the data field. Actual input writes to `remaindermanLifeTenantAge` (number). | Default init only | **DEAD — remove** |
| `knownContingencies` | No | No | Default init only | **DEAD — remove** |

The legacy validation block itself (lines 2280-2301, triggered by `trustType === 'life_interest' && trustRole === 'beneficiary'`) is also dead code: the life interest role options are `'life_interest'`, `'remainderman'`, `'settlor'`, `'settlor_and_beneficial_interest'`. There is no `'beneficiary'` option.

**Action:** Remove all 9 fields from `TrustData`, remove their defaults from both init blocks, and remove the dead validation block (lines 2280-2301).

---

## 6. Implementation Plan

### Step 1: Extract mapping into `trustDataMapping.ts`

**New file:** `app/bequeathal/property/trustDataMapping.ts`

Before adding new fields, extract the existing save/load mapping logic out of the 2900-line `trust-details.tsx`. This ensures:
- Both save paths (sandbox/normal) call the same function from day one
- Adding 40+ new field mappings is mechanical, not error-prone
- The mapping logic is testable in isolation

**Where to find the code to extract:**
- **Save logic:** Inside `handleSave()` — search for `const trustEntityData`. This block builds the object that gets written to the Trust entity. Both the sandbox and normal save paths build a similar object — this duplication is what we're eliminating.
- **Load logic:** In the `useEffect` that runs when `trustId` changes — search for `setTrustData({` inside the trust-loading effect (approximately lines 312-458). This block reads from the Trust entity and populates the form's `TrustData` state.

**Functions to extract:**
- `buildTrustEntityData(trustData, remaindermen, bareBeneficiaries, bareCoBeneficiaries): Partial<Trust>`
- `buildPropertyTransferData(trustData): Partial<PropertyAsset>`
- `loadTrustToFormData(trust, property): TrustData`
- `loadStateArrays(trust): { remaindermen, bareBeneficiaries, bareCoBeneficiaries }`
- Role-aware switch helpers: `getTransferValue(trustData)`, `getTransferMonth(trustData)`, etc.

**Estimated effort:** 45 minutes

### Step 2: Clean up dead code

**File:** `app/bequeathal/property/trust-details.tsx`

Remove all 9 dead fields from `TrustData` interface (see Section 5), remove their defaults from both init blocks, and remove the dead validation block (lines 2280-2301).

**File:** `src/types/index.ts`

Delete `remaindermanTransferDateUnsure` and `remaindermanTransferValueUnsure` from the `Trust` interface.

**Estimated effort:** 15 minutes

### Step 3: Extend `PropertyAsset` interface

**File:** `src/types/index.ts`

Add 7 new fields to `PropertyAsset` as shown in Section 3A (`trustTransferMonth`, `trustTransferYear`, `trustTransferDateUnknown`, `trustTransferValue`, `trustTransferValueUnknown`, `trustTransferWithin7Years`, `occupiedByOwner`).

**Estimated effort:** 5 minutes

### Step 4: Extend `Trust` interface

**File:** `src/types/index.ts`

Add `userRole`, `chainedTrustStructure`, `preFinanceAct2006` to top level. Extend `settlor?` with `lifeInterest?` sub-object and `discretionaryComplexSituation`. Extend `beneficiary?` with `lifeInterest?`, `remainderman?`, `bare?` sub-objects and flattened discretionary fields.

**Estimated effort:** 20 minutes

### Step 5: Implement save mapping — role-aware switches

**File:** `app/bequeathal/property/trustDataMapping.ts`

Implement `buildPropertyTransferData()` and `buildTrustEntityData()` using role-aware switch functions (not OR-chains). Use `??` (nullish coalescing) throughout to handle `0` correctly. Example:

```typescript
function getTransferValue(trustData: TrustData): number | undefined {
  const { trustType, trustRole } = trustData;
  if (trustType === 'life_interest') {
    if (trustRole === 'settlor' || trustRole === 'settlor_and_beneficial_interest')
      return trustData.settlorTransferValue ?? undefined;
    if (trustRole === 'remainderman') return trustData.remaindermanTransferValue ?? undefined;
  }
  if (trustType === 'bare') {
    if (trustRole === 'settlor_and_beneficiary') return trustData.bareValueAtTransfer ?? undefined;
  }
  if (trustType === 'discretionary') {
    if (trustRole === 'settlor') return trustData.discretionaryValueAtTransfer ?? undefined;
    if (trustRole === 'beneficiary') return trustData.discretionaryBeneficiaryValueAtTransfer ?? undefined;
  }
  return undefined;
}
// The complete list of role-aware switch helpers (7 total):
// 1. getTransferValue        — same pattern as above, all 5 value aliases
// 2. getTransferMonth        — same pattern, all 4 month aliases
// 3. getTransferYear         — same pattern, all 4 year aliases
// 4. getTransferDateUnknown  — same pattern, all 5 dateUnknown aliases
// 5. getTransferValueUnknown — same pattern, all 6 valueUnknown aliases
// 6. getTransferWithin7Years — ONLY returns a value for life_interest + settlor/S&BI
//    (this question is only asked in the LI Settlor path; all other combos → undefined)
// 7. getOccupiedByOwner      — ONLY returns a value for bare + settlor_and_beneficiary
//    (this question is only asked in the Bare S&B path; all other combos → undefined)
```

**All 7 helpers must be implemented.** Helpers 6 and 7 are easy to miss because they are 1:1 mappings (not many-to-one like 1–5), but they still need role-aware gating. A developer must NOT write `occupiedByOwner` for every trust type — only Bare S&B populates it. Same for `trustTransferWithin7Years` — only LI Settlor populates it.

Only populate sub-objects relevant to the current `trustType + trustRole`. Do not write stale data from other roles.

**Estimated effort:** 45 minutes

### Step 6: Implement load mapping

**File:** `app/bequeathal/property/trustDataMapping.ts`

Implement `loadTrustToFormData()` and `loadStateArrays()`. Use `trust.userRole` to determine which sub-objects to read from.

**Handling `userRole === undefined`:** This is the normal state when creating a new trust (user hasn't picked a role yet). If `trust.userRole` is `undefined`, fall back to inferring from `isUserSettlor` + `isUserBeneficiary` + `trust.type`. If all are empty/false (brand new trust), return form defaults — do not crash on undefined access. The load function must always be safe to call with a partially-populated Trust object.

Load transfer fields from `PropertyAsset`:
```typescript
settlorTransferValue: property?.trustTransferValue ?? 0,
remaindermanTransferValue: property?.trustTransferValue ?? 0,
// ... all aliases populated from the single source
```

Use `??` (nullish coalescing) not `||` to handle `0` correctly.

**Estimated effort:** 45 minutes

### Step 7: Wire up and verify

**File:** `app/bequeathal/property/trust-details.tsx`

Replace inline save/load logic with calls to extracted functions. Verify both save paths use the same mapping. Run through test plan (Section 8).

**Estimated effort:** 30 minutes

**Total estimated effort:** ~3.5 hours

---

## 7. Complete Field Mapping Reference

### Asset-level fields → `PropertyAsset`

| TrustData field(s) | PropertyAsset field | Notes |
|---|---|---|
| `settlorTransferValue`, `remaindermanTransferValue`, `bareValueAtTransfer`, `discretionaryValueAtTransfer`, `discretionaryBeneficiaryValueAtTransfer` | `trustTransferValue` | 5 form aliases → 1 stored field. Role-aware switch selects the correct alias on save. Use `??` not `\|\|`. |
| `settlorTransferMonth`, `remaindermanTransferMonth`, `discretionaryTransferMonth`, `discretionaryBeneficiaryTransferMonth` | `trustTransferMonth` | 4 form aliases → 1 stored field |
| `settlorTransferYear`, `remaindermanTransferYear`, `discretionaryTransferYear`, `discretionaryBeneficiaryTransferYear` | `trustTransferYear` | 4 form aliases → 1 stored field |
| `lifeInterestDateUnknown`, `bareSettlorDateUnknown`, `remaindermanTransferDateUnsure`, `discretionarySettlorDateUnknown`, `discretionaryBeneficiaryDateUnknown` | `trustTransferDateUnknown` | 5 form aliases → 1 stored field |
| `lifeInterestValueUnknown`, `bareSettlorValueUnknown`, `bareSettlorAndBeneficiaryValueUnknown`, `remaindermanTransferValueUnsure`, `discretionarySettlorValueUnknown`, `discretionaryBeneficiaryValueUnknown` | `trustTransferValueUnknown` | 6 form aliases → 1 stored field |
| `settlorTransferWithin7Years` | `trustTransferWithin7Years` | String → boolean: form `'yes'` → `true`, `'no'` → `false`, `''` → `undefined`. Only meaningful when `trustTransferDateUnknown === true`. |
| `currentlyLiveInProperty` | `occupiedByOwner` | String → boolean: `'yes'` → `true`, `'no'` → `false`, `''` → `undefined` |

### Trust-level fields → `Trust` top-level

| TrustData field | Trust field | Notes |
|---|---|---|
| `trustRole` | `userRole` | Direct string. Source of truth for specific sub-role on load. |
| `chainedTrustStructure` | `chainedTrustStructure` | Direct |
| `lifeInterestTrustCreationDate` | `preFinanceAct2006` | Direct: `'before_2006'` ↔ `'before_2006'`, `'on_or_after_2006'` ↔ `'on_or_after_2006'`, `''` ↔ `undefined` |

### Core fields (already mapped, unchanged)

| TrustData field | Trust field |
|---|---|
| `trustName` | `name` |
| `trustType` | `type` (via enum map) |
| `trustRole` | `isUserSettlor` / `isUserBeneficiary` flags (kept alongside `userRole`) |
| `creationMonth` | `creationMonth` |
| `creationYear` | `creationYear` |
| `reservedBenefit` | `settlor.reservedBenefit` |
| `interestType` | `beneficiary.entitlementType` |
| `spouseExcludedFromBenefit` | `beneficiary.spouseExcludedFromBenefit` |
| `lifeInterestIsIPDI` | `beneficiary.isIPDI` (already exists — map form `''` to `'not-sure'`) |
| `bareBeneficiaries[]` | `settlor.beneficiaries` |

### Settlor role fields → `Trust.settlor`

| TrustData field | Trust entity location | Status |
|---|---|---|
| `settlorNoBenefitConfirmed` | `settlor.lifeInterest.noBenefitConfirmed` | **NEW** |
| `payingMarketRent` | `settlor.lifeInterest.payingMarketRent` | **NEW** |
| `lifeInterestEndingEvents` | `settlor.lifeInterest.lifeInterestEndingEvents` | **NEW** |
| `settlorAndBeneficialBenefitType` | `settlor.lifeInterest.beneficialInterestType` | **NEW** |
| `settlorAndBeneficialWantsReview` | `settlor.lifeInterest.wantsReview` | **NEW** |
| `remaindermen[]` (state array) | `settlor.lifeInterest.remaindermen` | **NEW** |
| `discretionaryComplexSituation` (settlor context) | `settlor.discretionaryComplexSituation` | **NEW** (flattened) |

### Beneficiary role fields → `Trust.beneficiary`

| TrustData field | Trust entity location | Status |
|---|---|---|
| `lifeInterestSpouseSuccession` | `beneficiary.lifeInterest.spouseSuccession` | **NEW** |
| `lifeInterestSharing` | `beneficiary.lifeInterest.sharing` | **NEW** |
| `lifeInterestEqualSharingCount` | `beneficiary.lifeInterest.equalSharingCount` | **NEW** |
| `lifeInterestUnequalSharingPercentage` | `beneficiary.lifeInterest.unequalSharingPercentage` | **NEW** |
| `lifeInterestSuccessiveCurrentTenant` | `beneficiary.lifeInterest.successiveCurrentTenant` | **NEW** |
| `lifeInterestSuccessiveCurrentStatus` | `beneficiary.lifeInterest.successiveCurrentStatus` | **NEW** |
| `hasComplexCircumstances` | `beneficiary.lifeInterest.hasComplexCircumstances` | **NEW** |
| `remaindermanLifeTenantAlive` | `beneficiary.remainderman.lifeTenantAlive` | **NEW** |
| `remaindermanOwnershipClarification` | `beneficiary.remainderman.ownershipClarification` | **NEW** |
| `remaindermanLifeTenantAge` | `beneficiary.remainderman.lifeTenantAge` | **NEW** |
| `remaindermanSettlorAlive` | `beneficiary.remainderman.settlorAlive` | **NEW** |
| `remaindermanSuccessionBeneficiary` | `beneficiary.remainderman.successionBeneficiary` | **NEW** |
| `bareBeneficiaryPercentage` | `beneficiary.bare.percentage` | **NEW** |
| `bareBeneficiaryPercentageUnknown` | `beneficiary.bare.percentageUnknown` | **NEW** |
| `bareBeneficiaryShareWithOthers` | `beneficiary.bare.shareWithOthers` | **NEW** |
| `bareBeneficiaryNumberOfOthers` | `beneficiary.bare.numberOfOthers` | **NEW** |
| `bareBeneficiaryGiftedByLivingSettlor` | `beneficiary.bare.giftedByLivingSettlor` | **NEW** |
| `bareBeneficiaryGiftMonth` | `beneficiary.bare.giftMonth` | **NEW** |
| `bareBeneficiaryGiftYear` | `beneficiary.bare.giftYear` | **NEW** |
| `bareCoBeneficiaries[]` (both beneficiary and S&B contexts) | `beneficiary.bare.coBeneficiaries` | **NEW** |
| `discretionaryBeneficiaryInsurancePolicy` | `beneficiary.discretionaryInsurancePolicy` | **NEW** (flattened) |
| `discretionarySettlorAndBeneficiarySpouseExcluded` | `beneficiary.discretionarySettlorBeneficiarySpouseExcluded` | **NEW** (flattened) |
| `discretionaryComplexSituation` (S&B context) | `beneficiary.discretionarySettlorBeneficiaryComplexSituation` | **NEW** (flattened) |

### Not persisted (calculated / derived) — KEEP on TrustData, do NOT save to Trust

**Clarification:** "Not persisted" means the field **stays on `TrustData`** for runtime use (rendering, conditional logic) but is **not written to the `Trust` entity** on save. These fields are recalculated or auto-set during load. Do NOT delete them from `TrustData` — they are actively used by the component at runtime.

| TrustData field | Reason |
|---|---|
| `bareBeneficiaryEstimatedPercentage` | Calculated from percentage and numberOfOthers |
| `bareBeneficiaryTotalUnknownBeneficiaries` | Calculated from numberOfOthers |
| `benefitType` | Auto-set from `trustRole` (life_interest / remainderman) — used for render path gating |

### Dead code — DELETE from TrustData entirely

| Field | Reason |
|---|---|
| `propertyValueAtTransfer` | No UI input, no render — superseded by `settlorTransferValue` |
| `settlorStillLiving` | No UI input, no render — only in dead legacy validation block |
| `lifeInterestBeganOnPassing` | Same |
| `lifeInterestBeganWhen` | Same |
| `shareLifeInterestWithOthers` | Same |
| `lifeInterestPercentage` | Same |
| `capitalInterestPercentage` | Same |
| `lifeTenantAge` (string) | Superseded by `remaindermanLifeTenantAge` (number) |
| `knownContingencies` | No usage beyond default init |

---

## 8. Test Plan

### Precursor: Purge all data before testing

These changes alter the `Trust` and `PropertyAsset` data structures (fields deleted, fields added, fields moved between entities). **Before running any tests, clear all AsyncStorage data.** Old data structures are incompatible and will cause misleading test results.

**Steps:**
1. Open the app's data viewer / debug menu
2. Clear all AsyncStorage (or uninstall and reinstall the app)
3. Confirm the estate dashboard shows no assets
4. Proceed with tests below using freshly created data only

### 8A. PropertyAsset transfer field persistence (per trust type + role)

For each of the 9 trust type + role combinations:

| # | Test | Steps | Expected |
|---|---|---|---|
| 1 | **Life Interest > Settlor — value saves** | Create trust-owned property. Select Life Interest > Settlor. Enter transfer value £250,000, month March, year 2019. Save. Check data viewer. | `PropertyAsset.trustTransferValue === 250000`, `trustTransferMonth === '3'`, `trustTransferYear === '2019'` |
| 2 | **Life Interest > Settlor — value of 0 saves** | Same as above but enter £0 (gift). Save. Check data viewer. | `PropertyAsset.trustTransferValue === 0` (not `undefined`) |
| 3 | **Life Interest > Settlor — date unknown + within 7 years** | Select "I don't know" for transfer date. Answer "within last 7 years" = yes. Save. Check. | `trustTransferDateUnknown === true`, `trustTransferWithin7Years === true` |
| 4 | **Life Interest > Settlor — date unknown + over 7 years** | Select "I don't know" for transfer date. Answer "within last 7 years" = no. Save. Check. | `trustTransferDateUnknown === true`, `trustTransferWithin7Years === false` |
| 5 | **Life Interest > Remainderman** | Enter remainderman transfer details. Save. Check. | Same PropertyAsset fields populated from remainderman aliases |
| 6 | **Bare > Settlor** | Enter bare trust date/value unknowns. Save. Check. | `trustTransferDateUnknown` / `trustTransferValueUnknown` populated |
| 7 | **Bare > S&B** | Enter S&B details including "do you live here?" = yes. Save. Check. | `occupiedByOwner === true`, `trustTransferValue` populated |
| 8 | **Discretionary > Settlor** | Enter discretionary transfer details. Save. Check. | Transfer fields on PropertyAsset |
| 9 | **Discretionary > Beneficiary** | Enter discretionary beneficiary transfer details. Save. Check. | Transfer fields on PropertyAsset |
| 10 | **Role switch — stale data** | Start as Settlor, enter value £100k. Switch to Beneficiary, enter value £200k. Save. Check. | `trustTransferValue === 200000` (not £100k from stale settlor data) |

### 8B. Trust sub-object persistence (per trust type + role)

| # | Test | Steps | Expected |
|---|---|---|---|
| 11 | **LI Settlor — lifeInterest sub-object** | Fill all LI settlor fields. Save. Navigate away. Return. | All fields restored: `noBenefitConfirmed`, `payingMarketRent`, `lifeInterestEndingEvents`, `remaindermen[]` |
| 12 | **LI Settlor+Beneficial — beneficial fields** | Fill beneficial interest type and wants review. Save. Return. | `beneficialInterestType` and `wantsReview` restored |
| 13 | **LI Beneficiary — lifeInterest sub-object** | Fill sharing, spouse succession, etc. Save. Return. | All fields restored |
| 14 | **LI Remainderman — remainderman sub-object** | Fill life tenant alive, age, settlor alive, succession. Save. Return. | All fields restored |
| 15 | **Bare Beneficiary — bare sub-object** | Fill percentage, share with others, gifted by settlor, co-beneficiaries. Save. Return. | All fields restored, including `coBeneficiaries[]` |
| 16 | **Bare S&B — co-beneficiaries on bare** | Fill co-beneficiaries as S&B. Save. Return. | `beneficiary.bare.coBeneficiaries` populated |
| 17 | **Discretionary Settlor — complexSituation** | Set complex situation flag. Save. Return. | `settlor.discretionaryComplexSituation === true` |
| 18 | **Discretionary Beneficiary — insurancePolicy** | Set insurance policy. Save. Return. | `beneficiary.discretionaryInsurancePolicy` populated |
| 19 | **Discretionary S&B — spouse excluded** | Set spouse exclusion. Save. Return. | `beneficiary.discretionarySettlorBeneficiarySpouseExcluded` populated |

### 8C. Trust-level and role fields

| # | Test | Steps | Expected |
|---|---|---|---|
| 20 | **userRole saved** | Select any role. Save. Check data viewer. | `trust.userRole` matches the selected role string |
| 21 | **userRole used on load** | Save as remainderman. Navigate away. Return. | Form auto-selects "Remainderman" role (using `userRole`) |
| 22 | **preFinanceAct2006 — before** | Select "before 2006". Save. Check. | `trust.preFinanceAct2006 === 'before_2006'` |
| 23 | **preFinanceAct2006 — after** | Select "on or after 2006". Save. Check. | `trust.preFinanceAct2006 === 'on_or_after_2006'` |
| 24 | **preFinanceAct2006 — unanswered** | Don't answer the question. Save. Check. | `trust.preFinanceAct2006 === undefined` |
| 25 | **chainedTrustStructure** | Set chained trust. Save. Return. | `trust.chainedTrustStructure === true` |

### 8D. Edge cases

| # | Test | Steps | Expected |
|---|---|---|---|
| 26 | **Value of 0 round-trips** | Enter transfer value £0. Save. Navigate away. Return. | Field shows £0, not blank/undefined |
| 27 | **occupiedByOwner vs primaryResidence independent** | Set primaryResidence = yes, occupiedByOwner = no. Save. Check. | Both fields independent in data viewer |
| 28 | **Draft interop** | Start filling trust details (trigger draft save). Navigate away (draft flushed). Return. Restore draft. Save. | Draft restores all form fields. After saving, PropertyAsset transfer fields and Trust sub-objects are populated correctly. |

---

## 9. Concerns and Technical Debt

### 9.1 `reservedBenefit` mapping is lossy

The form captures `reservedBenefit` as a multi-value string (`'none'`, `'income_only'`, `'right_to_occupy'`, `'income_and_occupation'`). But `Trust.settlor.reservedBenefit` is typed `'none' | 'yes'`, losing the specific benefit type. Consider widening the type to the full enum in a future pass.

### 9.2 `TrustData` interface lives in the component file

Defined inside `trust-details.tsx`, not in `src/types/index.ts`. Fine for form-local state, but a risk if other components ever need trust form data. Consider moving it alongside `Trust` in a future cleanup.

### 9.3 Future trust flow expansion

The Notion planning doc recommends adding trust flows to Agricultural Assets, Private Company Shares, and Investments. When that happens, the `trustTransfer*` fields pattern should be added to `BaseAsset` (or those specific asset types) rather than duplicating the PropertyAsset approach. This design is forward-compatible.

### 9.4 GROB risk derivation

GROB risk is derivable: `trustId !== undefined && occupiedByOwner === true`. Consider adding a computed `hasGROBRisk` getter when the advisory/flagging system is built, rather than storing a derived boolean.
