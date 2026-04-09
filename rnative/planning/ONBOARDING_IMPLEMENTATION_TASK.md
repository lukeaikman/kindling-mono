# Onboarding Screens — Implementation Summary (Task Body)

This document describes what has been implemented for the onboarding flow in the native app: forms, data model, screen flow, and storage. All references are to actual code paths in `native-app/`.

---

## 1. Summary: Onboarding Forms and Data We Build

### 1.1 Overview

The onboarding flow is a **5-step will-creation setup** delivered as five screens under a single stack layout. It collects:

- **Step 1 (Welcome):** Will-maker identity — first name, last name, date of birth (and optional middle names in the UI only; middle names are **not** persisted on the Person model).
- **Step 2 (Location):** Residence and nationality — country of residence (UK region), nationality, domiciled-in-UK, currently-resident. This data is **not** yet stored in any persisted model; it is logged and used only for navigation.
- **Step 3 (Family):** Relationship status, divorce history, spouse/partner details (first + last name), and children/dependents with relationship type, parental responsibility, capacity, and optional co-guardians. This step **creates and updates Person records and RelationshipEdge records**.
- **Step 4 (Extended Family):** Parents alive, partner’s parents alive (conditional), siblings alive, and number of siblings. This data is **not** persisted to the app’s data model; it is logged and used only for navigation/planning.
- **Step 5 (Wrap-up):** Static summary and “Coming up next” copy; no form fields. On Continue, the user is sent to **Secure account** (`/auth/secure-account`).

### 1.2 Data We Actually Persist from Onboarding

| Source | Stored where | Notes |
|--------|--------------|--------|
| Welcome: first name, last name, DOB | `Person` (will-maker), `WillData.userId` | Will-maker created/updated via `personActions`; `willActions.updateWillData({ userId })` links will to person. Middle names not stored. |
| Location | — | Not stored. `location.tsx` logs and navigates only. |
| Family: spouse/partner | `Person` + `RelationshipEdge` (SPOUSE or PARTNER) | `personActions.addPerson` with `createdInOnboarding: true`; then `relationshipActions.addRelationship` with phase `'active'`. |
| Family: children | `Person` + `RelationshipEdge` (PARENT_OF with qualifiers) | Each child is a Person with `guardianIds`, `capacityStatus`, etc.; edge has qualifiers (e.g. biological, adoptive). |
| Extended family | — | Not stored. `extended-family.tsx` logs and navigates only. |
| Wrap-up | — | No data; navigates to `/auth/secure-account`. |

The **will-maker** is the single Person with role `'will-maker'`. Their ID is used as the **active will-maker scope** (`activeWillMakerId`) for storage keys. All onboarding Person and relationship data is stored under that scope.

---

## 2. Flow in the Form (Screen-by-Screen)

### 2.1 Entry into onboarding

- **Intro screen** (`app/intro.tsx`): Primary entry. “Start Creating Your Will And Estate Plan” calls `router.push('/onboarding/welcome')` (line 48). “Login” goes to `/auth/login`.
- **Deep link** (`app/open.tsx`): Can route to `/intro` (and thus user can then go to onboarding), or to video-intro / risk-questionnaire. Onboarding form flow itself is not changed by deep link.
- **Login screen** (`app/auth/login.tsx`): “Start creating a will” link pushes `/onboarding/welcome` (line 162).
- **Register** (`app/auth/register.tsx`): On success can `router.replace('/onboarding/welcome')` (line 117).

So the **canonical start of the onboarding form flow** is navigation to `/onboarding/welcome`.

### 2.2 Layout and navigation

- **Layout:** `app/onboarding/_layout.tsx` defines a `Stack` with `headerShown: false` and five screens: `welcome`, `location`, `family`, `extended-family`, `wrap-up`.
- **Forward navigation:** Each screen’s primary action calls `router.push(...)` to the next route:
  - Welcome → `router.push('/onboarding/location')` (`app/onboarding/welcome.tsx` line 141)
  - Location → `router.push('/onboarding/family')` (`app/onboarding/location.tsx` line 55)
  - Family → `router.push('/onboarding/extended-family')` (`app/onboarding/family.tsx` line 571)
  - Extended family → `router.push('/onboarding/wrap-up')` (`app/onboarding/extended-family.tsx` line 84)
  - Wrap-up → `router.push('/auth/secure-account')` (`app/onboarding/wrap-up.tsx` line 43)
- **Back:** All screens except Welcome show a header with `BackButton` that calls `router.back()`.

### 2.3 Step 1 — Welcome (`app/onboarding/welcome.tsx`)

- **Form state (local):** `firstName`, `middleNames`, `lastName`, `dateOfBirth`, `ageError` (string or null). Age is derived from DOB via `calculateAge` from `src/utils/helpers.ts`; under 18 or over 90 sets an `ageError` and shows a warning (user can still continue).
- **Load on mount:** `useEffect` runs once. If there is no `activeWillMakerId`, `setActiveWillMakerId(generateUUID())` is called. Then `willActions.getUser()` is used; if a user exists, `firstName`, `lastName`, and `dateOfBirth` are pre-filled. Middle names are not loaded (not stored).
- **Submit:** On Continue, if an existing will-maker Person exists, `personActions.updatePerson(existingUser.id, { firstName, lastName, dateOfBirth })`. Otherwise `personActions.addPerson({ firstName, lastName, email: '', phone: '', dateOfBirth, relationship: 'other', roles: ['will-maker'] })` and then `willActions.updateWillData({ userId })`. Then `router.push('/onboarding/location')`.
- **Validation:** `isValid = firstName && lastName && dateOfBirth && !ageError`. Continue is disabled when `!isValid`.
- **Dev access:** Double-tap on the header (step indicator area) goes to `/developer/dashboard`.

### 2.4 Step 2 — Location (`app/onboarding/location.tsx`)

- **Form state (local only):** `countryOfResidence`, `nationality`, `domiciledInUK`, `currentlyResident`. Options are fixed in the file (e.g. England/Wales/Scotland, British/American/…, Yes/No/Not sure).
- **Submit:** Logs the four values and calls `router.push('/onboarding/family')`. No persistence.
- **Validation:** `isValid = countryOfResidence && nationality && domiciledInUK && currentlyResident`.
- **Back:** `router.back()`.
- **Dev access:** Double-tap on header opens developer dashboard.

### 2.5 Step 3 — Family (`app/onboarding/family.tsx`)

- **Form state (local):** Relationship status, divorced (select), hasChildren (yes/no), children array (per-child: id, firstName, lastName, dateOfBirth?, relationship, guardianIds, capacityStatus), spouse first/last name, co-guardian form state, and pre-population flags for last names.
- **Load on mount:** `loadExistingData()` uses `willActions.getUser()`, then `relationshipActions.getSpouse(currentUser.id, 'active')` and `relationshipActions.getChildren(currentUser.id)` to pre-fill spouse and children.
- **Relationship status:** Single, Married, Civil partnership, Cohabiting, Widowed. If status implies a partner (married, civil-partnership, cohabiting), spouse first/last name are required and spouse last name can be pre-populated from will-maker’s last name.
- **Divorce:** Select with options (no, yes-once, yes-multiple, currently-divorcing, separated, annulled, prefer-not-to-say, other). Stored in local state only; not written to Person or RelationshipEdge in this screen.
- **Children:** If “Yes”, one child is auto-added. Each child has: first name, last name, optional DOB, relationship to you (biological-child, adopted-child, stepchild, foster-child, other), Responsibility (sole / co-responsibility with partner / add co-guardian), Capacity (under-18, over-18-lacks-capacity, over-18-full-capacity, special-circumstances). Co-guardian can be added via inline form (first name, last name, optional relationship). Delete child only when there is more than one child.
- **Submit:** `personActions.clearOnboardingFamilyMembers()` removes existing people with `createdInOnboarding === true` and their relationship edges. Then:
  - If partner status and spouse names present: `personActions.addPerson` for spouse with `createdInOnboarding: true`, then push SPOUSE or PARTNER edge with phase `'active'`.
  - For each child: `personActions.addPerson` with child fields and `guardianIds` resolved (user-placeholder → current user id, spouse-placeholder → spouse id). Then push PARENT_OF edge with qualifiers (biological, adoptive, step, foster) from relationship type.
  - Before writing relationships, the code checks that all involved person IDs exist in storage (`storage.load(peopleStorageKey, [])`); if any are missing, it logs an error and does not call `relationshipActions.addRelationship`. Then it writes all relationship edges.
- **Validation:** `isSpouseValid` (no partner or both spouse names), `areChildrenValid` (no children or at least one child with first name, last name, relationship). `isValid` requires relationshipStatus, divorced, hasChildren, and those two.
- **Back / Dev:** Back via `router.back()`; double-tap header to developer dashboard.

### 2.6 Step 4 — Extended Family (`app/onboarding/extended-family.tsx`)

- **Form state (local only):** `parentsAlive` (yes / one-alive / no), `parentsInLawAlive` (same three), `siblingsAlive` (yes / no), `numberOfSiblings` (required when siblings alive = yes).
- **Conditional:** “Partner’s parents” is shown only when `relationshipActions.getSpouse(user.id, 'active')` returns someone (i.e. partner was added on Family screen).
- **Submit:** Logs the values and `router.push('/onboarding/wrap-up')`. No persistence.
- **Validation:** `parentsAlive` and `siblingsAlive` required; if partner’s parents shown then `parentsInLawAlive` required; if siblings yes then `numberOfSiblings` required.

### 2.7 Step 5 — Wrap-up (`app/onboarding/wrap-up.tsx`)

- **Content:** Static “What we've covered” checklist (personal details, location & residence, family situation, extended family) and “Coming up next” bullets (executors, guardianship, assets, who gets what, tax). No form state.
- **Actions:** Back → `router.back()`. Continue → `router.push('/auth/secure-account')`.
- **Dev:** Double-tap header → developer dashboard.

---

## 3. Storage and How It’s Implemented

### 3.1 Storage service

- **File:** `native-app/src/services/storage.ts`
- **API:** `storage.save(key, data)`, `storage.load(key, defaultValue, dateFields?)`, `storage.remove(key)`, `storage.clearAll()`, `storage.getAllKeys()`, `storage.getMultiple(keys)`.
- **Mechanism:** Wraps `@react-native-async-storage/async-storage`. `save` JSON-stringifies; `load` parses and optionally runs `convertDates` over the given `dateFields` paths so that Date fields are restored as Date objects.

### 3.2 Storage keys and scoping

- **Constants:** `native-app/src/constants/index.ts` defines `STORAGE_KEYS` (e.g. `PERSON_DATA`, `WILL_DATA`, `RELATIONSHIP_DATA`, `ACTIVE_WILLMAKER_ID`, …). There is an `ONBOARDING_DATA` key defined but **onboarding screens do not read or write it**; they use Person and Relationship data only.
- **Scoping:** In `useAppState`, `getScopedKey(key)` returns `kindling:${activeWillMakerId}:${key}` when `activeWillMakerId` is set. So all will-maker–scoped data lives under `kindling:<willMakerId>:<key>`.

### 3.3 App state and persistence (useAppState)

- **File:** `native-app/src/hooks/useAppState.ts`
- **Pattern:** State is held in React state; a custom hook `useAsyncStorageState(storageKey, initialValue, dateFields)` loads from storage on mount/key change and saves on state change. So any update to `personData`, `willData`, `relationshipData`, etc. is persisted via this hook.
- **Relevant state for onboarding:**
  - `activeWillMakerId` — stored at `STORAGE_KEYS.ACTIVE_WILLMAKER_ID` (unscoped).
  - `personData` — stored at scoped `PERSON_DATA`.
  - `willData` — stored at scoped `WILL_DATA` (includes `userId` pointing at will-maker Person).
  - `relationshipData` — stored at scoped `RELATIONSHIP_DATA` (array of `RelationshipEdge`).
- **Will-maker identity:** If no `activeWillMakerId`, welcome screen sets it to a new UUID. When adding the will-maker Person, `personActions.addPerson` can use `activeWillMakerId` as the Person id for the will-maker and sets `willData.userId` to that id.

### 3.4 Person and relationship writes from onboarding

- **Welcome:** Creates or updates the single Person with role `'will-maker'` and sets `WillData.userId`. Person fields persisted: `firstName`, `lastName`, `dateOfBirth` (and empty email/phone, relationship `'other'`). Middle names are not on the Person type and are not saved.
- **Family:**  
  - **Clear:** `personActions.clearOnboardingFamilyMembers()` in `useAppState` (lines 551–571) filters out all persons with `createdInOnboarding === true` from `personData` and removes any `relationshipData` edges that reference those ids.  
  - **Spouse/partner:** New Person with `createdInOnboarding: true`, roles `['family-member', 'beneficiary']`, relationship `'spouse'` or `'partner'`. Then `relationshipActions.addRelationship(currentUser.id, spouseId, RelationshipType.SPOUSE | PARTNER, { phase: 'active' })`.  
  - **Children:** New Person per child with `createdInOnboarding: true`, roles `['family-member', 'beneficiary']`, and fields such as `guardianIds`, `capacityStatus`, `isUnder18`, `inCare`, `careCategory`. Then `relationshipActions.addRelationship(currentUser.id, childId, RelationshipType.PARENT_OF, { qualifiers })`.  
  - **Order of writes:** Family screen creates all new people first, then verifies their ids exist in the stored Person array (by loading `kindling:${activeWillMakerId}:${STORAGE_KEYS.PERSON_DATA}` via `storage.load`), and only then calls `relationshipActions.addRelationship` for each edge. Relationship edges are appended to `relationshipData` and persisted by `useAsyncStorageState` for the relationship key.

### 3.5 Relationship edge format

- **Type:** `RelationshipEdge` in `native-app/src/types/index.ts`: `id`, `aId`, `bId`, `type` (RelationshipType), optional `phase`, `qualifiers`, `startedAt`, `endedAt`, `metadata`, `createdAt`, `updatedAt`.
- **RelationshipType enum:** Includes SPOUSE, PARTNER, PARENT_OF, SIBLING_OF, etc. Onboarding uses SPOUSE, PARTNER, and PARENT_OF with qualifiers (e.g. biological, adoptive, step, foster).

### 3.6 Person model (relevant fields)

- **Interface:** `Person` in `native-app/src/types/index.ts`. Onboarding-relevant: `id`, `firstName`, `lastName`, `dateOfBirth`, `relationship` (PersonRelationshipType), `roles`, `guardianIds`, `capacityStatus`, `isUnder18`, `inCare`, `careCategory`, `createdInOnboarding`, `createdAt`, `updatedAt`. There is no `middleNames` on Person.

### 3.7 What is not persisted from onboarding

- **Location screen:** Country of residence, nationality, domiciled in UK, currently resident — not written to any store; only logged.
- **Extended family screen:** Parents alive, partner’s parents alive, siblings alive, number of siblings — not written; only logged.
- **Middle names:** Collected on Welcome but not stored (Person has no field; comment and TODO in `welcome.tsx`).
- **Divorce:** Collected on Family screen in local state only; not stored on Person or RelationshipEdge in the current implementation.

---

## 4. File Reference List

| Purpose | File path |
|--------|-----------|
| Onboarding stack layout | `native-app/app/onboarding/_layout.tsx` |
| Step 1 Welcome | `native-app/app/onboarding/welcome.tsx` |
| Step 2 Location | `native-app/app/onboarding/location.tsx` |
| Step 3 Family | `native-app/app/onboarding/family.tsx` |
| Step 4 Extended family | `native-app/app/onboarding/extended-family.tsx` |
| Step 5 Wrap-up | `native-app/app/onboarding/wrap-up.tsx` |
| Entry (intro) | `native-app/app/intro.tsx` |
| Deep link handler | `native-app/app/open.tsx` |
| App state + persistence | `native-app/src/hooks/useAppState.ts` |
| Storage service | `native-app/src/services/storage.ts` |
| Storage keys & initial data | `native-app/src/constants/index.ts` |
| Types (Person, WillData, RelationshipEdge, etc.) | `native-app/src/types/index.ts` |
| Helpers (e.g. calculateAge, generateUUID) | `native-app/src/utils/helpers.ts` |
| Will progress (post-onboarding stages) | `native-app/src/utils/willProgress.ts` |

---

## 5. Developer / Testing

- **Developer dashboard:** `native-app/app/developer/dashboard.tsx` includes an “Onboarding screen” dropdown (Welcome, Location, Family, Extended Family, Wrap-up) and a “Go” button that calls `router.push(onboardingScreen)` so any step can be opened directly.
- **Double-tap:** On each onboarding screen, double-tap on the header (logo/step area) to navigate to `/developer/dashboard`.

This completes the description of the onboarding forms, flow, and storage as implemented in the codebase.
