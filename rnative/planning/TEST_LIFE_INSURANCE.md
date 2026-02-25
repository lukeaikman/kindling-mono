# Life Insurance — Test Plan

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


| #   | Test                        | Steps                                                 | Pass criteria                                                                               | Pass? |
| ----- | ----------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- |
| A-1 | Intro screen renders        | Navigate to Life Insurance from estate dashboard.     | Header shows "Life Insurance Policies" with shield icon. InformationCard present. No video. | Pass  |
| A-2 | Let's Go navigates          | Tap "Let's Go".                                       | Navigates to life insurance entry form.                                                     | Pass  |
| A-3 | Skip navigates              | Tap "Skip This Section".                              | Returns to previous screen.                                                                 | Pass  |
| A-4 | Back button works           | Tap back arrow in header.                             | Returns to previous screen.                                                                 | Pass  |
| A-5 | Learn more opens link       | Tap "Learn about life insurance and inheritance tax". | External browser opens which.co.uk link.                                                    | Pass  |
| A-6 | Information content correct | Scroll through InformationCard.                       | Mentions held in trust vs not, IHT implications, executor facilitation.                     | Pass  |

---

* [ ] B. Add Flow - Basic


| #   | Test                                  | Steps                                                                                                                                                                                         | Pass criteria                                                                              | Pass? |
| ----- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------- |
| B-1 | Add term policy - not in trust        | Provider = "Legal & General". Life Assured = Jane. Sum = 250000. Type = "Term Life Insurance". Held in Trust = "No". Premium = "Active". Save.                                                | Asset saved. No beneficiary section shown.`policyType: 'term'`.                            |       |
| B-2 | Add whole life - in trust with %      | Provider = "Aviva". Life Assured = John. Sum = 500000. Type = "Whole Life Insurance". Held in Trust = "Yes". Split by %. Add Jane 60% + Bob 40%. Premium = "Paid Up". Save.                   | Asset saved with beneficiaries.`policyType: 'whole-life'`. `allocationMode: 'percentage'`. |       |
| B-3 | Add policy - in trust with £ amounts | Provider = "Prudential". Life Assured = John. Sum = 300000. Type = "Term Life Insurance". Held in Trust = "Yes". Split by Amount. Add Jane £200000 + Bob £100000. Premium = "Active". Save. | Asset saved.`allocationMode: 'amount'`. Beneficiaries have `amount` not `percentage`.      |       |
| B-4 | Add policy - not sure about trust     | Provider = "Scottish Widows". Life Assured = Jane. Sum = 150000. Type = "Whole Life Insurance". Held in Trust = "Not Sure". Add John 100%. Premium = "Suspended". Save.                       | Beneficiary section shown (same as "Yes"). Asset saved with beneficiary.                   |       |
| B-5 | Header/button text in add mode        | Open entry with no`?id` param.                                                                                                                                                                | Header is "Add Policy". Button is "Add this policy".                                       |       |

---

## C. Provider Selection


| #   | Test                    | Steps                                                  | Pass criteria                                                                    | Pass? |
| ----- | ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| C-1 | Provider options listed | Open Provider SearchableSelect.                        | Shows 19 providers including Legal & General, Aviva, Prudential, etc. + "Other". |       |
| C-2 | Provider is required    | Leave provider blank, fill other fields, attempt save. | Save blocked/disabled.                                                           |       |
| C-3 | Provider search works   | Type "Avi" in search.                                  | Filters to show "Aviva".                                                         |       |

---

## D. Life Assured


| #   | Test                  | Steps                                        | Pass criteria                                                                          | Pass? |
| ----- | ----------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- | ------- |
| D-1 | Life assured required | Leave life assured unselected. Attempt save. | Save blocked/disabled.                                                                 |       |
| D-2 | Select person         | Select Jane as life assured.                 | Jane shown as selected.                                                                |       |
| D-3 | Will-maker first      | Open life assured selector.                  | Will-maker appears first, displayed bold with no relationship label in parentheses.    |       |

---

## E. Policy Type


| #   | Test             | Steps                                              | Pass criteria                                           | Pass? |
| ----- | ------------------ | ---------------------------------------------------- | --------------------------------------------------------- | ------- |
| E-1 | Type options     | Open Policy Type dropdown.                         | Shows "Term Life Insurance" and "Whole Life Insurance". |       |
| E-2 | Type is required | Leave type blank, fill other fields, attempt save. | Save blocked/disabled.                                  |       |

---

## F. Held in Trust + Beneficiaries


| #    | Test                                 | Steps                                                                  | Pass criteria                                                   | Pass? |
| ------ | -------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------- |
| F-1  | Held in trust required               | Leave held in trust unselected. Attempt save.                          | Save blocked/disabled.                                          |       |
| F-2  | "Yes" shows beneficiary section      | Select "Yes - Held in Trust".                                          | Allocation mode selector and BeneficiaryWithPercentages appear. |       |
| F-3  | "No" hides beneficiary section       | Select "No - Part of Estate".                                          | Beneficiary section hidden. No beneficiary data saved.          |       |
| F-4  | "Not Sure" shows beneficiary section | Select "Not Sure".                                                     | Beneficiary section appears (same as "Yes").                    |       |
| F-5  | Switching to No clears beneficiaries | Add beneficiaries while "Yes" selected. Switch to "No".                | Beneficiary section hides. Beneficiaries cleared.               |       |
| F-6  | Allocation mode - percentage         | Select "Split by Percentage (%)". Add Jane 60% + Bob 40%. Save.        | Beneficiaries stored with`percentage` values.                   |       |
| F-7  | Allocation mode - amount             | Select "Split by Amount (£)". Add Jane £200000 + Bob £100000. Save. | Beneficiaries stored with`amount` values (no percentage).       |       |
| F-8  | Mode switch clears beneficiaries     | Add beneficiaries in % mode. Switch to £ mode.                        | Beneficiaries cleared on mode change.                           |       |
| F-9  | Beneficiaries required when trust    | Select "Yes". Don't add beneficiaries. Attempt save.                   | Save blocked.                                                   |       |
| F-10 | Percentage total required            | Select "Yes" + % mode. Add Jane 60% + Bob 30% (90%). Attempt save.     | Save blocked until total = 100%.                                |       |

---

## G. Premium Status


| #   | Test             | Steps                                                 | Pass criteria                             | Pass? |
| ----- | ------------------ | ------------------------------------------------------- | ------------------------------------------- | ------- |
| G-1 | Premium options  | Open Premium Status dropdown.                         | Shows Active, Paid Up, Lapsed, Suspended. |       |
| G-2 | Premium required | Leave premium blank, fill other fields, attempt save. | Save blocked/disabled.                    |       |

---

## H. Edit Flow


| #   | Test                               | Steps                                                 | Pass criteria                                                             | Pass? |
| ----- | ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| H-1 | Edit loads existing data           | From summary, open existing policy for edit.          | All fields pre-filled. Header is "Edit Policy". Button is "Save changes". |       |
| H-2 | Edit saves changes                 | Change provider and sum insured, save.                | Updated values shown in summary.                                          |       |
| H-3 | Edit round-trip with beneficiaries | Save policy with Jane 70% + Bob 30%. Reopen for edit. | Rows show correct percentages. Total 100.0% ✓.                           |       |
| H-4 | Edit round-trip with amount mode   | Save policy with amount allocation. Reopen for edit.  | Amount mode selected. Beneficiaries show £ values.                       |       |
| H-5 | Net wealth toast on edit           | Edit a policy's sum insured and save.                 | Toast reflects delta.                                                     |       |

---

## I. Delete Flow


| #   | Test                | Steps                                 | Pass criteria                       | Pass? |
| ----- | --------------------- | --------------------------------------- | ------------------------------------- | ------- |
| I-1 | Delete from summary | From summary, tap delete on a policy. | Confirmation appears.               |       |
| I-2 | Delete confirmed    | Confirm deletion.                     | Policy removed. Total recalculates. |       |
| I-3 | Delete cancelled    | Cancel delete dialog.                 | Policy unchanged.                   |       |

---

## J. Validation


| #   | Test                         | Steps                                       | Pass criteria                                                                                           | Pass? |
| ----- | ------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------- |
| J-1 | All 6 required fields        | Leave each required field blank in turn.    | Save blocked for each: Provider, Life Assured, Sum Insured, Policy Type, Held in Trust, Premium Status. |       |
| J-2 | Sum insured must be > 0      | Enter 0 for sum insured.                    | Save blocked.                                                                                           |       |
| J-3 | Validation attention trigger | Tap disabled save button when form invalid. | Attention label shows count of invalid fields.                                                          |       |

---

## K. Summary Screen


| #   | Test                       | Steps                              | Pass criteria                               | Pass? |
| ----- | ---------------------------- | ------------------------------------ | --------------------------------------------- | ------- |
| K-1 | Summary shows all policies | Add 3 policies, open summary.      | All show with provider, type, sum.          |       |
| K-2 | Total value correct        | Add policies with known sums.      | Total equals sum of all`sumInsured` values. |       |
| K-3 | Empty state                | Remove all policies, open summary. | "No life insurance yet" with add button.    |       |
| K-4 | Edit from summary          | Tap an existing policy card.       | Opens edit form with pre-filled data.       |       |

---

## L. Data Integrity


| #   | Test                        | Steps                          | Pass criteria                                                                 | Pass? |
| ----- | ----------------------------- | -------------------------------- | ------------------------------------------------------------------------------- | ------- |
| L-1 | Stored type                 | Save any policy, inspect data. | `type === 'life-insurance'`.                                                  |       |
| L-2 | Title generation            | Save and check stored title.   | Format:`"Provider - LifeAssuredName"`.                                        |       |
| L-3 | Display subline             | View policy in summary card.   | Subline shows policy type + provider (e.g. "Term life with Legal & General"). |       |
| L-4 | estimatedValue = sumInsured | Save and check data.           | `estimatedValue` and `netValue` both equal `sumInsured`.                      |       |

---

## Summary


| Section                   | Tests  | Notes                                               |
| --------------------------- | -------- | ----------------------------------------------------- |
| A - Intro screen          | 6      | Navigation + educational content                    |
| B - Add flow              | 5      | Both policy types, trust variants, allocation modes |
| C - Provider              | 3      | SearchableSelect with 19 options                    |
| D - Life assured          | 3      | Person selector, will-maker first                   |
| E - Policy type           | 2      | Term / Whole Life                                   |
| F - Trust + beneficiaries | 10     | Conditional UI, % vs £ modes                       |
| G - Premium status        | 2      | 4 status options                                    |
| H - Edit flow             | 5      | Round-trips for both allocation modes               |
| I - Delete flow           | 3      | Confirmation + recalculation                        |
| J - Validation            | 3      | 6 required fields + sum > 0                         |
| K - Summary               | 4      | Display + totals                                    |
| L - Data integrity        | 4      | Storage model + display                             |
| **Total**                 | **50** |                                                     |

---

# Known Gaps

### 1. No error props wired to form fields

`useFormValidation` tracks 6 fields but `error` props are not passed to any `Input`, `Select`, `RadioGroup`, or `SearchableSelect` components. Red border highlighting will not appear on invalid fields.

### 2. No percentage validation in useFormValidation

The attention button won't fire for invalid percentage totals when beneficiaries are shown. The `percentages` field needs adding (conditional on `showBeneficiaries`).

### 3. Subline includes "with [provider]"

Same issue we fixed on pensions — the subline says "Term life with Legal & General" which duplicates the provider in the card title. Consider removing.
