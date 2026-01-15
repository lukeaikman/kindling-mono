/**
 * Pensions Entry Screen
 * 
 * Form for adding and managing pension accounts.
 * Simplified for will creation + visualization (value first, executor details later).
 * Conditional value field based on pension type (annual vs total).
 * 
 * Navigation:
 * - Back: Returns to pensions intro
 * - Continue: Proceeds to next category or order-of-things
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, RadioGroup } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import { validatePercentageAllocation, getBeneficiaryDisplayName } from '../../../src/utils/beneficiaryHelpers';
import type { PensionAsset, PensionType, BeneficiaryAssignment } from '../../../src/types';

interface PensionForm {
  provider: string;
  pensionType: PensionType | '';
  estimatedValue: number;
  beneficiaryNominated: 'yes' | 'no' | 'not-sure' | '';
  beneficiaries: BeneficiaryAssignment[];
}

export default function PensionsEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const [showForm, setShowForm] = useState(true);
  const [showPensionsList, setShowPensionsList] = useState(true);
  const [formData, setFormData] = useState<PensionForm>({
    provider: '',
    pensionType: '',
    estimatedValue: 0,
    beneficiaryNominated: '',
    beneficiaries: [],
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);
  const [editingPensionId, setEditingPensionId] = useState<string | null>(null);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  // Get will-maker ID to exclude from beneficiary selection
  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  // Pension type options
  const pensionTypeOptions = [
    { label: 'Defined Benefit', value: 'defined-benefit' },
    { label: 'Defined Contribution', value: 'defined-contribution' },
    { label: 'SIPP', value: 'sipp' },
    { label: 'Workplace - Type Unsure', value: 'workplace' },
    { label: 'Unsure', value: 'unsure' },
  ];

  // Beneficiary nominated options
  const beneficiaryNominatedOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Not Sure', value: 'not-sure' },
  ];

  // Load existing pensions
  const pensions = bequeathalActions.getAssetsByType('pensions') as PensionAsset[];
  const totalValue = pensions.reduce((sum, pension) => sum + (pension.estimatedValue || 0), 0);
  const unknownValueCount = pensions.filter(p => (p.estimatedValue || 0) === 0).length;

  // Hide form after first pension
  useEffect(() => {
    if (pensions.length === 0) {
      setShowForm(true);
    } else if (pensions.length > 0) {
      setShowForm(false);
    }
  }, []);

  // Determine value field label based on pension type
  const getValueLabel = (): string => {
    if (formData.pensionType === 'defined-benefit') {
      return 'Annual Amount (£/year)';
    }
    return 'Total Value';
  };

  const handleAddPension = () => {
    // Validation
    if (!formData.provider.trim() || !formData.pensionType || !formData.beneficiaryNominated) return;
    
    // If beneficiary nominated = yes, must have beneficiaries with valid percentages
    if (formData.beneficiaryNominated === 'yes') {
      if (formData.beneficiaries.length === 0) return;
      if (!validatePercentageAllocation({ beneficiaries: formData.beneficiaries })) return;
    }

    // Round value to nearest £1
    const estimatedValue = Math.round(balanceNotSure ? 0 : formData.estimatedValue);

    const pensionTypeLabel = pensionTypeOptions.find(opt => opt.value === formData.pensionType)?.label || formData.pensionType;

    const pensionData = {
      title: `${formData.provider} - ${pensionTypeLabel}`,
      provider: formData.provider.trim(),
      pensionType: formData.pensionType,
      beneficiaryNominated: formData.beneficiaryNominated as 'yes' | 'no' | 'not-sure',
      beneficiaryAssignments: formData.beneficiaryNominated === 'yes' && formData.beneficiaries.length > 0
        ? {
            beneficiaries: formData.beneficiaries.map(b => ({
              id: b.id,
              type: b.type,
              percentage: b.percentage,
            }))
          }
        : undefined,
      estimatedValue,
      netValue: estimatedValue,
    };

    if (editingPensionId) {
      bequeathalActions.updateAsset(editingPensionId, pensionData);
      setEditingPensionId(null);
    } else {
      bequeathalActions.addAsset('pensions', pensionData);
    }

    // Reset form
    setFormData({
      provider: '',
      pensionType: '',
      estimatedValue: 0,
      beneficiaryNominated: '',
      beneficiaries: [],
    });
    setBalanceNotSure(false);
    setShowForm(false);
  };

  const handleEditPension = (pensionId: string) => {
    const pension = bequeathalActions.getAssetById(pensionId) as PensionAsset;
    if (!pension) return;

    setFormData({
      provider: pension.provider,
      pensionType: pension.pensionType,
      estimatedValue: pension.estimatedValue || 0,
      beneficiaryNominated: pension.beneficiaryNominated || 'not-sure',
      beneficiaries: pension.beneficiaryAssignments?.beneficiaries || [],
    });
    setEditingPensionId(pensionId);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      provider: '',
      pensionType: '',
      estimatedValue: 0,
      beneficiaryNominated: '',
      beneficiaries: [],
    });
    setBalanceNotSure(false);
    setEditingPensionId(null);
    setShowForm(false);
  };

  const handleRemovePension = (id: string) => {
    bequeathalActions.removeAsset(id);
    if (editingPensionId === id) {
      handleCancelEdit();
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('pensions', selectedCategories);
    router.push(nextRoute);
  };

  const canSubmit = formData.provider.trim() && 
    formData.pensionType && 
    formData.beneficiaryNominated &&
    (formData.beneficiaryNominated !== 'yes' || 
     (formData.beneficiaries.length > 0 && validatePercentageAllocation({ beneficiaries: formData.beneficiaries })));

  // Get display label for pension type
  const getPensionTypeLabel = (type: string): string => {
    const option = pensionTypeOptions.find(opt => opt.value === type);
    return option?.label.split(' (')[0] || type; // Get short name without description
  };

  // Get beneficiary nominated display text
  const getBeneficiaryNominatedText = (status?: string): string => {
    if (status === 'yes') return 'Yes (bypasses estate)';
    if (status === 'no') return 'No (goes to estate)';
    return 'Not Sure';
  };

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
          <Text style={styles.headerTitle}>Enter Pensions</Text>
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
          {/* Add Pension Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingPensionId ? 'Edit Pension' : 'Add Pension'}
              </Text>
              
              <Input
                label="Provider *"
                placeholder="e.g., Scottish Widows, Aviva"
                value={formData.provider}
                onChangeText={(value) => setFormData(prev => ({ ...prev, provider: value }))}
              />

              <Select
                label="Pension Type *"
                placeholder="Select pension type..."
                value={formData.pensionType}
                options={pensionTypeOptions}
                onChange={(value) => setFormData(prev => ({ ...prev, pensionType: value as PensionType }))}
              />

              {/* Conditional Value Field */}
              {formData.pensionType && (
                <View style={styles.balanceSection}>
                  <View style={balanceNotSure && styles.disabledInputContainer}>
                    <CurrencyInput
                      label={getValueLabel()}
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
                    <Text style={styles.checkboxLabel}>Unsure of value</Text>
                  </TouchableOpacity>
                </View>
              )}

              <RadioGroup
                label="Has Beneficiary Been Nominated? *"
                value={formData.beneficiaryNominated}
                onChange={(value) => {
                  const newValue = value as typeof formData.beneficiaryNominated;
                  setFormData(prev => ({ 
                    ...prev, 
                    beneficiaryNominated: newValue,
                    // Clear beneficiaries if changing from Yes to No/Not Sure
                    beneficiaries: newValue === 'yes' ? prev.beneficiaries : []
                  }));
                }}
                options={beneficiaryNominatedOptions}
              />

              {/* Conditional: Show beneficiary percentages if "Yes" selected */}
              {formData.beneficiaryNominated === 'yes' && (
                <BeneficiaryWithPercentages
                  allocationMode="percentage"
                  value={formData.beneficiaries}
                  onChange={(beneficiaries) => setFormData(prev => ({ ...prev, beneficiaries }))}
                  personActions={personActions}
                  beneficiaryGroupActions={beneficiaryGroupActions}
                  excludePersonIds={excludePersonIds}
                  label="Who are the beneficiaries?"
                  onAddNewPerson={() => setShowAddPersonDialog(true)}
                  onAddNewGroup={() => setShowGroupDrawer(true)}
                />
              )}

              <View style={styles.formActions}>
                <Button
                  onPress={handleAddPension}
                  variant="primary"
                  disabled={!canSubmit}
                  style={styles.submitButton}
                >
                  {editingPensionId ? 'Update Pension' : 'Add Pension'}
                </Button>
                
                {editingPensionId && (
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

          {/* Existing Pensions List */}
          {pensions.length > 0 && (
            <View style={styles.pensionsSection}>
              <View style={styles.pensionsHeader}>
                <Text style={styles.pensionsTitle}>
                  Your Pensions ({pensions.length})
                </Text>
                <TouchableOpacity onPress={() => setShowPensionsList(!showPensionsList)}>
                  <IconButton
                    icon={showPensionsList ? 'eye-off' : 'eye'}
                    size={20}
                    iconColor={KindlingColors.brown}
                  />
                </TouchableOpacity>
              </View>

              {showPensionsList && (
                <View style={styles.pensionsList}>
                  {pensions.map((pension) => {
                    const typeLabel = getPensionTypeLabel(pension.pensionType);
                    const valueDisplay = pension.pensionType === 'defined-benefit'
                      ? `£${(pension.estimatedValue || 0).toLocaleString()}/year`
                      : `£${(pension.estimatedValue || 0).toLocaleString()}`;
                    
                    return (
                      <View key={pension.id} style={styles.pensionCard}>
                        <View style={styles.pensionInfo}>
                          <Text style={styles.pensionProvider}>{pension.provider}</Text>
                          <Text style={styles.pensionType}>{typeLabel}</Text>
                          <Text style={styles.beneficiaryStatus}>
                            Beneficiary: {getBeneficiaryNominatedText(pension.beneficiaryNominated)}
                          </Text>
                          
                          {/* Show beneficiary breakdown if nominated = yes AND has beneficiaries */}
                          {pension.beneficiaryNominated === 'yes' && pension.beneficiaryAssignments?.beneficiaries && pension.beneficiaryAssignments.beneficiaries.length > 0 && (
                            <View style={styles.beneficiariesRow}>
                              <Text style={styles.beneficiaryLabel}>For: </Text>
                              <View style={styles.beneficiariesList}>
                                {pension.beneficiaryAssignments.beneficiaries.map((b, idx) => {
                                  const displayName = getBeneficiaryDisplayName(
                                    b,
                                    personActions,
                                    beneficiaryGroupActions
                                  );
                                  const percentage = b.percentage || 0;
                                  const percentageValue = pension.estimatedValue 
                                    ? `£${Math.round((pension.estimatedValue * percentage) / 100).toLocaleString()}`
                                    : '';
                                  
                                  return (
                                    <Text key={idx} style={styles.beneficiaryText}>
                                      {displayName} {percentage}% {percentageValue && `(${percentageValue})`}
                                      {idx < pension.beneficiaryAssignments!.beneficiaries.length - 1 && ', '}
                                    </Text>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                          
                          <Text style={styles.pensionValue}>
                            {(pension.estimatedValue || 0) === 0 ? 'Value not known' : valueDisplay}
                          </Text>
                        </View>
                        
                        <View style={styles.pensionActions}>
                          <TouchableOpacity
                            onPress={() => handleEditPension(pension.id)}
                            style={styles.actionButton}
                          >
                            <IconButton icon="pencil" size={18} iconColor={KindlingColors.navy} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRemovePension(pension.id)}
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
                      Pensions Total: <Text style={styles.totalValue}>£{totalValue.toLocaleString()}</Text>
                    </Text>
                    {unknownValueCount > 0 && (
                      <Text style={styles.unknownValueText}>
                        (+ {unknownValueCount} unknown {unknownValueCount === 1 ? 'value' : 'values'})
                      </Text>
                    )}
                    <Text style={styles.totalNote}>
                      Note: Total includes all pension values. Pensions with nominated beneficiaries may bypass your estate.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons - at bottom of content */}
          {pensions.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={styles.addAnotherButton}
                activeOpacity={0.7}
              >
                <Text style={styles.addAnotherText}>Add Another Pension</Text>
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
  pensionsSection: {
    gap: Spacing.md,
  },
  pensionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  pensionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  pensionsList: {
    gap: Spacing.sm,
  },
  pensionCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pensionInfo: {
    flex: 1,
    gap: 4,
  },
  pensionProvider: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  pensionType: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  beneficiaryStatus: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  pensionValue: {
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
  pensionActions: {
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
  totalNote: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
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
  beneficiariesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 2,
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
  dialogText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
});
