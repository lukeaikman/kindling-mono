# Kindling Invitation System Plan (Executor + Guardian)

## 0) Prompt Scrutiny and Clarifying Questions

### 0.1 Are the instructions sensible?

Yes. The requested scope is sensible and buildable in phased delivery:

- Phase 1 can ship invitation creation + email delivery with low risk.
- Phase 2 can ship acceptance/rejection magic-link flow and account bootstrap.
- Phase 3 can add robust email engagement telemetry (opens/delivery/events).
- Phase 4 can add person identity mapping for native sync without forcing full will-domain migration.

What should be done more/less:

- **Do more:** explicitly define ownership boundary between "invite owner" (will-maker account) and "invitee account" (executor/guardian), including auth rules.
- **Do less:** avoid introducing full wills/beneficiaries domain in this batch; use a minimal person mapping model first.
- **Keep simple:** use one invitation model + one invitation events model, not per-role invitation tables.

### 0.2 Clarifying questions — resolved

| # | Question | Answer | Impact on plan |
|---|----------|--------|----------------|
| 1 | **Production domain for emails/links** | `kindlingmoney.com` | All `default_url_options`, email `From` address, deep link hosts updated to use `kindlingmoney.com`. |
| 2 | **Web confirmation page technology** | Rails view (confirmed) | Acceptance/confirmation pages will be server-rendered Rails views using the existing Bootstrap 5.3 setup. No separate SPA needed. |
| 3 | **`password_digest` nullable for invited users** | Option A: make nullable (confirmed after discussion) | Migration to `change_column_null :users, :password_digest, true`. Invited users created without password. Login returns nil for nil-digest users (safe). Conditional validation added: password required on normal registration, not on invite acceptance. `has_password?` helper added to User model. |
| 4 | **Guardian acceptance deep links** | Do not exist yet — confirmed stub approach (same as executors) | Both `app/executor-accepted.tsx` and `app/guardian-accepted.tsx` will be stub screens in the native app. Deep link handler (`app/open.tsx`) extended to route `action=executor_accepted` and `action=guardian_accepted`. |
| 5 | **Keep local `invitedAt` alongside server invitation** | Yes — keep both as complementary signals | Native app local `invitedAt` = "user intended to invite at this time". Server `invitation.created_at` = "API processed the request". Server `invitation_events[email_sent]` = "Postmark accepted the email". Mismatch between local flag and server record = bug signal for debugging/support. Both are retained; they are not redundant. |
| 6 | **Invitation scoped per-will** | Yes — acceptance is per-will, not per-person | Single active invitation per `(inviter_user_id, client_will_id, invitee_email, role)` tuple. The same person can be invited as executor on multiple people's wills (separate invitations). Re-invitable after expiry or rejection. Native app data structure needs migration: move `executorStatus`/`invitedAt`/`respondedAt` from `Person` to `WillData.executors` entries (and same for guardians). |
| 7 | **Postmark message stream** | Use default transactional stream (confirmed after explanation) | No `MessageStream` parameter needed in API calls — defaults to `outbound` (Postmark's default transactional stream). Named streams only needed if we add marketing/broadcast emails later (out of scope). |
| 8 | **Decline link in email** | Yes, include it | Email will contain both an "Accept" CTA and a "Decline" secondary link. Decline lands on a brief confirmation page ("Are you sure?") before finalising rejection. |

### 0.3 Additional resolved design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rejection UX | One-click decline link in email → brief confirmation page → finalised | Prevents accidental rejection from email preview panes / link scanners. |
| Invite expiry | 14 days (default) | Sufficient time for recipient to act; short enough to stay relevant. Configurable per-invitation if needed later. |
| Re-invite policy | Sending a new invitation auto-expires/cancels any prior pending invitation for the same `(will, invitee, role)` tuple | Prevents confusion from multiple active links. |
| Invitation scoped per-will | `client_will_id` required on every invitation | A person can be executor on multiple wills. Acceptance on Will A is independent of acceptance on Will B. |
| Contact source of truth | Invitation always targets the explicit `invitee_email` provided at send time | If the invitee later has an account with a different email, account linking uses `invitee_email` from the invitation — not any pre-existing account email. |
| Postmark webhook verification | Yes, from day 1 | `X-Postmark-Webhook-Token` header verified with `secure_compare`. |
| Account bootstrap | Password set on web confirmation page (forced before deep link redirect) | Clean UX: user has a complete account before entering the app. Avoids partial-account states in the native app. |

---

## 1) Current State Findings (What Exists Today)

## A. Rails API: implemented today

### Auth/session foundation exists

- API auth endpoints in `config/routes.rb`:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/register/validate-email`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/session/validate`
  - `POST /api/v1/auth/session/refresh`
  - `GET /api/v1/auth/user/profile`
- Controller: `app/controllers/api/v1/auth_controller.rb`
- Token session model: `app/models/api_session.rb`
  - opaque tokens
  - SHA-256 digests in DB
  - access expiry (30m), refresh expiry (90d), revoke + rotate behavior
- User model: `app/models/user.rb`
  - `has_secure_password`
  - email normalization + validation
  - account status/lockout fields
- DB schema currently includes:
  - `users`
  - `sessions` (HTML admin session cookie auth)
  - `api_sessions` (token auth)
  - no `people`, `wills`, `invitations`, `roles`, or invitation events

### Existing token/magic-link precedent

- Password reset uses Rails secure token helpers via `has_secure_password` token support:
  - `PasswordsController#set_user_by_token` uses `User.find_by_password_reset_token!`
  - mail templates generate URL with `edit_password_url(@user.password_reset_token)`
- This provides a working reference pattern for one-time signed token links.

### Email currently

- Mailers exist:
  - `app/mailers/application_mailer.rb` (`default from: "from@example.com"`)
  - `app/mailers/passwords_mailer.rb`
- Password reset sends with `deliver_later` in `app/controllers/passwords_controller.rb`
- Environment config:
  - `development.rb`: default url options host localhost:3010; no mail delivery method override
  - `test.rb`: `config.action_mailer.delivery_method = :test`
  - `production.rb`: default url host `example.com` (needs updating to `kindlingmoney.com`); SMTP snippet commented, no concrete provider config
  - `staging.rb`: **does not exist yet** — needs creating
- No Postmark integration yet.
- No Letter Opener Web integration yet.

### Background jobs

- Active Job is used (`deliver_later` already in password reset).
- `solid_queue` gem present in `Gemfile`; Puma has optional `plugin :solid_queue`.
- Production `database.yml` defines separate `queue` database.
- There are no app-specific queue jobs yet beyond mail enqueue behavior.

### Environment/config patterns

- Uses `.env` style in docs and `dotenv-rails` gem in dev/test group.
- Uses `config/environments/*.rb` for runtime behavior.
- `credentials.yml.enc` exists but no visible provider-specific mail settings wired.
- Parameter filtering already includes sensitive keys (`token`, etc.) in `config/initializers/filter_parameter_logging.rb`.

### Important gaps

- No invitation model, no event model, no webhook endpoint, no role mapping model.
- No estate domain models (people/wills/guardianship) in API yet.
- No deep-link redirect endpoint in API yet.

## B. Native app findings relevant to API design

- `Person` model already includes:
  - `id` (client UUID)
  - `serverId?`
  - executor and guardian invitation/acceptance fields (`invitedAt`, `executorStatus`, `guardianDetails`)
  - file: `native-app/src/types/index.ts`
- `WillData` model (`native-app/src/types/index.ts:264`):
  - `id: string` — unique will ID (supports versioning)
  - `userId: string` — Person ID of the will-maker
  - `version: number` — version number (1, 2, 3...)
  - `status: 'draft' | 'active' | 'superseded'`
  - `executors: Array<{executor: string, level: number}>` — Person IDs linked to the will
  - `guardianship: {[childId]: Array<{guardian: string, level: number}>}` — guardians per child linked to the will
- `useAppState`:
  - local ID generation in `addPerson` (UUID fallback)
  - stores namespaced local data per will-maker scope (`kindling:<scopeId>:...`)
  - helpers to find/load scope by server identity
  - file: `native-app/src/hooks/useAppState.ts`
- `useAuth`:
  - after login/register, syncs server user id into local will-maker person `serverId`
  - file: `native-app/src/hooks/useAuth.ts`
- Current invitation send actions are local state only:
  - `sendExecutorInvitations`, `sendGuardianInvitations` update local flags (`invitedAt`, `executorStatus`)
  - no backend email send yet
  - file: `native-app/src/hooks/useAppState.ts`
- **Decision: keep local `invitedAt` alongside server invitation records.** Local flag = "user intended to invite". Server record = "API processed and sent". Mismatch = bug signal for support/debugging.

### ⚠️ Native app data structure issue: invitation status is in the wrong place

**Problem identified:** Invitation/acceptance status currently lives on the `Person` entity, not on the will-executor or will-guardian relationship. This is incorrect because **acceptance is per-will, not per-person**.

**Current (incorrect) structure:**

```
Person {
  executorStatus?: 'pending' | 'accepted' | 'declined'   ← per-person, not per-will
  invitedAt?: Date                                        ← per-person, not per-will
  respondedAt?: Date                                      ← per-person, not per-will
  guardianDetails?: {
    hasAccepted?: boolean                                 ← per-person, not per-will
    invitedAt?: Date
    respondedAt?: Date
  }
}

WillData.executors: Array<{
  executor: string      // Person ID
  level: number
                        // ← NO invitation status here
}>
```

**Why this is wrong:**
- A person can be executor on **multiple** people's wills (e.g., Sarah is executor for both Will-maker A and Will-maker B)
- The same person can be guardian on one will and executor on another
- Will versioning means a new will version might re-invite the same person
- With one `executorStatus` on Person, there's no way to represent "accepted on Will A, pending on Will B"

**What the structure should be:**

```
Person {
  // REMOVE: executorStatus, invitedAt, respondedAt
  // REMOVE: guardianDetails.hasAccepted, guardianDetails.invitedAt, guardianDetails.respondedAt
  // These are will-specific, not person-identity fields
}

WillData.executors: Array<{
  executor: string                                           // Person ID
  level: number
  invitationStatus?: 'not_invited' | 'invited' | 'accepted' | 'declined'   // ← ADD: per-will
  invitedAt?: Date                                           // ← ADD: per-will
  respondedAt?: Date                                         // ← ADD: per-will
}>

WillData.guardianship[childId]: Array<{
  guardian: string                                           // Person ID
  level: number
  invitationStatus?: 'not_invited' | 'invited' | 'accepted' | 'declined'   // ← ADD: per-will
  invitedAt?: Date                                           // ← ADD: per-will
  respondedAt?: Date                                         // ← ADD: per-will
}>
```

**Impact:** This is a native app data migration task that should be coordinated with the API invitation work. The API should be designed for the correct (per-will) model from day 1. The native app can migrate its data structure as part of the invitation integration work (moving status fields from Person to WillData entries, with a migration layer for backward compatibility).

### Deep link status

- Deep link handling exists for attribution/onboarding via `app/open.tsx`.
- **No executor or guardian acceptance deep links exist** in native app routes — confirmed.
- Both will be added as stub screens: `app/executor-accepted.tsx` and `app/guardian-accepted.tsx`.
- Deep link format: `kindling://open?action=[role]_accepted&will_maker=[name]&invitation_id=[id]`
- `app/open.tsx` will be extended to route these new `action` params (same approach as current attribution params).

---

## 2) Proposed Architecture

## A. Domain model approach

Use a **single `invitations` table** for all inviteable roles and a separate **`invitation_events` table** for audit/analytics.

Benefits:

- Supports executor + guardian now, extensible to beneficiary/witness/partner later.
- Keeps querying and reporting simple.
- Avoids schema churn from separate invitation models.

### `invitations` (core lifecycle row)

Recommended fields:

- `id` (bigint, internal only — never exposed in API responses or URLs)
- `public_id` (uuid, the external-facing identifier used in all API responses, webhook payloads, and native app references; generated via `SecureRandom.uuid` on creation)
- `inviter_user_id` (FK users, who sent — the will-maker)
- `client_will_id` (string, nullable — the native app's `WillData.id`, identifies which will version this invitation is for)
- `role` (enum string: `executor`, `guardian`, future roles)
- `status` (enum string: `pending`, `accepted`, `rejected`, `expired`, `revoked`)
- `invitee_email` (normalized lowercased)
- `invitee_first_name` (nullable)
- `invitee_last_name` (nullable)
- `invitee_phone` (nullable)
- `person_id` (nullable FK to server `people` table once available; initially nullable)
- `local_person_id` (nullable string from native UUID for mapping bridge)
- `accepted_user_id` (nullable FK to users — the account created/found on acceptance)
- `token_digest` (string, nullable after consumption)
- `token_expires_at` (datetime)
- `accepted_at` (datetime)
- `rejected_at` (datetime)
- `expired_at` (datetime)
- `sent_at` (datetime; internal definition below)
- `email_message_id` (string, Postmark message id for webhook tracking)
- `metadata` (jsonb; template version, locale, source, executor level, guardian child context, etc.)

Note: no `email_provider` field. We use Postmark exclusively for transactional email. If we ever switch providers, a migration is simpler than carrying a polymorphic provider column from day 1.
- timestamps

**Key design point — `inviter_user_id` IS the will-maker:**

There is no separate `will_owner_user_id` field. In this system the inviter is always the will-maker who owns the will. If we ever support delegated sending (e.g., a solicitor sending on behalf of a will-maker), we would add a `on_behalf_of_user_id` field at that point. For now, one field serves both purposes and avoids redundancy.

**Key design point — invitation is per-will, not per-person:**

An invitation is scoped to a **specific will** (identified by `inviter_user_id` + `client_will_id`). The same person can:
- Be invited as executor on Will-maker A's will AND Will-maker B's will (different `inviter_user_id`)
- Be re-invited on a new will version (different `client_will_id`)
- Be invited as executor AND guardian on the same will (different `role`)

Each of these is a **separate invitation record** with its own status lifecycle.

Indexes:

- unique index on `public_id`
- unique index on `token_digest` (where not null)
- index on `inviter_user_id`
- index on `client_will_id`
- index on `role`
- index on `status`
- index on `invitee_email`
- index on `email_message_id`
- index on `accepted_user_id`
- **Uniqueness constraint for active invitations:**
  - partial unique on `(inviter_user_id, client_will_id, invitee_email, role)` WHERE `status = 'pending'`
  - This prevents duplicate pending invitations for the same person on the same will, while allowing re-invites after expiry/rejection/cancellation

### `invitation_events` (append-only event log)

Recommended fields:

- `id`
- `invitation_id` (FK)
- `event_type` enum/string:
  - `invitation_created`
  - `email_queued`
  - `email_sent`
  - `email_delivered` (optional)
  - `email_opened`
  - `invitation_accepted`
  - `invitation_rejected`
  - `invitation_expired`
- `occurred_at`
- `source` (`system`, `postmark_webhook`, `user_action`, `job`)
- `idempotency_key` (nullable, unique when present)
- `payload` (jsonb raw details)
- timestamps

Indexes:

- `invitation_id, occurred_at`
- `event_type, occurred_at`
- unique on `idempotency_key` where not null

### Token storage rule

- Store only **raw token at generation time in memory** for composing URL.
- Persist only **`token_digest`** (SHA-256 or HMAC digest).
- Never log token in plaintext.
- Invalidate token on accept/reject/revoke/expiry.

### Invitation model sketch

```ruby
class Invitation < ApplicationRecord
  belongs_to :inviter_user, class_name: "User"
  belongs_to :accepted_user, class_name: "User", optional: true
  has_many   :invitation_events, dependent: :destroy

  enum :status, {
    pending:   "pending",
    accepted:  "accepted",
    rejected:  "rejected",
    expired:   "expired",
    revoked:   "revoked"
  }, default: :pending

  enum :role, { executor: "executor", guardian: "guardian" }

  validates :role, :invitee_email, :invitee_first_name, presence: true
  validates :client_will_id, presence: true
  validates :token_digest, uniqueness: true, allow_nil: true
  validates :public_id, presence: true, uniqueness: true

  normalizes :invitee_email, with: ->(e) { e.strip.downcase }

  before_validation :set_public_id, on: :create

  scope :active, -> { where(status: :pending).where("token_expires_at > ?", Time.current) }

  def expired?
    token_expires_at <= Time.current
  end

  def acceptable?
    pending? && !expired?
  end

  def has_password?
    accepted_user&.password_digest.present?
  end

  # --- Token helpers (mirror ApiSession pattern) ---

  def self.generate_token
    SecureRandom.hex(32)
  end

  def self.digest(token)
    OpenSSL::Digest::SHA256.hexdigest(token)
  end

  def self.find_by_token(token)
    return nil if token.blank?
    find_by(token_digest: digest(token))
  end

  def record_event!(event_type, source: "system", metadata: {}, occurred_at: Time.current)
    invitation_events.create!(
      event_type: event_type,
      source: source,
      payload: metadata,
      occurred_at: occurred_at
    )
  end

  private

  def set_public_id
    self.public_id ||= SecureRandom.uuid
  end
end
```

```ruby
class InvitationEvent < ApplicationRecord
  belongs_to :invitation

  validates :event_type, :occurred_at, :source, presence: true
end
```

## B. Email delivery architecture

### Provider strategy

- **Staging/production:** Postmark API delivery via Action Mailer integration (`kindlingmoney.com` domain).
- **Development:** Letter Opener Web (local inbox UI, no real delivery).
- **Test:** keep Rails `:test` delivery adapter.
- **Message stream:** Default transactional stream (`outbound`). No named stream configuration needed.
- **From address:** `Kindling <hello@kindlingmoney.com>` (update `ApplicationMailer` default).

### Mailer components

- `InvitationMailer` with templates:
  - `executor_invite`
  - `guardian_invite`
  - (future: beneficiary/witness etc)
- Use role-specific copy but shared layout and shared CTA blocks.
- Include **both accept and decline links** and expiry messaging.
- Subject line: `"[Will-maker first name] has asked you to be their [role]"`

### Async dispatch

- `InvitationDeliveryJob` (Active Job) responsible for:
  - sending mail
  - recording `email_queued` and `email_sent` events
  - writing provider message id back to `invitations.email_message_id`

## C. Tracking semantics

### "Sent" definition

Use three distinct states/events:

1. **Queued** = app enqueued job (`email_queued`)
2. **Sent (provider accepted)** = Postmark API accepted request and returned message id (`email_sent`, set `sent_at`)
3. **Delivered** = optional webhook (`email_delivered`)

System-of-record recommendation:

- `invitations.sent_at` means provider accepted (not merely queued).
- Full timeline stays in `invitation_events`.

### "Opened" tracking

- Enable Postmark open tracking on invitation emails.
- Receive open webhook in Rails endpoint.
- Verify webhook signature.
- Map `MessageID` to invitation by `email_message_id`.
- Write `email_opened` event idempotently.

### Webhook idempotency

- Postmark may retry webhook delivery.
- Use deterministic idempotency key per webhook event:
  - example: `"postmark:#{MessageID}:#{RecordType}:#{ReceivedAt}"`.
- Ignore duplicates if already processed.

## D. Acceptance/rejection flow

### Magic link acceptance

Endpoint:

- `GET /invitations/:token/accept`

Flow:

1. Digest token, lookup pending invitation with unexpired token.
2. If invalid/expired/consumed → show safe failure page (Rails HTML view).
3. Mark invitation accepted (`status=accepted`, `accepted_at=now`, clear token digest).
4. Emit `invitation_accepted` event.
5. Find or create invitee `User` by `invitee_email` (new users get `password_digest: nil`).
6. Create role assignment linking invitee user to invitation context.
7. **If user already has a password** (existing account) → redirect directly to native deep link.
8. **If user is new (no password)** → render web confirmation page (Rails view, Bootstrap 5.3):
   - Set password + confirmation (12-char complexity rules).
   - Confirm/edit first name, last name, phone.
9. On form submit (`POST /invitations/:token/confirm`) → set password, then redirect to native deep link:
   - `kindling://open?action=executor_accepted&will_maker=[name]&invitation_id=[id]`
   - `kindling://open?action=guardian_accepted&will_maker=[name]&invitation_id=[id]`

### Rejection

Endpoint:

- `GET /invitations/:token/decline`

Flow:

1. Digest token, lookup pending invitation.
2. If invalid/expired/consumed → show safe failure page.
3. Show brief confirmation page: "Are you sure you want to decline?"
4. On confirmation (POST): set `status=rejected`, `rejected_at=now`, token invalidated.
5. Emit `invitation_rejected` event.
6. Show "Thanks for letting us know" page with optional "Changed your mind? Contact [will-maker name]" message.

### Role mapping after acceptance

Introduce a minimal role-assignment table scoped per-will:

- `invitation_role_assignments`
  - `invitation_id`
  - `user_id` (invitee — the person who accepted)
  - `role` (`executor`/`guardian`)
  - `inviter_user_id` (will-maker who sent the invitation)
  - `client_will_id` (which will this role is for — from native app's `WillData.id`)
  - `person_id` nullable (server-side person, Phase 4)
  - `local_person_id` nullable (native app person UUID)
  - `metadata` (jsonb — executor level, guardian child context, etc.)
  - timestamps

Unique constraint: `(user_id, inviter_user_id, client_will_id, role)` — one role assignment per user per will.

This avoids overbuilding full domain authorization model now, while correctly modelling that acceptance is per-will.

## E. Minimal person/will mapping support

Because API currently has no `people` or `wills`, add a **small bridge model** first.

### Option recommended (minimal churn)

Create `people` table only as identity bridge:

- `id`
- `owner_user_id` (will-maker user who owns this person record)
- `local_person_id` (string UUID from native)
- `invitee_user_id` (nullable; set once invitee has account)
- `first_name`, `last_name`, `email`, `phone` (nullable snapshots)
- `relationship` (nullable)
- timestamps

Unique constraint:

- `(owner_user_id, local_person_id)` unique

This allows:

- server mapping for invite target without full will schema
- later expansion into full people domain

### Native mapping endpoint shape

`POST /api/v1/people/sync-mappings` (auth required as will-maker):

- request:
  - `mappings: [{ local_person_id, server_person_id?, role?, email?, first_name?, last_name? }]`
- behavior:
  - upsert by `(owner_user_id, local_person_id)`
  - returns canonical `server_person_id` per local id

Invitation-specific helper endpoint:

- `POST /api/v1/invitations/:id/link-person`
  - links invitation to person record after account creation if needed

---

## 3) Concrete Implementation Steps by Phase

## Phase 1: Dev mail + Postmark + invitation send endpoint + invitation model

1. Add gems:
   - `postmark-rails` (all environments)
   - `letter_opener_web` (development group only)
2. Configure `config/environments/development.rb`:
   - `config.action_mailer.delivery_method = :letter_opener_web`
   - `config.action_mailer.default_url_options = { host: "localhost", port: 3000 }`
   - `config.action_mailer.perform_deliveries = true`
   - Mount Letter Opener Web route: `mount LetterOpenerWeb::Engine, at: "/letter_opener"` (dev only)
3. Create `config/environments/staging.rb` (does not exist yet):
   - Base on production config
   - `config.action_mailer.delivery_method = :postmark`
   - `config.action_mailer.postmark_settings = { api_token: Rails.application.credentials.dig(:postmark, :api_token) }`
   - `config.action_mailer.default_url_options = { host: "staging.kindlingmoney.com", protocol: "https" }`
4. Configure `config/environments/production.rb`:
   - `config.action_mailer.delivery_method = :postmark`
   - `config.action_mailer.postmark_settings = { api_token: Rails.application.credentials.dig(:postmark, :api_token) }`
   - `config.action_mailer.default_url_options = { host: "kindlingmoney.com", protocol: "https" }`
5. Update `ApplicationMailer` default from: `"Kindling <hello@kindlingmoney.com>"`
6. Add Rails credentials (staging + production):
   - `postmark.api_token` — Postmark server API token
   - `postmark.webhook_token` — shared secret for webhook verification (Phase 3)
7. Add `invitations` + `invitation_events` migrations.
8. Add models: `Invitation`, `InvitationEvent`.
9. Add `InvitationMailer` with `executor_invite` and `guardian_invite` templates.
   - Both accept and decline links in every email.
   - HTML + plain text variants.
10. Add `InvitationDeliveryJob` (Active Job on Solid Queue).
11. Add `Invitations::CreateService` — validates, generates token, persists digest, enqueues job.
12. Add authenticated API endpoint: `POST /api/v1/invitations`
    - Validate payload and role.
    - Require `client_will_id` (identifies which will the invitation is for).
    - Prevent duplicate active invitations per `(inviter, client_will_id, invitee_email, role)`.
    - Cancel any prior pending invitation for same tuple on re-send.
    - Create invitation row + `invitation_created` event.
    - Enqueue mail job + `email_queued` event.
    - Return invitation summary payload (201).
13. Add `GET /api/v1/invitations` — list invitations for current will-maker.
14. Add `User` model association: `has_many :sent_invitations`.

## Phase 2: Magic link accept + user creation + role linking + deep link redirect

1. **Migration: make `password_digest` nullable on users.**
   - `change_column_null :users, :password_digest, true`
   - Allows invited users to exist without a password until they set one on the confirmation page.
   - Add conditional validation to `User` model: `validates :password, presence: true, on: :create, unless: :invited?`
   - Add `has_password?` helper: `password_digest.present?`
   - Login flow already safe: `authenticate_by` returns nil for nil-digest users.
2. Add public acceptance/rejection routes (served as HTML, not under `/api/v1/`):
   - `GET /invitations/:token/accept`
   - `GET /invitations/:token/decline`
   - `POST /invitations/:token/confirm` (password + details form submit)
3. Add `InvitationAcceptancesController` (web controller, not API).
4. Add `Invitations::AcceptService`:
   - Digest token, find pending invitation, check expiry.
   - Find or create User by `invitee_email` (new users created with `password_digest: nil`).
   - Mark invitation accepted, link to user, record `invitation_accepted` event.
   - If user already has a password → redirect straight to deep link.
   - If user is new (no password) → render confirmation page.
5. Add `Invitations::DeclineService`:
   - Decline link lands on brief confirmation page ("Are you sure?").
   - On confirm: mark invitation rejected, record `invitation_rejected` event.
   - Show "Thanks for letting us know" page.
6. Add confirmation page (Rails view, Bootstrap 5.3):
   - Set password + password confirmation (enforces existing 12-char complexity rules).
   - Confirm/edit: first name, last name, phone.
   - Submit → sets password on User, then redirects to native deep link.
7. Add deep link redirect builder:
   - `kindling://open?action=executor_accepted&will_maker=[name]&invitation_id=[id]`
   - `kindling://open?action=guardian_accepted&will_maker=[name]&invitation_id=[id]`
   - Fallback: if app not installed, show "Download the app" page with store links (can be a future enhancement).
8. Add `invitation_role_assignments` model (minimal role-mapping table).
9. **Native app stubs (separate work item):**
   - Add `app/executor-accepted.tsx` and `app/guardian-accepted.tsx` stub screens.
   - Extend `app/open.tsx` to route `action=executor_accepted` and `action=guardian_accepted`.
   - Same approach for both roles.

## Phase 3: Open tracking webhook + event logging + idempotency

1. Add webhook endpoint: `POST /webhooks/postmark` (not under `/api/v1/` — it's a server-to-server webhook).
2. Add `Webhooks::PostmarkController`:
   - `skip_before_action :require_authentication`
   - `skip_before_action :verify_authenticity_token`
   - Verify `X-Postmark-Webhook-Token` header with `secure_compare`.
3. Parse message events (`Open`, `Delivery`, `Bounce`).
4. Map `MessageID` to `invitations.email_message_id`.
5. Write idempotent `invitation_events` records (idempotency key: `"postmark:#{MessageID}:#{RecordType}:#{ReceivedAt}"`).
6. Add `ExpireInvitationsJob` (scheduled hourly via Solid Queue `config/recurring.yml`):
   - Finds pending invitations past `expires_at`, marks `status: :expired`, records event.
7. Configure Postmark server webhooks to point to `kindlingmoney.com` endpoints.
8. Enable Postmark open tracking on invitation message stream.

## Phase 4: Native app person mapping support

1. Add minimal `people` model (identity bridge only).
2. Add endpoint(s) for local-to-server mapping upsert.
3. Extend invitation creation endpoint to accept and persist `local_person_id`.
4. On acceptance/account creation, link invitee user to mapped person row.
5. Return mapping data in invitation APIs so native can set `Person.serverId` consistently.
6. Keep existing native local behavior intact during rollout; additive sync only.

---

## 4) Migration List

| # | Migration | Phase | Description |
|---|-----------|-------|-------------|
| 1 | `CreateInvitations` | 1 | Core invitation table with all fields, indexes on `token_digest`, `invitee_email`, `status`, `email_message_id` |
| 2 | `CreateInvitationEvents` | 1 | Append-only event log with idempotency key, indexes on `(invitation_id, occurred_at)` and unique on `idempotency_key` |
| 3 | `MakePasswordDigestNullableOnUsers` | 2 | `change_column_null :users, :password_digest, true` — allows invited users without passwords |
| 4 | `CreateInvitationRoleAssignments` | 2 | Links accepted invitation to user with role context |
| 5 | `CreatePeople` | 4 | Minimal server-side person identity bridge (`owner_user_id`, `client_uuid`, `linked_user_id`, basic fields) |
| 6 | `CreatePersonRoles` | 4 | Role assignments for people (`person_id`, `role`, `details` jsonb) |
| 7 | `AddPersonIdToInvitations` | 4 | FK from invitations to people table |

Note: existing migration files in repo contain duplicated class definitions in some files; clean this before adding new migrations to avoid maintenance confusion.

---

## 5) Endpoint Spec List (Routes, Params, Responses, Auth)

## Auth required (will-maker)

### `POST /api/v1/invitations`

- auth: Bearer access token
- body:
  - `role` (`executor` | `guardian`) — required
  - `invitee_email` — required
  - `client_will_id` — required (native app's `WillData.id`, identifies which will this invitation is for)
  - optional `invitee_first_name`, `invitee_last_name`, `invitee_phone`
  - optional `local_person_id` (native app Person UUID)
  - optional `metadata` (executor level, guardian child context, template locale, etc.)
- response 201:
  - `id` (this is the `public_id` UUID — the internal bigint `id` is **never** exposed)
  - `status`
  - `role`
  - `client_will_id`
  - `invitee_email`, `invitee_first_name`
  - `sent_at` (null until Postmark accepts)
  - `created_at`, `updated_at`
- errors:
  - 401 unauthorized
  - 422 validation
  - 409 duplicate active invite for same (will, invitee, role) tuple

### `GET /api/v1/invitations`

- auth required
- list invitations for current will-owner user with filters by role/status.

### `POST /api/v1/people/sync-mappings`

- auth required
- body:
  - array of local ids + optional person fields
- response:
  - mapping list `{ local_person_id, server_person_id }`

## Public/tokenized web endpoints (HTML, not under /api/v1/)

### `GET /invitations/:token/accept`

- auth: none (magic link token in URL)
- success:
  - marks accepted
  - creates/links user
  - if user has password → redirect to deep link (`kindling://open?action=[role]_accepted&...`)
  - if user is new → renders confirmation page (set password + confirm details)
- failure:
  - expired/invalid/consumed → renders error page

### `GET /invitations/:token/decline`

- auth: none (magic link token in URL)
- success:
  - renders "Are you sure?" confirmation page
- failure:
  - invalid/expired → renders error page

### `POST /invitations/:token/decline` (confirmation submit)

- auth: none (token in URL)
- success:
  - marks rejected, records event
  - renders "Thanks for letting us know" page
- failure:
  - already processed → renders error page

### `POST /invitations/:token/confirm`

- auth: none (token in URL, invitation must already be accepted)
- body (form data):
  - `user[password]`, `user[password_confirmation]`
  - `user[first_name]`, `user[last_name]`, `user[phone]`
- success:
  - sets password on user account
  - redirect to native deep link (`kindling://open?action=[role]_accepted&will_maker=[name]&invitation_id=[id]`)
- failure:
  - validation errors → re-renders confirmation page with errors

## Webhooks

### `POST /webhooks/postmark`

- auth: `X-Postmark-Webhook-Token` header verified with `secure_compare`
- handles event types:
  - `Open` → records `email_opened` event
  - `Delivery` → records `email_delivered` event (optional)
  - `Bounce` → records `email_bounced` event (optional future)
- maps `MessageID` → `invitations.email_message_id` to find invitation
- idempotent: duplicate events silently ignored
- response:
  - `200 OK` — always (accepted or ignored duplicate)
  - `401` — invalid/missing webhook token
- Postmark webhook URLs:
  - staging: `https://staging-api.kindlingmoney.com/webhooks/postmark`
  - production: `https://api.kindlingmoney.com/webhooks/postmark`

---

## 6) Security Checklist

| Concern | Approach | Notes |
|---------|----------|-------|
| Token storage | Only SHA256 digests in DB; raw token in email link and job args only | Follows existing `ApiSession` pattern |
| Token expiry | 14-day default; checked on every acceptance attempt | Expired invitations marked by scheduled `ExpireInvitationsJob` |
| One-time use | Status transitions to `accepted`/`rejected` consume the token | Subsequent clicks see "already processed" message |
| Rate limiting | `rate_limit` on send endpoint (e.g., 20/hour/user); rate limit on accept/decline (10/min/IP) | Prevents abuse |
| Brute force | 64-char hex token = 256 bits of entropy | Infeasible to guess; rate limiting adds defence-in-depth |
| Re-invite policy | New invitation auto-cancels prior pending invitation for same `(will, invitee, role)` tuple | Prevents confusion from multiple active links |
| Email enumeration | Accept/decline return generic error for invalid tokens | Don't reveal whether email exists |
| Webhook signature | `X-Postmark-Webhook-Token` verified with `secure_compare` | From day 1 |
| Webhook idempotency | Deterministic key: `"postmark:#{MessageID}:#{RecordType}:#{ReceivedAt}"`; unique index | Duplicates silently ignored |
| CSRF on magic links | Accept is GET (idempotent). Confirm is POST with Rails CSRF token | Rails default protection |
| Passwordless users | `password_digest` nullable for invited users; `authenticate_by` returns nil for nil digests | Cannot log in until password set on confirmation page |
| Password complexity | Existing rules apply: 12+ chars, letters and numbers | Enforced on confirmation page |
| Sensitive param filtering | `token`, `password` already in filter list (`filter_parameter_logging.rb`) | Verify after implementation |
| Inviter authorization | Only the inviter can list/cancel their own invitations | Scope queries by `current_api_user` |
| Deep link injection | `deep_link_url` constructs from controlled data; all params CGI-escaped | Prevent injection |
| Token in job arguments | Raw token passed to `InvitationDeliveryJob`; Solid Queue stores in DB temporarily | Acceptable: same trust boundary as digest; token useless after acceptance; expires in 14 days |

---

## 7) Test Plan

## Model tests — `Invitation`

- `validates :role, :invitee_email, :invitee_first_name, :client_will_id, presence: true`
- role enum rejects unknown values
- status transitions: `pending → accepted`, `pending → rejected`, `pending → expired`, `pending → revoked`
- disallows invalid transitions (e.g., `accepted → pending`)
- `invitee_email` normalized to lowercase and stripped
- `#expired?` returns true when `token_expires_at` is in the past
- `#acceptable?` returns true only when `pending?` and not expired
- `public_id` auto-generated on create, unique
- `token_digest` uniqueness (when not nil)
- `Invitation.find_by_token(raw)` returns correct record via SHA-256 digest
- `Invitation.find_by_token(nil)` returns nil, `Invitation.find_by_token("garbage")` returns nil
- `#record_event!` creates an `InvitationEvent` with correct attributes
- scoped uniqueness: cannot create two `pending` invitations for same `(inviter, client_will_id, invitee_email, role)`
- CAN create new `pending` invitation after prior one is `expired` or `rejected`

## Model tests — `InvitationEvent`

- requires `event_type`, `occurred_at`, `source`
- `idempotency_key` enforces uniqueness (ignores duplicate inserts)
- `idempotency_key` allows multiple `nil` values

## Request specs — `POST /api/v1/invitations`

- **201 success**: creates invitation + `invitation_created` event + enqueues delivery job
- **201 response shape**: returns `public_id` as `id`, never exposes internal bigint
- **201 with re-send**: prior pending invitation auto-revoked, new one created
- **401 unauthenticated**: missing/invalid bearer token
- **422 missing fields**: no `role`, no `invitee_email`, no `client_will_id`
- **422 invalid role**: role not in `[executor, guardian]`
- **422 invalid email**: malformed invitee_email
- **409 duplicate**: pending invitation already exists for same `(will, invitee, role)` tuple

## Request specs — `GET /api/v1/invitations`

- returns only invitations for the authenticated user (scoped by `inviter_user_id`)
- filters by `role` parameter
- filters by `status` parameter
- does not leak other users' invitations
- returns `public_id` as `id` in all response items

## Controller specs — `GET /invitations/:token/accept`

- **valid pending token**: marks accepted, sets `accepted_at`, creates user, records `invitation_accepted` event
- **valid token, new user**: creates `User` with `password_digest: nil`, renders confirmation page
- **valid token, existing user with password**: marks accepted, redirects to deep link immediately
- **valid token, existing user without password**: marks accepted, renders confirmation page
- **expired token**: renders expired error page, does not change invitation status
- **already-accepted token**: renders "already processed" page
- **garbage token**: renders generic error page (no email enumeration)

## Controller specs — `GET /invitations/:token/decline`

- **valid pending token**: renders "Are you sure?" confirmation page
- **expired/invalid token**: renders error page

## Controller specs — `POST /invitations/:token/decline`

- **valid pending token**: marks rejected, sets `rejected_at`, records `invitation_rejected` event, renders thank-you page
- **already-processed token**: renders "already processed" page

## Controller specs — `POST /invitations/:token/confirm`

- **valid (accepted, no password yet)**: sets password on user, redirects to deep link
- **password too short**: re-renders form with validation error
- **password mismatch**: re-renders form with validation error
- **already confirmed (user has password)**: redirects to deep link (idempotent)

## Job specs — `InvitationDeliveryJob`

- calls `InvitationMailer` with correct template (executor vs guardian)
- records `email_queued` event before send
- records `email_sent` event after successful send
- persists `email_message_id` on invitation record
- retries on transient Postmark error (network timeout)
- records failure event on permanent Postmark error (invalid email)

## Webhook specs — `POST /webhooks/postmark`

- **valid signature + Open event**: creates `email_opened` event on correct invitation
- **valid signature + Delivery event**: creates `email_delivered` event
- **invalid/missing signature**: returns 401
- **duplicate event (same idempotency key)**: returns 200, no new event created
- **unknown MessageID**: returns 200 (graceful no-op, no error)
- **malformed payload**: returns 200 (don't expose internals)

## Mailer specs/previews

- `InvitationMailer#executor_invite` renders HTML with accept link, decline link, will-maker name, expiry date
- `InvitationMailer#guardian_invite` renders HTML with accept link, decline link, will-maker name, expiry date
- plain text variants render correct links
- links use correct host per environment (`localhost:3010` in dev, `kindlingmoney.com` in prod)
- subject line: `"[Name] has asked you to be their executor"` / `"... guardian"`
- both mailer previews work in development (ActionMailer::Preview)

## Service specs — `Invitations::CreateService`

- generates 64-char hex token, persists only SHA-256 digest
- sets `token_expires_at` to 14 days from now
- auto-revokes prior pending invitation for same tuple
- creates `invitation_created` event
- enqueues `InvitationDeliveryJob`
- returns success result with invitation

## Service specs — `Invitations::AcceptService`

- digests raw token, finds matching pending invitation
- rejects expired invitations
- rejects non-pending invitations
- finds existing user by `invitee_email`
- creates new user with `password_digest: nil` when none exists
- sets `accepted_user_id`, `accepted_at`, status to `accepted`
- clears `token_digest` (one-time use)
- records `invitation_accepted` event
- creates `InvitationRoleAssignment` scoped to will

## Service specs — `Invitations::DeclineService`

- digests raw token, finds matching pending invitation
- sets status to `rejected`, `rejected_at`
- clears `token_digest`
- records `invitation_rejected` event

## Dev flow walkthrough (Letter Opener Web)

1. Start app in development (`bin/dev`).
2. Create invitation via API: `POST /api/v1/invitations` with bearer token.
3. Open `http://localhost:3010/letter_opener` and verify email appears.
4. Inspect email: correct subject, will-maker name, accept link, decline link, expiry messaging.
5. Click accept link → verify invitation status changes to `accepted`, events recorded.
6. If new user: verify confirmation page renders. Set password, submit.
7. Verify deep-link redirect URL is correct format: `kindling://open?action=executor_accepted&...`
8. Repeat with decline link → verify "Are you sure?" page → confirm → status `rejected`.
9. Attempt to reuse consumed token → verify error page shown.

---

## 8) Risks, Unknowns, and De-risking Plan

## Key risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **`password_digest` nullable** could break existing auth flows | Users without passwords in unexpected states | Guard `authenticate_by` to reject nil-digest users. Add `has_password?` check. Validate password presence on normal registration (existing behaviour). Tested explicitly. |
| **No staging environment file** exists | Staging deployment will fail | Created in Phase 1. Based on production config with Postmark settings and `staging.kindlingmoney.com` host. |
| **Raw token in Solid Queue job table** | DB compromise exposes pending tokens | Tokens expire in 14 days, single-use. Same DB trust boundary as password digests. Acceptable risk. |
| **No people/will models in API** | Role context drifts if overbuilt | Phase 4 adds minimal identity bridge only. No full estate domain until needed. |
| **Webhook duplicate delivery** | Duplicate analytics events | Append-only events with deterministic idempotency keys + unique index. |
| **Email state ambiguity** | Confusion between queued/sent/delivered | Three distinct states with explicit event types. `sent_at` = provider accepted. |
| **Native app local `invitedAt` vs server invitation divergence** | User taps "Ask Them" but API call fails silently | Keep both timestamps as complementary signals. Mismatch = bug signal for support. Future: make API call mandatory before setting local flag. |
| **Native app data structure: invitation status on Person not WillData** | `executorStatus`, `invitedAt`, `respondedAt` on `Person` can't represent per-will acceptance | Migrate status fields from `Person` to `WillData.executors` and `WillData.guardianship` entries. Add backward-compat migration layer. Coordinate with API invitation integration. This is a **prerequisite** for correct multi-will invitation support. |
| **Deep link not handled if app not installed** | `kindling://` link fails on device without app | Phase 2 confirmation page can show "Download the app" fallback with store links. Not in scope for initial build but noted for future. |
| **Email deliverability** for new domain | Spam filters on `kindlingmoney.com` | Ensure SPF, DKIM, DMARC configured. Verify sender signature in Postmark before first send. |
| **Migration debt** in existing repo | Duplicated migration class definitions | Clean up before adding new migrations to avoid confusion. |

## De-risk actions

1. ~~Confirm deep-link URLs~~ → **Confirmed**: `kindling://open?action=[role]_accepted&...` with stub screens.
2. Implement minimal people identity bridge in Phase 4; postpone full estate domain.
3. Start with append-only `invitation_events` and strict idempotency keys.
4. Add explicit status/event transition matrix in code and docs.
5. Gate rollout behind feature flag in staging first; run end-to-end dry-run with Postmark sandbox.
6. Verify Postmark sender signature and DNS records for `kindlingmoney.com` before Phase 1 is deployed to staging.
7. **Plan native app data migration early:** Move `executorStatus`/`invitedAt`/`respondedAt` from `Person` to `WillData.executors` entries (and same for guardian fields). This should be designed before Phase 1 API work begins, so the native app sends `client_will_id` with every invitation request from day 1.

---

## Recommended Build Order (Minimal Churn)

0. **Pre-work (native app):** Migrate invitation status fields from `Person` to `WillData.executors` and `WillData.guardianship` entries. This is a data-structure-only change in the native app (no API dependency). It ensures `client_will_id` is available when calling the invitation API.
1. **Foundation first (API):** invitation + event models, send endpoint, dev/prod mail config. Invitation scoped per-will via `client_will_id`.
2. **Then acceptance (API):** token endpoints, user creation/linking, confirmation page, deep-link redirect. Role assignment stored per-will.
3. **Then observability (API):** webhook ingestion and event idempotency.
4. **Then mapping bridge (API + native):** people sync endpoints and native `serverId` consistency improvements.

This sequence delivers value early while preserving flexibility for future invite roles.

### Native app coordination needed| When | What | Why |
|------|------|-----|
| Before Phase 1 API | Migrate `executorStatus`/`invitedAt`/`respondedAt` from `Person` to `WillData.executors` entries. Same for guardian fields → `WillData.guardianship` entries. | So the native app has `client_will_id` context when sending invitations. API requires `client_will_id` from day 1. |
| During Phase 1 API | Update `sendExecutorInvitations()` / `sendGuardianInvitations()` to call `POST /api/v1/invitations` with `client_will_id` | Replace local-only flag with real API call. Keep local `invitedAt` as optimistic signal. |
| During Phase 2 API | Add `app/executor-accepted.tsx` and `app/guardian-accepted.tsx` stub screens. Extend `app/open.tsx` deep link handler. | Handle acceptance deep links from the web confirmation page. |
| During Phase 4 API | Update sync service to call `POST /api/v1/people/sync`, store `serverId` on local Person records. | Enable server-side person identity mapping. |