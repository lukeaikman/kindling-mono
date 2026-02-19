/**
 * Life Insurance Entry Screen
 *
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Navigation: Back → /bequeathal/life-insurance/summary, Save → /bequeathal/life-insurance/summary
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
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, SearchableSelect, Select, RadioGroup, CurrencyInput, DraftBanner, ValidationAttentionButton } from '../../../src/components/ui';
import { AddPersonDialog, PersonSelector, BeneficiaryWithPercentages, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { useDraftAutoSave } from '../../../src/hooks/useDraftAutoSave';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { validatePercentageAllocation } from '../../../src/utils/beneficiaryHelpers';
import { getPersonFullName } from '../../../src/utils/helpers';
import type { LifeInsuranceAsset, BeneficiaryAssignment, PolicyType, PremiumStatus, HeldInTrust } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/life-insurance/summary';

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
  const toast = useNetWealthToast();

  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;

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

  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [addPersonContext, setAddPersonContext] = useState<'lifeAssured' | 'beneficiaries'>('beneficiaries');
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load existing asset data when editing
  const loadedIdRef = useRef<string | null>(null);

  // Draft auto-save — mutable ref so we can update baseline after loading an existing asset
  const initialFormRef = useRef<LifeInsuranceForm>(formData);
  const isFormLoaded = editingAssetId ? loadedIdRef.current === editingAssetId : true;

  const { hasDraft, hasChanges, restoreDraft, discardDraft } = useDraftAutoSave<LifeInsuranceForm>({
    category: 'life-insurance',
    assetId: editingAssetId || null,
    formData,
    isLoaded: isFormLoaded,
    initialData: initialFormRef.current,
  });

  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (hasDraft && !draftRestoredRef.current) {
      const draft = restoreDraft();
      if (draft) {
        setFormData(draft);
        draftRestoredRef.current = true;
        // Prevent the load-from-store effect from overwriting the restored draft
        if (editingAssetId) {
          loadedIdRef.current = editingAssetId;
        }
      }
    }
  }, [hasDraft, restoreDraft, editingAssetId]);

  const handleDiscardDraft = async () => {
    await discardDraft();
    if (editingAssetId) {
      loadedIdRef.current = null;
    } else {
      setFormData(initialFormRef.current);
    }
    draftRestoredRef.current = false;
  };

  const { attentionLabel, triggerValidation } = useFormValidation({
    fields: [
      { key: 'provider', label: 'Provider', isValid: !!formData.provider.trim() },
      { key: 'lifeAssured', label: 'Life assured', isValid: !!formData.lifeAssured },
      { key: 'sumInsured', label: 'Sum insured', isValid: formData.sumInsured > 0 },
      { key: 'policyType', label: 'Policy type', isValid: !!formData.policyType },
      { key: 'heldInTrust', label: 'Held in trust', isValid: !!formData.heldInTrust },
      { key: 'premiumStatus', label: 'Premium status', isValid: !!formData.premiumStatus },
    ],
    scrollViewRef,
  });

  useEffect(() => {
    if (!editingAssetId || loadedIdRef.current === editingAssetId) return;
    loadedIdRef.current = editingAssetId;

    const asset = bequeathalActions.getAssetById(editingAssetId) as LifeInsuranceAsset | undefined;
    if (!asset) {
      router.replace(SUMMARY_ROUTE as any);
      return;
    }

    const loaded: LifeInsuranceForm = {
      provider: asset.provider,
      lifeAssured: asset.lifeAssured,
      sumInsured: asset.sumInsured,
      policyType: asset.policyType,
      heldInTrust: asset.heldInTrust,
      premiumStatus: asset.premiumStatus,
      allocationMode: asset.allocationMode || 'percentage',
      beneficiaries: asset.beneficiaryAssignments?.beneficiaries || [],
    };
    setFormData(loaded);
    initialFormRef.current = loaded;
  }, [editingAssetId]);

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

  const handleSave = () => {
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

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, policyData);
    } else {
      bequeathalActions.addAsset('life-insurance', policyData);
    }

    // Compute delta for net wealth toast (avoids reading stale batched state)
    const oldAssetValue = editingAssetId
      ? (bequeathalActions.getAssetById(editingAssetId)?.estimatedValue || 0)
      : 0;
    toast.notifySave(formData.sumInsured - oldAssetValue);

    // Clear draft on successful save
    discardDraft();

    router.back();
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
          <Text style={styles.headerTitle}>
            {editingAssetId ? 'Edit Policy' : 'Add Policy'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {/* Draft Banner */}
          <DraftBanner
            categoryLabel="life insurance policy"
            isEditing={!!editingAssetId}
            onDiscard={handleDiscardDraft}
            visible={hasDraft}
          />

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add a life insurance policy.'}
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
                  onAddNewPerson={(onCreated) => {
                    setAddPersonContext('beneficiaries');
                    addPersonSelectionRef.current = onCreated || null;
                    setShowAddPersonDialog(true);
                  }}
                  onAddNewGroup={() => setShowGroupDrawer(true)}
                />
              </>
            )}

            {/* Form Button */}
            <View style={styles.formButtons}>
              <Button
                onPress={handleSave}
                variant="primary"
                disabled={!canSubmit}
                style={styles.submitButton}
              >
                {editingAssetId ? 'Save changes' : 'Add this policy'}
              </Button>
              <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        roles={['beneficiary']}
        onCreated={(person) => {
          if (addPersonContext === 'lifeAssured') {
            setFormData(prev => ({ ...prev, lifeAssured: person.id }));
            return;
          }
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

      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId, groupObj) => {
          const group = groupObj ?? beneficiaryGroupActions.getGroupById(groupId);
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
    marginBottom: Spacing.sm,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submitButton: {
    flex: 1,
  },
});
