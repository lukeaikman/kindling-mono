# Phase 1a: Core Auth Screens

## Overview

This phase implements the foundational authentication screens required before any other intro/registration flows can be built. These screens enable users to create accounts, secure their data, and log back in.

---

## Current State

### What We Have
- **SplashScreen** (`src/components/splash/SplashScreen.tsx`) - Animated splash with:
  - Cream → Navy background transition
  - KINDLING → KIND logo animation
  - Tagline fade-in
  - Biometric auth support (disabled via `ENABLE_BIOMETRIC_FLOW = false`)
  - "Login With Form" button (placeholder, currently routes to onboarding)

- **Onboarding Flow** (`app/onboarding/`) - 5-step will creation setup:
  1. `welcome.tsx` - Collects first name, last name, DOB
  2. `location.tsx` - Collects location/residence
  3. `family.tsx` - Collects family situation
  4. `extended-family.tsx` - Collects extended family
  5. `wrap-up.tsx` - Summary screen → routes to `/order-of-things`

- **Web Prototype LoginScreen** (`web-prototype/src/components/LoginScreen.tsx`) - Reference design (note: includes social login which is out of scope for Phase 1a)

### What's Missing
- No actual registration flow (account creation)
- No login screen in native app
- No "First Onboarding Screen" (the entry point screen from the spec)
- No email validation integration
- Onboarding collects user data but doesn't create an account

---

## Screens to Build

### 1. First Onboarding Screen (Entry Point)

**Purpose**: The gateway screen shown after splash animations complete. Determines user path.

**Route**: `/intro` (new)

**Spec Reference**: Notion spec "First Onboarding Screen"

```
┌─────────────────────────────────┐
│                                 │
│       {{ Kind Logo }}           │
│       {{ Tagline }}             │
│                                 │
│  [Start Creating Your Will     │
│   And Estate Plan]             │
│                                 │
│  [Login]                        │
│                                 │
└─────────────────────────────────┘
```

**Actions**:
- "Start Creating..." → Navigate to `/onboarding/welcome` (existing flow)
- "Login" → Navigate to `/auth/login` (new)

**Notes**:
- This replaces the current direct navigation from SplashScreen to `/onboarding/welcome`
- Should match the calm, branded aesthetic of the splash screen

---

### 2. Login Screen

**Purpose**: Returning user authentication.

**Route**: `/auth/login` (new)

**API Endpoint**: `POST /api/v1/auth/login`

```
┌─────────────────────────────────┐
│                                 │
│       {{ Kind Logo }}           │
│                                 │
│  Welcome back                   │
│                                 │
│  [Email input]                  │
│  [Password input]               │
│                                 │
│  [Sign In]                      │
│                                 │
│  [New to Kindling? Register]    │
│                                 │
│  [Forgot password?]             │
│                                 │
└─────────────────────────────────┘
```

**Actions**:
- "Sign In" → Call login API → On success, navigate to home/dashboard
- "New to Kindling? Register" → Navigate to `/auth/register`
- "Forgot password?" → Navigate to `/auth/forgot-password` (Phase 5)

**API Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "device_id": "device-uuid",
  "device_name": "iPhone 15 Pro"
}
```

**API Response (200)**:
```json
{
  "access_token": "...",
  "access_expires_at": "...",
  "refresh_token": "...",
  "refresh_expires_at": "...",
  "user": {
    "id": 1,
    "first_name": "Alex",
    "last_name": "Hall",
    "email": "alex@example.com",
    "phone": null
  }
}
```

**Error States**:
- 401: "Invalid email or password"
- Network error: "Please check your connection"

---

### 3. Registration Screen (Vanilla)

**Purpose**: New user account creation WITHOUT prior context (e.g., direct app open, no onboarding data).

**Route**: `/auth/register` (new)

**API Endpoints**: 
- `POST /api/v1/auth/register/validate-email` (real-time validation)
- `POST /api/v1/auth/register`

```
┌─────────────────────────────────┐
│                                 │
│       {{ Kind Logo }}           │
│                                 │
│  Create your account            │
│                                 │
│  [First name input]             │
│  [Last name input]              │
│  [Email input]                  │
│  [Password input]               │
│  [Confirm password input]       │
│                                 │
│  [Create Account]               │
│                                 │
│  [Already have an account?      │
│   Sign in]                      │
│                                 │
└─────────────────────────────────┘
```

**Validation**:
- First name: Required, 1-50 chars
- Last name: Required, 1-50 chars
- Email: Required, valid format, real-time availability check
- Password: Required, min 8 chars, show strength indicator
- Confirm password: Must match

**Email Validation (Real-time)**:
```json
// Request
POST /api/v1/auth/register/validate-email
{ "email": "alex@example.com" }

// Response
{ "available": true }
// or
{ "available": false }  // Show "Email already registered"
```

**API Request**:
```json
{
  "email": "alex@example.com",
  "password": "SecurePass123",
  "first_name": "Alex",
  "last_name": "Hall",
  "phone": null,
  "device_id": "device-uuid",
  "device_name": "iPhone 15 Pro"
}
```

**On Success**: 
- Store tokens securely
- Navigate to FaceID setup screen (Phase 1b) OR home

---

### 4. Registration Screen (Post-Onboarding)

**Purpose**: Secure the data collected during onboarding by creating an account.

**Route**: `/auth/secure-account` (new)

**Context**: User has completed onboarding flow and we have:
- First name, last name (from welcome screen)
- Location (from location screen)
- Family data (from family screens)

This data is currently stored locally. We need to:
1. Create their account
2. Sync their onboarding data to the server

```
┌─────────────────────────────────┐
│                                 │
│       {{ Kind Logo }}           │
│                                 │
│  Secure your will               │
│                                 │
│  You've made great progress,    │
│  [First name]. Let's secure     │
│  your information.              │
│                                 │
│  [Email input]                  │
│  [Password input]               │
│  [Confirm password input]       │
│                                 │
│  [Create Account & Continue]    │
│                                 │
└─────────────────────────────────┘
```

**Key Differences from Vanilla Registration**:
- Copy acknowledges their progress ("You've made great progress, Alex")
- No first/last name fields (already collected)
- Button says "Create Account & Continue" (not just "Create Account")
- After registration, syncs onboarding data to server, then continues to next step

**Flow**:
1. User completes onboarding wrap-up
2. Navigates to this screen instead of `/order-of-things`
3. User enters email + password
4. On submit:
   - Create account via API (includes first_name, last_name from local state)
   - Sync onboarding data to server
   - Navigate to FaceID setup (Phase 1b) OR continue will creation

---

## Navigation Flow Updates

### Current Flow
```
app/index.tsx (SplashScreen)
    ↓
/onboarding/welcome
    ↓
/onboarding/location
    ↓
/onboarding/family
    ↓
/onboarding/extended-family
    ↓
/onboarding/wrap-up
    ↓
/order-of-things
```

### New Flow (Phase 1a)
```
app/index.tsx (SplashScreen)
    ↓
/intro (First Onboarding Screen) ← NEW
    ↓
    ├── [Start Creating] → /onboarding/welcome → ... → /onboarding/wrap-up
    │                                                        ↓
    │                                              /auth/secure-account ← NEW
    │                                                        ↓
    │                                              /order-of-things (continue will)
    │
    └── [Login] → /auth/login ← NEW
                      ↓
                  [Success] → Home/Dashboard
                      ↓
                  [Register] → /auth/register ← NEW
                                    ↓
                              [Success] → /onboarding/welcome (start will)
```

---

## File Structure

```
native-app/
├── app/
│   ├── _layout.tsx (update to include auth routes)
│   ├── index.tsx (update: SplashScreen → /intro)
│   ├── intro.tsx ← NEW (First Onboarding Screen)
│   ├── auth/
│   │   ├── _layout.tsx ← NEW
│   │   ├── login.tsx ← NEW
│   │   ├── register.tsx ← NEW
│   │   └── secure-account.tsx ← NEW
│   └── onboarding/
│       └── wrap-up.tsx (update: → /auth/secure-account)
└── src/
    ├── services/
    │   └── auth.ts ← NEW (auth API methods)
    └── hooks/
        └── useAuth.ts ← NEW (auth state management)
```

---

## API Integration

### New Service: `src/services/auth.ts`

```typescript
// Auth service methods to implement:

interface AuthService {
  // Login
  login(email: string, password: string, deviceId: string, deviceName?: string): Promise<LoginResponse>;
  
  // Registration
  register(data: RegisterData): Promise<RegisterResponse>;
  validateEmail(email: string): Promise<{ available: boolean }>;
  
  // Session
  validateSession(token: string): Promise<SessionValidation>;
  refreshSession(refreshToken: string): Promise<TokenPair>;
  logout(token: string): Promise<void>;
  
  // Profile
  getProfile(token: string): Promise<UserProfile>;
}
```

### Secure Token Storage

Use `expo-secure-store` for sensitive data:
- `access_token`
- `refresh_token`
- `device_id`

---

## Dependencies

### Existing (no changes needed)
- `expo-router` - Navigation
- `react-native-paper` - UI components
- `expo-local-authentication` - Biometrics (Phase 1b)

### New Dependencies
- `expo-secure-store` - Secure token storage
- `expo-device` - Get device name for API calls

---

## Acceptance Criteria

### First Onboarding Screen
- [ ] Shows after splash animation completes
- [ ] Displays Kind logo and tagline
- [ ] "Start Creating" navigates to onboarding
- [ ] "Login" navigates to login screen
- [ ] Matches Kindling brand styling

### Login Screen
- [ ] Email and password inputs with validation
- [ ] Calls `POST /api/v1/auth/login` on submit
- [ ] Shows error messages for invalid credentials
- [ ] Stores tokens securely on success
- [ ] Navigates to home/dashboard on success
- [ ] "Register" link navigates to registration

### Registration Screen (Vanilla)
- [ ] Collects first name, last name, email, password
- [ ] Real-time email availability validation
- [ ] Password strength indicator
- [ ] Calls `POST /api/v1/auth/register` on submit
- [ ] Shows validation errors inline
- [ ] Stores tokens securely on success
- [ ] "Sign in" link navigates to login

### Registration Screen (Post-Onboarding)
- [ ] Pre-fills user's first name in copy
- [ ] Only collects email and password (not name)
- [ ] References their progress in copy
- [ ] Syncs onboarding data after account creation
- [ ] Continues to will creation flow after success

---

## Out of Scope (Later Phases)

- **Social authentication (Apple, Google)** - Phase 5. Not included in Phase 1a.
- **Forgot password flow** - Phase 5
- **Email verification** - Phase 5 (nice-to-have)
- **FaceID setup** - Phase 1b
- **Returning user re-authentication** - Phase 1b
- **Deeplink handling** - Phase 2+

---

## Implementation Notes

### Social Login TODO

When implementing the auth screens, add a code comment/TODO placeholder where social login buttons would go:

```typescript
// TODO: Social Login (Phase 5)
// Add Apple and Google sign-in buttons here when backend OAuth is implemented.
// See: https://docs.expo.dev/guides/google-authentication/
// See: https://docs.expo.dev/guides/apple-authentication/
```

This ensures we don't forget to add the feature later and documents where it should be placed.

---

## Open Questions

1. **Session persistence**: How long should local sessions last before requiring re-auth?
   - Spec says 90 days local, with server validation on each open

2. **Onboarding data sync**: Should we sync onboarding data immediately after registration, or batch with first will save?
   - Recommendation: Sync immediately to ensure data isn't lost

3. **Device ID generation**: Use `expo-device` UUID or generate our own?
   - Recommendation: Generate UUID on first launch, persist in secure store
