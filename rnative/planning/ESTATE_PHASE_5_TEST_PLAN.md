# Estate Section — Phase 5 Test Plan: Form Improvements

Manual test plan for Phase 5 deliverables: **Auto-Save Drafts** (6 long forms) and **Validation Feedback** (all 11 forms).

**Prerequisite:** App running via `npx expo start`. Ideally clear AsyncStorage draft keys before testing (or use a fresh install). Complete at least "Your People" so the Estate section is accessible.

---

## Section A: `useDraftAutoSave` Hook — Core Behaviour

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| A1 | Draft saved after 2s debounce | Open Property entry (new). Type an address. Wait 3 seconds. Check console. | Console logs `[DraftAutoSave] Saved draft for draft:property:new`. |
| A2 | Draft NOT saved on first render | Open Property entry (new). Do NOT type anything. Wait 5 seconds. | No `Saved draft` log appears — blank initial state is not persisted. |
| A3 | Draft NOT saved during edit hydration | Open Property entry for an existing property (?id=xxx). Wait 5 seconds before touching any field. | No `Saved draft` log — `isLoaded` gate prevents saving during hydration. |
| A4 | Draft debounce resets on rapid edits | Open Property entry. Type "10" in address, then immediately type " Downing St" (within 2s). Wait 3 seconds. | Only ONE `Saved draft` log — the debounce timer reset on the second edit. |
| A5 | Draft persists across navigation | Open Property entry. Type address "Test House". Navigate back (don't save). Re-open Property entry (new). | Form auto-restores with "Test House" in address field. |
| A6 | Draft cleared on successful save | Fill in a valid property. Save. Check console. | Console logs `[DraftAutoSave] Discarded draft for draft:property:new`. |
| A7 | Separate drafts for new vs edit | Open Property entry (new), type "Draft A". Navigate back. Open existing property for edit, type changes. Navigate back. Re-open Property entry (new). | "Draft A" restored — the edit draft is stored under a different key (`draft:property:{id}` vs `draft:property:new`). |
| A8 | Draft key includes asset ID | Edit an existing property (id=abc123). Make a change. Wait 3 seconds. | Console logs `Saved draft for draft:property:abc123`. |

---

## Section B: Draft Restore UX — Warm Banner

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| B1 | Banner shown — new asset with draft | Create a draft (type in Property entry, navigate away). Re-open Property entry (new). | Cream/beige banner at top: *"Continue where you left off with your property"*. "Clear form" link visible on the right. |
| B2 | Banner shown — editing with changes | Edit an existing property, make a change, navigate away. Re-open the same edit. | Banner: *"Continue editing your property where you left off"*. "Revert changes" link visible. |
| B3 | Banner NOT shown — fresh form | Open Property entry (new) with no prior draft. | No banner visible. |
| B4 | Banner NOT shown — clean edit | Open an existing property for editing with no prior draft. | No banner visible. |
| B5 | "Clear form" resets to blank | On banner from B1, tap "Clear form". | All form fields reset to blank defaults. Banner disappears. |
| B6 | "Revert changes" restores last save | On banner from B2, tap "Revert changes". | Form fields revert to the last-saved state of the asset. Banner disappears. |
| B7 | Banner styling | Visual check on the banner. | Cream/beige background, brown text, rounded corners, discreet underlined link text. Warm, not clinical. |

---

## Section C: Auto-Save — All 6 Long Forms

Each long form should have the full draft auto-save + banner + discard pattern.

| # | Form | Category Label in Banner | Steps | Expected |
|---|------|-------------------------|-------|----------|
| C1 | Property entry | "property" | Type address, navigate away, return. | Draft restored. Banner: "Continue where you left off with your property". |
| C2 | Property trust-details | "trust details" | Type trust name, navigate away, return. | Draft restored. Banner: "Continue where you left off with your trust details". |
| C3 | Agricultural assets entry | "agricultural asset" | Type description, navigate away, return. | Draft restored with correct banner. |
| C4 | Private company shares entry | "shareholding" | Type company name, navigate away, return. | Draft restored with correct banner. |
| C5 | Life insurance entry | "life insurance policy" | Select provider, navigate away, return. | Draft restored with correct banner. |
| C6 | Bank accounts entry | "bank account" | Select bank, navigate away, return. | Draft restored with correct banner. |
| C7 | Draft cleared on save — agricultural | Fill valid agricultural asset, save. | No draft remains. Re-opening entry shows blank form. |
| C8 | Draft cleared on save — private company | Fill valid shareholding, save. | No draft remains. |
| C9 | Draft cleared on save — life insurance | Fill valid policy, save. | No draft remains. |
| C10 | Draft cleared on save — bank accounts | Fill valid account, save. | No draft remains. |

---

## Section D: Short Forms — NO Auto-Save

| # | Form | Steps | Expected |
|---|------|-------|----------|
| D1 | Investment entry | Type provider name, navigate away, return. | Form is blank. No banner. No draft saved. |
| D2 | Pensions entry | Type provider name, navigate away, return. | Form is blank. No banner. |
| D3 | Cryptocurrency entry | Select platform, navigate away, return. | Form is blank. No banner. |
| D4 | Important items entry | Type item name, navigate away, return. | Form is blank. No banner. |
| D5 | Assets through business entry | Select business, navigate away, return. | Form is blank. No banner. |

---

## Section E: `useFormValidation` Hook — Core Behaviour

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| E1 | No errors on initial render | Open Property entry (new). | No red borders, no "We'll need this" text visible anywhere. |
| E2 | Attention button visible | Open Property entry (new). Scroll to bottom. | "X little things left" button visible below Save button (Save is disabled). |
| E3 | Attention button count — accurate | Open Property entry (new). Fill in address, town, and country. Scroll to bottom. | Count decreases (fewer fields remaining). Button text updates in real-time. |
| E4 | Attention button — single field | Fill all required fields except one. | Button reads *"Just one more thing"*. |
| E5 | Attention button — multiple fields | Leave 3 required fields empty. | Button reads *"3 little things left"*. |
| E6 | Attention button disappears | Fill ALL required fields (including beneficiaries). | Attention button disappears entirely. Save button is enabled. |
| E7 | Trigger validation — scroll to top | Scroll to bottom of Property entry. Tap "X little things left". | Form scrolls to the top. |
| E8 | Trigger validation — errors appear | Tap "X little things left" on Property entry. | Red borders appear on all incomplete required fields. "We'll need this" text appears below highlighted fields. |
| E9 | Errors clear as fields filled | After triggering validation (E8), fill in the Address Line 1 field. | Red border and "We'll need this" text disappear from that field. Count in button updates. |
| E10 | Error styling — muted red | Visual check on highlighted fields. | Border is a muted/soft red (~70% opacity), not a screaming bold red. Text "We'll need this" in matching muted red. |

---

## Section F: Validation — All 11 Forms

Each form should have the attention button below Save with form-specific required field tracking.

| # | Form | Required Fields Tracked | Test |
|---|------|------------------------|------|
| F1 | Property entry | address1, townCity, country, ownershipType, estimatedValue, mortgageProvider, usage, propertyType, beneficiaries | Open blank form → attention button shows "9 little things left". Fill all → button disappears. |
| F2 | Property trust-details | trustName, trustType, trustRole | Open blank trust form → "3 little things left". |
| F3 | Agricultural assets | aprOwnershipStructure, assetType, assetDescription, hasDebtsEncumbrances | Open blank form → "4 little things left". |
| F4 | Private company shares | companyName | Open blank form → "Just one more thing". |
| F5 | Life insurance | provider, lifeAssured, sumInsured, policyType, heldInTrust, premiumStatus | Open blank form → "6 little things left". |
| F6 | Bank accounts | bankName, nonUkBankName (conditional) | Open blank form → "Just one more thing" (bankName). Select "Non UK Bank" → becomes "2 little things left". |
| F7 | Investment | provider, beneficiaries | Open blank form → "2 little things left". |
| F8 | Pensions | provider, pensionType, beneficiaryNominated | Open blank form → "3 little things left". |
| F9 | Cryptocurrency | platform | Open blank form → "Just one more thing". |
| F10 | Important items | title, beneficiaries, estimatedValue | Open blank form → "3 little things left". |
| F11 | Assets through business | businessId, assetType, assetDescription | Open blank form → "3 little things left" (or count depends on form state). |

---

## Section G: Validation + Draft Interaction

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| G1 | Draft restores, validation resets | Create a partial draft (only address filled). Navigate away. Return. | Draft restored. Attention button visible with correct count. No error styling (showErrors=false until triggered). |
| G2 | Trigger validation on restored draft | Restore a partial draft, then tap "X little things left". | Error highlights appear only on fields that are still empty. Filled fields from the draft are fine. |
| G3 | Discard draft, validation updates | Restore a draft. Tap "Clear form". | Form resets to blank. Attention button count increases (more fields empty). |
| G4 | Save clears both draft and errors | Fill all required fields. Save. Reopen. | Fresh form — no draft banner, no error highlights, full count on attention button. |

---

## Section H: Edge Cases

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| H1 | Rapid navigation — no crash | Open Property entry, type something, immediately tap Back, immediately reopen. Repeat 3 times. | No crash. Draft may or may not have saved depending on debounce timing. |
| H2 | App background/foreground | Open Property entry, type data. Send app to background. Bring back to foreground. | Form state preserved (React state). Draft should save if debounce timer had fired. |
| H3 | Two drafts coexist | Create a draft in Property entry (new). Also create a draft in Bank Accounts entry (new). Navigate to each. | Each restores its own draft independently. |
| H4 | Edit draft doesn't affect new draft | Create a draft for a new property. Then edit an existing property and create a draft. Return to new property entry. | New property draft is intact (different AsyncStorage key). |
| H5 | Attention button on trust-details | Navigate to Property trust-details via sandbox (no propertyId). | Attention button works. Counts trustName, trustType, trustRole. |
| H6 | Validation with conditional fields | On Property entry, validation tracks beneficiaries as required only when NOT trust-owned. Select trust-owned ownership. | Beneficiaries field no longer counts as required. Attention count adjusts. |
| H7 | DraftBanner visible prop | Banner shows only when `hasDraft || hasChanges`. Load a form with no draft and make no changes. | No banner visible. Make one change → banner appears with "Clear form". |

---

## Section I: Visual & UX Checks

| # | Test | Expected Result |
|---|------|-----------------|
| I1 | DraftBanner colour | Cream/beige background, brown text. Not white, not grey. Matches Kindling warm palette. |
| I2 | DraftBanner layout | Text on left, discreet link on right. Single row. Rounded corners. |
| I3 | Attention button styling | Ghost-style button below Save. Muted red text and border. Not bold, not screaming. |
| I4 | "We'll need this" text | Small, muted red, appears directly below the field with the error border. |
| I5 | Error border colour | Muted red (~70% opacity of destructive colour). Not full-intensity red. |
| I6 | Attention button position | Renders below the Save button, not above it. Centred horizontally. |
| I7 | Banner disappears after interaction | After tapping "Clear form" or "Revert changes", banner is immediately hidden. |
| I8 | Scroll to top animation | When tapping the attention button, scroll is smooth and animated (not a jump). |

---

## Test Coverage Summary

| Section | Count | Focus |
|---------|-------|-------|
| A: Draft hook core | 8 | Debounce, persistence, key naming |
| B: Draft banner UX | 7 | Banner copy, discard, styling |
| C: Long form drafts | 10 | All 6 forms + save cleanup |
| D: Short form no-draft | 5 | Confirm no auto-save on short forms |
| E: Validation hook core | 10 | Count, trigger, scroll, error gate |
| F: Validation all forms | 11 | Per-form required field counts |
| G: Draft + validation | 4 | Interaction between features |
| H: Edge cases | 7 | Rapid nav, coexistence, conditionals |
| I: Visual/UX | 8 | Styling, layout, colours |
| **Total** | **70** | |
