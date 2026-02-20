# Pensions — Test Failures & Action Plan

Extracted from `TEST_PENSIONS.md` manual testing session.

---

## Issue 1: Blank value saved as £0 instead of unknown

**Affected tests:** F-4, I-7

| # | Test | Result | Notes |
|---|------|--------|-------|
| F-4 | Blank value saves as unknown | FAIL | Blank value saved as 0 |
| I-7 | Value not required | FAIL | Stored as 0 |

**Root cause:** The pensions `handleSave` does not have the same guard as investments. In investments, when `estimatedValue === 0` and `balanceNotSure` is false, we set `estimatedValueUnknown: true` instead of saving 0. The pensions entry is missing this guard.

**Fix:** In `app/bequeathal/pensions/entry.tsx`, update the save mapping to match the investments pattern:
- If `balanceNotSure` is true → `estimatedValueUnknown: true`, no `estimatedValue`
- If `balanceNotSure` is false AND `estimatedValue === 0` → `estimatedValueUnknown: true`, no `estimatedValue`
- Otherwise → save the rounded value

**Effort:** Small — ~5 lines in `handleSave`.

---

## Issue 2: Validation attention does not trigger red styling on required fields

**Affected tests:** C-2, D-1, I-1, I-2, I-3, I-4, I-5, I-6

| # | Test | Result | Notes |
|---|------|--------|-------|
| C-2 | Type is required | FAIL | Submit disabled but no validation alert styling on unfilled fields |
| D-1 | Nomination is required | FAIL | Submit disabled but no validation alert styling on unfilled fields |
| I-1 | Provider required | Pass* | No validation border on required inputs not satisfied |
| I-2 | Pension type required | Pass* | No validation border on required inputs not satisfied |
| I-3 | Beneficiary nominated required | Pass* | No validation border on required inputs not satisfied |
| I-4 | Beneficiaries required when "Yes" | Pass* | No validation border on required inputs not satisfied |
| I-5 | Percentage total required | Pass* | No validation border on required inputs not satisfied |
| I-6 | Validation attention trigger | FAIL | Red highlights do not appear when tapping disabled button or attention label |

\* *Functionally pass (save is correctly blocked), but the UX feedback (red borders on invalid fields) is absent.*

**Root cause:** Two sub-issues:

1. **Missing percentage field in `useFormValidation`** — The pensions entry only tracks `provider`, `pensionType`, and `beneficiaryNominated`. It does not include a `percentages` field (like investments does), so the attention button doesn't fire for invalid percentage totals.

2. **Missing `error` prop wiring on form inputs** — When `showErrors` is true and a field fails validation, the individual `Input`, `Select`, and `RadioGroup` components need to receive an `error` prop (or conditional `style`) to show red borders. The investments entry has this wired up; pensions does not pass `showErrors && fieldErrors.xxx` to form fields.

**Fix:**
1. Add `percentages` validation field to `useFormValidation` (same pattern as investments — `validatePercentageAllocation` check, conditional on `beneficiaryNominated === 'yes'`).
2. Pass `error={showErrors && fieldErrors.provider}` to the Provider `Input`.
3. Pass `error={showErrors && fieldErrors.pensionType}` to the Pension Type `Select`.
4. Pass `error={showErrors && fieldErrors.beneficiaryNominated}` to the Beneficiary Nominated `RadioGroup` (or wrap with red border style).
5. Pass `error={showErrors && (fieldErrors.beneficiaries || fieldErrors.percentages)}` to `BeneficiaryWithPercentages` (already partially done for beneficiaries, needs percentages added).

**Effort:** Medium — touches validation setup + 4-5 form fields need `error` prop wired.

---

## Issue 3: Test K-4 criteria outdated

**Affected test:** K-4

| # | Test | Result | Notes |
|---|------|--------|-------|
| K-4 | Display title and subline | Pass* | "Incorrect test - passes on actually expected behaviour" |

**Root cause:** The test criteria still said `"Defined Benefit with Scottish Widows"` but we already removed the redundant `"with [provider]"` from the pension subline in this session. The actual app behaviour is correct — the subline now shows just the type (e.g. "Defined Benefit").

**Fix:** Update the test criteria in `TEST_PENSIONS.md` to match the actual (correct) behaviour:
- Subline should be: `"Defined Benefit"` (type label only, no provider)

**Effort:** Trivial — test doc update only.

---

## Execution Plan

| Priority | Issue | Action | Effort |
|----------|-------|--------|--------|
| 1 | Blank value → 0 (F-4, I-7) | Add `estimatedValue === 0` guard to `handleSave` | Small |
| 2 | Validation red styling (C-2, D-1, I-1–I-6) | Add `percentages` to validation, wire `error` props to all form fields | Medium |
| 3 | K-4 test criteria outdated | Update test doc | Trivial |

**Recommended order:** Fix #1 first (quick win, data integrity), then #2 (UX polish), then #3 (housekeeping).
