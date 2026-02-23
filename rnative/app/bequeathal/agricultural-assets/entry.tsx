/**
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Navigation: Back → /bequeathal/agricultural-assets/summary, Save → /bequeathal/agricultural-assets/summary
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, RadioGroup, SearchableSelect, DraftBanner, ValidationAttentionButton, InformationCard } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { useDraftAutoSave } from '../../../src/hooks/useDraftAutoSave';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { AgriculturalAsset } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/agricultural-assets/summary';

interface AssetForm {
  aprOwnershipStructure: string;
  assetType: string;
  assetDescription: string;
  farmWorkerOccupied: string;
  woodlandPurpose: string;
  studFarmActivity: string;
  hasDebtsEncumbrances: string;
  debtAmount: number;
  debtDescription: string;
  estimatedValue: number;
  valueNotSure: boolean;
  aprOwnershipDuration: string;
  bprUsedInOwnBusiness: string;
  bprActiveTrading: string;
  bprOwnershipDuration: string;
  notes: string;
}

export default function AgriculturalAssetsEntryScreen() {
  const { bequeathalActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [showCompanyWarning, setShowCompanyWarning] = useState(false);
  const [formData, setFormData] = useState<AssetForm>({
    aprOwnershipStructure: '',
    assetType: 'agricultural-land',
    assetDescription: '',
    farmWorkerOccupied: '',
    woodlandPurpose: '',
    studFarmActivity: '',
    hasDebtsEncumbrances: '',
    debtAmount: 0,
    debtDescription: '',
    estimatedValue: 0,
    valueNotSure: false,
    aprOwnershipDuration: '',
    bprUsedInOwnBusiness: '',
    bprActiveTrading: '',
    bprOwnershipDuration: '',
    notes: '',
  });

  // Draft auto-save — mutable ref so we can update baseline after loading an existing asset
  const initialFormRef = useRef<AssetForm>(formData);
  const isFormLoaded = editingAssetId ? loadedIdRef.current === editingAssetId : true;

  const { hasDraft, hasChanges, restoreDraft, discardDraft } = useDraftAutoSave<AssetForm>({
    category: 'agricultural-assets',
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
        setFormData(draft);
        draftRestoredRef.current = true;
        // Prevent the load-from-store effect from overwriting the restored draft
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

  const { attentionLabel, triggerValidation, showErrors, fieldErrors } = useFormValidation({
    fields: [
      { key: 'aprOwnershipStructure', label: 'Ownership structure', isValid: !!formData.aprOwnershipStructure },
      { key: 'assetType', label: 'Asset type', isValid: !!formData.assetType },
      { key: 'assetDescription', label: 'Asset description', isValid: !!formData.assetDescription.trim() },
      { key: 'hasDebtsEncumbrances', label: 'Debts/encumbrances', isValid: !!formData.hasDebtsEncumbrances },
    ],
    scrollViewRef,
  });

  // Asset type options (grouped)
  const assetTypeOptions = [
    { label: 'Agricultural Land', value: 'agricultural-land' },
    { label: 'Farm Buildings', value: 'farm-buildings' },
    { label: 'Farmhouse', value: 'farmhouse' },
    { label: 'Farm Worker Cottage', value: 'farm-worker-cottage' },
    { label: '────────────────', value: 'separator1', disabled: true },
    { label: 'Stud Farm', value: 'stud-farm' },
    { label: 'Standing Crops', value: 'standing-crops' },
    { label: 'Fish Farming Facilities', value: 'fish-farming' },
    { label: '────────────────', value: 'separator2', disabled: true },
    { label: 'Woodland', value: 'woodland' },
    { label: 'Agricultural Equipment', value: 'agricultural-equipment' },
    { label: 'Other', value: 'other' },
  ];

  // Ownership routing options
  const ownershipOptions = [
    { label: 'I own it personally', value: 'personal' },
    { label: 'Owned through a partnership', value: 'partnership' },
    { label: 'Held in trust', value: 'trust' },
    { label: 'Owned by a limited company', value: 'company' },
  ];

  // APR ownership duration options
  const aprDurationOptions = [
    { label: '1 year', value: 'year-1' },
    { label: '2 years', value: 'year-2' },
    { label: '3 years', value: 'year-3' },
    { label: '4 years', value: 'year-4' },
    { label: '5 years', value: 'year-5' },
    { label: '6 years', value: 'year-6' },
    { label: 'Over 7 years', value: 'gt-7' },
    { label: 'Not sure', value: 'not-sure' },
  ];

  // Yes/No/Not Sure options (reused)
  const yesNoNotSureOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Not sure', value: 'not-sure' },
  ];

  // Farm worker occupancy options
  const farmWorkerOptions = yesNoNotSureOptions;

  // Woodland purpose options
  const woodlandPurposeOptions = [
    { label: 'Agricultural use (shelter, firewood for farm)', value: 'shelter' },
    { label: 'Commercial timber business', value: 'commercial' },
    { label: 'Not sure', value: 'not-sure' },
  ];

  // Stud farm activity options
  const studFarmActivityOptions = [
    { label: 'Breeding horses/ponies for sale (agricultural)', value: 'breeding' },
    { label: 'Livery, riding school, or training (business)', value: 'livery' },
    { label: 'Not sure', value: 'not-sure' },
  ];

  // BPR ownership duration options
  const bprDurationOptions = [
    { label: 'Less than 2 years', value: 'lt-2' },
    { label: '2+ years', value: 'gte-2' },
    { label: 'Not sure', value: 'not-sure' },
  ];

  // Debts options
  const debtsOptions = [
    { label: 'No debts or encumbrances', value: 'no' },
    { label: 'Yes - Has debts/encumbrances', value: 'yes' },
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
    if (!asset || asset.type !== 'agricultural-assets') {
      router.replace(SUMMARY_ROUTE as any);
      return;
    }

    const agAsset = asset as AgriculturalAsset;
    loadedIdRef.current = editingAssetId;

    const loaded: AssetForm = {
      aprOwnershipStructure: agAsset.aprOwnershipStructure || '',
      assetType: agAsset.assetType || 'agricultural-land',
      assetDescription: agAsset.assetDescription || '',
      farmWorkerOccupied: agAsset.farmWorkerOccupied || '',
      woodlandPurpose: agAsset.woodlandPurpose || '',
      studFarmActivity: agAsset.studFarmActivity || '',
      hasDebtsEncumbrances: agAsset.hasDebtsEncumbrances || '',
      debtAmount: agAsset.debtAmount || 0,
      debtDescription: agAsset.debtDescription || '',
      estimatedValue: agAsset.estimatedValue || 0,
      valueNotSure: agAsset.estimatedValueUnknown === true,
      aprOwnershipDuration: agAsset.aprOwnershipDuration || '',
      bprUsedInOwnBusiness: agAsset.bprUsedInOwnBusiness || '',
      bprActiveTrading: agAsset.bprActiveTrading || '',
      bprOwnershipDuration: agAsset.bprOwnershipDuration || '',
      notes: agAsset.notes || '',
    };
    setFormData(loaded);
    initialFormRef.current = loaded;
  }, [editingAssetId, bequeathalActions]);

  // APR qualification logic
  const qualifiesForApr = (assetType: string, context: { 
    farmWorkerOccupied?: string; 
    woodlandPurpose?: string; 
    studFarmActivity?: string;
  }) => {
    // Always qualifies
    if (['agricultural-land', 'farm-buildings', 'farmhouse', 'fish-farming'].includes(assetType)) {
      return true;
    }
    
    // Conditional qualification
    if (assetType === 'farm-worker-cottage') {
      return context.farmWorkerOccupied === 'yes';
    }
    
    if (assetType === 'woodland') {
      return context.woodlandPurpose === 'shelter';
    }
    
    if (assetType === 'stud-farm') {
      return context.studFarmActivity === 'breeding';
    }
    
    // standing-crops, agricultural-equipment: don't qualify for APR
    return false;
  };

  const showAprSection = qualifiesForApr(formData.assetType, {
    farmWorkerOccupied: formData.farmWorkerOccupied,
    woodlandPurpose: formData.woodlandPurpose,
    studFarmActivity: formData.studFarmActivity,
  });

  const bprAssetQualifies = formData.assetType === 'agricultural-equipment' ||
    (formData.assetType === 'stud-farm' && formData.studFarmActivity === 'livery') ||
    formData.assetType === 'other';

  const needsBprGateway = bprAssetQualifies && formData.aprOwnershipStructure === 'personal';

  const showBprSection = bprAssetQualifies &&
    (!needsBprGateway || formData.bprUsedInOwnBusiness === 'yes');

  const handleOwnershipChange = (value: string) => {
    if (value === 'company') {
      setShowCompanyWarning(true);
      setFormData(prev => ({ ...prev, aprOwnershipStructure: 'company' }));
    } else {
      setShowCompanyWarning(false);
      setFormData(prev => ({
        ...prev,
        aprOwnershipStructure: value,
        bprUsedInOwnBusiness: value === 'personal' ? prev.bprUsedInOwnBusiness : '',
      }));
    }
  };

  const handleRouteToBusinessAssets = () => {
    router.push('/bequeathal/assets-held-through-business/entry');
  };

  const handleSave = () => {
    // Validation
    if (!formData.aprOwnershipStructure || !formData.assetType || !formData.assetDescription.trim()) return;

    // Calculate net value — both undefined when value is unknown
    const estimatedValue = formData.valueNotSure ? undefined : Math.round(formData.estimatedValue);
    const debtAmount = formData.hasDebtsEncumbrances === 'yes' ? Math.round(formData.debtAmount) : 0;
    const netValue = estimatedValue !== undefined ? Math.max(0, estimatedValue - debtAmount) : undefined;

    const assetTypeLabel = assetTypeOptions.find(opt => opt.value === formData.assetType)?.label || formData.assetType;

    const assetData = {
      title: formData.assetDescription || assetTypeLabel,
      assetType: formData.assetType,
      assetDescription: formData.assetDescription || undefined,
      aprOwnershipStructure: formData.aprOwnershipStructure as 'personal' | 'partnership' | 'trust',
      hasDebtsEncumbrances: formData.hasDebtsEncumbrances as 'yes' | 'no',
      estimatedValue,
      estimatedValueUnknown: formData.valueNotSure || undefined,
      netValue,
      // Asset-type conditionals
      farmWorkerOccupied: formData.assetType === 'farm-worker-cottage' ? formData.farmWorkerOccupied as any : undefined,
      woodlandPurpose: formData.assetType === 'woodland' ? formData.woodlandPurpose as any : undefined,
      studFarmActivity: formData.assetType === 'stud-farm' ? formData.studFarmActivity as any : undefined,
      // Debts
      debtAmount: debtAmount > 0 ? debtAmount : undefined,
      debtDescription: formData.hasDebtsEncumbrances === 'yes' ? formData.debtDescription : undefined,
      // APR fields
      aprOwnershipDuration: showAprSection ? formData.aprOwnershipDuration as any : undefined,
      // TODO: Backend — flag trust-held agricultural assets for manual estate planner review
      // BPR fields
      bprUsedInOwnBusiness: bprAssetQualifies ? formData.bprUsedInOwnBusiness as any || undefined : undefined,
      bprActiveTrading: showBprSection ? formData.bprActiveTrading as any : undefined,
      bprOwnershipDuration: showBprSection ? formData.bprOwnershipDuration as any : undefined,
      // Notes
      notes: formData.notes || undefined,
    };

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, assetData);
    } else {
      bequeathalActions.addAsset('agricultural-assets', assetData);
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

  const canSubmit = formData.aprOwnershipStructure && 
                    formData.assetType && 
                    formData.assetDescription.trim() &&
                    formData.hasDebtsEncumbrances &&
                    (!showAprSection || formData.aprOwnershipDuration) &&
                    (!needsBprGateway || !!formData.bprUsedInOwnBusiness) &&
                    (!showBprSection || (formData.bprActiveTrading && formData.bprOwnershipDuration)) &&
                    (formData.assetType !== 'farm-worker-cottage' || !!formData.farmWorkerOccupied) &&
                    (formData.assetType !== 'woodland' || !!formData.woodlandPurpose) &&
                    (formData.assetType !== 'stud-farm' || !!formData.studFarmActivity);

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
            {editingAssetId ? 'Edit Agricultural Asset' : 'Add Agricultural Asset'}
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
            categoryLabel="agricultural asset"
            isEditing={!!editingAssetId}
            onDiscard={handleDiscardDraft}
            visible={hasDraft}
          />

          {/* Add/Edit Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add an agricultural asset.'}
            </Text>

            {/* SECTION 0: Ownership Routing (FIRST) */}
            <RadioGroup
              label="Who owns this agricultural property? *"
              value={formData.aprOwnershipStructure}
              onChange={handleOwnershipChange}
              options={ownershipOptions}
              error={showErrors && fieldErrors.aprOwnershipStructure}
            />

            {/* Company Warning Card */}
            {showCompanyWarning && (
              <InformationCard title="This is a company asset">
                <Text style={styles.companyWarningText}>
                  Company-owned property should be recorded under Business Assets, where the correct tax relief will be applied.
                </Text>
                <View style={styles.companyWarningActions}>
                  <Button
                    onPress={handleRouteToBusinessAssets}
                    variant="primary"
                  >
                    Go to Business Assets
                  </Button>
                  <Button
                    onPress={() => {
                      setShowCompanyWarning(false);
                      setFormData(prev => ({ ...prev, aprOwnershipStructure: '' }));
                    }}
                    variant="outline"
                  >
                    Choose a different owner
                  </Button>
                </View>
              </InformationCard>
            )}

            {/* Only show rest of form if not routing to company */}
            {!showCompanyWarning && formData.aprOwnershipStructure && (
              <>
                {/* SECTION 1: Base Fields */}
                <SearchableSelect
                  label="Asset Type *"
                  placeholder="Select asset type..."
                  value={formData.assetType}
                  options={assetTypeOptions}
                  onChange={(value) => {
                    setFormData(prev => {
                      const nowBpr = value === 'agricultural-equipment' ||
                        (value === 'stud-farm' && prev.studFarmActivity === 'livery') ||
                        value === 'other';
                      return {
                        ...prev,
                        assetType: value,
                        ...(!nowBpr ? {
                          bprUsedInOwnBusiness: '',
                          bprActiveTrading: '',
                          bprOwnershipDuration: '',
                        } : {}),
                      };
                    });
                  }}
                  error={showErrors && fieldErrors.assetType}
                />

                <Input
                  label="What is this asset? *"
                  placeholder="e.g. North field, Cow barn, Main farmhouse"
                  value={formData.assetDescription}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, assetDescription: value }))}
                  error={showErrors && fieldErrors.assetDescription}
                />

                {/* Asset-Type Conditional Fields */}
                {formData.assetType === 'farm-worker-cottage' && (
                  <RadioGroup
                    label="Occupied by farm worker? *"
                    value={formData.farmWorkerOccupied}
                    onChange={(value) => setFormData(prev => ({ ...prev, farmWorkerOccupied: value }))}
                    options={farmWorkerOptions}
                  />
                )}

                {formData.assetType === 'woodland' && (
                  <RadioGroup
                    label="Woodland purpose *"
                    value={formData.woodlandPurpose}
                    onChange={(value) => setFormData(prev => ({ ...prev, woodlandPurpose: value }))}
                    options={woodlandPurposeOptions}
                  />
                )}

                {formData.assetType === 'stud-farm' && (
                  <RadioGroup
                    label="Stud farm activity *"
                    value={formData.studFarmActivity}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      studFarmActivity: value,
                      ...(value !== 'livery' ? {
                        bprUsedInOwnBusiness: '',
                        bprActiveTrading: '',
                        bprOwnershipDuration: '',
                      } : {}),
                    }))}
                    options={studFarmActivityOptions}
                  />
                )}

                {/* Debts Section */}
                <RadioGroup
                  label="Debts or encumbrances *"
                  value={formData.hasDebtsEncumbrances}
                  onChange={(value) => setFormData(prev => ({ ...prev, hasDebtsEncumbrances: value }))}
                  options={debtsOptions}
                  error={showErrors && fieldErrors.hasDebtsEncumbrances}
                />

                {formData.hasDebtsEncumbrances === 'yes' && (
                  <View style={styles.debtsSection}>
                    <CurrencyInput
                      label="Outstanding debt amount"
                      placeholder="0"
                      value={formData.debtAmount}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, debtAmount: value }))}
                    />
                    <Input
                      label="Debt description"
                      placeholder="e.g. Agricultural mortgage, equipment finance"
                      value={formData.debtDescription}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, debtDescription: value }))}
                    />
                  </View>
                )}

                {/* APR Section (Conditional on qualifying asset) */}
                {showAprSection && (
                  <View style={styles.reliefSection}>
                    <Text style={styles.reliefTitle}>APR Qualification</Text>
                    <Text style={styles.reliefSubtext}>
                      These answers help us understand whether Agricultural Property Relief might apply.
                    </Text>

                    <Select
                      label="How long have you owned this property?"
                      placeholder="Select duration..."
                      value={formData.aprOwnershipDuration}
                      options={aprDurationOptions}
                      onChange={(value) => setFormData(prev => ({ ...prev, aprOwnershipDuration: value }))}
                    />

                    {formData.aprOwnershipStructure === 'trust' && (
                      <InformationCard title="Specialist review needed">
                        <Text style={styles.infoText}>
                          Trust-held agricultural assets need specialist review. Our estate planners will review this with you once all your assets are entered.
                        </Text>
                      </InformationCard>
                    )}
                  </View>
                )}

                {/* BPR Gateway (personal ownership + BPR-eligible asset only) */}
                {needsBprGateway && (
                  <View style={styles.reliefSection}>
                    <RadioGroup
                      label="Do you use this in your own actively trading farming business?"
                      value={formData.bprUsedInOwnBusiness}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        bprUsedInOwnBusiness: value,
                        bprActiveTrading: value === 'yes' ? 'yes' : '',
                      }))}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                      ]}
                    />
                  </View>
                )}

                {/* BPR Section (Conditional on equipment or livery) */}
                {showBprSection && (
                  <View style={styles.reliefSection}>
                    <Text style={styles.reliefTitle}>BPR Qualification</Text>
                    <Text style={styles.reliefSubtext}>
                      Certain agricultural assets and farming activities may qualify for Business Property Relief rather than Agricultural Property Relief.
                    </Text>

                    {/* Trading question only when gateway wasn't used (non-personal ownership) */}
                    {!needsBprGateway && (
                      <RadioGroup
                        label={formData.assetType === 'stud-farm' 
                          ? "Is the stud farm business actively trading?"
                          : "Is this asset used in an actively trading farming business?"}
                        value={formData.bprActiveTrading}
                        onChange={(value) => setFormData(prev => ({ ...prev, bprActiveTrading: value }))}
                        options={yesNoNotSureOptions}
                      />
                    )}

                    <RadioGroup
                      label={formData.assetType === 'stud-farm'
                        ? "How long have you owned this business?"
                        : "How long have you owned this asset?"}
                      value={formData.bprOwnershipDuration}
                      onChange={(value) => setFormData(prev => ({ ...prev, bprOwnershipDuration: value }))}
                      options={bprDurationOptions}
                    />
                  </View>
                )}

                {/* Estimated Value */}
                <View style={styles.valueSection}>
                  <View style={formData.valueNotSure && styles.disabledInputContainer}>
                    <CurrencyInput
                      label="Estimated Value"
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
                  placeholder="Any additional details about this agricultural asset..."
                  value={formData.notes}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                  multiline
                  numberOfLines={3}
                />

                {/* Form Actions */}
                <View style={styles.formActions}>
                  <View onTouchEnd={canSubmit ? undefined : triggerValidation}>
                    <Button
                      onPress={handleSave}
                      variant="primary"
                      disabled={!canSubmit}
                    >
                      {editingAssetId ? 'Save changes' : 'Add this asset'}
                    </Button>
                  </View>
                  <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
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
  companyWarningText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    lineHeight: 20,
  },
  companyWarningActions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  debtsSection: {
    gap: Spacing.md,
  },
  reliefSection: {
    backgroundColor: `${KindlingColors.green}0D`,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${KindlingColors.green}4D`,
    gap: Spacing.md,
  },
  reliefTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  reliefSubtext: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    lineHeight: 16,
    marginTop: -Spacing.xs,
  },
  infoBox: {
    backgroundColor: `${KindlingColors.brown}1A`,
    borderRadius: 6,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: `${KindlingColors.brown}33`,
  },
  infoText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.brown,
    lineHeight: 16,
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
  },
  formActions: {
    marginTop: Spacing.sm,
  },
});
