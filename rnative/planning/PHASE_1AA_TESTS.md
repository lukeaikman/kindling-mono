# Phase 1aa Test Checklist

## 1) Draft creation without registration (online)
**Goal:** Data saved locally under active owner scope.

Steps:
1. Launch app fresh.
2. Start onboarding (`/onboarding/welcome`) and enter name + DOB.
3. Continue through onboarding screens and add spouse/children.
4. Open Developer Dashboard → Data Viewer.
5. Verify `person-data`, `will-data`, etc. are populated.
6. Confirm keys are scoped: `kindling:<ownerId>:person-data`, etc.

Expected:
- Data exists in scoped keys.
- No server activity required.

---

## 2) Draft persists across restart
**Goal:** Local draft reloads.

Steps:
1. Complete onboarding once (same as test 1).
2. Kill the app completely.
3. Reopen app.
4. Go to Developer Dashboard → Data Viewer.

Expected:
- Same draft data is still present in scoped keys.

---

## 3) Offline at registration gate (secure account)
**Goal:** User sees gating message, cannot register.

Steps:
1. Complete onboarding to reach `/auth/secure-account`.
2. Turn on airplane mode.
3. Tap "Create Account & Continue".

Expected:
- Error: "You can keep drafting offline… connect to the internet…"
- Bottom note: "You're offline. Your draft is saved locally…"

---

## 4) Offline at vanilla registration
**Goal:** Blocked registration with clear message.

Steps:
1. From `/intro`, tap Register.
2. Turn on airplane mode.
3. Fill in fields and tap "Create Account".

Expected:
- Error: "Please connect to the internet to create your account."
- Offline note appears below.

---

## 5) Logout clears active session but preserves scoped data
**Goal:** Data remains scoped to ownerId even after logout.

Steps:
1. Register and log in.
2. Go to Developer Dashboard → Logout.
3. Return to Developer Dashboard → Data Viewer.

Expected:
- Scoped data still present (same ownerId).
- User is on login screen.

---

## 6) New ownerId generates fresh scoped storage
**Goal:** New draft does not see old draft data.

Steps:
1. Purge all data in Developer Dashboard.
2. Relaunch app.
3. Start onboarding, add data.
4. Note scoped storage keys.
5. Purge all data again.
6. Repeat onboarding with different data.

Expected:
- New ownerId scope used.
- Data from previous ownerId is not visible.

---

## 7) Person.serverId remains unset before sync
**Goal:** No serverId is set pre-sync.

Steps:
1. Complete onboarding, do not register.
2. Inspect `person-data`.

Expected:
- No `serverId` fields present (or all `serverId` undefined).
