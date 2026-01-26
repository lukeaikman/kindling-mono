# Kindling API — Current State (Implementation Detail)

This document summarizes what is implemented in the Rails API app today and can be used to scope next phases.

## Overview
- Rails 8.1 API/back-office app with session-based authentication and a minimal admin UI.
- Motor Admin is mounted for database inspection.
- API namespace exists but has no endpoints yet.

## Routes & Entry Points
- Admin UI and auth routes live at HTML endpoints:
  - `/session` (new/create/destroy)
  - `/passwords` (password reset flow)
  - `/admin` (dashboard, about, settings)
  - `/motor_admin` (Motor Admin UI)
  - `/up` (health check)
- API namespace exists at `/api/v1` with no controllers wired yet.

## Authentication & Session Management
- Session-based auth via `Authentication` concern.
- `before_action :require_authentication` enforced in `ApplicationController`.
- `Session` model stores `user_id`, `ip_address`, `user_agent`.
- Cookie: signed, permanent `session_id` cookie with `httponly` + `same_site: :lax`.
- Rate limiting on login/password reset:
  - SessionsController#create: 10 attempts / 3 minutes
  - PasswordsController#create: 10 attempts / 3 minutes

## Password Reset Flow
- Email-driven reset with expiring token.
- Password reset:
  - `PasswordsController#create` enqueues mail if user exists (no user enumeration).
  - `PasswordsController#edit` validates token.
  - `PasswordsController#update` updates password and clears sessions.
- Mailer: `PasswordsMailer#reset` with HTML + text templates.

## Admin UI
- Bootstrap-based layout and navigation.
- Pages:
  - Dashboard: basic “welcome + quick stats”.
  - Settings: profile update + optional password change.
  - About: stack and feature list.
- Nav: Dashboard, DB Viewer (Motor Admin), About, user dropdown (Settings, Log out).

## Motor Admin
- Mounted at `/motor_admin`.
- Motor tables installed via `InstallMotorAdmin` migration.
- Motor Admin config relies on normal app authentication (no separate auth).

## Data Model (Current)
- `users`
  - `email_address` (unique)
  - `password_digest` (bcrypt)
  - `first_name`, `last_name`
- `sessions`
  - `user_id`, `ip_address`, `user_agent`
- Motor Admin tables (`motor_*`) from `InstallMotorAdmin`.

## Seed Data
- Development seed creates/updates an admin user:
  - `admin@kindling.local / password123`.

## API Base (Scaffold Only)
- `Api::BaseController` exists and includes `Authentication`.
- No API controllers or serializers implemented yet.

## UI Assets
- Bootstrap + Popper pinned via Importmap.
- `application.bootstrap.scss` imports Bootstrap and adds light custom styles.

## Configuration & Security
- CORS allows local dev origins: Vite (5173), Expo (8081), and localhost/127.0.0.1 variants.
- Parameter filtering includes `passw`, `email`, `secret`, `token`, etc.
- CSRF protection enabled for HTML/admin UI.

## Test Coverage (Existing)
- Sessions controller tests (login/logout).
- Password reset controller tests.
- User model test for email normalization.
- Session test helper to sign in during integration tests.

## Gaps / Not Implemented Yet
- No domain models for estate planning (Person, Will, Assets, Trusts, etc.).
- No API endpoints or JSON serializers.
- No authorization beyond session auth.
- No background job configuration beyond Rails defaults.

## Suggested Next Phase Scoping Inputs
- Finalize the core data model (from web-prototype or native-app planning).
- Define API surface area and auth strategy (session vs token for clients).
- Add JSON serializers and API controller patterns.
- Expand tests to cover new models, validations, and API endpoints.
