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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Input, CurrencyInput, ValidationAttentionButton } from '../../../src/components/ui';
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

  const assetTypeGroups: { heading: string; items: { label: string; value: string; icon: string }[] }[] = [
    {
      heading: 'Physical Assets',
      items: [
        { label: 'Property', value: 'property', icon: 'home-city' },
        { label: 'Equipment', value: 'equipment', icon: 'wrench' },
        { label: 'Vehicles', value: 'vehicles', icon: 'truck' },
      ],
    },
    {
      heading: 'Financial',
      items: [
        { label: 'Bank Accounts', value: 'bank-accounts', icon: 'bank' },
        { label: 'Investments', value: 'investments', icon: 'chart-line' },
      ],
    },
    {
      heading: 'Other',
      items: [
        { label: 'Inventory', value: 'inventory', icon: 'package-variant' },
        { label: 'Intellectual Property', value: 'intellectual-property', icon: 'lightbulb-on' },
        { label: 'Other', value: 'other', icon: 'dots-horizontal-circle' },
      ],
    },
  ];

  const allAssetTypeItems = assetTypeGroups.flatMap(g => g.items);

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

  const businesses = businessActions.getBusinesses();

  // Skip business selector if no businesses exist yet (new asset only)
  useEffect(() => {
    if (!editingAssetId && businesses.length === 0) {
      setShowNewBusinessForm(true);
    }
  }, []);

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
    const estimatedValue = valueNotSure || formData.estimatedValue === 0
      ? undefined
      : Math.round(formData.estimatedValue);

    const assetTypeLabel = allAssetTypeItems.find(opt => opt.value === formData.assetType)?.label || formData.assetType;

    const assetData = {
      title: `${businessName} - ${formData.assetDescription || assetTypeLabel}`,
      businessId: selectedBusinessId,
      businessName,
      assetType: formData.assetType,
      assetDescription: formData.assetDescription || undefined,
      estimatedValue,
      estimatedValueUnknown: (valueNotSure || formData.estimatedValue === 0) || undefined,
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

              {businesses.length > 0 ? (
                <View style={styles.businessList}>
                  {businesses.map((business) => (
                    <TouchableOpacity
                      key={business.id}
                      style={styles.businessCard}
                      onPress={() => handleBusinessSelect(business.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.businessCardIcon}>
                        <MaterialCommunityIcons name="office-building" size={20} color={KindlingColors.navy} />
                      </View>
                      <View style={styles.businessCardInfo}>
                        <Text style={styles.businessCardName}>{business.name}</Text>
                        {business.businessType ? (
                          <Text style={styles.businessCardSub}>{business.businessType}</Text>
                        ) : null}
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={`${KindlingColors.navy}40`} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyBusinessText}>
                  No businesses yet. Create one below to get started.
                </Text>
              )}

              <TouchableOpacity
                style={styles.addBusinessRow}
                onPress={() => handleBusinessSelect('__ADD_NEW__')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={22} color={KindlingColors.green} />
                <Text style={styles.addBusinessText}>Add New Business</Text>
              </TouchableOpacity>

              {businesses.length > 0 && (
                <Text style={styles.helperText}>
                  Businesses from your private company shares will appear here
                </Text>
              )}
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
              {/* Asset Entry Form */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingAssetId ? 'Update the details below.' : 'Add an asset held through'}
                </Text>

                {/* Selected business — styled like selected asset type */}
                <View style={[styles.assetTypeCard, styles.assetTypeCardSelected]}>
                  <View style={[styles.assetTypeIcon, styles.assetTypeIconSelected]}>
                    <MaterialCommunityIcons name="office-building" size={18} color={KindlingColors.background} />
                  </View>
                  <Text style={[styles.assetTypeLabel, styles.assetTypeLabelSelected]}>
                    {selectedBusinessName}
                  </Text>
                  <TouchableOpacity onPress={handleChangeBusiness}>
                    <Text style={styles.changeBusinessText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Asset Type *</Text>
                  {formData.assetType ? (
                    <View style={[styles.assetTypeCard, styles.assetTypeCardSelected]}>
                      <View style={[styles.assetTypeIcon, styles.assetTypeIconSelected]}>
                        <MaterialCommunityIcons
                          name={(allAssetTypeItems.find(i => i.value === formData.assetType)?.icon || 'dots-horizontal-circle') as any}
                          size={18}
                          color={KindlingColors.background}
                        />
                      </View>
                      <Text style={[styles.assetTypeLabel, styles.assetTypeLabelSelected]}>
                        {allAssetTypeItems.find(i => i.value === formData.assetType)?.label || formData.assetType}
                      </Text>
                      <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, assetType: '', assetDescription: '' }))}>
                        <Text style={styles.changeBusinessText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    assetTypeGroups.map((group) => (
                      <View key={group.heading} style={styles.assetTypeGroup}>
                        <Text style={styles.assetTypeGroupHeading}>{group.heading}</Text>
                        <View style={styles.assetTypeCards}>
                          {group.items.map((item) => (
                            <TouchableOpacity
                              key={item.value}
                              style={styles.assetTypeCard}
                              onPress={() => setFormData(prev => ({ ...prev, assetType: item.value, assetDescription: '' }))}
                              activeOpacity={0.7}
                            >
                              <View style={styles.assetTypeIcon}>
                                <MaterialCommunityIcons
                                  name={item.icon as any}
                                  size={18}
                                  color={KindlingColors.navy}
                                />
                              </View>
                              <Text style={styles.assetTypeLabel}>
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))
                  )}
                </View>

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
  businessList: {
    gap: Spacing.sm,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.background,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    gap: Spacing.sm,
  },
  businessCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${KindlingColors.navy}0D`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessCardInfo: {
    flex: 1,
  },
  businessCardName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  businessCardSub: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.brown,
    marginTop: 2,
  },
  emptyBusinessText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    lineHeight: 20,
  },
  addBusinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  addBusinessText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.green,
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
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  assetTypeGroup: {
    marginBottom: Spacing.sm,
  },
  assetTypeGroupHeading: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.brown,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  assetTypeCards: {
    gap: Spacing.xs,
  },
  assetTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.background,
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: `${KindlingColors.beige}80`,
    gap: Spacing.sm,
  },
  assetTypeCardSelected: {
    borderColor: KindlingColors.green,
    backgroundColor: `${KindlingColors.green}0A`,
  },
  assetTypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${KindlingColors.navy}0D`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetTypeIconSelected: {
    backgroundColor: KindlingColors.green,
  },
  assetTypeLabel: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  assetTypeLabelSelected: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfButton: {
    flex: 1,
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
