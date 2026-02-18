# Bank Accounts — Test Plan

---

## Precursor: Purge data before testing

**IMPORTANT:** Pre-beta data purge required. Existing assets with `estimatedValue: 0` from the old "Unsure" path will not have the `estimatedValueUnknown` flag, causing false results in B-7, B-13, B-15.

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Confirm estate dashboard shows no assets
4. Proceed with fresh data only

---

# Part 1: Manual Tests

## A. Intro Screen


| #   | Test                        | Steps                                                               | Pass criteria                                                                                                                   | Result |
| ----- | ----------------------------- | --------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | -------- |
| A-1 | Intro screen renders        | Navigate to Bank Accounts from estate dashboard or category picker. | Header "Bank Accounts" with piggy-bank icon. Video player visible (16:9). InformationCard with "Estimate the Balances" content. | Pass   |
| A-2 | Let's Go navigates to entry | Tap "Let's Go" button.                                              | Navigates to`/bequeathal/bank-accounts/entry`. Entry form visible.                                                              | Pass   |
| A-3 | Skip navigates away         | Tap "Skip for now" button.                                          | Navigates to estate dashboard.                                                                                                  | Pass   |
| A-4 | Learn more opens link       | Tap "Learn more" link.                                              | External browser opens gov.uk link.                                                                                             | Pass   |

---

## B. UK Bank — Add Flow


| #    | Test                                            | Steps                                                                                                                                                       | Pass criteria                                                                                                                                                                                                      | Pass? |
| ------ | :------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| B-1  | Add current account — basic                    | Select "Barclays" from provider search. Account type = Current Account. Ownership = Personal. Enter account number "12345678". Enter balance £1,500. Save. | Navigates to summary. Asset visible with title "Barclays - Current Account", balance £1,500.                                                                                                                      | Pass  |
| B-2  | Add savings account                             | Select "HSBC". Account type = Savings Account. Ownership = Joint. Enter balance £25,000. Leave account number blank. Save.                                 | Asset saved. Title "HSBC - Savings Account".`ownershipType === 'joint'`. Account number absent/undefined in data.                                                                                                  | Pass  |
| B-3  | Add fixed-term deposit                          | Select "Nationwide Building Society". Account type = Fixed Term Deposit. Ownership = Personal. Enter balance £10,000. Save.                                | Asset saved with`accountType === 'fixed-term'`.                                                                                                                                                                    | Pass  |
| B-4  | Add "Other" account type                        | Select "Monzo". Account type = Other. Enter balance £500. Save.                                                                                            | Asset saved with`accountType === 'other'`.                                                                                                                                                                         | Pass  |
| B-5  | Provider search works                           | Tap provider field. Type "Star".                                                                                                                            | "Starling Bank" appears in filtered list. Other banks hidden.                                                                                                                                                      | Pass  |
| B-6  | Provider "Other" option                         | Select "Other" from provider list. Complete form. Save.                                                                                                     | Asset saved with`provider === 'Other'`.                                                                                                                                                                            | Pass  |
| B-7  | Balance "Unsure" checkbox                       | Select any bank + account type. Tick "Unsure of balance". Save.                                                                                             | In data viewer:`estimatedValueUnknown === true`, `estimatedValue` is `undefined` (not 0). Balance input disabled/dimmed while ticked.                                                                              | pass  |
| B-8  | Balance rounding                                | Enter balance £1,234.56. Save.                                                                                                                             | `estimatedValue === 1235` (rounded to nearest £1).                                                                                                                                                                | pass  |
| B-9  | Account number validation — too short          | Enter account number "12". Tap save.                                                                                                                        | Alert: "Invalid Account Number" — "UK account numbers must be 3-8 digits". Save blocked.                                                                                                                          | pass  |
| B-10 | Account number validation — too long prevented | Try entering more than 8 digits in account number field.                                                                                                    | Field maxLength prevents input beyond 8 characters.                                                                                                                                                                | pass  |
| B-11 | Account number — non-numeric stripped          | Type "ABC123DEF" in account number field.                                                                                                                   | Field shows "123" only (non-digits stripped on input).                                                                                                                                                             | pass  |
| B-12 | Account number — 3 digits accepted             | Enter account number "123". Save (with valid provider + type).                                                                                              | Save succeeds.`accountNumber === '123'` in data.                                                                                                                                                                   | Pass  |
| B-13 | Genuine zero balance (not unsure)               | Select bank. Enter balance 0 explicitly (do NOT tick "Unsure"). Save. Navigate away. Re-edit.                                                               | `estimatedValue === 0`, `estimatedValueUnknown` is absent/undefined. On re-edit, balance shows 0 and "Unsure" is NOT ticked.                                                                                       | Pass  |
| B-14 | Totals with unknown balance                     | Add account A with balance 1000. Add account B with "Unsure" ticked. Check summary.                                                                         | Total shows 1000 (not 0, not 2000). Account B card shows value as 0 or absent.                                                                                                                                     | Pass  |
| B-15 | Edit round-trip — unknown flag lifecycle       | Add account with "Unsure" ticked. Save. Edit same account. Verify checkbox is ticked and balance disabled. Untick "Unsure", enter 500. Save. Edit again.    | First edit: checkbox ticked, balance disabled. Second edit: checkbox NOT ticked, balance shows 500. Data viewer:`estimatedValue === 500`, `estimatedValueUnknown` absent. Flag does not stick after being cleared. | Pass  |

---

## C. Non-UK Bank — Add Flow


| #   | Test                                   | Steps                                                                                                                                                      | Pass criteria                                                                                                                                     | Pass ? |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| C-1 | Non-UK Bank shows conditional fields   | Select "Non UK Bank" from provider list.                                                                                                                   | "Bank Name *", "Account ID", and "Notes" fields appear. Account Number field hidden.                                                              |        |
| C-2 | Non-UK Bank — required bank name      | Select "Non UK Bank". Leave bank name blank. Try to save.                                                                                                  | Save button disabled (`canSubmit` false).                                                                                                         |        |
| C-3 | Non-UK Bank — complete save           | Select "Non UK Bank". Bank Name = "Deutsche Bank". Account ID = "DE1234567". Notes = "IBAN details". Account type = Savings. Enter balance £50,000. Save. | Asset saved. Title "Deutsche Bank - Savings Account".`isNonUkBank === true`, `nonUkBankName === 'Deutsche Bank'`. Account ID and notes persisted. |        |
| C-4 | Non-UK Bank — ownership visible       | Select "Non UK Bank". Fill bank name. Set account type to Current Account.                                                                                 | Ownership field visible (not ISA). Can select Personal or Joint.                                                                                  |        |
| C-5 | Switch from Non-UK to UK clears fields | Select "Non UK Bank". Enter bank name "Test Bank", account ID "999". Then switch provider to "Barclays".                                                   | `nonUkBankName`, `accountId`, `notes` cleared. Non-UK fields hidden. UK Account Number field appears.                                             |        |

---

## D. ISA Handling (Cross-Category Save)


| #   | Test                              | Steps                                                                                                            | Pass criteria                                                                                                                                                                                             |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | ISA warning appears               | Select any UK bank. Set account type to "ISA".                                                                   | Green info box appears: "This will be saved under Investments and appear in that section". Ownership field hidden.                                                                                        |
| D-2 | ISA saves as InvestmentAsset      | Select "Barclays". Account type = ISA. Enter balance £20,000. Enter account number "87654321". Save.            | In data viewer: asset`type === 'investment'`, `investmentType === 'ISA'`, `provider === 'Barclays'`, `accountNumber === '87654321'`, `estimatedValue === 20000`. NOT saved as `type === 'bank-accounts'`. |
| D-3 | ISA hides ownership field         | Set account type to ISA.                                                                                         | Ownership field not visible (ISAs are always personal by UK law).                                                                                                                                         |
| D-4 | Non-UK ISA                        | Select "Non UK Bank". Bank Name = "UBS". Account type = ISA. Account ID = "CH999". Enter balance £15,000. Save. | Saved as InvestmentAsset.`provider === 'UBS'`, `accountNumber === 'CH999'` (maps from accountId for non-UK).                                                                                              |
| D-5 | ISA appears in bank summary total | From D-2, navigate to bank accounts summary.                                                                     | Total value includes the ISA amount. ISA visible in list (with green badge if implemented).                                                                                                               |

---

## E. Edit Flow


| #   | Test                              | Steps                                                                      | Pass criteria                                                                                                                                                  |
| ----- | ----------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-1 | Edit loads existing data          | From summary screen, tap edit on the Barclays Current Account from B-1.    | Form shows: provider "Barclays", account type "Current Account", ownership "Personal", account number "12345678", balance £1,500. Header says "Edit Account". |
| E-2 | Edit saves changes                | Change balance to £2,000. Save.                                           | Summary shows updated balance £2,000. Data viewer confirms`estimatedValue === 2000`.                                                                          |
| E-3 | Edit — change provider           | Edit an existing account. Change provider from "Barclays" to "HSBC". Save. | `provider === 'HSBC'` in data. Title updated.                                                                                                                  |
| E-4 | Edit non-existent asset redirects | Navigate directly to`/bequeathal/bank-accounts/entry?id=nonexistent-id`.   | Redirected to summary screen (guard in`useEffect`).                                                                                                            |
| E-5 | Net wealth toast on edit          | Edit an account worth £1,500. Change to £2,000. Save.                    | Net wealth toast shows +£500 delta.                                                                                                                           |

---

## F. Delete Flow


| #   | Test                | Steps                                   | Pass criteria                                                                         |
| ----- | --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| F-1 | Delete from summary | From summary, tap delete on an account. | Confirmation alert appears.                                                           |
| F-2 | Delete confirmed    | Confirm deletion.                       | Account removed from list. Total value recalculated. Data viewer confirms asset gone. |
| F-3 | Delete cancelled    | Tap cancel on delete confirmation.      | Account still in list. No changes.                                                    |

---

## G. Draft Auto-Save


| #   | Test                             | Steps                                                                                                                                                       | Pass criteria                                                                                                                                       |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-1 | Draft saves on navigate away     | Start adding new account. Select "Barclays", enter balance £1,000. Navigate back (don't save). Return to entry.                                            | DraftBanner appears: "Continue where you left off". Form pre-filled with Barclays + £1,000.                                                        |
| G-2 | Draft discard — new asset       | From G-1, tap discard on draft banner.                                                                                                                      | Form resets to defaults (blank provider, balance 0, account type "current").                                                                        |
| G-3 | Draft discard — editing         | Edit an existing account. Change balance. Navigate away. Return. Tap discard.                                                                               | Form reverts to the saved asset data (not draft).                                                                                                   |
| G-4 | Draft cleared on save            | Add a new account. Navigate away (draft created). Return, restore draft. Complete save. Navigate away and return to entry.                                  | No draft banner shown. Fresh form.                                                                                                                  |
| G-5 | Save then add new — form blank  | Save a new bank account (e.g. Monzo, £500). From summary, tap "Add" to start a new account.                                                                | Entry form is completely blank: no provider, balance £0, account type "Current Account". No draft banner. Previous account's data must NOT appear. |
| G-6 | Save then add new — app restart | Save a new bank account. Kill and reopen the app. Navigate to bank accounts and tap "Add".                                                                  | Form is blank. No draft banner. Previous save did not leave a stale draft in AsyncStorage.                                                          |
| G-7 | Quick save after typing          | Start new account. Select Barclays, type balance £2,000, immediately tap "Add this account" (within 2 seconds of last keystroke). From summary, tap "Add". | Form is blank. The debounce timer must not flush stale data after save.                                                                             |
| G-8 | Discard then add new             | Start new account, fill in Barclays + £1,000. Navigate away (draft created). Return, tap discard on draft banner. Save a different account. Tap "Add".     | Form is blank. No ghost draft from the discarded session.                                                                                           |

---

## H. Validation


| #   | Test                         | Steps                                                  | Pass criteria                                                                 |
| ----- | ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| H-1 | Provider required            | Open fresh form. Don't select provider. Tap save area. | Save button disabled. Attention label shows "Bank name" required.             |
| H-2 | Non-UK bank name required    | Select "Non UK Bank". Leave bank name empty.           | Save button disabled. Attention label shows "Non-UK bank name" required.      |
| H-3 | Account type defaults        | Open fresh form.                                       | Account type defaults to "Current Account". Ownership defaults to "Personal". |
| H-4 | Validation attention trigger | Don't select bank provider. Tap the attention label.   | ScrollView scrolls to relevant field.                                         |

---

## I. Summary Screen


| #   | Test                               | Steps                                                            | Pass criteria                                              |
| ----- | ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| I-1 | Summary shows all accounts         | Add 3 accounts with different providers. Go to summary.          | All 3 visible with correct titles and balances.            |
| I-2 | Total value correct                | Add accounts worth £1,000, £2,000, £3,000. Check summary.     | Total shows £6,000.                                       |
| I-3 | Empty state                        | Clear all accounts. Go to summary.                               | Shows empty state / "no accounts" message with add button. |
| I-4 | Add from summary                   | From summary, tap "Add" button.                                  | Navigates to entry form (no ?id param). Fresh form.        |
| I-5 | "That's everything" marks complete | From summary with at least one account, tap "That's everything". | Category marked complete. Navigates to estate dashboard.   |

---

## J. Data Integrity


| #   | Test                           | Steps                                                                         | Pass criteria                                                                                                                                                                                                           |
| ----- | -------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J-1 | Non-UK fields not on interface | Add a Non-UK bank with bank name, account ID, and notes. Check data viewer.   | `nonUkBankName`, `accountId`, `notes` are persisted on the asset object (note: these fields are NOT on the `BankAccountAsset` interface — they persist via dynamic `addAsset` but are not typed). Potential tech debt. |
| J-2 | UK account — no non-UK fields | Add a UK bank account (e.g. Barclays). Check data viewer.                     | `nonUkBankName`, `accountId`, `notes` are `undefined`. `isNonUkBank` is `false`.                                                                                                                                        |
| J-3 | Balance of 0 persists          | Select bank. Tick "Unsure of balance". Save. Navigate away. Edit the account. | Balance shows £0. "Unsure" checkbox ticked.`estimatedValue === 0` in data (not undefined/null).                                                                                                                        |
| J-4 | Non-UK edit loads correctly    | Save a Non-UK bank (C-3). Navigate away. Edit it.                             | Form shows "Non UK Bank" as provider. Bank name, account ID, notes all restored.                                                                                                                                        |

---

## Summary — Manual Tests


| Section              | Tests  | Notes                                             |
| ---------------------- | -------- | --------------------------------------------------- |
| A — Intro screen    | 4      | Navigation + content                              |
| B — UK Bank add     | 15     | Core happy path + validation + value unknown flag |
| C — Non-UK Bank     | 5      | Conditional fields                                |
| D — ISA handling    | 5      | Cross-category save                               |
| E — Edit flow       | 5      | Load + update                                     |
| F — Delete flow     | 3      | CRUD completion                                   |
| G — Draft auto-save | 8      | Persistence lifecycle + race conditions           |
| H — Validation      | 4      | Required fields + defaults                        |
| I — Summary screen  | 5      | Display + totals                                  |
| J — Data integrity  | 4      | Type safety + edge cases                          |
| **Total**            | **58** |                                                   |

---

# Part 2: Jest Unit Tests (implement after manual tests pass)

## Candidates for Jest

### 1. Balance rounding logic

Extract and test the rounding: `Math.round(balanceNotSure ? 0 : formData.estimatedBalance)`.

### 2. Account number validation

Extract and test: strip non-digits, validate 3-8 digit length.

### 3. ISA save data mapping

Extract and test: when `accountType === 'isa'`, the investment data object is built correctly with `investmentType: 'ISA'`, correct field mapping from bank form.

### 4. UK vs Non-UK field mapping

Extract and test: the save data object differs for UK vs Non-UK (account number vs account ID, `isNonUkBank` flag, notes field).

### 5. Title generation

Extract and test: `${displayBankName} - ${accountTypeLabel}` produces correct titles for UK, Non-UK, and ISA accounts.

### 6. canSubmit logic

Extract and test: `formData.bankName && (!isNonUkBank || formData.nonUkBankName)`.

### Estimated Jest scope

~15-20 assertions across ~8-10 test cases. Would require extracting 3-4 small pure functions from the component (save data builders, validation, title generation). This is a healthy refactor that improves the code regardless of testing.

### Prerequisite

Extract the save/validation logic from `entry.tsx` into a separate `bankAccountMapping.ts` (or similar) file to make it testable without React component rendering. This mirrors the pattern established with `trustDataMapping.ts` for Property.
