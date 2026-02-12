/**
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Navigation: Back → /bequeathal/investment/summary, Save → /bequeathal/investment/summary
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, ValidationAttentionButton } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../../src/utils/helpers';
import { validatePercentageAllocation, getBeneficiaryDisplayName } from '../../../src/utils/beneficiaryHelpers';
import type { InvestmentAsset, BeneficiaryAssignment } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/investment/summary';

interface InvestmentForm {
  provider: string;
  investmentType: string;
  beneficiaries: BeneficiaryAssignment[];
  estimatedValue: number;
}

export default function InvestmentsEntryScreen() {
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;

  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const toast = useNetWealthToast();
  const [formData, setFormData] = useState<InvestmentForm>({
    provider: '',
    investmentType: '',
    beneficiaries: [],
    estimatedValue: 0,
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
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

  // Get will-maker ID to exclude from beneficiary selection
  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  // Load existing asset for edit mode
  const loadedIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const { attentionLabel, triggerValidation } = useFormValidation({
    fields: [
      { key: 'provider', label: 'Provider', isValid: !!formData.provider.trim() },
      { key: 'beneficiaries', label: 'Beneficiaries', isValid: formData.beneficiaries.length > 0 },
    ],
    scrollViewRef,
  });

  useEffect(() => {
    if (!editingAssetId || loadedIdRef.current === editingAssetId) return;
    loadedIdRef.current = editingAssetId;

    const investment = bequeathalActions.getAssetById(editingAssetId) as InvestmentAsset | undefined;
    if (!investment) {
      router.push(SUMMARY_ROUTE as any);
      return;
    }

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
    setBalanceNotSure((investment.estimatedValue || 0) === 0);
  }, [editingAssetId]);

  const handleBeneficiariesChange = (newBeneficiaries: BeneficiaryAssignment[]) => {
    setFormData(prev => ({ ...prev, beneficiaries: newBeneficiaries }));
  };

  const handleSave = () => {
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

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, investmentData);
    } else {
      bequeathalActions.addAsset('investment', investmentData);
    }

    // Compute delta for net wealth toast (avoids reading stale batched state)
    const oldAssetValue = editingAssetId
      ? (bequeathalActions.getAssetById(editingAssetId)?.estimatedValue || 0)
      : 0;
    toast.notifySave(estimatedValue - oldAssetValue);

    router.push(SUMMARY_ROUTE as any);
  };

  const handleBack = () => {
    router.push(SUMMARY_ROUTE as any);
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
          <Text style={styles.headerTitle}>
            {editingAssetId ? 'Edit Investment' : 'Add Investment'}
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
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add an investment account.'}
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
              onAddNewPerson={(onCreated) => {
                addPersonSelectionRef.current = onCreated || null;
                setShowAddPersonDialog(true);
              }}
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
                onPress={handleSave}
                variant="primary"
                disabled={!canSubmit}
                style={styles.submitButton}
              >
                {editingAssetId ? 'Save changes' : 'Add this investment'}
              </Button>
              <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
            </View>
          </View>
        </View>
      </ScrollView>

      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        roles={['beneficiary']}
        onCreated={(personId) => {
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
  dialogText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
});
