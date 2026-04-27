# Step 7b — DHH v3 final (merged) — 2026-04-27

> **⚠️ SUPERSEDED by v4** ([11-dhh-v4-final-2026-04-27.md](11-dhh-v4-final-2026-04-27.md)).
>
> v4 was produced after running v3 through a fresh QA + Elon first-principles round. v4 keeps v3's overall scope and architecture but folds in 8 fixes (cookie security via token_digest, deferred User creation on marketing pages, email normalisation, numericality validation, migration ordering note, inlined `first_incomplete_path` impl, encryption-at-rest test, server-side login-warning backup) and packages Wave 2 as 5 atomic commits.
>
> Original v3 header below for historical context.

---

> **Supersedes v2** ([06-dhh-v2-final-2026-04-27.md](06-dhh-v2-final-2026-04-27.md)).
>
> Merges QA pass 2 fixes + Epic 3 piece 3.2 consolidation spike + Will-from-day-one decision into a single executable plan. Wave 2 ships against the **unified Version B shape directly**, skipping the transitional Version A entirely.

## What changed from v2

**Architecture**:
- `OnboardingSession` entity dropped entirely.
- Anonymous Users (User rows with `email_address IS NULL`) are the only draft state.
- `Person.user_id` is always set; no `onboarding_session_id` column on Person or Device.
- `Will` row is created when `User` is created (after_create callback).
- Cookie strategy: `user_token` (anonymous) → `session_id` (registered) — never both at once.

**No data migration**:
- We're not live; existing TestFlight/dev OnboardingSession data is disposable.
- All migrations are structural, run on reset databases.
- No idempotency or backfill tests required (the spike's 3.2.3 backfill migration is dropped).

**Scope folded in from QA pass 2**:
- B7 (Guardianship dropped), B9 (button-disable + race rescue), B11 (Person comment, no default scope), B12 (person-picker UX for "someone else" co-parent).
- T1 (idempotency test) dropped — no data migration to test.
- T3 (step-child Parentage), T4 (anonymous-user-cannot-authenticate) added.

**Scope folded in from Epic 3 piece 3.2 spike**:
- 5 migrations from spike → consolidated into Wave 2.
- User model refactor + BaseController + SessionsController + AuthController.
- Cleanup job for anonymous Users.
- Login warning UX.
- Will-from-day-one with `after_create` callback.

**Explicit rejections** (carried from v2):
- Elon R2 (drop `User.will_maker_person_id`, add `Person.is_will_maker` boolean): kept as-is.
- N1 (drop `relationship_kind: "self"` marker for `is_will_maker` boolean): deferred until Epic 4.

## Note to AI agent

Forbidden:
- No service objects (`app/services/` is off limits).
- No form objects, presenter objects, or "policy" objects.
- No new gems beyond what's already in the Gemfile (`turbo-rails`, `stimulus-rails`, `image_processing`, etc.).
- No premature extraction of helpers, concerns, or shared modules until at least three duplicates exist.
- No defensive code for cases that can't happen.
- No rescuing exceptions you don't have a specific recovery for.
- Multi-row write logic lives on the relevant Active Record model as fat-model methods, not in service-object classes.
- No default scopes (DHH dislikes them; explicit > implicit).

---

## Wave structure

- **Wave 1**: 1 day. Ships first. Internal-testing unblock — fixes the family-form conditional-reveal bug + NI + 1 Capybara test. **Identical to v2**; see [06-dhh-v2-final-2026-04-27.md §Wave 1](06-dhh-v2-final-2026-04-27.md) for full detail.
- **Wave 2**: ~9–10 days. Everything else, against the unified shape.

Wave 1 is unchanged. The rest of this document covers Wave 2.

---

## Wave 2 — twelve workstreams

### W2.1 — Schema migrations

Eight migrations, separate commits.

#### 1. Make `User.email_address` and `password_digest` nullable; partial unique on email

```ruby
class MakeUserAuthFieldsNullable < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :email_address, true
    change_column_null :users, :password_digest, true
    remove_index :users, :email_address
    add_index :users, :email_address,
      unique: true,
      where: "email_address IS NOT NULL",
      name: "index_users_on_email_address_when_set"
  end
end
```

#### 2. Add anonymous-User lifecycle + attribution columns to `users`

```ruby
class AddAnonymousLifecycleToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :token, :string
    add_index :users, :token, unique: true

    add_column :users, :current_step, :string
    add_column :users, :intro_seen_at, :datetime
    add_column :users, :last_seen_at, :datetime
    add_column :users, :completed_at, :datetime

    add_column :users, :attribution_source, :string
    add_column :users, :campaign, :string
    add_column :users, :raw_url, :text
    add_column :users, :first_show, :string
    add_column :users, :video_intro_version, :integer
    add_column :users, :risk_questionnaire_version, :integer
    add_column :users, :video_completed_at, :datetime
    add_column :users, :questionnaire_completed_at, :datetime
  end
end
```

#### 3. Create `people` table

```ruby
class CreatePeople < ActiveRecord::Migration[8.1]
  def change
    create_table :people do |t|
      t.references :user, foreign_key: true, null: false  # always set; no nullability
      t.string :relationship_kind, null: false, default: "other"
      t.integer :position, null: false, default: 0
      t.string :first_name
      t.string :middle_names
      t.string :last_name
      t.date :date_of_birth
      t.string :email
      t.string :phone
      t.string :address_line_1
      t.string :address_line_2
      t.string :city
      t.string :postcode
      t.string :country_of_residence
      t.string :nationality
      t.string :domiciled_in_uk
      t.string :currently_resident_in_uk
      t.boolean :disabled, null: false, default: false
      t.boolean :lacks_mental_capacity, null: false, default: false
      t.integer :times_divorced, null: false, default: 0
      t.integer :times_widowed, null: false, default: 0
      t.string :parents_alive
      t.string :parents_in_law_alive
      t.string :siblings_alive
      t.integer :number_of_siblings
      t.timestamps
    end

    # Partial unique indexes for the will-maker and spouse markers (per User)
    add_index :people, :user_id,
      unique: true,
      where: "relationship_kind = 'self'",
      name: "index_people_on_user_will_maker"

    add_index :people, :user_id,
      unique: true,
      where: "relationship_kind = 'spouse'",
      name: "index_people_on_user_spouse"
  end
end
```

No `onboarding_session_id` column. No CHECK constraint about belongs-to-User-or-session. `user_id` is `NOT NULL`.

#### 4. Add `will_maker_person_id` to `users`

```ruby
class AddWillMakerPersonIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :will_maker_person,
      foreign_key: { to_table: :people }, null: true
  end
end
```

Nullable (the will-maker Person doesn't exist on User-creation; only after the user fills in welcome step).

#### 5. Create `parentages` table

```ruby
class CreateParentages < ActiveRecord::Migration[8.1]
  def change
    create_table :parentages do |t|
      t.references :parent_person, foreign_key: { to_table: :people }, null: false
      t.references :child_person, foreign_key: { to_table: :people }, null: false
      t.string :kind, null: false  # biological | adoptive | step | foster
      t.timestamps
    end

    add_index :parentages, [:parent_person_id, :child_person_id], unique: true
    add_check_constraint :parentages,
      "parent_person_id != child_person_id",
      name: "parentages_distinct_persons"
  end
end
```

#### 6. Create `marriages` table

```ruby
class CreateMarriages < ActiveRecord::Migration[8.1]
  def change
    create_table :marriages do |t|
      t.references :will_maker_person, foreign_key: { to_table: :people }, null: false
      t.references :partner_person, foreign_key: { to_table: :people }, null: false
      t.string :kind, null: false   # married | civil_partnership | cohabiting
      t.string :phase, null: false, default: "active"
      t.date :started_at
      t.date :ended_at
      t.timestamps
    end

    add_check_constraint :marriages,
      "will_maker_person_id != partner_person_id",
      name: "marriages_distinct_persons"

    add_index :marriages,
      [:will_maker_person_id, :partner_person_id],
      unique: true,
      name: "index_marriages_on_pair"

    add_index :marriages,
      :will_maker_person_id,
      unique: true,
      where: "phase = 'active'",
      name: "index_marriages_on_active"
  end
end
```

#### 7. Create `wills` table

```ruby
class CreateWills < ActiveRecord::Migration[8.1]
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

#### 8. Drop `onboarding_sessions` table

```ruby
class DropOnboardingSessionsTable < ActiveRecord::Migration[8.1]
  def up
    # No data preservation — we're not live, OnboardingSession data is disposable.
    drop_table :onboarding_sessions, force: :cascade
    # Drop FK columns on Device that referenced onboarding_sessions
    remove_reference :devices, :onboarding_session, if_exists: true
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
```

Run order: 1, 2, 3, 4, 5, 6, 7 first (additive), then **the code refactor (W2.5 onwards) deploys**, then 8 last (drops the now-unused table).

### W2.2 — Active Record encryption setup

```bash
bin/rails db:encryption:init
```

Add the generated keys to `config/credentials/{development,test,production}.yml.enc`.

```ruby
# app/models/person.rb
encrypts :first_name, :middle_names, :last_name, :email, :phone,
         :address_line_1, :address_line_2, :city, :postcode,
         deterministic: true
encrypts :date_of_birth, deterministic: true
```

```ruby
# app/models/user.rb
encrypts :email_address, deterministic: true
```

Default deterministic everywhere for v1. Per-column audit deferred to PRE_LAUNCH_TODO.

### W2.3 — `User` model

Replaces the existing `User` model. Now handles both anonymous and registered states.

```ruby
class User < ApplicationRecord
  has_secure_password validations: false

  # Sessions / API tokens
  has_many :sessions, dependent: :destroy
  has_many :api_sessions, dependent: :destroy
  has_many :devices, dependent: :destroy

  # People graph
  has_many :people, dependent: :destroy
  belongs_to :will_maker_person, class_name: "Person", optional: true

  has_one :spouse_person, -> { where(relationship_kind: "spouse") },
          class_name: "Person", inverse_of: :user

  # Wills
  has_many :wills, dependent: :destroy
  has_one :active_will, -> { where(status: "active") }, class_name: "Will"
  has_one :draft_will, -> { where(status: "draft") }, class_name: "Will"

  # Encryption
  encrypts :email_address, deterministic: true

  # Validations — `:register` context required at signup; permissive otherwise
  validates :email_address,
    uniqueness: { case_sensitive: false },
    presence: true,
    on: :register
  validates :password,
    length: { minimum: 12 },
    format: { with: /\A(?=.*[a-zA-Z])(?=.*[0-9]).*\z/, message: "must contain letters and numbers" },
    on: :register

  # Lifecycle
  after_create :ensure_token, :create_initial_will
  before_destroy :clear_session_cookie

  # State predicates
  def anonymous?
    email_address.nil?
  end

  def registered?
    email_address.present?
  end

  # Authentication — critical: anonymous Users CANNOT authenticate
  def self.authenticate_by(email_address:, password:)
    return nil if email_address.blank? || password.blank?
    user = where.not(email_address: nil).find_by(email_address: email_address.downcase.strip)
    return nil if user.nil? || user.password_digest.blank?
    user.authenticate(password) ? user : nil
  end

  # Onboarding helpers (migrated from OnboardingSession)
  def first_incomplete_path
    # ... same logic as the old OnboardingSession#first_incomplete_path
  end

  def inactive_for_more_than?(duration)
    last_seen_at && last_seen_at < duration.ago
  end

  def touch_last_seen!
    update_column(:last_seen_at, Time.current)
  end

  # === Onboarding step writes (fat-model methods, not service objects) ===
  # All preserved from v2 W2.5 — apply_welcome_step!, apply_location_step!,
  # apply_family_step!, apply_extended_family_step! — but operate on `self.people`
  # rather than `onboarding_session.people`. See v2 plan for full implementation.

  # Same for apply_partner!, apply_children!, apply_co_parent!,
  # destroy_existing_partnership!, destroy_orphaned_co_parents!.
  # Reference v2 [§W2.5 OnboardingSession fat-model methods].

  private

  def ensure_token
    update_column(:token, SecureRandom.hex(32)) if token.blank?
  end

  def create_initial_will
    wills.create!(version: 1, status: "draft")
  end

  def clear_session_cookie
    # Cookie deletion happens at controller level; this is a hook for any
    # Session row cleanup beyond the cascade-destroy on `has_many :sessions`.
    # Currently no extra work needed.
  end
end
```

The fat-model methods from v2 W2.5 (`apply_welcome_step!`, `apply_family_step!`, etc.) move from `OnboardingSession` to `User`. The implementation is identical — just the home is User now.

### W2.4 — `Mobile::BaseController`

```ruby
class Mobile::BaseController < ApplicationController
  helper_method :current_user

  before_action :ensure_user!
  before_action :touch_user!

  private

  def current_user
    @current_user ||= find_current_user
  end

  def find_current_user
    # Authenticated session takes precedence
    if user_id = session[:user_id]
      registered = User.find_by(id: user_id)
      return registered if registered
      session.delete(:user_id)  # stale session cookie; clear
    end

    # Anonymous user via signed token cookie
    if token = cookies.signed[:user_token]
      anonymous = User.find_by(token: token, email_address: nil)
      return anonymous if anonymous && !stale?(anonymous)
      cleanup_stale_cookie!(anonymous) if anonymous  # 3-hour expiry
    end

    nil
  end

  def ensure_user!
    @current_user = current_user || create_anonymous_user!
  end

  def create_anonymous_user!
    user = User.create!
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

  def cleanup_stale_cookie!(stale_user)
    stale_user.destroy
    cookies.delete :user_token
    @current_user = nil
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

### W2.5 — `Mobile::OnboardingController` refactor

Replace every `onboarding_session` reference with `current_user`:

```ruby
class Mobile::OnboardingController < Mobile::BaseController
  def update_welcome
    current_user.apply_welcome_step!(welcome_params)
    redirect_to mobile_onboarding_location_path
  rescue ActiveRecord::RecordInvalid => e
    @errors = e.record.errors
    render :welcome, status: :unprocessable_entity
  end

  # update_location, update_family, update_extended_family, etc. all follow
  # the same pattern. Same controller method names, same params structure;
  # just `current_user` replaces `onboarding_session` everywhere.

  private

  def welcome_params
    params.require(:person).permit(:first_name, :middle_names, :last_name, :date_of_birth)
  end

  def family_params
    params.permit(
      :relationship_kind, :marriage_kind, :times_divorced, :times_widowed, :has_children,
      partner: [:first_name, :last_name, :started_at],
      children: [
        :first_name, :last_name, :date_of_birth, :relationship_kind,
        :disabled, :lacks_mental_capacity,
        co_parent: [:type, :existing_person_id, :first_name, :last_name, :relationship_to_child]
      ]
    )
  end
end
```

### W2.6 — `Mobile::SessionsController` (login flow)

```ruby
class Mobile::SessionsController < Mobile::BaseController
  rate_limit to: 10, within: 3.minutes, only: :create

  def new
    # Render login form. Stash whether current_user has onboarding data
    # for the warning Stimulus controller (see W2.10).
    @has_onboarding_data = current_user&.current_step.present?
  end

  def create
    user = User.authenticate_by(
      email_address: params.require(:email_address),
      password: params.require(:password)
    )

    if user
      destroy_anonymous_user!
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
    return unless current_user&.anonymous?
    current_user.destroy!
    @current_user = nil
    cookies.delete :user_token
  end
end
```

### W2.7 — `Mobile::AuthController` (registration / secure-account)

```ruby
class Mobile::AuthController < Mobile::BaseController
  def secure_account
    return redirect_to mobile_dashboard_path if current_user.registered?
    @user = current_user
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

Same User row before and after registration — no data copy. Just sets email + password on the existing anonymous User row.

### W2.8 — Family-step UX expansion

Identical to v2 [W2.6 + W2.6.1] — the per-child co-parent question with conditional reveals + person-picker for someone-else.

The form-template changes apply unchanged. The Stimulus controller (`family_form_controller.js`) is identical to v2.

The B9 fix lands on the submit button: `data: { disable_with: "Saving..." }` plus an `aria-busy` toggle on form submit.

The B12 person-picker dropdown: when "someone else" is picked, the Stimulus controller renders a `<select>` with "+ New person" as the top option, followed by every existing Person in the user's graph other than the will-maker themselves and the current spouse.

Controller-side: when `co_parent.existing_person_id` is set (not "new"), reuse the existing Person; when "new" or missing, create a new Person row.

### W2.9 — Login warning UX (C3 from spike)

`app/javascript/controllers/login_warning_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { hasOnboardingData: Boolean }

  confirmIfNeeded(event) {
    if (this.hasOnboardingDataValue) {
      const ok = window.confirm(
        "Logging in will discard the information you've entered during onboarding. Continue?"
      )
      if (!ok) event.preventDefault()
    }
  }
}
```

Apply to the "Log in instead" link on every onboarding view:

```erb
<%= link_to "Log in instead", mobile_login_path,
    data: {
      controller: "login-warning",
      "login-warning-has-onboarding-data-value": current_user.current_step.present?,
      action: "click->login-warning#confirmIfNeeded"
    } %>
```

### W2.10 — Cleanup job for abandoned anonymous Users

```ruby
# app/jobs/abandoned_anonymous_user_cleanup_job.rb
class AbandonedAnonymousUserCleanupJob < ApplicationJob
  queue_as :default

  def perform
    User.where(email_address: nil)
        .where("last_seen_at < ? OR (last_seen_at IS NULL AND created_at < ?)", 3.hours.ago, 3.hours.ago)
        .find_each(batch_size: 100, &:destroy)
  end
end
```

Schedule via solid_queue (or the existing job runner) to run hourly.

### W2.11 — Northern Ireland in location step

Identical to Wave 1 §1.2 (single-line view change). Already in Wave 1, listed here for completeness.

### W2.12 — Tests

**B9 race rescue test**

```ruby
it "handles RecordNotUnique race when two simultaneous family submissions create spouse" do
  # Simulate by creating one spouse then patching with new spouse fields concurrently.
  # Verify second request reloads and uses existing spouse Person.
end
```

**T3 step-child Parentage shape**

```ruby
it "creates correct Parentage when child is step-child of user, biological of partner" do
  # Walk through onboarding: married + 1 step-child + partner-as-biological-parent
  child = Person.last_child
  user_parentage = Parentage.find_by(parent_person: User.last.will_maker_person, child_person: child)
  partner_parentage = Parentage.find_by(parent_person: User.last.spouse_person, child_person: child)
  expect(user_parentage.kind).to eq "step"
  expect(partner_parentage.kind).to eq "biological"
end
```

**T4 anonymous-user-cannot-authenticate (CRITICAL SECURITY TEST)**

```ruby
RSpec.describe User, ".authenticate_by" do
  it "returns nil for anonymous Users" do
    User.create!  # anonymous; no email_address
    expect(User.authenticate_by(email_address: nil, password: "anything")).to be_nil
    expect(User.authenticate_by(email_address: "", password: "anything")).to be_nil
  end

  it "returns nil for registered Users with NULL password_digest" do
    user = User.create!(email_address: "test@example.com", password_digest: nil)
    expect(User.authenticate_by(email_address: "test@example.com", password: "x")).to be_nil
  end

  it "authenticates registered users with correct password" do
    user = User.create!(email_address: "test@example.com", password: "securepass1234")
    expect(User.authenticate_by(email_address: "test@example.com", password: "securepass1234")).to eq user
  end
end
```

**Login destroys anonymous User cascade**

```ruby
it "destroys anonymous User and their Persons / Wills on login" do
  anon = User.create!
  anon.people.create!(relationship_kind: "self", first_name: "Alice")
  anon_will = anon.draft_will

  registered = User.create!(email_address: "test@example.com", password: "securepass1234")

  post mobile_login_path, params: { email_address: "test@example.com", password: "securepass1234" }

  expect(User.find_by(id: anon.id)).to be_nil
  expect(Will.find_by(id: anon_will.id)).to be_nil
end
```

**Family-step happy path** — same as v2 [W2.8 happy_path_spec], with one tweak: the assertions check `User.last` instead of `OnboardingSession.last`.

**"Someone else" co-parent flow** — same as v2 [W2.8 §family_step_co_parent_spec], with the person-picker assertion: `co_parent.existing_person_id == "new"` triggers Person creation.

**Relationship-status-change cascade** (P2) — same as v2.

**Cohabitation `started_at` validation** (P4 / B4) — same as v2.

---

## Done-when (Wave 2)

1. ✓ Wave 1 still passes
2. ✓ All onboarding steps walk happily, creating Person + Parentage + Marriage rows + an empty draft Will against the User
3. ✓ Family step UX expansion: per-child co-parent question + person-picker UX + B9 button-disable + B12 dropdown for someone-else
4. ✓ AR encryption declared on PII; `Person.first.first_name` returns plaintext but `SELECT first_name FROM people LIMIT 1` returns ciphertext
5. ✓ All migrations applied; `onboarding_sessions` table dropped; `people`, `parentages`, `marriages`, `wills` tables exist; `users` has anonymous-lifecycle columns
6. ✓ Anonymous User created on first `/mobile/open` visit; cookie-based identity; 3-hour expiry
7. ✓ Login destroys anonymous User cascade; switches cookies; redirects to dashboard
8. ✓ Registration upgrades anonymous User in place; switches cookies; redirects to dashboard
9. ✓ Login warning UX prompts before discarding onboarding data
10. ✓ Cleanup job destroys abandoned anonymous Users + cascades
11. ✓ All tests pass: existing + B9 race + T3 step-child + T4 anonymous-cannot-authenticate + login-cascade + family-step happy path + someone-else flow + relationship-cascade + cohabitation date

## What this plan deliberately doesn't do

- No `Bequest`, `BequestAllocation`, `WillResidueAllocation`, `WillExecutor`, `WillWitness`, `Guardianship`, `Invitation`, `BeneficiaryGroup` tables. Epic 4+.
- No paper_trail / paranoia / postgres CHECK enums / cascade-delete test / re-encryption migration / encryption key management runbook. PRE_LAUNCH_TODO.
- No Trust, Business, Asset. Epic 5+.

## Estimated effort

| Workstream | Effort |
|---|---|
| W2.1 Schema migrations (8) | 1 day |
| W2.2 Encryption setup | 0.25 day |
| W2.3 User model refactor | 0.75 day |
| W2.4 BaseController refactor | 0.5 day |
| W2.5 OnboardingController refactor | 0.5 day |
| W2.6 SessionsController | 0.5 day |
| W2.7 AuthController | 0.5 day |
| W2.8 Family-step UX expansion | 2 days |
| W2.9 Login warning UX | 0.25 day |
| W2.10 Cleanup job | 0.25 day |
| W2.11 NI (already in Wave 1) | — |
| W2.12 Tests | 1.5 days |
| Verification + polish | 1 day |
| **Total** | **~9 days** |

Wave 1: 1 day (separate, ships first).

**Total Epic 2 + Epic 3 piece 3.2 (now subsumed)**: ~10 days.

Epic 3 remaining work (login form polish, session refresh, error instrumentation, push-dedup switch): ~3–4 days.

**Grand total Epic 2 + Epic 3**: ~13–14 days.
