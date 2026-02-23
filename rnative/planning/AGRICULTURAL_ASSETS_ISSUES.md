# Agricultural Assets — Issues from Manual Testing

Extracted from `TEST_AGRICULTURAL_ASSETS.md` — all non-straight-pass results.

---

## Issue 1: Remove "Not sure" ownership option (B-6)

**Test:** B-6 — Not sure ownership
**Result:** User comment: "Let's remove this option - if you're not sure who/how it's owned, how do you know you own it!"
**Action:** Remove the "Not sure" option from the ownership RadioGroup. Also need to:
- Remove `'not-sure'` from the `ownershipOptions` array
- Remove `'not-sure'` from the `AgriculturalAsset` type union for `aprOwnershipStructure`
- Update test G-7 (which tests BPR behaviour for "not-sure" ownership) — this test becomes obsolete
- Check if any saved data references `'not-sure'` and handle gracefully

**File:** `app/bequeathal/agricultural-assets/entry.tsx`
**Type:** `src/types/index.ts`

---

## Issue 2: Trust type field — business logic question (B-4)

**Test:** B-4 — Trust ownership
**Result:** Pass, but user asks: "Should this not be a drop down of trust type, then role? BUSINESS LOGIC QUESTION"
**Current behaviour:** A free-text `Input` for trust type appears in the APR section.
**Question:** Should this be structured data (dropdown of trust types + a role field) rather than free text?
**Action:** Requires business logic decision — what trust types and roles are relevant for agricultural property? Once decided, replace `Input` with structured fields.

**File:** `app/bequeathal/agricultural-assets/entry.tsx`

---

## Issue 3: Validation attention styling not implemented (K-5)

**Test:** K-5 — Validation attention trigger
**Result:** FAIL — "While attention label below submit is working and autoscrolling to first invalid field, we have not implemented the attention styling (red border on inputs etc) that we have implemented in other asset categories. This must be replicated."
**Action:** Wire `error` props from `useFormValidation` to form components (`RadioGroup`, `SearchableSelect`, `Input`) so red border highlighting appears on invalid fields when validation is triggered. This was already noted in Known Gaps #1.

**File:** `app/bequeathal/agricultural-assets/entry.tsx`

---

## Issue 4: Net value not reflected on summary card with debts (L-5)

**Test:** L-5 — Net value reflects debts
**Result:** FAIL — "and this I guess will impact totals?"
**Action:** Investigate why the summary card is not showing net value (after debt deduction). The data is being saved correctly (M-4 passed with `netValue: 400000`), so this is likely a display issue in the summary card or the `getAssetTitle`/value display logic. May also impact the category total.

**File:** `src/components/screens/CategorySummaryScreen.tsx` or `src/components/ui/AssetCard.tsx` (need to investigate which renders the value)

---

## Summary

| # | Issue | Severity | Type |
|---|-------|----------|------|
| 1 | Remove "Not sure" ownership option | Low | UX change |
| 2 | Trust type — structured vs free text | Medium | Business logic decision |
| 3 | Validation attention styling missing | Medium | Bug — parity with other categories |
| 4 | Net value not shown on summary cards | High | Bug — affects user-facing totals |
