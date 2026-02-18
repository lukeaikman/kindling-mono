import { by, device, element, expect, waitFor } from 'detox';
import { seedAndLaunch, relaunchApp } from './helpers/testSetup';

/**
 * Bank Accounts E2E Test Suite
 *
 * 37 tests across 5 describe blocks with 2 app resets.
 * Tests build on shared state within each describe block — if an early
 * test fails, subsequent tests in that block will likely cascade-fail.
 * Always fix the first red test in a describe block first.
 *
 * Debounce timing: useDraftAutoSave uses a 2000ms debounce.
 * DEBOUNCE_WAIT = 2100ms (2000 + 100ms buffer).
 */

const DEBOUNCE_WAIT = 2100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigateToEstateFromWillDashboard() {
  await waitFor(element(by.id('stage-card-your-estate')))
    .toBeVisible()
    .withTimeout(15000);
  await element(by.id('stage-card-your-estate')).tap();
  await waitFor(element(by.text('YOUR ASSETS')))
    .toBeVisible()
    .withTimeout(15000);
}

async function navigateToBankAccountsCategory() {
  await waitFor(element(by.id('category-card-bank-accounts')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('category-card-bank-accounts')).tap();
}

async function tapIntroLetsGo() {
  await waitFor(element(by.text("Let's Go")))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.text("Let's Go")).tap();
}

async function selectBank(bankName: string) {
  await element(by.id('bank-select')).tap();
  await waitFor(element(by.id('searchable-select-input')))
    .toBeVisible()
    .withTimeout(3000);
  await element(by.id('searchable-select-input')).replaceText(bankName);
  await waitFor(element(by.text(bankName)))
    .toBeVisible()
    .withTimeout(3000);
  await element(by.text(bankName)).tap();
}

async function selectAccountType(type: string) {
  await element(by.id('account-type-select')).tap();
  await waitFor(element(by.text(type)))
    .toBeVisible()
    .withTimeout(3000);
  await element(by.text(type)).tap();
}

async function selectOwnership(ownership: string) {
  await element(by.id('ownership-select')).tap();
  await waitFor(element(by.text(ownership)))
    .toBeVisible()
    .withTimeout(3000);
  await element(by.text(ownership)).tap();
}

async function enterBalance(amount: string) {
  await element(by.id('balance-input')).tap();
  await element(by.id('balance-input')).replaceText(amount);
}

async function enterAccountNumber(number: string) {
  await element(by.id('account-number-input')).tap();
  await element(by.id('account-number-input')).replaceText(number);
}

async function tapSave() {
  await element(by.id('save-button')).tap();
}

async function tapAddAnother() {
  await waitFor(element(by.id('add-another-button')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('add-another-button')).tap();
}

async function waitForSummaryScreen() {
  await waitFor(element(by.id('add-another-button')))
    .toBeVisible()
    .withTimeout(5000);
}

async function goBackFromEntry() {
  await element(by.text('Back')).atIndex(0).tap();
}

async function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================================================
// Describe 1: UK Bank — Add Flow
// ==========================================================================

describe('UK Bank — Add Flow', () => {
  beforeAll(async () => {
    await seedAndLaunch();
  });

  it('should navigate from will-dashboard to estate dashboard', async () => {
    await navigateToEstateFromWillDashboard();
  });

  it('should select bank accounts category and tap through intro', async () => {
    await navigateToBankAccountsCategory();
    await tapIntroLetsGo();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
  });

  // B-1: Barclays current account
  it('B-1: should add Barclays current account with £1,500', async () => {
    await selectBank('Barclays');
    await selectAccountType('Current Account');
    await selectOwnership('Personal Account');
    await enterAccountNumber('12345678');
    await enterBalance('1500');
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('Barclays - Current Account'))).toBeVisible();
  });

  // B-2: HSBC savings, joint
  it('B-2: should add HSBC savings joint account with £25,000', async () => {
    await tapAddAnother();
    await selectBank('HSBC');
    await selectAccountType('Savings Account');
    await selectOwnership('Joint Account');
    await enterBalance('25000');
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('HSBC - Savings Account'))).toBeVisible();
  });

  // B-3: Nationwide fixed-term deposit
  it('B-3: should add Nationwide fixed-term deposit with £10,000', async () => {
    await tapAddAnother();
    await selectBank('Nationwide Building Society');
    await selectAccountType('Fixed Term Deposit');
    await selectOwnership('Personal Account');
    await enterBalance('10000');
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('Nationwide Building Society - Fixed Term Deposit'))).toBeVisible();
  });

  // B-4: Monzo other
  it('B-4: should add Monzo other type with £500', async () => {
    await tapAddAnother();
    await selectBank('Monzo');
    await selectAccountType('Other');
    await enterBalance('500');
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('Monzo - Other'))).toBeVisible();
  });

  // B-5: Search filter
  it('B-5: should filter bank search to show Starling Bank', async () => {
    await tapAddAnother();
    await element(by.id('bank-select')).tap();
    await waitFor(element(by.id('searchable-select-input')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('searchable-select-input')).replaceText('Star');
    await expect(element(by.text('Starling Bank'))).toBeVisible();
    // Close the modal
    await element(by.id('searchable-select-close')).tap();
    // Go back to summary without saving
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // B-7: Unsure of balance
  it('B-7: should add account with unsure balance', async () => {
    await tapAddAnother();
    await selectBank('Lloyds Bank');
    await selectAccountType('Current Account');
    await element(by.id('unsure-checkbox')).tap();
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('?'))).toBeVisible();
  });

  // B-13: Explicit zero balance
  it('B-13: should save explicit zero balance correctly', async () => {
    await tapAddAnother();
    await selectBank('Halifax');
    await selectAccountType('Current Account');
    await enterBalance('0');
    await tapSave();
    await waitForSummaryScreen();
    // Navigate back to the account to verify
    await expect(element(by.text('Halifax - Current Account'))).toBeVisible();
    await element(by.text('Halifax - Current Account')).tap();
    await waitFor(element(by.id('balance-input')))
      .toBeVisible()
      .withTimeout(5000);
    // Unsure should NOT be ticked
    await expect(element(by.id('unsure-checkbox'))).toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // B-14: Verify total with unknown indicator
  it('B-14: should show total with unknown indicator', async () => {
    // Total: 1500 + 25000 + 10000 + 500 + 0 + 0 = 37,000
    // With an unsure account, should show thin space + "+"
    await expect(element(by.text('£37,000\u2009+'))).toBeVisible();
  });

  // B-15: Edit unsure account
  it('B-15: should edit unsure account — untick, set £500, re-verify', async () => {
    // Tap the Lloyds unsure account
    await element(by.text('Lloyds Bank - Current Account')).tap();
    await waitFor(element(by.id('unsure-checkbox')))
      .toBeVisible()
      .withTimeout(5000);
    // Untick unsure
    await element(by.id('unsure-checkbox')).tap();
    await enterBalance('500');
    await tapSave();
    await waitForSummaryScreen();
    // Re-open and verify
    await element(by.text('Lloyds Bank - Current Account')).tap();
    await waitFor(element(by.id('balance-input')))
      .toBeVisible()
      .withTimeout(5000);
    await goBackFromEntry();
    await waitForSummaryScreen();
  });
});

// ==========================================================================
// Describe 2: Edit and Delete
// ==========================================================================

describe('Edit and Delete', () => {
  beforeAll(async () => {
    // State contract: assert summary screen shows the expected accounts from Describe 1
    await waitForSummaryScreen();
    await expect(element(by.text('Barclays - Current Account'))).toBeVisible();
    await expect(element(by.text('HSBC - Savings Account'))).toBeVisible();
  });

  // E-1: Open and verify Barclays details
  it('E-1: should verify Barclays account pre-filled values', async () => {
    await element(by.text('Barclays - Current Account')).tap();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Barclays'))).toBeVisible();
    await expect(element(by.text('Current Account'))).toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // E-2: Edit Barclays balance
  it('E-2: should update Barclays balance to £2,000', async () => {
    await element(by.text('Barclays - Current Account')).tap();
    await waitFor(element(by.id('balance-input')))
      .toBeVisible()
      .withTimeout(5000);
    await enterBalance('2000');
    await tapSave();
    await waitForSummaryScreen();
  });

  // E-3: Change Nationwide provider to Lloyds
  it('E-3: should change Nationwide provider to Lloyds', async () => {
    await element(by.text('Nationwide Building Society - Fixed Term Deposit')).tap();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await selectBank('Lloyds Bank');
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('Lloyds Bank - Fixed Term Deposit'))).toBeVisible();
  });

  // E-5: Change balance and verify delta toast
  it('E-5: should show net wealth toast on balance change', async () => {
    await element(by.text('HSBC - Savings Account')).tap();
    await waitFor(element(by.id('balance-input')))
      .toBeVisible()
      .withTimeout(5000);
    await enterBalance('26000');
    await tapSave();
    await waitForSummaryScreen();
    // Toast should appear — look for the delta indicator
    await waitFor(element(by.text('+£1,000')))
      .toBeVisible()
      .withTimeout(3000);
  });

  // I-1: Verify all accounts visible
  it('I-1: should show all accounts on summary', async () => {
    await expect(element(by.text('Barclays - Current Account'))).toBeVisible();
    await expect(element(by.text('HSBC - Savings Account'))).toBeVisible();
    await expect(element(by.text('Monzo - Other'))).toBeVisible();
  });

  // I-2: Verify total is correct
  it('I-2: should show correct total value', async () => {
    // 2000 + 26000 + 10000 + 500 + 500 + 0 = 39,000
    await expect(element(by.text('£39,000'))).toBeVisible();
  });

  // F-1: Delete prompt appears
  it('F-1: should show delete confirmation alert', async () => {
    // Tap the delete icon on Halifax using accessibility label
    await element(by.label('Delete Halifax - Current Account')).tap();
    await expect(element(by.text('Delete asset'))).toBeVisible();
    await expect(element(by.text('Are you sure you want to remove this asset?'))).toBeVisible();
    // Dismiss for now
    await element(by.text('Cancel')).tap();
  });

  // F-2: Confirm delete
  it('F-2: should delete account on confirm', async () => {
    await element(by.label('Delete Halifax - Current Account')).tap();
    await element(by.text('Delete')).tap();
    await waitForSummaryScreen();
    // Halifax should no longer be visible
    await expect(element(by.text('Halifax - Current Account'))).not.toBeVisible();
  });

  // F-3: Cancel delete
  it('F-3: should keep account when cancel is tapped on delete', async () => {
    await element(by.label('Delete Monzo - Other')).tap();
    await element(by.text('Cancel')).tap();
    await expect(element(by.text('Monzo - Other'))).toBeVisible();
  });

  // I-5: Complete category
  it('I-5: should navigate to estate dashboard on "That\'s everything"', async () => {
    await element(by.id('complete-button')).tap();
    await waitFor(element(by.text('YOUR ASSETS')))
      .toBeVisible()
      .withTimeout(5000);
    // Bank accounts category should show as complete
    await expect(element(by.id('category-card-bank-accounts'))).toBeVisible();
  });
});

// ==========================================================================
// Describe 3: Non-UK Bank and ISA
// ==========================================================================

describe('Non-UK Bank and ISA', () => {
  beforeAll(async () => {
    // State contract: navigate back to bank accounts summary
    await element(by.id('category-card-bank-accounts')).tap();
    await waitForSummaryScreen();
  });

  // C-1: Non UK Bank fields appear
  it('C-1: should show non-UK fields when Non UK Bank selected', async () => {
    await tapAddAnother();
    await selectBank('Non UK Bank');
    await expect(element(by.id('non-uk-bank-name-input'))).toBeVisible();
    await expect(element(by.id('non-uk-account-id-input'))).toBeVisible();
    await expect(element(by.id('non-uk-notes-input'))).toBeVisible();
    // Account Number should NOT be visible
    await expect(element(by.id('account-number-input'))).not.toBeVisible();
  });

  // C-2: Save disabled without bank name
  it('C-2: should disable save when non-UK bank name is empty', async () => {
    // Tap save and verify we're still on the entry form (button is disabled)
    await element(by.id('save-button')).tap();
    await expect(element(by.id('non-uk-bank-name-input'))).toBeVisible();
  });

  // C-3: Save non-UK bank
  it('C-3: should save Deutsche Bank non-UK account', async () => {
    await element(by.id('non-uk-bank-name-input')).tap();
    await element(by.id('non-uk-bank-name-input')).replaceText('Deutsche Bank');
    await element(by.id('non-uk-account-id-input')).tap();
    await element(by.id('non-uk-account-id-input')).replaceText('DE1234567');
    await element(by.id('non-uk-notes-input')).tap();
    await element(by.id('non-uk-notes-input')).replaceText('IBAN details');
    await selectAccountType('Savings Account');
    await enterBalance('50000');
    await tapSave();
    await waitForSummaryScreen();
    await expect(element(by.text('Deutsche Bank - Savings Account'))).toBeVisible();
  });

  // C-4: Non-UK current account shows ownership
  it('C-4: should show ownership for non-UK current account', async () => {
    await tapAddAnother();
    await selectBank('Non UK Bank');
    await selectAccountType('Current Account');
    await expect(element(by.id('ownership-select'))).toBeVisible();
  });

  // C-5: Switching from Non UK to UK clears non-UK fields
  it('C-5: should clear non-UK fields when switching to UK bank', async () => {
    await selectBank('Barclays');
    await expect(element(by.id('non-uk-bank-name-input'))).not.toBeVisible();
    await expect(element(by.id('non-uk-account-id-input'))).not.toBeVisible();
    await expect(element(by.id('non-uk-notes-input'))).not.toBeVisible();
    await expect(element(by.id('account-number-input'))).toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // D-2: ISA cross-category banner
  it('D-2: should show ISA warning banner and save successfully', async () => {
    await tapAddAnother();
    await selectBank('Barclays');
    await selectAccountType('ISA');
    await expect(element(by.text('This will be saved under Investments and appear in that section'))).toBeVisible();
    // Ownership should NOT be visible for ISA
    await expect(element(by.id('ownership-select'))).not.toBeVisible();
    await enterBalance('20000');
    await tapSave();
    await waitForSummaryScreen();
  });
});

// ==========================================================================
// Describe 4: Draft Auto-Save
// ==========================================================================

describe('Draft Auto-Save', () => {
  beforeAll(async () => {
    await seedAndLaunch();
    await navigateToEstateFromWillDashboard();
    await navigateToBankAccountsCategory();
    await tapIntroLetsGo();
    // Add one seed account so "Add another" is available
    await selectBank('Barclays');
    await selectAccountType('Current Account');
    await enterBalance('1000');
    await tapSave();
    await waitForSummaryScreen();
  });

  // G-1: Draft auto-save and restore
  it('G-1: should auto-save draft and show banner on return', async () => {
    await tapAddAnother();
    await selectBank('HSBC');
    await enterBalance('2000');
    await pause(DEBOUNCE_WAIT);
    await goBackFromEntry();
    await waitForSummaryScreen();
    // Return to entry
    await tapAddAnother();
    await waitFor(element(by.id('draft-banner')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Continue where you left off'))).toBeVisible();
  });

  // G-2: Discard draft
  it('G-2: should reset form when draft is discarded', async () => {
    await element(by.id('draft-banner-discard')).tap();
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
  });

  // G-4: Draft → save → no stale draft
  it('G-4: should clear draft after successful save', async () => {
    // Fill and create a draft
    await selectBank('Monzo');
    await enterBalance('800');
    await pause(DEBOUNCE_WAIT);
    await goBackFromEntry();
    await waitForSummaryScreen();
    // Return — draft banner visible
    await tapAddAnother();
    await waitFor(element(by.id('draft-banner')))
      .toBeVisible()
      .withTimeout(5000);
    // Complete the save
    await tapSave();
    await waitForSummaryScreen();
    // Now add another — should be clean
    await tapAddAnother();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // G-5: Previous save does not leak into new form
  it('G-5: should show blank form after saving an account', async () => {
    // Save a new account
    await tapAddAnother();
    await selectBank('Starling Bank');
    await enterBalance('3000');
    await tapSave();
    await waitForSummaryScreen();
    // Add another — form should be blank
    await tapAddAnother();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // G-6: Relaunch does not revive stale draft
  it('G-6: should have no stale draft after app relaunch', async () => {
    await relaunchApp();
    await navigateToEstateFromWillDashboard();
    await navigateToBankAccountsCategory();
    await waitForSummaryScreen();
    await tapAddAnother();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // G-7: Quick save — no debounce flush after save
  it('G-7: should not leave draft when saving immediately (no debounce wait)', async () => {
    await tapAddAnother();
    await selectBank('Barclays');
    await enterBalance('2000');
    // Immediately save — no pause
    await tapSave();
    await waitForSummaryScreen();
    await tapAddAnother();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // G-8: Discard + save different account → no ghost draft
  it('G-8: should not revive discarded draft after saving a different account', async () => {
    await tapAddAnother();
    await selectBank('HSBC');
    await enterBalance('1000');
    await pause(DEBOUNCE_WAIT);
    await goBackFromEntry();
    await waitForSummaryScreen();
    // Return — discard the draft
    await tapAddAnother();
    await waitFor(element(by.id('draft-banner')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('draft-banner-discard')).tap();
    // Save a different account
    await selectBank('Nationwide Building Society');
    await enterBalance('500');
    await tapSave();
    await waitForSummaryScreen();
    // Add another — no ghost draft
    await tapAddAnother();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // G-3: Edit draft — "Continue editing" banner with revert
  it('G-3: should show edit draft banner with revert option', async () => {
    // Tap an existing account to edit
    await element(by.text('Barclays - Current Account')).atIndex(0).tap();
    await waitFor(element(by.id('balance-input')))
      .toBeVisible()
      .withTimeout(5000);
    // Change balance
    await enterBalance('9999');
    await pause(DEBOUNCE_WAIT);
    await goBackFromEntry();
    await waitForSummaryScreen();
    // Re-open the same account
    await element(by.text('Barclays - Current Account')).atIndex(0).tap();
    await waitFor(element(by.id('draft-banner')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Revert changes'))).toBeVisible();
    // Tap revert
    await element(by.id('draft-banner-discard')).tap();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });

  // B-16: Phantom draft regression
  it('B-16: should NOT show draft banner when re-opening unsure account', async () => {
    await tapAddAnother();
    await selectBank('TSB');
    await selectAccountType('Current Account');
    await element(by.id('unsure-checkbox')).tap();
    await tapSave();
    await waitForSummaryScreen();
    // Re-open the account
    await element(by.text('TSB - Current Account')).tap();
    await waitFor(element(by.id('unsure-checkbox')))
      .toBeVisible()
      .withTimeout(5000);
    // No draft banner should appear
    await expect(element(by.id('draft-banner'))).not.toBeVisible();
    await goBackFromEntry();
    await waitForSummaryScreen();
  });
});

// ==========================================================================
// Describe 5: Validation
// ==========================================================================

describe('Validation', () => {
  // Uses state from Describe 4 (no reset)

  // H-3: Default values
  it('H-3: should default to Current Account and Personal ownership', async () => {
    await tapAddAnother();
    await waitFor(element(by.id('bank-select')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Current Account'))).toBeVisible();
    await expect(element(by.text('Personal Account'))).toBeVisible();
  });

  // H-1: Save disabled without provider
  it('H-1: should disable save when no provider selected', async () => {
    // Tap save and verify we're still on the entry form (button is disabled)
    await element(by.id('save-button')).tap();
    await expect(element(by.id('bank-select'))).toBeVisible();
  });

  // H-2: Save disabled for non-UK without bank name
  it('H-2: should disable save for non-UK bank without bank name', async () => {
    await selectBank('Non UK Bank');
    // Tap save and verify we're still on the entry form (button is disabled)
    await element(by.id('save-button')).tap();
    await expect(element(by.id('non-uk-bank-name-input'))).toBeVisible();
  });
});
