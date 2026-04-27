# Epic 3 piece 3.2 — OnboardingSession → User consolidation detailed plan

> Half-day spike output. Concrete plan for collapsing `OnboardingSession` into `User` (anonymous Users with NULL email). This plan can either ship as part of Epic 2 Wave 2 (recommended — see "Timing" section) or as the leading piece of Epic 3.

## Goal

Replace the `OnboardingSession` entity entirely. The `User` table becomes the single home for both anonymous-pre-onboarding state and registered-user state. Anonymous = `email_address IS NULL`. Registered = `email_address IS NOT NULL`.

## Schema migrations

Five migrations, separate commits, run in order.

### 3.2.1 — Make `User` columns nullable + add onboarding columns

```ruby
class AddOnboardingColumnsToUsers < ActiveRecord::Migration[8.1]
  def change
    # Auth columns become nullable for anonymous Users
    change_column_null :users, :email_address, true
    change_column_null :users, :password_digest, true

    # Drop existing unique constraint and rebuild as partial
    remove_index :users, :email_address
    add_index :users, :email_address,
      unique: true,
      where: "email_address IS NOT NULL",
      name: "index_users_on_email_address_when_set"

    # OnboardingSession lifecycle columns absorbed into User
    add_column :users, :token, :string
    add_index :users, :token, unique: true

    add_column :users, :current_step, :string
    add_column :users, :intro_seen_at, :datetime
    add_column :users, :last_seen_at, :datetime
    add_column :users, :completed_at, :datetime

    # Attribution + startup obligations
    add_column :users, :attribution_source, :string
    add_column :users, :campaign, :string
    add_column :users, :raw_url, :text
    add_column :users, :first_show, :string
    add_column :users, :video_intro_version, :integer
    add_column :users, :risk_questionnaire_version, :integer
    add_column :users, :video_completed_at, :datetime
    add_column :users, :questionnaire_completed_at, :datetime

    # will_maker_person_id was added in Epic 2 Wave 2; if not yet, do it here
    unless column_exists?(:users, :will_maker_person_id)
      add_reference :users, :will_maker_person,
        foreign_key: { to_table: :people }, null: true
    end
  end
end
```

### 3.2.2 — Email-empty-string sanity check (C6 fix)

```ruby
class CheckEmailDataBeforeConsolidation < ActiveRecord::Migration[8.1]
  def up
    bad_count = User.where(email_address: "").count
    raise "Found #{bad_count} Users with empty-string email_address — clean up first" if bad_count > 0
  end

  def down; end
end
```

Run this **before** 3.2.1.

### 3.2.3 — Backfill: convert existing OnboardingSession rows into anonymous User rows

```ruby
class ConsolidateOnboardingSessionsIntoUsers < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!  # required for AR encryption to read

  def up
    OnboardingSession.find_each do |session|
      ActiveRecord::Base.transaction do
        # Skip if already migrated (idempotency)
        next if User.exists?(token: session.token)

        anonymous_user = User.create!(
          email_address: nil,
          password_digest: nil,
          token: session.token,
          current_step: session.current_step,
          intro_seen_at: session.intro_seen_at,
          last_seen_at: session.last_seen_at,
          completed_at: session.completed_at,
          attribution_source: session.attribution_source,
          campaign: session.campaign,
          raw_url: session.raw_url,
          first_show: session.first_show,
          video_intro_version: session.video_intro_version,
          risk_questionnaire_version: session.risk_questionnaire_version,
          video_completed_at: session.video_completed_at,
          questionnaire_completed_at: session.questionnaire_completed_at
        )

        # Re-point all Person rows
        Person.where(onboarding_session_id: session.id).update_all(user_id: anonymous_user.id)

        # Re-point Devices
        Device.where(onboarding_session_id: session.id).update_all(user_id: anonymous_user.id)

        # If the will-maker Person exists, link it
        will_maker = Person.find_by(user_id: anonymous_user.id, relationship_kind: "self")
        anonymous_user.update!(will_maker_person_id: will_maker.id) if will_maker
      end
    end
  end

  def down
    User.where(email_address: nil).destroy_all
  end
end
```

**Idempotent** by design (re-running just skips already-migrated rows). Critical for safe deploys.

### 3.2.4 — Drop `onboarding_sessions` table + cleanup

```ruby
class DropOnboardingSessionsTable < ActiveRecord::Migration[8.1]
  def up
    # Verify no rows left referencing the table
    raise "Persons still reference onboarding_sessions" if Person.where.not(onboarding_session_id: nil).exists?
    raise "Devices still reference onboarding_sessions" if Device.where.not(onboarding_session_id: nil).exists?

    remove_reference :people, :onboarding_session, foreign_key: true
    remove_reference :devices, :onboarding_session, foreign_key: true

    # Person.user_id becomes NOT NULL (was nullable for the transitional state)
    change_column_null :people, :user_id, false
    remove_check_constraint :people, name: "people_belong_to_user_or_session"

    # Drop the partial unique indexes that referenced onboarding_session_id
    remove_index :people, name: "index_people_on_session_will_maker"
    remove_index :people, name: "index_people_on_session_spouse"

    # Add equivalent indexes scoped to user_id instead
    add_index :people, :user_id,
      unique: true,
      where: "relationship_kind = 'self'",
      name: "index_people_on_user_will_maker"

    add_index :people, :user_id,
      unique: true,
      where: "relationship_kind = 'spouse'",
      name: "index_people_on_user_spouse"

    drop_table :onboarding_sessions
  end

  def down
    # Lossy reverse — only used for rollback during deploy testing
    raise ActiveRecord::IrreversibleMigration
  end
end
```

### 3.2.5 — Will from day one (C2 decision)

Per user's instinct: create a `Will` row whenever a `User` is created. The Will is the container for all "if I die" decisions — guardian appointments, executor appointments, residue allocation. Owning it on the User from the start gives all those a stable parent.

```ruby
class CreateWillsTable < ActiveRecord::Migration[8.1]
  def change
    create_table :wills do |t|
      t.references :user, foreign_key: true, null: false
      t.integer :version, null: false, default: 1
      t.string :status, null: false, default: "draft"
      t.references :supersedes, foreign_key: { to_table: :wills }, null: true
      t.datetime :finalized_at
      t.timestamps
    end

    add_index :wills, [:user_id, :version], unique: true
    add_index :wills, :user_id,
      unique: true,
      where: "status = 'active'",
      name: "index_wills_on_active"
  end
end
```

Plus add a `User#after_create` callback to create the initial Will:

```ruby
class User < ApplicationRecord
  has_many :wills, dependent: :destroy
  has_one :active_will, -> { where(status: "active") }, class_name: "Will"
  has_one :draft_will, -> { where(status: "draft") }, class_name: "Will"

  after_create :create_initial_will

  private

  def create_initial_will
    wills.create!(version: 1, status: "draft")
  end
end
```

Empty draft Will exists from User creation. No bequests, no executors, no witnesses yet — just a placeholder. Cascade-destroyed if User is destroyed (anonymous abandoned-after-3-hours cleanup chain works).

This means **Guardianship can have `will_id NOT NULL` from day one** (when Guardianship gets created in a future epic) — no nullable FK gymnastics.

## Code changes

### 3.2.6 — `User` model

```ruby
class User < ApplicationRecord
  has_secure_password validations: false  # we manage our own validation contexts
  has_many :sessions, dependent: :destroy
  has_many :api_sessions, dependent: :destroy
  has_many :devices, dependent: :destroy
  has_many :people, dependent: :destroy
  has_many :wills, dependent: :destroy
  has_one :active_will, -> { where(status: "active") }, class_name: "Will"
  has_one :draft_will, -> { where(status: "draft") }, class_name: "Will"
  belongs_to :will_maker_person, class_name: "Person", optional: true

  # Anonymous Users have NULL email_address. Registered Users have email + password.
  validates :email_address,
    uniqueness: { case_sensitive: false },
    presence: true,
    on: :register

  validates :password,
    length: { minimum: 12 },
    format: { with: /\A(?=.*[a-zA-Z])(?=.*[0-9]).*\z/, message: "must contain letters and numbers" },
    on: :register

  encrypts :email_address, deterministic: true

  after_create :ensure_token, :create_initial_will

  scope :anonymous, -> { where(email_address: nil) }
  scope :registered, -> { where.not(email_address: nil) }

  # Critical security: never authenticate anonymous Users
  def self.authenticate_by(email_address:, password:)
    return nil if email_address.blank? || password.blank?
    user = registered.find_by(email_address: email_address.downcase.strip)
    return nil if user.nil? || user.password_digest.blank?
    user.authenticate(password) ? user : nil
  end

  def anonymous?
    email_address.nil?
  end

  def registered?
    email_address.present?
  end

  # Onboarding helpers (migrated from OnboardingSession)
  def first_incomplete_path
    # ... same logic, just on User now
  end

  def inactive_for_more_than?(duration)
    last_seen_at && last_seen_at < duration.ago
  end

  def touch_last_seen!
    update_column(:last_seen_at, Time.current)
  end

  private

  def ensure_token
    update_column(:token, SecureRandom.hex(32)) if token.blank?
  end

  def create_initial_will
    wills.create!(version: 1, status: "draft")
  end
end
```

### 3.2.7 — `Mobile::BaseController`

```ruby
class Mobile::BaseController < ApplicationController
  helper_method :current_user, :anonymous_user_token

  before_action :touch_user!

  private

  def current_user
    @current_user ||= find_current_user
  end

  def find_current_user
    # Authenticated session takes precedence
    if session_user = User.find_by(id: session[:user_id])
      return session_user
    end

    # Anonymous user via signed token cookie
    if token = cookies.signed[:user_token]
      anonymous_user = User.anonymous.find_by(token: token)
      return anonymous_user if anonymous_user && !stale?(anonymous_user)
    end

    # No user — create an anonymous one
    create_anonymous_user!
  end

  def create_anonymous_user!
    user = User.create!(token: SecureRandom.hex(32))
    cookies.signed[:user_token] = {
      value: user.token,
      expires: 3.hours.from_now,
      httponly: true,
      same_site: :lax
    }
    user
  end

  def stale?(user)
    return false if user.last_seen_at.nil?
    user.last_seen_at < 3.hours.ago
  end

  def touch_user!
    current_user.touch_last_seen! if current_user.anonymous?
  end

  def authenticate_user!
    return if current_user.registered?
    redirect_to mobile_login_path
  end
end
```

### 3.2.8 — `Mobile::SessionsController` (login flow)

```ruby
class Mobile::SessionsController < Mobile::BaseController
  rate_limit to: 10, within: 3.minutes, only: :create

  def new
  end

  def create
    user = User.authenticate_by(
      email_address: params.require(:email_address),
      password: params.require(:password)
    )

    if user
      # Destroy the current anonymous User (and cascade their Persons / Wills / etc.)
      destroy_anonymous_user!

      # Start authenticated session
      session[:user_id] = user.id
      cookies.delete :user_token

      redirect_to mobile_dashboard_path
    else
      redirect_to mobile_login_path, alert: "Invalid email or password"
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to mobile_intro_path
  end

  private

  def destroy_anonymous_user!
    return unless current_user.anonymous?
    current_user.destroy!
    @current_user = nil  # force reload
  end
end
```

### 3.2.9 — `Mobile::AuthController#secure_account` (registration)

```ruby
class Mobile::AuthController < Mobile::BaseController
  def secure_account
    # GET — render form
  end

  def create
    return redirect_to mobile_dashboard_path if current_user.registered?

    user = current_user
    user.email_address = params.require(:email_address)
    user.password = params.require(:password)

    if user.save(context: :register)
      session[:user_id] = user.id
      cookies.delete :user_token
      redirect_to mobile_dashboard_path
    else
      @user = user
      render :secure_account, status: :unprocessable_entity
    end
  end
end
```

Same User row — no creation, no data copy, no transformation. Just sets email + password on the existing anonymous User row, starts an authenticated session, switches cookies.

### 3.2.10 — Cleanup job for abandoned anonymous Users

Replaces the OnboardingSession 3-hour cleanup:

```ruby
# app/jobs/abandoned_anonymous_user_cleanup_job.rb
class AbandonedAnonymousUserCleanupJob < ApplicationJob
  queue_as :default

  def perform
    User.anonymous
        .where(last_seen_at: ...3.hours.ago)
        .or(User.anonymous.where(last_seen_at: nil).where(created_at: ...3.hours.ago))
        .find_each(batch_size: 100, &:destroy)
  end
end
```

Schedule via `solid_queue` (or whatever job runner is configured) — runs hourly.

## Cookie strategy summary (C4)

**Pre-registration** (anonymous User):
- Cookie: `user_token` (signed, 3-hour expiry, httponly, same_site:lax)
- Server lookup: `User.anonymous.find_by(token: cookies.signed[:user_token])`
- Refreshed on every request (touch_last_seen → cookie expiry rolls forward)

**Registered User** (after secure-account or login):
- Cookie: standard Rails `session_id` (the `session[:user_id] = user.id` line above)
- `user_token` cookie deleted
- Sessions table acquires a row via `has_secure_password` flow

**Transition** (registration or login):
- `session[:user_id]` set
- `cookies.delete :user_token`
- One mechanism at a time. No overlap.

## Login-from-onboarding warning UX (C3)

When the user is on `/mobile/onboarding/*` and clicks the "Log in instead" link, the destination is `/mobile/login`. Before submitting the login form (i.e., at the moment they click the link OR submit), show a confirmation:

> "Logging in will discard the information you've entered during onboarding. Continue?"
>
> [Cancel] [Yes, log in]

Implementation: Stimulus controller on the login link, intercepts the click if the current user has `current_step != "intro"` (meaning they've started entering data). Shows a confirm dialog. If user confirms, link follows; if cancel, no navigation.

```javascript
// app/javascript/controllers/login_warning_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { hasOnboardingData: Boolean }

  confirmIfNeeded(event) {
    if (this.hasOnboardingDataValue) {
      const ok = window.confirm("Logging in will discard the information you've entered during onboarding. Continue?")
      if (!ok) event.preventDefault()
    }
  }
}
```

```erb
<a href="<%= mobile_login_path %>"
   data-controller="login-warning"
   data-login-warning-has-onboarding-data-value="<%= current_user.current_step.present? %>"
   data-action="click->login-warning#confirmIfNeeded">
  Log in instead
</a>
```

## Tests required

### Critical security: anonymous-user-cannot-authenticate

```ruby
RSpec.describe User, ".authenticate_by" do
  it "returns nil for anonymous Users (NULL email_address)" do
    User.create!(email_address: nil, password_digest: nil)
    expect(User.authenticate_by(email_address: nil, password: "anything")).to be_nil
    expect(User.authenticate_by(email_address: "", password: "anything")).to be_nil
  end

  it "returns nil for Users with NULL password_digest" do
    user = User.create!(email_address: "test@example.com", password_digest: nil)
    expect(User.authenticate_by(email_address: "test@example.com", password: "anything")).to be_nil
  end

  it "returns the user for registered users with correct password" do
    user = User.create!(email_address: "test@example.com", password: "securepass1234")
    expect(User.authenticate_by(email_address: "test@example.com", password: "securepass1234")).to eq user
  end
end
```

### Migration idempotency

```ruby
RSpec.describe ConsolidateOnboardingSessionsIntoUsers do
  it "produces the same result on second run" do
    create_list(:onboarding_session_with_legacy_data, 5)
    described_class.new.up
    first_state = User.count
    described_class.new.up
    expect(User.count).to eq first_state
  end
end
```

### Login-from-onboarding cascade

```ruby
RSpec.describe "Login from onboarding" do
  it "destroys anonymous User and their Persons / Wills" do
    anon = User.create!(token: "abc")
    person = anon.people.create!(relationship_kind: "self", first_name: "Alice")
    will = anon.wills.first  # auto-created

    registered = User.create!(email_address: "test@example.com", password: "securepass1234")

    post "/mobile/login", params: { email_address: "test@example.com", password: "securepass1234" }

    expect(User.find_by(id: anon.id)).to be_nil
    expect(Person.find_by(id: person.id)).to be_nil
    expect(Will.find_by(id: will.id)).to be_nil
  end
end
```

## Effort estimate

| Piece | Effort |
|---|---|
| Migrations 3.2.1–3.2.5 | 0.5 day |
| User model refactor | 0.5 day |
| BaseController refactor | 0.5 day |
| SessionsController + AuthController | 0.5 day |
| Cleanup job | 0.5 day |
| Login-from-onboarding warning UX | 0.5 day |
| Tests | 1 day |
| Verification + integration testing | 0.5 day |
| **Total** | **~4.5 days** |

## Timing — recommended

**Merge with Epic 2 Wave 2.** Two reasons:

1. Wave 2 is already touching all the code that uses OnboardingSession (controllers, views, validations). Adding the consolidation now means **one refactor, not two**.

2. Wave 2 ships against the FINAL shape (Version B ERD). Drops the transitional Version A entirely. Saves ~2 days of "ship the transitional, then do consolidation" overhead.

Cost: Wave 2 grows from ~7 days to ~9–10 days. Total Epic 2 effort similar but cleaner outcome.

**Net plan if merged**:
- Wave 1: 1 day (family-form bug fix + NI + 1 Capybara test)
- Wave 2 (merged with consolidation): ~9–10 days (children-as-records + family-step UX + AR encryption + OnboardingSession→User consolidation + Will-from-day-one + cleanup job)
- Epic 3 piece 3.2 becomes: nothing more than what Wave 2 already did.

Epic 3 then focuses on **just the auth flows** (register, login form, session refresh, error instrumentation, push-dedup switch).

## What this spike confirms about Epic 2 v2 plan

- The Person.user_id transition (X1) **doesn't need a transitional state**. We can give Person a user_id (the anonymous User's id) from day one of onboarding, no `onboarding_session_id` column, no CHECK constraint juggling. This is the simplest model.
- The `User.authenticate_by` security check (anonymous users cannot log in) is non-trivial but localised. One method override.
- Will-from-day-one (C2) works cleanly — single `after_create` callback, no business-logic complexity. Future epics gain a stable Will to attach Bequests / Executors / etc. to.
- Cookie strategy is one-cookie-at-a-time: `user_token` for anonymous, `session_id` for registered. Clean transition at register/login.
- Login-from-onboarding warning (C3) is a 10-line Stimulus controller + 1 attribute on the link. Trivial.

## Recommendation

**Merge consolidation into Wave 2.** Drop the transitional Version A ERD entirely. Ship Epic 2 Wave 2 against the unified Version B shape directly.

This means re-doing the Wave 2 plan:
- Person.user_id is set from User creation (not nullable)
- Person.onboarding_session_id never exists (no column to drop later)
- The data migration in Wave 2's W2.3 becomes the consolidation migration in piece 3.2.3
- The CleanUpOnboardingSession migration is replaced by the consolidation cleanup
- `Mobile::OnboardingController` references `current_user`, not `onboarding_session`

If this merge is accepted, DHH should write a **v3 plan** that supersedes v2, ships Wave 2 against the unified shape, and reduces total Epic 2 + Epic 3 work.
