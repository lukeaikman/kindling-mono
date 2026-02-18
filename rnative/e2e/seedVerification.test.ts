import { by, element, waitFor } from 'detox';
import { seedAndLaunch } from './helpers/testSetup';

/**
 * A5: Seed Pipeline Verification
 *
 * Validates that the Detox seed state mechanism works end-to-end:
 * seedAndLaunch() → AsyncStorage is pre-populated → SplashScreen bypasses
 * auth → app lands on will-dashboard.
 *
 * If this fails, none of the bank account E2E tests will work.
 */
describe('Seed Pipeline Verification', () => {
  beforeAll(async () => {
    await seedAndLaunch();
  });

  it('should seed state and land on will-dashboard', async () => {
    await waitFor(element(by.text('Your Estate')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
