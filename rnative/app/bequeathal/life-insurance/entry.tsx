/**
 * Life Insurance Entry Screen
 * 
 * Add and manage life insurance policies.
 * Supports percentage and amount allocation modes for beneficiaries.
 * Visual badges for premium status and held in trust status.
 * 
 * Features:
 * - Provider selection (searchable)
 * - Life assured person selector
 * - Policy type, sum insured, held in trust, premium status
 * - Conditional beneficiary allocation (only if held in trust)
 * - Mode toggle: percentage or amount allocation
 * - Visual status badges (green/grey/red/yellow)
 * - Lapsed policy warnings
 * 
 * @module screens/bequeathal/life-insurance/entry
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, SearchableSelect, Select, RadioGroup, CurrencyInput } from '../../../src/components/ui';
import { AddPersonDialog, PersonSelector, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import { validatePercentageAllocation, getBeneficiaryDisplayName } from '../../../src/utils/beneficiaryHelpers';
import { getPersonFullName } from '../../../src/utils/helpers';
import type { LifeInsuranceAsset, BeneficiaryAssignment, PolicyType, PremiumStatus, HeldInTrust } from '../../../src/types';

interface LifeInsuranceForm {
  provider: string;
  lifeAssured: string;
  sumInsured: number;
  policyType: PolicyType | '';
  heldInTrust: HeldInTrust | '';
  premiumStatus: PremiumStatus | '';
  allocationMode: 'percentage' | 'amount';
  beneficiaries: BeneficiaryAssignment[];
}

export default function LifeInsuranceEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  
  const [formData, setFormData] = useState<LifeInsuranceForm>({
    provider: '',
    lifeAssured: '',
    sumInsured: 0,
    policyType: '',
    heldInTrust: '',
    premiumStatus: '',
    allocationMode: 'percentage',
    beneficiaries: [],
  });
  
  const [showForm, setShowForm] = useState(true);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(true);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [addPersonContext, setAddPersonContext] = useState<'lifeAssured' | 'beneficiaries'>('beneficiaries');
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  // Load existing policies
  const policies = bequeathalActions.getAssetsByType('life-insurance') as LifeInsuranceAsset[];
  
  // Hide form initially if policies exist
  useEffect(() => {
    if (policies.length > 0 && showForm && !editingPolicyId) {
      setShowForm(false);
    }
  }, []);

  // Get will-maker ID to exclude
  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  // Provider options (19 UK life insurance providers)
  const providerOptions = [
    { label: 'Legal & General', value: 'Legal & General' },
    { label: 'Aviva', value: 'Aviva' },
    { label: 'AXA', value: 'AXA' },
    { label: 'Prudential', value: 'Prudential' },
    { label: 'Scottish Widows', value: 'Scottish Widows' },
    { label: 'Zurich', value: 'Zurich' },
    { label: 'Royal London', value: 'Royal London' },
    { label: 'Canada Life', value: 'Canada Life' },
    { label: 'Vitality', value: 'Vitality' },
    { label: 'Liverpool Victoria (LV=)', value: 'Liverpool Victoria (LV=)' },
    { label: 'Phoenix Life', value: 'Phoenix Life' },
    { label: 'Guardian Financial Services', value: 'Guardian Financial Services' },
    { label: 'Aegon', value: 'Aegon' },
    { label: 'MetLife', value: 'MetLife' },
    { label: 'Sun Life', value: 'Sun Life' },
    { label: 'Reliance Mutual', value: 'Reliance Mutual' },
    { label: 'Shepherds Friendly', value: 'Shepherds Friendly' },
    { label: 'OneFamily', value: 'OneFamily' },
    { label: 'Other', value: 'Other' },
  ];

  const policyTypeOptions = [
    { label: 'Term Life Insurance', value: 'term' },
    { label: 'Whole Life Insurance', value: 'whole-life' },
  ];

  const heldInTrustOptions = [
    { label: 'Yes - Held in Trust', value: 'yes' },
    { label: 'No - Part of Estate', value: 'no' },
    { label: 'Not Sure', value: 'not-sure' },
  ];

  const premiumStatusOptions = [
    { label: 'Active - Paying Premiums', value: 'active' },
    { label: 'Paid Up - No More Premiums', value: 'paid-up' },
    { label: 'Lapsed - Payments Stopped', value: 'lapsed' },
    { label: 'Suspended - Temporarily Paused', value: 'suspended' },
  ];

  const allocationModeOptions = [
    { label: 'Split by Percentage (%)', value: 'percentage' },
    { label: 'Split by Amount (£)', value: 'amount' },
  ];

  // Show beneficiaries field only if held in trust
  const showBeneficiaries = formData.heldInTrust === 'yes' || formData.heldInTrust === 'not-sure';

  const handleAddPolicy = () => {
    // Validation
    if (!formData.provider.trim() || 
        !formData.lifeAssured || 
        !formData.sumInsured ||
        !formData.policyType ||
        !formData.heldInTrust ||
        !formData.premiumStatus) {
      return;
    }

    // Validate beneficiaries if held in trust
    if (showBeneficiaries) {
      if (formData.beneficiaries.length === 0) return;
      
      if (formData.allocationMode === 'percentage' && 
          !validatePercentageAllocation({ beneficiaries: formData.beneficiaries })) {
        return;
      }
    }

    // Get life assured name for title
    let lifeAssuredName = 'Unknown';
    if (formData.lifeAssured === 'unknown') {
      lifeAssuredName = 'Unknown Person';
    } else {
      const person = personActions.getPersonById(formData.lifeAssured);
      lifeAssuredName = person ? getPersonFullName(person) : 'Unknown';
    }

    const policyData = {
      title: `${formData.provider} - ${lifeAssuredName}`,
      provider: formData.provider.trim(),
      lifeAssured: formData.lifeAssured,
      sumInsured: formData.sumInsured,
      policyType: formData.policyType as PolicyType,
      heldInTrust: formData.heldInTrust as HeldInTrust,
      premiumStatus: formData.premiumStatus as PremiumStatus,
      allocationMode: formData.allocationMode,
      beneficiaryAssignments: showBeneficiaries && formData.beneficiaries.length > 0
        ? {
            beneficiaries: formData.beneficiaries.map(b => ({
              id: b.id,
              type: b.type,
              percentage: formData.allocationMode === 'percentage' ? b.percentage : undefined,
              amount: formData.allocationMode === 'amount' ? b.amount : undefined,
            }))
          }
        : undefined,
      estimatedValue: formData.sumInsured,
      netValue: formData.sumInsured,
    };

    if (editingPolicyId) {
      bequeathalActions.updateAsset(editingPolicyId, policyData);
    } else {
      bequeathalActions.addAsset('life-insurance', policyData);
    }

    // Reset form
    setFormData({
      provider: '',
      lifeAssured: '',
      sumInsured: 0,
      policyType: '',
      heldInTrust: '',
      premiumStatus: '',
      allocationMode: 'percentage',
      beneficiaries: [],
    });
    setEditingPolicyId(null);
    setShowForm(false);
  };

  const handleEditPolicy = (policyId: string) => {
    const policy = bequeathalActions.getAssetById(policyId) as LifeInsuranceAsset;
    if (!policy) return;

    setFormData({
      provider: policy.provider,
      lifeAssured: policy.lifeAssured,
      sumInsured: policy.sumInsured,
      policyType: policy.policyType,
      heldInTrust: policy.heldInTrust,
      premiumStatus: policy.premiumStatus,
      allocationMode: policy.allocationMode || 'percentage',
      beneficiaries: policy.beneficiaryAssignments?.beneficiaries || [],
    });
    setEditingPolicyId(policyId);
    setShowForm(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    Alert.alert(
      'Delete Policy',
      'Are you sure you want to remove this life insurance policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => bequeathalActions.removeAsset(policyId)
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setFormData({
      provider: '',
      lifeAssured: '',
      sumInsured: 0,
      policyType: '',
      heldInTrust: '',
      premiumStatus: '',
      allocationMode: 'percentage',
      beneficiaries: [],
    });
    setEditingPolicyId(null);
    setShowForm(false);
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('life-insurance', selectedCategories);
    router.push(nextRoute);
  };

  // Calculate totals
  const totalValue = policies.reduce((sum, p) => sum + p.sumInsured, 0);
  const activePolicies = policies.filter(p => p.premiumStatus !== 'lapsed');
  const lapsedPolicies = policies.filter(p => p.premiumStatus === 'lapsed');
  const totalActiveValue = activePolicies.reduce((sum, p) => sum + p.sumInsured, 0);
  const totalLapsedValue = lapsedPolicies.reduce((sum, p) => sum + p.sumInsured, 0);

  // Helper: Get premium status badge
  const getPremiumStatusBadge = (status: PremiumStatus) => {
    switch (status) {
      case 'active':
        return { color: KindlingColors.green, text: 'Active', bgColor: `${KindlingColors.green}15` };
      case 'paid-up':
        return { color: KindlingColors.brown, text: 'Paid Up', bgColor: `${KindlingColors.beige}40` };
      case 'lapsed':
        return { color: KindlingColors.destructive, text: '⚠️ Lapsed', bgColor: `${KindlingColors.destructive}15` };
      case 'suspended':
        return { color: '#FFA500', text: 'Suspended', bgColor: '#FFA50015' };
    }
  };

  // Helper: Get held in trust badge
  const getTrustStatusBadge = (heldInTrust: HeldInTrust) => {
    switch (heldInTrust) {
      case 'yes':
        return { color: KindlingColors.green, text: 'In Trust', bgColor: `${KindlingColors.green}15` };
      case 'no':
        return { color: KindlingColors.brown, text: 'Part of Estate', bgColor: `${KindlingColors.beige}40` };
      case 'not-sure':
        return { color: '#FFA500', text: '⚠️ Check Policy', bgColor: '#FFA50015' };
    }
  };

  const canSubmit = formData.provider.trim() &&
    formData.lifeAssured &&
    formData.sumInsured > 0 &&
    formData.policyType &&
    formData.heldInTrust &&
    formData.premiumStatus &&
    (!showBeneficiaries || 
     (formData.beneficiaries.length > 0 && 
      (formData.allocationMode === 'percentage' 
        ? validatePercentageAllocation({ beneficiaries: formData.beneficiaries })
        : true)
     )
    );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="shield-account" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Life Insurance Policies</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {/* Add Policy Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingPolicyId ? 'Edit Policy' : 'Add Life Insurance Policy'}
              </Text>

              {/* Provider */}
              <SearchableSelect
                label="Provider *"
                placeholder="Select provider..."
                value={formData.provider}
                options={providerOptions}
                onChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
              />

              {/* Life Assured */}
              <PersonSelector
                label="Life Assured * (Whose life is insured?)"
                placeholder="Select person"
                value={formData.lifeAssured}
                onChange={(value) => setFormData(prev => ({ ...prev, lifeAssured: value }))}
                personActions={personActions}
                allowUnknown={true}
                excludePersonIds={excludePersonIds}
                onAddNewPerson={() => {
                  setAddPersonContext('lifeAssured');
                  addPersonSelectionRef.current = null;
                  setShowAddPersonDialog(true);
                }}
              />

              {/* Sum Insured */}
              <CurrencyInput
                label="Sum Insured * (Payout Amount)"
                value={formData.sumInsured}
                onValueChange={(value: number) => setFormData(prev => ({ ...prev, sumInsured: value }))}
                placeholder="£0"
              />

              {/* Policy Type */}
              <Select
                label="Policy Type *"
                placeholder="Select type"
                value={formData.policyType}
                options={policyTypeOptions}
                onChange={(value) => setFormData(prev => ({ ...prev, policyType: value as PolicyType }))}
              />

              {/* Held in Trust */}
              <RadioGroup
                label="Held in Trust? *"
                value={formData.heldInTrust}
                onChange={(value) => {
                  const newValue = value as HeldInTrust;
                  setFormData(prev => ({
                    ...prev,
                    heldInTrust: newValue,
                    // Clear beneficiaries if changing to 'no'
                    beneficiaries: newValue === 'no' ? [] : prev.beneficiaries,
                  }));
                }}
                options={heldInTrustOptions}
              />

              {/* Premium Status */}
              <Select
                label="Premium Status *"
                placeholder="Select status"
                value={formData.premiumStatus}
                options={premiumStatusOptions}
                onChange={(value) => setFormData(prev => ({ ...prev, premiumStatus: value as PremiumStatus }))}
              />

              {/* Conditional: Allocation Mode and Beneficiaries (only if held in trust) */}
              {showBeneficiaries && (
                <>
                  {/* Allocation Mode */}
                  <RadioGroup
                    label="How to split the payout?"
                    value={formData.allocationMode}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      allocationMode: value as 'percentage' | 'amount',
                      beneficiaries: []  // Clear beneficiaries when mode changes
                    }))}
                    options={allocationModeOptions}
                  />

                  {/* Beneficiaries */}
                  <BeneficiaryWithPercentages
                    allocationMode={formData.allocationMode}
                    totalValue={formData.sumInsured}
                    value={formData.beneficiaries}
                    onChange={(beneficiaries) => setFormData(prev => ({ ...prev, beneficiaries }))}
                    personActions={personActions}
                    beneficiaryGroupActions={beneficiaryGroupActions}
                    excludePersonIds={excludePersonIds}
                    label="Who will receive the payout? *"
                onAddNewPerson={() => {
                  setAddPersonContext('beneficiaries');
                  addPersonSelectionRef.current = null;
                  setShowAddPersonDialog(true);
                }}
                onAddNewPerson={(onCreated) => {
                  setAddPersonContext('beneficiaries');
                  addPersonSelectionRef.current = onCreated || null;
                  setShowAddPersonDialog(true);
                }}
                    onAddNewGroup={() => setShowGroupDrawer(true)}
                  />
                </>
              )}

              {/* Form Buttons */}
              <View style={styles.formButtons}>
                {editingPolicyId && (
                  <Button
                    onPress={handleCancelEdit}
                    variant="secondary"
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onPress={handleAddPolicy}
                  variant="primary"
                  disabled={!canSubmit}
                  style={styles.submitButton}
                >
                  {editingPolicyId ? 'Update Policy' : 'Add Policy'}
                </Button>
              </View>
            </View>
          )}

          {/* Add Another Policy Button */}
          {!showForm && policies.length > 0 && (
            <Button
              onPress={() => setShowForm(true)}
              variant="secondary"
              icon="plus"
              style={styles.addAnotherButton}
            >
              Add Another Policy
            </Button>
          )}

          {/* Policies List */}
          {policies.length > 0 && (
            <View style={styles.policiesSection}>
              <View style={styles.policiesHeader}>
                <Text style={styles.policiesTitle}>
                  Life Insurance Policies ({policies.length})
                </Text>
                <TouchableOpacity onPress={() => setIsListExpanded(!isListExpanded)}>
                  <IconButton
                    icon={isListExpanded ? 'eye' : 'eye-off'}
                    size={20}
                    iconColor={KindlingColors.brown}
                  />
                </TouchableOpacity>
              </View>

              {isListExpanded && (
                <View style={styles.policiesList}>
                  {policies.map((policy) => {
                    const lifeAssuredName = policy.lifeAssured === 'unknown'
                      ? '🔍 Unknown Person'
                      : personActions.getPersonById(policy.lifeAssured)
                        ? getPersonFullName(personActions.getPersonById(policy.lifeAssured)!)
                        : 'Unknown';
                    
                    const premiumBadge = getPremiumStatusBadge(policy.premiumStatus);
                    const trustBadge = getTrustStatusBadge(policy.heldInTrust);
                    const beneficiaries = policy.beneficiaryAssignments?.beneficiaries || [];

                    return (
                      <View key={policy.id} style={styles.policyCard}>
                        {/* Policy Header */}
                        <View style={styles.policyHeader}>
                          <View style={styles.policyTitleRow}>
                            <Text style={styles.policyProvider}>{policy.provider}</Text>
                            <View style={styles.policyActions}>
                              <TouchableOpacity onPress={() => handleEditPolicy(policy.id)}>
                                <IconButton icon="pencil" size={18} iconColor={KindlingColors.navy} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeletePolicy(policy.id)}>
                                <IconButton icon="delete" size={18} iconColor={KindlingColors.destructive} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.policyLifeAssured}>Life Assured: {lifeAssuredName}</Text>
                        </View>

                        {/* Status Badges */}
                        <View style={styles.badgesRow}>
                          <View style={[styles.badge, { backgroundColor: trustBadge.bgColor }]}>
                            <Text style={[styles.badgeText, { color: trustBadge.color }]}>
                              {trustBadge.text}
                            </Text>
                          </View>
                          <View style={[styles.badge, { backgroundColor: premiumBadge.bgColor }]}>
                            <Text style={[styles.badgeText, { color: premiumBadge.color }]}>
                              {premiumBadge.text}
                            </Text>
                          </View>
                        </View>

                        {/* Lapsed Warning */}
                        {policy.premiumStatus === 'lapsed' && (
                          <View style={styles.lapsedWarning}>
                            <IconButton icon="alert-circle" size={16} iconColor={KindlingColors.destructive} style={styles.warningIcon} />
                            <Text style={styles.warningText}>
                              This policy may not pay out (premiums stopped)
                            </Text>
                          </View>
                        )}

                        {/* Beneficiaries */}
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
                                const allocation = policy.allocationMode === 'percentage'
                                  ? `${b.percentage || 0}%`
                                  : `£${(b.amount || 0).toLocaleString()}`;
                                const value = policy.allocationMode === 'percentage' && policy.sumInsured
                                  ? `(£${Math.round((policy.sumInsured * (b.percentage || 0)) / 100).toLocaleString()})`
                                  : '';
                                
                                return (
                                  <Text key={idx} style={styles.beneficiaryText}>
                                    {displayName} {allocation} {value}
                                    {idx < beneficiaries.length - 1 && ', '}
                                  </Text>
                                );
                              })}
                            </View>
                          </View>
                        )}

                        {/* Sum Insured (PROMINENT - Steve Jobs) */}
                        <Text style={styles.sumInsured}>£{policy.sumInsured.toLocaleString()}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Policies Total */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Policies Total:</Text>
                <Text style={styles.totalValue}>£{totalActiveValue.toLocaleString()}</Text>
              </View>

              {/* Lapsed Policies Warning (Bill Gates Enhancement) */}
              {lapsedPolicies.length > 0 && (
                <View style={styles.lapsedTotalWarning}>
                  <IconButton icon="alert-circle" size={16} iconColor={KindlingColors.destructive} style={styles.warningIcon} />
                  <Text style={styles.lapsedTotalText}>
                    £{totalLapsedValue.toLocaleString()} in lapsed policies (may not pay out)
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Continue Button */}
          {policies.length > 0 && !showForm && (
            <Button onPress={handleContinue} variant="primary" style={styles.continueButton}>
              Continue
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        roles={['beneficiary']}
        onCreated={(personId) => {
          if (addPersonContext === 'lifeAssured') {
            setFormData(prev => ({ ...prev, lifeAssured: personId }));
            return;
          }
          if (addPersonSelectionRef.current) {
            addPersonSelectionRef.current(personId);
            addPersonSelectionRef.current = null;
            return;
          }
          setFormData(prev => ({
            ...prev,
            beneficiaries: [...prev.beneficiaries, { id: personId, type: 'person' }]
          }));
        }}
      />

      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId) => {
          const group = beneficiaryGroupActions.getGroupById(groupId);
          if (group) {
            setFormData(prev => ({
              ...prev,
              beneficiaries: [...prev.beneficiaries, { id: group.id, type: 'group' }]
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
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
    gap: Spacing.lg,
  },
  formCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  addAnotherButton: {
    marginTop: Spacing.sm,
  },
  policiesSection: {
    marginTop: Spacing.md,
  },
  policiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  policiesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  policiesList: {
    gap: Spacing.sm,
  },
  policyCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  policyHeader: {
    gap: Spacing.xs,
  },
  policyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  policyProvider: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  policyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -Spacing.xs,
  },
  policyLifeAssured: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  lapsedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.destructive}10`,
    padding: Spacing.sm,
    borderRadius: 6,
    gap: Spacing.xs,
  },
  warningIcon: {
    margin: 0,
    padding: 0,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.destructive,
    fontWeight: Typography.fontWeight.medium,
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
  sumInsured: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginTop: Spacing.xs,
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.brown,
  },
  totalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
  lapsedTotalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.destructive}10`,
    padding: Spacing.sm,
    borderRadius: 6,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  lapsedTotalText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.destructive,
    fontWeight: Typography.fontWeight.medium,
  },
  continueButton: {
    marginTop: Spacing.md,
  },
  dialogText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
});
