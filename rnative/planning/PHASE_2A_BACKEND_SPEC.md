# Phase 2a Backend Specification

## Overview

This document specifies the backend changes required to support attribution tracking.
The native app is ready to send this data - backend implementation is pending.

## Endpoint: POST /api/v1/auth/register

### Request Schema Addition

Add optional `attribution` object to registration request:

```json
{
  "email": "user@example.com",
  "password": "...",
  "first_name": "...",
  "last_name": "...",
  "attribution": {
    "source": "facebook",
    "campaign": "summer_2024",
    "location_id": "attorney_office_123",
    "is_organic": false
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | string | No | Traffic source (e.g., "facebook", "google", "qr_attorney") |
| campaign | string | No | Campaign identifier |
| location_id | string | No | Physical location ID (e.g., attorney office) |
| is_organic | boolean | Yes | True if user installed organically (no attribution params) |

## Database Changes

```sql
ALTER TABLE users ADD COLUMN attribution_source VARCHAR(100);
ALTER TABLE users ADD COLUMN attribution_campaign VARCHAR(100);
ALTER TABLE users ADD COLUMN attribution_location_id VARCHAR(100);
ALTER TABLE users ADD COLUMN attribution_is_organic BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN attribution_captured_at TIMESTAMP;

-- Index for attribution queries
CREATE INDEX idx_users_attribution_source ON users(attribution_source);
```

## Implementation Notes

1. All attribution fields are optional except `is_organic`
2. Store `captured_at` as the timestamp when the user registered (server-side)
3. The index on `attribution_source` enables queries like "how many users from Facebook?"
4. Do NOT overwrite attribution if user re-registers (preserve first-touch)

## Wiring Up

When backend is ready:
1. Update `POST /api/v1/auth/register` to accept and store attribution
2. Remove the console.log placeholder in `useAuth.ts`
3. Test end-to-end attribution flow
