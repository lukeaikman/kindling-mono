/**
 * Private Company Shares Entry Screen
 * 
 * Form for adding and managing private company shareholdings.
 * Features innovative inline toggle for ownership input (% vs number of shares).
 * 
 * Navigation:
 * - Back: Returns to private company shares intro
 * - Continue: Proceeds to next category or order-of-things
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Input, CurrencyInput } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import type { PrivateCompanySharesAsset } from '../../../src/types';

interface ShareForm {
  companyName: string;
  ownershipValue: string;
  estimatedValue: number;
  notes: string;
  excludeFromNetWorth: boolean;
  isActivelyTrading: boolean;
  heldForTwoPlusYears: boolean;
  isNotHoldingCompany: boolean;
}

export default function PrivateCompanySharesEntryScreen() {
  const { bequeathalActions } = useAppState();
  const [showForm, setShowForm] = useState(true);
  const [ownershipMode, setOwnershipMode] = useState<'percentage' | 'shares'>('percentage');
  const [formData, setFormData] = useState<ShareForm>({
    companyName: '',
    ownershipValue: '',
    estimatedValue: 0,
    notes: '',
    excludeFromNetWorth: false,
    isActivelyTrading: false,
    heldForTwoPlusYears: false,
    isNotHoldingCompany: false,
  });
  const [valueNotSure, setValueNotSure] = useState(false);

  // Load existing shares
  const existingShares = bequeathalActions.getAssetsByType('private-company-shares') as PrivateCompanySharesAsset[];
  
  // Calculate total excluding shares marked excludeFromNetWorth
  const totalSharesValue = existingShares.reduce((sum, share) => 
    sum + (share.excludeFromNetWorth ? 0 : (share.estimatedValue || 0)), 0
  );
  const excludedCount = existingShares.filter(s => s.excludeFromNetWorth).length;

  // Hide form after first share if none existed initially
  useEffect(() => {
    if (existingShares.length === 0) {
      setShowForm(true);
    } else if (existingShares.length > 0) {
      setShowForm(false);
    }
  }, []);

  const handleToggleMode = (newMode: 'percentage' | 'shares') => {
    if (newMode === ownershipMode) return;
    setOwnershipMode(newMode);
    setFormData(prev => ({ ...prev, ownershipValue: '' })); // Clear input when switching
  };

  const handleAddShare = () => {
    // Validation
    if (!formData.companyName.trim()) return;

    // Round value to nearest £1
    const estimatedValue = Math.round(valueNotSure ? 0 : formData.estimatedValue);

    // Build share data with ownership field
    let percentageOwnership: number | undefined;
    let numberOfShares: number | undefined;

    if (ownershipMode === 'percentage' && formData.ownershipValue) {
      const rawPercentage = parseFloat(formData.ownershipValue);
      percentageOwnership = Math.round(rawPercentage * 100) / 100; // Round to 2dp
    } else if (ownershipMode === 'shares' && formData.ownershipValue) {
      numberOfShares = parseInt(formData.ownershipValue);
    }

    const shareData = {
      title: formData.companyName,
      companyName: formData.companyName,
      percentageOwnership,
      numberOfShares,
      estimatedValue,
      netValue: estimatedValue,
      notes: formData.notes || undefined,
      excludeFromNetWorth: formData.excludeFromNetWorth,
      isActivelyTrading: formData.isActivelyTrading,
      heldForTwoPlusYears: formData.heldForTwoPlusYears,
      isNotHoldingCompany: formData.isNotHoldingCompany,
    };

    bequeathalActions.addAsset('private-company-shares', shareData);

    // Reset form
    setFormData({
      companyName: '',
      ownershipValue: '',
      estimatedValue: 0,
      notes: '',
      excludeFromNetWorth: false,
      isActivelyTrading: false,
      heldForTwoPlusYears: false,
      isNotHoldingCompany: false,
    });
    setValueNotSure(false);
    setShowForm(false);
  };

  const handleRemoveShare = (id: string) => {
    bequeathalActions.removeAsset(id);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('private-company-shares', selectedCategories);
    router.push(nextRoute);
  };

  const getOwnershipDisplay = (share: PrivateCompanySharesAsset) => {
    if (share.percentageOwnership) {
      return `${share.percentageOwnership}% ownership`;
    }
    if (share.numberOfShares) {
      return `${share.numberOfShares.toLocaleString()} shares`;
    }
    return null;
  };

  const canSubmit = formData.companyName.trim();

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
          <Text style={styles.headerTitle}>Enter Shareholdings</Text>
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
          {/* Add Share Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add Shareholding</Text>
              
              {/* Company Name */}
              <Input
                label="Company Name *"
                placeholder="e.g., Acme Ltd, Smith & Co"
                value={formData.companyName}
                onChangeText={(value) => setFormData(prev => ({ ...prev, companyName: value }))}
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

                <TouchableOpacity
                  onPress={() => setFormData(prev => ({ ...prev, heldForTwoPlusYears: !prev.heldForTwoPlusYears }))}
                  style={styles.checkboxRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxCircle, formData.heldForTwoPlusYears && styles.checkboxCircleSelected]}>
                    {formData.heldForTwoPlusYears && (
                      <IconButton
                        icon="check"
                        size={16}
                        iconColor={KindlingColors.background}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>You've owned the shares 2+ years</Text>
                </TouchableOpacity>

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
                onPress={handleAddShare}
                variant="primary"
                disabled={!canSubmit}
              >
                Add Shareholding
              </Button>
            </View>
          )}

          {/* Existing Shares List - Simple (NO eye icon) */}
          {existingShares.length > 0 && (
            <View style={styles.sharesSection}>
              <Text style={styles.sharesTitle}>
                Your Private Company Shares ({existingShares.length})
              </Text>

              <View style={styles.sharesList}>
                {existingShares.map((share) => (
                  <View key={share.id} style={styles.shareCard}>
                    <View style={styles.shareInfo}>
                      <Text style={styles.companyName}>{share.companyName}</Text>
                      
                      {getOwnershipDisplay(share) && (
                        <Text style={styles.ownershipText}>{getOwnershipDisplay(share)}</Text>
                      )}
                      
                      {(share.estimatedValue || 0) > 0 && (
                        <Text style={styles.shareValue}>
                          £{(share.estimatedValue || 0).toLocaleString()}
                        </Text>
                      )}
                      
                      {share.excludeFromNetWorth && (
                        <View style={styles.excludedBadge}>
                          <Text style={styles.excludedText}>🔸 Excluded from net worth</Text>
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handleRemoveShare(share.id)}
                      style={styles.deleteButton}
                    >
                      <IconButton icon="delete" size={20} iconColor={KindlingColors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Total Summary */}
                <View style={styles.totalSection}>
                  <Text style={styles.totalText}>
                    Total Private Company Shares: <Text style={styles.totalValue}>£{totalSharesValue.toLocaleString()}</Text>
                  </Text>
                  {excludedCount > 0 && (
                    <Text style={styles.excludedCountText}>
                      Excludes {excludedCount} illiquid/speculative {excludedCount === 1 ? 'holding' : 'holdings'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons - at bottom of content */}
          {existingShares.length > 0 && (
            <>
              {!showForm && (
                <TouchableOpacity
                  onPress={() => setShowForm(true)}
                  style={styles.addAnotherButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addAnotherText}>Add Another Shareholding</Text>
                </TouchableOpacity>
              )}

              <Button onPress={handleContinue} variant="primary" style={styles.continueButton}>
                Continue
              </Button>
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
  sharesSection: {
    gap: Spacing.md,
  },
  sharesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  sharesList: {
    gap: Spacing.sm,
  },
  shareCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shareInfo: {
    flex: 1,
    gap: 4,
  },
  companyName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  ownershipText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  shareValue: {
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
  excludedBadge: {
    marginTop: 4,
  },
  excludedText: {
    fontSize: Typography.fontSize.xs,
    color: '#FF8C00',
  },
  deleteButton: {
    marginLeft: Spacing.sm,
  },
  totalSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.cream}66`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  totalText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  totalValue: {
    fontWeight: Typography.fontWeight.semibold,
  },
  excludedCountText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  addAnotherButton: {
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.green,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  addAnotherText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  continueButton: {
    marginTop: Spacing.sm,
  },
});
