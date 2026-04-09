# Agricultural Assets — Issues from Manual Testing

Extracted from `TEST_AGRICULTURAL_ASSETS.md` — all non-straight-pass results.

---

## Issue 1: Remove "Not sure" ownership option (B-6) — RESOLVED

**Test:** B-6 — Not sure ownership
**Result:** User comment: "Let's remove this option - if you're not sure who/how it's owned, how do you know you own it!"
**Resolution:** Removed `'not-sure'` from ownership options and type union. Test G-7 (not-sure BPR) removed and subsequent tests renumbered.

---

## Issue 2: Trust type field — business logic question (B-4) — RESOLVED

**Test:** B-4 — Trust ownership
**Result:** Pass, but user asks: "Should this not be a drop down of trust type, then role? BUSINESS LOGIC QUESTION"
**Resolution:** Dropped the free-text `aprTrustType` field entirely. Replaced with an `InformationCard` that reads: "Trust-held agricultural assets need specialist review. Our estate planners will review this with you once all your assets are entered." A backend TODO was added to flag trust-held assets for manual review.

---

## Issue 3: Validation attention styling not implemented (K-5) — RESOLVED

**Test:** K-5 — Validation attention trigger
**Result:** FAIL — attention styling (red border) missing on invalid fields.
**Resolution:** Wired `error` props from `useFormValidation` (`fieldErrors`) to all form components: `RadioGroup` (ownership, debts), `SearchableSelect` (asset type), and `Input` (description). Red border highlighting now appears on invalid fields when validation is triggered, matching other asset categories.

---

## Issue 4: Net value not reflected on summary card with debts (L-5) — RESOLVED

**Test:** L-5 — Net value reflects debts
**Result:** FAIL — summary card showed gross value, not net.
**Resolution:** Fixed in three places:
1. `AssetCard.tsx` — now displays `asset.netValue` as the primary figure, with gross shown conditionally via eye toggle.
2. `CategorySummaryScreen.tsx` — `totalNet` calculation now prioritises `asset.netValue`, with summary card showing net as headline and gross as toggleable subtext.
3. `estate-dashboard.tsx` + `willProgress.ts` — `getEstateNetValue()` and per-category net calculations now use `asset.netValue` when available, fixing estate dashboard totals.

---

## Summary

| # | Issue | Severity | Type | Status |
|---|-------|----------|------|--------|
| 1 | Remove "Not sure" ownership option | Low | UX change | Resolved |
| 2 | Trust type — replaced with specialist review notice | Medium | Business logic decision | Resolved |
| 3 | Validation attention styling missing | Medium | Bug — parity with other categories | Resolved |
| 4 | Net value not shown on summary cards | High | Bug — affects user-facing totals | Resolved |
