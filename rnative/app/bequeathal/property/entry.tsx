/**
 * Property Entry Screen
 * 
 * Main entry screen for adding/editing property assets.
 * Uses accordion pattern with conditional rendering based on property type.
 * 
 * Phase 14a.4: Shell implementation with state management
 * Phase 14a.5-14a.12: Individual accordion implementations
 * 
 * @module screens/bequeathal/property/entry
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Accordion, Input, Select, Checkbox, CurrencyInput, Switch, PercentageInput, RadioGroup } from '../../../src/components/ui';
import { SearchableSelect } from '../../../src/components/ui/SearchableSelect';
import { BeneficiaryWithPercentages } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { PropertyAsset, BeneficiaryAssignment } from '../../../src/types';

/**
 * UK Mortgage Providers
 */
const MORTGAGE_PROVIDERS = [
  { label: 'No mortgage', value: 'no_mortgage' },
  { label: '───────────────', value: 'separator', disabled: true },
  { label: 'Barclays', value: 'barclays' },
  { label: 'HSBC', value: 'hsbc' },
  { label: 'Lloyds Bank', value: 'lloyds' },
  { label: 'NatWest', value: 'natwest' },
  { label: 'Santander', value: 'santander' },
  { label: 'Halifax', value: 'halifax' },
  { label: 'Nationwide Building Society', value: 'nationwide' },
  { label: 'TSB', value: 'tsb' },
  { label: 'Bank of Scotland', value: 'bank_of_scotland' },
  { label: 'Virgin Money', value: 'virgin_money' },
  { label: 'First Direct', value: 'first_direct' },
  { label: 'Coventry Building Society', value: 'coventry' },
  { label: 'Yorkshire Building Society', value: 'yorkshire' },
  { label: 'Skipton Building Society', value: 'skipton' },
  { label: 'Leeds Building Society', value: 'leeds' },
  { label: 'Principality Building Society', value: 'principality' },
  { label: 'Newcastle Building Society', value: 'newcastle' },
  { label: 'Metro Bank', value: 'metro' },
  { label: 'Atom Bank', value: 'atom' },
  { label: 'Monzo', value: 'monzo' },
  { label: 'Starling Bank', value: 'starling' },
  { label: 'Revolut', value: 'revolut' },
  { label: 'Chase', value: 'chase' },
  { label: 'Tide', value: 'tide' },
  { label: 'Other', value: 'other' },
];

/**
 * Property data state structure (83 fields total)
 */
interface PropertyData {
  // Address (5 fields)
  address1: string;
  address2: string;
  townCity: string;
  countyState: string;
  country: string;

  // Usage & Type (2 fields)
  usage: string;
  propertyType: string;

  // FHL Details (4 fields - conditional)
  fhlAvailableOver210Days: boolean;
  fhlActuallyLet105Days: boolean;
  fhlLongLetsUnder155Days: boolean;
  fhlEstimatedAnnualIncome: number;

  // Agricultural Details (7 fields - conditional)
  agriculturalActivelyFarmed: boolean;
  agriculturalWhoFarms: string;
  agriculturalPre1995Tenancy: boolean;
  agriculturalBuildingsIncluded: boolean;
  agriculturalTotalAcreage: string;
  agriculturalFarmingType: string;
  agriculturalFarmingTypeOther: string;

  // Mixed-Use Details (3 fields - conditional)
  mixedUseCommercialPercentage: number;
  mixedUseSeparateEntrances: boolean;
  mixedUseResidentialWasMainHome: boolean;

  // Buy-to-Let Details (4 fields - conditional)
  buyToLetAnnualRentalIncome: number;
  buyToLetTenancyType: string;
  buyToLetTenancyTypeOther: string;
  buyToLetTenantedAtDeath: boolean;

  // Property Details (6 fields - removed mortgageResponsibility)
  ownershipType: string;
  estimatedValue: number;
  acquisitionMonth: string;
  acquisitionYear: string;
  mortgageProvider: string;
  mortgageAmount: number;

  // Company Ownership (6 fields - conditional)
  companyName: string;
  companyCountryOfRegistration: string;
  companyOwnershipPercentage: number;
  companyShareClass: string;
  companyNotes: string;
  companyArticlesConfident: boolean;

  // Joint Ownership (conditional)
  jointOwnershipType: string;
  jointTenantCount: number;
  tenantsInCommonCount: number;
  tenantsInCommonPercentage: number;

  // Trust (3 base fields - conditional, more in Phase 14b)
  trustName: string;
  trustType: string;
  trustRole: string;
}

export default function PropertyEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions } = useAppState();
  const params = useLocalSearchParams();
  const editingPropertyId = params.id as string | undefined;

  // Accordion expansion state (only one open at a time)
  const [expandedAccordion, setExpandedAccordion] = useState<string>('address');

  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryAssignment[]>([]);
  
  // Track which property ID we've loaded (prevent infinite loop)
  const loadedPropertyIdRef = useRef<string | null>(null);

  // Property data (single object with all 83 fields)
  const [propertyData, setPropertyData] = useState<PropertyData>({
    // Address
    address1: '',
    address2: '',
    townCity: '',
    countyState: '',
    country: '',
    
    // Usage & Type
    usage: '',
    propertyType: '',
    
    // FHL
    fhlAvailableOver210Days: true,
    fhlActuallyLet105Days: true,
    fhlLongLetsUnder155Days: true,
    fhlEstimatedAnnualIncome: 0,
    
    // Agricultural
    agriculturalActivelyFarmed: true,
    agriculturalWhoFarms: '',
    agriculturalPre1995Tenancy: false,
    agriculturalBuildingsIncluded: false,
    agriculturalTotalAcreage: '',
    agriculturalFarmingType: '',
    agriculturalFarmingTypeOther: '',
    
    // Mixed-Use
    mixedUseCommercialPercentage: 0,
    mixedUseSeparateEntrances: false,
    mixedUseResidentialWasMainHome: false,
    
    // Buy-to-Let
    buyToLetAnnualRentalIncome: 0,
    buyToLetTenancyType: '',
    buyToLetTenancyTypeOther: '',
    buyToLetTenantedAtDeath: false,
    
    // Property Details
    ownershipType: '',
    estimatedValue: 0,
    acquisitionMonth: '',
    acquisitionYear: '',
    mortgageProvider: 'no_mortgage',
    mortgageAmount: 0,
    
    // Company Ownership
    companyName: '',
    companyCountryOfRegistration: 'uk',
    companyOwnershipPercentage: 100,
    companyShareClass: '',
    companyNotes: '',
    companyArticlesConfident: false,
    
    // Joint Ownership
    jointOwnershipType: '',
    jointTenantCount: 2,
    tenantsInCommonCount: 1,
    tenantsInCommonPercentage: 50,
    
    // Trust
    trustName: '',
    trustType: '',
    trustRole: '',
  });

  // Load existing property data if editing
  useEffect(() => {
    if (!editingPropertyId) {
      loadedPropertyIdRef.current = null; // Reset when not editing
      return;
    }
    
    // Already loaded THIS specific property? Don't reload
    if (loadedPropertyIdRef.current === editingPropertyId) return;
    
    // Check if data is loaded - if empty, wait for next render when data arrives
    const allAssets = bequeathalActions.getAllAssets();
    if (allAssets.length === 0) {
      console.log('⏳ Waiting for AsyncStorage to load...');
      return; // Will re-run on next render
    }
    
    console.log('✅ Data loaded, finding property for ID:', editingPropertyId);
    
    const asset = bequeathalActions.getAssetById(editingPropertyId);
    
    if (!asset || asset.type !== 'property') {
      console.log('❌ Property not found');
      loadedPropertyIdRef.current = editingPropertyId; // Mark as attempted
      return;
    }
    
    const property = asset as PropertyAsset;
    console.log('✅ Property found:', property.address?.address1);
    
    // Populate form with existing property data
    setPropertyData({
      // Address
      address1: property.address?.address1 || '',
      address2: property.address?.address2 || '',
      townCity: property.address?.city || '',
      countyState: property.address?.county || '',
      country: property.address?.country || '',
      
      // Usage & Type
      usage: property.usage || '',
      propertyType: property.propertyType || '',
      
      // FHL
      fhlAvailableOver210Days: property.fhlAvailableOver210Days ?? true,
      fhlActuallyLet105Days: property.fhlActuallyLet105Days ?? true,
      fhlLongLetsUnder155Days: property.fhlLongLetsUnder155Days ?? true,
      fhlEstimatedAnnualIncome: property.fhlEstimatedAnnualIncome || 0,
      
      // Agricultural
      agriculturalActivelyFarmed: property.agriculturalActivelyFarmed ?? true,
      agriculturalWhoFarms: '',
      agriculturalPre1995Tenancy: false,
      agriculturalBuildingsIncluded: property.agriculturalBuildingsIncluded ?? false,
      agriculturalTotalAcreage: '',
      agriculturalFarmingType: '',
      agriculturalFarmingTypeOther: '',
      
      // Mixed-Use
      mixedUseCommercialPercentage: property.mixedUseCommercialPercentage || 0,
      mixedUseSeparateEntrances: property.mixedUseSeparateEntrances ?? false,
      mixedUseResidentialWasMainHome: property.mixedUseResidentialWasMainHome ?? false,
      
      // Buy-to-Let
      buyToLetAnnualRentalIncome: property.buyToLetAnnualRentalIncome || 0,
      buyToLetTenancyType: property.buyToLetTenancyType || '',
      buyToLetTenancyTypeOther: property.buyToLetTenancyTypeOther || '',
      buyToLetTenantedAtDeath: property.buyToLetTenantedAtDeath ?? false,
      
      // Property Details
      ownershipType: property.ownershipType || '',
      estimatedValue: property.estimatedValue || 0,
      acquisitionMonth: property.acquisitionMonth || '',
      acquisitionYear: property.acquisitionYear || '',
      mortgageProvider: property.mortgage?.provider || 'no_mortgage',
      mortgageAmount: property.mortgage?.outstandingAmount || 0,
      
      // Company Ownership
      companyName: property.companyName || '',
      companyCountryOfRegistration: property.companyCountryOfRegistration || 'uk',
      companyOwnershipPercentage: property.companyOwnershipPercentage || 100,
      companyShareClass: property.companyShareClass || '',
      companyNotes: property.companyNotes || '',
      companyArticlesConfident: property.companyArticlesConfident ?? false,
      
      // Joint Ownership
      jointOwnershipType: property.jointOwnershipType || '',
      jointTenantCount: property.jointTenants?.length || 2,
      tenantsInCommonCount: 1, // Default, not stored in PropertyAsset
      tenantsInCommonPercentage: property.ownershipPercentage || 50,
      
      // Trust
      trustName: property.trustName || '',
      trustType: property.trustType || '',
      trustRole: property.trustRole || '',
    });
    
    // Load beneficiaries
    if (property.beneficiaryAssignments?.beneficiaries) {
      setBeneficiaries(property.beneficiaryAssignments.beneficiaries);
    }
    
    loadedPropertyIdRef.current = editingPropertyId; // Mark THIS property as loaded
    console.log('✅ Form populated successfully');
  }); // NO dependency array - runs every render, but ref prevents duplicate work

  // Helper: Update property data
  const updatePropertyData = (field: keyof PropertyData, value: any) => {
    setPropertyData(prev => ({ ...prev, [field]: value }));
  };

  // Conditional rendering helpers
  const isFHL = () => {
    return propertyData.propertyType.includes('furnished_holiday_let');
  };

  const isAgricultural = () => {
    return propertyData.propertyType === 'agricultural_property';
  };

  const isMixedUse = () => {
    return propertyData.propertyType === 'mixed_use_property';
  };

  const isBuyToLet = () => {
    return propertyData.propertyType === 'buy_to_let';
  };

  const isCompanyOwned = () => {
    return propertyData.ownershipType === 'company_owned';
  };

  const isTrustOwned = () => {
    return propertyData.ownershipType === 'trust_owned';
  };

  const isJointlyOwned = () => {
    return propertyData.ownershipType === 'jointly_owned';
  };

  const hasMortgage = () => {
    return propertyData.mortgageProvider && propertyData.mortgageProvider !== 'no_mortgage';
  };

  // FHL qualification check
  const fhlQualifies = () => {
    return propertyData.fhlAvailableOver210Days && 
           propertyData.fhlActuallyLet105Days && 
           propertyData.fhlLongLetsUnder155Days;
  };

  // Net value calculation
  const getNetValue = () => {
    const value = propertyData.estimatedValue || 0;
    const mortgage = propertyData.mortgageAmount || 0;
    return value - mortgage;
  };

  // Save property and navigate
  const handleSave = () => {
    // Convert propertyData to PropertyAsset format
    const propertyAsset = {
      type: 'property' as const,
      title: propertyData.address1, // Use address as title
      
      // Address
      address: {
        address1: propertyData.address1,
        address2: propertyData.address2,
        city: propertyData.townCity,
        county: propertyData.countyState,
        postcode: '', // Not collected for property (international)
        country: propertyData.country,
      },
      
      // Usage & Type
      usage: propertyData.usage as PropertyAsset['usage'],
      propertyType: propertyData.propertyType,
      
      // Ownership
      ownershipType: propertyData.ownershipType as PropertyAsset['ownershipType'],
      ownershipPercentage: propertyData.tenantsInCommonPercentage > 0 ? propertyData.tenantsInCommonPercentage : undefined,
      
      // Estimated value
      estimatedValue: propertyData.estimatedValue,
      
      // Mortgage (if applicable)
      hasMortgage: hasMortgage() || undefined,
      mortgage: hasMortgage() ? {
        outstandingAmount: propertyData.mortgageAmount,
        provider: propertyData.mortgageProvider,
      } : undefined,
      
      // Acquisition (optional)
      acquisitionMonth: propertyData.acquisitionMonth || undefined,
      acquisitionYear: propertyData.acquisitionYear || undefined,
      
      // FHL fields (conditional)
      fhlAvailableOver210Days: isFHL() ? propertyData.fhlAvailableOver210Days : undefined,
      fhlActuallyLet105Days: isFHL() ? propertyData.fhlActuallyLet105Days : undefined,
      fhlLongLetsUnder155Days: isFHL() ? propertyData.fhlLongLetsUnder155Days : undefined,
      fhlEstimatedAnnualIncome: isFHL() ? propertyData.fhlEstimatedAnnualIncome : undefined,
      
      // Agricultural fields (conditional)
      agriculturalActivelyFarmed: isAgricultural() ? propertyData.agriculturalActivelyFarmed : undefined,
      agriculturalBuildingsIncluded: isAgricultural() ? propertyData.agriculturalBuildingsIncluded : undefined,
      
      // Mixed-Use fields (conditional)
      mixedUseCommercialPercentage: isMixedUse() ? propertyData.mixedUseCommercialPercentage : undefined,
      mixedUseSeparateEntrances: isMixedUse() ? propertyData.mixedUseSeparateEntrances : undefined,
      mixedUseResidentialWasMainHome: isMixedUse() ? propertyData.mixedUseResidentialWasMainHome : undefined,
      
      // Buy-to-Let fields (conditional)
      buyToLetAnnualRentalIncome: isBuyToLet() ? propertyData.buyToLetAnnualRentalIncome : undefined,
      buyToLetTenancyType: isBuyToLet() ? (propertyData.buyToLetTenancyType as any) : undefined,
      buyToLetTenancyTypeOther: isBuyToLet() ? propertyData.buyToLetTenancyTypeOther : undefined,
      buyToLetTenantedAtDeath: isBuyToLet() ? propertyData.buyToLetTenantedAtDeath : undefined,
      
      // Company ownership (conditional)
      companyName: isCompanyOwned() ? propertyData.companyName : undefined,
      companyOwnershipPercentage: isCompanyOwned() ? propertyData.companyOwnershipPercentage : undefined,
      companyCountryOfRegistration: isCompanyOwned() ? propertyData.companyCountryOfRegistration : undefined,
      companyShareClass: isCompanyOwned() ? propertyData.companyShareClass : undefined,
      companyNotes: isCompanyOwned() ? propertyData.companyNotes : undefined,
      companyArticlesConfident: isCompanyOwned() ? propertyData.companyArticlesConfident : undefined,
      
      // Trust (conditional)
      trustName: isTrustOwned() ? propertyData.trustName : undefined,
      trustType: isTrustOwned() ? (propertyData.trustType as any) : undefined,
      trustRole: isTrustOwned() ? (propertyData.trustRole as any) : undefined,
      
      // Joint ownership (conditional)
      jointOwnershipType: isJointlyOwned() ? (propertyData.jointOwnershipType as any) : undefined,
      jointTenants: isJointlyOwned() && propertyData.jointOwnershipType === 'joint_tenants' 
        ? [{ id: 'placeholder', name: `${propertyData.jointTenantCount} joint tenants`, relationship: '' }]
        : undefined,
      
      // Beneficiaries
      beneficiaryAssignments: !isTrustOwned() && beneficiaries.length > 0 ? {
        beneficiaries,
      } : undefined,
    };

    // Save to state - update if editing, add if new
    if (editingPropertyId) {
      bequeathalActions.updateAsset(editingPropertyId, propertyAsset as any);
    } else {
      bequeathalActions.addAsset('property', propertyAsset as any);
    }
    
    // Navigate to summary
    router.push('/bequeathal/property/summary');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="home" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Property Details</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Accordion Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.accordionContainer}>
            {/* Accordion 1: Address (Always) */}
            <Accordion
              title="Address"
              icon="map-marker"
              expanded={expandedAccordion === 'address'}
              onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'address' : '')}
            >
              <View style={styles.accordionContent}>
                <Input
                  label="Address Line 1 *"
                  placeholder="Enter first line of address..."
                  value={propertyData.address1}
                  onChangeText={(value) => updatePropertyData('address1', value)}
                />

                <Input
                  label="Address Line 2"
                  placeholder="Enter second line of address (optional)..."
                  value={propertyData.address2}
                  onChangeText={(value) => updatePropertyData('address2', value)}
                />

                <Input
                  label="Town/City *"
                  placeholder="Enter town or city..."
                  value={propertyData.townCity}
                  onChangeText={(value) => updatePropertyData('townCity', value)}
                />

                <Input
                  label="County/State"
                  placeholder="Enter county or state (optional)..."
                  value={propertyData.countyState}
                  onChangeText={(value) => updatePropertyData('countyState', value)}
                />

                <Select
                  label="Country *"
                  placeholder="Select country..."
                  value={propertyData.country}
                  options={[
                    { label: 'United Kingdom', value: 'uk' },
                    { label: 'United States', value: 'us' },
                    { label: 'Canada', value: 'canada' },
                    { label: 'Australia', value: 'australia' },
                    { label: 'Ireland', value: 'ireland' },
                    { label: 'France', value: 'france' },
                    { label: 'Germany', value: 'germany' },
                    { label: 'Spain', value: 'spain' },
                    { label: 'Italy', value: 'italy' },
                    { label: 'Netherlands', value: 'netherlands' },
                  ]}
                  onChange={(value) => updatePropertyData('country', value)}
                />

                <Button
                  onPress={() => setExpandedAccordion('usage')}
                  variant="primary"
                  disabled={!propertyData.address1 || !propertyData.townCity || !propertyData.country}
                >
                  Next
                </Button>
              </View>
            </Accordion>

            {/* Accordion 2: Usage & Type (Always) */}
            <Accordion
              title="Usage & Type"
              icon="home-variant"
              expanded={expandedAccordion === 'usage'}
              onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'usage' : '')}
            >
              <View style={styles.accordionContent}>
                <Select
                  label="Usage *"
                  placeholder="Select property usage..."
                  value={propertyData.usage}
                  options={[
                    { label: 'Residential', value: 'residential' },
                    { label: 'Let Residential', value: 'let_residential' },
                    { label: 'Commercial', value: 'commercial' },
                  ]}
                  onChange={(value) => {
                    updatePropertyData('usage', value);
                    // Clear property type when usage changes
                    updatePropertyData('propertyType', '');
                  }}
                />

                {propertyData.usage && (
                  <Select
                    label="Property Type *"
                    placeholder="Select property type..."
                    value={propertyData.propertyType}
                    options={
                      propertyData.usage === 'residential'
                        ? [
                            { label: 'Primary Residence', value: 'primary_residence' },
                            { label: 'Second Home', value: 'second_home' },
                            { label: 'Holiday Home', value: 'holiday_home' },
                          ]
                        : propertyData.usage === 'let_residential'
                        ? [
                            { label: 'Buy To Let', value: 'buy_to_let' },
                            { label: 'Furnished Holiday Let', value: 'furnished_holiday_let' },
                            { label: 'Short-term Let/Airbnb', value: 'short_term_let' },
                          ]
                        : propertyData.usage === 'commercial'
                        ? [
                            { label: 'Mixed-Use Property (shop with flat above)', value: 'mixed_use_property' },
                            { label: 'Agricultural Property', value: 'agricultural_property' },
                            { label: 'Furnished Holiday Let (Commercial)', value: 'furnished_holiday_let_commercial' },
                          ]
                        : []
                    }
                    onChange={(value) => updatePropertyData('propertyType', value)}
                  />
                )}

                <Button
                  onPress={() => {
                    // Next button logic - opens appropriate accordion
                    if (isFHL()) {
                      setExpandedAccordion('fhl');
                    } else if (isAgricultural()) {
                      setExpandedAccordion('agricultural');
                    } else if (isMixedUse()) {
                      setExpandedAccordion('mixeduse');
                    } else if (isBuyToLet()) {
                      setExpandedAccordion('buytolet');
                    } else {
                      setExpandedAccordion('details');
                    }
                  }}
                  variant="primary"
                  disabled={!propertyData.usage || !propertyData.propertyType}
                >
                  Next
                </Button>
              </View>
            </Accordion>

            {/* Accordion 3: FHL Details (Conditional) */}
            {isFHL() && (
              <Accordion
                title="FHL Details"
                icon="beach"
                expanded={expandedAccordion === 'fhl'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'fhl' : '')}
              >
                <View style={styles.accordionContent}>
                  <Text style={styles.helperText}>
                    Furnished Holiday Let (FHL) qualification criteria for Business Property Relief (BPR). 
                    Qualifying FHLs may receive 50-100% IHT relief, potentially saving up to £160,000 on a £400,000 property.
                  </Text>

                  <Checkbox
                    label="Available to let 210+ days/year? *"
                    checked={propertyData.fhlAvailableOver210Days}
                    onCheckedChange={(value) => updatePropertyData('fhlAvailableOver210Days', value)}
                  />

                  <Checkbox
                    label="Actually let 105+ days/year? *"
                    checked={propertyData.fhlActuallyLet105Days}
                    onCheckedChange={(value) => updatePropertyData('fhlActuallyLet105Days', value)}
                  />

                  <Checkbox
                    label="Long lets (31+ days) under 155 days/year? *"
                    checked={propertyData.fhlLongLetsUnder155Days}
                    onCheckedChange={(value) => updatePropertyData('fhlLongLetsUnder155Days', value)}
                  />

                  {/* Real-time FHL Qualification Status */}
                  <View style={fhlQualifies() ? styles.qualificationSuccess : styles.qualificationWarning}>
                    {fhlQualifies() ? (
                      <Text style={styles.qualificationSuccessText}>
                        ✓ Qualifies for FHL status (Business Property Relief - 50-100% IHT relief possible)
                      </Text>
                    ) : (
                      <Text style={styles.qualificationWarningText}>
                        ⚠️ Does not qualify as FHL. Will be treated as standard let property.
                      </Text>
                    )}
                  </View>

                  <CurrencyInput
                    label="Estimated Annual Income *"
                    placeholder="Enter annual rental income..."
                    value={propertyData.fhlEstimatedAnnualIncome}
                    onValueChange={(value) => updatePropertyData('fhlEstimatedAnnualIncome', value)}
                  />

                  <Button
                    onPress={() => setExpandedAccordion('details')}
                    variant="primary"
                    disabled={propertyData.fhlEstimatedAnnualIncome === 0}
                  >
                    Next
                  </Button>
                </View>
              </Accordion>
            )}

            {/* Accordion 4: Agricultural Details (Conditional) */}
            {isAgricultural() && (
              <Accordion
                title="Agricultural Details"
                icon="tractor"
                expanded={expandedAccordion === 'agricultural'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'agricultural' : '')}
              >
                <View style={styles.accordionContent}>
                  <Text style={styles.helperText}>
                    Agricultural Property Relief (APR) can provide up to 100% IHT relief on qualifying farmland.
                  </Text>

                  <Switch
                    label="Actively farmed? *"
                    value={propertyData.agriculturalActivelyFarmed}
                    onValueChange={(value) => updatePropertyData('agriculturalActivelyFarmed', value)}
                  />

                  {!propertyData.agriculturalActivelyFarmed && (
                    <View style={styles.qualificationWarning}>
                      <Text style={styles.qualificationWarningText}>
                        ⚠️ May not qualify for Agricultural Property Relief if not actively farmed.
                      </Text>
                    </View>
                  )}

                  <Switch
                    label="Includes agricultural buildings?"
                    value={propertyData.agriculturalBuildingsIncluded}
                    onValueChange={(value) => updatePropertyData('agriculturalBuildingsIncluded', value)}
                  />

                  {propertyData.agriculturalBuildingsIncluded && (
                    <Text style={styles.helperText}>
                      APR can cover farmhouses, barns and buildings if in agricultural use
                    </Text>
                  )}

                  <Button
                    onPress={() => setExpandedAccordion('details')}
                    variant="primary"
                  >
                    Next
                  </Button>
                </View>
              </Accordion>
            )}

            {/* Accordion 5: Mixed-Use Details (Conditional) */}
            {isMixedUse() && (
              <Accordion
                title="Mixed-Use Details"
                icon="store"
                expanded={expandedAccordion === 'mixeduse'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'mixeduse' : '')}
              >
                <View style={styles.accordionContent}>
                  <Text style={styles.helperText}>
                    Common examples: Shop with flat above, pub with accommodation, office with residential units
                  </Text>

                  <PercentageInput
                    label="Commercial use percentage? *"
                    placeholder="Enter percentage..."
                    value={propertyData.mixedUseCommercialPercentage}
                    onValueChange={(value) => updatePropertyData('mixedUseCommercialPercentage', value)}
                  />

                  {propertyData.mixedUseCommercialPercentage > 0 && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        Residential portion: {100 - propertyData.mixedUseCommercialPercentage}%
                      </Text>
                      <Text style={[styles.infoText, { marginTop: Spacing.xs }]}>
                        Split determines tax treatment - partial RNRB may be possible on residential portion. 
                        RNRB (£175k) applies ONLY to residential portion.
                      </Text>
                      <Text style={[styles.infoText, { marginTop: Spacing.xs, fontWeight: Typography.fontWeight.semibold }]}>
                        Example: £500k property, {100 - propertyData.mixedUseCommercialPercentage}% residential = 
                        £{Math.round((100 - propertyData.mixedUseCommercialPercentage) * 175000 / 100).toLocaleString()} RNRB = 
                        £{Math.round((100 - propertyData.mixedUseCommercialPercentage) * 49000 / 100).toLocaleString()} IHT saved
                      </Text>
                    </View>
                  )}

                  <Checkbox
                    label="Separate entrances for residential and commercial?"
                    checked={propertyData.mixedUseSeparateEntrances}
                    onCheckedChange={(value) => updatePropertyData('mixedUseSeparateEntrances', value)}
                  />

                  {propertyData.mixedUseSeparateEntrances && (
                    <Text style={styles.helperText}>
                      Properties with separate access can often be valued separately for tax purposes
                    </Text>
                  )}

                  <Checkbox
                    label="Residential portion ever your main home?"
                    checked={propertyData.mixedUseResidentialWasMainHome}
                    onCheckedChange={(value) => updatePropertyData('mixedUseResidentialWasMainHome', value)}
                  />

                  {propertyData.mixedUseResidentialWasMainHome && (
                    <Text style={styles.helperText}>
                      Important for Principal Private Residence (PPR) relief and Capital Gains Tax (CGT)
                    </Text>
                  )}

                  <Button
                    onPress={() => setExpandedAccordion('details')}
                    variant="primary"
                    disabled={propertyData.mixedUseCommercialPercentage === 0}
                  >
                    Next
                  </Button>
                </View>
              </Accordion>
            )}

            {/* Accordion 6: Buy-to-Let Details (Conditional) */}
            {isBuyToLet() && (
              <Accordion
                title="Buy-to-Let Details"
                icon="key"
                expanded={expandedAccordion === 'buytolet'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'buytolet' : '')}
              >
                <View style={styles.accordionContent}>
                  <CurrencyInput
                    label="Annual rental income? *"
                    placeholder="Enter annual rental income..."
                    value={propertyData.buyToLetAnnualRentalIncome}
                    onValueChange={(value) => updatePropertyData('buyToLetAnnualRentalIncome', value)}
                  />

                  {propertyData.buyToLetAnnualRentalIncome > 0 && (
                    <Text style={styles.helperText}>
                      Total rental income per year - needed for estate valuation
                    </Text>
                  )}

                  <Select
                    label="Current tenancy type? *"
                    placeholder="Select tenancy type..."
                    value={propertyData.buyToLetTenancyType}
                    options={[
                      { label: 'AST (Assured Shorthold Tenancy)', value: 'ast' },
                      { label: 'Company Let', value: 'company_let' },
                      { label: 'Unknown', value: 'unknown' },
                      { label: 'Other', value: 'other' },
                    ]}
                    onChange={(value) => updatePropertyData('buyToLetTenancyType', value)}
                  />

                  {propertyData.buyToLetTenancyType && (
                    <Text style={styles.helperText}>
                      Type of tenancy affects vacant possession value calculations
                    </Text>
                  )}

                  {propertyData.buyToLetTenancyType === 'other' && (
                    <Input
                      label="Specify tenancy type *"
                      placeholder="Please specify the tenancy type..."
                      value={propertyData.buyToLetTenancyTypeOther}
                      onChangeText={(value) => updatePropertyData('buyToLetTenancyTypeOther', value)}
                    />
                  )}

                  <Checkbox
                    label="Expected to be tenanted at death"
                    checked={propertyData.buyToLetTenantedAtDeath}
                    onCheckedChange={(value) => updatePropertyData('buyToLetTenantedAtDeath', value)}
                    borderColor={KindlingColors.beige}
                  />

                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      ℹ️ Buy-to-let properties that are tenanted at death are typically valued less for IHT purposes (a saving).
                    </Text>
                  </View>

                  <Button
                    onPress={() => setExpandedAccordion('details')}
                    variant="primary"
                    disabled={
                      propertyData.buyToLetAnnualRentalIncome === 0 ||
                      !propertyData.buyToLetTenancyType ||
                      (propertyData.buyToLetTenancyType === 'other' && !propertyData.buyToLetTenancyTypeOther)
                    }
                  >
                    Next
                  </Button>
                </View>
              </Accordion>
            )}

            {/* Accordion 7: Property Details (Always) */}
            <Accordion
              title="Property Details"
              icon="information"
              expanded={expandedAccordion === 'details'}
              onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'details' : '')}
            >
              <View style={styles.accordionContent}>
                <Select
                  label="Ownership Type *"
                  placeholder="Select ownership type..."
                  value={propertyData.ownershipType}
                  options={[
                    { label: 'Personally owned', value: 'personally_owned' },
                    { label: 'Jointly owned', value: 'jointly_owned' },
                    { label: 'Owned Through Company', value: 'company_owned' },
                    { label: 'Owned through Trust', value: 'trust_owned' },
                  ]}
                  onChange={(value) => updatePropertyData('ownershipType', value)}
                />

                <CurrencyInput
                  label="Estimated Value *"
                  placeholder="Enter property value..."
                  value={propertyData.estimatedValue}
                  onValueChange={(value) => updatePropertyData('estimatedValue', value)}
                />

                {/* Acquisition Date (Optional) */}
                <Text style={styles.fieldLabel}>Acquisition Date (Optional)</Text>
                <Text style={styles.helperText}>
                  Month and year when property was acquired. Leave blank if unsure. 
                  Helpful for executor reference and possible CGT cost basis.
                </Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Select
                      placeholder="Month..."
                      value={propertyData.acquisitionMonth}
                      options={[
                        { label: 'January', value: '01' },
                        { label: 'February', value: '02' },
                        { label: 'March', value: '03' },
                        { label: 'April', value: '04' },
                        { label: 'May', value: '05' },
                        { label: 'June', value: '06' },
                        { label: 'July', value: '07' },
                        { label: 'August', value: '08' },
                        { label: 'September', value: '09' },
                        { label: 'October', value: '10' },
                        { label: 'November', value: '11' },
                        { label: 'December', value: '12' },
                      ]}
                      onChange={(value) => updatePropertyData('acquisitionMonth', value)}
                    />
                  </View>
                  <View style={styles.dateField}>
                    <Select
                      placeholder="Year..."
                      value={propertyData.acquisitionYear}
                      options={Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return { label: year.toString(), value: year.toString() };
                      })}
                      onChange={(value) => updatePropertyData('acquisitionYear', value)}
                    />
                  </View>
                </View>

                {/* Mortgage Provider */}
                <SearchableSelect
                  label="Mortgage Provider *"
                  placeholder="Search mortgage providers..."
                  value={propertyData.mortgageProvider}
                  options={MORTGAGE_PROVIDERS}
                  onChange={(value) => updatePropertyData('mortgageProvider', value)}
                  showSelectedCards={false}
                />

                {/* Mortgage Amount (conditional) */}
                {hasMortgage() && (
                  <>
                    <CurrencyInput
                      label="Mortgage Amount"
                      placeholder="Enter outstanding mortgage..."
                      value={propertyData.mortgageAmount}
                      onValueChange={(value) => updatePropertyData('mortgageAmount', value)}
                    />

                    {propertyData.estimatedValue > 0 && propertyData.mortgageAmount > 0 && (
                      <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                          Net Value: £{(propertyData.estimatedValue - propertyData.mortgageAmount).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                <Button
                  onPress={() => {
                    if (isTrustOwned()) {
                      // Navigate to Trust Details screen (Phase 14b)
                      router.push('/bequeathal/property/trust-details');
                    } else if (isCompanyOwned()) {
                      setExpandedAccordion('company');
                    } else {
                      // Show beneficiaries or joint ownership sections
                      setExpandedAccordion('');
                    }
                  }}
                  variant="primary"
                  disabled={propertyData.estimatedValue === 0 || !propertyData.ownershipType || !propertyData.mortgageProvider}
                >
                  {isTrustOwned() ? 'Continue to Trust Details' : isCompanyOwned() ? 'Next' : 'Continue'}
                </Button>
              </View>
            </Accordion>

            {/* Accordion 8: Company Ownership (Conditional) */}
            {isCompanyOwned() && (
              <Accordion
                title="Company Ownership"
                icon="office-building"
                expanded={expandedAccordion === 'company'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'company' : '')}
              >
                <View style={styles.accordionContent}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      ℹ️ This property is company-owned. Your shares in the company—not the property itself—form part of your estate and can be inherited.
                    </Text>
                  </View>

                  <Input
                    label="Company Name *"
                    placeholder="Enter company name..."
                    value={propertyData.companyName}
                    onChangeText={(value) => updatePropertyData('companyName', value)}
                  />

                  <Select
                    label="Country of Registration *"
                    placeholder="Select country..."
                    value={propertyData.companyCountryOfRegistration}
                    options={[
                      { label: 'United Kingdom', value: 'uk' },
                      { label: 'United States', value: 'us' },
                      { label: 'Ireland', value: 'ie' },
                      { label: 'France', value: 'fr' },
                      { label: 'Germany', value: 'de' },
                      { label: 'Spain', value: 'es' },
                      { label: 'Italy', value: 'it' },
                      { label: 'Netherlands', value: 'nl' },
                      { label: 'Other', value: 'other' },
                    ]}
                    onChange={(value) => updatePropertyData('companyCountryOfRegistration', value)}
                  />

                  <PercentageInput
                    label="Your % Share Holding in Company *"
                    placeholder="Enter percentage..."
                    value={propertyData.companyOwnershipPercentage}
                    onValueChange={(value) => updatePropertyData('companyOwnershipPercentage', value)}
                  />

                  <Input
                    label="Share Class"
                    placeholder="e.g. Ordinary, Class A (optional)..."
                    value={propertyData.companyShareClass}
                    onChangeText={(value) => updatePropertyData('companyShareClass', value)}
                  />

                  <Input
                    label="Notes"
                    placeholder="Transfer restrictions, special terms (optional)..."
                    value={propertyData.companyNotes}
                    onChangeText={(value) => updatePropertyData('companyNotes', value)}
                    multiline
                  />

                  <Checkbox
                    label="Confident articles of association allow property ownership transfer?"
                    checked={propertyData.companyArticlesConfident}
                    onCheckedChange={(value) => updatePropertyData('companyArticlesConfident', value)}
                  />

                  <Button
                    onPress={() => setExpandedAccordion('')}
                    variant="primary"
                    disabled={
                      !propertyData.companyName ||
                      !propertyData.companyCountryOfRegistration ||
                      propertyData.companyOwnershipPercentage === 0
                    }
                  >
                    Continue
                  </Button>
                </View>
              </Accordion>
            )}
          </View>

          {/* Joint Ownership Section (Outside Accordions) */}
          {isJointlyOwned() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Joint Ownership</Text>

              <RadioGroup
                label="Joint Ownership Type *"
                options={[
                  { label: 'Owned as Joint Tenants', value: 'joint_tenants' },
                  { label: 'Owned as Tenants in Common', value: 'tenants_in_common' },
                  { label: 'Not sure', value: 'not_sure' },
                ]}
                value={propertyData.jointOwnershipType}
                onChange={(value) => updatePropertyData('jointOwnershipType', value)}
              />

              {/* Joint Tenants Path */}
              {propertyData.jointOwnershipType === 'joint_tenants' && (
                <>
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ Property held as joint tenants automatically goes to surviving owners</Text>
                    <Text style={styles.warningText}>
                      Only if you're the last survivor can you leave this property to someone in your will.
                    </Text>
                  </View>

                  <Text style={styles.helperText}>
                    Number of joint tenants (including yourself):
                  </Text>
                  <Input
                    label="Number of Joint Tenants *"
                    placeholder="Enter number (2-10)..."
                    value={propertyData.jointTenantCount.toString()}
                    onChangeText={(value) => updatePropertyData('jointTenantCount', parseInt(value) || 2)}
                    type="number"
                  />
                </>
              )}

              {/* Tenants in Common Path */}
              {propertyData.jointOwnershipType === 'tenants_in_common' && (
                <>
                  <Input
                    label="Jointly owned with how many others? *"
                    placeholder="Enter number (1-9)..."
                    value={propertyData.tenantsInCommonCount.toString()}
                    onChangeText={(value) => updatePropertyData('tenantsInCommonCount', parseInt(value) || 1)}
                    type="number"
                  />

                  <PercentageInput
                    label="Your ownership percentage *"
                    placeholder="Enter your share..."
                    value={propertyData.tenantsInCommonPercentage}
                    onValueChange={(value) => updatePropertyData('tenantsInCommonPercentage', value)}
                  />

                  {propertyData.tenantsInCommonCount > 0 && (
                    <Text style={styles.helperText}>
                      Auto-calculated equal split: {(100 / (propertyData.tenantsInCommonCount + 1)).toFixed(1)}%
                    </Text>
                  )}
                </>
              )}

              {/* Not Sure Path */}
              {propertyData.jointOwnershipType === 'not_sure' && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    <Text style={{ fontWeight: Typography.fontWeight.semibold }}>Joint Tenants:</Text> Property automatically passes to surviving owner(s). You can only bequeath if you're the last survivor.
                  </Text>
                  <Text style={[styles.infoText, { marginTop: Spacing.sm }]}>
                    <Text style={{ fontWeight: Typography.fontWeight.semibold }}>Tenants in Common:</Text> Each owner has a specific share (e.g., 50%) which can be left to anyone in their will.
                  </Text>
                  <Text style={[styles.infoText, { marginTop: Spacing.sm }]}>
                    Check your property deeds or contact your solicitor to confirm which applies to you.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Beneficiaries Section (Outside Accordions) */}
          {!isTrustOwned() && (
            <View style={styles.section}>
              {/* Conditional heading based on ownership type */}
              <Text style={styles.sectionTitle}>
                {propertyData.jointOwnershipType === 'joint_tenants'
                  ? 'As last survivor, who receives this property?'
                  : propertyData.jointOwnershipType === 'tenants_in_common' && propertyData.tenantsInCommonPercentage > 0
                  ? `Who will receive your ${propertyData.tenantsInCommonPercentage}%?`
                  : isCompanyOwned()
                  ? 'Who will receive your company shares?'
                  : 'Who will receive this property?'}
              </Text>

              {isCompanyOwned() && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ Note: Your beneficiaries will inherit your company shares, which control this property.
                  </Text>
                </View>
              )}

              <BeneficiaryWithPercentages
                allocationMode="percentage"
                value={beneficiaries}
                onChange={setBeneficiaries}
                personActions={personActions}
                beneficiaryGroupActions={beneficiaryGroupActions}
                label="Property Beneficiaries *"
                useSliders={beneficiaries.length >= 3}
                requireComplete={false}
                onAddNewPerson={() => {
                  // TODO: Implement add person dialog
                  alert('Add person functionality to be implemented');
                }}
                onAddNewGroup={() => {
                  // TODO: Implement add group dialog
                  alert('Add group functionality to be implemented');
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button 
          onPress={handleSave}
          variant="primary"
          disabled={
            !propertyData.address1 ||
            !propertyData.townCity ||
            !propertyData.country ||
            !propertyData.usage ||
            !propertyData.propertyType ||
            propertyData.estimatedValue === 0 ||
            !propertyData.ownershipType ||
            !propertyData.mortgageProvider ||
            (isTrustOwned() ? false : beneficiaries.length === 0)
          }
        >
          {isTrustOwned() ? 'Continue to Trust Details' : 'Save Property'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}1a`,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerRight: {
    width: 48,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  accordionContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KindlingColors.border,
  },
  accordionContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: `${KindlingColors.cream}33`, // Light cream tint for content area
  },
  section: {
    backgroundColor: `${KindlingColors.cream}33`, // Light cream tint to distinguish from page background
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  placeholderText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  qualificationSuccess: {
    backgroundColor: `${KindlingColors.navy}1a`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.navy,
  },
  qualificationSuccessText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    lineHeight: 20,
  },
  qualificationWarning: {
    backgroundColor: '#FFF3CD',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  qualificationWarningText: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: `${KindlingColors.beige}33`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  warningTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#856404',
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
  },
});
