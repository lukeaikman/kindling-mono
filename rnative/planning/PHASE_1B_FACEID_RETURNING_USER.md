# Phase 1b: Returning User + FaceID

## Overview

Enable returning users to re-authenticate using FaceID/biometrics. Biometric setup happens automatically after registration - no separate screen needed.

---

## What We Have (from 1a/1aa)

- `src/services/auth.ts` - API service with `validateSession()`, `refreshSession()`, `getProfile()`
- `src/hooks/useAuth.ts` - Auth state management with SecureStore
- `src/components/splash/SplashScreen.tsx` - Already has biometric flow scaffolded (triggers biometric in parallel with animation)
- `Person.serverId` + `findScopeByServerId()` for user identification

---

## Implementation Plan (3 Steps)

### Step 1: Extend useAuth

**File**: `src/hooks/useAuth.ts` and `src/services/auth.ts`

#### 1a. Fix refresh token bug in auth.ts

```typescript
// CURRENT (WRONG):
refreshSession: (accessToken: string) =>
  requestJson<RefreshSessionResponse>('/auth/session/refresh', { method: 'POST' }, accessToken),

// CORRECT:
refreshSession: (refreshToken: string) =>
  requestJson<RefreshSessionResponse>('/auth/session/refresh', { method: 'POST' }, refreshToken),
```

#### 1b. Add scope ID storage

Store the scopeId alongside tokens so we don't need to search for it:

```typescript
const SCOPE_ID_KEY = 'auth_scope_id';

// In saveAuthState:
const saveAuthState = async (
  accessToken: string, 
  refreshToken: string, 
  profile?: AuthState['userProfile'],
  scopeId?: string
) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  if (profile) {
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile));
  }
  if (scopeId) {
    await SecureStore.setItemAsync(SCOPE_ID_KEY, scopeId);
  }
};
```

#### 1c. Add biometric preference storage (user-scoped)

```typescript
const BIOMETRIC_ENABLED_KEY = 'auth_biometric_enabled';

const getBiometricKey = (scopeId: string) => `${BIOMETRIC_ENABLED_KEY}_${scopeId}`;

export const getBiometricEnabled = async (scopeId: string): Promise<boolean> => {
  const value = await SecureStore.getItemAsync(getBiometricKey(scopeId));
  return value === 'true';
};

export const setBiometricEnabled = async (scopeId: string, enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(getBiometricKey(scopeId), enabled ? 'true' : 'false');
};
```

#### 1d. Add validateSession function

```typescript
type SessionValidationResult = 
  | { status: 'valid'; profile: AuthUser; scopeId: string }
  | { status: 'invalid'; reason: 'no_tokens' | 'expired' | 'refresh_failed' }
  | { status: 'offline'; profile: AuthUser | null; scopeId: string | null };

const validateSession = async (): Promise<SessionValidationResult> => {
  // 1. Check for existing tokens
  const [accessToken, refreshToken, cachedProfileStr, scopeId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_PROFILE_KEY),
    SecureStore.getItemAsync(SCOPE_ID_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return { status: 'invalid', reason: 'no_tokens' };
  }

  // Parse cached profile (defensive - handle corrupted JSON)
  let profile: AuthUser | null = null;
  if (cachedProfileStr) {
    try {
      profile = JSON.parse(cachedProfileStr);
    } catch {
      // Corrupted cache - treat as no cache
      profile = null;
    }
  }

  // 2. Check network status
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return { status: 'offline', profile, scopeId };
  }

  // 3. Validate with server
  try {
    const validation = await authApi.validateSession(accessToken);
    if (validation.valid) {
      await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(validation.profile));
      return { status: 'valid', profile: validation.profile, scopeId: scopeId! };
    }
    // Defensive: valid=false on 200 (shouldn't happen per API spec)
    return { status: 'invalid', reason: 'expired' };
  } catch (error: any) {
    // Network error (not HTTP error) - treat as offline
    if (!error.status) {
      return { status: 'offline', profile, scopeId };
    }
    
    // 401 - try refresh
    if (error.status === 401) {
      try {
        const refreshed = await authApi.refreshSession(refreshToken);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, refreshed.access_token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshed.refresh_token);
        
        const newProfile = await authApi.getProfile(refreshed.access_token);
        await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(newProfile));
        
        return { status: 'valid', profile: newProfile, scopeId: scopeId! };
      } catch {
        return { status: 'invalid', reason: 'refresh_failed' };
      }
    }
    
    // Other errors (500, etc) - treat as offline to be graceful
    return { status: 'offline', profile, scopeId };
  }
};
```

#### 1e. Enable biometric after registration

In the `register` function, after successful registration:

```typescript
// After tokens are saved and syncServerIdentity completes...
const hasHardware = await LocalAuthentication.hasHardwareAsync();
const isEnrolled = await LocalAuthentication.isEnrolledAsync();

if (hasHardware && isEnrolled && activeWillMakerId) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Open Kindling Instantly',
    disableDeviceFallback: false,  // Allow passcode fallback during setup
  });
  
  if (result.success) {
    await setBiometricEnabled(activeWillMakerId, true);
  }
  // If user cancels, don't save preference - will work without biometric
}

// Then navigate based on registration type:
// - From vanilla register → /onboarding/welcome
// - From secure-account → /order-of-things
```

---

### Step 2: Update SplashScreen

**File**: `src/components/splash/SplashScreen.tsx`

#### 2a. Create single initialization function (no callbacks)

```typescript
type AppInitResult = {
  destination: '/intro' | '/dashboard' | '/auth/login';
  loginParams?: { welcomeBack: string; firstName: string };
  requiresBiometric: boolean;
  scopeId: string | null;
};

const initializeApp = async (): Promise<AppInitResult> => {
  const session = await validateSession();
  
  // No tokens - new user
  if (session.status === 'invalid' && session.reason === 'no_tokens') {
    return { destination: '/intro', requiresBiometric: false, scopeId: null };
  }
  
  // Session invalid/expired - need manual login
  if (session.status === 'invalid') {
    return { 
      destination: '/auth/login',
      loginParams: { 
        welcomeBack: 'true', 
        firstName: session.profile?.first_name || '' 
      },
      requiresBiometric: false,
      scopeId: null
    };
  }
  
  // Valid or offline session
  const scopeId = session.scopeId;
  
  if (!scopeId) {
    // Edge case: valid session but no scopeId stored (shouldn't happen)
    return { destination: '/dashboard', requiresBiometric: false, scopeId: null };
  }
  
  // Check biometric preference
  const biometricEnabled = await getBiometricEnabled(scopeId);
  
  if (biometricEnabled) {
    // Verify biometric is still available on device
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      // User disabled FaceID in device settings - clear stale preference
      await setBiometricEnabled(scopeId, false);
      return { destination: '/dashboard', requiresBiometric: false, scopeId };
    }
    return { destination: '/dashboard', requiresBiometric: true, scopeId };
  }
  
  return { destination: '/dashboard', requiresBiometric: false, scopeId };
};
```

#### 2b. Single useEffect for initialization

```typescript
const [initResult, setInitResult] = useState<AppInitResult | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  if (!fontsLoaded) return;

  let mounted = true;
  
  const init = async () => {
    // Start animation
    runTransition1();
    
    // Initialize app state in parallel
    const result = await initializeApp();
    
    if (!mounted) return;
    setInitResult(result);
    
    // If biometric required, trigger it now (parallel with animation)
    if (result.requiresBiometric) {
      triggerBiometric();
    }
    
    setIsLoading(false);
  };
  
  // Small delay for native splash handoff
  const timer = setTimeout(init, 100);
  
  return () => {
    mounted = false;
    clearTimeout(timer);
  };
}, [fontsLoaded]);
```

#### 2c. Single useEffect for navigation (after animation completes)

```typescript
useEffect(() => {
  if (!animationComplete) return;
  
  // Still loading - show loading indicator
  if (isLoading || !initResult) return;
  
  // No biometric required - navigate immediately
  if (!initResult.requiresBiometric) {
    if (initResult.destination === '/auth/login' && initResult.loginParams) {
      router.replace({ pathname: '/auth/login', params: initResult.loginParams });
    } else {
      router.replace(initResult.destination);
    }
    return;
  }
  
  // Biometric required - wait for result
  if (biometricResult === 'success') {
    showUnlockSuccess();
    // After unlock animation, navigate to dashboard
  } else if (biometricResult === 'failed') {
    showAuthFailedUI();
  }
  // If pending, wait for biometric to complete
}, [animationComplete, isLoading, initResult, biometricResult]);
```

#### 2d. Show loading state if needed

```typescript
// In render, after animation completes but still loading:
{animationComplete && isLoading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator color={BRAND_CREAM} />
  </View>
)}
```

#### 2e. Update auth failed buttons (no retry - OS handles that)

```typescript
{phase === 'auth_failed' && (
  <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
    <Button
      variant="primary"
      onPress={() => router.replace({
        pathname: '/auth/login',
        params: { 
          welcomeBack: 'true',
          firstName: initResult?.loginParams?.firstName || '',
        }
      })}
    >
      Login with Password
    </Button>
  </Animated.View>
)}
```

---

### Step 3: Enhance Login Screen

**File**: `app/auth/login.tsx`

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ 
    welcomeBack?: string; 
    firstName?: string;
  }>();
  
  const isWelcomeBack = params.welcomeBack === 'true';
  const firstName = params.firstName;

  return (
    <View>
      <Text variant="headlineMedium">
        {isWelcomeBack && firstName 
          ? `Welcome back, ${firstName}` 
          : 'Welcome back'}
      </Text>
      
      {/* ... rest of login form */}
    </View>
  );
}
```

---

## TODOs to Add in Code

```typescript
// In SplashScreen, after biometric success:
// TODO: Show user the last sync/amendment time so they know data freshness when offline

// In useAuth, for future consideration:
// TODO: Consider adding token expiry tracking to reduce unnecessary server validation calls
```

---

## Flow Summary

### App Open (Returning User)

```
App Opens
    ↓
SplashScreen animation starts + initializeApp() runs in parallel
    ↓
initializeApp() returns:
    ├── destination: '/intro' (new user)
    ├── destination: '/dashboard', requiresBiometric: false (returning, no biometric)
    ├── destination: '/dashboard', requiresBiometric: true → triggerBiometric()
    └── destination: '/auth/login' (session expired)
    ↓
Animation complete
    ├── Still loading? → Show loading indicator
    ├── No biometric required → Navigate to destination
    └── Biometric required:
        ├── Success → Unlock animation → /dashboard
        └── Failed (OS exhausted retries) → Show "Login with Password" button
```

### Post-Registration

```
Registration Success
    ↓
Device has FaceID enrolled?
    ├── No → Navigate to destination
    └── Yes → Prompt "Open Kindling Instantly" (allows passcode fallback)
              ├── User authenticates → Save preference → Navigate
              └── User cancels → Navigate without saving preference
    ↓
Destination:
    ├── From /auth/register → /onboarding/welcome (start will)
    └── From /auth/secure-account → /order-of-things (continue will)
```

---

## Files Modified

```
native-app/
├── src/
│   ├── services/
│   │   └── auth.ts              ← FIX: refreshSession parameter
│   ├── hooks/
│   │   └── useAuth.ts           ← ADD: biometric preference, validateSession, scopeId storage
│   └── components/
│       └── splash/
│           └── SplashScreen.tsx ← REFACTOR: single initializeApp(), loading state
└── app/
    └── auth/
        └── login.tsx            ← MODIFY: welcome back support
```

---

## Acceptance Criteria

- [ ] Refresh token endpoint uses correct token (refresh, not access)
- [ ] Scope ID stored alongside tokens (no searching required)
- [ ] After registration, biometric prompt appears with passcode fallback
- [ ] Biometric preference saved per-user (scoped)
- [ ] Returning user with biometric enabled → FaceID triggered during splash
- [ ] FaceID success → straight to dashboard
- [ ] FaceID fail → "Login with Password" button shown (no retry button - OS handles retries)
- [ ] Manual login shows "Welcome back, [name]" when redirected
- [ ] Offline with valid session + biometric enabled → FaceID required
- [ ] Biometric disabled in device settings → clears stale preference, password login
- [ ] Loading indicator shown if animation ends before initialization completes
- [ ] Network errors treated as offline (graceful degradation)

---

## Testing Checklist

1. **Fresh install** → /intro
2. **Register (vanilla)** → biometric prompt → enable → /onboarding/welcome
3. **Register (vanilla)** → biometric prompt → cancel → /onboarding/welcome (no biometric saved)
4. **Register (post-onboarding)** → biometric prompt → enable → /order-of-things
5. **Return (biometric enabled)** → FaceID during splash → success → /dashboard
6. **Return (biometric enabled)** → FaceID fail (OS retries exhausted) → "Login with Password" button
7. **Return (no biometric)** → straight to /dashboard
8. **Expired token (online)** → silent refresh → continues to dashboard
9. **Invalid token (refresh fails)** → /auth/login with "Welcome back, [name]"
10. **Offline + valid cache + biometric** → FaceID required → dashboard
11. **Device FaceID removed** → clears preference → straight to dashboard
12. **Slow network** → animation ends → loading indicator shown → then navigates

---

## Out of Scope

- Multi-user FaceID (one biometric = one user)
- Disabling biometric from app settings
- Biometric for specific actions (only app unlock)
- Token expiry tracking optimization (TODO added)
