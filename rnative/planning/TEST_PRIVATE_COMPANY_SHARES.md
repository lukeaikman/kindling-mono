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


| #   | Test                        | Steps                                                     | Pass criteria                                                                                             | Pass? |
| ----- | ----------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| A-1 | Intro screen renders        | Navigate to Private Company Shares from estate dashboard. | Header shows "Private Company Shares" (no icon). InformationCard and video present.                       | Pass  |
| A-2 | Let's Go navigates          | Tap "Let's Go".                                           | Navigates to entry form.                                                                                  | Pass  |
| A-3 | Skip navigates              | Tap "Skip for now".                                       | Returns to previous screen.                                                                               | Pass  |
| A-4 | Back button works           | Tap back arrow in header.                                 | Returns to previous screen.                                                                               | Pass  |
| A-5 | Learn more opens link       | Tap "Learn more about private company shares in wills".   | External browser opens gov.uk capital gains manual link.                                                  | Pass  |
| A-6 | Information content correct | Scroll through InformationCard.                           | Mentions founded companies, startup investments, private equity, employee share schemes, family business. | Pass  |

---

## B. Company Selection


| #   | Test                               | Steps                                                                       | Pass criteria                                                                                                                                  | Pass? |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| B-1 | Default shows name input           | Open fresh entry form (no existing businesses).                             | Company Name input shown. No company selector dropdown visible.                                                                                | Pass  |
| B-2 | Select existing link appears       | Create a business first, then open a new entry.                             | Company Name input shown with "Select existing company" link right-aligned underneath.                                                         | Pass  |
| B-3 | Select existing switches to picker | Tap "Select existing company" link.                                         | Name input replaced by company selector dropdown. Placeholder reads "Select a company". "Add new company" is first option with accent styling. | Pass  |
| B-4 | Pick existing company              | Tap "Select existing company", then select an existing business.            | Business name populates`companyName`. Form fields appear.                                                                                      | Pass  |
| B-5 | Add new from picker                | Tap "Select existing company", then select "Add new company" from dropdown. | Picker replaced by Company Name input again.                                                                                                   | Pass  |
| B-6 | Company name required              | Leave Company Name blank. Attempt save.                                     | Save blocked. Red border on name input.                                                                                                        | Pass  |

---

* [ ] C. Add Flow - Basic


| #   | Test                           | Steps                                                                                                                    | Pass criteria                                                    | Pass?     |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| C-1 | Add with percentage ownership  | New company = "Acme Ltd". Country = UK. Share class = Ordinary. Ownership = 25% (percentage mode). Value = 100000. Save. | Asset saved.`percentageOwnership: 25`.                           | Pass      |
| C-2 | Add with share count           | New company = "Smith & Co". Shares = 1000 (shares mode). Value = 50000. Save.                                            | Asset saved.`numberOfShares: 1000`. No `percentageOwnership`.    | Pass      |
| C-3 | Add with beneficiaries         | New company = "Test Ltd". Add Jane 60% + Bob 40%. Save.                                                                  | Asset saved with beneficiary assignments.                        | Pass      |
| C-4 | Add with value unsure          | New company = "Unknown Co". Tick "Not sure". Save.                                                                       | `estimatedValueUnknown: true`. No `estimatedValue`.              | Pass      |
| C-5 | Header/button text in add mode | Open entry with no`?id` param.                                                                                           | Header is "Add Shareholding". Button is "Add this shareholding". | Redundant |

---

## D. Share Class + Notes


| #   | Test                          | Steps                              | Pass criteria                                                                                  | Pass?                                                                                                                                                                                     |
| ----- | ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Ordinary share class          | Select "Ordinary".                 | Notes field hidden.`shareClass: 'ordinary'` saved. Share class not pre-selected on blank form. | Pass                                                                                                                                                                                      |
| D-2 | Other share class shows notes | Select "Other".                    | Notes input appears.                                                                           | Pass (field renamed to `shareClassNotes` in data model)                                                                                                                                   |
| D-3 | Other notes saved             | Select "Other". Enter notes. Save. | `shareClassNotes` stored with entered text.                                                    | Pass                                                                                                                                                                                      |
| D-4 | Not sure share class          | Select "Not sure".                 | Notes field hidden.`shareClass: 'unknown'` saved.                                              | Pass                                                                                                                                                                                      |

---

## E. Company Setup Documents


| #   | Test                 | Steps              | Pass criteria                                   | Pass?                                                                      |
| ----- | ---------------------- | -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| E-1 | Standard documents   | Select "Yes".      | `companyArticlesConfident: 'standard'` saved.   | Pass                                                                       |
| E-2 | Customised documents | Select "No".       | `companyArticlesConfident: 'customised'` saved. | Pass (spelling corrected to 'customised')                                  |
| E-3 | Not sure documents   | Select "Not sure". | `companyArticlesConfident: 'not_sure'` saved.   | Pass                                                                       |

---

## F. IHT Planning Section


| #   | Test                      | Steps                                                                      | Pass criteria                                                             | Pass?                                                        |
| ----- | --------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| F-1 | Actively trading - yes    | Select "Yes" for "Is the business actively trading?"                       | `isActivelyTrading: true` stored. No value pre-selected on blank form.    | Pass                                                         |
| F-2 | Actively trading - no     | Select "No" for "Is the business actively trading?"                        | `isActivelyTrading: false` stored.                                        | Pass                                                         |
| F-3 | Holding company - yes     | Select "Yes" for "Is this a holding company for property, cash or assets?" | `isNotHoldingCompany: false` stored. No value pre-selected on blank form. | Pass                                                         |
| F-4 | Holding company - no      | Select "No" for "Is this a holding company..."                             | `isNotHoldingCompany: true` stored.                                       | Pass                                                         |
| F-5 | Held 2+ years - yes       | Select "Yes".                                                              | No acquisition date fields shown.`heldForTwoPlusYears: true` saved.       | Pass                                                         |
| F-6 | Held 2+ years - no        | Select "No".                                                               | Acquisition month + year fields appear. Both required. Year dropdown limited to 3 years. | |
| F-7 | Acquisition date required | Select "No" for 2+ years. Leave month/year blank. Attempt save.            | Save blocked. Validation scrolls to IHT section (bottom of form).         | |
| F-8 | Acquisition date saved    | Select "No". Month = June, Year = 2024. Save.                              | `acquisitionMonth: '06'`, `acquisitionYear: '2024'` stored.               | |
| F-9 | Held 2+ years - not sure  | Select "Not sure".                                                         | No acquisition date fields shown. Previous date values cleared.           | |

---

## G. Ownership Value Validation


| #   | Test                           | Steps                                            | Pass criteria                                                                                                         | Pass?                                                                                                                                                        |
| ----- | -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-1 | Percentage > 100 error on blur | Enter 122 in percentage mode. Tap another field. | Input border turns red. Error text "Percentage cannot exceed 100%" shown under input, above "Not sure". Save blocked. | Pass                                                                                                                                                         |
| G-2 | Error clears on typing         | With G-1 error showing, type a new value.        | Red border and error text disappear.                                                                                  | Pass                                                                                                                                                         |
| G-3 | Mode switch validates value    | With G-1 error showing, tap 123 toggle.          | Error clears (value valid in shares mode). Input value preserved. If value invalid for new mode, error shown immediately. | |
| G-4 | Percentage rounds to 2dp       | Enter 33.333% in percentage mode. Save.          | Saved as`33.33`.                                                                                                      | |
| G-5 | Negative shares rejected       | Enter -100 in shares mode. Tap another field.    | Red border + "Value cannot be negative" shown under input. Save blocked.                                              | |
| G-6 | Decimal shares rejected        | Enter 10.5 in shares mode. Tap another field.    | Red border + "Shares must be a whole number" shown under input. Save blocked.                                         | |
| G-7 | Shares "Not sure" option       | Tick "Not sure" under shares input.              | Input and % / 123 toggle dimmed and disabled.`ownershipUnknown: true` saved. No shares/% stored.                      | Pass                                                                                                                                                         |
| G-8 | Shares "Not sure" round-trip   | Save with "Not sure" ticked. Reopen for edit.    | "Not sure" checkbox ticked. Input empty and disabled.                                                                 | Pass                                                                                                                                                         |
| G-9 | Negative percentage rejected   | Enter -50 in percentage mode. Tap another field. | Red border + "Value cannot be negative" shown under input. Save blocked.                                              |       |
| G-10 | Mode switch % with >100 value | Enter 150 in shares mode. Switch to % mode.      | Red border + "Percentage cannot exceed 100%" shown immediately on mode switch.                                        |       |
| G-11 | Mode switch shares with decimal | Enter 10.5 in % mode. Switch to 123 mode.      | Red border + "Shares must be a whole number" shown immediately on mode switch.                                        |       |

---

## H. Exclude from Net Worth


| #   | Test                  | Steps                                                                                          | Pass criteria                                                                               | Pass? |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------- |
| H-1 | Exclude - yes         | Select "Yes" for "Are these shares speculative or illiquid and therefore should be ignored..." | `excludeFromNetWorth: true` stored.                                                         | Pass  |
| H-2 | Exclude - no          | Select "No".                                                                                   | `excludeFromNetWorth: false` stored.                                                        | Pass  |
| H-3 | Default is No         | Open fresh form.                                                                               | "No" pre-selected by default. Field is last on form (after IHT section, before save button). |       |
| H-4 | Exclude round-trip    | Save with "Yes". Reopen for edit.                                                              | "Yes" pre-selected.                                                                         | Pass  |

---

## I. Edit Flow


| #   | Test                               | Steps                                              | Pass criteria                                                                                       | Pass? |
| ----- | ------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| I-1 | Edit loads existing data           | From summary, open existing shareholding for edit. | All fields pre-filled including company, ownership mode, IHT fields. Header is "Edit Shareholding". | Pass  |
| I-2 | Edit saves changes                 | Change value and ownership %. Save.                | Updated values shown in summary.                                                                    | Pass  |
| I-3 | Edit round-trip with beneficiaries | Save with Jane 70% + Bob 30%. Reopen for edit.     | Rows show correct percentages.                                                                      | Pass  |
| I-4 | Edit round-trip with share count   | Save with 1000 shares. Reopen.                     | Shares mode selected (123 toggle active). Value = 1000.                                             |       |
| I-5 | Edit round-trip with IHT fields    | Save with all IHT fields answered. Reopen.         | Actively trading, holding company, held 2+ years all pre-selected with saved values.                | Pass  |
| I-6 | Draft restore preserves shares mode | Save with 500 shares. Leave and return (draft restore). | Shares mode active (123 toggle). Value = 500. ownershipMode persisted through draft. |       |

---

## J. Delete Flow


| #   | Test                | Steps                     | Pass criteria                             | Pass? |
| ----- | --------------------- | --------------------------- | ------------------------------------------- | ------- |
| J-1 | Delete from summary | From summary, tap delete. | Confirmation appears.                     | Pass  |
| J-2 | Delete confirmed    | Confirm deletion.         | Shareholding removed. Total recalculates. | Pass  |
| J-3 | Delete cancelled    | Cancel delete dialog.     | Shareholding unchanged.                   | Pass  |

---

## K. Summary Screen


| #   | Test                            | Steps                              | Pass criteria                                   | Pass? |
| ----- | --------------------------------- | ------------------------------------ | ------------------------------------------------- | ------- |
| K-1 | Summary shows all shareholdings | Add 3 shareholdings, open summary. | All show with company names, ownership, values. | Pass  |
| K-2 | Total value correct             | Add known values.                  | Total equals expected sum.                      | Pass  |
| K-3 | Empty state                     | Remove all, open summary.          | Empty state with add button.                    | Pass  |
| K-4 | Edit from summary               | Tap existing card.                 | Opens edit form with pre-filled data.           | Pass  |

---

## L. Data Integrity


| #   | Test                    | Steps                                             | Pass criteria                                              | Pass? |
| ----- | ------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ------- |
| L-1 | Stored type             | Save, inspect data.                               | `type === 'private-company-shares'`.                       |       |
| L-2 | Title = company name    | Save and check stored title.                      | Title is the company name.                                 |       |
| L-3 | Display subline         | View in summary card.                             | Subline shows "X% ownership · Ordinary" (or share class). |       |
| L-4 | Business entity created | Select "Add new company", save. Check businesses. | New business entity created in business store.             |       |

---

## Summary


| Section                    | Tests  | Notes                                                             |
| ---------------------------- | -------- | ------------------------------------------------------------------- |
| A - Intro screen           | 6      | Navigation + educational content                                  |
| B - Company selection      | 6      | Default name input, select existing link, picker, add new         |
| C - Add flow               | 5      | % ownership, share count, beneficiaries, unsure                   |
| D - Share class            | 4      | Ordinary vs Other vs Not sure + notes (renamed to shareClassNotes)|
| E - Company documents      | 3      | Standard / Customised / Not sure                                  |
| F - IHT planning           | 9      | Actively trading, holding co, acq. date (3-year range, scroll fix)|
| G - Ownership validation   | 11     | On-blur validation (%, neg, decimal), mode-switch validation, "Not sure" |
| H - Exclude from net worth | 4      | RadioGroup Yes/No, default No, last field, round-trip             |
| I - Edit flow              | 6      | Round-trips for all field types + draft mode persistence          |
| J - Delete flow            | 3      | Confirmation + recalculation                                      |
| K - Summary                | 4      | Display + totals                                                  |
| L - Data integrity         | 4      | Storage model + display + business entity                         |
| **Total**                  | **65** |                                                                   |

---

# Known Gaps

### 1. No error props wired to form fields

`useFormValidation` only tracks `companyName`. No `error` props passed to any form fields. Red border highlighting will not appear.

### 2. Minimal validation in useFormValidation

Only `companyName` is tracked. Other required fields (acquisition date when held < 2 years) are validated in `handleSave` via Alert, not through the attention system.

### 3. Beneficiary percentage validation not in useFormValidation

Beneficiary percentage totals are validated in `handleSave` but not tracked in `useFormValidation`, so the attention button won't fire for invalid totals. Shares input is now fully validated on blur and mode switch (negatives, >100%, decimals in shares mode).

### 4. Beneficiaries are optional

Unlike investments/pensions, beneficiaries are not required. The label says "Optional: leave blank to treat this as part of the estate."
