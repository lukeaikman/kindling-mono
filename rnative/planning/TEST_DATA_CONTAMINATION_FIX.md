# Data Contamination Fix — Test Plan

---

## Precursor: Seed User A's data

1. Open developer dashboard (triple-tap header)
2. Purge all data (Clear AsyncStorage + Clear Auth)
3. Register as **User A** (e.g. usera@test.com)
4. Complete onboarding — add a partner and two children
5. Go to People > Executors — add at least 2 executors (e.g. "Exec One", "Exec Two")
6. Go to Estate dashboard — select "Bank Accounts" and "Pensions" as categories
7. Add one bank account asset
8. Confirm: People section shows executors; Estate dashboard shows both categories with bank account asset

User A is now the "previous user" whose data must not leak.

---

# Part 1: Registration Contamination (the original bug)

These tests verify that a new registration on the same device never inherits data from a previous user.

## A. Register after logout from will-dashboard

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| A-1 | Dashboard logout works | As User A, tap menu on will-dashboard. Tap "Logout". | App navigates to login screen. No crash. | |
| A-2 | Register new user | From login screen, navigate to Register. Create **User B** (userb@test.com). Complete registration. | Registration succeeds. Navigates to onboarding. | |
| A-3 | People section is empty | After onboarding welcome, navigate to People section. | No executors listed. No people from User A. Drop-down for guardians shows no pre-populated entries. | |
| A-4 | Estate dashboard is clean | Navigate to Estate dashboard. | No categories pre-selected. No "Bank Accounts" or "Pensions" shown. No assets. | |
| A-5 | Will data is clean | Navigate to Executors selection screen. | Executor list is empty. No entries from User A. | |
| A-6 | Guardianship is clean | If User B adds children in onboarding, navigate to Guardianship. | Guardian drop-down shows only people User B created, not User A's people. | |

---

## B. Register after session expiry (no explicit logout)

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| B-1 | Simulate expired session | As User A with data, go to developer dashboard. Tap "Clear Auth (Keychain)" only (do NOT purge app data). Close and reopen app. | App detects invalid session. Shows login/register screen. | |
| B-2 | Register new user on stale device | From login screen, register as **User C** (userc@test.com). | Registration succeeds. | |
| B-3 | No contamination from User A | Navigate to People section and Estate dashboard. | Both are empty. No executors, no categories, no assets from User A. | |

---

## C. Register after app kill (cold start)

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| C-1 | Kill app with User A data | As User A with data, force-quit the app (swipe away from app switcher). | App is killed. | |
| C-2 | Clear auth on relaunch | Relaunch app. Go to developer dashboard. Clear Auth only. Return to login screen. | Login screen shown. | |
| C-3 | Register fresh user | Register as **User D** (userd@test.com). | Registration succeeds. | |
| C-4 | No contamination | Navigate to People and Estate sections. | Both are completely empty. | |

---

# Part 2: Login Data Isolation

These tests verify that logging in as a returning user loads only their data, even when another user was active on the device.

## D. Returning user gets their own data

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| D-1 | Setup: User A has data | Start fresh (purge all). Register User A. Add 2 executors + select "Bank Accounts" category + add 1 bank account. Log out from will-dashboard. | Logout succeeds. | |
| D-2 | Setup: User B has data | Register User B. Complete onboarding. Add 1 executor (different name from User A's). Select "Pensions" category. Log out. | Logout succeeds. | |
| D-3 | User A login loads User A data | Log in as User A. Navigate to People section. | Shows User A's 2 executors. Does NOT show User B's executor. | |
| D-4 | User A estate is correct | Navigate to Estate dashboard. | Shows "Bank Accounts" category with 1 asset. Does NOT show "Pensions". | |
| D-5 | User B login loads User B data | Log out. Log in as User B. Navigate to People section. | Shows User B's 1 executor. Does NOT show User A's executors. | |
| D-6 | User B estate is correct | Navigate to Estate dashboard. | Shows "Pensions" category. Does NOT show "Bank Accounts". | |

---

## E. Login with stale scope from different user

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| E-1 | Setup stale scope | User A is active with data. Clear Auth only (developer dashboard). Do NOT purge app data. | Login screen shown. AsyncStorage still has User A's activeWillMakerId. | |
| E-2 | Login as User B | Log in as User B (who previously registered and has data in AsyncStorage). | Login succeeds. | |
| E-3 | User B sees own data | Navigate to People and Estate sections. | Shows only User B's data. No contamination from User A. | |
| E-4 | User A data preserved | Log out. Log in as User A. | User A's executors, categories, and assets are intact. Not overwritten by User B's session. | |

---

# Part 3: Logout Functionality

## F. Will-dashboard logout

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| F-1 | Logout button visible | Open will-dashboard menu (bottom sheet or hamburger). | "Logout" option is visible, styled as destructive (red). | |
| F-2 | Logout clears auth | Tap "Logout". | App navigates to login screen. | |
| F-3 | Auth state cleared | After logout, reopen app. | App does NOT auto-login. Shows login/register screen. | |
| F-4 | App state cleared | After logout, go to developer dashboard and check AsyncStorage keys. | `kindling-active-willmaker-id` key is removed (or empty). | |
| F-5 | Cannot navigate back | After logout, press device back button / swipe back. | Does NOT return to will-dashboard. Stays on login/auth flow. | |

---

## G. Developer dashboard logout (existing)

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| G-1 | Dev logout still works | Open developer dashboard. Tap "Logout". | Navigates to login screen. Same behaviour as before the fix. | |
| G-2 | State fully cleared | After dev logout, re-register as a new user. Navigate to People and Estate. | Both are empty. No stale data. | |

---

# Part 4: Edge Cases

## H. Abandoned onboarding scope

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| H-1 | Start onboarding without registering | Fresh app. Go through intro. Start onboarding. Enter name and family members (creating a will-maker Person). Do NOT register. | will-maker Person is created. activeWillMakerId is set in AsyncStorage. | |
| H-2 | Register a different user | Navigate to register screen. Register as new user. | Registration succeeds. | |
| H-3 | No contamination from abandoned onboarding | Navigate to People section. | Does NOT show the family members from the abandoned onboarding. Clean slate. | |

---

## I. Rapid user switching

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| I-1 | Quick switch | Log in as User A. Immediately log out. Immediately log in as User B. | No crash. User B sees only their data. | |
| I-2 | Triple switch | User A login -> logout -> User B login -> logout -> User A login. | User A sees their original data intact after both switches. | |

---

## J. Biometric authentication

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| J-1 | Biometric prompt on register | Register a new user on a device with biometrics. | Biometric prompt appears (or is skipped gracefully). No crash. | |
| J-2 | Biometric works after fix | After registering + completing onboarding, close and reopen app. | If biometric was enabled, app unlocks correctly to the new user's data, not a stale user's data. | |

---

# Part 5: Data Integrity

## K. Previous user's AsyncStorage data is not destroyed

| # | Test | Steps | Pass criteria | Pass? |
|---|------|-------|---------------|-------|
| K-1 | User A data survives User B registration | User A has data. Log out. Register User B. Open developer dashboard. Check AsyncStorage keys. | Keys with `kindling:{UserA_UUID}:` prefix still exist in AsyncStorage. User A's data is preserved, just not loaded. | |
| K-2 | User A can reclaim data | After User B's session, log out. Log in as User A. | User A's full data (executors, categories, assets, people) loads correctly. Nothing was overwritten or deleted. | |

---

# Summary Checklist

| Area | Tests | Blocking? |
|------|-------|-----------|
| Registration after logout | A-1 through A-6 | Yes |
| Registration after session expiry | B-1 through B-3 | Yes |
| Registration after app kill | C-1 through C-4 | Yes |
| Login data isolation | D-1 through D-6 | Yes |
| Login with stale scope | E-1 through E-4 | Yes |
| Will-dashboard logout | F-1 through F-5 | Yes |
| Dev dashboard logout | G-1 through G-2 | No |
| Abandoned onboarding | H-1 through H-3 | Yes |
| Rapid switching | I-1 through I-2 | No |
| Biometric after fix | J-1 through J-2 | No |
| Data preservation | K-1 through K-2 | Yes |
