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
import { Button, BackButton, Select, Input, CurrencyInput, Dialog } from '../../../src/components/ui';
import { MultiBeneficiarySelector, BeneficiarySelection, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../../src/utils/helpers';
import type { InvestmentAsset } from '../../../src/types';

interface InvestmentForm {
  provider: string;
  investmentType: string;
  beneficiary: BeneficiarySelection;
  estimatedValue: number;
}

export default function InvestmentsEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const [showForm, setShowForm] = useState(true);
  const [showInvestmentsList, setShowInvestmentsList] = useState(true);
  const [formData, setFormData] = useState<InvestmentForm>({
    provider: '',
    investmentType: '',
    beneficiary: { id: 'estate', type: 'estate', name: 'The Estate' },
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

  const handleBeneficiaryChange = (newBeneficiary: BeneficiarySelection | BeneficiarySelection[]) => {
    const beneficiary = Array.isArray(newBeneficiary) ? newBeneficiary[0] : newBeneficiary;
    setFormData(prev => ({ ...prev, beneficiary }));
  };

  const handleAddInvestment = () => {
    // Validation
    if (!formData.provider.trim() || !formData.beneficiary.id) return;

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
        beneficiaries: [{
          id: formData.beneficiary.id,
          type: formData.beneficiary.type,
          name: formData.beneficiary.name,
        }]
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
      beneficiary: { id: 'estate', type: 'estate', name: 'The Estate' },
      estimatedValue: 0,
    });
    setBalanceNotSure(false);
    setShowForm(false);
  };

  const handleEditInvestment = (investmentId: string) => {
    const investment = bequeathalActions.getAssetById(investmentId) as InvestmentAsset;
    if (!investment) return;

    // Get first beneficiary (single mode)
    let beneficiary: BeneficiarySelection = { id: 'estate', type: 'estate', name: 'The Estate' };
    
    if (investment.beneficiaryAssignments?.beneficiaries && investment.beneficiaryAssignments.beneficiaries.length > 0) {
      const b = investment.beneficiaryAssignments.beneficiaries[0];
      if (b.type === 'estate') {
        beneficiary = { id: 'estate', type: 'estate', name: 'The Estate' };
      } else if (b.type === 'person') {
        const person = personActions.getPersonById(b.id);
        beneficiary = {
          id: b.id,
          type: 'person',
          name: person ? getPersonFullName(person) : b.name || 'Unknown',
          relationship: person ? getPersonRelationshipDisplay(person) : undefined,
        };
      } else {
        beneficiary = { id: b.id, type: b.type, name: b.name || 'Unknown' };
      }
    }

    setFormData({
      provider: investment.provider,
      investmentType: investment.investmentType || '',
      beneficiary,
      estimatedValue: investment.estimatedValue || 0,
    });
    setEditingInvestmentId(investmentId);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      provider: '',
      investmentType: '',
      beneficiary: { id: 'estate', type: 'estate', name: 'The Estate' },
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

  const canSubmit = formData.provider.trim() && formData.beneficiary.id;

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

              {/* Single Beneficiary Selector */}
              <MultiBeneficiarySelector
                mode="single"
                value={formData.beneficiary}
                onChange={handleBeneficiaryChange}
                allowEstate={true}
                allowGroups={true}
                excludePersonIds={excludePersonIds}
                label="Who will receive this? *"
                placeholder="Select recipient"
                personActions={personActions}
                beneficiaryGroupActions={beneficiaryGroupActions}
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
                          
                          {/* Beneficiary (single) */}
                          {beneficiaries.length > 0 && (
                            <View style={styles.beneficiariesRow}>
                              <Text style={styles.beneficiaryLabel}>For: </Text>
                              <Text style={styles.beneficiaryText}>
                                {(() => {
                                  const b = beneficiaries[0];
                                  if (b.type === 'estate') return 'The Estate';
                                  if (b.type === 'person') {
                                    const person = personActions.getPersonById(b.id);
                                    return person ? `${getPersonFullName(person)} (${getPersonRelationshipDisplay(person)})` : b.name || 'Unknown';
                                  }
                                  return b.name || 'Unknown';
                                })()}
                              </Text>
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

      {/* Add Person Dialog Placeholder */}
      <Dialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        title="Add New Person"
      >
        <Text style={styles.dialogText}>
          Person creation to be implemented. For now, add people from Onboarding screens.
        </Text>
        <Button onPress={() => setShowAddPersonDialog(false)} variant="primary">
          OK
        </Button>
      </Dialog>

      {/* Group Management Drawer */}
      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId) => {
          const group = beneficiaryGroupActions.getGroupById(groupId);
          if (group) {
            const groupSelection: BeneficiarySelection = {
              id: group.id,
              type: 'group',
              name: group.name,
            };
            setFormData(prev => ({
              ...prev,
              beneficiary: groupSelection
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
