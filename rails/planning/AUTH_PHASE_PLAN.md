# Kindling API — Auth Phase Plan (4–6)

This plan defines the next phases for native-app auth endpoints, based on:

- First principles (security, minimal surface, least privilege).
- Current Rails implementation (session-based auth + admin UI).
- Need for native-app onboarding/login flows.

## Guiding Principles

- **Single source of truth**: backend owns auth state and session validity.
- **Minimal data**: return only what's needed for the UI.
- **Token safety**: treat tokens like passwords; short-lived access + refresh flow.
- **Clear failure modes**: consistent error codes for UX (401/403/409/422).

## Key Decision (Phase 4 prerequisite)

Current app uses Rails session cookies for HTML/admin. Native app needs tokens.
We will **add token-based auth for API** while keeping session cookies for admin UI.

### Token Strategy (Locked)

- Access token expiry: **30 minutes**
- Refresh token expiry: **90 days**
- **Rotate refresh token on every use** (old token revoked; new token gets a fresh 90-day expiry)

### Session Scope (Locked)

- **MVP: single device** (revoke other refresh tokens on login).
- **Future: multi-device** with per-device sessions using `device_id`/`device_name`.
- **Logout**: current device only.

### API Versioning (Locked)

- Keep endpoints under **`/api/v1/...`** to support async mobile/web releases and safe breaking changes.

### Error Response Format (Locked)

- Use **simple structured JSON** (not RFC-7807) for now:
  - `{ error, code, status, request_id }`

## Phase 4 — Registration (API surface + data)

**Goal:** enable native app sign-up and initial session.

### Phase 4 Endpoints

- **POST `/api/v1/auth/register`**
  - Body: `email`, `password`, `first_name`, `last_name`, optional `phone`
  - Validations: email format, password strength, required names
  - Response: `user_id`, `first_name`, `last_name`, `email`, `access_token`, `access_expires_at`, `refresh_token`, `refresh_expires_at`
  - Errors: `409` email exists, `422` validation errors

- **POST `/api/v1/auth/register/validate-email`**
  - Body: `email`
  - Response: `{ available: true|false }`
  - Errors: `422` invalid format

### Data changes

Add to `users`:

- `phone` (nullable)
- `status` (enum: `active`, `locked`, `suspended`) — default `active`
- `failed_login_count` (integer)
- `locked_until` (datetime)

Add to `sessions` (or new `api_sessions` table):

- `refresh_token_digest` (hashed)
- `access_expires_at`
- `refresh_expires_at`
- `revoked_at`
- `device_id` / `device_name` (optional; helps logout-by-device)

## Phase 5 — Login / Logout

**Goal:** authenticate existing users and end sessions.

### Phase 5 Endpoints

- **POST `/api/v1/auth/login`**
  - Body: `email`, `password`
  - Response: `access_token`, `access_expires_at`, `refresh_token`, `refresh_expires_at`, `user` (basic profile)
  - Errors:
    - `401` invalid credentials
    - `403` suspended/locked (include `reason`)

- **POST `/api/v1/auth/logout`**
  - Header: `Authorization: Bearer <access_token>`
  - Action: revoke current refresh token (and associated session)
  - Response: `{ success: true }`

### Notes

- Rate-limit login attempts (parity with web: 10/3 minutes).
- **Lockout policy**:
  - After **3 failures**: set `locked_until = now + 1 hour`, return `403` with reason `locked_temporarily`.
  - After **6 total failures**: set `status = locked`, return `403` with reason `locked_support_required`.
  - On successful login: reset `failed_login_count` and clear `locked_until`.
- **401 vs 403**:
  - `401` = invalid credentials or invalid/expired token.
  - `403` = account locked or suspended.
- Return only minimal profile fields needed for the app.

## Phase 6 — Session Management & Profile

**Goal:** support app boot checks, refresh flow, and welcome-back UX.

### Phase 6 Endpoints

- **GET `/api/v1/auth/session/validate`**
  - Header: `Authorization: Bearer <access_token>`
  - Response:
    - valid: `true`, `user_id`, basic profile, `expires_at`
    - invalid/expired: `valid: false`

- **POST `/api/v1/auth/session/refresh`**
  - Header: `Authorization: Bearer <refresh_token>`
  - Response: new `access_token`, `access_expires_at`, `refresh_token`, `refresh_expires_at`
  - Errors: `401` expired/invalid

- **GET `/api/v1/auth/user/profile`**
  - Header: `Authorization: Bearer <access_token>`
  - Response: `first_name`, `last_name`, `email`, optional `phone`

### Password Reset (in scope)

- **POST `/api/v1/auth/password/reset`**
  - Body: `email`
  - Action: send reset email (no user enumeration).
  - Response: `{ success: true }`

- **POST `/api/v1/auth/password/update`**
  - Body: `token`, `password`, `password_confirmation`
  - Action: update password and revoke all sessions for the user.
  - Errors: `401` invalid/expired token, `422` validation errors.

## Out of Scope (Future Phases)

- Will data storage/retrieval
- Invitations (executor/beneficiary)
- Notifications
- Email verification

## Implementation Notes

- Keep HTML/admin auth separate (session cookies) from API tokens.
- Use refresh token hashing + rotation (store only digest server-side).
- Native app currently uses **AsyncStorage** for data; add **Expo SecureStore** for tokens.
- Add JSON response conventions (success + error payloads).
- Add request tests for each endpoint and failure mode.

## Decisions Still Needed

- Password strength policy (exact requirements).
