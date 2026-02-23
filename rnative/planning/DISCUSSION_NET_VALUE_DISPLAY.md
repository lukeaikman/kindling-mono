# Discussion: Net Value Display on Summary Cards

**Origin:** Agricultural Assets test L-5 (FAIL) — net value not reflected on summary cards with debts.

---

## The Bug

Two places show the wrong (gross) value:

1. **AssetCard** (`src/components/ui/AssetCard.tsx` line 35) — displays `asset.estimatedValue` instead of `asset.netValue`
2. **CategorySummaryScreen** (`src/components/screens/CategorySummaryScreen.tsx` lines 50-60) — `totalNet` only deducts mortgages for property assets, ignoring `netValue` for all other asset types

## The Fix (straightforward)

- AssetCard: use `asset.netValue ?? asset.estimatedValue ?? 0`
- CategorySummaryScreen: use `a.netValue ?? a.estimatedValue ?? 0` generically, with property mortgage as fallback

## The Open Question (from Elon's review)

If AssetCard shows the debt-adjusted net value, the user sees a number that doesn't match what they entered. For example:

- User enters estimated value: **£500,000**
- User enters debt: **£100,000**
- Card shows: **£400,000**

Is that clear enough? Or will users wonder why the number is different?

### Options

**A. Show net value only (simplest)**
Card displays £400,000. No explanation. Users who entered debts should understand.

**B. Show net value with "(net)" label**
Card displays "£400,000 (net)". Minimal extra context.

**C. Show both values**
Card displays "£400,000" with a subline like "£500,000 less £100,000 debts". More informative but adds visual weight.

**D. Show gross value on card, net value in totals only**
Card shows what the user entered (£500,000). Category total shows net. Matches mental model of "this is what I said it's worth" on the card, with the deduction applied at the summary level.

---

## Also Consider

- Does `getAssetSubline` already mention debts? If so, option A might be fine.
- This fix is generic — it affects ALL asset types that use `netValue`, not just agricultural assets.
- Property assets currently handle this via a separate mortgage deduction path in `totalNet`. Should that be unified to also use `netValue`?
