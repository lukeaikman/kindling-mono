/**
 * Seed data functions for development and testing
 * Migrated from web prototype
 * 
 * These functions populate the app with sample data to aid in development and testing.
 * All functions take the appropriate actions interfaces as parameters.
 * 
 * @module utils/seedData
 */

import { PersonActions, BequeathalActions } from '../types';
import { getPersonFullName } from './helpers';

/**
 * SEED USER DATA FUNCTION FOR DEVELOPMENT
 * Creates Luke Aikman family with realistic data
 * 
 * @param {PersonActions} personActions - Person actions interface
 */
export const seedUserData = async (personActions: PersonActions) => {
  console.log('🌱 SEEDING USER DATA - Luke Aikman Family');
  
  // Create Luke Aikman as the main user
  const luke = await personActions.addPerson({
    firstName: 'Luke',
    lastName: 'Aikman',
    email: 'luke.aikman@email.com',
    phone: '+44 7890 123456',
    relationship: 'spouse',
    roles: ['will-maker', 'family-member'],
    dateOfBirth: '1983-10-05'
  });
  
  // Create Dawn Aikman as spouse
  const dawn = await personActions.addPerson({
    firstName: 'Dawn',
    lastName: 'Aikman',
    email: 'dawn.aikman@email.com',
    phone: '+44 7890 123457',
    relationship: 'spouse',
    roles: ['family-member', 'beneficiary', 'executor']
  });
  
  // Create Heidi Aikman as daughter (under 18)
  const heidi = await personActions.addPerson({
    firstName: 'Heidi',
    lastName: 'Aikman',
    email: 'heidi.aikman@email.com',
    phone: '',
    relationship: 'biological-child',
    roles: ['family-member', 'beneficiary', 'dependent'],
    isDependent: true
  });
  
  // Create Dexter Aikman as son (under 18)
  const dexter = await personActions.addPerson({
    firstName: 'Dexter',
    lastName: 'Aikman',
    email: 'dexter.aikman@email.com',
    phone: '',
    relationship: 'biological-child',
    roles: ['family-member', 'beneficiary', 'dependent'],
    isDependent: true
  });
  
  console.log('✅ Successfully seeded Luke Aikman family:');
  console.log(`  - Luke Aikman (Will Maker, DOB: 05/10/1983)`);
  console.log(`  - Dawn Aikman (Spouse)`);
  console.log(`  - Heidi Aikman (Daughter, Under 18)`);
  console.log(`  - Dexter Aikman (Son, Under 18)`);
  console.log(`📊 Total family members created: 4`);
};

/**
 * SEED PROPERTY DATA FUNCTION FOR DEVELOPMENT
 * Creates 8 Garden Close property
 * 
 * @param {BequeathalActions} bequeathalActions - Bequeathal actions interface
 */
export const seedPropertyData = (bequeathalActions: BequeathalActions) => {
  console.log('🌱 SEEDING PROPERTY DATA - 8 Garden Close, Watford');
  
  // Create the property asset
  const propertyAsset: any = {
    title: '8 Garden Close',
    address: {
      address1: '8 Garden Close',
      address2: '',
      city: 'Watford',
      county: 'Hertfordshire',
      postcode: 'WD17 3DP',
      country: 'United Kingdom'
    },
    basicDetails: {
      propertyType: 'residential',
      ownershipType: 'tenants-in-common',
      ownershipPercentage: '50',
      primaryResidence: true,
      hasLivedThere: false,
      hasMortgage: false,
      outstandingMortgage: '0',
      estimatedValue: '£1,600,000'
    },
    propertyType: 'residential' as const,
    ownershipType: 'tenants-in-common' as const,
    ownershipPercentage: 50,
    estimatedValue: 1600000,
    netValue: 1600000,
    heldInTrust: 'no' as const,
    description: 'Family home where Luke, Dawn, Heidi and Dexter all live. All family members are financially dependent on this property.',
  };
  
  // Add the property to the estate
  const propertyId = bequeathalActions.addAsset('property', propertyAsset);
  
  console.log('✅ Successfully seeded property:');
  console.log(`  - Address: 8 Garden Close, Watford, WD17 3DP`);
  console.log(`  - Value: £1,600,000`);
  console.log(`  - Ownership: Tenants in common, 50:50 with spouse`);
  console.log(`  - Mortgage: None`);
  console.log(`  - Residents: Luke, Dawn, Heidi, and Dexter (all financially dependent)`);
  console.log(`📊 Property ID: ${propertyId}`);
};

/**
 * SEED INVESTMENTS DATA FUNCTION FOR DEVELOPMENT
 * Creates sample investment portfolios
 * 
 * @param {PersonActions} personActions - Person actions interface
 * @param {BequeathalActions} bequeathalActions - Bequeathal actions interface
 */
export const seedInvestmentsData = async (personActions: PersonActions, bequeathalActions: BequeathalActions) => {
  console.log('🌱 SEEDING INVESTMENTS DATA - Development Action');
  
  // First, create some sample people if none exist
  const existingPeople = personActions.getBeneficiaries();
  let samplePersonIds: string[] = [];
  
  if (existingPeople.length === 0) {
    console.log('📋 Creating sample people...');
    const sarah = await personActions.addPerson({ 
      firstName: 'Sarah', 
      lastName: 'Johnson', 
      email: '',
      phone: '',
      relationship: 'biological-child',
      roles: ['beneficiary']
    });
    const michael = await personActions.addPerson({ 
      firstName: 'Michael', 
      lastName: 'Johnson', 
      email: '',
      phone: '',
      relationship: 'biological-child',
      roles: ['beneficiary']
    });
    samplePersonIds = [sarah.id, michael.id];
  } else {
    samplePersonIds = existingPeople.map(p => p.id);
  }
  
  // Sample investment data
  const sampleInvestments = [
    {
      title: 'Stocks & Shares ISA',
      provider: 'AJ Bell',
      investmentType: 'isa',
      estimatedValue: 45000,
      netValue: 45000,
      currentValue: 45000,
      beneficiaryId: samplePersonIds[0] || undefined,
    },
    {
      title: 'Self-Invested Personal Pension',
      provider: 'Hargreaves Lansdown',
      investmentType: 'pension',
      estimatedValue: 125000,
      netValue: 125000,
      currentValue: 125000,
      beneficiaryId: undefined,
    },
  ];
  
  // Add all sample investments
  sampleInvestments.forEach(investment => {
    bequeathalActions.addAsset('investment', investment);
  });
  
  console.log(`✅ Successfully seeded ${sampleInvestments.length} investments`);
  console.log(`💰 Total investment value: £${sampleInvestments.reduce((sum, inv) => sum + inv.estimatedValue, 0).toLocaleString()}`);
};

/**
 * SEED PENSIONS DATA FUNCTION FOR DEVELOPMENT
 * Creates sample pension accounts
 * 
 * @param {BequeathalActions} bequeathalActions - Bequeathal actions interface
 */
export const seedPensionsData = (bequeathalActions: BequeathalActions) => {
  console.log('🌱 SEEDING PENSIONS DATA - Development Action');
  
  const samplePensions = [
    {
      title: 'NEST - Software Developer',
      provider: 'NEST',
      linkedEmployer: 'TechCorp Ltd',
      pensionOwner: 'me' as const,
      beneficiaryNominated: 'yes' as const,
      heldInTrust: 'no' as const,
      estimatedValue: 45000,
      netValue: 45000,
      pensionType: 'defined-contribution' as const,
      currentValue: 45000,
    },
    {
      title: 'Teachers\' Pension Scheme',
      provider: 'Teachers\' Pension Scheme',
      linkedEmployer: 'St. Mary\'s Primary School',
      pensionOwner: 'spouse' as const,
      beneficiaryNominated: 'yes' as const,
      heldInTrust: 'yes' as const,
      estimatedValue: 125000,
      netValue: 125000,
      pensionType: 'defined-benefit' as const,
      currentValue: 125000,
    }
  ];
  
  samplePensions.forEach(pension => {
    bequeathalActions.addAsset('pensions', pension);
  });
  
  console.log(`✅ Successfully seeded ${samplePensions.length} pensions`);
  console.log(`💰 Total pension value: £${samplePensions.reduce((sum, pension) => sum + pension.estimatedValue, 0).toLocaleString()}`);
};

/**
 * SEED BANK ACCOUNTS DATA FUNCTION FOR DEVELOPMENT
 * Creates sample bank accounts
 * 
 * @param {BequeathalActions} bequeathalActions - Bequeathal actions interface
 */
export const seedBankAccountsData = (bequeathalActions: BequeathalActions) => {
  console.log('🌱 SEEDING BANK ACCOUNTS DATA - Development Action');
  
  const sampleAccounts = [
    {
      title: 'Barclays - Current Account',
      provider: 'Barclays',
      accountType: 'current' as const,
      accountNumber: '****5678',
      estimatedValue: 3250,
      netValue: 3250,
      currentBalance: 3250,
    },
    {
      title: 'HSBC - Joint Account',
      provider: 'HSBC',
      accountType: 'joint' as const,
      ownershipType: 'joint' as const,
      accountNumber: '****4321',
      estimatedValue: 45000,
      netValue: 45000,
      currentBalance: 45000,
    },
  ];
  
  sampleAccounts.forEach(account => {
    bequeathalActions.addAsset('bank-accounts', account);
  });
  
  console.log(`✅ Successfully seeded ${sampleAccounts.length} bank accounts`);
  console.log(`💰 Total account value: £${sampleAccounts.reduce((sum, account) => sum + account.estimatedValue, 0).toLocaleString()}`);
};

/**
 * SEED IMPORTANT ITEMS DATA FUNCTION FOR DEVELOPMENT
 * Creates sample important items (jewelry, artwork, etc.)
 * 
 * @param {PersonActions} personActions - Person actions interface
 * @param {BequeathalActions} bequeathalActions - Bequeathal actions interface
 */
export const seedImportantItemsData = async (personActions: PersonActions, bequeathalActions: BequeathalActions) => {
  console.log('🌱 SEEDING IMPORTANT ITEMS DATA - Development Action');
  
  // Get or create beneficiaries
  const existingPeople = personActions.getBeneficiaries();
  let samplePersonIds: string[] = [];
  
  if (existingPeople.length === 0) {
    const james = await personActions.addPerson({ 
      firstName: 'James', 
      lastName: 'Thompson', 
      email: '',
      phone: '',
      relationship: 'biological-child',
      roles: ['beneficiary', 'family-member']
    });
    samplePersonIds = [james.id];
  } else {
    samplePersonIds = existingPeople.map(p => p.id);
  }
  
  const sampleItems = [
    {
      title: 'Grandmother\'s Wedding Ring',
      category: 'jewelry',
      beneficiaryId: samplePersonIds[0],
      heldInTrust: 'no' as const,
      estimatedValue: 2500,
      netValue: 2500,
      description: 'Family heirloom passed down through generations. 18ct gold with sapphire.',
    },
    {
      title: 'Father\'s Rolex Submariner',
      category: 'jewelry',
      beneficiaryId: samplePersonIds[0],
      heldInTrust: 'yes' as const,
      estimatedValue: 8500,
      netValue: 8500,
      description: 'Vintage 1970s Rolex Submariner. Serviced in 2023.',
    },
  ];
  
  sampleItems.forEach(item => {
    bequeathalActions.addAsset('important-items', item);
  });
  
  console.log(`✅ Successfully seeded ${sampleItems.length} important items`);
  console.log(`💰 Total items value: £${sampleItems.reduce((sum, item) => sum + item.estimatedValue, 0).toLocaleString()}`);
};

/**
 * SEED ALL DATA FUNCTION
 * Runs all seed functions in sequence
 * 
 * @param {PersonActions} personActions - Person actions interface
 * @param {BequeathalActions} bequeathalActions - Bequeathal actions interface
 */
export const seedAllData = async (personActions: PersonActions, bequeathalActions: BequeathalActions) => {
  console.log('🌱🌱🌱 SEEDING ALL DATA 🌱🌱🌱');
  
  await seedUserData(personActions);
  seedPropertyData(bequeathalActions);
  await seedInvestmentsData(personActions, bequeathalActions);
  seedPensionsData(bequeathalActions);
  seedBankAccountsData(bequeathalActions);
  await seedImportantItemsData(personActions, bequeathalActions);
  
  console.log('✅✅✅ ALL SEED DATA LOADED ✅✅✅');
};

