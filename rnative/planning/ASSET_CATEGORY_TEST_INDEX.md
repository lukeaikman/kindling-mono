# Asset Category Testing Index

**Purpose:** Track testing progress across all asset category entry forms.
**Date created:** 2026-02-17

---

## Testing Status

| # | Category | Entry Form | Trust Path | Test Plan | Status |
|---|----------|-----------|------------|-----------|--------|
| 1 | Property | `app/bequeathal/property/entry.tsx` | Yes — `trust-details.tsx` | [TRUST_DATA_MODEL_TEST_PLAN.md](./TRUST_DATA_MODEL_TEST_PLAN.md) | Tested (51 manual + 58 Jest) |
| 2 | Bank Accounts | `app/bequeathal/bank-accounts/entry.tsx` | No | [TEST_BANK_ACCOUNTS.md](./TEST_BANK_ACCOUNTS.md) | Not started |
| 3 | Pensions | `app/bequeathal/pensions/entry.tsx` | No | [TEST_PENSIONS.md](./TEST_PENSIONS.md) | Not started |
| 4 | Investments | `app/bequeathal/investment/entry.tsx` | No | [TEST_INVESTMENTS.md](./TEST_INVESTMENTS.md) | Not started |
| 5 | Life Insurance | `app/bequeathal/life-insurance/entry.tsx` | Partial (heldInTrust field) | [TEST_LIFE_INSURANCE.md](./TEST_LIFE_INSURANCE.md) | Not started |
| 6 | Private Company Shares | `app/bequeathal/private-company-shares/entry.tsx` | No | [TEST_PRIVATE_COMPANY_SHARES.md](./TEST_PRIVATE_COMPANY_SHARES.md) | Not started |
| 7 | Assets Held Through Business | `app/bequeathal/assets-held-through-business/entry.tsx` | No | [TEST_ASSETS_HELD_THROUGH_BUSINESS.md](./TEST_ASSETS_HELD_THROUGH_BUSINESS.md) | Not started |
| 8 | Important Items | `app/bequeathal/important-items/entry.tsx` | No | [TEST_IMPORTANT_ITEMS.md](./TEST_IMPORTANT_ITEMS.md) | Not started |
| 9 | Cryptocurrency | `app/bequeathal/crypto-currency/entry.tsx` | No | [TEST_CRYPTOCURRENCY.md](./TEST_CRYPTOCURRENCY.md) | Not started |
| 10 | Agricultural Assets | `app/bequeathal/agricultural-assets/entry.tsx` | Partial (trust fields in form) | [TEST_AGRICULTURAL_ASSETS.md](./TEST_AGRICULTURAL_ASSETS.md) | Not started |

---

## Notes

- **Property** is the only category with a full separate trust-details screen. Its test plan is comprehensive and lives in its own file.
- **Life Insurance** and **Agricultural Assets** have trust-related fields embedded in their entry forms but no separate trust-details screen.
- Each test plan file will be built out when we turn attention to that category.
- Common patterns to test across all categories: field persistence, draft auto-save, edit/re-open round-trip, validation, dashboard summary integration.
