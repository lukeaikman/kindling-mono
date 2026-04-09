# Cryptocurrency — Test Plan

**Entry form:** `app/bequeathal/crypto-currency/entry.tsx`
**Intro screen:** `app/bequeathal/crypto-currency/intro.tsx`
**Summary screen:** `app/bequeathal/crypto-currency/summary.tsx` (generic `CategorySummaryScreen`)

---

## Precursor: Purge data before testing

1. Open developer dashboard (triple-tap header)
2. Clear all AsyncStorage (or uninstall and reinstall)
3. Create test people in Onboarding → Family:
   - **Person 1:** John Smith (Spouse)
   - **Person 2:** Jane Doe (Daughter)
   - **Person 3:** Bob Smith (Son)
4. Confirm estate dashboard shows no assets
5. Select "Cryptocurrency" category and navigate in

---

# Part 1: Manual Tests

## A. Intro Screen


| #   | Test                        | Steps                                                           | Pass criteria                                                                                                                | Pass? |
| ----- | ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| A-1 | Intro screen renders        | Navigate to Cryptocurrency from estate dashboard (first visit). | Header "Cryptocurrency" with bitcoin icon. Video player visible (16:9). InformationCard with "Digital Assets Need Planning". | Pass  |
| A-2 | Let's Go navigates          | Tap "Let's Go" button.                                          | Navigates to Add form                                                                                                        | Pass  |
| A-3 | Skip navigates to dashboard | Tap "Skip for now".                                             | Navigates back to estate dashboard.                                                                                          | Pass  |
| A-4 | Back button works           | Tap back arrow.                                                 | Returns to previous screen (estate dashboard or category picker).                                                            | ??    |
| A-5 | Learn more opens link       | Tap "Learn about cryptocurrency inheritance planning" link.     | External browser opens gov.uk HMRC inheritance tax page.                                                                     | Pass  |
| A-6 | Information content correct | Scroll through InformationCard.                                 | Mentions digital keys/wallet addresses, assets could be lost forever, and documenting holdings for executors.                | Pass  |

---

## B. Add Flow — Basic


| #   | Test                             | Steps                                                                                                                | Pass criteria                                                                                                         | Pass? |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| B-1 | Add holding — exchange          | Platform = "Coinbase". Username = "john@email.com". Value = £15,000. Tap "Add this holding".                        | Navigates to summary. Asset visible with title "Coinbase - john@email.com", value £15,000.                           | Pass  |
| B-2 | Add holding — wallet            | Platform = "Hardware Wallet". Username = "Ledger Nano S". Value = £50,000. Save.                                    | Asset saved. Title "Hardware Wallet - Ledger Nano S".                                                                 | Pass  |
| B-3 | Add holding — no username       | Platform = "Binance". Leave username blank. Value = £5,000. Save.                                                   | Asset saved. Title "Binance" (no dash/username appended).`accountUsername` absent/undefined in data.                  | Pass  |
| B-4 | Add holding — with notes        | Platform = "Coinbase". Username = "trading-account". Value = £10,000. Notes = "Main trading account, 2FA on". Save. | Asset saved.`notes === 'Main trading account, 2FA on'` in data viewer.                                                | Pass  |
| B-5 | Add holding — "Other" platform  | Platform = "Other". Username = "DeFi Wallet". Value = £2,000. Save.                                                 | Asset saved with`platform === 'Other'`.                                                                               | Pass  |
| B-6 | Value rounding                   | Platform = "Kraken". Value = £3,456.78. Save.                                                                       | `estimatedValue === 3457` (rounded to nearest £1).                                                                   | Pass  |
| B-7 | Header says "Add Crypto Account" | Navigate to entry form with no`?id` param.                                                                           | Header title is "Add Crypto Account". Form title is "Add a crypto account or wallet." Button says "Add this holding". | Pass  |

---

## C. Platform Dropdown


| #   | Test                     | Steps                                             | Pass criteria                                                                               | Pass? |
| ----- | -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- |
| C-1 | Exchanges listed         | Open Platform dropdown.                           | Shows Coinbase, Binance, Kraken, Bitstamp, Gemini, Crypto.com, KuCoin, OKX, Huobi.          | Pass  |
| C-2 | Separator visible        | Open Platform dropdown and scroll.                | Visual separator line between exchanges and wallets sections.                               | Pass  |
| C-3 | Wallets listed           | Open Platform dropdown and scroll past separator. | Shows Hardware Wallet, Software Wallet, Paper Wallet, Mobile Wallet, Browser Wallet, Other. | Pass  |
| C-4 | Separator not selectable | Tap the separator line in dropdown.               | Nothing happens. Separator is disabled.                                                     | Pass  |

---

## D. Unsure of Balance


| #   | Test                           | Steps                                                      | Pass criteria                                                                                                                                                   | Pass?                                           |
| ----- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| D-1 | Unsure checkbox disables field | Select any platform. Tick "Unsure of balance".             | Estimated Value field is disabled/dimmed (opacity reduced). Value shows "?".                                                                                    | Pass                                            |
| D-2 | Unsure saves correctly         | Select "Coinbase". Tick "Unsure of balance". Save.         | In data viewer:`estimatedValueUnknown === true`, `estimatedValue` is `undefined`. `netValue` is `undefined`.                                                    | Pass                                            |
| D-3 | Unsure toggle back             | Tick "Unsure of balance". Then untick it.                  | Field becomes active again. Can enter a value.                                                                                                                  | Pass                                            |
| D-4 | Typing value clears unsure     | Tick "Unsure of balance". Then type in the value field.    | "Unsure" checkbox automatically unticks. Value field accepts input.                                                                                             | Defunct — field is disabled when unsure ticked |
| D-5 | Edit round-trip — unsure flag | Add holding with "Unsure" ticked. Save. Edit same holding. | Checkbox is ticked. Value field disabled. Untick, enter £500, save. Edit again: checkbox NOT ticked, value shows £500.`estimatedValueUnknown` absent in data. | Pass                                            |

---

## E. Edit Flow


| #   | Test                       | Steps                                                                      | Pass criteria                                                                                                                              | Pass? |
| ----- | ---------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| E-1 | Edit loads existing data   | From summary, tap edit on "Coinbase - john@email.com" from B-1.            | Form shows: platform "Coinbase", username "john@email.com", value £15,000. Header says "Edit Crypto Account". Button says "Save changes". | Pass  |
| E-2 | Edit saves value change    | Change value from £15,000 to £25,000. Save.                              | Summary shows £25,000. Data viewer:`estimatedValue === 25000`.                                                                            | Pass  |
| E-3 | Edit saves platform change | Edit a holding. Change platform from "Coinbase" to "Kraken". Save.         | Title updated.`platform === 'Kraken'` in data.                                                                                             | Pass  |
| E-4 | Edit saves notes           | Edit a holding with no notes. Add "Seed phrase in safe deposit box". Save. | `notes === 'Seed phrase in safe deposit box'` in data viewer.                                                                              | Pass  |
| E-5 | Net wealth toast on edit   | Edit a holding worth £15,000. Change to £25,000. Save.                   | Net wealth toast fires showing the updated estate total.                                                                                   | Pass  |

---

## F. Delete Flow


| #   | Test                | Steps                                           | Pass criteria                                                                      | Pass? |
| ----- | --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ | ------- |
| F-1 | Delete from summary | From summary, tap delete (X icon) on a holding. | Confirmation alert: "Delete asset" / "Are you sure you want to remove this asset?" | Pass  |
| F-2 | Delete confirmed    | Confirm deletion.                               | Holding removed from list. Total recalculated. Data viewer confirms asset gone.    | Pass  |
| F-3 | Delete cancelled    | Tap cancel on delete confirmation.              | Holding still in list. No changes.                                                 | Pass  |

---

## G. Validation


| #   | Test                         | Steps                                                         | Pass criteria                                                      | Pass?                                                                   |
| ----- | ------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| G-1 | Platform required            | Open fresh form. Don't select platform. Check submit button.  | Submit button disabled. Attention label shows "Platform" required. | Pass                                                                    |
| G-2 | Value NOT required           | Select platform. Leave value at 0. Don't tick "Unsure". Save. | unknown value is true                                              | Pass                                                                    |
| G-3 | Username NOT required        | Select platform. Leave username blank. Save.                  | Save succeeds.`accountUsername` absent/undefined in data.          | Pass                                                                    |
| G-4 | Notes NOT required           | Select platform. Leave notes blank. Save.                     | Save succeeds.`notes` absent/undefined in data.                    | Pass                                                                    |
| G-5 | Validation attention trigger | Don't select platform. Tap the attention label.               | ScrollView scrolls to platform field.                              | N/A — form too short for scroll, feature works but not observable here |

---

## H. Summary Screen


| #   | Test                               | Steps                                                                           | Pass criteria                                                                           | Pass? |
| ----- | ------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------- |
| H-1 | Summary shows all holdings         | Add 3 holdings with different platforms. Go to summary.                         | All 3 visible with correct titles and values.                                           | Pass  |
| H-2 | Total value correct                | Add holdings worth £15,000 + £50,000 + £5,000. Check summary.                | Total shows £70,000. Count shows "Value of 3 Cryptocurrency".                          | Pass  |
| H-3 | Empty state                        | Clear all holdings. Go to summary.                                              | Shows empty state with "Nothing here yet" and add button.                               | Pass  |
| H-4 | Add from summary                   | From summary, tap "Add" button.                                                 | Navigates to entry form (no ?id param). Fresh form.                                     | Pass  |
| H-5 | "That's everything" marks complete | From summary with at least one holding, tap "That's everything".                | Category marked complete. Navigates to estate dashboard. Dashboard card shows complete. | Pass  |
| H-6 | Edit from summary                  | From summary, tap on a holding card.                                            | Navigates to entry form with`?id=` param. Form pre-filled.                              | Pass  |
| H-7 | Unknown balance in total           | Add holding A with £10,000. Add holding B with "Unsure" ticked. Check summary. | Total shows £10,000+ (with "+" suffix). Holding B card shows value as "?".             | Pass  |

---

## I. Data Integrity


| #   | Test                             | Steps                                                                        | Pass criteria                                                                     | Pass? |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------- |
| I-1 | Asset type correct               | Add any holding. Check data viewer.                                          | `type === 'crypto-currency'`. Not `cryptocurrency` (no hyphen) or `crypto`.       | Pass  |
| I-2 | Title built correctly            | Add holding: platform = "Coinbase", username = "john@email.com". Check data. | `title === 'Coinbase - john@email.com'`.                                          | Pass  |
| I-3 | Title without username           | Add holding: platform = "Binance", no username. Check data.                  | `title === 'Binance'` (no trailing dash or space).                                | Pass  |
| I-4 | netValue matches estimatedValue  | Add holding worth £5,000. Check data viewer.                                | `estimatedValue === 5000`, `netValue === 5000`. Both identical.                   | Pass  |
| I-5 | Empty strings saved as undefined | Add holding with empty username and empty notes. Check data.                 | `accountUsername` is `undefined` (not empty string `''`). `notes` is `undefined`. | Pass  |

---

## J. Navigation Edge Cases


| #   | Test                             | Steps                                                     | Pass criteria                                                           | Pass?                                      |
| ----- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| J-1 | Back from entry goes to summary  | From entry form, tap back button.                         | Navigates back to summary (not estate dashboard).                       | Pass                                       |
| J-2 | Back from summary goes to estate | From summary, tap back button.                            | Navigates to estate dashboard.                                          | Pass                                       |
| J-3 | No stack pollution               | Add 3 holdings sequentially. From summary, tap back once. | Goes straight to estate dashboard. No stacked entry forms or summaries. | Pass                                       |
| J-4 | Invalid edit ID redirects        | Navigate to`/bequeathal/crypto-currency/entry?id=bad-id`. | Redirects to summary (guard in useEffect).                              | Defunct — not a realistic mobile scenario |

---

## Summary — Manual Tests


| Section                | Tests  | Notes                                |
| ------------------------ | -------- | -------------------------------------- |
| A — Intro screen      | 6      | Navigation + content + learn more    |
| B — Add flow          | 7      | Core happy path + rounding           |
| C — Platform dropdown | 4      | Exchanges, wallets, separator        |
| D — Unsure of balance | 5      | Flag lifecycle                       |
| E — Edit flow         | 5      | Load + update + toast                |
| F — Delete flow       | 3      | CRUD completion                      |
| G — Validation        | 5      | Required fields (platform only)      |
| H — Summary screen    | 7      | Display + totals + unknown balance   |
| I — Data integrity    | 5      | Storage structure + title generation |
| J — Navigation edges  | 4      | Stack + guards                       |
| **Total**              | **51** |                                      |

---

# Part 2: Jest Unit Tests (implement after manual tests pass)

## Candidates for Jest

### 1. Title generation

Extract and test: `accountUsername ? \`${platform} - ${accountUsername}\` : platform`.

### 2. canSubmit logic

Test: `!!formData.platform`. Simplest validation — only platform required.

### 3. Save data mapping

Extract and test: the `holdingData` object is built correctly from form state, including `estimatedValue` rounding, `estimatedValueUnknown` flag, and undefined-instead-of-empty-string for optional fields.

### 4. Value rounding with unsure flag

Test: `balanceNotSure ? undefined : Math.round(formData.estimatedValue)` produces correct results.

### Estimated Jest scope

~8-10 assertions across ~4-6 test cases. Crypto is simpler than bank accounts — no beneficiary assignments, no cross-category saves, no account number validation.
