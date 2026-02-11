/**
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Navigation: Back → /bequeathal/private-company-shares/summary, Save → /bequeathal/private-company-shares/summary
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Input, CurrencyInput, Select, RadioGroup } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { validatePercentageAllocation } from '../../../src/utils/beneficiaryHelpers';
import type { PrivateCompanySharesAsset, BeneficiaryAssignment } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/private-company-shares/summary';

interface ShareForm {
  companyName: string;
  businessId: string;
  companyCountryOfRegistration: string;
  companyShareClass: string;
  companyNotes: string;
  companyArticlesConfident: string;
  ownershipValue: string;
  heldForTwoPlusYears: 'yes' | 'no' | 'not_sure' | '';
  acquisitionMonth: string;
  acquisitionYear: string;
  beneficiaries: BeneficiaryAssignment[];
  estimatedValue: number;
  notes: string;
  excludeFromNetWorth: boolean;
  isActivelyTrading: boolean;
  isNotHoldingCompany: boolean;
}

export default function PrivateCompanySharesEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, businessActions, willActions } = useAppState();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);

  const [ownershipMode, setOwnershipMode] = useState<'percentage' | 'shares'>('percentage');
  const [formData, setFormData] = useState<ShareForm>({
    companyName: '',
    businessId: '',
    companyCountryOfRegistration: 'uk',
    companyShareClass: 'ordinary',
    companyNotes: '',
    companyArticlesConfident: '',
    ownershipValue: '',
    heldForTwoPlusYears: '',
    acquisitionMonth: '',
    acquisitionYear: '',
    beneficiaries: [],
    estimatedValue: 0,
    notes: '',
    excludeFromNetWorth: false,
    isActivelyTrading: false,
    isNotHoldingCompany: false,
  });
  const [valueNotSure, setValueNotSure] = useState(false);
  const [companySelection, setCompanySelection] = useState<string>('__NEW__');
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  const companyOptions = [
    ...businessActions.getBusinesses().map(business => ({
      label: business.name,
      value: business.id,
    })),
    { label: 'Add new company', value: '__NEW__' },
  ];

  // Load existing asset when editing
  useEffect(() => {
    if (!editingAssetId) {
      loadedIdRef.current = null;
      return;
    }

    if (loadedIdRef.current === editingAssetId) return;

    const allAssets = bequeathalActions.getAllAssets();
    if (allAssets.length === 0) return;

    const asset = bequeathalActions.getAssetById(editingAssetId);
    if (!asset || asset.type !== 'private-company-shares') {
      router.push(SUMMARY_ROUTE as any);
      return;
    }

    const share = asset as PrivateCompanySharesAsset;
    loadedIdRef.current = editingAssetId;

    // Determine ownership mode
    if (share.numberOfShares) {
      setOwnershipMode('shares');
    } else {
      setOwnershipMode('percentage');
    }

    // Determine company selection
    if (share.businessId) {
      setCompanySelection(share.businessId);
    } else {
      setCompanySelection('__NEW__');
    }

    // Convert heldForTwoPlusYears boolean to string
    const heldForTwoPlusYears = share.heldForTwoPlusYears === true
      ? 'yes'
      : share.heldForTwoPlusYears === false
        ? 'no'
        : '';

    setFormData({
      companyName: share.companyName || '',
      businessId: share.businessId || '',
      companyCountryOfRegistration: share.companyCountryOfRegistration || 'uk',
      companyShareClass: share.shareClass || 'ordinary',
      companyNotes: share.companyNotes || '',
      companyArticlesConfident: share.companyArticlesConfident || '',
      ownershipValue: share.numberOfShares
        ? share.numberOfShares.toString()
        : share.percentageOwnership
          ? share.percentageOwnership.toString()
          : '',
      heldForTwoPlusYears: heldForTwoPlusYears as 'yes' | 'no' | 'not_sure' | '',
      acquisitionMonth: share.acquisitionMonth || '',
      acquisitionYear: share.acquisitionYear || '',
      beneficiaries: share.beneficiaryAssignments?.beneficiaries || [],
      estimatedValue: share.estimatedValue || 0,
      notes: share.notes || '',
      excludeFromNetWorth: share.excludeFromNetWorth || false,
      isActivelyTrading: share.isActivelyTrading || false,
      isNotHoldingCompany: share.isNotHoldingCompany || false,
    });
    setValueNotSure((share.estimatedValue || 0) === 0);
  }, [editingAssetId, bequeathalActions]);

  const handleCompanySelection = (value: string) => {
    setCompanySelection(value);
    if (value === '__NEW__') {
      setFormData(prev => ({
        ...prev,
        businessId: '',
        companyName: '',
        ownershipValue: '',
      }));
      return;
    }

    const business = businessActions.getBusinessById(value);
    if (business) {
      setFormData(prev => ({
        ...prev,
        businessId: business.id,
        companyName: business.name,
      }));
    }
  };

  const handleBeneficiariesChange = (newBeneficiaries: BeneficiaryAssignment[]) => {
    setFormData(prev => ({ ...prev, beneficiaries: newBeneficiaries }));
  };

  const handleToggleMode = (newMode: 'percentage' | 'shares') => {
    if (newMode === ownershipMode) return;
    setOwnershipMode(newMode);
    setFormData(prev => ({ ...prev, ownershipValue: '' })); // Clear input when switching
  };

  const handleSave = () => {
    // Validation
    if (!formData.companyName.trim()) return;
    if (formData.heldForTwoPlusYears === 'no' && (!formData.acquisitionMonth || !formData.acquisitionYear)) {
      Alert.alert('Missing acquisition date', 'Please add the acquisition month and year.');
      return;
    }
    if (formData.beneficiaries.length > 0 && !validatePercentageAllocation({ beneficiaries: formData.beneficiaries })) {
      return; // Component already shows error state
    }

    // Round value to nearest £1
    const estimatedValue = Math.round(valueNotSure ? 0 : formData.estimatedValue);

    // Build share data with ownership field
    let percentageOwnership: number | undefined;
    let numberOfShares: number | undefined;

    if (ownershipMode === 'percentage' && formData.ownershipValue) {
      const rawPercentage = parseFloat(formData.ownershipValue);
      if (isNaN(rawPercentage) || rawPercentage < 0 || rawPercentage > 100) {
        Alert.alert('Invalid ownership', 'Percentage must be between 0 and 100.');
        return;
      }
      percentageOwnership = Math.round(rawPercentage * 100) / 100; // Round to 2dp
    } else if (ownershipMode === 'shares' && formData.ownershipValue) {
      const parsedShares = parseInt(formData.ownershipValue);
      if (isNaN(parsedShares) || parsedShares <= 0) {
        Alert.alert('Invalid ownership', 'Number of shares must be a positive whole number.');
        return;
      }
      numberOfShares = parsedShares;
    }

    const resolveBusinessId = (): string | undefined => {
      if (companySelection === '__NEW__' || !formData.businessId) {
        const newBusinessId = businessActions.addBusiness({
          name: formData.companyName.trim(),
          businessType: '',
          estimatedValue: 0,
        });
        return newBusinessId;
      }

      return formData.businessId;
    };

    const resolvedBusinessId = resolveBusinessId();
    const businessName = resolvedBusinessId
      ? businessActions.getBusinessById(resolvedBusinessId)?.name || formData.companyName.trim()
      : formData.companyName.trim();

    const heldForTwoPlusYears = formData.heldForTwoPlusYears === 'yes'
      ? true
      : formData.heldForTwoPlusYears === 'no'
        ? false
        : undefined;

    const shareData = {
      title: businessName,
      companyName: businessName,
      businessId: resolvedBusinessId,
      percentageOwnership,
      numberOfShares,
      shareClass: formData.companyShareClass || undefined,
      companyNotes: formData.companyNotes || undefined,
      companyArticlesConfident: formData.companyArticlesConfident || undefined,
      companyCountryOfRegistration: formData.companyCountryOfRegistration || undefined,
      estimatedValue,
      netValue: estimatedValue,
      notes: formData.notes || undefined,
      excludeFromNetWorth: formData.excludeFromNetWorth,
      isActivelyTrading: formData.isActivelyTrading,
      heldForTwoPlusYears,
      isNotHoldingCompany: formData.isNotHoldingCompany,
      acquisitionMonth: formData.heldForTwoPlusYears === 'no'
        ? formData.acquisitionMonth
        : formData.acquisitionMonth || undefined,
      acquisitionYear: formData.heldForTwoPlusYears === 'no'
        ? formData.acquisitionYear
        : formData.acquisitionYear || undefined,
      beneficiaryAssignments: formData.beneficiaries.length > 0 ? {
        beneficiaries: formData.beneficiaries.map(b => ({
          id: b.id,
          type: b.type,
          percentage: b.percentage,
        })),
      } : undefined,
    };

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, shareData);
    } else {
      bequeathalActions.addAsset('private-company-shares', shareData);
    }

    router.push(SUMMARY_ROUTE as any);
  };

  const handleBack = () => {
    router.push(SUMMARY_ROUTE as any);
  };

  const canSubmit = !!formData.companyName.trim()
    && (formData.heldForTwoPlusYears !== 'no' || (formData.acquisitionMonth && formData.acquisitionYear));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background - 3 blobs */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {editingAssetId ? 'Edit Shareholding' : 'Add Shareholding'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Add/Edit Share Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add company shares.'}
            </Text>
            
            <Select
              label="Company"
              placeholder="Select company..."
              value={companySelection}
              options={companyOptions}
              onChange={handleCompanySelection}
            />

            {/* Company Name (only for new) */}
            {companySelection === '__NEW__' && (
              <Input
                label="Company Name *"
                placeholder="e.g., Acme Ltd, Smith & Co"
                value={formData.companyName}
                onChangeText={(value) => setFormData(prev => ({ ...prev, companyName: value }))}
              />
            )}

            <Select
              label="Country of Registration"
              placeholder="Select country..."
              value={formData.companyCountryOfRegistration}
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
              onChange={(value) => setFormData(prev => ({ ...prev, companyCountryOfRegistration: value }))}
            />

            <RadioGroup
              label="Share Class"
              options={[
                { 
                  label: 'Ordinary', 
                  value: 'ordinary',
                  helperText: 'Standard share class with equal rights'
                },
                { 
                  label: 'Other', 
                  value: 'other',
                  helperText: 'Custom share class or special arrangement'
                },
              ]}
              value={formData.companyShareClass}
              onChange={(value) => setFormData(prev => ({ ...prev, companyShareClass: value }))}
            />

            {formData.companyShareClass === 'other' && (
              <Input
                label="Notes on share class (optional)"
                placeholder="Restrictions, special terms, etc (optional)..."
                value={formData.companyNotes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, companyNotes: value }))}
                multiline
              />
            )}

            <RadioGroup
              label="Was your company set up with standard documents?"
              options={[
                { 
                  label: 'Yes', 
                  value: 'standard',
                  helperText: 'Used standard formation documents'
                },
                { 
                  label: 'No', 
                  value: 'customized',
                  helperText: 'We customized the setup'
                },
                { 
                  label: 'Not sure', 
                  value: 'not_sure',
                  helperText: 'Most property companies use standard setup'
                },
              ]}
              value={formData.companyArticlesConfident}
              onChange={(value) => setFormData(prev => ({ ...prev, companyArticlesConfident: value }))}
            />

            {/* Shares - Inline Toggle (INNOVATIVE UI) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Shares</Text>
              <View style={styles.ownershipRow}>
                <TextInput
                  style={styles.ownershipInput}
                  placeholder={ownershipMode === 'percentage' ? 'e.g., 25.5' : 'e.g., 1000'}
                  value={formData.ownershipValue}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, ownershipValue: value }))}
                  keyboardType={ownershipMode === 'percentage' ? 'decimal-pad' : 'number-pad'}
                />
                
                {/* Segmented Toggle */}
                <View style={styles.segmentedToggle}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      styles.toggleButtonLeft,
                      ownershipMode === 'percentage' && styles.toggleButtonActive
                    ]}
                    onPress={() => handleToggleMode('percentage')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      ownershipMode === 'percentage' && styles.toggleButtonTextActive
                    ]}>
                      %
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      styles.toggleButtonRight,
                      ownershipMode === 'shares' && styles.toggleButtonActive
                    ]}
                    onPress={() => handleToggleMode('shares')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      ownershipMode === 'shares' && styles.toggleButtonTextActive
                    ]}>
                      123
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Estimated Holding Value */}
            <View style={styles.valueSection}>
              <View style={valueNotSure && styles.disabledInputContainer}>
                <CurrencyInput
                  label="Estimated Holding Value"
                  placeholder="0"
                  value={valueNotSure ? 0 : formData.estimatedValue}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, estimatedValue: value }));
                    setValueNotSure(false);
                  }}
                  disabled={valueNotSure}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  const newValue = !valueNotSure;
                  setValueNotSure(newValue);
                  if (newValue) {
                    setFormData(prev => ({ ...prev, estimatedValue: 0 }));
                  }
                }}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxCircle, valueNotSure && styles.checkboxCircleSelected]}>
                  {valueNotSure && (
                    <IconButton
                      icon="check"
                      size={16}
                      iconColor={KindlingColors.background}
                      style={styles.checkIcon}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Not sure</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Total value of your shareholding</Text>
            </View>

            {/* Notes */}
            <Input
              label="Notes"
              placeholder="If there are any known restrictions or ownership structures that may be useful to note"
              value={formData.notes}
              onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
              multiline
              numberOfLines={3}
            />

            {/* Beneficiaries (Optional) */}
            <Text style={styles.helperText}>
              Optional: leave blank to treat this as part of the estate.
            </Text>
            <BeneficiaryWithPercentages
              allocationMode="percentage"
              value={formData.beneficiaries}
              onChange={handleBeneficiariesChange}
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              excludePersonIds={excludePersonIds}
              label="Who will receive these shares?"
              onAddNewPerson={(onCreated) => {
                addPersonSelectionRef.current = onCreated || null;
                setShowAddPersonDialog(true);
              }}
              onAddNewGroup={() => setShowGroupDrawer(true)}
            />

            {/* Exclude from Net Worth */}
            <TouchableOpacity
              onPress={() => setFormData(prev => ({ ...prev, excludeFromNetWorth: !prev.excludeFromNetWorth }))}
              style={styles.checkboxRow}
              activeOpacity={0.7}
            >
              <View style={[styles.checkboxCircle, formData.excludeFromNetWorth && styles.checkboxCircleSelected]}>
                {formData.excludeFromNetWorth && (
                  <IconButton
                    icon="check"
                    size={16}
                    iconColor={KindlingColors.background}
                    style={styles.checkIcon}
                  />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Don't include in net worth (illiquid or speculative)</Text>
            </TouchableOpacity>

            {/* IHT Planning Section */}
            <View style={styles.ihtSection}>
              <Text style={styles.ihtTitle}>Relevant to Inheritance Tax</Text>
              
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, isActivelyTrading: !prev.isActivelyTrading }))}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxCircle, formData.isActivelyTrading && styles.checkboxCircleSelected]}>
                  {formData.isActivelyTrading && (
                    <IconButton
                      icon="check"
                      size={16}
                      iconColor={KindlingColors.background}
                      style={styles.checkIcon}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>The business is actively trading</Text>
              </TouchableOpacity>

              <Select
                label="Have you owned the shares for 2+ years?"
                placeholder="Select..."
                value={formData.heldForTwoPlusYears}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                  { label: 'Not sure', value: 'not_sure' },
                ]}
                onChange={(value) => setFormData(prev => ({ ...prev, heldForTwoPlusYears: value as 'yes' | 'no' | 'not_sure' }))}
              />

              {(formData.heldForTwoPlusYears === 'no' || formData.heldForTwoPlusYears === 'not_sure') && (
                <>
                  <Text style={styles.helperText}>
                    Acquisition date (month and year){formData.heldForTwoPlusYears === 'no' ? ' *' : ' (optional)'}
                  </Text>
                  <View style={styles.dateRow}>
                    <View style={styles.dateField}>
                      <Select
                        placeholder="Month..."
                        value={formData.acquisitionMonth}
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
                        onChange={(value) => setFormData(prev => ({ ...prev, acquisitionMonth: value }))}
                      />
                    </View>
                    <View style={styles.dateField}>
                      <Select
                        placeholder="Year..."
                        value={formData.acquisitionYear}
                        options={Array.from({ length: 100 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return { label: year.toString(), value: year.toString() };
                        })}
                        onChange={(value) => setFormData(prev => ({ ...prev, acquisitionYear: value }))}
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, isNotHoldingCompany: !prev.isNotHoldingCompany }))}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxCircle, formData.isNotHoldingCompany && styles.checkboxCircleSelected]}>
                  {formData.isNotHoldingCompany && (
                    <IconButton
                      icon="check"
                      size={16}
                      iconColor={KindlingColors.background}
                      style={styles.checkIcon}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>It is NOT a holding company for cash, property or assets</Text>
              </TouchableOpacity>
            </View>

            <Button
              onPress={handleSave}
              variant="primary"
              disabled={!canSubmit}
            >
              {editingAssetId ? 'Save changes' : 'Add this shareholding'}
            </Button>
          </View>
        </View>
      </ScrollView>
      
      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        onPersonAdded={(personId) => {
          if (addPersonSelectionRef.current) {
            addPersonSelectionRef.current(personId);
            addPersonSelectionRef.current = null;
          }
        }}
      />

      <GroupManagementDrawer
        visible={showGroupDrawer}
        onDismiss={() => setShowGroupDrawer(false)}
        beneficiaryGroupActions={beneficiaryGroupActions}
        personActions={personActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  morphicBlob: {
    position: 'absolute',
    opacity: 0.2,
  },
  blob1: {
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.navy,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  blob2: {
    top: '33%',
    left: -64,
    width: 256,
    height: 192,
    backgroundColor: KindlingColors.brown,
    borderRadius: 128,
    transform: [{ rotate: '25deg' }],
  },
  blob3: {
    bottom: -64,
    left: '25%',
    width: 192,
    height: 160,
    backgroundColor: KindlingColors.beige,
    borderRadius: 96,
    transform: [{ rotate: '45deg' }],
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
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  formCard: {
    backgroundColor: `${KindlingColors.cream}33`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  fieldContainer: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: 4,
  },
  ownershipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  ownershipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: KindlingColors.navy,
    backgroundColor: KindlingColors.background,
  },
  segmentedToggle: {
    width: 80,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KindlingColors.navy,
    height: 42,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toggleButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: KindlingColors.navy,
  },
  toggleButtonRight: {
    // No border
  },
  toggleButtonActive: {
    backgroundColor: KindlingColors.navy,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: KindlingColors.navy,
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  valueSection: {
    gap: Spacing.xs,
  },
  disabledInputContainer: {
    opacity: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}4D`,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    lineHeight: 16,
    marginTop: -Spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  ihtSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.cream,
    gap: Spacing.xs,
  },
  ihtTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
});
