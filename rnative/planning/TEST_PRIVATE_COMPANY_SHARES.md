# Private Company Shares — Test Plan

**Entry form:** `app/bequeathal/private-company-shares/entry.tsx`
**Intro screen:** `app/bequeathal/private-company-shares/intro.tsx`
**Summary screen:** `app/bequeathal/private-company-shares/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Create test people in Onboarding -> Family:
   - **Person 1:** John Smith (Spouse)
   - **Person 2:** Jane Doe (Daughter)
   - **Person 3:** Bob Smith (Son)
4. Create at least one beneficiary group
5. Confirm estate dashboard shows no assets

---

# Part 1: Manual Tests

## A. Intro Screen

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| A-1 | Intro screen renders | Navigate to Private Company Shares from estate dashboard. | Header shows "Private Company Shares" with building icon. InformationCard and video present. |  |
| A-2 | Let's Go navigates | Tap "Let's Go". | Navigates to entry form. |  |
| A-3 | Skip navigates | Tap "Skip for now". | Returns to previous screen. |  |
| A-4 | Back button works | Tap back arrow in header. | Returns to previous screen. |  |
| A-5 | Learn more opens link | Tap "Learn more about private company shares in wills". | External browser opens gov.uk capital gains manual link. |  |
| A-6 | Information content correct | Scroll through InformationCard. | Mentions founded companies, startup investments, private equity, employee share schemes, family business. |  |

---

## B. Company Selection

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| B-1 | New company form | Select "Add new company" from dropdown. | Company Name input appears. |  |
| B-2 | Existing company selection | Create a business first, then open entry. | Previously created business appears in dropdown and can be selected. |  |
| B-3 | Company name required | Select "Add new company". Leave name blank. Attempt save. | Save blocked. |  |

---

## C. Add Flow - Basic

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| C-1 | Add with percentage ownership | New company = "Acme Ltd". Country = UK. Share class = Ordinary. Ownership = 25% (percentage mode). Value = 100000. Save. | Asset saved. `percentageOwnership: 25`. |  |
| C-2 | Add with share count | New company = "Smith & Co". Shares = 1000 (shares mode). Value = 50000. Save. | Asset saved. `numberOfShares: 1000`. No `percentageOwnership`. |  |
| C-3 | Add with beneficiaries | New company = "Test Ltd". Add Jane 60% + Bob 40%. Save. | Asset saved with beneficiary assignments. |  |
| C-4 | Add with value unsure | New company = "Unknown Co". Tick "Not sure". Save. | `estimatedValueUnknown: true`. No `estimatedValue`. |  |
| C-5 | Header/button text in add mode | Open entry with no `?id` param. | Header is "Add Shareholding". Button is "Add this shareholding". |  |

---

## D. Share Class + Notes

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| D-1 | Ordinary share class | Select "Ordinary". | Notes field hidden. `shareClass: 'ordinary'` saved. |  |
| D-2 | Other share class shows notes | Select "Other". | Notes input appears. |  |
| D-3 | Other notes saved | Select "Other". Enter notes. Save. | `companyNotes` stored with entered text. |  |

---

## E. Company Setup Documents

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| E-1 | Standard documents | Select "Yes". | `companyArticlesConfident: 'standard'` saved. |  |
| E-2 | Customized documents | Select "No". | `companyArticlesConfident: 'customized'` saved. |  |
| E-3 | Not sure documents | Select "Not sure". | `companyArticlesConfident: 'not_sure'` saved. |  |

---

## F. IHT Planning Section

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| F-1 | Actively trading checkbox | Tick "The business is actively trading". Save. | `isActivelyTrading: true` stored. |  |
| F-2 | Not holding company checkbox | Tick "It is NOT a holding company...". Save. | `isNotHoldingCompany: true` stored. |  |
| F-3 | Held 2+ years - yes | Select "Yes". | No acquisition date fields shown. `heldForTwoPlusYears: true` saved. |  |
| F-4 | Held 2+ years - no | Select "No". | Acquisition month + year fields appear. Both required. |  |
| F-5 | Acquisition date required | Select "No" for 2+ years. Leave month/year blank. Attempt save. | Save blocked. Alert shown. |  |
| F-6 | Acquisition date saved | Select "No". Month = June, Year = 2023. Save. | `acquisitionMonth: '06'`, `acquisitionYear: '2023'` stored. |  |
| F-7 | Held 2+ years - not sure | Select "Not sure". | Acquisition date fields appear (optional). |  |

---

## G. Ownership Value Validation

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| G-1 | Percentage > 100 rejected | Enter 150% in percentage mode. Save. | Alert shown: invalid percentage. |  |
| G-2 | Percentage rounds to 2dp | Enter 33.333% in percentage mode. Save. | Saved as `33.33`. |  |
| G-3 | Negative shares rejected | Enter -100 in shares mode. Save. | Alert shown: invalid share count. |  |
| G-4 | Decimal shares rejected | Enter 10.5 in shares mode. Save. | Alert shown: must be whole number. |  |

---

## H. Exclude from Net Worth

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| H-1 | Exclude checkbox | Tick "Don't include in net worth". Save. | `excludeFromNetWorth: true` stored. |  |
| H-2 | Unticked by default | Open fresh form. | Checkbox unchecked. |  |

---

## I. Edit Flow

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| I-1 | Edit loads existing data | From summary, open existing shareholding for edit. | All fields pre-filled including company, ownership mode, IHT fields. Header is "Edit Shareholding". |  |
| I-2 | Edit saves changes | Change value and ownership %. Save. | Updated values shown in summary. |  |
| I-3 | Edit round-trip with beneficiaries | Save with Jane 70% + Bob 30%. Reopen for edit. | Rows show correct percentages. |  |
| I-4 | Edit round-trip with share count | Save with 1000 shares. Reopen. | Shares mode selected. Value = 1000. |  |
| I-5 | Edit round-trip with IHT fields | Save with all IHT checkboxes ticked. Reopen. | All IHT checkboxes pre-ticked. |  |

---

## J. Delete Flow

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| J-1 | Delete from summary | From summary, tap delete. | Confirmation appears. |  |
| J-2 | Delete confirmed | Confirm deletion. | Shareholding removed. Total recalculates. |  |
| J-3 | Delete cancelled | Cancel delete dialog. | Shareholding unchanged. |  |

---

## K. Summary Screen

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| K-1 | Summary shows all shareholdings | Add 3 shareholdings, open summary. | All show with company names, ownership, values. |  |
| K-2 | Total value correct | Add known values. | Total equals expected sum. |  |
| K-3 | Empty state | Remove all, open summary. | Empty state with add button. |  |
| K-4 | Edit from summary | Tap existing card. | Opens edit form with pre-filled data. |  |

---

## L. Data Integrity

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| L-1 | Stored type | Save, inspect data. | `type === 'private-company-shares'`. |  |
| L-2 | Title = company name | Save and check stored title. | Title is the company name. |  |
| L-3 | Display subline | View in summary card. | Subline shows "X% ownership · Ordinary" (or share class). |  |
| L-4 | Business entity created | Select "Add new company", save. Check businesses. | New business entity created in business store. |  |

---

## Summary

| Section | Tests | Notes |
|---------|-------|-------|
| A - Intro screen | 6 | Navigation + educational content |
| B - Company selection | 3 | New vs existing company |
| C - Add flow | 5 | % ownership, share count, beneficiaries, unsure |
| D - Share class | 3 | Ordinary vs Other + notes |
| E - Company documents | 3 | Standard / Customized / Not sure |
| F - IHT planning | 7 | Actively trading, holding co, acquisition date |
| G - Ownership validation | 4 | Percentage bounds, share count validation |
| H - Exclude from net worth | 2 | Checkbox behaviour |
| I - Edit flow | 5 | Round-trips for all field types |
| J - Delete flow | 3 | Confirmation + recalculation |
| K - Summary | 4 | Display + totals |
| L - Data integrity | 4 | Storage model + display + business entity |
| **Total** | **49** | |

---

# Known Gaps

### 1. No error props wired to form fields

`useFormValidation` only tracks `companyName`. No `error` props passed to any form fields. Red border highlighting will not appear.

### 2. Minimal validation in useFormValidation

Only `companyName` is tracked. Other required fields (acquisition date when held < 2 years) are validated in `handleSave` via Alert, not through the attention system.

### 3. No percentage validation in useFormValidation

Beneficiary percentage totals are validated in `handleSave` but not tracked in `useFormValidation`, so the attention button won't fire for invalid totals.

### 4. Beneficiaries are optional

Unlike investments/pensions, beneficiaries are not required. The label says "Optional: leave blank to treat this as part of the estate."
