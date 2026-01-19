/**
 * Assets Held Through Business Entry Screen
 * 
 * Two-step flow for adding business-owned assets:
 * Step 1: Select business (from Private Company Shares or add new)
 * Step 2: Add assets to selected business
 * 
 * Features ultra-clean relational model - stores only businessId,
 * looks up business name/ownership from Business record.
 * 
 * Navigation:
 * - Back: Returns to assets held through business intro
 * - Continue: Proceeds to next category or order-of-things
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, SearchableSelect } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import type { AssetsHeldThroughBusinessAsset } from '../../../src/types';

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

  // Load existing assets
  const existingAssets = bequeathalActions.getAssetsByType('assets-held-through-business') as AssetsHeldThroughBusinessAsset[];

  // Group assets by business
  const assetsByBusiness = useMemo(() => {
    const grouped = new Map<string, AssetsHeldThroughBusinessAsset[]>();
    
    existingAssets.forEach(asset => {
      if (!grouped.has(asset.businessId)) {
        grouped.set(asset.businessId, []);
      }
      grouped.get(asset.businessId)!.push(asset);
    });
    
    return grouped;
  }, [existingAssets]);

  // Calculate totals
  const grandTotal = existingAssets.reduce((sum, asset) => sum + (asset.estimatedValue ?? 0), 0);
  const businessCount = assetsByBusiness.size;

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

  const handleAddAsset = () => {
    // Validation
    if (!selectedBusinessId || !formData.assetType || !formData.assetDescription.trim()) return;

    // Get business name for title
    const business = businessActions.getBusinessById(selectedBusinessId);
    const businessName = business?.name || selectedBusinessName || 'Unknown Business';

    // Round value to nearest £1
    const estimatedValue = Math.round(valueNotSure ? 0 : formData.estimatedValue);

    const assetTypeLabel = assetTypeOptions.find(opt => opt.value === formData.assetType)?.label || formData.assetType;

    const assetData = {
      title: `${businessName} - ${formData.assetDescription || assetTypeLabel}`,
      businessId: selectedBusinessId,
      assetType: formData.assetType,
      assetDescription: formData.assetDescription || undefined,
      estimatedValue,
      netValue: estimatedValue,
    };

    bequeathalActions.addAsset('assets-held-through-business', assetData);

    // Reset asset form only
    setFormData({
      assetType: '',
      assetDescription: '',
      estimatedValue: 0,
    });
    setValueNotSure(false);
  };

  const handleRemoveAsset = (id: string) => {
    bequeathalActions.removeAsset(id);
  };

  const handleAddForAnotherBusiness = () => {
    setSelectedBusinessId('');
    setSelectedBusinessName('');
    setFormData({
      assetType: '',
      assetDescription: '',
      estimatedValue: 0,
    });
    setValueNotSure(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('assets-held-through-business', selectedCategories);
    router.push(nextRoute);
  };

  const getBusinessDetails = (businessId: string) => {
    const business = businessActions.getBusinessById(businessId);
    return {
      name: business?.name || 'Unknown Business (deleted)',
    };
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
          <Text style={styles.headerTitle}>Enter Business Assets</Text>
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
                  <TouchableOpacity onPress={handleAddForAnotherBusiness}>
                    <Text style={styles.changeBusinessText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Asset Entry Form */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Add Asset</Text>
                
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

                <Button
                  onPress={handleAddAsset}
                  variant="primary"
                  disabled={!canSubmit}
                >
                  {`Add Asset to ${selectedBusinessName}`}
                </Button>
              </View>

              {/* Assets for Selected Business */}
              {assetsByBusiness.has(selectedBusinessId) && assetsByBusiness.get(selectedBusinessId)!.length > 0 && (
                <View style={styles.assetsSection}>
                  <Text style={styles.assetsTitle}>
                    Assets ({assetsByBusiness.get(selectedBusinessId)!.length})
                  </Text>

                  <View style={styles.assetsList}>
                    {assetsByBusiness.get(selectedBusinessId)!.map((asset) => {
                      const assetTypeLabel = assetTypeOptions.find(opt => opt.value === asset.assetType)?.label || asset.assetType;
                      
                      return (
                        <View key={asset.id} style={styles.assetCard}>
                          <View style={styles.assetInfo}>
                            <Text style={styles.assetType}>{assetTypeLabel}</Text>
                            {asset.assetDescription && (
                              <Text style={styles.assetDescription}>{asset.assetDescription}</Text>
                            )}
                            {(asset.estimatedValue ?? 0) > 0 && (
                              <Text style={styles.assetValue}>
                                £{(asset.estimatedValue ?? 0).toLocaleString()}
                              </Text>
                            )}
                          </View>
                          
                          <TouchableOpacity
                            onPress={() => handleRemoveAsset(asset.id)}
                            style={styles.deleteButton}
                          >
                            <IconButton icon="delete" size={20} iconColor={KindlingColors.destructive} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    {/* Business Subtotal */}
                    <View style={styles.subtotalSection}>
                      <Text style={styles.subtotalText}>
                        {selectedBusinessName} Total: <Text style={styles.subtotalValue}>
                          £{assetsByBusiness.get(selectedBusinessId)!.reduce((sum, a) => sum + (a.estimatedValue ?? 0), 0).toLocaleString()}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {/* All Businesses Summary (if multiple businesses have assets) */}
          {businessCount > 0 && (
            <View style={styles.allBusinessesSection}>
              <Text style={styles.allBusinessesTitle}>All Business Assets</Text>

              {Array.from(assetsByBusiness.entries()).map(([businessId, assets]) => {
                const { name } = getBusinessDetails(businessId);
                const subtotal = assets.reduce((sum, a) => sum + (a.estimatedValue ?? 0), 0);

                return (
                  <View key={businessId} style={styles.businessGroup}>
                    <Text style={styles.businessGroupName}>
                      {name}
                    </Text>
                    {assets.map((asset) => {
                      const assetTypeLabel = assetTypeOptions.find(opt => opt.value === asset.assetType)?.label || asset.assetType;
                      return (
                        <Text key={asset.id} style={styles.businessGroupAsset}>
                          • {assetTypeLabel}{asset.assetDescription ? ` - ${asset.assetDescription}` : ''}: £{(asset.estimatedValue ?? 0).toLocaleString()}
                        </Text>
                      );
                    })}
                    <Text style={styles.businessGroupSubtotal}>
                      Subtotal: £{subtotal.toLocaleString()}
                    </Text>
                  </View>
                );
              })}

              {/* Grand Total */}
              <View style={styles.grandTotalSection}>
                <Text style={styles.grandTotalText}>
                  Total Business Assets: <Text style={styles.grandTotalValue}>£{grandTotal.toLocaleString()}</Text>
                </Text>
                <Text style={styles.grandTotalSubtext}>
                  Across {businessCount} {businessCount === 1 ? 'business' : 'businesses'}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {selectedBusinessId && (
              <TouchableOpacity
                onPress={handleAddForAnotherBusiness}
                style={styles.addAnotherBusinessButton}
                activeOpacity={0.7}
              >
                <Text style={styles.addAnotherBusinessText}>Add For Another Business</Text>
              </TouchableOpacity>
            )}

            <Button onPress={handleContinue} variant="primary" style={styles.continueButton}>
              Continue
            </Button>
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
    zIndex: 10,
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
    zIndex: 10,
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
  assetsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  assetsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  assetsList: {
    gap: Spacing.sm,
  },
  assetCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assetInfo: {
    flex: 1,
    gap: 4,
  },
  assetType: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  assetDescription: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  assetValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    backgroundColor: `${KindlingColors.cream}80`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deleteButton: {
    marginLeft: Spacing.sm,
  },
  subtotalSection: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: `${KindlingColors.cream}66`,
    borderRadius: 6,
  },
  subtotalText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  subtotalValue: {
    fontWeight: Typography.fontWeight.semibold,
  },
  allBusinessesSection: {
    backgroundColor: `${KindlingColors.cream}4D`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  allBusinessesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  businessGroup: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.cream}80`,
    marginBottom: Spacing.sm,
  },
  businessGroupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: 4,
  },
  businessGroupAsset: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}CC`,
    paddingLeft: Spacing.sm,
    lineHeight: 20,
  },
  businessGroupSubtotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginTop: 4,
  },
  grandTotalSection: {
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.navy}0D`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${KindlingColors.navy}26`,
  },
  grandTotalText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  grandTotalValue: {
    fontWeight: Typography.fontWeight.semibold,
  },
  grandTotalSubtext: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  actionsSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addAnotherBusinessButton: {
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.green,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAnotherBusinessText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  continueButton: {
    marginTop: 0,
  },
});
