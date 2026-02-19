/**
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 *
 * Navigation:
 * - Back → /bequeathal/assets-held-through-business/summary
 * - Save → /bequeathal/assets-held-through-business/summary
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, SearchableSelect, ValidationAttentionButton } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { AssetsHeldThroughBusinessAsset } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/assets-held-through-business/summary';

interface AssetForm {
  assetType: string;
  assetDescription: string;
  estimatedValue: number;
}

interface NewBusinessForm {
  name: string;
}

export default function AssetsHeldThroughBusinessEntryScreen() {
  const { bequeathalActions, businessActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');
  const [showNewBusinessForm, setShowNewBusinessForm] = useState(false);
  const [newBusinessForm, setNewBusinessForm] = useState<NewBusinessForm>({
    name: '',
  });
  const [formData, setFormData] = useState<AssetForm>({
    assetType: '',
    assetDescription: '',
    estimatedValue: 0,
  });
  const [valueNotSure, setValueNotSure] = useState(false);

  const { attentionLabel, triggerValidation, showErrors, fieldErrors } = useFormValidation({
    fields: [
      { key: 'businessId', label: 'Business', isValid: !!selectedBusinessId },
      { key: 'assetType', label: 'Asset Type', isValid: !!formData.assetType },
      { key: 'assetDescription', label: 'Asset Description', isValid: !!formData.assetDescription.trim() },
    ],
    scrollViewRef,
  });

  // Asset type options (grouped)
  const assetTypeOptions = [
    { label: 'Property', value: 'property' },
    { label: 'Equipment', value: 'equipment' },
    { label: 'Vehicles', value: 'vehicles' },
    { label: '────────────────', value: 'separator1', disabled: true },
    { label: 'Bank Accounts', value: 'bank-accounts' },
    { label: 'Investments', value: 'investments' },
    { label: '────────────────', value: 'separator2', disabled: true },
    { label: 'Inventory', value: 'inventory' },
    { label: 'Intellectual Property', value: 'intellectual-property' },
    { label: 'Other', value: 'other' },
  ];

  // Get contextual placeholder based on asset type
  const getPlaceholder = (assetType: string): string => {
    const placeholders: Record<string, string> = {
      'property': 'e.g., Main office, Warehouse, Shop premises',
      'equipment': 'e.g., Machinery, Computers, Manufacturing tools',
      'vehicles': 'e.g., Delivery van, Company car, Forklift',
      'bank-accounts': 'e.g., Business current account, Reserve account',
      'investments': 'e.g., Corporate bonds, Share portfolio',
      'inventory': 'e.g., Stock, Raw materials, Finished goods',
      'intellectual-property': 'e.g., Patents, Trademarks, Software licenses',
      'other': 'e.g., Office furniture, IT systems',
    };
    return placeholders[assetType] || 'e.g., Office building, Delivery van';
  };

  // Create business options from business registry
  const businessOptions = [
    ...businessActions.getBusinesses().map(business => ({
      label: business.name,
      value: business.id,
    })),
    {
      label: '📝 Add New Business',
      sublabel: undefined,
      value: '__ADD_NEW__',
    },
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
    if (!asset || asset.type !== 'assets-held-through-business') {
      router.replace(SUMMARY_ROUTE as any);
      return;
    }

    const businessAsset = asset as AssetsHeldThroughBusinessAsset;
    loadedIdRef.current = editingAssetId;

    // Pre-select the business from the asset
    setSelectedBusinessId(businessAsset.businessId);
    setSelectedBusinessName(businessAsset.businessName || '');

    setFormData({
      assetType: businessAsset.assetType || '',
      assetDescription: businessAsset.assetDescription || '',
      estimatedValue: businessAsset.estimatedValue || 0,
    });
    setValueNotSure(businessAsset.estimatedValueUnknown === true);
  }, [editingAssetId, bequeathalActions]);

  const handleBusinessSelect = (businessId: string) => {
    if (businessId === '__ADD_NEW__') {
      setShowNewBusinessForm(true);
      setSelectedBusinessId('');
      setSelectedBusinessName('');
    } else {
      // Find business to get name
      const business = businessActions.getBusinessById(businessId);
      if (business) {
        setSelectedBusinessId(businessId);
        setSelectedBusinessName(business.name);
        setShowNewBusinessForm(false);
      }
    }
  };

  const handleCreateNewBusiness = () => {
    if (!newBusinessForm.name.trim()) return;

    const newBusinessId = businessActions.addBusiness({
      name: newBusinessForm.name,
      businessType: '',
      estimatedValue: 0,
    });

    setSelectedBusinessId(newBusinessId);
    setSelectedBusinessName(newBusinessForm.name);
    setShowNewBusinessForm(false);
    setNewBusinessForm({ name: '' });
  };

  const handleChangeBusiness = () => {
    setSelectedBusinessId('');
    setSelectedBusinessName('');
  };

  const handleSave = () => {
    // Validation
    if (!selectedBusinessId || !formData.assetType || !formData.assetDescription.trim()) return;

    // Get business name for title
    const business = businessActions.getBusinessById(selectedBusinessId);
    const businessName = business?.name || selectedBusinessName || 'Unknown Business';

    // Round value to nearest £1 — undefined when unsure (not 0)
    const estimatedValue = valueNotSure ? undefined : Math.round(formData.estimatedValue);

    const assetTypeLabel = assetTypeOptions.find(opt => opt.value === formData.assetType)?.label || formData.assetType;

    const assetData = {
      title: `${businessName} - ${formData.assetDescription || assetTypeLabel}`,
      businessId: selectedBusinessId,
      businessName,
      assetType: formData.assetType,
      assetDescription: formData.assetDescription || undefined,
      estimatedValue,
      estimatedValueUnknown: valueNotSure || undefined,
      netValue: estimatedValue,
    };

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, assetData);
    } else {
      bequeathalActions.addAsset('assets-held-through-business', assetData);
    }

    // Compute delta for net wealth toast (avoids reading stale batched state)
    const oldAssetValue = editingAssetId
      ? (bequeathalActions.getAssetById(editingAssetId)?.estimatedValue || 0)
      : 0;
    toast.notifySave((estimatedValue ?? 0) - oldAssetValue);

    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  const canSubmit = selectedBusinessId && formData.assetType && formData.assetDescription.trim();

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
            {editingAssetId ? 'Edit Business Asset' : 'Add Business Asset'}
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
          {/* STEP 1: Business Selection */}
          {!selectedBusinessId && !showNewBusinessForm && (
            <View style={styles.businessSelectorCard}>
              <Text style={styles.sectionTitle}>Select Business</Text>
              <SearchableSelect
                label="Which Business?"
                placeholder="Select business..."
                value={selectedBusinessId}
                options={businessOptions}
                onChange={handleBusinessSelect}
              />
              <Text style={styles.helperText}>
                Businesses from your private company shares will appear here
              </Text>
            </View>
          )}

          {/* New Business Form (if triggered) */}
          {showNewBusinessForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add New Business</Text>

              <Input
                label="Business Name *"
                placeholder="e.g., Smith Trading Ltd"
                value={newBusinessForm.name}
                onChangeText={(value) => setNewBusinessForm(prev => ({ ...prev, name: value }))}
              />

              <View style={styles.buttonRow}>
                <Button
                  onPress={() => {
                    setShowNewBusinessForm(false);
                    setNewBusinessForm({ name: '' });
                  }}
                  variant="outline"
                  style={styles.halfButton}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleCreateNewBusiness}
                  variant="primary"
                  disabled={!newBusinessForm.name.trim()}
                  style={styles.halfButton}
                >
                  Create Business
                </Button>
              </View>
            </View>
          )}

          {/* STEP 2: Asset Entry (shown after business selected) */}
          {selectedBusinessId && (
            <>
              {/* Selected Business Display */}
              <View style={styles.selectedBusinessCard}>
                <View style={styles.selectedBusinessHeader}>
                  <View style={styles.selectedBusinessInfo}>
                    <Text style={styles.selectedBusinessName}>{selectedBusinessName}</Text>
                  </View>
                  <TouchableOpacity onPress={handleChangeBusiness}>
                    <Text style={styles.changeBusinessText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Asset Entry Form */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingAssetId ? 'Update the details below.' : 'Add an asset held through a business.'}
                </Text>

                <Select
                  label="Asset Type *"
                  placeholder="Select asset type..."
                  value={formData.assetType}
                  options={assetTypeOptions}
                  onChange={(value) => setFormData(prev => ({ ...prev, assetType: value, assetDescription: '' }))}
                />

                <Input
                  label="Asset Description *"
                  placeholder={getPlaceholder(formData.assetType)}
                  value={formData.assetDescription}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, assetDescription: value }))}
                />

                <View style={styles.valueSection}>
                  <View style={valueNotSure && styles.disabledInputContainer}>
                    <CurrencyInput
                      label="Estimated Value"
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
                </View>

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
  businessSelectorCard: {
    backgroundColor: `${KindlingColors.cream}33`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    lineHeight: 16,
    marginTop: -Spacing.xs,
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  selectedBusinessCard: {
    backgroundColor: `${KindlingColors.navy}0D`,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${KindlingColors.navy}26`,
    marginBottom: Spacing.lg,
  },
  selectedBusinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBusinessInfo: {
    flex: 1,
  },
  selectedBusinessName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  changeBusinessText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
    fontWeight: Typography.fontWeight.medium,
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
});
