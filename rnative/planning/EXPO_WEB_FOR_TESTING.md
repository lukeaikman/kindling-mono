# Expo Web for Automated Frontend Testing — Implementation Plan

---

## Goal

Get the Kindling app running in the browser via `npx expo start --web` so we can run automated UI tests with Playwright. We don't need a production-quality web app — just enough to exercise form flows, navigation, and data integrity in a browser where testing tools are mature and reliable.

---

## Design Principle: Don't Touch Production Files

We use **Metro resolver configuration** to intercept native module imports at the bundler level and redirect them to web polyfills — but **only when `platform === 'web'`**. Native builds never see these changes. Existing `import * as SecureStore from 'expo-secure-store'` stays exactly as-is in every file.

This applies to ALL native modules — including complex components like `@gorhom/bottom-sheet`. `Platform.OS` guards prevent *rendering* but don't prevent *bundling*. If Metro can't resolve a native import for web, the build fails regardless of runtime guards. The Metro resolver approach handles both.

**Result:** Only 1 production file modified (`DatePicker.tsx` — a web rendering branch). Everything else is new files and config. If the web config is wrong, only web breaks.

---

## Current State

- `app.json` already has a `"web"` section (favicon configured)
- `package.json` already has a `"web": "npx expo start --web"` script
- Expo Router supports web routing out of the box (file-based routes become URL paths)
- React Native Paper (our UI library) is fully web-compatible
- No `webpack.config.js` or `metro.config.js` overrides exist — default Expo bundling
- New Architecture is enabled (`"newArchEnabled": true`) — ignored on web

---

## Audit: Every Native Module and Where It's Used

### Will crash on web (must fix via Metro shims)

| Module | Files | Impact |
|--------|-------|--------|
| `expo-secure-store` | `src/hooks/useAuth.ts`, `src/services/attribution.ts` | Auth tokens, device ID, biometric prefs, scope ID, user profile. Core auth is broken without this. |
| `expo-local-authentication` | `src/hooks/useAuth.ts`, `src/components/splash/SplashScreen.tsx` | Biometric login on app launch + biometric prompt during registration. |
| `expo-contacts` | `app/executors/selection.tsx`, `app/guardianship/wishes.tsx` | "Import from contacts" button in executor and guardian selection. |
| `expo-device` | `src/hooks/useAuth.ts` | `Device.deviceName` and `Device.modelName` sent to API during registration. |
| `@gorhom/bottom-sheet` | `app/estate-dashboard.tsx`, `app/will-dashboard.tsx`, `src/components/ui/GlassMenu.tsx` | Category picker tray, dashboard menu, glass menu overlay. Import alone will fail web bundling — depends on native worklet internals. |
| `@react-native-community/datetimepicker` | `src/components/ui/DatePicker.tsx` | Date fields throughout the app. Has native code; import will fail web bundling even if component isn't rendered. |
| `@react-native-community/slider` | `src/components/ui/Slider.tsx` | Range input for percentages. Has native code; same bundling issue. |

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

### Step 1: Create `metro.config.js` with web-only module resolution

This is the core of the approach. A single config file that intercepts native module imports and redirects them to web polyfills — but **only when building for web**. Native builds take the default resolution path and are completely unaffected.

**File to create:** `metro.config.js`

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Map native-only modules to web polyfill files.
// These ONLY activate when platform === 'web'.
// Native builds (ios/android) are completely unaffected.
const WEB_SHIMS = {
  'expo-secure-store': './src/web-shims/secureStore.js',
  'expo-local-authentication': './src/web-shims/localAuthentication.js',
  'expo-contacts': './src/web-shims/contacts.js',
  'expo-device': './src/web-shims/device.js',
  '@gorhom/bottom-sheet': './src/web-shims/bottomSheet.js',
  '@react-native-community/datetimepicker': './src/web-shims/datetimepicker.js',
  '@react-native-community/slider': './src/web-shims/slider.js',
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_SHIMS[moduleName]) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, WEB_SHIMS[moduleName]),
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

**Why this is safe:** The `platform === 'web'` check means `npx expo start --ios` and `npx expo start --android` never enter the shim branch. They resolve every module to the real package exactly as they do today. The config file's existence alone has no effect on native builds — Metro always looks for `metro.config.js`, and the default config is what `getDefaultConfig()` returns.

**Why ALL native modules need Metro shims (not just simple ones):** `Platform.OS` guards prevent a component from *rendering* on web, but the `import` statement at the top of the file still runs at bundle time. Metro must resolve every import. If a package has native code without a web entry point, the bundle fails — even if the component is never rendered. This is why `@gorhom/bottom-sheet`, `@react-native-community/datetimepicker`, and `@react-native-community/slider` must be shimmed at the Metro level, not guarded with `Platform.OS`.

---

### Step 2: Create web shim files

All shims live in `src/web-shims/`. These files are **only loaded by the Metro resolver when building for web**. They never run on native.

#### `src/web-shims/secureStore.js`

```javascript
export async function getItemAsync(key) {
  return localStorage.getItem(key);
}

export async function setItemAsync(key, value) {
  localStorage.setItem(key, value);
}

export async function deleteItemAsync(key) {
  localStorage.removeItem(key);
}
```

#### `src/web-shims/localAuthentication.js`

```javascript
export const AuthenticationType = { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 };

export async function hasHardwareAsync() {
  return false;
}

export async function isEnrolledAsync() {
  return false;
}

export async function authenticateAsync(_options) {
  return { success: false };
}

export async function supportedAuthenticationTypesAsync() {
  return [];
}
```

#### `src/web-shims/contacts.js`

```javascript
export async function presentContactPickerAsync() {
  return null;
}

export async function requestPermissionsAsync() {
  return { status: 'denied' };
}

export async function getContactsAsync() {
  return { data: [] };
}
```

#### `src/web-shims/device.js`

```javascript
export const deviceName = 'Web Browser';
export const modelName = 'Web';
export const osName = 'Web';
```

#### `src/web-shims/bottomSheet.js`

Replaces `@gorhom/bottom-sheet` on web. Provides the same ref API (`expand()`, `close()`) and sub-component exports so all three consuming files (`estate-dashboard.tsx`, `will-dashboard.tsx`, `GlassMenu.tsx`) work without any changes.

```javascript
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const BottomSheet = forwardRef(({ children, index = -1, onChange, backgroundStyle, style, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(index >= 0);

  const close = () => { setIsOpen(false); onChange?.(-1); };
  const open = () => { setIsOpen(true); onChange?.(0); };

  useImperativeHandle(ref, () => ({
    expand: open,
    close,
    snapToIndex: (i) => { setIsOpen(i >= 0); onChange?.(i); },
    collapse: close,
    forceClose: close,
  }));

  if (!isOpen) return null;

  return (
    <Modal transparent visible onRequestClose={close}>
      <TouchableOpacity style={webStyles.backdrop} activeOpacity={1} onPress={close} />
      <View style={[webStyles.sheet, backgroundStyle]}>
        {children}
      </View>
    </Modal>
  );
});

BottomSheet.displayName = 'BottomSheet';
export default BottomSheet;

export const BottomSheetView = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const BottomSheetBackdrop = () => null;

const webStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
});
```

#### `src/web-shims/datetimepicker.js`

```javascript
import React from 'react';
import { View } from 'react-native';

const DateTimePicker = (_props) => <View />;
export default DateTimePicker;

export const DateTimePickerEvent = {};
```

#### `src/web-shims/slider.js`

```javascript
import React from 'react';
import { View } from 'react-native';

const Slider = (_props) => <View />;
export default Slider;
```

---

### Step 3: Add web rendering branch to `DatePicker.tsx`

**File to modify:** `src/components/ui/DatePicker.tsx`

This is the **only production file we modify**. The component already has `Platform.OS === 'ios'` and `Platform.OS === 'android'` branches for the picker rendering (lines 175-221). Add a web branch before both:

```tsx
{Platform.OS === 'web' && show && (
  <View style={styles.modalOverlay}>
    <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShow(false)} />
    <View style={styles.modalContent}>
      <input
        type="date"
        value={parseValue(value).toISOString().split('T')[0]}
        onChange={(e) => {
          const date = new Date(e.target.value);
          if (!isNaN(date.getTime())) {
            onChange(date);
            setShow(false);
          }
        }}
        style={{ fontSize: 16, padding: 12, width: '100%' }}
      />
    </View>
  </View>
)}
```

**Why this is safe:** The existing iOS and Android code paths are completely untouched. The web branch only executes when `Platform.OS === 'web'`, which never happens on native. The `@react-native-community/datetimepicker` import is shimmed to a no-op by the Metro resolver on web, so it won't crash the bundler.

---

### Step 4: Verify Expo Web bundler configuration

**Check / update `app.json`:**

```json
"web": {
  "favicon": "./assets/favicon.png",
  "bundler": "metro"
}
```

Expo SDK 54 uses Metro for web by default, but making it explicit avoids ambiguity.

`babel.config.js` — already has `react-native-reanimated/plugin`. No change needed.

`"newArchEnabled": true` — ignored on web. No change needed.

---

### Step 5: First boot — smoke test

1. Run `npx expo start --web`
2. Open in browser
3. Expected first issues:
   - If any native module wasn't shimmed, Metro will error with a clear message naming the module
   - Fix by adding the module to the `WEB_SHIMS` map in `metro.config.js` and creating a corresponding shim file
   - If `react-native-worklets` fails to resolve, add it to the shims with a no-op export
4. Navigate through:
   - Auth (register/login) — should work with SecureStore shim
   - Onboarding — forms + navigation
   - Estate dashboard — verify BottomSheet web shim works for category picker
   - Any bequeathal section — form flow
5. Document any visual quirks (low priority for testing)

---

### Step 6: Set up Playwright

**Install:**

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Create:** `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-web',
  webServer: {
    command: process.env.CI
      ? 'npx expo export --platform web && npx serve dist'
      : 'npx expo start --web --port 8081',
    port: process.env.CI ? 3000 : 8081,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: process.env.CI ? 'http://localhost:3000' : 'http://localhost:8081',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
```

**Add scripts to `package.json`:**

```json
"test:web": "npx playwright test",
"test:web:ui": "npx playwright test --ui"
```

---

### Step 7: Write first test to validate the setup

```typescript
// e2e-web/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear all localStorage to ensure clean state between tests.
  // On web, both SecureStore (shimmed) and AsyncStorage use localStorage,
  // so handleFreshInstallCleanup won't detect "reinstalls" — clear everything.
  await page.evaluate(() => localStorage.clear());
});

test('app loads and shows auth screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Login')).toBeVisible({ timeout: 30000 });
});
```

If this passes, the web build works and we can start writing real test flows.

---

## Behavioral Differences on Web (important for test design)

### `handleFreshInstallCleanup` is a no-op on web

In `useAuth.ts`, this function uses the difference between iOS Keychain persistence (SecureStore survives app uninstall) and AsyncStorage (does not) to detect fresh installs. On web, both are backed by `localStorage` — they persist identically. The function will never detect a "fresh install" after the first run.

**Impact on testing:** Always call `localStorage.clear()` in `beforeEach` to ensure clean state between tests. This is already included in the smoke test template above.

### Biometric authentication auto-skips

The `localAuthentication` shim returns `hasHardwareAsync() → false`, so all biometric flows gracefully skip. Registration won't prompt for Face ID. Returning-user splash won't attempt biometric unlock.

### Contact import returns null

`presentContactPickerAsync()` returns `null`, so the "Import from contacts" flow in executor/guardian selection silently does nothing. Manual entry still works.

---

## What We Can Test on Web

| Flow | Works? | Notes |
|------|--------|-------|
| Registration (email/password) | Yes | SecureStore shimmed to localStorage |
| Login | Yes | Same |
| Onboarding (name, family, location) | Yes | All forms + navigation |
| Estate dashboard | Yes | BottomSheet shimmed to Modal on web |
| All bequeathal sections (bank accounts, pensions, investments, crypto, property, life insurance, etc.) | Yes | Core form flows |
| Beneficiary allocation (% and £) | Yes | Pure form logic |
| Executor selection | Mostly | Contact import returns null, manual entry works |
| Guardian selection | Mostly | Same |
| Will dashboard | Yes | GlassMenu uses shimmed BottomSheet |
| Net wealth toast / celebrations | Yes | Animations may be slower |
| Video intro | Maybe | Depends on asset format |
| Deep link handling | Partial | URL routing works, app scheme links won't |
| Biometric auth | No | Stubbed to "not available" — auto-skipped |

---

## What We Cannot Test on Web

| Feature | Why |
|---------|-----|
| Biometric authentication (Face ID / Touch ID) | No web equivalent |
| Phone contact import | No Contacts API on web |
| Haptic feedback | No-ops (doesn't crash) |
| Push notifications | Not implemented yet anyway |
| Native date picker appearance | Replaced with HTML `<input type="date">` |
| Native bottom sheet gestures | Replaced with Modal overlay |
| Native slider appearance | Shimmed to no-op (use web-compatible alternative if needed) |

---

## File Change Summary

| Action | File | Touches native code path? |
|--------|------|--------------------------|
| **Create** | `metro.config.js` | No — web resolver only activates for `platform === 'web'` |
| **Create** | `src/web-shims/secureStore.js` | No — only loaded on web |
| **Create** | `src/web-shims/localAuthentication.js` | No — only loaded on web |
| **Create** | `src/web-shims/contacts.js` | No — only loaded on web |
| **Create** | `src/web-shims/device.js` | No — only loaded on web |
| **Create** | `src/web-shims/bottomSheet.js` | No — only loaded on web |
| **Create** | `src/web-shims/datetimepicker.js` | No — only loaded on web |
| **Create** | `src/web-shims/slider.js` | No — only loaded on web |
| **Create** | `e2e-web/smoke.spec.ts` | No |
| **Create** | `playwright.config.ts` | No |
| **Modify** | `src/components/ui/DatePicker.tsx` | No — adds `Platform.OS === 'web'` branch only |
| **Modify** | `app.json` | No — adds `"bundler": "metro"` to web section |
| **Modify** | `package.json` | No — adds devDependency + scripts |

**Production files with import changes: 0**
**Production files with new web-only branches: 1** (`DatePicker.tsx` — dead code on native)

---

## Risk Assessment

| Risk | Severity | Likelihood | Impact on native | Mitigation |
|------|----------|------------|------------------|------------|
| Metro config breaks native bundling | Critical | Very low | Yes if it happens | `platform === 'web'` guard means native takes default path. Test native build after adding config. |
| Web shim missing an export that app code calls | None on native | N/A | No | Shims only load on web. Missing export = web crash only. |
| DatePicker web branch has bug | None on native | N/A | No | Branch is dead code on native. |
| `react-native-worklets` fails to bundle on web | Low | Medium | No | Add to Metro shims if needed. Only affects web. |
| Merge conflicts with parallel native work | Very low | Very low | Indirect | Only 1 file modified (`DatePicker.tsx`), change is additive. No import path changes anywhere. |
| Reanimated v4 animations broken on web | Low | Medium | No | Wrap in `Platform.OS !== 'web'` if needed. |
| Expo SDK 54 web edge cases | Low | Medium | No | Only affects web build. |

**Key guarantee:** Every risk either has "No" in the "Impact on native" column, or has a "Very low" likelihood with a clear guard (`platform === 'web'`).

---

## Estimated Effort

| Step | Time |
|------|------|
| Step 1 (Metro config) | 30 mins |
| Step 2 (Web shim files — 8 files) | 1 hour |
| Step 3 (DatePicker web branch) | 30 mins |
| Steps 4–5 (Config verification + smoke test + fix surprises) | 1–2 hours |
| Steps 6–7 (Playwright setup + first test) | 30 mins |
| **Total** | **~4–5 hours** |

---

## Verification Checklist

After implementation, before merging:

- [ ] `npx expo start --ios` — native app launches and works identically to before
- [ ] `npx expo start --android` — same
- [ ] `npx expo start --web` — app loads in browser, auth flow works
- [ ] Register/login flow works on web
- [ ] Onboarding flow works on web
- [ ] Estate dashboard category picker (BottomSheet shim) works on web
- [ ] Will dashboard menu (GlassMenu / BottomSheet shim) works on web
- [ ] At least one bequeathal form flow works on web
- [ ] DatePicker renders HTML `<input type="date">` on web
- [ ] Playwright smoke test passes
- [ ] Only `DatePicker.tsx` has a diff in production code (review the one modified file)
