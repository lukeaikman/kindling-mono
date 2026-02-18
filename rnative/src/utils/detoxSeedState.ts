/**
 * Detox E2E seed state — writes the minimum AsyncStorage data to simulate
 * a post-onboarding state. The detox_e2e_bypass flag also tells gated
 * screens (will-dashboard, splash) to skip checks, so we don't need to
 * perfectly replicate completed People/Estate/Legal stages.
 *
 * Only callable in __DEV__ builds via a Detox launch argument.
 *
 * @module utils/detoxSeedState
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from 'react-native';
import { STORAGE_KEYS } from '../constants';

const TEST_USER_ID = 'e2e-test-user-001';

function scopedKey(key: string): string {
  return `kindling:${TEST_USER_ID}:${key}`;
}

export async function seedTestState(): Promise<void> {
  const now = new Date().toISOString();

  const personData = [
    {
      id: TEST_USER_ID,
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-15',
      email: 'e2e@test.kindling.app',
      phone: '',
      relationship: 'other',
      roles: ['will-maker'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const willData = {
    id: 'will-v1',
    userId: TEST_USER_ID,
    version: 1,
    willType: 'simple',
    status: 'draft',
    executors: [],
    guardianship: {},
    alignment: {},
    bequestIds: [],
    createdAt: now,
    updatedAt: now,
  };

  const bequeathalData = {
    property: [],
    'important-items': [],
    investment: [],
    pensions: [],
    'life-insurance': [],
    'bank-accounts': [],
    'private-company-shares': [],
    'assets-held-through-business': [],
    'debts-credit': [],
    'agricultural-assets': [],
    'crypto-currency': [],
    other: [],
    categoryStatus: {
      'bank-accounts': { completedAt: null },
    },
    hasStartedEntry: true,
    totalEstimatedValue: 0,
    totalNetValue: 0,
    lastUpdated: now,
  };

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACTIVE_WILLMAKER_ID, TEST_USER_ID],
    [scopedKey(STORAGE_KEYS.PERSON_DATA), JSON.stringify(personData)],
    [scopedKey(STORAGE_KEYS.WILL_DATA), JSON.stringify(willData)],
    [scopedKey(STORAGE_KEYS.BEQUEATHAL_DATA), JSON.stringify(bequeathalData)],
    ['kindling_has_launched', 'true'],
    ['detox_e2e_bypass', 'true'],
  ]);

  // Clear the NSUserDefaults trigger so subsequent relaunchApp() calls
  // (e.g. G-6) do not re-seed and overwrite test data created during tests.
  Settings.set({ detoxSeedState: '' });
}
