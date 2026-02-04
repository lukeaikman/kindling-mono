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

## Implementation Plan (Phase 2a)

### Step 1: Configure Deep Linking

**File**: `app.json`

```json
{
  "expo": {
    "scheme": "kindling",
    "ios": {
      "associatedDomains": ["applinks:kindling.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{
          "scheme": "https",
          "host": "kindling.app",
          "pathPrefix": "/app"
        }]
      }]
    }
  }
}
```

### Step 2: Create Attribution Service (AppsFlyer-Ready)

**File**: `src/services/attribution.ts`

The key is to abstract the attribution capture so AppsFlyer can be dropped in later.

```typescript
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

const ATTRIBUTION_KEY = 'kindling_attribution';
const ONBOARDING_STATE_KEY = 'kindling_onboarding_state';

export interface AttributionData {
  source?: string;
  campaign?: string;
  location_id?: string;
  show_video: number;
  show_risk_questionnaire: number;
  first_show: 'video' | 'risk_questionnaire';
  captured_at: string;
  is_organic: boolean;
  raw_url?: string;
}

export interface OnboardingState {
  video_completed: boolean;
  video_version?: number;
  questionnaire_completed: boolean;
  questionnaire_version?: number;
}

// Defaults for organic installs
const ORGANIC_DEFAULTS: Pick<AttributionData, 'show_video' | 'show_risk_questionnaire' | 'first_show' | 'is_organic'> = {
  show_video: 1,
  show_risk_questionnaire: 0,
  first_show: 'video',
  is_organic: true,
};

/**
 * Initialize attribution on first app open.
 * 
 * Phase 2a: Uses expo-linking for direct deep links only.
 * Phase 2b: Will be replaced with AppsFlyer SDK for deferred deep links.
 */
export const initializeAttribution = async (): Promise<AttributionData> => {
  // Check for existing attribution (already captured)
  const existing = await getStoredAttribution();
  if (existing) return existing;
  
  // Try to get initial URL (direct deep link)
  const initialUrl = await Linking.getInitialURL();
  
  let attribution: AttributionData;
  
  if (initialUrl) {
    // Parse deep link params
    const parsed = Linking.parse(initialUrl);
    const params = (parsed.queryParams || {}) as Record<string, string>;
    
    attribution = {
      source: params.source,
      campaign: params.campaign,
      location_id: params.location_id,
      show_video: parseIntParam(params.show_video, ORGANIC_DEFAULTS.show_video),
      show_risk_questionnaire: parseIntParam(params.show_risk_questionnaire, ORGANIC_DEFAULTS.show_risk_questionnaire),
      first_show: parseFirstShow(params.first_show),
      captured_at: new Date().toISOString(),
      is_organic: false,
      raw_url: initialUrl,
    };
  } else {
    // Organic install - use defaults
    attribution = {
      ...ORGANIC_DEFAULTS,
      captured_at: new Date().toISOString(),
    };
  }
  
  // Store attribution
  await SecureStore.setItemAsync(ATTRIBUTION_KEY, JSON.stringify(attribution));
  
  // Initialize onboarding state
  const onboardingState: OnboardingState = {
    video_completed: false,
    video_version: attribution.show_video > 0 ? attribution.show_video : undefined,
    questionnaire_completed: false,
    questionnaire_version: attribution.show_risk_questionnaire > 0 ? attribution.show_risk_questionnaire : undefined,
  };
  await SecureStore.setItemAsync(ONBOARDING_STATE_KEY, JSON.stringify(onboardingState));
  
  return attribution;
};

function parseIntParam(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseFirstShow(value: string | undefined): 'video' | 'risk_questionnaire' {
  if (value === 'risk_questionnaire') return 'risk_questionnaire';
  return 'video';
}

/**
 * Get stored attribution data.
 */
export const getStoredAttribution = async (): Promise<AttributionData | null> => {
  try {
    const stored = await SecureStore.getItemAsync(ATTRIBUTION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Get onboarding state (video/questionnaire progress)
 */
export const getOnboardingState = async (): Promise<OnboardingState | null> => {
  try {
    const stored = await SecureStore.getItemAsync(ONBOARDING_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Update onboarding state
 */
export const updateOnboardingState = async (updates: Partial<OnboardingState>): Promise<void> => {
  const current = await getOnboardingState();
  const updated = { ...current, ...updates };
  await SecureStore.setItemAsync(ONBOARDING_STATE_KEY, JSON.stringify(updated));
};

/**
 * Determine next destination based on attribution and onboarding state.
 */
export const getNextOnboardingDestination = async (): Promise<
  '/video-intro' | '/risk-questionnaire' | '/intro'
> => {
  const attribution = await getStoredAttribution();
  const state = await getOnboardingState();
  
  if (!attribution || !state) {
    return '/intro';
  }
  
  const needsVideo = attribution.show_video > 0 && !state.video_completed;
  const needsQuestionnaire = attribution.show_risk_questionnaire > 0 && !state.questionnaire_completed;
  
  if (needsVideo && needsQuestionnaire) {
    return attribution.first_show === 'video' ? '/video-intro' : '/risk-questionnaire';
  }
  
  if (needsVideo) return '/video-intro';
  if (needsQuestionnaire) return '/risk-questionnaire';
  
  return '/intro';
};

/**
 * Track registration event.
 * 
 * Phase 2a: No-op (just logs)
 * Phase 2b: Will call AppsFlyer.logEvent()
 */
export const trackRegistration = (userId: string) => {
  console.log(`[Attribution] Registration tracked for user: ${userId}`);
  // TODO Phase 2b: appsFlyer.logEvent('af_complete_registration', { ... })
};

/**
 * Clear onboarding state after registration.
 */
export const clearOnboardingState = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ONBOARDING_STATE_KEY);
  // Keep attribution data - don't delete ATTRIBUTION_KEY
};

/**
 * Get attribution data formatted for API request.
 */
export const getAttributionForApi = async (): Promise<{
  source?: string;
  campaign?: string;
  location_id?: string;
  is_organic: boolean;
} | null> => {
  const attribution = await getStoredAttribution();
  if (!attribution) return null;
  
  return {
    source: attribution.source,
    campaign: attribution.campaign,
    location_id: attribution.location_id,
    is_organic: attribution.is_organic,
  };
};
```

### Step 3: Update SplashScreen

**File**: `src/components/splash/SplashScreen.tsx`

Update `initializeApp`:

```typescript
import { initializeAttribution, getNextOnboardingDestination } from '../../services/attribution';

type AppInitResult = {
  destination: '/intro' | '/video-intro' | '/risk-questionnaire' | '/order-of-things' | '/auth/login';
  loginParams?: { welcomeBack?: string; firstName?: string; offline?: string };
  requiresBiometric: boolean;
  scopeId: string | null;
  isOffline: boolean;
};

const initializeApp = useCallback(async (): Promise<AppInitResult> => {
  await handleFreshInstallCleanup();
  
  const session = await validateSession();
  
  // New user - initialize attribution and determine flow
  if (session.status === 'invalid' && session.reason === 'no_tokens') {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return {
        destination: '/auth/login',
        loginParams: { offline: 'true' },
        requiresBiometric: false,
        scopeId: null,
        isOffline: true,
      };
    }
    
    // Initialize attribution (captures deep link params if present)
    await initializeAttribution();
    
    // Determine starting screen
    const destination = await getNextOnboardingDestination();
    
    return { 
      destination, 
      requiresBiometric: false, 
      scopeId: null, 
      isOffline: false,
    };
  }
  
  // ... rest of existing returning user logic unchanged
}, []);
```

### Step 4: Create Video Intro Screen

**File**: `app/video-intro.tsx`

```typescript
import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui/Button';
import { KindlingColors } from '../src/styles/theme';
import { Spacing } from '../src/styles/constants';
import { 
  getStoredAttribution, 
  updateOnboardingState, 
  getNextOnboardingDestination 
} from '../src/services/attribution';

// Video URLs by version - replace with actual CDN URLs
const VIDEO_URLS: Record<number, string> = {
  1: 'https://cdn.kindling.app/videos/intro-v1.mp4',
  // Add more versions as needed
};

export default function VideoIntroScreen() {
  const [videoVersion, setVideoVersion] = useState<number>(1);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    getStoredAttribution().then(attr => {
      if (attr?.show_video) setVideoVersion(attr.show_video);
    });
    
    // Handle app backgrounding - skip to next on return (per spec)
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState.match(/inactive|background/)) {
      // Pause video when app goes to background
      videoRef.current?.pauseAsync();
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Rewind 5 seconds for context, then autoplay
      const status = await videoRef.current?.getStatusAsync();
      if (status?.isLoaded) {
        const newPosition = Math.max(0, (status.positionMillis || 0) - 5000);
        await videoRef.current?.setPositionAsync(newPosition);
        await videoRef.current?.playAsync();
      }
    }
    appState.current = nextAppState;
  };

  const navigateToNext = async () => {
    await updateOnboardingState({ video_completed: true });
    const next = await getNextOnboardingDestination();
    router.replace(next);
  };

  const handleVideoComplete = () => navigateToNext();
  const handleSkip = () => navigateToNext();
  const handleVideoError = () => {
    setVideoError(true);
    navigateToNext();
  };

  const videoUrl = VIDEO_URLS[videoVersion] || VIDEO_URLS[1];

  return (
    <View style={styles.container}>
      {!videoError ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              handleVideoComplete();
            }
          }}
          onError={handleVideoError}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Video unavailable</Text>
        </View>
      )}
      
      <SafeAreaView style={styles.skipContainer} edges={['bottom']}>
        <Button variant="outline" onPress={handleSkip} style={styles.skipButton}>
          Skip
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.navy,
  },
  video: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: KindlingColors.cream,
  },
  skipContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
```

### Step 5: Create Risk Questionnaire Screen

**File**: `app/risk-questionnaire.tsx`

```typescript
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui/Button';
import { KindlingLogo } from '../src/components/ui/KindlingLogo';
import { KindlingColors } from '../src/styles/theme';
import { Spacing, Typography } from '../src/styles/constants';
import { 
  getStoredAttribution, 
  updateOnboardingState, 
  getNextOnboardingDestination 
} from '../src/services/attribution';

export default function RiskQuestionnaireScreen() {
  const [questionnaireVersion, setQuestionnaireVersion] = useState<number>(1);

  useEffect(() => {
    getStoredAttribution().then(attr => {
      if (attr?.show_risk_questionnaire) {
        setQuestionnaireVersion(attr.show_risk_questionnaire);
      }
    });
  }, []);

  const handleComplete = async () => {
    await updateOnboardingState({ questionnaire_completed: true });
    const next = await getNextOnboardingDestination();
    router.replace(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <KindlingLogo size="md" variant="dark" showText />
          <Text style={styles.title}>Evaluate Your Estate Risk</Text>
          <Text style={styles.subtitle}>
            Answer a few questions to understand your current estate planning situation.
          </Text>
        </View>
        
        {/* TODO: Implement actual questionnaire based on version */}
        <View style={styles.questionnaire}>
          <Text style={styles.placeholderText}>
            Questionnaire v{questionnaireVersion}
          </Text>
          <Text style={styles.placeholderSubtext}>
            Content to be implemented before launch.
          </Text>
        </View>
        
        <View style={styles.actions}>
          <Button variant="primary" onPress={handleComplete}>
            Continue
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.cream,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  questionnaire: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actions: {
    gap: Spacing.md,
  },
});
```

### Step 6: Update useAuth to Store Attribution

**File**: `src/hooks/useAuth.ts`

```typescript
import { getAttributionForApi, trackRegistration, clearOnboardingState } from '../services/attribution';

const register = useCallback(async (payload: RegisterData): Promise<RegisterResponse> => {
  // ... existing code ...
  
  // Get attribution data for API
  const attribution = await getAttributionForApi();
  
  const response = await authApi.register({
    ...payload,
    attribution: attribution || undefined,
  });
  
  // Track registration (no-op in Phase 2a, AppsFlyer in Phase 2b)
  if (response.user_id) {
    trackRegistration(String(response.user_id));
  }
  
  // Clear onboarding state
  await clearOnboardingState();
  
  // ... rest of existing code
}, []);
```

### Step 7: Backend API Changes

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

Store in User table:
```sql
ALTER TABLE users ADD COLUMN attribution_source VARCHAR(100);
ALTER TABLE users ADD COLUMN attribution_campaign VARCHAR(100);
ALTER TABLE users ADD COLUMN attribution_location_id VARCHAR(100);
ALTER TABLE users ADD COLUMN attribution_is_organic BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN attribution_captured_at TIMESTAMP;

-- Index for attribution queries (e.g., "how many users from Facebook?")
CREATE INDEX idx_users_attribution_source ON users(attribution_source);
```

---

## Testing Plan (Phase 2a)

### What We CAN Test Now (Direct Deep Links)

Direct deep links work when the app is already installed. Test with simulator:

```bash
# Video only (organic default)
npx uri-scheme open "kindling://open" --ios

# Skip video and questionnaire - straight to intro
npx uri-scheme open "kindling://open?show_video=0&show_risk_questionnaire=0" --ios

# Video with source attribution
npx uri-scheme open "kindling://open?source=test&show_video=1" --ios

# Questionnaire only
npx uri-scheme open "kindling://open?show_video=0&show_risk_questionnaire=1" --ios

# Both, video first
npx uri-scheme open "kindling://open?show_video=1&show_risk_questionnaire=1&first_show=video" --ios

# Both, questionnaire first
npx uri-scheme open "kindling://open?show_video=1&show_risk_questionnaire=1&first_show=risk_questionnaire" --ios

# QR code simulation
npx uri-scheme open "kindling://open?source=qr_attorney&location_id=office123&show_video=1" --ios
```

### What We CANNOT Test Now (Deferred Deep Links)

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

## File Structure

```
native-app/
├── app/
│   ├── video-intro.tsx           ← NEW
│   ├── risk-questionnaire.tsx    ← NEW
│   └── ... (existing)
├── src/
│   ├── services/
│   │   └── attribution.ts        ← NEW (AppsFlyer-ready)
│   ├── hooks/
│   │   └── useAuth.ts            ← MODIFY (store attribution)
│   └── components/
│       └── splash/
│           └── SplashScreen.tsx  ← MODIFY (init attribution)
├── app.json                       ← MODIFY (deeplink scheme)
└── package.json                   ← ADD expo-av
```

---

## Dependencies

### Phase 2a (Now)
- `expo-av` - Video playback
- `expo-linking` - Already installed

### Phase 2b (Later)
- `react-native-appsflyer` - Deferred deep linking + attribution

---

## Acceptance Criteria (Phase 2a)

### Deep Linking
- [ ] `kindling://` scheme configured
- [ ] Direct deep links parse params correctly
- [ ] Missing params default to organic behavior

### Video Flow
- [ ] Video screen shown when `show_video > 0`
- [ ] Skip button works
- [ ] Video completion navigates to next step
- [ ] Video error falls back to next step
- [ ] App backgrounding skips to next step

### Questionnaire Flow  
- [ ] Questionnaire screen shown when `show_risk_questionnaire > 0`
- [ ] Completion navigates to next step

### Attribution Storage
- [ ] Attribution captured from URL params
- [ ] Attribution stored locally
- [ ] Attribution sent with registration API
- [ ] Organic defaults applied when no deep link

### Flow Logic
- [ ] Organic install → video → intro
- [ ] Deep link with 0,0 → intro (skip video/questionnaire)
- [ ] Both with first_show=video → video → questionnaire → intro
- [ ] Both with first_show=risk_questionnaire → questionnaire → video → intro

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Split into Phase 2a/2b | Don't need deferred deep links until ad campaigns |
| Use expo-linking for Phase 2a | Works in Expo Go, simple, already installed |
| Architecture ready for AppsFlyer | Easy drop-in when needed |
| Organic = video, no questionnaire | Video provides value; questionnaire only for campaigns |
| Store attribution on Person (local) + User (server) | No new data structures |
