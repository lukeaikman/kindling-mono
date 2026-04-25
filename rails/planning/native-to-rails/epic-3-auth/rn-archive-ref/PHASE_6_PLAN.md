# Kindling API — Phase 6 Plan (Session & Profile)

This document details Phase 6 implementation for session validation, refresh, and profile retrieval, aligned with Phase 4–5 decisions and current code:

- Opaque access + refresh tokens validated via `api_sessions` in the DB (no JWT).
- Separate `api_sessions` table (do not mix with web cookie sessions).
- Single-device MVP (revoke other refresh tokens on login/registration).
- Access token: 30 minutes; refresh token: 90 days; rotate on refresh.
- Error format: `{ error, code, status, request_id }`.
- Email normalization: **strip + downcase only** (no alias/dot normalization).

## Goal

Provide API endpoints for session validation, refresh, and user profile retrieval for native-app boot and “welcome back” flows.

## Endpoints

### GET `/api/v1/auth/session/validate`

**Header:** `Authorization: Bearer <access_token>`

**Success Response (200):**

- `valid: true`
- `user_id`
- `profile` (basic)
- `access_expires_at`

**Errors:**

- `401` invalid/expired token

### POST `/api/v1/auth/session/refresh`

**Header:** `Authorization: Bearer <refresh_token>`

**Action:** rotate refresh token and issue new access token.

**Success Response (200):**

- `access_token`, `access_expires_at`
- `refresh_token`, `refresh_expires_at`

**Errors:**

- `401` invalid/expired token
- `403` revoked session

### GET `/api/v1/auth/user/profile`

**Header:** `Authorization: Bearer <access_token>`

**Success Response (200):**

- `first_name`, `last_name`, `email`, optional `phone`

**Errors:**

- `401` invalid/expired token

## Implementation Steps

1. **Routes**
   - Add `/api/v1/auth/session/validate`, `/api/v1/auth/session/refresh`, `/api/v1/auth/user/profile`.

2. **Controller**
   - Add `session_validate`, `session_refresh`, and `profile` to `Api::V1::AuthController`.
   - Reuse the existing error response helper for consistent JSON.

3. **Token Validation**
   - Access token lookup by `access_token_digest`.
   - Refresh token lookup by `refresh_token_digest`.
   - Reject revoked or expired sessions.

4. **Refresh Rotation**
   - Revoke current session, create new `api_sessions` record with fresh tokens.
   - Preserve `device_id`/`device_name` on rotation.

5. **Profile**
   - Use access token session to resolve user and return basic profile.

6. **Tests**
   - Validate session (valid/invalid/expired).
   - Refresh (valid/expired/revoked).
   - Profile success and invalid token.

## Data/Schema Requirements

- Reuse Phase 4 `api_sessions` table.
- Ensure indexes exist on `access_token_digest`, `refresh_token_digest`, and `refresh_expires_at`.

## File Change Checklist

- `config/routes.rb`
- `app/controllers/api/v1/auth_controller.rb`
- `app/models/api_session.rb` (refresh + revoke helpers)
- `test/controllers/api/v1/auth_controller_test.rb` (new tests)

## Postman Test Checklist

- **Validate session (valid)**  
  - GET `/api/v1/auth/session/validate` with valid access token.  
  - Expect `valid: true` and profile.

- **Validate session (invalid/expired)**  
  - Use invalid or expired access token.  
  - Expect 401.

- **Refresh session (valid)**  
  - POST `/api/v1/auth/session/refresh` with valid refresh token.  
  - Expect new access + refresh tokens.

- **Refresh session (invalid/expired)**  
  - Expect 401.

- **Profile (valid)**  
  - GET `/api/v1/auth/user/profile` with valid access token.  
  - Expect user profile.

- **Profile (invalid/expired)**  
  - Expect 401.
