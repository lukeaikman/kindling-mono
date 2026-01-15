/**
 * Investments Entry Screen
 * 
 * Form for adding and managing investment accounts.
 * Loads ISAs created in Bank Accounts screen (Phase 5 integration).
 * Multi-beneficiary support for flexible distribution.
 * 
 * Navigation:
 * - Back: Returns to investments intro
 * - Continue: Proceeds to next category or order-of-things
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../../src/utils/helpers';
import { validatePercentageAllocation, getBeneficiaryDisplayName } from '../../../src/utils/beneficiaryHelpers';
import type { InvestmentAsset, BeneficiaryAssignment } from '../../../src/types';

interface InvestmentForm {
  provider: string;
  investmentType: string;
  beneficiaries: BeneficiaryAssignment[];
  estimatedValue: number;
}

export default function InvestmentsEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const [showForm, setShowForm] = useState(true);
  const [showInvestmentsList, setShowInvestmentsList] = useState(true);
  const [formData, setFormData] = useState<InvestmentForm>({
    provider: '',
    investmentType: '',
    beneficiaries: [],
    estimatedValue: 0,
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  // Investment type options
  const investmentTypeOptions = [
    { label: 'General Investment Account', value: 'general-investment-account' },
    { label: 'AIM holdings', value: 'aim-holdings' },
    { label: 'ISA (Stocks & Shares)', value: 'isa-stocks-shares' },
    { label: 'Cash ISA', value: 'cash-isa' },
    { label: 'Direct CREST Holding', value: 'direct-crest-holding' },
    { label: 'Junior ISA (JISA)', value: 'junior-isa' },
    { label: 'NS&I Products', value: 'nsi-products' },
    { label: 'Employee Share Scheme', value: 'employee-share-scheme' },
    { label: 'Other', value: 'other' },
  ];

  // Load existing investments (includes ISAs from Bank Accounts - Phase 5)
  const investments = bequeathalActions.getAssetsByType('investment') as InvestmentAsset[];
  const totalValue = investments.reduce((sum, inv) => sum + (inv.estimatedValue || 0), 0);
  const unknownValueCount = investments.filter(inv => (inv.estimatedValue || 0) === 0).length;

  // Get will-maker ID to exclude from beneficiary selection
  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  // Hide form after first investment
  useEffect(() => {
    if (investments.length === 0) {
      setShowForm(true);
    } else if (investments.length > 0) {
      setShowForm(false);
    }
  }, []);

  const handleBeneficiariesChange = (newBeneficiaries: BeneficiaryAssignment[]) => {
    setFormData(prev => ({ ...prev, beneficiaries: newBeneficiaries }));
  };

  const handleAddInvestment = () => {
    // Validation
    if (!formData.provider.trim() || formData.beneficiaries.length === 0) return;
    
    // Validate percentages total 100%
    if (!validatePercentageAllocation({ beneficiaries: formData.beneficiaries })) {
      return; // Component already shows error
    }

    // Round value to nearest £1
    const estimatedValue = Math.round(balanceNotSure ? 0 : formData.estimatedValue);

    const investmentType = formData.investmentType || 'other';
    const investmentTypeLabel = investmentTypeOptions.find(opt => opt.value === investmentType)?.label || 'Other';

    const investmentData = {
      title: formData.investmentType 
        ? `${formData.provider} - ${investmentTypeLabel}`
        : formData.provider,
      provider: formData.provider.trim(),
      investmentType,
      beneficiaryAssignments: {
        beneficiaries: formData.beneficiaries.map(b => ({
          id: b.id,
          type: b.type,
          percentage: b.percentage,
        }))
      },
      estimatedValue,
      netValue: estimatedValue,
    };

    if (editingInvestmentId) {
      bequeathalActions.updateAsset(editingInvestmentId, investmentData);
      setEditingInvestmentId(null);
    } else {
      bequeathalActions.addAsset('investment', investmentData);
    }

    // Reset form
    setFormData({
      provider: '',
      investmentType: '',
      beneficiaries: [],
      estimatedValue: 0,
    });
    setBalanceNotSure(false);
    setShowForm(false);
  };

  const handleEditInvestment = (investmentId: string) => {
    const investment = bequeathalActions.getAssetById(investmentId) as InvestmentAsset;
    if (!investment) return;

    // Load beneficiaries array (handles both old single and new percentage formats)
    let beneficiaries: BeneficiaryAssignment[] = [];
    
    if (investment.beneficiaryAssignments?.beneficiaries) {
      beneficiaries = investment.beneficiaryAssignments.beneficiaries.map(b => ({
        id: b.id,
        type: b.type,
        percentage: b.percentage || (investment.beneficiaryAssignments!.beneficiaries.length === 1 ? 100 : undefined),
      }));
    }

    setFormData({
      provider: investment.provider,
      investmentType: investment.investmentType || '',
      beneficiaries,
      estimatedValue: investment.estimatedValue || 0,
    });
    setEditingInvestmentId(investmentId);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      provider: '',
      investmentType: '',
      beneficiaries: [],
      estimatedValue: 0,
    });
    setBalanceNotSure(false);
    setEditingInvestmentId(null);
    setShowForm(false);
  };

  const handleRemoveInvestment = (id: string) => {
    bequeathalActions.removeAsset(id);
    if (editingInvestmentId === id) {
      handleCancelEdit();
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('investment', selectedCategories);
    router.push(nextRoute);
  };

  const canSubmit = formData.provider.trim() && 
    formData.beneficiaries.length > 0 && 
    validatePercentageAllocation({ beneficiaries: formData.beneficiaries });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Enter Investments</Text>
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
          {/* Add Investment Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingInvestmentId ? 'Edit Investment' : 'Add Investment'}
              </Text>
              
              <Input
                label="Investment With *"
                placeholder="e.g., AJ Bell, Hargreaves Lansdown"
                value={formData.provider}
                onChangeText={(value) => setFormData(prev => ({ ...prev, provider: value }))}
              />

              <Select
                label="Investment Type"
                placeholder="Select investment type..."
                value={formData.investmentType}
                options={investmentTypeOptions}
                onChange={(value) => setFormData(prev => ({ ...prev, investmentType: value }))}
              />

              {/* Beneficiaries with Percentage Allocations */}
              <BeneficiaryWithPercentages
                allocationMode="percentage"
                value={formData.beneficiaries}
                onChange={handleBeneficiariesChange}
                personActions={personActions}
                beneficiaryGroupActions={beneficiaryGroupActions}
                excludePersonIds={excludePersonIds}
                label="Who will receive this? *"
                onAddNewPerson={() => setShowAddPersonDialog(true)}
                onAddNewGroup={() => setShowGroupDrawer(true)}
              />

              <View style={styles.balanceSection}>
                <View style={balanceNotSure && styles.disabledInputContainer}>
                  <CurrencyInput
                    label="Estimated Value"
                    placeholder="0"
                    value={balanceNotSure ? 0 : formData.estimatedValue}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, estimatedValue: value }));
                      setBalanceNotSure(false);
                    }}
                    disabled={balanceNotSure}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newValue = !balanceNotSure;
                    setBalanceNotSure(newValue);
                    if (newValue) {
                      setFormData(prev => ({ ...prev, estimatedValue: 0 }));
                    }
                  }}
                  style={styles.checkboxRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxCircle, balanceNotSure && styles.checkboxCircleSelected]}>
                    {balanceNotSure && (
                      <IconButton
                        icon="check"
                        size={16}
                        iconColor={KindlingColors.background}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Unsure of balance</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formActions}>
                <Button
                  onPress={handleAddInvestment}
                  variant="primary"
                  disabled={!canSubmit}
                  style={styles.submitButton}
                >
                  {editingInvestmentId ? 'Update Investment' : 'Add Investment'}
                </Button>
                
                {editingInvestmentId && (
                  <Button
                    onPress={handleCancelEdit}
                    variant="outline"
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                )}
              </View>
            </View>
          )}

          {/* Existing Investments List */}
          {investments.length > 0 && (
            <View style={styles.investmentsSection}>
              <View style={styles.investmentsHeader}>
                <Text style={styles.investmentsTitle}>
                  Your Investments ({investments.length})
                </Text>
                <TouchableOpacity onPress={() => setShowInvestmentsList(!showInvestmentsList)}>
                  <IconButton
                    icon={showInvestmentsList ? 'eye-off' : 'eye'}
                    size={20}
                    iconColor={KindlingColors.brown}
                  />
                </TouchableOpacity>
              </View>

              {showInvestmentsList && (
                <View style={styles.investmentsList}>
                  {investments.map((investment) => {
                    const investmentTypeLabel = investmentTypeOptions.find(
                      opt => opt.value === investment.investmentType
                    )?.label || 'Other';
                    
                    const beneficiaries = investment.beneficiaryAssignments?.beneficiaries || [];
                    
                    return (
                      <View key={investment.id} style={styles.investmentCard}>
                        <View style={styles.investmentInfo}>
                          <Text style={styles.investmentProvider}>{investment.provider}</Text>
                          <Text style={styles.investmentType}>{investmentTypeLabel}</Text>
                          
                          {/* Beneficiaries with Percentages */}
                          {beneficiaries.length > 0 && (
                            <View style={styles.beneficiariesRow}>
                              <Text style={styles.beneficiaryLabel}>For: </Text>
                              <View style={styles.beneficiariesList}>
                                {beneficiaries.map((b, idx) => {
                                  const displayName = getBeneficiaryDisplayName(
                                    b,
                                    personActions,
                                    beneficiaryGroupActions
                                  );
                                  const percentage = b.percentage || 0;
                                  const percentageValue = investment.estimatedValue 
                                    ? `£${Math.round((investment.estimatedValue * percentage) / 100).toLocaleString()}`
                                    : '';
                                  
                                  return (
                                    <Text key={idx} style={styles.beneficiaryText}>
                                      {displayName} {percentage}% {percentageValue && `(${percentageValue})`}
                                      {idx < beneficiaries.length - 1 && ', '}
                                    </Text>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                          
                          <Text style={styles.investmentValue}>
                            {(investment.estimatedValue || 0) === 0 
                              ? 'Value not known' 
                              : `£${(investment.estimatedValue || 0).toLocaleString()}`}
                          </Text>
                        </View>
                        
                        <View style={styles.investmentActions}>
                          <TouchableOpacity
                            onPress={() => handleEditInvestment(investment.id)}
                            style={styles.actionButton}
                          >
                            <IconButton icon="pencil" size={18} iconColor={KindlingColors.navy} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRemoveInvestment(investment.id)}
                            style={styles.actionButton}
                          >
                            <IconButton icon="delete" size={18} iconColor={KindlingColors.destructive} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}

                  {/* Total Summary */}
                  <View style={styles.totalSection}>
                    <Text style={styles.totalText}>
                      Investments Total: <Text style={styles.totalValue}>£{totalValue.toLocaleString()}</Text>
                    </Text>
                    {unknownValueCount > 0 && (
                      <Text style={styles.unknownValueText}>
                        (+ {unknownValueCount} unknown {unknownValueCount === 1 ? 'balance' : 'balances'})
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons - at bottom of content */}
          {investments.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={styles.addAnotherButton}
                activeOpacity={0.7}
              >
                <Text style={styles.addAnotherText}>Add Another Investment</Text>
              </TouchableOpacity>

              <Button onPress={handleContinue} variant="primary" style={styles.continueButton}>
                Continue
              </Button>
            </>
          )}
        </View>
      </ScrollView>

      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        roles={['beneficiary']}
        onCreated={(personId) => {
          setFormData(prev => ({
            ...prev,
            beneficiaries: [...prev.beneficiaries, { id: personId, type: 'person' }]
          }));
        }}
      />

      {/* Group Management Drawer */}
      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId) => {
          const group = beneficiaryGroupActions.getGroupById(groupId);
          if (group) {
            const groupSelection: BeneficiaryAssignment = {
              id: group.id,
              type: 'group',
            };
            setFormData(prev => ({
              ...prev,
              beneficiaries: [...prev.beneficiaries, groupSelection]
            }));
          }
          setShowGroupDrawer(false);
        }}
        beneficiaryGroupActions={beneficiaryGroupActions}
        willId={willActions.getUser()?.id || 'default-user'}
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
    right: '20%',
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
  balanceSection: {
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
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  investmentsSection: {
    gap: Spacing.md,
  },
  investmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  investmentsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  investmentsList: {
    gap: Spacing.sm,
  },
  investmentCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  investmentInfo: {
    flex: 1,
    gap: 4,
  },
  investmentProvider: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  investmentType: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  beneficiariesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  beneficiaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  beneficiariesList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  beneficiaryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  investmentValue: {
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
  investmentActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  actionButton: {
    padding: 0,
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
  unknownValueText: {
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
  dialogText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
});
