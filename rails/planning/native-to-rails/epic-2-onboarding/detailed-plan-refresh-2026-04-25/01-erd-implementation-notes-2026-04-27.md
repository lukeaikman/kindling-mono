# ERD implementation notes — Epic 2 (Version A, **NO LONGER IN USE** — 2026-04-27)

> **⚠️ This ERD is no longer the canonical shape**. Per the v3 plan ([08-dhh-v3-final-merged-2026-04-27.md](08-dhh-v3-final-merged-2026-04-27.md)) and the Epic 3 piece 3.2 consolidation spike, Epic 2 Wave 2 ships against the unified shape directly — the same shape as Epic 3's [Version B ERD](../../epic-3-auth/01-erd-target-2026-04-27.mmd).
>
> The transitional Version A (which retained `OnboardingSession` as a separate entity) is preserved here for historical context only. Anyone implementing Epic 2 Wave 2 should reference Version B.

Companion to [`01-erd-2026-04-27.mmd`](01-erd-2026-04-27.mmd). Captures schema-level details that don't fit in Mermaid's notation: column precisions, CHECK / UNIQUE constraints, encryption decisions, and migration sequencing.

## Money column precisions

All `decimal` columns in the ERD use the following Postgres precisions:

| Concept | Columns | Precision |
|---|---|---|
| GBP amounts | `Asset.estimated_value`, `Asset.net_value`, `Property.mortgage_balance`, `Pension.monthly_contribution`, `Pension.employer_contribution`, `LifeInsurance.sum_insured`, `LifeInsurance.monthly_premium`, `Debt.balance_outstanding`, `BequestAllocation.amount`, `Business.estimated_value` | `decimal(15, 2)` |
| Percentages | `Property.ownership_percentage`, `PrivateCompanyShares.percentage_ownership`, `BusinessHolding.business_ownership_percentage`, `BequestAllocation.percentage`, `WillResidueAllocation.percentage`, `TrustBeneficiary.percentage` | `decimal(5, 2)` |
| Units / quantity | `BusinessHolding.number_of_units` | `decimal(15, 2)` |
| Crypto quantity | `Cryptocurrency.quantity` | `decimal(20, 8)` |

Reasoning: GBP estate values can hit 8 figures; `decimal(15, 2)` covers up to £999,999,999,999.99. Percentages need 2dp for splits like 33.33%. Crypto needs more decimals (BTC has 8 decimal precision).

## UNIQUE constraints

Not visible in Mermaid — apply in migrations:

- `Will`: `UNIQUE (user_id, version)` — prevents concurrent version-collision bugs
- `Will`: partial unique index `WHERE status = 'active'` on `(user_id)` — exactly one active will per user
- `Marriage`: `UNIQUE (will_maker_person_id, partner_person_id)` — no duplicate marriage rows for the same pair
- `Marriage`: partial unique index `WHERE phase = 'active'` on `(will_maker_person_id)` — at most one current marriage
- `Parentage`: `UNIQUE (parent_person_id, child_person_id)` — no duplicate parentage rows
- `BequestAllocation`: `UNIQUE (bequest_id, position)` — stable sort order per bequest
- `WillResidueAllocation`: `UNIQUE (will_id, position)` — same for residue
- `TrustSettlor`, `TrustBeneficiary`, `TrustTrustee`: `UNIQUE (trust_id, person_id)` on each
- `Invitation`: partial unique index `WHERE status = 'accepted'` on `(sender_user_id, invitee_person_id, role_type)` — one accepted invitation per person+role

## CHECK constraints

- `Person`: `CHECK (NOT (user_id IS NULL AND onboarding_session_id IS NULL))` — every Person belongs to a graph or a draft
- `Marriage`: `CHECK (will_maker_person_id != partner_person_id)` — can't be married to yourself

For string enum columns (`Will.status`, `Marriage.kind`/`phase`, `Parentage.kind`, `Person.relationship_kind`, `Invitation.role_type`/`status`, `Asset.held_in_trust`, all `ownership_type` columns, `Trust.trust_type`, etc.):
- v1: enforce at controller / model layer via ActiveRecord enums
- Pre-launch: tighten with Postgres CHECK constraints or native enums (tracked in `PRE_LAUNCH_TODO`)

## Active Record encryption modes

For v1 internal-testing, default everything to **deterministic** encryption. Lock down per-column before public launch (audit tracked in `PRE_LAUNCH_TODO`).

When the audit runs, expected outcomes:

| Column | Mode | Reason |
|---|---|---|
| `User.email_address`, `Person.email`, `Invitation.recipient_email` | deterministic | needed for lookup / dedupe |
| `Person.phone`, `Invitation.recipient_phone` | non-deterministic | not searched directly |
| `Person.first_name`, `last_name`, `middle_names`, `date_of_birth` | non-deterministic | privacy |
| Address fields, `account_number`, `policy_number`, `sort_code` | non-deterministic | privacy |

## Circular FK creation order

`User.will_maker_person_id` and `Person.user_id` reference each other. In DB schema both must be nullable; transactional creation enforces invariants:

```ruby
User.transaction do
  user = User.create!(email_address: ..., password: ...)
  person = Person.create!(user_id: user.id, ...)
  user.update!(will_maker_person_id: person.id)
end
```

Application validates "User has will_maker_person_id post-creation" and "Person has user_id post-creation" via after-commit callbacks or explicit `valid?(:registered)` contexts.

## Cascade-delete strategy

Required `dependent: :destroy` chains (must be tested with one User-destroy integration spec):

- `User` → Sessions, ApiSessions, Devices, Persons (graph), Wills, Assets, BeneficiaryGroups, Trusts, Businesses, Invitations sent
- `Person` → Marriages (as either side), Parentages (as either side), WillExecutor / WillWitness / Guardianship rows referencing them, Invitations as invitee, BequestAllocations / WillResidueAllocations where recipient is this Person, TrustSettlor / TrustBeneficiary / TrustTrustee rows
- `OnboardingSession` → Persons (with `onboarding_session_id` set), Devices (pre-auth)
- `Will` → Bequests, BequestAllocations (via Bequests), WillExecutor, WillWitness, Guardianship, WillResidueAllocation
- `Asset` → delegated record (Property/BankAccount/etc.), Bequests, BequestAllocations (via Bequests)
- `Bequest` → BequestAllocations
- `Marriage`, `Parentage` cascade only on Person destroy via the Person side
- `Invitation` → does NOT cascade-destroy WillExecutor/Guardianship; sets `invitation_id = NULL` on those (history preserved)

GDPR right-to-erasure: `User.destroy` must remove every PII trace including Active Storage attachments. Integration test required before public launch.

## Polymorphic association safety

`BequestAllocation.recipient` and `WillResidueAllocation.recipient` are polymorphic (`Person | BeneficiaryGroup`). Postgres can't FK-enforce, so:

- Both `Person` and `BeneficiaryGroup` models declare `has_many :bequest_allocations, as: :recipient, dependent: :destroy`
- Same for `:will_residue_allocations`
- Required test: destroy a Person who appears as recipient in N allocations; verify all allocations are gone

`Asset.assetable` (delegated_types) has the same concern and same mitigation pattern.

## Index strategy

All FKs indexed (Postgres doesn't auto-index FKs). Hot-path composite indexes:

- `Person(user_id)`, `Person(onboarding_session_id)` (separate single-column indexes)
- `Asset(user_id)`, `Asset(assetable_type, assetable_id)` (composite)
- `Bequest(will_id, asset_id)` (composite)
- `Marriage(will_maker_person_id)`, `Marriage(partner_person_id)` (separate)
- `Parentage(parent_person_id)`, `Parentage(child_person_id)` (separate)
- `Will(user_id, status)` (composite for active-will lookup)
- `Invitation(sender_user_id, invitee_person_id, role_type)` (composite for "have they accepted?" lookup)
- `Invitation(token)` UNIQUE (already)
- `OnboardingSession(token)` UNIQUE (already)
- `BequestAllocation(recipient_type, recipient_id)` composite (polymorphic reverse-lookup)

## Marked-for-cleanup notes

- `Trust.created_in_context` — UI-routing metadata leaking into the schema. Cleanup decision to make when Trust epic activates.

## What was dropped from earlier ERD revisions

- `Person.country` — overlapping with `country_of_residence`. Address-country can be added back when Person address collection lands in a future epic.
- `BeneficiaryGroup.is_active` — half-baked soft-delete inconsistent with rest of schema. Replaced by consistent `paranoia`/`deleted_at` pattern (tracked in `PRE_LAUNCH_TODO`).
- `OnboardingSession.relationship_status`, `OnboardingSession.has_children` — flow-control flags duplicating Marriage / Parentage row existence.
- `Person.capacity_status` — superseded by explicit `disabled` + `lacks_mental_capacity` booleans.
