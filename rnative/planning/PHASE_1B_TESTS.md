# Phase 1b Testing Checklist

## Important: FaceID Testing Requires Physical Device

**Simulator Limitation**: The iOS Simulator does not support actual FaceID. When biometric authentication is triggered in the simulator, it falls back to a PIN/passcode prompt (if `disableDeviceFallback: false`). 

**Tests 3-6, 10-11** involve biometric authentication and should be tested on a **physical device** to verify actual FaceID behavior. Simulator testing with PIN fallback validates the logic flow but not the biometric UX.

**Status**: Core logic tested on simulator. FaceID UX testing pending device availability.

---

## Pre-requisites

- iOS Simulator with FaceID enrolled (Device > Face ID > Enrolled) for logic testing
- **Physical iOS device** for actual FaceID testing
- API server running locally (`rails s` in kindling-api)
- Ability to toggle network (Simulator: Device > Network Conditions or just kill rails server)

## Test Scenarios

### 1. Fresh Install - Online

**Setup**: Delete app from simulator, fresh install

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Splash animation plays |
| 2 | Animation completes | Navigates to `/intro` (shows Login + Start Creating buttons) |

---

### 2. Fresh Install - Offline

**Setup**: Delete app from simulator, disable network, fresh install

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Splash animation plays |
| 2 | Animation completes | Navigates to `/auth/login` with offline banner |
| 3 | Observe login screen | "You're offline" banner shown, form disabled, Sign In button disabled |

---

### 3. Registration - Biometric Prompt (Accept)

**Setup**: Fresh user, online, FaceID enrolled on device

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Register screen | Registration form shown |
| 2 | Fill form, tap "Create Account" | Loading state |
| 3 | Registration succeeds | FaceID prompt appears: "Open Kindling Instantly" |
| 4 | Authenticate with FaceID | Navigates to `/onboarding/welcome` |
| 5 | Force close app, relaunch | FaceID prompt should appear during splash |

---

### 4. Registration - Biometric Prompt (Cancel)

**Setup**: Fresh user, online, FaceID enrolled on device

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register new user | FaceID prompt appears |
| 2 | Cancel/dismiss FaceID prompt | Navigates to `/onboarding/welcome` anyway |
| 3 | Force close app, relaunch | NO FaceID prompt, goes straight to `/order-of-things` |

---

### 5. Registration - No FaceID on Device

**Setup**: Fresh user, online, FaceID NOT enrolled (Simulator: Device > Face ID > Reset)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register new user | Registration succeeds |
| 2 | Observe | NO FaceID prompt (device doesn't support/enroll) |
| 3 | Navigates to | `/onboarding/welcome` |

---

### 6. Returning User - Biometric Enabled

**Setup**: Previously registered user who accepted FaceID, force close and relaunch

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Splash animation plays |
| 2 | During animation | FaceID prompt appears |
| 3 | Authenticate successfully | Unlock icon shown, then navigates to `/order-of-things` |

---

### 7. Returning User - Biometric Fails

**Setup**: Previously registered user who accepted FaceID

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | FaceID prompt appears |
| 2 | Fail FaceID (Simulator: Device > Face ID > Non-matching Face) | OS retries automatically |
| 3 | Exhaust all retries / cancel | "Login with Password" button shown |
| 4 | Tap "Login with Password" | Navigates to `/auth/login` |

---

### 8. Returning User - No Biometric

**Setup**: Previously registered user who cancelled FaceID setup, or device has no FaceID

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Splash animation plays |
| 2 | Animation completes | Navigates straight to `/order-of-things` (no FaceID prompt) |

---

### 9. Returning User - Offline + Biometric Enabled

**Setup**: Previously registered user with FaceID, disable network

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disable network | - |
| 2 | Launch app | Splash animation plays, FaceID prompt appears |
| 3 | Authenticate with FaceID | Navigates to `/order-of-things?offline=true` |
| 4 | Observe app | Should work with cached data (offline mode) |

---

### 10. Returning User - Offline + No Biometric

**Setup**: Previously registered user without FaceID, disable network

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disable network | - |
| 2 | Launch app | Splash animation plays |
| 3 | Animation completes | Navigates to `/order-of-things?offline=true` |

---

### 11. Session Expired

**Setup**: Manually expire tokens (or wait for expiry), online

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Splash animation plays |
| 2 | Session validation fails | Attempts token refresh |
| 3 | If refresh fails | Navigates to `/auth/login` with "Welcome back" |

*Note: To test, you may need to manually clear tokens from SecureStore or modify token expiry on server*

---

### 12. Device FaceID Removed After Setup

**Setup**: User previously enabled FaceID, then remove FaceID from device settings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In Simulator: Device > Face ID > Reset | FaceID unenrolled |
| 2 | Launch app | Splash animation plays |
| 3 | Animation completes | Navigates straight to `/order-of-things` (no FaceID prompt) |
| 4 | Biometric preference | Should be cleared (stale preference removed) |

---

### 13. Login Screen - Welcome Back Personalization

**Setup**: Force session expiry so user is redirected to login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Get redirected to login (session expired) | Login screen shows |
| 2 | Observe title | Should show "Welcome back" (firstName may be empty if cache cleared) |

---

### 14. Slow Network - Loading State

**Setup**: Simulate slow network (Network Link Conditioner or throttle API)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Splash animation plays |
| 2 | Animation completes before API responds | Loading indicator shown |
| 3 | API eventually responds | Navigates to appropriate screen |

---

## Quick Smoke Test (5 mins)

1. [ ] Fresh install online → `/intro`
2. [ ] Register → FaceID prompt → accept → `/onboarding/welcome`
3. [ ] Relaunch → FaceID during splash → success → `/order-of-things`
4. [ ] Relaunch → FaceID fail → "Login with Password" button
5. [ ] Disable network + relaunch → FaceID → `/order-of-things` (offline works)

---

## Notes

- **Simulator FaceID**: Use Device menu > Face ID > Matching Face / Non-matching Face
- **Reset state**: Use one of these methods:
  1. **Delete app** - stale Keychain data is now auto-cleared on fresh install
  2. **Developer Dashboard** (triple-tap logo) → "Clear Auth (Keychain)" + "Purge All Data"
  3. **Simulator menu** → Device → Erase All Content and Settings (nuclear option)
- **Fresh install detection**: App automatically clears stale Keychain data when AsyncStorage flag is missing (happens after app deletion)
- **Network toggle**: Kill rails server or use Simulator network conditions
