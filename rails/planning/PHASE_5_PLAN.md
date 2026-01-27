# Kindling API — Phase 5 Plan (Login & Logout)

This document details Phase 5 implementation for API login/logout, aligned with the Phase 4 decisions and current code:

- Opaque access + refresh tokens validated via `api_sessions` in the DB (no JWT).
- Separate `api_sessions` table (do not mix with web cookie sessions).
- Single-device MVP (revoke other refresh tokens on login).
- Access token: 30 minutes; refresh token: 90 days; rotate on refresh.
- Error format: `{ error, code, status, request_id }`.
- Email normalization: **strip + downcase only** (no alias/dot normalization).

## Goal

Enable existing users to authenticate, receive tokens, and terminate the current session.

## Endpoints

### POST `/api/v1/auth/login`

**Input:** `email`, `password`, `device_id`, optional `device_name`

**Validations:**

- Email format (must include domain + dot)
- Password present
- `device_id` present
- Account status and lockout rules

**Success Response (200):**

- `access_token`, `access_expires_at`
- `refresh_token`, `refresh_expires_at`
- `user` (basic profile)

**Errors:**

- `401` invalid credentials
- `403` locked/suspended (include `reason`)
- `422` validation errors

### POST `/api/v1/auth/logout`

**Header:** `Authorization: Bearer <access_token>`

**Action:** revoke current refresh token + session

**Success Response (200):**

- `{ success: true }`

**Errors:**

- `401` invalid/expired token

## Account State & Lockout Policy (Apply in Phase 5)

- `401` = invalid credentials or invalid/expired token.
- `403` = locked/suspended account.
- After **3 failures**: set `locked_until = now + 1 hour` → `locked_temporarily`.
- After **6 total failures**: set `status = locked` → `locked_support_required`.
- On successful login: reset `failed_login_count` and clear `locked_until`.

## Implementation Steps

1. **Routes**
   - Add `/api/v1/auth/login` and `/api/v1/auth/logout`.

2. **Controller**
   - Add `login` and `logout` to `Api::V1::AuthController`.
   - Keep lockout logic **in the controller** for MVP.
   - Reuse the existing error response helper for consistent JSON.

3. **Authentication Logic**
   - Normalize email (strip + downcase).
   - Lookup user by email.
   - Enforce lockout rules before password check.
   - Use `User.authenticate_by` for password verification.
   - On success, revoke other `api_sessions` (single-device MVP).
   - Issue new access + refresh tokens via `ApiSession.issue_for`.

4. **Token Validation (Logout)**
   - Find session by `access_token_digest`.
   - Reject revoked or expired sessions.
   - Revoke current session and return `{ success: true }`.

5. **Tests**
   - Successful login returns tokens.
   - Invalid password returns 401.
   - Locked account returns 403 with correct reason.
   - Logout revokes token; subsequent use returns 401.

## Data/Schema Requirements

- Reuse Phase 4 `api_sessions` table.
- Ensure indexes exist on `access_token_digest`, `refresh_token_digest`, and `refresh_expires_at`.

## File Change Checklist

- `config/routes.rb`
- `app/controllers/api/v1/auth_controller.rb`
- `app/models/api_session.rb` (token lookup helper)
- `test/controllers/api/v1/auth_controller_test.rb` (new tests)

## Postman Test Checklist

- **Login success**
  - POST `/api/v1/auth/login` with valid credentials + device_id.
  - Expect 200 + access/refresh tokens.

- **Login invalid password**
  - Expect 401 with `code=invalid_credentials`.

- **Login locked (3 fails)**
  - Fail login 3 times; expect 403 with `locked_temporarily`.

- **Login locked (6 fails)**
  - Fail 6 total times; expect 403 with `locked_support_required`.

- **Logout success**
  - POST `/api/v1/auth/logout` with valid access token.
  - Expect `{ success: true }`.

- **Logout with invalid/expired token**
  - Expect 401 with `code=invalid_token`.
