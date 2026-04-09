# Private Company Shares — Issues from Manual Testing

Extracted from `TEST_PRIVATE_COMPANY_SHARES.md` — all non-straight-pass results.

---

## Issue 1: Rename "companyNotes" field and store "other" share class explicitly (D-2)

**Test:** D-2 — Other share class shows notes
**Result:** Pass, but user comment: "Should we rename this field in data model as 'Share Class Notes'? And should we store the share class as 'other' specifically on the data model? We store Not sure as 'unknown'."
**Current behaviour:** Field is stored as `companyNotes`. Share class value `'other'` is already stored in `shareClass`.
**Action:** Cosmetic/data model tidy. Rename `companyNotes` → `shareClassNotes` in the type and all references. Confirm `shareClass: 'other'` is explicitly stored (it already is).
**Severity:** Low
**Type:** Data model cleanup

---

## Issue 2: Change "Customized" to "Customised" (E-2)

**Test:** E-2 — Customized documents
**Result:** User comment: "Please change spelling in UI and code to 'Customised' ... we're in the UK."
**Action:** Change the RadioGroup option label from "We customized the setup" to "We customised the setup". Also rename the stored value from `'customized'` to `'customised'` for consistency (but check if any existing data uses the old value) (make sure we grep all code to find any potential references).
**Severity:** Low
**Type:** Copy / localisation

---

## Issue 3: Acquisition date year range should be limited to 2 years (F-6)

**Test:** F-6 — Held 2+ years - no
**Result:** Pass, but user comment: "Available months and years should be 2 years max."
**Current behaviour:** Year dropdown shows 100 years of history. If the user has answered "No" to held for 2+ years, dates beyond 2 years ago are logically impossible.
**Action:** When `heldForTwoPlusYears === 'no'`, limit the year dropdown to the current year and 1 year prior (i.e., max 2 years back). Month dropdown may also need constraining if current year is selected.
**Severity:** Medium
**Type:** UX improvement / validation

---

## Issue 4: Validation scroll targets wrong location (F-7)

**Test:** F-7 — Acquisition date required
**Result:** Pass, but user comment: "Scrolls up to top of page, not to fields needed."
**Current behaviour:** When validation triggers for missing acquisition date, the auto-scroll goes to the top of the form instead of scrolling to the acquisition date fields.
**Action:** Ensure `useFormValidation` scroll-to-first-error targets the acquisition date fields (month/year) when they are the invalid fields. May need to add `ref` markers or adjust the scroll offset calculation.
**Severity:** Medium
**Type:** Bug — UX

---

## Issue 5: Hide acquisition date fields when "Not sure" selected (F-9)

**Test:** F-9 — Held 2+ years - not sure
**Result:** User comment: "We should not present date fields if 'not sure'."
**Current behaviour:** Acquisition date fields appear for both "No" and "Not sure" selections.
**Action:** Change the conditional to only show acquisition date fields when `heldForTwoPlusYears === 'no'`, not when `'not_sure'`.
**Severity:** Medium
**Type:** UX change

---

## Issue 6: Percentage validation on mode switch back (G-4)

**Test:** G-4 — Percentage rounds to 2dp
**Result:** Pass, but user comment: "On switch back if over 100 then should apply validation styling."
**Current behaviour:** If you enter 150 in shares mode, switch to %, the value is preserved (150) but no validation error is shown until the input loses focus.
**Action:** When switching mode back to percentage, if the preserved value exceeds 100, trigger the validation error immediately.
**Severity:** Medium
**Type:** Validation gap

---

## Issue 7: Negative values should show validation styling, not Alert (G-5)

**Test:** G-5 — Negative shares rejected
**Result:** FAIL — "Negative numbers, both on share count and on percentage should present validation styling and validation message when focus moves off or mode changes."
**Current behaviour:** Negative values are caught on save via `Alert.alert`. No visual feedback on the input itself.
**Action:** Add on-blur validation for negative values in both modes. Show red border + error text (same pattern as >100% check). Block save. Remove the Alert-based validation.
**Severity:** High
**Type:** Bug — validation UX

---

## Issue 8: Decimal shares should show validation styling, not Alert (G-6)

**Test:** G-6 — Decimal shares rejected
**Result:** FAIL — "No alert can be seen, and should present validation styling with message when loses focus or mode change."
**Current behaviour:** Decimal shares validation happens in `handleSave` via Alert, but user reports the Alert isn't visible. No on-blur validation.
**Action:** Add on-blur validation for decimal values in shares mode. Show red border + error text. Block save. Remove the Alert-based validation.
**Severity:** High
**Type:** Bug — validation UX

---

## Issue 9: Edit round-trip with share count fails (I-4)

**Test:** I-4 — Edit round-trip with share count
**Result:** FAIL
**Current behaviour:** When reopening an asset saved with shares mode (numberOfShares), the form does not correctly restore the shares mode toggle or the value.
**Action:** Investigate the load logic. Check that `ownershipMode` is set to `'shares'` when `share.numberOfShares` exists, and that `ownershipValue` is populated from `numberOfShares.toString()`.
**Severity:** High
**Type:** Bug — data round-trip

---

## Issue 10: H-3 default changed — test criteria outdated (H-3)

**Test:** H-3 — No value pre-selected
**Result:** Pass, but note: we changed `excludeFromNetWorth` to default to `'no'`. The test says "Neither Yes nor No selected" but the actual behaviour now pre-selects "No".
**Action:** Update test criteria to reflect the new default of "No" pre-selected.
**Severity:** Low
**Type:** Test plan update

---

## Summary

| # | Issue | Severity | Type | Status |
|---|-------|----------|------|--------|
| 1 | Rename companyNotes → shareClassNotes, confirm 'other' stored | Low | Data model cleanup | **RESOLVED** — renamed in type, form, save/load with backwards-compat fallback |
| 2 | "Customized" → "Customised" (UK spelling) | Low | Copy / localisation | **RESOLVED** — label, stored value, and load mapping updated |
| 3 | Limit acquisition date to 2-year range | Medium | UX improvement | **RESOLVED** — year dropdown limited to 3 years (current, -1, -2) |
| 4 | Validation scroll targets top of page, not invalid field | Medium | Bug — UX | **RESOLVED** — added scrollToEnd flag to useFormValidation; IHT fields scroll to bottom |
| 5 | Hide acquisition date when "Not sure" selected | Medium | UX change | **RESOLVED** — conditional changed to `=== 'no'` only; date values cleared on hide |
| 6 | Trigger % validation on mode switch back | Medium | Validation gap | **RESOLVED** — handleToggleMode now validates against new mode's rules |
| 7 | Negative values: use validation styling, not Alert | High | Bug — validation UX | **RESOLVED** — extracted validateSharesInput(); wired to onBlur; Alert removed |
| 8 | Decimal shares: use validation styling, not Alert | High | Bug — validation UX | **RESOLVED** — covered by same validateSharesInput() function |
| 9 | Edit round-trip with share count fails | High | Bug — data round-trip | **RESOLVED** — ownershipMode added to ShareForm; persists in drafts; migration fallback |
| 10 | H-3 test criteria outdated (default now 'no') | Low | Test plan update | **RESOLVED** — test plan updated; 4 new tests added (G-9, G-10, G-11, I-6) |
