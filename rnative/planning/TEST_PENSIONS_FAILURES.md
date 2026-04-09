# Pensions — Test Failures & Action Plan

Extracted from `TEST_PENSIONS.md` manual testing session.

**Status: All issues resolved.**

---

## Issue 1: Blank value saved as £0 instead of unknown — ✅ RESOLVED

**Affected tests:** F-4, I-7

**Root cause:** The pensions `handleSave` did not have the same guard as investments. When `estimatedValue === 0` and `balanceNotSure` was false, it saved `0` instead of `estimatedValueUnknown: true`.

**Fix applied:** Added `formData.estimatedValue === 0` guard to both `estimatedValue` and `estimatedValueUnknown` in `handleSave` in `app/bequeathal/pensions/entry.tsx`.

---

## Issue 2: Validation attention does not trigger red styling on required fields — ✅ RESOLVED

**Affected tests:** C-2, D-1, I-1, I-2, I-3, I-4, I-5, I-6

**Root cause:** Two sub-issues:
1. Missing `beneficiaries` and `percentages` fields in `useFormValidation` — attention count was incomplete.
2. No `error` prop wired to form fields — red borders never appeared.

**Fix applied:**
1. Added `beneficiaries` and `percentages` fields to `useFormValidation` with conditional validity (always valid when nomination != "yes").
2. Added `error` prop to `RadioGroup` component (`src/components/ui/RadioGroup.tsx`) — new reusable feature.
3. Wired `error` props to all 4 form fields: `Input` (provider), `Select` (type), `RadioGroup` (nomination), `BeneficiaryWithPercentages` (beneficiaries + percentages).

---

## Issue 3: Test K-4 criteria outdated — ✅ RESOLVED

**Affected test:** K-4

**Root cause:** Test criteria still referenced `"Defined Benefit with Scottish Widows"` but the subline was already fixed to show type only (no provider repetition).

**Fix applied:** Updated test criteria to match actual correct behaviour.
