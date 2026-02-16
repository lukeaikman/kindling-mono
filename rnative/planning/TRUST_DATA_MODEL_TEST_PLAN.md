# Trust Data Model — Manual Test Plan

**Source:** [TRUST_DATA_MODEL_COMPLETION.md](./TRUST_DATA_MODEL_COMPLETION.md)

**Date:** 2026-02-16

---

## Precursor: Purge all data before testing

These changes alter the `Trust` and `PropertyAsset` data structures. Old data is incompatible.

1. Open the developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Confirm the estate dashboard shows no assets
4. Proceed with tests below using freshly created data only

---

## A. PropertyAsset Transfer Field Persistence

For each trust type + role combination, create a trust-owned property, fill the trust details, save, and check the data viewer.


| #    | Test                                           | Steps                                                                                                                                                                         | Pass criteria                                                                                                             | Notes |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| A-1  | LI Settlor — value saves                      | Life Interest > Settlor. "Within 7 years" = yes. Transfer value £250,000, month March, year 2023. Save.                                                                      | `PropertyAsset.trustTransferValue === 250000`, `trustTransferMonth === '03'`, `trustTransferYear === '2023'`              | Pass  |
| A-2  | LI Settlor — date unknown                     | Life Interest > Settlor. "Within 7 years" = yes. Tick "I don't know" for date. Tick "I don't know" for value. Confirm no-benefit declaration. Save.                           | `trustTransferDateUnknown === true`, `trustTransferValueUnknown === true`, `trustTransferWithin7Years === true`           | Pass  |
| A-3  | LI Settlor — contradiction warning            | Life Interest > Settlor. "Within 7 years" = yes. Enter month Jan, year that is 8 years ago.                                                                                   | Warning text appears. Save button disabled.                                                                               | Pass  |
| A-4  | LI Settlor — over 7 years success             | Life Interest > Settlor. "Within 7 years" = no.                                                                                                                               | Green success message shown. Save works.`trustTransferWithin7Years === false`                                             | Pass  |
| A-5  | LI Remainderman — transfer details            | Life Interest > Remainderman. "Life tenant alive?" = Yes. Enter age (e.g. 72). Enter transfer month June, year 2022. Enter transfer value £300,000. Save. Check data viewer. | `PropertyAsset.trustTransferMonth === '06'`, `trustTransferYear === '2022'`, `trustTransferValue === 300000`              | Pass  |
| A-6  | Bare Settlor — transfer date saves separately | Bare > Settlor. Enter transfer month/year. Check trust creation date is separate. Save.                                                                                       | `PropertyAsset.trustTransferMonth` / `trustTransferYear` populated. Trust `creationMonth`/`creationYear` are independent. |       |
| A-7  | Bare S&B — occupied + value                   | "Do you live here?" = yes. Enter transfer value. Save.                                                                                                                        | `occupiedByOwner === true`, `trustTransferValue` populated                                                                |       |
| A-8  | Discretionary Settlor — transfer details      | Enter discretionary transfer details. Save.                                                                                                                                   | Transfer fields on PropertyAsset                                                                                          |       |
| A-9  | Discretionary Beneficiary — transfer details  | Enter discretionary beneficiary transfer details. Save.                                                                                                                       | Transfer fields on PropertyAsset                                                                                          |       |
| A-10 | Role switch — stale data                      | Start as Settlor, value £100k. Switch to Beneficiary, value £200k. Save.                                                                                                    | `trustTransferValue === 200000` (not stale £100k)                                                                        |       |

---

## B. Trust Sub-Object Persistence (Save + Round-Trip)

For each combination, fill all fields, save, navigate away, return, and confirm fields are restored.


| #   | Test                                         | Steps                                                                                                      | Pass criteria                                                               |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| B-1 | LI Settlor — lifeInterest sub-object        | Fill all LI settlor fields (noBenefitConfirmed, payingMarketRent, lifeInterestEndingEvents). Save. Return. | All scalar fields restored.`settlor.lifeInterest` populated in data viewer. |
| B-2 | LI Settlor+Beneficial — beneficial fields   | Fill beneficial interest type and wants review. Save. Return.                                              | `beneficialInterestType` and `wantsReview` restored                         |
| B-3 | LI Beneficiary — lifeInterest sub-object    | Fill sharing, spouse succession, etc. Save. Return.                                                        | All fields restored                                                         |
| B-4 | LI Remainderman — remainderman sub-object   | Fill life tenant alive, age, settlor alive, succession. Save. Return.                                      | All fields restored                                                         |
| B-5 | Bare Beneficiary — bare sub-object          | Fill percentage, share with others, gifted by settlor. Save. Return.                                       | Scalar fields restored                                                      |
| B-6 | Bare S&B — co-beneficiaries                 | Add co-beneficiaries via the S&B form. Save. Return.                                                       | `beneficiary.bare.coBeneficiaries` populated and restored                   |
| B-7 | Discretionary Settlor — complexSituation    | Set complex situation flag. Save. Return.                                                                  | `settlor.discretionaryComplexSituation === true`                            |
| B-8 | Discretionary Beneficiary — insurancePolicy | Set insurance policy. Save. Return.                                                                        | `beneficiary.discretionaryInsurancePolicy` populated                        |
| B-9 | Discretionary S&B — spouse excluded         | Set spouse exclusion. Save. Return.                                                                        | `beneficiary.discretionarySettlorBeneficiarySpouseExcluded` populated       |

### B — Deferred (no UI yet)

These arrays are plumbed through the data layer but the form does not yet expose UI to add/edit entries. They will save as `[]`. Test when UI is built.


| #    | Test                                | Notes                                                                  |
| ------ | ------------------------------------- | ------------------------------------------------------------------------ |
| B-D1 | LI Settlor — remaindermen array    | `settlor.lifeInterest.remaindermen` — no "add remainderman" UI exists |
| B-D2 | Bare Settlor — beneficiaries array | `settlor.beneficiaries` — no "add beneficiary" UI exists              |

---

## C. Trust-Level and Role Fields


| #   | Test                            | Steps                                        | Pass criteria                                                                           |
| ----- | --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| C-1 | userRole saved                  | Select any role. Save. Check data viewer.    | `trust.userRole` matches the selected role string (e.g. `'settlor'`, `'remainderman'`)  |
| C-2 | userRole used on load           | Save as remainderman. Navigate away. Return. | Form auto-selects "Remainderman" role                                                   |
| C-3 | No boolean flags                | After any save, check data viewer.           | `isUserSettlor`, `isUserBeneficiary`, `isUserTrustee` do NOT appear on the Trust object |
| C-4 | preFinanceAct2006 — before     | Select "before 2006". Save. Check.           | `trust.preFinanceAct2006 === 'before_2006'`                                             |
| C-5 | preFinanceAct2006 — after      | Select "on or after 2006". Save. Check.      | `trust.preFinanceAct2006 === 'on_or_after_2006'`                                        |
| C-6 | preFinanceAct2006 — unanswered | Don't answer the question. Save. Check.      | `trust.preFinanceAct2006 === undefined`                                                 |
| C-7 | chainedTrustStructure           | Set chained trust. Save. Return.             | `trust.chainedTrustStructure === true`                                                  |

---

## D. Edge Cases


| #   | Test                                            | Steps                                                                                                         | Pass criteria                                                                          |
| ----- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| D-1 | Value of 0 round-trips                          | Enter transfer value £0. Save. Navigate away. Return.                                                        | Field shows £0, not blank/undefined                                                   |
| D-2 | occupiedByOwner vs primaryResidence independent | Set primaryResidence = yes, occupiedByOwner = no. Save. Check.                                                | Both fields independent in data viewer                                                 |
| D-3 | Draft interop                                   | Start filling trust details (trigger draft save). Navigate away (draft flushed). Return. Restore draft. Save. | Draft restores all form fields. After save, PropertyAsset + Trust populated correctly. |
| D-4 | Other trust type — minimal save                | Select "Other" trust type. Fill name only. Save.                                                              | Only core fields saved (name, type).`userRole === undefined`. No sub-objects.          |

---

## E. TrustRole Refactor Validation

These tests specifically validate the removal of the `isUserSettlor`/`isUserBeneficiary`/`isUserTrustee` boolean fields.


| #   | Test                     | Steps                                                             | Pass criteria                                                                                   |
| ----- | -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| E-1 | New trust — no booleans | Create any new trust. Save. Check data viewer.                    | No`isUserSettlor`, `isUserBeneficiary`, or `isUserTrustee` keys present. `userRole` is present. |
| E-2 | Role correctly persisted | Create LI > Settlor+Beneficial. Save. Check.                      | `trust.userRole === 'settlor_and_beneficial_interest'`                                          |
| E-3 | Role loads correctly     | From E-2, navigate away and return.                               | Form shows "Settlor & Beneficial Interest" selected                                             |
| E-4 | Role switch persists     | Start as Settlor, save. Edit, switch to Beneficiary, save. Check. | `trust.userRole === 'beneficiary'` (not stale `'settlor'`)                                      |
| E-5 | App compiles cleanly     | Run`npx expo start`.                                              | No TypeScript errors related to`isUserSettlor`/`isUserBeneficiary`/`isUserTrustee`              |

---

## F. TransferDateValueFields Component

Tests for the extracted reusable component and related changes.


| #   | Test                                                     | Steps                                                                                                         | Pass criteria                                                                                            |
| ----- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| F-1 | LI Settlor — "I don't know" date checkbox               | Life Interest > Settlor. "Within 7 years" = yes. Tick "I don't know" for date.                                | Date selects disappear. Field values cleared.                                                            |
| F-2 | LI Settlor — "I don't know" value checkbox              | Life Interest > Settlor. "Within 7 years" = yes. Tick "I don't know" for value.                               | Currency input disappears. Value reset to 0.                                                             |
| F-3 | Bare Settlor — separate transfer date                   | Bare > Settlor. Enter transfer date. Navigate to trust form base fields. Enter different creation date. Save. | Transfer date and creation date are different values in data viewer.                                     |
| F-4 | Discretionary Settlor — component renders correctly     | Discretionary > Settlor. Check date/value/unknown fields render.                                              | "For 7-year rule tracking" helper text shown. Date unknown checkbox works. Value unknown checkbox works. |
| F-5 | Discretionary Beneficiary — component renders correctly | Discretionary > Beneficiary. Check date/value/unknown fields render.                                          | Helper text shown. Both unknown checkboxes work. Insurance field still appears when appropriate.         |
| F-6 | Placeholder consistency                                  | Check all CurrencyInput placeholders across all 4 refactored fieldsets.                                       | All show "Enter value at transfer..." (not "Enter value...").                                            |

---

## Summary


| Section                                | Tests                      | Notes                                                             |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| A — PropertyAsset transfer fields     | 10                         | Updated: A-2/A-3/A-4 rewritten for "I don't know" + contradiction |
| B — Trust sub-objects                 | 9 active + 2 deferred      | Deferred tests need UI built                                      |
| C — Trust-level/role fields           | 7                          | Includes boolean removal validation                               |
| D — Edge cases                        | 4                          |                                                                   |
| E — TrustRole refactor                | 5                          | Boolean to enum cleanup                                           |
| F — TransferDateValueFields component | 6                          | New: component extraction + Bare Settlor date fix                 |
| **Total**                              | **41 active + 2 deferred** |                                                                   |
