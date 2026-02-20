/**
 * Pensions Entry Screen
 *
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Conditional value field based on pension type (annual vs total).
 *
 * Navigation:
 * - Back: Category Summary (/bequeathal/pensions/summary)
 * - Save: Category Summary (/bequeathal/pensions/summary)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, RadioGroup, ValidationAttentionButton } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { validatePercentageAllocation } from '../../../src/utils/beneficiaryHelpers';
import type { PensionAsset, PensionType, BeneficiaryAssignment } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/pensions/summary';

interface PensionForm {
  provider: string;
  pensionType: PensionType | '';
  estimatedValue: number;
  beneficiaryNominated: 'yes' | 'no' | 'not-sure' | '';
  beneficiaries: BeneficiaryAssignment[];
}

export default function PensionsEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<PensionForm>({
    provider: '',
    pensionType: '',
    estimatedValue: 0,
    beneficiaryNominated: '',
    beneficiaries: [],
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  const { attentionLabel, triggerValidation, showErrors, fieldErrors } = useFormValidation({
    fields: [
      { key: 'provider', label: 'Provider', isValid: !!formData.provider.trim() },
      { key: 'pensionType', label: 'Pension Type', isValid: !!formData.pensionType },
      { key: 'beneficiaryNominated', label: 'Beneficiary Nominated', isValid: !!formData.beneficiaryNominated },
    ],
    scrollViewRef,
  });

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
    if (!asset || asset.type !== 'pensions') {
      router.replace(SUMMARY_ROUTE as any);
      return;
    }

    const pension = asset as PensionAsset;
    loadedIdRef.current = editingAssetId;

    setFormData({
      provider: pension.provider,
      pensionType: pension.pensionType,
      estimatedValue: pension.estimatedValue || 0,
      beneficiaryNominated: pension.beneficiaryNominated || 'not-sure',
      beneficiaries: pension.beneficiaryAssignments?.beneficiaries || [],
    });
    setBalanceNotSure(pension.estimatedValueUnknown === true);
  }, [editingAssetId, bequeathalActions]);

  // Determine value field label based on pension type
  const getValueLabel = (): string => {
    if (formData.pensionType === 'defined-benefit') {
      return 'Annual Amount (£/year)';
    }
    return 'Total Value';
  };

  const handleSave = () => {
    // Validation
    if (!formData.provider.trim() || !formData.pensionType || !formData.beneficiaryNominated) return;

    // If beneficiary nominated = yes, must have beneficiaries with valid percentages
    if (formData.beneficiaryNominated === 'yes') {
      if (formData.beneficiaries.length === 0) return;
      if (!validatePercentageAllocation({ beneficiaries: formData.beneficiaries })) return;
    }

    // Round value to nearest £1 — undefined when unsure (not 0)
    const estimatedValue = balanceNotSure ? undefined : Math.round(formData.estimatedValue);

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
      estimatedValueUnknown: balanceNotSure || undefined,
      netValue: estimatedValue,
    };

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, pensionData);
    } else {
      bequeathalActions.addAsset('pensions', pensionData);
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

  const canSubmit = formData.provider.trim() &&
    formData.pensionType &&
    formData.beneficiaryNominated &&
    (formData.beneficiaryNominated !== 'yes' ||
     (formData.beneficiaries.length > 0 && validatePercentageAllocation({ beneficiaries: formData.beneficiaries })));

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
            {editingAssetId ? 'Edit Pension' : 'Add Pension'}
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
              {editingAssetId ? 'Update the details below.' : 'Add a pension.'}
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
                onAddNewPerson={(onCreated) => {
                  addPersonSelectionRef.current = onCreated || null;
                  setShowAddPersonDialog(true);
                }}
                onAddNewGroup={() => setShowGroupDrawer(true)}
              />
            )}

            <View onTouchEnd={canSubmit ? undefined : triggerValidation}>
              <Button
                onPress={handleSave}
                variant="primary"
                disabled={!canSubmit}
              >
                {editingAssetId ? 'Save changes' : 'Add this pension'}
              </Button>
            </View>
            <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
          </View>
        </View>
      </ScrollView>

      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        roles={['beneficiary']}
        onCreated={(person) => {
          if (addPersonSelectionRef.current) {
            addPersonSelectionRef.current(person.id);
            addPersonSelectionRef.current = null;
            return;
          }
          setFormData(prev => ({
            ...prev,
            beneficiaries: [...prev.beneficiaries, { id: person.id, type: 'person' }]
          }));
        }}
      />

      {/* Group Management Drawer */}
      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId, groupObj) => {
          const group = groupObj ?? beneficiaryGroupActions.getGroupById(groupId);
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
        }}
        beneficiaryGroupActions={beneficiaryGroupActions}
        willId={willActions.getUser()?.id || 'default-user'}
        alreadySelectedGroupIds={formData.beneficiaries.filter(b => b.type === 'group').map(b => b.id)}
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
});
