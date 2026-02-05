# Phase 2: Deeplink Handling & Attribution

## Overview

Handle deeplinks from ads and QR codes with attribution tracking. Route users through optional video/questionnaire flows based on URL parameters before reaching the First Onboarding Screen.

**Covers Notion Cases**: #1 (Ad deeplink), #2 (Organic install), #7 (QR code)

---

## Phased Approach

This phase is split into two sub-phases:

| Sub-Phase | Scope | When |
|-----------|-------|------|
| **Phase 2a** | Direct deep links + video/questionnaire flow | Now |
| **Phase 2b** | AppsFlyer for deferred deep linking | Pre-production (before ad campaigns) |

**Rationale**: Deferred deep linking (preserving params across App Store install) is only needed when running paid ad campaigns. Direct deep links work fine for development and testing.

---

## Phase 2a: Direct Deep Links + Flow (Current Phase)

### Goals
1. Configure deeplink scheme
2. Parse URL parameters
3. Build video/questionnaire screens
4. Store attribution locally and server-side
5. **Architecture ready for AppsFlyer drop-in**

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deep link handling | `expo-linking` | Already installed, works in Expo Go |
| Deferred deep linking | Deferred to Phase 2b | Not needed until ad campaigns |
| Attribution storage | First touch only | MVP simplicity |
| Local storage | Person object | No new data structures |
| Server storage | User table | Simple, direct |

---

## URL Parameters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `source` | string | `ad_meta`, `ad_google`, `qr_attorney`, etc. | Attribution source |
| `show_video` | integer | `0` = don't show, `1+` = video version ID | Which video to show |
| `show_risk_questionnaire` | integer | `0` = don't show, `1+` = questionnaire version ID | Which questionnaire to show |
| `first_show` | string | `video` \| `risk_questionnaire` | Order when both are shown |
| `location_id` | string (optional) | e.g., `office123` | QR code location identifier |

### Default Behavior by Install Type

| Install Type | Defaults |
|--------------|----------|
| **Organic (no deeplink)** | `show_video=1`, `show_risk_questionnaire=0` |
| **Deeplink** | Uses params from link |
| **Missing/malformed params** | Same as organic |

---

## Flow Logic

```
App Opens (first time)
    ↓
Check for deep link URL (expo-linking)
    ↓
Parse params (or apply organic defaults)
    ↓
Store attribution
    ↓
IF show_video > 0 AND show_risk_questionnaire > 0:
  IF first_show = video:
    /video-intro → /risk-questionnaire → /intro
  ELSE:
    /risk-questionnaire → /video-intro → /intro

ELSE IF show_video > 0:
  /video-intro → /intro

ELSE IF show_risk_questionnaire > 0:
  /risk-questionnaire → /intro

ELSE:
  /intro (skip video/questionnaire)
```

---

## Implementation (Phase 2a) - COMPLETED

### What Was Built

Phase 2a has been fully implemented with the following components:

| Component | File | Purpose |
|-----------|------|---------|
| Deep link config | `app.json` | URL scheme + associated domains |
| Deep link handler | `app/open.tsx` | Route handler for `kindling://open?...` |
| Attribution service | `src/services/attribution.ts` | Capture, store, retrieve attribution |
| Video intro screen | `app/video-intro.tsx` | Video playback with skip/background handling |
| Risk questionnaire | `app/risk-questionnaire.tsx` | Placeholder questionnaire screen |
| Auth integration | `src/hooks/useAuth.ts` | Send attribution with registration |
| Developer tools | `app/developer/dashboard.tsx` | "Clear Attribution" button for testing |

### Video Asset Convention

Videos are stored locally in `assets/videos/` with naming convention:

```
intro-v1.mp4  →  show_video=1
intro-v2.mp4  →  show_video=2
intro-v3.mp4  →  show_video=3
```

### Key Implementation Details

**Parameter Parsing**: Invalid values (negative, non-numeric) default to `1`:

```typescript
function parseIntParam(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  // Invalid values (NaN, negative) default to 1
  if (isNaN(parsed) || parsed < 0) return 1;
  return parsed;
}
```

**First-Touch Attribution**: Existing attribution is never overwritten:

```typescript
const existing = await SecureStore.getItemAsync(ATTRIBUTION_KEY);
if (existing) {
  // Already have attribution - use it, don't overwrite
  return;
}
```

**Loading State**: During deep link processing, users see a brief loading spinner (navy background with cream `ActivityIndicator`) while attribution is stored and routing is determined.

**Debug Logging**: Comprehensive logging in `app/open.tsx` for troubleshooting:

```
=== DEBUGGING DEEP LINK PARSER ===
Received params: { "show_video": "1", "source": "test" }
...
=== ROUTING DECISION ===
Routing to: /video-intro
```

---

## Testing Setup (IMPORTANT)

### Why Native Build is Required

Custom URL schemes (`kindling://`) only work with **native builds**, NOT Expo Go:

| Build Type | URL Schemes | Use Case |
|------------|-------------|----------|
| Expo Go | ❌ Not supported | Development without deep links |
| Native Build | ✅ Works | Deep link testing |

### Building for Simulator Testing

**Step 1: Generate native project and build**

```bash
cd native-app
npx expo run:ios -d
```

This will:
1. Run `npx expo prebuild` (generates `ios/` folder)
2. Install CocoaPods dependencies
3. Show a device selector

**Step 2: Select a simulator**

When prompted, select an iOS Simulator (e.g., "iPhone 16 Pro (18.5)"):

```
? Select a device › 
❯   iPhone 16 Pro (18.5)
    iPhone 16 Pro Max (18.5)
    ...
```

**Step 3: If code signing error occurs**

If you see `CommandError: No code signing certificates are available`:

1. Open **Xcode**
2. Open `native-app/ios/nativeapp.xcworkspace`
3. Select the project in the navigator
4. Go to **Signing & Capabilities**
5. Check **"Automatically manage signing"**
6. Select your **Apple ID** as the Team
7. Click the **Play button** (▶) to build and run

### Running Tests

**Prerequisites**:
1. Native app built and running on simulator
2. Metro bundler running (either from `npx expo run:ios` or `npx expo start`)

**Between tests**: Clear attribution state via Developer Dashboard → "Clear Attribution (Deep Links)"

**Test Commands**:

```bash
# Test 1: Organic (no deep link) - open app normally
# Expected: Goes to /video-intro (default show_video=1)

# Test 2: Skip video and questionnaire
npx uri-scheme open "kindling://open?show_video=0&show_risk_questionnaire=0" --ios
# Expected: Goes straight to /intro

# Test 3: Video with attribution
npx uri-scheme open "kindling://open?source=test_campaign&show_video=1" --ios
# Expected: Goes to /video-intro, console shows attribution

# Test 4: Questionnaire only
npx uri-scheme open "kindling://open?show_video=0&show_risk_questionnaire=1" --ios
# Expected: Goes to /risk-questionnaire

# Test 5: Both, video first (default)
npx uri-scheme open "kindling://open?show_video=1&show_risk_questionnaire=1" --ios
# Expected: /video-intro → /risk-questionnaire → /intro

# Test 6: Both, questionnaire first
npx uri-scheme open "kindling://open?show_video=1&show_risk_questionnaire=1&first_show=risk_questionnaire" --ios
# Expected: /risk-questionnaire → /video-intro → /intro

# Test 7: QR code simulation
npx uri-scheme open "kindling://open?source=qr_attorney&location_id=office123&show_video=1" --ios
# Expected: Goes to /video-intro, console shows source and location_id

# Test 8: Invalid parameters
npx uri-scheme open "kindling://open?show_video=abc&show_risk_questionnaire=-5" --ios
# Expected: Invalid values default to 1, both screens shown
```

### Where to Find Logs

| Log Type | Location |
|----------|----------|
| JavaScript `console.log` | Metro terminal (Expo dev server) |
| Native iOS logs | Xcode console (noisy, can ignore) |

### Troubleshooting

**"Unmatched Route" error**: The `/open` route handler is missing or not bundled. Reload the app (Cmd+R in simulator).

**All deep links go to /intro**: Attribution already exists from previous test. Clear via Developer Dashboard.

**Deep link command fails**: Ensure app is built as native build, not running in Expo Go.

---

## Backend API Changes (Reference)

See `planning/PHASE_2A_BACKEND_SPEC.md` for full specification.

**Endpoint**: `POST /api/v1/auth/register`

Add to request schema:
```json
{
  "attribution": {
    "source": "string | null",
    "campaign": "string | null", 
    "location_id": "string | null",
    "is_organic": "boolean"
  }
}
```

**Note**: The native app currently logs attribution data with a TODO comment. Backend integration pending.

---

## What We CANNOT Test Now (Deferred Deep Links)

The following requires AppsFlyer (Phase 2b):
- Ad click → App Store → Install → App opens with preserved params

**This is fine.** We'll test deferred deep links in Phase 2b when we're closer to production and have AppsFlyer integrated.

---

## Phase 2b: AppsFlyer Integration (Pre-Production)

When you're ready to run ad campaigns, add AppsFlyer:

### Changes Required

1. **Install SDK**: `npx expo install react-native-appsflyer`
2. **Update attribution.ts**: Replace `initializeAttribution` with AppsFlyer SDK
3. **Update trackRegistration**: Call `appsFlyer.logEvent()`
4. **Configure OneLink**: Set up universal links in AppsFlyer dashboard
5. **TestFlight testing**: Verify deferred deep links work

### Code Changes (Phase 2b)

The attribution service is already structured for easy AppsFlyer drop-in:

```typescript
// Phase 2b: Replace initializeAttribution()
export const initializeAttribution = async (): Promise<AttributionData> => {
  return new Promise((resolve) => {
    appsFlyer.initSdk({
      devKey: 'YOUR_DEV_KEY',
      appId: 'YOUR_APP_ID',
      onInstallConversionDataListener: true,
    });
    
    appsFlyer.onInstallConversionData((data) => {
      // Parse AppsFlyer conversion data
      // Store attribution
      // Resolve promise
    });
  });
};

// Phase 2b: Replace trackRegistration()
export const trackRegistration = (userId: string) => {
  appsFlyer.logEvent('af_complete_registration', {
    af_registration_method: 'email',
    af_customer_user_id: userId,
  });
};
```

### Phase 2b TODOs

When implementing AppsFlyer integration, ensure:

1. **Timeout handling**: AppsFlyer callback may never fire (network issues, SDK bugs). Add a timeout (e.g., 6 seconds) that falls back to organic defaults if no response.

2. **Existing attribution handling**: Preserve the `if (existing) return existing;` check from Phase 2a. A returning user clicking a new deep link should NOT overwrite their original attribution (first touch policy).

---

## File Structure (Phase 2a)

```
native-app/
├── app/
│   ├── open.tsx                   ← Deep link route handler
│   ├── video-intro.tsx            ← Video playback screen
│   ├── risk-questionnaire.tsx     ← Questionnaire placeholder
│   └── developer/
│       └── dashboard.tsx          ← Added "Clear Attribution" button
├── src/
│   ├── services/
│   │   ├── attribution.ts         ← Attribution capture/storage
│   │   └── auth.ts                ← Added attribution to RegisterRequest
│   ├── hooks/
│   │   └── useAuth.ts             ← Send attribution with registration
│   └── components/
│       └── splash/
│           └── SplashScreen.tsx   ← Init attribution for organic installs
├── assets/
│   └── videos/
│       └── intro-v1.mp4           ← Local video asset (naming convention)
├── planning/
│   └── PHASE_2A_BACKEND_SPEC.md   ← Backend requirements doc
├── app.json                        ← scheme + associatedDomains + intentFilters
├── package.json                    ← expo-av dependency
└── ios/                            ← Generated by `npx expo prebuild` (gitignored, native build artifact)
```

---

## Dependencies

### Phase 2a (Now)
- `expo-av` - Video playback (install with `npm install expo-av --legacy-peer-deps` if peer dependency conflicts occur)
- `expo-linking` - Already installed

### Phase 2b (Later)
- `react-native-appsflyer` - Deferred deep linking + attribution

---

## Acceptance Criteria (Phase 2a) - ✅ COMPLETED

### Deep Linking
- [x] `kindling://` scheme configured
- [x] Direct deep links parse params correctly
- [x] Missing params default to organic behavior
- [x] Invalid params (negative, non-numeric) default to 1

### Video Flow
- [x] Video screen shown when `show_video > 0`
- [x] Skip button works
- [x] Video completion navigates to next step
- [x] Video error logged and falls back to next step
- [x] App backgrounding pauses video, foreground rewinds 5s and autoplays

### Questionnaire Flow  
- [x] Questionnaire screen shown when `show_risk_questionnaire > 0`
- [x] Completion navigates to next step
- [x] Uses `KindlingLogo variant="light"` for light-screen consistency

### Attribution Storage
- [x] Attribution captured from URL params
- [x] Attribution stored locally (SecureStore)
- [x] Attribution sent with registration API (with console.log placeholder)
- [x] Organic defaults applied when no deep link
- [x] First-touch policy enforced (existing attribution not overwritten)

### Flow Logic
- [x] Organic install → video → intro
- [x] Deep link with 0,0 → intro (skip video/questionnaire)
- [x] Both with first_show=video → video → questionnaire → intro
- [x] Both with first_show=risk_questionnaire → questionnaire → video → intro

### Developer Tools
- [x] "Clear Attribution (Deep Links)" button in developer dashboard
- [x] Debug logging in deep link parser

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Split into Phase 2a/2b | Don't need deferred deep links until ad campaigns |
| Use expo-linking for Phase 2a | Simple, already installed |
| Create `/open` route handler | expo-router intercepts URL paths; dedicated handler gives control |
| Local video assets | Simpler than CDN for dev/testing; naming convention `intro-v{version}.mp4` |
| Architecture ready for AppsFlyer | Easy drop-in when needed |
| Organic = video, no questionnaire | Video provides value; questionnaire only for campaigns |
| Invalid params default to 1 | Show something rather than nothing; fail-safe behavior |
| First-touch attribution | Never overwrite existing attribution to preserve original source |
| Store attribution in SecureStore | Encrypted, persists across sessions |
| "Clear Attribution" dev button | Essential for testing multiple deep link scenarios |
| Debug logging in open.tsx | Critical for troubleshooting deep link flow |
| Native build required | Custom URL schemes don't work in Expo Go |
| Video rewind on foreground | 5-second rewind for context after app backgrounding |
