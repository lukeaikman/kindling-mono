import {
  TRUST_DATA_DEFAULTS,
  TrustData,
  buildPropertyTransferData,
  buildTrustEntityData,
  loadTrustToFormData,
  loadStateArrays,
  isSettlorRole,
  isBeneficiaryRole,
  formToTrustTypeMap,
  trustTypeToFormMap,
  BeneficiaryAssignment,
} from '../trustDataMapping';
import type { Trust, PropertyAsset } from '../../../../src/types';

// ─── Factory helper ─────────────────────────────────────────────
function makeTrustData(overrides: Partial<TrustData> = {}): TrustData {
  return { ...TRUST_DATA_DEFAULTS, ...overrides };
}

const EMPTY_ARRAYS = {
  remaindermen: [] as BeneficiaryAssignment[],
  bareBeneficiaries: [] as BeneficiaryAssignment[],
  bareCoBeneficiaries: [] as BeneficiaryAssignment[],
};

function buildEntity(td: TrustData) {
  return buildTrustEntityData({
    trustData: td,
    ...EMPTY_ARRAYS,
    userId: 'test-user',
    assetIds: ['asset-1'],
    createdInContext: 'property',
  });
}

/** Wraps entity output with id/createdAt/updatedAt to create a Trust for loading */
function toTrust(entity: ReturnType<typeof buildEntity>, id: string): Trust {
  return { ...entity, id, createdAt: new Date(), updatedAt: new Date() } as unknown as Trust;
}

// ─── Smoke Test ─────────────────────────────────────────────────
describe('Smoke test', () => {
  it('TRUST_DATA_DEFAULTS exists and has expected shape', () => {
    expect(TRUST_DATA_DEFAULTS).toBeDefined();
    expect(TRUST_DATA_DEFAULTS.trustName).toBe('');
    expect(TRUST_DATA_DEFAULTS.trustType).toBe('');
    expect(TRUST_DATA_DEFAULTS.trustRole).toBe('');
  });
});

// ─── Group A: Save mapping (buildPropertyTransferData) ──────────
describe('Group A: buildPropertyTransferData', () => {
  // A-1: LI Settlor "yes" gateway
  it('A-1: LI Settlor "yes" — transfer fields populated', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      settlorTransferWithin7Years: 'yes',
      settlorTransferMonth: '03',
      settlorTransferYear: '2023',
      settlorTransferValue: 250000,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(true);
    expect(result.trustTransferMonth).toBe('03');
    expect(result.trustTransferYear).toBe('2023');
    expect(result.trustTransferValue).toBe(250000);
  });

  // A-2: LI Settlor "yes" + unknown flags
  it('A-2: LI Settlor "yes" + date/value unknown', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      settlorTransferWithin7Years: 'yes',
      lifeInterestDateUnknown: true,
      lifeInterestValueUnknown: true,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(true);
    expect(result.trustTransferDateUnknown).toBe(true);
    expect(result.trustTransferValueUnknown).toBe(true);
  });

  // A-4: LI Settlor "no" gateway
  it('A-4: LI Settlor "no" — within7Years false', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      settlorTransferWithin7Years: 'no',
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(false);
  });

  // A-5a: LI Remainderman "no" gateway — maps to false
  it('A-5a: LI Remainderman "no" — within7Years false', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'remainderman',
      remaindermanTransferWithin7Years: 'no',
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(false);
  });

  // A-5b: LI Remainderman "yes" gateway — maps to true, transfer fields populated
  it('A-5b: LI Remainderman "yes" — within7Years true, transfer fields populated', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'remainderman',
      remaindermanTransferWithin7Years: 'yes',
      remaindermanTransferMonth: '06',
      remaindermanTransferYear: '2022',
      remaindermanTransferValue: 300000,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(true);
    expect(result.trustTransferMonth).toBe('06');
    expect(result.trustTransferYear).toBe('2022');
    expect(result.trustTransferValue).toBe(300000);
  });

  // A-5c: LI Remainderman "not_sure" — falls through to undefined by design
  it('A-5c: LI Remainderman "not_sure" — within7Years undefined', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'remainderman',
      remaindermanTransferWithin7Years: 'not_sure',
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBeUndefined();
  });

  // A-6a: Bare Settlor "no" gateway
  it('A-6a: Bare Settlor "no" — within7Years false', () => {
    const td = makeTrustData({
      trustType: 'bare',
      trustRole: 'settlor',
      bareSettlorTransferWithin7Years: 'no',
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(false);
  });

  // A-6b: Bare Settlor "yes" gateway
  it('A-6b: Bare Settlor "yes" — transfer fields populated', () => {
    const td = makeTrustData({
      trustType: 'bare',
      trustRole: 'settlor',
      bareSettlorTransferWithin7Years: 'yes',
      bareSettlorTransferMonth: '01',
      bareSettlorTransferYear: '2024',
      bareValueAtTransfer: 500000,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(true);
    expect(result.trustTransferMonth).toBe('01');
    expect(result.trustTransferYear).toBe('2024');
    expect(result.trustTransferValue).toBe(500000);
  });

  // A-7: Bare S&B — occupiedByOwner + value
  it('A-7: Bare S&B — occupiedByOwner + value populated', () => {
    const td = makeTrustData({
      trustType: 'bare',
      trustRole: 'settlor_and_beneficiary',
      currentlyLiveInProperty: 'yes',
      bareValueAtTransfer: 200000,
    });
    const result = buildPropertyTransferData(td);
    expect(result.occupiedByOwner).toBe(true);
    expect(result.trustTransferValue).toBe(200000);
  });

  // A-8a: Discretionary Settlor "no" gateway
  it('A-8a: Discretionary Settlor "no" — within7Years false', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'settlor',
      discretionarySettlorTransferWithin7Years: 'no',
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(false);
  });

  // A-8b: Discretionary Settlor "yes" gateway
  it('A-8b: Discretionary Settlor "yes" — transfer fields populated', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'settlor',
      discretionarySettlorTransferWithin7Years: 'yes',
      discretionaryTransferMonth: '09',
      discretionaryTransferYear: '2021',
      discretionaryValueAtTransfer: 400000,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(true);
    expect(result.trustTransferMonth).toBe('09');
    expect(result.trustTransferYear).toBe('2021');
    expect(result.trustTransferValue).toBe(400000);
  });

  // A-9a: Discretionary Beneficiary "no" gateway
  it('A-9a: Discretionary Beneficiary "no" — within7Years false', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'beneficiary',
      discretionaryBeneficiaryTransferWithin7Years: 'no',
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(false);
  });

  // A-9b: Discretionary Beneficiary "yes" gateway
  it('A-9b: Discretionary Beneficiary "yes" — transfer fields populated', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'beneficiary',
      discretionaryBeneficiaryTransferWithin7Years: 'yes',
      discretionaryBeneficiaryTransferMonth: '04',
      discretionaryBeneficiaryTransferYear: '2023',
      discretionaryBeneficiaryValueAtTransfer: 180000,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferWithin7Years).toBe(true);
    expect(result.trustTransferMonth).toBe('04');
    expect(result.trustTransferYear).toBe('2023');
    expect(result.trustTransferValue).toBe(180000);
  });

  // A-9c: Discretionary Beneficiary "not_sure" gateway
  it('A-9c: Discretionary Beneficiary "not_sure" — within7Years undefined, dateUnknown true', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'beneficiary',
      discretionaryBeneficiaryTransferWithin7Years: 'not_sure',
      discretionaryBeneficiaryDateUnknown: true,
    });
    const propResult = buildPropertyTransferData(td);
    expect(propResult.trustTransferWithin7Years).toBeUndefined();
    expect(propResult.trustTransferDateUnknown).toBe(true);
  });

  // A-10: Role switch — changing role changes which alias is read
  it('A-10: Role switch — stale data not leaked', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      settlorTransferValue: 100000,
      settlorTransferWithin7Years: 'yes',
    });
    const settlorResult = buildPropertyTransferData(td);
    expect(settlorResult.trustTransferValue).toBe(100000);

    // Switch role to remainderman with different value
    td.trustRole = 'remainderman';
    td.remaindermanTransferValue = 200000;
    td.remaindermanTransferWithin7Years = 'yes';
    const remaindermanResult = buildPropertyTransferData(td);
    expect(remaindermanResult.trustTransferValue).toBe(200000);
  });

  // D-1 (save side): Value of 0 uses nullish coalescing
  it('D-1 save: Value of 0 produces 0 not undefined', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      settlorTransferWithin7Years: 'yes',
      settlorTransferValue: 0,
    });
    const result = buildPropertyTransferData(td);
    expect(result.trustTransferValue).toBe(0);
  });
});

// ─── Group B: Round-trip (build → load) ─────────────────────────
describe('Group B: Round-trip (buildTrustEntityData -> loadTrustToFormData)', () => {
  // B-1: LI Settlor
  it('B-1: LI Settlor — lifeInterest sub-object round-trips', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'Test Trust',
      settlorTransferWithin7Years: 'yes',
      settlorNoBenefitConfirmed: true,
      payingMarketRent: 'no',
      lifeInterestEndingEvents: 'death',
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-1'),
      property as PropertyAsset,
    );
    expect(loaded.settlorNoBenefitConfirmed).toBe(true);
    expect(loaded.payingMarketRent).toBe('no');
    expect(loaded.lifeInterestEndingEvents).toBe('death');
    expect(loaded.settlorTransferWithin7Years).toBe('yes');
  });

  // B-2: LI Settlor+Beneficial
  it('B-2: LI Settlor+Beneficial — beneficial fields round-trip', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor_and_beneficial_interest',
      trustName: 'S&BI Trust',
      settlorAndBeneficialBenefitType: 'right_to_income',
      settlorAndBeneficialWantsReview: true,
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-2'),
      property as PropertyAsset,
    );
    expect(loaded.settlorAndBeneficialBenefitType).toBe('right_to_income');
    expect(loaded.settlorAndBeneficialWantsReview).toBe(true);
  });

  // B-3: LI Beneficiary
  it('B-3: LI Beneficiary — lifeInterest sub-object round-trips', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'life_interest',
      trustName: 'LI Ben Trust',
      lifeInterestSharing: 'not_shared',
      lifeInterestSpouseSuccession: 'yes',
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-3'),
      property as PropertyAsset,
    );
    expect(loaded.lifeInterestSharing).toBe('not_shared');
    expect(loaded.lifeInterestSpouseSuccession).toBe('yes');
  });

  // B-4: LI Remainderman
  it('B-4: LI Remainderman — gateway + fields round-trip', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'remainderman',
      trustName: 'Remainderman Trust',
      remaindermanLifeTenantAlive: 'yes',
      remaindermanLifeTenantAge: 72,
      remaindermanTransferWithin7Years: 'yes',
      remaindermanTransferMonth: '06',
      remaindermanTransferYear: '2022',
      remaindermanTransferValue: 300000,
      remaindermanSettlorAlive: 'yes',
      remaindermanSuccessionBeneficiary: 'person-1',
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-4'),
      property as PropertyAsset,
    );
    expect(loaded.remaindermanTransferWithin7Years).toBe('yes');
    expect(loaded.remaindermanLifeTenantAlive).toBe('yes');
    expect(loaded.remaindermanLifeTenantAge).toBe(72);
    expect(loaded.remaindermanSettlorAlive).toBe('yes');
    expect(loaded.remaindermanSuccessionBeneficiary).toBe('person-1');
  });

  // B-4 edge: within7Years undefined + dateUnknown true → loads as 'not_sure'
  it('B-4 edge: within7Years undefined + dateUnknown true → loads as not_sure', () => {
    const trust = {
      id: 'trust-rem-edge-1',
      userId: 'test-user',
      name: 'Rem Edge Trust',
      type: 'life_interest_trust',
      creationMonth: '',
      creationYear: '',
      assetIds: ['asset-1'],
      createdInContext: 'property',
      createdAt: new Date(),
      updatedAt: new Date(),
      beneficiary: {
        entitlementType: undefined,
        rightOfOccupation: false,
        benefitDescription: '',
        isSettlorOfThisTrust: 'no',
        remainderman: {
          lifeTenantAlive: 'yes',
          ownershipClarification: '',
          lifeTenantAge: 70,
          settlorAlive: '',
          successionBeneficiary: '',
        },
      },
      userRole: 'remainderman',
    } as unknown as Trust;
    const property = {
      trustTransferWithin7Years: undefined,
      trustTransferDateUnknown: true,
    } as Partial<PropertyAsset>;
    const loaded = loadTrustToFormData(trust, property as PropertyAsset);
    expect(loaded.remaindermanTransferWithin7Years).toBe('not_sure');
  });

  // B-4 edge: within7Years undefined + dateUnknown false → loads as '' (forces re-answer)
  it('B-4 edge: within7Years undefined + dateUnknown false → loads as empty', () => {
    const trust = {
      id: 'trust-rem-edge-2',
      userId: 'test-user',
      name: 'Rem Edge Trust 2',
      type: 'life_interest_trust',
      creationMonth: '',
      creationYear: '',
      assetIds: ['asset-1'],
      createdInContext: 'property',
      createdAt: new Date(),
      updatedAt: new Date(),
      beneficiary: {
        entitlementType: undefined,
        rightOfOccupation: false,
        benefitDescription: '',
        isSettlorOfThisTrust: 'no',
        remainderman: {
          lifeTenantAlive: 'yes',
          ownershipClarification: '',
          lifeTenantAge: 70,
          settlorAlive: '',
          successionBeneficiary: '',
        },
      },
      userRole: 'remainderman',
    } as unknown as Trust;
    const property = {
      trustTransferWithin7Years: undefined,
      trustTransferDateUnknown: false,
    } as Partial<PropertyAsset>;
    const loaded = loadTrustToFormData(trust, property as PropertyAsset);
    expect(loaded.remaindermanTransferWithin7Years).toBe('');
  });

  // B-5: Bare Beneficiary
  it('B-5: Bare Beneficiary — bare sub-object round-trips', () => {
    const td = makeTrustData({
      trustType: 'bare',
      trustRole: 'beneficiary',
      trustName: 'Bare Ben Trust',
      bareBeneficiaryPercentage: 50,
      bareBeneficiaryShareWithOthers: 'yes',
      bareBeneficiaryNumberOfOthers: '2',
      bareBeneficiaryGiftedByLivingSettlor: 'yes_less_than_7',
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-5'),
      property as PropertyAsset,
    );
    expect(loaded.bareBeneficiaryPercentage).toBe(50);
    expect(loaded.bareBeneficiaryShareWithOthers).toBe('yes');
    expect(loaded.bareBeneficiaryNumberOfOthers).toBe('2');
    expect(loaded.bareBeneficiaryGiftedByLivingSettlor).toBe('yes_less_than_7');
  });

  // B-6: Bare S&B — coBeneficiaries
  it('B-6: Bare S&B — coBeneficiaries array round-trips', () => {
    const coBens: BeneficiaryAssignment[] = [
      { id: 'person-1', type: 'person', name: 'Alice', percentage: 50 },
      { id: 'person-2', type: 'person', name: 'Bob', percentage: 50 },
    ];
    const td = makeTrustData({
      trustType: 'bare',
      trustRole: 'settlor_and_beneficiary',
      trustName: 'Bare S&B Trust',
    });
    const entity = buildTrustEntityData({
      trustData: td,
      remaindermen: [],
      bareBeneficiaries: [],
      bareCoBeneficiaries: coBens,
      userId: 'test-user',
      assetIds: ['asset-1'],
      createdInContext: 'property',
    });
    const trust = toTrust(entity, 'trust-6');
    const arrays = loadStateArrays(trust);
    expect(arrays.bareCoBeneficiaries).toHaveLength(2);
    expect(arrays.bareCoBeneficiaries[0].id).toBe('person-1');
    expect(arrays.bareCoBeneficiaries[1].id).toBe('person-2');
  });

  // B-7: Discretionary S&B (settlor side) — complexSituation
  it('B-7: Discretionary S&B — complexSituation round-trips', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'settlor_and_beneficiary',
      trustName: 'Disc S&B Trust',
      discretionaryComplexSituation: true,
      discretionarySettlorAndBeneficiarySpouseExcluded: 'yes',
    });
    const entity = buildEntity(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-7'),
    );
    expect(loaded.discretionaryComplexSituation).toBe(true);
  });

  // B-8: Discretionary Beneficiary — gateway + insurance + date/value
  it('B-8: Discretionary Beneficiary — 3-option gateway + insurance round-trip', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'beneficiary',
      trustName: 'Disc Ben Trust',
      discretionaryBeneficiaryTransferWithin7Years: 'yes',
      discretionaryBeneficiaryTransferMonth: '04',
      discretionaryBeneficiaryTransferYear: '2023',
      discretionaryBeneficiaryValueAtTransfer: 180000,
      discretionaryBeneficiaryInsurancePolicy: 'yes',
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-8'),
      property as PropertyAsset,
    );
    expect(loaded.discretionaryBeneficiaryTransferWithin7Years).toBe('yes');
    expect(loaded.discretionaryBeneficiaryTransferMonth).toBe('04');
    expect(loaded.discretionaryBeneficiaryTransferYear).toBe('2023');
    expect(loaded.discretionaryBeneficiaryValueAtTransfer).toBe(180000);
    expect(loaded.discretionaryBeneficiaryInsurancePolicy).toBe('yes');
  });

  // B-8 sub-case: Load edge case — within7Years undefined + dateUnknown true → 'not_sure'
  it('B-8 edge: within7Years undefined + dateUnknown true → loads as not_sure', () => {
    const trust = {
      id: 'trust-edge-1',
      userId: 'test-user',
      name: 'Edge Trust',
      type: 'discretionary_trust',
      creationMonth: '',
      creationYear: '',
      assetIds: ['asset-1'],
      createdInContext: 'property',
      createdAt: new Date(),
      updatedAt: new Date(),
      beneficiary: {
        entitlementType: undefined,
        rightOfOccupation: false,
        benefitDescription: '',
        isSettlorOfThisTrust: 'no',
        discretionaryInsurancePolicy: 'unsure',
      },
      userRole: 'beneficiary',
    } as unknown as Trust;
    const property = {
      trustTransferWithin7Years: undefined,
      trustTransferDateUnknown: true,
    } as Partial<PropertyAsset>;
    const loaded = loadTrustToFormData(trust, property as PropertyAsset);
    expect(loaded.discretionaryBeneficiaryTransferWithin7Years).toBe('not_sure');
  });

  // B-8 edge: within7Years undefined + dateUnknown false → loads as '' (forces re-answer)
  it('B-8 edge: within7Years undefined + dateUnknown false → loads as empty', () => {
    const trust = {
      id: 'trust-edge-2',
      userId: 'test-user',
      name: 'Edge Trust 2',
      type: 'discretionary_trust',
      creationMonth: '',
      creationYear: '',
      assetIds: ['asset-1'],
      createdInContext: 'property',
      createdAt: new Date(),
      updatedAt: new Date(),
      beneficiary: {
        entitlementType: undefined,
        rightOfOccupation: false,
        benefitDescription: '',
        isSettlorOfThisTrust: 'no',
      },
      userRole: 'beneficiary',
    } as unknown as Trust;
    const property = {
      trustTransferWithin7Years: undefined,
      trustTransferDateUnknown: false,
    } as Partial<PropertyAsset>;
    const loaded = loadTrustToFormData(trust, property as PropertyAsset);
    expect(loaded.discretionaryBeneficiaryTransferWithin7Years).toBe('');
  });

  // B-9: Discretionary S&B (beneficiary side) — spouseExcluded
  it('B-9: Discretionary S&B — spouse excluded round-trips', () => {
    const td = makeTrustData({
      trustType: 'discretionary',
      trustRole: 'settlor_and_beneficiary',
      trustName: 'Disc S&B Trust 2',
      discretionarySettlorAndBeneficiarySpouseExcluded: 'no',
    });
    const entity = buildEntity(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-9'),
    );
    expect(loaded.discretionarySettlorAndBeneficiarySpouseExcluded).toBe('no');
  });
});

// ─── Group C: Trust-level fields ────────────────────────────────
describe('Group C: Trust-level fields', () => {
  // C-1/C-2: userRole persists and loads
  it('C-1: userRole persists and loads correctly', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'remainderman',
      trustName: 'Role Test',
    });
    const entity = buildEntity(td);
    expect(entity.userRole).toBe('remainderman');
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-c1'),
    );
    expect(loaded.trustRole).toBe('remainderman');
  });

  // C-3: No boolean flags in output
  it('C-3: No isUserSettlor/isUserBeneficiary/isUserTrustee in output', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'No Booleans',
    });
    const entity = buildEntity(td);
    expect(entity).not.toHaveProperty('isUserSettlor');
    expect(entity).not.toHaveProperty('isUserBeneficiary');
    expect(entity).not.toHaveProperty('isUserTrustee');
  });

  // C-4: preFinanceAct2006 — before
  it('C-4: preFinanceAct2006 before_2006 round-trips', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'Pre 2006',
      lifeInterestTrustCreationDate: 'before_2006',
    });
    const entity = buildEntity(td);
    expect(entity.preFinanceAct2006).toBe('before_2006');
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-c4'),
    );
    expect(loaded.lifeInterestTrustCreationDate).toBe('before_2006');
  });

  // C-5: preFinanceAct2006 — after
  it('C-5: preFinanceAct2006 on_or_after_2006 round-trips', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'Post 2006',
      lifeInterestTrustCreationDate: 'on_or_after_2006',
    });
    const entity = buildEntity(td);
    expect(entity.preFinanceAct2006).toBe('on_or_after_2006');
  });

  // C-6: preFinanceAct2006 — unanswered
  it('C-6: preFinanceAct2006 unanswered → undefined', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'No Answer',
    });
    const entity = buildEntity(td);
    expect(entity.preFinanceAct2006).toBeUndefined();
  });

  // C-7: chainedTrustStructure
  it('C-7: chainedTrustStructure round-trips', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'Chained',
      chainedTrustStructure: true,
    });
    const entity = buildEntity(td);
    expect(entity.chainedTrustStructure).toBe(true);
  });
});

// ─── Group D: Edge cases ────────────────────────────────────────
describe('Group D: Edge cases', () => {
  // D-1 (load side): Value of 0 round-trips
  it('D-1 load: Value of 0 round-trips correctly', () => {
    const td = makeTrustData({
      trustType: 'life_interest',
      trustRole: 'settlor',
      trustName: 'Zero Value',
      settlorTransferWithin7Years: 'yes',
      settlorTransferValue: 0,
      settlorTransferMonth: '01',
      settlorTransferYear: '2024',
    });
    const entity = buildEntity(td);
    const property: Partial<PropertyAsset> = buildPropertyTransferData(td);
    const loaded = loadTrustToFormData(
      toTrust(entity, 'trust-d1'),
      property as PropertyAsset,
    );
    expect(loaded.settlorTransferValue).toBe(0);
  });

  // D-2: occupiedByOwner independent of primaryResidence
  it('D-2: occupiedByOwner independent of primaryResidence', () => {
    const td = makeTrustData({
      trustType: 'bare',
      trustRole: 'settlor_and_beneficiary',
      currentlyLiveInProperty: 'no',
    });
    const result = buildPropertyTransferData(td);
    expect(result.occupiedByOwner).toBe(false);

    td.currentlyLiveInProperty = 'yes';
    const result2 = buildPropertyTransferData(td);
    expect(result2.occupiedByOwner).toBe(true);
  });

  // D-4: Other trust type — minimal output
  it('D-4: Other trust type — minimal output, no sub-objects', () => {
    const td = makeTrustData({
      trustType: 'other',
      trustRole: '',
      trustName: 'Other Trust',
    });
    const entity = buildEntity(td);
    expect(entity.name).toBe('Other Trust');
    expect(entity.userRole).toBeUndefined();
    expect(entity.settlor).toBeUndefined();
    expect(entity.beneficiary).toBeUndefined();
  });
});

// ─── Group E: Role helpers + type maps ──────────────────────────
describe('Group E: Role helpers + type maps', () => {
  describe('isSettlorRole', () => {
    it('LI settlor → true', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'life_interest', trustRole: 'settlor' }))).toBe(true);
    });
    it('LI settlor_and_beneficial_interest → true', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'life_interest', trustRole: 'settlor_and_beneficial_interest' }))).toBe(true);
    });
    it('LI remainderman → false', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'life_interest', trustRole: 'remainderman' }))).toBe(false);
    });
    it('bare settlor → true', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'bare', trustRole: 'settlor' }))).toBe(true);
    });
    it('bare beneficiary → false', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'bare', trustRole: 'beneficiary' }))).toBe(false);
    });
    it('discretionary settlor_and_beneficiary → true', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'discretionary', trustRole: 'settlor_and_beneficiary' }))).toBe(true);
    });
    it('other → false', () => {
      expect(isSettlorRole(makeTrustData({ trustType: 'other', trustRole: '' }))).toBe(false);
    });
  });

  describe('isBeneficiaryRole', () => {
    it('LI life_interest (beneficiary) → true', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'life_interest', trustRole: 'life_interest' }))).toBe(true);
    });
    it('LI remainderman → true', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'life_interest', trustRole: 'remainderman' }))).toBe(true);
    });
    it('LI settlor → false', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'life_interest', trustRole: 'settlor' }))).toBe(false);
    });
    it('LI settlor_and_beneficial_interest → true', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'life_interest', trustRole: 'settlor_and_beneficial_interest' }))).toBe(true);
    });
    it('bare beneficiary → true', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'bare', trustRole: 'beneficiary' }))).toBe(true);
    });
    it('discretionary beneficiary → true', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'discretionary', trustRole: 'beneficiary' }))).toBe(true);
    });
    it('other → false', () => {
      expect(isBeneficiaryRole(makeTrustData({ trustType: 'other', trustRole: '' }))).toBe(false);
    });
  });

  describe('Type maps', () => {
    it('core types round-trip: formToTrustTypeMap → trustTypeToFormMap', () => {
      // life_interest, bare, discretionary all round-trip
      expect(trustTypeToFormMap[formToTrustTypeMap['life_interest']]).toBe('life_interest');
      expect(trustTypeToFormMap[formToTrustTypeMap['bare']]).toBe('bare');
      expect(trustTypeToFormMap[formToTrustTypeMap['discretionary']]).toBe('discretionary');
    });

    it('"other" maps to "other_trust" but has no reverse (by design)', () => {
      expect(formToTrustTypeMap['other']).toBe('other_trust');
      expect(trustTypeToFormMap['other_trust']).toBeUndefined();
    });

    it('trustTypeToFormMap includes legacy aliases', () => {
      expect(trustTypeToFormMap['settlor_interested_trust']).toBe('discretionary');
      expect(trustTypeToFormMap['interest_in_possession_trust']).toBe('life_interest');
    });
  });
});

// ─── Group F: loadStateArrays ───────────────────────────────────
describe('Group F: loadStateArrays', () => {
  it('returns empty arrays when trust has no sub-objects', () => {
    const trust = {
      id: 'trust-f1',
      userId: 'test-user',
      name: 'Empty Trust',
      type: 'bare_trust',
      creationMonth: '',
      creationYear: '',
      assetIds: [],
      createdInContext: 'property',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Trust;
    const arrays = loadStateArrays(trust);
    expect(arrays.remaindermen).toEqual([]);
    expect(arrays.bareBeneficiaries).toEqual([]);
    expect(arrays.bareCoBeneficiaries).toEqual([]);
  });

  it('returns populated arrays when trust has data', () => {
    const trust = {
      id: 'trust-f2',
      userId: 'test-user',
      name: 'Full Trust',
      type: 'life_interest_trust',
      creationMonth: '',
      creationYear: '',
      assetIds: [],
      createdInContext: 'property',
      createdAt: new Date(),
      updatedAt: new Date(),
      settlor: {
        reservedBenefit: 'none',
        beneficiaries: [
          { id: 'p1', type: 'person', percentage: 100, isManuallyEdited: false },
        ],
        trusteeIds: [],
        lifeInterest: {
          noBenefitConfirmed: false,
          payingMarketRent: '',
          lifeInterestEndingEvents: '',
          remaindermen: [
            { id: 'r1', type: 'person', percentage: 50, isManuallyEdited: false },
            { id: 'r2', type: 'person', percentage: 50, isManuallyEdited: false },
          ],
          beneficialInterestType: '',
          wantsReview: false,
        },
      },
      beneficiary: {
        entitlementType: undefined,
        rightOfOccupation: false,
        benefitDescription: '',
        isSettlorOfThisTrust: 'no',
        bare: {
          percentage: 0,
          percentageUnknown: false,
          shareWithOthers: '',
          numberOfOthers: '',
          giftedByLivingSettlor: '',
          giftMonth: '',
          giftYear: '',
          coBeneficiaries: [
            { id: 'cb1', type: 'person', percentage: 100, isManuallyEdited: false },
          ],
        },
      },
    } as unknown as Trust;
    const arrays = loadStateArrays(trust);
    expect(arrays.remaindermen).toHaveLength(2);
    expect(arrays.remaindermen[0].id).toBe('r1');
    expect(arrays.bareBeneficiaries).toHaveLength(1);
    expect(arrays.bareBeneficiaries[0].id).toBe('p1');
    expect(arrays.bareCoBeneficiaries).toHaveLength(1);
    expect(arrays.bareCoBeneficiaries[0].id).toBe('cb1');
  });
});
