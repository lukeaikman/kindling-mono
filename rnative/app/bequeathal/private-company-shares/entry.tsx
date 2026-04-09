/**
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Navigation: Back → /bequeathal/private-company-shares/summary, Save → /bequeathal/private-company-shares/summary
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Input, CurrencyInput, Select, RadioGroup, DraftBanner, ValidationAttentionButton } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { useDraftAutoSave } from '../../../src/hooks/useDraftAutoSave';
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
  shareClassNotes: string;
  companyArticlesConfident: string;
  ownershipMode: 'percentage' | 'shares';
  ownershipValue: string;
  heldForTwoPlusYears: 'yes' | 'no' | 'not_sure' | '';
  acquisitionMonth: string;
  acquisitionYear: string;
  beneficiaries: BeneficiaryAssignment[];
  estimatedValue: number;
  sharesNotSure: boolean;
  valueNotSure: boolean;
  notes: string;
  excludeFromNetWorth: string;
  isActivelyTrading: string;
  isHoldingCompany: string;
}

export default function PrivateCompanySharesEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, businessActions, willActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<ShareForm>({
    companyName: '',
    businessId: '',
    companyCountryOfRegistration: 'uk',
    companyShareClass: '',
    shareClassNotes: '',
    companyArticlesConfident: '',
    ownershipMode: 'percentage',
    ownershipValue: '',
    heldForTwoPlusYears: '',
    acquisitionMonth: '',
    acquisitionYear: '',
    beneficiaries: [],
    estimatedValue: 0,
    sharesNotSure: false,
    valueNotSure: false,
    notes: '',
    excludeFromNetWorth: 'no',
    isActivelyTrading: '',
    isHoldingCompany: '',
  });
  const [companySelection, setCompanySelection] = useState<string>('');

  // Draft auto-save — mutable ref so we can update baseline after loading an existing asset
  const initialFormRef = useRef<ShareForm>(formData);
  const isFormLoaded = editingAssetId ? loadedIdRef.current === editingAssetId : true;

  const { hasDraft, hasChanges, restoreDraft, discardDraft } = useDraftAutoSave<ShareForm>({
    category: 'private-company-shares',
    assetId: editingAssetId || null,
    formData,
    isLoaded: isFormLoaded,
    initialData: initialFormRef.current,
  });

  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (hasDraft && !draftRestoredRef.current) {
      const draft = restoreDraft();
      if (draft) {
        if (!draft.ownershipMode) {
          draft.ownershipMode = 'percentage';
        }
        if ((draft as any).companyNotes && !draft.shareClassNotes) {
          draft.shareClassNotes = (draft as any).companyNotes;
        }
        setFormData(draft);
        draftRestoredRef.current = true;
        if (editingAssetId) {
          loadedIdRef.current = editingAssetId;
        }
      }
    }
  }, [hasDraft, restoreDraft, editingAssetId]);

  const handleDiscardDraft = async () => {
    await discardDraft();
    if (editingAssetId) {
      loadedIdRef.current = null;
    } else {
      setFormData(initialFormRef.current);
    }
    draftRestoredRef.current = false;
  };

  const needsAcquisitionDate = formData.heldForTwoPlusYears === 'no';
  const { attentionLabel, triggerValidation, showErrors, fieldErrors } = useFormValidation({
    fields: [
      { key: 'companyName', label: 'Company name', isValid: !!formData.companyName.trim() },
      { key: 'isActivelyTrading', label: 'Actively trading', isValid: !!formData.isActivelyTrading, scrollToEnd: true },
      { key: 'heldForTwoPlusYears', label: 'Held for 2+ years', isValid: !!formData.heldForTwoPlusYears, scrollToEnd: true },
      ...(needsAcquisitionDate ? [
        { key: 'acquisitionMonth', label: 'Acquisition month', isValid: !!formData.acquisitionMonth, scrollToEnd: true },
        { key: 'acquisitionYear', label: 'Acquisition year', isValid: !!formData.acquisitionYear, scrollToEnd: true },
      ] : []),
      { key: 'isHoldingCompany', label: 'Holding company', isValid: !!formData.isHoldingCompany, scrollToEnd: true },
    ],
    scrollViewRef,
  });

  const [sharesError, setSharesError] = useState('');
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  const businesses = businessActions.getBusinesses();
  const hasExistingBusinesses = businesses.length > 0;
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const companyOptions = [
    { label: 'Add new company', value: '__NEW__', accent: true },
    ...businesses.map(business => ({
      label: business.name,
      value: business.id,
    })),
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
      router.replace(SUMMARY_ROUTE as any);
      return;
    }

    const share = asset as PrivateCompanySharesAsset;
    loadedIdRef.current = editingAssetId;

    if (share.businessId) {
      setCompanySelection(share.businessId);
      setShowCompanyPicker(true);
    } else {
      setCompanySelection('__NEW__');
    }

    const heldForTwoPlusYears = share.heldForTwoPlusYears === true
      ? 'yes'
      : share.heldForTwoPlusYears === false
        ? 'no'
        : '';

    const articlesVal = share.companyArticlesConfident === 'customized'
      ? 'customised'
      : (share.companyArticlesConfident || '');

    const loaded: ShareForm = {
      companyName: share.companyName || '',
      businessId: share.businessId || '',
      companyCountryOfRegistration: share.companyCountryOfRegistration || 'uk',
      companyShareClass: share.shareClass || 'ordinary',
      shareClassNotes: (share as any).shareClassNotes || share.companyNotes || '',
      companyArticlesConfident: articlesVal,
      ownershipMode: share.numberOfShares ? 'shares' : 'percentage',
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
      sharesNotSure: share.ownershipUnknown === true,
      valueNotSure: share.estimatedValueUnknown === true,
      notes: share.notes || '',
      excludeFromNetWorth: share.excludeFromNetWorth === true ? 'yes' : share.excludeFromNetWorth === false ? 'no' : '',
      isActivelyTrading: share.isActivelyTrading === true ? 'yes' : share.isActivelyTrading === false ? 'no' : '',
      isHoldingCompany: share.isNotHoldingCompany === true ? 'no' : share.isNotHoldingCompany === false ? 'yes' : '',
    };
    setFormData(loaded);
    initialFormRef.current = loaded;
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

  function validateSharesInput(value: string, mode: 'percentage' | 'shares'): string | null {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (num < 0) return 'Value cannot be negative';
    if (mode === 'percentage' && num > 100) return 'Percentage cannot exceed 100%';
    if (mode === 'shares' && num !== Math.floor(num)) return 'Shares must be a whole number';
    return null;
  }

  const handleToggleMode = (newMode: 'percentage' | 'shares') => {
    if (newMode === formData.ownershipMode) return;
    setFormData(prev => ({ ...prev, ownershipMode: newMode }));
    const error = validateSharesInput(formData.ownershipValue, newMode);
    setSharesError(error || '');
  };

  const handleSave = () => {
    if (!canSubmit) return;
    if (formData.beneficiaries.length > 0 && !validatePercentageAllocation({ beneficiaries: formData.beneficiaries })) {
      return; // Component already shows error state
    }

    // Round value to nearest £1 — undefined when unsure or left blank
    const isValueUnknown = formData.valueNotSure || formData.estimatedValue === 0;
    const estimatedValue = isValueUnknown ? undefined : Math.round(formData.estimatedValue);

    // Build share data with ownership field
    let percentageOwnership: number | undefined;
    let numberOfShares: number | undefined;

    if (!formData.sharesNotSure) {
      if (formData.ownershipMode === 'percentage' && formData.ownershipValue) {
        const rawPercentage = parseFloat(formData.ownershipValue);
        if (!isNaN(rawPercentage)) {
          percentageOwnership = Math.round(rawPercentage * 100) / 100;
        }
      } else if (formData.ownershipMode === 'shares' && formData.ownershipValue) {
        const parsedShares = parseInt(formData.ownershipValue);
        if (!isNaN(parsedShares) && parsedShares > 0) {
          numberOfShares = parsedShares;
        }
      }
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
      ownershipUnknown: formData.sharesNotSure || undefined,
      shareClass: formData.companyShareClass || undefined,
      shareClassNotes: formData.shareClassNotes || undefined,
      companyArticlesConfident: formData.companyArticlesConfident || undefined,
      companyCountryOfRegistration: formData.companyCountryOfRegistration || undefined,
      estimatedValue,
      estimatedValueUnknown: isValueUnknown || undefined,
      netValue: estimatedValue,
      notes: formData.notes || undefined,
      excludeFromNetWorth: formData.excludeFromNetWorth === 'yes' ? true : formData.excludeFromNetWorth === 'no' ? false : undefined,
      isActivelyTrading: formData.isActivelyTrading === 'yes' ? true : formData.isActivelyTrading === 'no' ? false : undefined,
      heldForTwoPlusYears,
      isNotHoldingCompany: formData.isHoldingCompany === 'no' ? true : formData.isHoldingCompany === 'yes' ? false : undefined,
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

    // Compute delta for net wealth toast (avoids reading stale batched state)
    const oldAssetValue = editingAssetId
      ? (bequeathalActions.getAssetById(editingAssetId)?.estimatedValue || 0)
      : 0;
    toast.notifySave((estimatedValue ?? 0) - oldAssetValue);

    // Clear draft on successful save
    discardDraft();

    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  const canSubmit = !!formData.companyName.trim()
    && !sharesError
    && !!formData.isActivelyTrading
    && !!formData.heldForTwoPlusYears
    && (!needsAcquisitionDate || (!!formData.acquisitionMonth && !!formData.acquisitionYear))
    && !!formData.isHoldingCompany;

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
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Draft Banner */}
          <DraftBanner
            categoryLabel="shareholding"
            isEditing={!!editingAssetId}
            onDiscard={handleDiscardDraft}
            visible={hasDraft}
          />

          {/* Add/Edit Share Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add company shares.'}
            </Text>
            
            {showCompanyPicker ? (
              <Select
                label="Company"
                placeholder="Select a company"
                value={companySelection}
                options={companyOptions}
                onChange={(value) => {
                  handleCompanySelection(value);
                  if (value === '__NEW__') {
                    setCompanySelection('');
                    setShowCompanyPicker(false);
                  }
                }}
              />
            ) : (
              <View>
                <Input
                  label="Company Name *"
                  placeholder="e.g., Acme Ltd, Smith & Co"
                  value={formData.companyName}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, companyName: value }))}
                  error={showErrors && fieldErrors.companyName}
                />
                {hasExistingBusinesses && !editingAssetId && (
                  <TouchableOpacity
                    onPress={() => {
                      setCompanySelection('');
                      setShowCompanyPicker(true);
                    }}
                    style={styles.selectExistingLink}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectExistingText}>Select existing company</Text>
                  </TouchableOpacity>
                )}
              </View>
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
                { 
                  label: 'Not sure', 
                  value: 'unknown',
                  helperText: "I don't know the share class"
                },
              ]}
              value={formData.companyShareClass}
              onChange={(value) => setFormData(prev => ({ ...prev, companyShareClass: value }))}
            />

            {formData.companyShareClass === 'other' && (
              <Input
                label="Notes on share class (optional)"
                placeholder="Restrictions, special terms, etc (optional)..."
                value={formData.shareClassNotes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, shareClassNotes: value }))}
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
                  value: 'customised',
                  helperText: 'We customised the setup'
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

            {/* Shares - Inline Toggle */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Shares (can be approximate)</Text>
              <View style={formData.sharesNotSure ? styles.disabledInputContainer : undefined}>
                <View style={styles.ownershipRow}>
                  <TextInput
                    style={[styles.ownershipInput, !!sharesError && styles.ownershipInputError]}
                    placeholder={formData.ownershipMode === 'percentage' ? 'e.g., 25.5' : 'e.g., 1000'}
                    value={formData.sharesNotSure ? '' : formData.ownershipValue}
                    onChangeText={(value) => {
                      setFormData(prev => ({ ...prev, ownershipValue: value, sharesNotSure: false }));
                      if (sharesError) setSharesError('');
                    }}
                    onBlur={() => {
                      const error = validateSharesInput(formData.ownershipValue, formData.ownershipMode);
                      setSharesError(error || '');
                    }}
                    keyboardType={formData.ownershipMode === 'percentage' ? 'decimal-pad' : 'number-pad'}
                    editable={!formData.sharesNotSure}
                  />
                  
                  {/* Segmented Toggle */}
                  <View style={styles.segmentedToggle}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        styles.toggleButtonLeft,
                        formData.ownershipMode === 'percentage' && styles.toggleButtonActive
                      ]}
                      onPress={() => handleToggleMode('percentage')}
                      activeOpacity={0.7}
                      disabled={formData.sharesNotSure}
                    >
                      <Text style={[
                        styles.toggleButtonText,
                        formData.ownershipMode === 'percentage' && styles.toggleButtonTextActive
                      ]}>
                        %
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        styles.toggleButtonRight,
                        formData.ownershipMode === 'shares' && styles.toggleButtonActive
                      ]}
                      onPress={() => handleToggleMode('shares')}
                      activeOpacity={0.7}
                      disabled={formData.sharesNotSure}
                    >
                      <Text style={[
                        styles.toggleButtonText,
                        formData.ownershipMode === 'shares' && styles.toggleButtonTextActive
                      ]}>
                        123
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {!!sharesError && <Text style={styles.sharesErrorText}>{sharesError}</Text>}
              <TouchableOpacity
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    sharesNotSure: !prev.sharesNotSure,
                    ownershipValue: !prev.sharesNotSure ? '' : prev.ownershipValue,
                  }));
                }}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxCircle, formData.sharesNotSure && styles.checkboxCircleSelected]}>
                  {formData.sharesNotSure && (
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
            </View>

            {/* Estimated Holding Value */}
            <View style={styles.valueSection}>
              <View style={formData.valueNotSure && styles.disabledInputContainer}>
                <CurrencyInput
                  label="Estimated Holding Value"
                  placeholder="0"
                  value={formData.valueNotSure ? 0 : formData.estimatedValue}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, estimatedValue: value, valueNotSure: false }));
                  }}
                  disabled={formData.valueNotSure}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    valueNotSure: !prev.valueNotSure,
                    estimatedValue: !prev.valueNotSure ? 0 : prev.estimatedValue,
                  }));
                }}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxCircle, formData.valueNotSure && styles.checkboxCircleSelected]}>
                  {formData.valueNotSure && (
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

            {/* IHT Planning Section */}
            <View style={styles.ihtSection}>
              <Text style={styles.ihtTitle}>Relevant to Inheritance Tax</Text>
              
              <RadioGroup
                label="Is the business actively trading? *"
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
                value={formData.isActivelyTrading}
                onChange={(value) => setFormData(prev => ({ ...prev, isActivelyTrading: value }))}
                error={showErrors && fieldErrors.isActivelyTrading}
              />

              <Select
                label="Have you owned the shares for 2+ years? *"
                placeholder="Select..."
                value={formData.heldForTwoPlusYears}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                  { label: 'Not sure', value: 'not_sure' },
                ]}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  heldForTwoPlusYears: value as 'yes' | 'no' | 'not_sure',
                  ...(value !== 'no' ? { acquisitionMonth: '', acquisitionYear: '' } : {}),
                }))}
                error={showErrors && fieldErrors.heldForTwoPlusYears}
              />

              {formData.heldForTwoPlusYears === 'no' && (
                <>
                  <Text style={styles.helperText}>
                    Acquisition date (month and year){needsAcquisitionDate ? ' *' : ' (optional)'}
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
                        error={showErrors && fieldErrors.acquisitionMonth}
                      />
                    </View>
                    <View style={styles.dateField}>
                      <Select
                        placeholder="Year..."
                        value={formData.acquisitionYear}
                        options={Array.from({ length: 3 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return { label: year.toString(), value: year.toString() };
                        })}
                        onChange={(value) => setFormData(prev => ({ ...prev, acquisitionYear: value }))}
                        error={showErrors && fieldErrors.acquisitionYear}
                      />
                    </View>
                  </View>
                </>
              )}

              <RadioGroup
                label="Is this a holding company for property, cash or assets? *"
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
                value={formData.isHoldingCompany}
                onChange={(value) => setFormData(prev => ({ ...prev, isHoldingCompany: value }))}
                error={showErrors && fieldErrors.isHoldingCompany}
              />
            </View>

            <RadioGroup
              label="Are these shares speculative or illiquid and therefore should be ignored from net worth?"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={formData.excludeFromNetWorth}
              onChange={(value) => setFormData(prev => ({ ...prev, excludeFromNetWorth: value }))}
            />

            <View onTouchEnd={canSubmit ? undefined : triggerValidation}>
              <Button
                onPress={handleSave}
                variant="primary"
                disabled={!canSubmit}
              >
                {editingAssetId ? 'Save changes' : 'Add this shareholding'}
              </Button>
            </View>
            <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
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
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId, groupObj) => {
          const group = groupObj ?? beneficiaryGroupActions.getGroupById(groupId);
          if (group) {
            setFormData(prev => ({
              ...prev,
              beneficiaries: [...prev.beneficiaries, { id: group.id, type: 'group' as const }]
            }));
          }
        }}
        beneficiaryGroupActions={beneficiaryGroupActions}
        willId={willActions.getUser()?.id || 'default-user'}
        alreadySelectedGroupIds={formData.beneficiaries.filter(b => b.type === 'group').map(b => b.id)}
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
  selectExistingLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  selectExistingText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
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
  ownershipInputError: {
    borderColor: '#D32F2F',
    borderWidth: 2,
  },
  sharesErrorText: {
    fontSize: Typography.fontSize.xs,
    color: '#D32F2F',
    marginTop: 2,
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
