# Expo Web for Automated Frontend Testing — Implementation Plan

---

## Goal

Get the Kindling app running in the browser via `npx expo start --web` so we can run automated UI tests with Playwright (or similar). We don't need a production-quality web app — just enough to exercise form flows, navigation, and data integrity in a browser where testing tools are mature and reliable.

---

## Current State

- `app.json` already has a `"web"` section (favicon configured)
- `package.json` already has a `"web": "npx expo start --web"` script
- Expo Router supports web routing out of the box (file-based routes become URL paths)
- React Native Paper (our UI library) is fully web-compatible
- No `webpack.config.js` or `metro.config.js` overrides exist — default Expo bundling
- New Architecture is enabled (`"newArchEnabled": true`) — may need attention for web

---

## Audit: Every Native Module and Where It's Used

### Will crash on web (must fix)

| Module | Files | Impact |
|--------|-------|--------|
| `expo-secure-store` | `src/hooks/useAuth.ts`, `src/services/attribution.ts` | Auth tokens, device ID, biometric prefs, scope ID, user profile. Core auth is broken without this. |
| `expo-local-authentication` | `src/hooks/useAuth.ts`, `src/components/splash/SplashScreen.tsx` | Biometric login on app launch + biometric prompt during registration. |
| `expo-contacts` | `app/executors/selection.tsx`, `app/guardianship/wishes.tsx` | "Import from contacts" button in executor and guardian selection. |
| `@gorhom/bottom-sheet` | `app/estate-dashboard.tsx`, `app/will-dashboard.tsx`, `src/components/ui/GlassMenu.tsx` | Category picker tray, dashboard menu, glass menu overlay. |
| `@react-native-community/datetimepicker` | `src/components/ui/DatePicker.tsx` | Date fields throughout the app. Has iOS/Android branches but no web branch. |
| `expo-device` | `src/hooks/useAuth.ts` | `Device.deviceName` and `Device.modelName` sent to API during registration. |

### Will work but may be janky

| Module | Files | Notes |
|--------|-------|-------|
| `react-native-reanimated` | `app/estate-dashboard.tsx`, `src/components/ui/NetWealthToast.tsx`, `src/components/ui/Celebration.tsx`, `src/components/ui/StageCard.tsx` | Runs on JS thread instead of native. Slower animations but functional. |
| `expo-blur` | `src/components/ui/NetWealthToast.tsx`, `src/components/ui/GlassMenu.tsx` | Falls back to CSS `backdrop-filter`. May not look identical. |
| `expo-av` | `app/video-intro.tsx` | Video playback uses HTML5 `<video>`. Local assets may need web-compatible format. |
| `react-native-webview` | `src/components/ui/VideoPlayer.tsx`, multiple `bequeathal/*/intro.tsx` files | Renders as `<iframe>` on web. YouTube embeds should work. |
| `react-native-gesture-handler` | `app/_layout.tsx` (root wrapper) | Web polyfills exist and are included by Expo. Swipe gestures may feel different. |

### Already web-compatible (no changes needed)

| Module | Notes |
|--------|-------|
| `@react-native-async-storage/async-storage` | Uses `localStorage` on web |
| `react-native-paper` | Full web support |
| `react-native-safe-area-context` | Web-aware |
| `react-native-screens` | Web-compatible |
| `react-native-svg` | Web-compatible |
| `@react-native-community/netinfo` | Web-compatible |
| `expo-clipboard` | Uses Clipboard API on web |
| `expo-haptics` | No-ops silently on web |
| `expo-linking` / `Linking.openURL()` | Opens new tab on web |
| `expo-router` | Full web support with URL-based routing |
| `expo-font` | Web-compatible |
| `expo-constants` | Web-compatible |

---

## Implementation Steps

### Step 1: Create platform shim for `expo-secure-store`

**Files to create:**
- `src/platform/secureStore.ts` — unified interface
- `src/platform/secureStore.web.ts` — web implementation using `localStorage`

**What it does:**

Expo supports platform-specific file resolution. `secureStore.web.ts` is automatically picked up on web, `secureStore.ts` (or `.native.ts`) on iOS/Android.

```typescript
// src/platform/secureStore.ts (native — re-exports expo-secure-store)
export { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
```

```typescript
// src/platform/secureStore.web.ts (web — uses localStorage)
export async function getItemAsync(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  localStorage.removeItem(key);
}
```

**Then update imports in:**
- `src/hooks/useAuth.ts` — change `import * as SecureStore from 'expo-secure-store'` → `import * as SecureStore from '../platform/secureStore'`
- `src/services/attribution.ts` — same pattern

**Note:** For testing purposes, `localStorage` is fine. We're not storing real credentials — just test tokens. The security downgrade is irrelevant for automated testing in a browser.

---

### Step 2: Create platform shim for `expo-local-authentication`

**Files to create:**
- `src/platform/localAuthentication.ts` — native re-export
- `src/platform/localAuthentication.web.ts` — web stub

```typescript
// src/platform/localAuthentication.web.ts
export const AuthenticationType = { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 };

export async function hasHardwareAsync(): Promise<boolean> {
  return false;
}

export async function isEnrolledAsync(): Promise<boolean> {
  return false;
}

export async function authenticateAsync(): Promise<{ success: boolean }> {
  return { success: false };
}

export async function supportedAuthenticationTypesAsync(): Promise<number[]> {
  return [];
}
```

**Then update imports in:**
- `src/hooks/useAuth.ts` — `import * as LocalAuthentication from '../platform/localAuthentication'`
- `src/components/splash/SplashScreen.tsx` — same

This makes biometrics gracefully report "not available" on web, so the app skips biometric flows without crashing.

---

### Step 3: Create platform shim for `expo-contacts`

**Files to create:**
- `src/platform/contacts.ts` — native re-export
- `src/platform/contacts.web.ts` — web stub

```typescript
// src/platform/contacts.web.ts
export async function requestPermissionsAsync() {
  return { status: 'denied' };
}

export async function getContactsAsync() {
  return { data: [] };
}
```

**Then update imports in:**
- `app/executors/selection.tsx`
- `app/guardianship/wishes.tsx`

The "Import from contacts" button will either be hidden (if there's a permission check) or return empty results. Either way, no crash.

---

### Step 4: Create platform shim for `expo-device`

**Files to create:**
- `src/platform/device.ts` — native re-export
- `src/platform/device.web.ts` — web stub

```typescript
// src/platform/device.web.ts
export const deviceName = 'Web Browser';
export const modelName = 'Web';
export const osName = 'Web';
```

**Then update import in:**
- `src/hooks/useAuth.ts`

---

### Step 5: Web-compatible `DatePicker`

**File to modify:** `src/components/ui/DatePicker.tsx`

Currently has `Platform.OS === 'ios'` and Android branches. Add a web branch:

```typescript
if (Platform.OS === 'web') {
  return (
    <input
      type="date"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = new Date(e.target.value);
        if (!isNaN(date.getTime())) onChange(date);
      }}
      style={{ /* basic styling to match the app */ }}
    />
  );
}
```

Alternatively, use a `.web.tsx` / `.native.tsx` split for this component if the branching gets messy.

---

### Step 6: Web-compatible Bottom Sheet

**Option A (recommended for testing):** Conditional rendering with a simple modal/dropdown on web.

**Files to create:**
- `src/platform/BottomSheet.tsx` — native re-export of `@gorhom/bottom-sheet`
- `src/platform/BottomSheet.web.tsx` — simple `<div>` overlay that mimics bottom sheet behaviour

The web version just needs to:
- Show/hide content based on a ref's `expand()`/`close()` methods
- Render children in a fixed-position overlay at the bottom of the screen

**Then update imports in:**
- `app/estate-dashboard.tsx`
- `app/will-dashboard.tsx`
- `src/components/ui/GlassMenu.tsx`

**Option B (quick and dirty):** Wrap each `BottomSheet` usage in a `Platform.OS !== 'web'` check and render an alternative UI (e.g. a `<Modal>` from React Native Paper) on web.

---

### Step 7: Verify Expo Web bundler configuration

**Check / update:**

1. `app.json` — the `"web"` section may need `"bundler": "metro"` explicitly set (Expo SDK 54 uses Metro for web by default, but worth confirming):
   ```json
   "web": {
     "favicon": "./assets/favicon.png",
     "bundler": "metro"
   }
   ```

2. `babel.config.js` — the `react-native-reanimated/plugin` is already configured. Reanimated v4 supports web via Metro. No change needed.

3. `"newArchEnabled": true` — New Architecture (Fabric/TurboModules) is native-only. This flag is ignored on web, but verify it doesn't cause bundler issues.

---

### Step 8: First boot — smoke test

1. Run `npx expo start --web`
2. Open in browser
3. Expected first issues:
   - If any native module import wasn't shimmed, the bundler will error with a clear message pointing to the offending module
   - Fix any remaining import issues following the same platform shim pattern from Steps 1-6
4. Navigate through:
   - Auth (register/login) — should work with SecureStore shim
   - Onboarding — forms + navigation
   - Estate dashboard — verify bottom sheet replacement works
   - Any bequeathal section — form flow
5. Document any visual quirks (these are low priority for testing)

---

### Step 9: Set up Playwright

**Install:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Create:** `playwright.config.ts` at project root

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-web',
  webServer: {
    command: 'npx expo start --web --port 8081',
    port: 8081,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:8081',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
```

**Create:** `e2e-web/` directory for test files.

**Add script to `package.json`:**
```json
"test:web": "npx playwright test",
"test:web:ui": "npx playwright test --ui"
```

---

### Step 10: Write first test to validate the setup

```typescript
// e2e-web/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('app loads and shows auth screen', async ({ page }) => {
  await page.goto('/');
  // Verify the app renders without crashing
  await expect(page.locator('text=Login')).toBeVisible({ timeout: 30000 });
});
```

If this passes, the web build works and we can start writing real test flows.

---

## What We Can Test on Web

These are the flows that will work once the shims are in place:

| Flow | Web compatible? | Notes |
|------|----------------|-------|
| Registration (email/password) | Yes | SecureStore shimmed to localStorage |
| Login | Yes | Same |
| Onboarding (name, family, location) | Yes | All forms + navigation |
| Estate dashboard | Yes | With bottom sheet replacement |
| All bequeathal sections (bank accounts, pensions, investments, crypto, property, life insurance, etc.) | Yes | Core form flows |
| Beneficiary allocation (% and £) | Yes | Pure form logic |
| Executor selection | Mostly | Contact import disabled, manual entry works |
| Guardian selection | Mostly | Same — contact import disabled |
| Will dashboard | Yes | With bottom sheet replacement |
| Net wealth toast / celebrations | Yes | Animations may be slower |
| Video intro | Maybe | Depends on asset format |
| Deep link handling | Partial | URL-based routing works, app scheme links won't |
| Biometric auth | No | Stubbed to "not available" — auto-skipped |

---

## What We Cannot Test on Web

| Feature | Why |
|---------|-----|
| Biometric authentication (Face ID / Touch ID) | No web equivalent |
| Phone contact import | No Contacts API on web |
| Haptic feedback | No-ops (but doesn't crash) |
| Push notifications | Not implemented yet anyway |
| Native date picker appearance | Replaced with HTML `<input type="date">` |
| Native bottom sheet gestures | Replaced with simple overlay |

---

## File Change Summary

| Action | File |
|--------|------|
| **Create** | `src/platform/secureStore.ts` |
| **Create** | `src/platform/secureStore.web.ts` |
| **Create** | `src/platform/localAuthentication.ts` |
| **Create** | `src/platform/localAuthentication.web.ts` |
| **Create** | `src/platform/contacts.ts` |
| **Create** | `src/platform/contacts.web.ts` |
| **Create** | `src/platform/device.ts` |
| **Create** | `src/platform/device.web.ts` |
| **Create** | `src/platform/BottomSheet.tsx` |
| **Create** | `src/platform/BottomSheet.web.tsx` |
| **Create** | `e2e-web/smoke.spec.ts` |
| **Create** | `playwright.config.ts` |
| **Modify** | `src/hooks/useAuth.ts` — update 3 imports |
| **Modify** | `src/services/attribution.ts` — update 1 import |
| **Modify** | `src/components/splash/SplashScreen.tsx` — update 1 import |
| **Modify** | `app/executors/selection.tsx` — update 1 import |
| **Modify** | `app/guardianship/wishes.tsx` — update 1 import |
| **Modify** | `src/components/ui/DatePicker.tsx` — add web branch |
| **Modify** | `app/estate-dashboard.tsx` — update bottom sheet import |
| **Modify** | `app/will-dashboard.tsx` — update bottom sheet import |
| **Modify** | `src/components/ui/GlassMenu.tsx` — update bottom sheet import |
| **Modify** | `app.json` — confirm web bundler config |
| **Modify** | `package.json` — add playwright + test scripts |

---

## Estimated Effort

| Step | Time |
|------|------|
| Steps 1–4 (platform shims for SecureStore, LocalAuth, Contacts, Device) | 1–2 hours |
| Step 5 (DatePicker web branch) | 30 mins |
| Step 6 (Bottom sheet web replacement) | 1–2 hours |
| Steps 7–8 (config + smoke test + fix surprises) | 1–2 hours |
| Steps 9–10 (Playwright setup + first test) | 30 mins |
| **Total** | **~4–6 hours** |

---

## Risks

1. **Reanimated v4 on web** — should work with Metro bundler but is the least battle-tested combination. If animations cause issues, we can wrap animated components in `Platform.OS !== 'web'` checks and render static versions.

2. **Bottom sheet replacement fidelity** — the web replacement won't feel identical. For testing purposes this is fine, but if tests rely on specific gesture interactions, they'll need to use the web-specific UI.

3. **New Architecture flag** — `"newArchEnabled": true` is ignored on web but could theoretically cause bundler confusion. If it does, we can conditionally set it.

4. **Expo SDK 54 web support maturity** — Expo's web support has improved dramatically but SDK 54 is relatively recent. We may hit edge cases. The Expo GitHub issues tracker is the best resource for these.

5. **Asset formats** — local video files (`expo-av`) may need to be in web-compatible formats (MP4/WebM). If video-intro breaks, it's low priority — just skip it in tests.
