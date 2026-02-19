/**
 * Property Trust Details Screen
 * 
 * Shown only when property is trust-owned.
 * Collects trust type, role, and conditional fieldsets based on combination.
 * 
 * Phase 14b: Simplified native spec (better than web prototype)
 * 
 * @module screens/bequeathal/property/trust-details
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Input, Select, RadioGroup, Checkbox, CurrencyInput, PercentageInput, DraftBanner, ValidationAttentionButton } from '../../../src/components/ui';
import { AddPersonDialog, BeneficiaryWithPercentages, MultiBeneficiarySelector, TransferDateValueFields } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { useDraftAutoSave } from '../../../src/hooks/useDraftAutoSave';
import { PropertyAsset } from '../../../src/types';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import {
  TrustData,
  BeneficiaryAssignment,
  TRUST_DATA_DEFAULTS,
  buildTrustEntityData,
  buildPropertyTransferData,
  loadTrustToFormData,
  loadStateArrays,
} from './trustDataMapping';

export default function PropertyTrustDetailsScreen() {
  const { personActions, beneficiaryGroupActions, trustActions, bequeathalActions, willActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const propertyId = params.propertyId as string | undefined;
  const trustId = params.trustId as string | undefined;
  const isSandbox = !propertyId || params.sandbox === 'true';

  // Base trust data
  const [trustData, setTrustData] = useState<TrustData>({ ...TRUST_DATA_DEFAULTS });

  // Remaindermen (for Life Interest Settlor and optional for Life Interest Beneficiary)
  const [remaindermen, setRemaindermen] = useState<BeneficiaryAssignment[]>([]);
  
  // Beneficiaries (for Bare Trust Settlor)
  const [bareBeneficiaries, setBareBeneficiaries] = useState<BeneficiaryAssignment[]>([]);
  
  // Co-beneficiaries (for Bare Trust Beneficiary and Settlor & Beneficiary)
  const [bareCoBeneficiaries, setBareCoBeneficiaries] = useState<BeneficiaryAssignment[]>([]);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const addPersonSelectionRef = useRef<((personId: string) => void) | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Helper text visibility state for remainderman fields
  const [showRemaindermanHelper, setShowRemaindermanHelper] = useState<Record<string, boolean>>({});

  // Contradiction state for LI Settlor 7-year warning
  const [liSettlorDateContradiction, setLiSettlorDateContradiction] = useState(false);

  // Contradiction state for Bare Settlor 7-year warning
  const [bareSettlorDateContradiction, setBareSettlorDateContradiction] = useState(false);

  // Contradiction state for Discretionary Settlor 7-year warning
  const [discSettlorDateContradiction, setDiscSettlorDateContradiction] = useState(false);

  // Contradiction state for Discretionary Beneficiary 7-year warning
  const [discBeneficiaryDateContradiction, setDiscBeneficiaryDateContradiction] = useState(false);

  // Current user person ID (for excluding self from beneficiary selectors)
  const willMaker = willActions.getUser();
  const currentUserPersonId = willMaker?.id || '';

  // Load existing trust data if trustId provided (Rule 4a pattern)
  const loadedTrustIdRef = useRef<string | null>(null);

  // Initial defaults (used by draft auto-save to detect changes)
  const initialTrustData = useRef<TrustData>(trustData).current;
  const isTrustFormLoaded = trustId ? loadedTrustIdRef.current === trustId : true;

  // Draft auto-save
  const { hasDraft: hasTrustDraft, hasChanges: hasTrustChanges, restoreDraft: restoreTrustDraft, discardDraft: discardTrustDraft } = useDraftAutoSave<TrustData>({
    category: 'property-trust',
    assetId: trustId || propertyId || null,
    formData: trustData,
    isLoaded: isTrustFormLoaded,
    initialData: initialTrustData,
  });

  // Auto-restore draft on mount
  const trustDraftRestoredRef = useRef(false);
  useEffect(() => {
    if (hasTrustDraft && !trustDraftRestoredRef.current) {
      const draft = restoreTrustDraft();
      if (draft) {
        setTrustData(draft);
        trustDraftRestoredRef.current = true;
        // Prevent the load-from-store effect from overwriting the restored draft
        if (trustId) {
          loadedTrustIdRef.current = trustId;
        }
      }
    }
  }, [hasTrustDraft, restoreTrustDraft, trustId]);

  const handleDiscardTrustDraft = async () => {
    await discardTrustDraft();
    if (trustId) {
      loadedTrustIdRef.current = null; // Force reload
    } else {
      setTrustData(initialTrustData);
    }
    trustDraftRestoredRef.current = false;
  };

  const { attentionLabel, triggerValidation } = useFormValidation({
    fields: [
      { key: 'trustName', label: 'Trust name', isValid: !!trustData.trustName },
      { key: 'trustType', label: 'Trust type', isValid: !!trustData.trustType },
      { key: 'trustRole', label: 'Trust role', isValid: trustData.trustType === 'other' || !!trustData.trustRole },
    ],
    scrollViewRef,
  });

  useEffect(() => {
    if (!trustId) {
      loadedTrustIdRef.current = null;
      return;
    }
    
    if (loadedTrustIdRef.current === trustId) return;
    
    // Wait for AsyncStorage
    const allTrusts = trustActions.getTrusts();
    if (allTrusts.length === 0) return;
    
    const trust = trustActions.getTrustById(trustId);
    if (!trust) {
      loadedTrustIdRef.current = trustId;
      return;
    }
    
    // Map Trust entity + PropertyAsset → form state using extracted mapping functions
    const property = propertyId ? bequeathalActions.getAssetById(propertyId) as PropertyAsset | undefined : undefined;
    setTrustData(loadTrustToFormData(trust, property));
    
    // Load state arrays (remaindermen, bareBeneficiaries, bareCoBeneficiaries)
    const arrays = loadStateArrays(trust);
    setRemaindermen(arrays.remaindermen);
    setBareBeneficiaries(arrays.bareBeneficiaries);
    setBareCoBeneficiaries(arrays.bareCoBeneficiaries);
    
    loadedTrustIdRef.current = trustId;
  });

  // Auto-set benefitType when role changes for life interest trusts
  useEffect(() => {
    if (trustData.trustType === 'life_interest') {
      if (trustData.trustRole === 'life_interest' && trustData.benefitType !== 'life_interest') {
        setTrustData(prev => ({ ...prev, benefitType: 'life_interest' }));
      } else if (trustData.trustRole === 'remainderman' && trustData.benefitType !== 'remainderman') {
        setTrustData(prev => ({ ...prev, benefitType: 'remainderman' }));
      }
    }
  }, [trustData.trustType, trustData.trustRole, trustData.benefitType]);

  // Helper to update trust data
  const updateTrustData = (field: keyof TrustData, value: any) => {
    setTrustData(prev => ({ ...prev, [field]: value }));
    
    // Clear role when trust type changes
    if (field === 'trustType') {
      setTrustData(prev => ({ ...prev, trustRole: '' }));
    }
  };

  // Get role options based on trust type
  const getRoleOptions = () => {
    const beneficiaryOption = {
      label: 'Beneficiary',
      value: 'beneficiary',
      helperText: 'You can receive benefits but didn\'t create the trust',
    };
    const settlorOption = {
      label: 'Settlor',
      value: 'settlor',
      helperText: 'You created the trust but cannot benefit from it',
    };
    const settlorAndBeneficiaryOption = {
      label: 'Settlor & Beneficiary',
      value: 'settlor_and_beneficiary',
      helperText: 'You created the trust and can benefit from it',
    };

    switch (trustData.trustType) {
      case 'life_interest':
        return [
          {
            label: 'Life interest',
            value: 'life_interest',
            helperText: 'You have the right to income/occupation for life',
          },
          {
            label: 'Remainderman',
            value: 'remainderman',
            helperText: 'You will receive the property when the life tenant dies',
          },
          {
            label: 'Settlor',
            value: 'settlor',
            helperText: 'You created the trust but have no right to benefit',
          },
          {
            label: 'Settlor + A Beneficial Interest',
            value: 'settlor_and_beneficial_interest',
            helperText: 'You created the trust and retained some benefit',
          },
        ];
      case 'bare':
      case 'discretionary':
        return [
          beneficiaryOption,
          settlorOption,
          settlorAndBeneficiaryOption,
        ];
      default:
        return [];
    }
  };

  // Get fieldset key (combination of type + role)
  const getFieldsetKey = () => {
    if (!trustData.trustType || !trustData.trustRole) return '';
    return `${trustData.trustType}_${trustData.trustRole}`;
  };

  // Render appropriate fieldset based on type + role combination
  const renderFieldset = () => {
    const fieldsetKey = getFieldsetKey();
    
    // For now, just show placeholder for each combination
    // Will be implemented in Tasks 14b.2-14b.5
    switch (fieldsetKey) {
      case 'life_interest_life_interest':
        return renderLifeInterestBeneficiaryFieldset();
      case 'life_interest_remainderman':
        return renderLifeInterestBeneficiaryFieldset();
      case 'life_interest_settlor':
        return renderLifeInterestSettlorFieldset();
      case 'life_interest_settlor_and_beneficial_interest':
        return renderLifeInterestSettlorAndBeneficialInterestFieldset();
      case 'life_interest_beneficiary':
        // Legacy case - keep for backwards compatibility
        return renderLifeInterestBeneficiaryFieldset();
      case 'bare_settlor':
        return renderBareSettlorFieldset();
      case 'bare_beneficiary':
        return renderBareBeneficiaryFieldset();
      case 'bare_settlor_and_beneficiary':
        return renderBareSettlorAndBeneficiaryFieldset();
      case 'discretionary_settlor':
        return renderDiscretionarySettlorFieldset();
      case 'discretionary_beneficiary':
        return renderDiscretionaryBeneficiaryFieldset();
      case 'discretionary_settlor_and_beneficiary':
        return renderDiscretionarySettlorAndBeneficiaryFieldset();
      default:
        return null;
    }
  };

  // Life Interest Trust → Settlor Fieldset
  const renderLifeInterestSettlorFieldset = () => {
    // Calculate if transfer is within 7 years (for taper relief display)
    const transferDate = trustData.settlorTransferMonth && trustData.settlorTransferYear
      ? new Date(parseInt(trustData.settlorTransferYear), parseInt(trustData.settlorTransferMonth) - 1)
      : null;
    
    const now = new Date();
    const yearsElapsed = transferDate 
      ? (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      : 0;
    
    // Calculate taper relief
    const calculateTaperRelief = () => {
      if (!transferDate || !trustData.settlorTransferValue) return null;
      
      const yearsRemaining = Math.max(0, 7 - yearsElapsed);
      const monthsRemaining = Math.floor((yearsRemaining % 1) * 12);
      const fullYearsRemaining = Math.floor(yearsRemaining);
      
      // Taper relief rates (3-7 years)
      const getTaperRate = (years: number) => {
        if (years >= 7) return 0;
        if (years >= 6) return 20;
        if (years >= 5) return 40;
        if (years >= 4) return 60;
        if (years >= 3) return 80;
        return 100; // Less than 3 years = full rate
      };
      
      const currentRate = getTaperRate(yearsElapsed);
      const nilRateBand = 325000; // 2024/25 nil rate band
      const transferAmount = trustData.settlorTransferValue;
      
      // Calculate tax liability
      const taxableAmount = Math.max(0, transferAmount - nilRateBand);
      const taxLiability = (taxableAmount * 0.4 * currentRate) / 100;
      
      return {
        taxLiability: Math.round(taxLiability),
        currentRate,
        yearsRemaining: fullYearsRemaining,
        monthsRemaining,
        transferAmount
      };
    };
    
    const taperInfo = calculateTaperRelief();
    
    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          As the settlor who created this trust without retaining any benefit, we need to understand the inheritance tax implications.
        </Text>

        {/* 1. Seven Year Gateway Question */}
        <RadioGroup
          label="Did you transfer this property into the trust within the last 7 years? *"
          value={trustData.settlorTransferWithin7Years}
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ]}
          onChange={(value) => {
            updateTrustData('settlorTransferWithin7Years', value);
            // Clear conditional fields if switching to 'no'
            if (value === 'no') {
              updateTrustData('settlorTransferMonth', '');
              updateTrustData('settlorTransferYear', '');
              updateTrustData('settlorTransferValue', 0);
            }
          }}
        />

        {/* 1a. Success Message if NO */}
        {trustData.settlorTransferWithin7Years === 'no' && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>✅ Excellent - this transfer is fully exempt from inheritance tax</Text>
            <Text style={styles.successText}>
              As more than 7 years have passed, this gift no longer affects your estate.
            </Text>
          </View>
        )}

        {/* Conditional fields if YES */}
        {trustData.settlorTransferWithin7Years === 'yes' && (
          <>
            {/* 2. Transfer Date + 3. Transfer Value */}
            <TransferDateValueFields
              dateLabel="Approximately when did you transfer it? *"
              month={trustData.settlorTransferMonth}
              year={trustData.settlorTransferYear}
              onMonthChange={(v) => updateTrustData('settlorTransferMonth', v)}
              onYearChange={(v) => updateTrustData('settlorTransferYear', v)}
              yearRange={8}
              showDateUnknown
              dateUnknown={trustData.lifeInterestDateUnknown}
              onDateUnknownChange={(v) => {
                updateTrustData('lifeInterestDateUnknown', v);
                if (v) {
                  updateTrustData('settlorTransferMonth', '');
                  updateTrustData('settlorTransferYear', '');
                }
              }}
              showContradictionWarning
              onContradiction={setLiSettlorDateContradiction}
              valueLabel="What was the approximate value at transfer? *"
              value={trustData.settlorTransferValue}
              onValueChange={(v) => updateTrustData('settlorTransferValue', v)}
              showValueUnknown
              valueUnknown={trustData.lifeInterestValueUnknown}
              onValueUnknownChange={(v) => {
                updateTrustData('lifeInterestValueUnknown', v);
                if (v) updateTrustData('settlorTransferValue', 0);
              }}
            />

            {/* 4. No Benefit Confirmation */}
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.fieldLabel}>Important declaration *</Text>
              <Checkbox
                label="I confirm I cannot benefit from this trust in any way"
                checked={trustData.settlorNoBenefitConfirmed}
                onCheckedChange={(value) => updateTrustData('settlorNoBenefitConfirmed', value)}
              />
              {!trustData.settlorNoBenefitConfirmed && (
                <Text style={[styles.helperText, { marginTop: Spacing.xs }]}>
                  If you have some benefit from this trust, please select the role "Settlor + A Beneficial Interest" above.
                </Text>
              )}
            </View>

            {/* 5. Taper Relief Display - Only show after confirmation */}
            {trustData.settlorNoBenefitConfirmed && taperInfo && taperInfo.taxLiability > 0 && (
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>📊 Taper Relief Calculation</Text>
                <Text style={styles.infoText}>
                  If you died today, £{taperInfo.taxLiability.toLocaleString()} would be due from your estate ({taperInfo.currentRate}% rate).
                  {taperInfo.yearsRemaining > 0 && (
                    <> However, if you survive another {taperInfo.yearsRemaining} year{taperInfo.yearsRemaining !== 1 ? 's' : ''}{taperInfo.monthsRemaining > 0 ? ` and ${taperInfo.monthsRemaining} month${taperInfo.monthsRemaining !== 1 ? 's' : ''}` : ''}, the tax liability will reduce to £0 (fully exempt).</>
                  )}
                </Text>
              </View>
            )}

            {trustData.settlorNoBenefitConfirmed && taperInfo && taperInfo.taxLiability === 0 && yearsElapsed < 7 && (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✅ No immediate tax liability</Text>
                <Text style={styles.successText}>
                  The transfer value is within the nil rate band. However, if you survive another {taperInfo.yearsRemaining} year{taperInfo.yearsRemaining !== 1 ? 's' : ''}{taperInfo.monthsRemaining > 0 ? ` and ${taperInfo.monthsRemaining} month${taperInfo.monthsRemaining !== 1 ? 's' : ''}` : ''}, this gift will be fully exempt from your estate.
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // Life Interest Trust → Settlor + A Beneficial Interest Fieldset
  const renderLifeInterestSettlorAndBeneficialInterestFieldset = () => {
    // Get property value for IHT calculation
    const propertyAsset = propertyId ? bequeathalActions.getAssetById(propertyId) as PropertyAsset | undefined : undefined;
    const propertyValue = propertyAsset?.estimatedValue || 0;
    
    // Calculate IHT liability (40% of value above nil rate band)
    const nilRateBand = 325000; // 2024/25 nil rate band
    const taxableAmount = Math.max(0, propertyValue - nilRateBand);
    const ihtLiability = Math.round(taxableAmount * 0.4);
    
    // TODO: Check calculation later - potential IHT saving needs proper calculation based on alternative structures
    const potentialIhtSaving = Math.round(ihtLiability * 0.5); // Placeholder - 50% of current liability as example
    
    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          As the settlor who created this trust and retained a beneficial interest, we need to understand the structure and tax implications.
        </Text>

        {/* 1. Nature of Benefit */}
        <RadioGroup
          label="What type of benefit do you have from this trust? *"
          value={trustData.settlorAndBeneficialBenefitType}
          options={[
            { label: 'Life interest (right to live there/receive income for life)', value: 'life_interest' },
            { label: 'Right to occupy the property', value: 'right_to_occupy' },
            { label: 'Right to income only', value: 'right_to_income' },
            { label: 'Discretionary beneficiary (trustees can choose to benefit me)', value: 'discretionary' },
            { label: 'Other arrangement', value: 'other' },
          ]}
          onChange={(value) => updateTrustData('settlorAndBeneficialBenefitType', value)}
        />

        {/* 2. Failed Transfer Notification - Show after field 1 is selected */}
        {trustData.settlorAndBeneficialBenefitType && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Gift with Reservation - No Tax Savings Achieved</Text>
            <Text style={styles.warningText}>
              Because you can benefit from this trust, the property remains in your estate for inheritance tax purposes.
            </Text>
            <Text style={[styles.warningText, { marginTop: Spacing.xs }]}>
              Current value in your estate: £{propertyValue > 0 ? propertyValue.toLocaleString() : '[property value not available]'}
            </Text>
            <Text style={[styles.warningText, { marginTop: Spacing.xs }]}>
              Estimated IHT liability: £{propertyValue > 0 ? ihtLiability.toLocaleString() : '[calculation requires property value]'}
            </Text>
            <Text style={[styles.warningText, { marginTop: Spacing.sm, fontWeight: '600' }]}>
              This means:
            </Text>
            <Text style={[styles.warningText, { marginTop: Spacing.xs }]}>
              • No 7-year exemption available
            </Text>
            <Text style={styles.warningText}>
              • Property fully taxable on death
            </Text>
            <Text style={styles.warningText}>
              • Common issue with DIY estate planning
            </Text>
            <Text style={[styles.warningText, { marginTop: Spacing.sm, fontWeight: '600' }]}>
              The good news: Alternative structures exist that could save significant tax while achieving your goals.
            </Text>
          </View>
        )}

        {/* 3. Professional Review Option - Show after field 1 is selected */}
        {trustData.settlorAndBeneficialBenefitType && (
          <View style={{ marginTop: Spacing.md }}>
            <Checkbox
              label={`Yes, have your team reach out about restructuring options that could save £${propertyValue > 0 ? potentialIhtSaving.toLocaleString() : '[calculation pending]'}`}
              checked={trustData.settlorAndBeneficialWantsReview}
              onCheckedChange={(value) => {
                updateTrustData('settlorAndBeneficialWantsReview', value);
                // TODO: If value is true, create backend task for team to reach out about restructuring options
                // Task should include: trust ID, property ID, benefit type, current IHT liability, potential savings
              }}
            />
            {/* TODO: Check calculation later - potential IHT saving needs proper calculation based on alternative structures */}
          </View>
        )}
      </View>
    );
  };

  const renderLifeInterestBeneficiaryFieldset = () => {
    // Determine which path based on role (benefitType is auto-set by useEffect)
    const isLifeInterest = trustData.trustRole === 'life_interest' || trustData.benefitType === 'life_interest';
    const isRemainderman = trustData.trustRole === 'remainderman' || trustData.benefitType === 'remainderman';

    return (
      <View style={styles.fieldsetContent}>
        {/* Life Interest Path - New Spec Implementation */}
        {isLifeInterest && (
          <>
            {/* 0. Trust Creation Date */}
            <RadioGroup
              label="When was this trust created? *"
              value={trustData.lifeInterestTrustCreationDate}
              options={[
                { label: 'Before 22 March 2006', value: 'before_2006' },
                { label: 'On or after 22 March 2006', value: 'on_or_after_2006' },
              ]}
              onChange={(value) => updateTrustData('lifeInterestTrustCreationDate', value)}
            />
            {/* <Text style={styles.helperText}>
              Determines if this is a qualifying Interest in Possession (IIP) for IHT purposes. Pre-2006 trusts are automatically qualifying.
            </Text> */}

            {/* 0a. IPDI Check (Conditional - only if post-2006) */}
            {trustData.lifeInterestTrustCreationDate === 'on_or_after_2006' && (
              <>
                <RadioGroup
                  label="Was this trust created by someone's will (Immediate Post-Death Interest)? *"
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                  ]}
                  value={trustData.lifeInterestIsIPDI}
                  onChange={(value) => updateTrustData('lifeInterestIsIPDI', value)}
                />
                {/* <Text style={styles.helperText}>
                  IPDIs are qualifying IIPs even if post-2006. This changes IHT treatment from £0 to full property value in estate.
                </Text> */}
              </>
            )}

            {/* 1. Spouse Succession Rights */}
            <RadioGroup
              label="Can your spouse/civil partner succeed to your life interest? *"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={trustData.lifeInterestSpouseSuccession}
              onChange={(value) => updateTrustData('lifeInterestSpouseSuccession', value)}
            />
            {/* <Text style={styles.helperText}>
              Affects spouse exemption planning. If yes, potential IHT saving through spouse exemption on first death.
            </Text> */}

            {/* 2. Life Interest Sharing */}
            <RadioGroup
              label="Is your life interest shared? *"
              value={trustData.lifeInterestSharing}
              options={[
                { 
                  label: 'Not shared', 
                  value: 'not_shared',
                  helperText: 'I have sole life interest'
                },
                { 
                  label: 'Shared equally with others', 
                  value: 'shared_equally',
                  helperText: 'Equal division among all life interest holders'
                },
                { 
                  label: 'Shared unequally with others', 
                  value: 'shared_unequally',
                  helperText: 'Different percentages for each holder'
                },
                { 
                  label: 'Successive', 
                  value: 'successive',
                  helperText: 'I have rights after someone else dies'
                },
              ]}
              onChange={(value) => updateTrustData('lifeInterestSharing', value)}
            />
            {/* <Text style={styles.helperText}>
              Determines how to calculate your proportionate share for IHT purposes.
            </Text> */}

            {/* 2a. Equal Sharing Details (Conditional) */}
            {trustData.lifeInterestSharing === 'shared_equally' && (
              <>
                <Select
                  label="Shared equally with how many people (including you)? *"
                  placeholder="Select number..."
                  value={trustData.lifeInterestEqualSharingCount > 0 ? trustData.lifeInterestEqualSharingCount.toString() : ''}
                  options={[
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                    { label: '5', value: '5' },
                    { label: '6', value: '6' },
                    { label: '7', value: '7' },
                    { label: '8', value: '8' },
                    { label: '9', value: '9' },
                    { label: '10+', value: '10' },
                  ]}
                  onChange={(value) => updateTrustData('lifeInterestEqualSharingCount', parseInt(value) || 0)}
                />
                {/* <Text style={styles.helperText}>
                  Your share: {trustData.lifeInterestEqualSharingCount > 0 ? (100 / trustData.lifeInterestEqualSharingCount).toFixed(1) : '0'}%
                </Text> */}
              </>
            )}

            {/* 2b. Unequal Sharing Details (Conditional) */}
            {trustData.lifeInterestSharing === 'shared_unequally' && (
              <>
                <PercentageInput
                  label="What is your percentage share? *"
                  placeholder="Enter percentage..."
                  value={trustData.lifeInterestUnequalSharingPercentage}
                  onValueChange={(value) => updateTrustData('lifeInterestUnequalSharingPercentage', value)}
                />
                {/* <Text style={styles.helperText}>
                  Precise calculation needed for IHT liability on your specific share.
                </Text> */}
              </>
            )}

            {/* 2c. Successive Interest Details (Conditional) */}
            {trustData.lifeInterestSharing === 'successive' && (
              <>
                <Input
                  label="Who currently has the life interest before you? *"
                  placeholder="e.g., My mother, My spouse"
                  value={trustData.lifeInterestSuccessiveCurrentTenant}
                  onChangeText={(value) => updateTrustData('lifeInterestSuccessiveCurrentTenant', value)}
                />
                <Select
                  label="Is this person still alive? *"
                  placeholder="Select status..."
                  value={trustData.lifeInterestSuccessiveCurrentStatus}
                  options={[
                    { label: 'Yes - my interest hasn\'t started yet', value: 'not_started' },
                    { label: 'No - I now have the active life interest', value: 'active' },
                    { label: 'Not sure', value: 'not_sure' },
                  ]}
                  onChange={(value) => updateTrustData('lifeInterestSuccessiveCurrentStatus', value)}
                />
                {/* <Text style={styles.helperText}>
                  If current life tenant is alive, your interest is not yet active. If deceased, you have active life interest with full IHT implications.
                </Text> */}
              </>
            )}

            {/* 4. Conditional Explainer (shows when all fields filled) */}
            {(() => {
              // Check if all required fields are filled
              const allFieldsFilled = 
                trustData.lifeInterestTrustCreationDate &&
                trustData.lifeInterestSpouseSuccession &&
                trustData.lifeInterestSharing &&
                (trustData.lifeInterestTrustCreationDate !== 'on_or_after_2006' || trustData.lifeInterestIsIPDI) &&
                (trustData.lifeInterestSharing === 'not_shared' ||
                 (trustData.lifeInterestSharing === 'shared_equally' && trustData.lifeInterestEqualSharingCount >= 2) ||
                 (trustData.lifeInterestSharing === 'shared_unequally' && trustData.lifeInterestUnequalSharingPercentage > 0 && trustData.lifeInterestUnequalSharingPercentage < 100) ||
                 (trustData.lifeInterestSharing === 'successive' && trustData.lifeInterestSuccessiveCurrentTenant && trustData.lifeInterestSuccessiveCurrentStatus));

              if (!allFieldsFilled) return null;

              // Simple variables for switch statement
              const trustDate = trustData.lifeInterestTrustCreationDate;
              const isIPDI = trustData.lifeInterestIsIPDI === 'yes';
              const shareType = trustData.lifeInterestSharing;
              const spouseCanSucceed = trustData.lifeInterestSpouseSuccession === 'yes';
              const currentTenantAlive = trustData.lifeInterestSuccessiveCurrentStatus;
              const currentTenant = trustData.lifeInterestSuccessiveCurrentTenant;
              
              // Get current property value from property asset
              let propertyValue = 0;
              let hasPropertyValue = false;
              if (propertyId) {
                const property = bequeathalActions.getAssetById(propertyId) as PropertyAsset | undefined;
                if (property?.estimatedValue) {
                  propertyValue = property.estimatedValue;
                  hasPropertyValue = true;
                }
              }
              
              // Check if qualifying IIP
              const isQualifying = trustDate === 'before_2006' || (trustDate === 'on_or_after_2006' && isIPDI);
              
              // Initialize result
              let icon = '';
              let taxStatus = '';
              let yourRights = '';
              
              // Handle successive interests first (before qualifying check)
              if (shareType === 'successive') {
                if (currentTenantAlive === 'not_started') {
                  icon = '⏳';
                  taxStatus = `Not yet active - your interest begins when ${currentTenant} dies`;
                  yourRights = "You'll receive the life interest in future. No current tax impact or rights to the property.";
                  return (
                    <View style={styles.explainerBox}>
                      <Text style={styles.explainerText}>
                        {icon} <Text style={styles.explainerLabel}>Tax Status: </Text>
                        {taxStatus}
                      </Text>
                      <Text style={styles.explainerText}>
                        <Text style={styles.explainerLabel}>Your Rights: </Text>
                        {yourRights}
                      </Text>
                    </View>
                  );
                }
                if (currentTenantAlive === 'not_sure') {
                  icon = '❓';
                  taxStatus = `Unclear status - verify if ${currentTenant} is still alive`;
                  yourRights = "If they're alive, you have no current rights. If they've died, you may have an active life interest.";
                  return (
                    <View style={styles.explainerBox}>
                      <Text style={styles.explainerText}>
                        {icon} <Text style={styles.explainerLabel}>Tax Status: </Text>
                        {taxStatus}
                      </Text>
                      <Text style={styles.explainerText}>
                        <Text style={styles.explainerLabel}>Your Rights: </Text>
                        {yourRights}
                      </Text>
                    </View>
                  );
                }
                // If active, continue to qualifying logic below
              }
              
              // Handle non-qualifying (post-2006 non-IPDI)
              if (!isQualifying) {
                icon = '✅';
                taxStatus = "No inheritance tax impact - this property doesn't count in your estate";
                yourRights = "You have the right to income or occupation for life, but this ends when you die and cannot be passed in your will.";
              } else {
                // Qualifying IIP - calculate share value
                if (!hasPropertyValue) {
                  // Fallback when property value not available
                  let sharePercentage = 100;
                  
                  switch (shareType) {
                    case 'shared_equally':
                      sharePercentage = 100 / trustData.lifeInterestEqualSharingCount;
                      break;
                    case 'shared_unequally':
                      sharePercentage = trustData.lifeInterestUnequalSharingPercentage;
                      break;
                    case 'not_shared':
                    case 'successive':
                      sharePercentage = 100;
                      break;
                  }
                  
                  icon = '⚠️';
                  taxStatus = `There will be inheritance tax liability on your ${sharePercentage === 100 ? 'full' : `${sharePercentage.toFixed(1)}%`} share of the property's current value.`;
                  yourRights = "IHT will be calculated as: current property value × your share percentage. Please provide the current property value for an accurate calculation.";
                } else {
                  // Calculate share value with available property value
                  let shareValue = propertyValue;
                  let shareText = '';
                  
                  switch (shareType) {
                    case 'shared_equally':
                      const percent = 100 / trustData.lifeInterestEqualSharingCount;
                      shareValue = propertyValue * (percent / 100);
                      shareText = ` (your ${percent.toFixed(1)}% share)`;
                      break;
                    case 'shared_unequally':
                      shareValue = propertyValue * (trustData.lifeInterestUnequalSharingPercentage / 100);
                      shareText = ` (your ${trustData.lifeInterestUnequalSharingPercentage}% share)`;
                      break;
                    case 'not_shared':
                    case 'successive':
                      // Full value
                      break;
                  }
                  
                  // Format currency
                  const formattedValue = new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    maximumFractionDigits: 0
                  }).format(shareValue);
                  
                  icon = '⚠️';
                  taxStatus = `${formattedValue} counts in your estate for inheritance tax${shareText}`;
                  
                  // Build yourRights based on spouse and sharing
                  if (spouseCanSucceed && shareType === 'not_shared') {
                    yourRights = "Your spouse can take over this interest when you die, potentially saving tax through spouse exemption.";
                  } else if (shareType !== 'not_shared') {
                    yourRights = "You share the income/occupation rights with others. Your interest ends at death and cannot be passed in your will.";
                  } else {
                    yourRights = "You have income/occupation for life. This ends when you die and cannot be passed in your will.";
                  }
                }
              }

              return (
                <View style={styles.explainerBox}>
                  <Text style={styles.explainerText}>
                    {icon} <Text style={styles.explainerLabel}>Tax Status: </Text>
                    {taxStatus}
                  </Text>
                  <View style={styles.explainerSpacer} />
                  <Text style={styles.explainerText}>
                    <Text style={styles.explainerLabel}>Your Rights: </Text>
                    {yourRights}
                  </Text>
                </View>
              );
            })()}
          </>
        )}

        {/* Remainderman Path - New Spec Implementation */}
        {isRemainderman && (() => {
          // Helper function to render label with ? icon
          const renderLabelWithHelp = (label: string, helperKey: string, helperText: string) => (
            <View style={styles.labelWithHelpContainer}>
              <Text style={[styles.fieldLabel, styles.fieldLabelInRow]}>{label}</Text>
              <TouchableOpacity
                onPress={() => setShowRemaindermanHelper(prev => ({ ...prev, [helperKey]: !prev[helperKey] }))}
                style={styles.helpIconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconButton
                  icon="help-circle-outline"
                  size={18}
                  iconColor={KindlingColors.brown}
                  style={styles.helpIcon}
                />
              </TouchableOpacity>
            </View>
          );
          
          // Calculate if transfer was within 7 years
          const isWithin7Years = (() => {
            if (!trustData.remaindermanTransferMonth || !trustData.remaindermanTransferYear) return false;
            const transferDate = new Date(
              parseInt(trustData.remaindermanTransferYear),
              parseInt(trustData.remaindermanTransferMonth) - 1
            );
            const now = new Date();
            const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            return yearsDiff < 7;
          })();
          
          return (
            <>
              {/* 1. Life Tenant Status */}
              <RadioGroup
                label="Is the life tenant (person with current rights) still alive? *"
                value={trustData.remaindermanLifeTenantAlive}
                options={[
                  { label: "Yes, they're still alive", value: 'yes' },
                  { label: "No, they've passed away", value: 'no' },
                  { label: 'Not sure', value: 'not_sure' },
                ]}
                onChange={(value) => updateTrustData('remaindermanLifeTenantAlive', value)}
              />
              
              {/* 1a. Ownership Clarification (Conditional) */}
              {trustData.remaindermanLifeTenantAlive === 'no' && (
                <>
                  <RadioGroup
                    label="What is your current position? *"
                    value={trustData.remaindermanOwnershipClarification}
                    options={[
                      { label: "I now own this property", value: 'now_own' },
                      { label: "I'm not sure where I stand", value: 'not_sure' },
                    ]}
                    onChange={(value) => {
                      updateTrustData('remaindermanOwnershipClarification', value);
                    }}
                  />
                  
                  {/* Message for "I now own this property" */}
                  {trustData.remaindermanOwnershipClarification === 'now_own' && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        You'll be redirected to the property form with the ownership status amended to 'owner'
                      </Text>
                      <Button
                        onPress={() => {
                          if (propertyId) {
                            router.push(`/bequeathal/property/entry?propertyId=${propertyId}&updateOwnership=owner`);
                          }
                        }}
                        style={styles.messageButton}
                      >
                        Next
                      </Button>
                    </View>
                  )}
                  
                  {/* Message for "Not sure" */}
                  {trustData.remaindermanOwnershipClarification === 'not_sure' && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        Our team will reach out to help clarify your position
                      </Text>
                      {/* TODO: Create admin task for team follow-up on unclear remainder status */}
                    </View>
                  )}
                </>
              )}
              
              {/* 2. Life Tenant's Age (Conditional) - Only show if life tenant is alive */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (
                <>
                  {renderLabelWithHelp(
                    "Approximately how old is the life tenant? *",
                    'lifeTenantAge',
                    "Essential for calculating actuarial value of remainder interest using HMRC tables. Younger life tenant = lower current value of remainder."
                  )}
                  {showRemaindermanHelper.lifeTenantAge && (
                    <Text style={styles.helperText}>
                      Essential for calculating actuarial value of remainder interest using HMRC tables. Younger life tenant = lower current value of remainder.
                    </Text>
                  )}
                  <View style={{ marginBottom: Spacing.sm }}>
                    <Input
                      placeholder="Enter age..."
                      value={trustData.remaindermanLifeTenantAge > 0 ? trustData.remaindermanLifeTenantAge.toString() : ''}
                      onChangeText={(value) => {
                        // Allow empty string
                        if (value === '') {
                          updateTrustData('remaindermanLifeTenantAge', 0);
                          return;
                        }
                        
                        // Only allow numeric input
                        if (!/^\d+$/.test(value)) {
                          return; // Don't update if non-numeric
                        }
                        
                        const num = parseInt(value, 10);
                        
                        // Allow typing any number while typing (0-999), validation happens on blur
                        // This allows user to type "1", "12", "123" etc. while typing
                        if (!isNaN(num) && num >= 0 && num <= 999) {
                          updateTrustData('remaindermanLifeTenantAge', num);
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur - clamp to valid range
                        const age = trustData.remaindermanLifeTenantAge;
                        if (age > 0 && age < 18) {
                          updateTrustData('remaindermanLifeTenantAge', 0); // Clear if too low
                        } else if (age > 110) {
                          updateTrustData('remaindermanLifeTenantAge', 110); // Clamp to max
                        }
                      }}
                      type="number"
                      rightIcon=""
                      style={{ marginTop: 0, marginVertical: 0 }}
                    />
                  </View>
                </>
              )}
              
              {/* 2b. 7-Year Gateway Question - Only show if life tenant is alive */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (
                <RadioGroup
                  label="Was this property transferred into the trust within the last 7 years? *"
                  value={trustData.remaindermanTransferWithin7Years}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No, more than 7 years ago', value: 'no' },
                    { label: "I'm not sure", value: 'not_sure' },
                  ]}
                  onChange={(value) => updateTrustData('remaindermanTransferWithin7Years', value)}
                />
              )}

              {/* 2c. Success message if > 7 years */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && trustData.remaindermanTransferWithin7Years === 'no' && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    ✓ Transfer fully exempt — no IHT impact
                  </Text>
                </View>
              )}

              {/* 3. Property Transfer Date - Only show if life tenant is alive and gateway is 'yes' or 'not_sure' */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (trustData.remaindermanTransferWithin7Years === 'yes' || trustData.remaindermanTransferWithin7Years === 'not_sure') && (
                <>
                  {renderLabelWithHelp(
                "Approximately when was this property transferred into the trust? *",
                'transferDate',
                "Determines if transfer was within 7 years. If settlor dies within 7 years, remainder beneficiaries may face IHT liability on failed PET."
              )}
              {showRemaindermanHelper.transferDate && (
                <Text style={styles.helperText}>
                  Determines if transfer was within 7 years. If settlor dies within 7 years, remainder beneficiaries may face IHT liability on failed PET.
                </Text>
              )}
              {!trustData.remaindermanTransferDateUnsure && (
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Select
                      placeholder="Month..."
                      value={trustData.remaindermanTransferMonth}
                      options={[
                        { label: 'January', value: '01' },
                        { label: 'February', value: '02' },
                        { label: 'March', value: '03' },
                        { label: 'April', value: '04' },
                        { label: 'May', value: '05' },
                        { label: 'June', value: '06' },
                        { label: 'July', value: '07' },
                        { label: 'August', value: '08' },
                        { label: 'September', value: '09' },
                        { label: 'October', value: '10' },
                        { label: 'November', value: '11' },
                        { label: 'December', value: '12' },
                      ]}
                      onChange={(value) => updateTrustData('remaindermanTransferMonth', value)}
                    />
                  </View>
                  <View style={styles.dateField}>
                    <Select
                      placeholder="Year..."
                      value={trustData.remaindermanTransferYear}
                      options={Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return { label: year.toString(), value: year.toString() };
                      })}
                      onChange={(value) => updateTrustData('remaindermanTransferYear', value)}
                    />
                  </View>
                </View>
              )}
              <Checkbox
                label="Unsure"
                checked={trustData.remaindermanTransferDateUnsure}
                onCheckedChange={(value) => {
                  updateTrustData('remaindermanTransferDateUnsure', value);
                  if (value) {
                    updateTrustData('remaindermanTransferMonth', '');
                    updateTrustData('remaindermanTransferYear', '');
                  }
                }}
              />
                </>
              )}
              
              {/* 4. Transfer Value (Conditional) - Only show if gateway is yes/not_sure, date not unsure, and within 7 years */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (trustData.remaindermanTransferWithin7Years === 'yes' || trustData.remaindermanTransferWithin7Years === 'not_sure') && !trustData.remaindermanTransferDateUnsure && isWithin7Years && trustData.remaindermanTransferMonth && trustData.remaindermanTransferYear && (
                <>
                  {renderLabelWithHelp(
                    "Approximately what was the property value when transferred into trust? *",
                    'transferValue',
                    "Failed PET calculations use original transfer value, not current value. Needed for taper relief calculations."
                  )}
                  {showRemaindermanHelper.transferValue && (
                    <Text style={styles.helperText}>
                      Failed PET calculations use original transfer value, not current value. Needed for taper relief calculations.
                    </Text>
                  )}
                  <CurrencyInput
                    placeholder="Enter value at transfer..."
                    value={trustData.remaindermanTransferValue}
                    onValueChange={(value) => updateTrustData('remaindermanTransferValue', value)}
                    disabled={trustData.remaindermanTransferValueUnsure}
                  />
                  <Checkbox
                    label="Unsure"
                    checked={trustData.remaindermanTransferValueUnsure}
                    onCheckedChange={(value) => {
                      updateTrustData('remaindermanTransferValueUnsure', value);
                      if (value) {
                        updateTrustData('remaindermanTransferValue', 0);
                      }
                    }}
                  />
                </>
              )}
              
              {/* 5. Settlor Status (Conditional) - Only show if gateway is yes/not_sure and (date unsure OR within 7 years) */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (trustData.remaindermanTransferWithin7Years === 'yes' || trustData.remaindermanTransferWithin7Years === 'not_sure') && (trustData.remaindermanTransferDateUnsure || (isWithin7Years && trustData.remaindermanTransferMonth && trustData.remaindermanTransferYear)) && (
                <>
                  <View>
                    {renderLabelWithHelp(
                      "Is the person who created this trust still alive? *",
                      'settlorStatus',
                      "If settlor has died within 7 years, immediate IHT liability check needed. If alive, calculate potential future liability."
                    )}
                    {showRemaindermanHelper.settlorStatus && (
                      <Text style={styles.helperText}>
                        If settlor has died within 7 years, immediate IHT liability check needed. If alive, calculate potential future liability.
                      </Text>
                    )}
                    <RadioGroup
                      value={trustData.remaindermanSettlorAlive}
                      options={[
                        { label: 'Yes, still alive', value: 'yes' },
                        { label: 'No, has passed away', value: 'no' },
                        { label: 'Not sure who created it', value: 'not_sure' },
                      ]}
                      onChange={(value) => updateTrustData('remaindermanSettlorAlive', value)}
                    />
                  </View>
                </>
              )}
              
              {/* 6. Succession Planning - Only show if life tenant is alive */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (
                <>
                  {renderLabelWithHelp(
                "Who will you leave your remainder interest to? *",
                'succession',
                "Your remainder interest is a valuable asset that can be left to anyone in your will. If you die before the life tenant, your chosen beneficiaries will inherit this future right to receive the property."
              )}
              {showRemaindermanHelper.succession && (
                <Text style={styles.helperText}>
                  Your remainder interest is a valuable asset that can be left to anyone in your will. If you die before the life tenant, your chosen beneficiaries will inherit this future right to receive the property.
                </Text>
              )}
              <MultiBeneficiarySelector
                mode="single"
                value={(() => {
                  if (!trustData.remaindermanSuccessionBeneficiary) {
                    return { id: '', type: 'person' as const, name: '' };
                  }
                  const id = trustData.remaindermanSuccessionBeneficiary;
                  if (id === 'estate') {
                    return { id: 'estate', type: 'estate' as const, name: 'The Estate' };
                  }
                  const person = personActions.getPersonById(id);
                  if (person) {
                    return {
                      id: person.id,
                      type: 'person' as const,
                      name: `${person.firstName} ${person.lastName}`.trim(),
                    };
                  }
                  return { id: '', type: 'person' as const, name: '' };
                })()}
                onChange={(selection) => {
                  if (selection && !Array.isArray(selection)) {
                    updateTrustData('remaindermanSuccessionBeneficiary', selection.id);
                  } else if (!selection) {
                    updateTrustData('remaindermanSuccessionBeneficiary', '');
                  }
                }}
                allowEstate={true}
                allowGroups={false}
                excludePersonIds={currentUserPersonId ? [currentUserPersonId] : []}
                personActions={personActions}
                beneficiaryGroupActions={beneficiaryGroupActions}
                placeholder="Select beneficiary..."
              />
                </>
              )}
              
              {/* 7. Educational Notice - Only show if life tenant is alive */}
              {trustData.remaindermanLifeTenantAlive === 'yes' && (
                <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoTitle}>Important: </Text>
                  Your remainder interest is a real asset with current value. It increases in value as the life tenant ages and can be sold, gifted, or passed through your will.
                </Text>
              </View>
              )}
            </>
          );
        })()}
      </View>
    );
  };

  const renderBareSettlorFieldset = () => {
    const hasDate = !!trustData.bareSettlorTransferMonth && !!trustData.bareSettlorTransferYear;

    // Calculate if transfer was less than 7 years ago
    const isLessThan7Years = (() => {
      if (!hasDate) return false;
      const transferDate = new Date(
        parseInt(trustData.bareSettlorTransferYear),
        parseInt(trustData.bareSettlorTransferMonth) - 1
      );
      const now = new Date();
      const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return yearsDiff < 7;
    })();

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          The bare trust beneficiaries own the property absolutely. This property will not be a part of your estate for inheritance tax purposes, unless you die within 7 years of creating the trust.
        </Text>

        {/* 7-Year Gateway Question */}
        <RadioGroup
          label="Did you transfer this property into the trust within the last 7 years? *"
          value={trustData.bareSettlorTransferWithin7Years}
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ]}
          onChange={(value) => {
            updateTrustData('bareSettlorTransferWithin7Years', value);
            if (value === 'no') {
              updateTrustData('bareSettlorTransferMonth', '');
              updateTrustData('bareSettlorTransferYear', '');
              updateTrustData('bareValueAtTransfer', 0);
            }
          }}
        />

        {/* Success message when >7 years */}
        {trustData.bareSettlorTransferWithin7Years === 'no' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ Transfer fully exempt — no IHT impact
            </Text>
          </View>
        )}

        {/* Date + Value fields only when "Yes" */}
        {trustData.bareSettlorTransferWithin7Years === 'yes' && (
          <TransferDateValueFields
            dateLabel="When did you transfer this property into Trust? *"
            month={trustData.bareSettlorTransferMonth}
            year={trustData.bareSettlorTransferYear}
            onMonthChange={(v) => updateTrustData('bareSettlorTransferMonth', v)}
            onYearChange={(v) => updateTrustData('bareSettlorTransferYear', v)}
            showDateUnknown={false}
            showContradictionWarning
            onContradiction={setBareSettlorDateContradiction}
            showValue={isLessThan7Years && hasDate}
            valueLabel="Value when transferred? *"
            value={trustData.bareValueAtTransfer}
            onValueChange={(v) => updateTrustData('bareValueAtTransfer', v)}
            valueHelperText="This affects IHT if you die within 7 years"
            showValueUnknown={false}
          />
        )}
      </View>
    );
  };

  const renderBareBeneficiaryFieldset = () => {
    const percentageUnknown = trustData.bareBeneficiaryPercentageUnknown;
    const shareWithOthers = trustData.bareBeneficiaryShareWithOthers === 'yes';
    const numberOfOthers = trustData.bareBeneficiaryNumberOfOthers;
    const isGiftedLessThan7Years = trustData.bareBeneficiaryGiftedByLivingSettlor === 'yes_less_than_7';
    
    // Calculate estimated percentage when sharing with others
    const calculateEstimatedPercentage = () => {
      if (!shareWithOthers || !numberOfOthers || numberOfOthers === 'unknown') {
        return 0;
      }
      const numOthers = parseInt(numberOfOthers, 10);
      if (isNaN(numOthers) || numOthers < 1 || numOthers > 30) {
        return 0;
      }
      const totalPeople = 1 + numOthers; // User + others
      return Math.round((100 / totalPeople) * 100) / 100; // Round to 2 decimal places
    };
    
    // Calculate total unknown beneficiaries
    const calculateTotalUnknownBeneficiaries = () => {
      if (!shareWithOthers || !numberOfOthers || numberOfOthers === 'unknown') {
        return 1; // Just the user
      }
      const numOthers = parseInt(numberOfOthers, 10);
      if (isNaN(numOthers) || numOthers < 1 || numOthers > 30) {
        return 1;
      }
      return 1 + numOthers; // User + others
    };
    
    // Calculate values for display
    const estimatedPercentage = calculateEstimatedPercentage();
    const totalUnknownBeneficiaries = calculateTotalUnknownBeneficiaries();
    
    // Handler to update number of others and recalculate
    const handleNumberOfOthersChange = (value: string) => {
      updateTrustData('bareBeneficiaryNumberOfOthers', value);
      
      // Recalculate and update stored values
      if (value && value !== 'unknown') {
        const numOthers = parseInt(value, 10);
        if (!isNaN(numOthers) && numOthers >= 1 && numOthers <= 30) {
          const totalPeople = 1 + numOthers;
          const estimated = Math.round((100 / totalPeople) * 100) / 100;
          updateTrustData('bareBeneficiaryEstimatedPercentage', estimated);
          updateTrustData('bareBeneficiaryTotalUnknownBeneficiaries', totalPeople);
        }
      } else {
        updateTrustData('bareBeneficiaryEstimatedPercentage', 0);
        updateTrustData('bareBeneficiaryTotalUnknownBeneficiaries', 0);
      }
    };
    
    // Handler to update share with others
    const handleShareWithOthersChange = (value: string) => {
      updateTrustData('bareBeneficiaryShareWithOthers', value);
      if (value !== 'yes') {
        updateTrustData('bareBeneficiaryNumberOfOthers', '');
        updateTrustData('bareBeneficiaryEstimatedPercentage', 0);
        updateTrustData('bareBeneficiaryTotalUnknownBeneficiaries', 0);
      }
    };

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          Bare trust beneficiaries own the property absolutely. As a beneficiary, you have absolute ownership.
        </Text>

        {/* % of benefit - inline layout */}
        <View style={styles.inlineFieldRow}>
          {!percentageUnknown ? (
            <>
              <View style={styles.inlineInputContainer}>
                <PercentageInput
                  placeholder="0"
                  value={trustData.bareBeneficiaryPercentage}
                  onValueChange={(value) => updateTrustData('bareBeneficiaryPercentage', value)}
                  clearButtonMode="never"
                  style={styles.inlinePercentageInput}
                  rightIcon=""
                  maxLength={3}
                />
              </View>
              <Text style={styles.inlinePercentSymbol}>%</Text>
              <Text style={styles.inlineLabel}>of benefit</Text>
            </>
          ) : (
            <Text style={styles.inlineLabel}>% of benefit</Text>
          )}
        </View>
        
        <Checkbox
          label="Unknown"
          checked={percentageUnknown}
          onCheckedChange={(value) => {
            updateTrustData('bareBeneficiaryPercentageUnknown', value);
            if (value) {
              updateTrustData('bareBeneficiaryPercentage', 0);
            }
          }}
        />

        {/* Do you share with others? (only shown when Unknown is checked) */}
        {percentageUnknown && (
          <>
            <RadioGroup
              label="Do you share with others?"
              value={trustData.bareBeneficiaryShareWithOthers}
              onChange={handleShareWithOthersChange}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
            />

            {/* How many others? (only shown when Yes is selected) */}
            {shareWithOthers && (
              <>
                <Select
                  label="How many others?"
                  placeholder="Select number..."
                  value={numberOfOthers}
                  options={[
                    { label: 'Unknown', value: 'unknown' },
                    ...Array.from({ length: 30 }, (_, i) => ({
                      label: (i + 1).toString(),
                      value: (i + 1).toString(),
                    })),
                  ]}
                  onChange={handleNumberOfOthersChange}
                />
                
                {/* Show calculated estimate */}
                {numberOfOthers && numberOfOthers !== 'unknown' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Estimated: {calculateEstimatedPercentage()}% each (based on {calculateTotalUnknownBeneficiaries()} total beneficiaries)
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Was property gifted by living settlor? */}
        <RadioGroup
          label="Was property gifted to the bare trust by living settlor?"
          value={trustData.bareBeneficiaryGiftedByLivingSettlor}
          onChange={(value) => updateTrustData('bareBeneficiaryGiftedByLivingSettlor', value)}
          options={[
            { label: 'Yes - less than 7 years ago', value: 'yes_less_than_7' },
            { label: 'Yes - more than 7 years ago', value: 'yes_more_than_7' },
            { label: 'No / Not sure', value: 'no_not_sure' },
          ]}
        />

        {/* When roughly? (only shown when "Yes - less than 7 years ago" is selected) */}
        {isGiftedLessThan7Years && (
          <>
            <Text style={styles.fieldLabel}>When roughly?</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Select
                  placeholder="Month..."
                  value={trustData.bareBeneficiaryGiftMonth}
                  options={[
                    { label: 'January', value: '01' },
                    { label: 'February', value: '02' },
                    { label: 'March', value: '03' },
                    { label: 'April', value: '04' },
                    { label: 'May', value: '05' },
                    { label: 'June', value: '06' },
                    { label: 'July', value: '07' },
                    { label: 'August', value: '08' },
                    { label: 'September', value: '09' },
                    { label: 'October', value: '10' },
                    { label: 'November', value: '11' },
                    { label: 'December', value: '12' },
                  ]}
                  onChange={(value) => updateTrustData('bareBeneficiaryGiftMonth', value)}
                />
              </View>
              <View style={styles.dateField}>
                <Select
                  placeholder="Year..."
                  value={trustData.bareBeneficiaryGiftYear}
                  options={Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return { label: year.toString(), value: year.toString() };
                  })}
                  onChange={(value) => updateTrustData('bareBeneficiaryGiftYear', value)}
                />
              </View>
            </View>
          </>
        )}

      </View>
    );
  };

  const renderBareSettlorAndBeneficiaryFieldset = () => {
    const livesInProperty = trustData.currentlyLiveInProperty === 'yes';
    const hasCobeneficiaries = bareCoBeneficiaries.length > 0;
    const yourShare = hasCobeneficiaries
      ? bareCoBeneficiaries.find(b => b.id === 'self')?.percentage || 100
      : 100;
    const showGROBWarning = livesInProperty && yourShare < 100;

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          You created a bare trust for this property and are also a beneficiary. We need details about the transfer and any potential gift with reservation issues.
        </Text>

        <RadioGroup
          label="Do you currently live in the property? *"
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ]}
          value={trustData.currentlyLiveInProperty}
          onChange={(value) => updateTrustData('currentlyLiveInProperty', value)}
        />

        {showGROBWarning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Warning: Potential Gift with Reservation</Text>
            <Text style={styles.warningText}>
              You occupy property you partially gifted. The gifted portion ({100 - yourShare}%) may be considered a Gift with Reservation and remain in your estate for IHT.
            </Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Property value at point of transfer *</Text>
        {!trustData.bareSettlorAndBeneficiaryValueUnknown && (
          <CurrencyInput
            placeholder="Enter value at transfer..."
            value={trustData.bareValueAtTransfer}
            onValueChange={(value) => updateTrustData('bareValueAtTransfer', value)}
          />
        )}
        <Text style={styles.helperText}>
          Value when property was transferred into the bare trust
        </Text>

        {/* "I don't know" checkbox for value - disabled when value > 0 */}
        <Checkbox
          label="I don't know these details"
          checked={trustData.bareSettlorAndBeneficiaryValueUnknown}
          onCheckedChange={(value) => {
            updateTrustData('bareSettlorAndBeneficiaryValueUnknown', value);
            if (value) {
              // Clear value when checked
              updateTrustData('bareValueAtTransfer', 0);
            }
          }}
          disabled={trustData.bareValueAtTransfer > 0}
        />

        {/* Co-beneficiaries */}
        <Text style={styles.fieldLabel}>Co-beneficiaries</Text>
        <Text style={styles.helperText}>
          If you share ownership with others, add them here. Your share + their shares must total 100%.
        </Text>
        <BeneficiaryWithPercentages
          allocationMode="percentage"
          value={bareCoBeneficiaries}
          onChange={setBareCoBeneficiaries}
          personActions={personActions}
          beneficiaryGroupActions={beneficiaryGroupActions}
          label="Co-beneficiaries"
          onAddNewPerson={(onCreated) => {
            addPersonSelectionRef.current = onCreated || null;
            setShowAddPersonDialog(true);
          }}
          onAddNewGroup={() => alert('Add group functionality to be implemented')}
        />


        {/* Spouse/Civil Partner Exclusion Question */}
        <RadioGroup
          label="Is your spouse/civil partner excluded from benefit? *"
          value={trustData.spouseExcludedFromBenefit}
          onChange={(value) => updateTrustData('spouseExcludedFromBenefit', value as any)}
          options={[
            { label: 'Yes - specifically excluded', value: 'yes' },
            { label: 'No - can benefit', value: 'no' },
            { label: 'Not sure', value: 'not_sure' },
          ]}
        />
      </View>
    );
  };

  const renderDiscretionarySettlorFieldset = () => {
    const hasDate = !!trustData.discretionaryTransferMonth && !!trustData.discretionaryTransferYear;

    const isLessThan7Years = (() => {
      if (!hasDate) return false;
      const transferDate = new Date(
        parseInt(trustData.discretionaryTransferYear),
        parseInt(trustData.discretionaryTransferMonth) - 1
      );
      const now = new Date();
      const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return yearsDiff < 7;
    })();

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          As the settlor who transferred property into a discretionary trust, we need the transfer details for 7-year rule calculations.
        </Text>

        {/* 7-Year Gateway Question */}
        <RadioGroup
          label="Did you transfer this property into the trust within the last 7 years? *"
          value={trustData.discretionarySettlorTransferWithin7Years}
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ]}
          onChange={(value) => {
            updateTrustData('discretionarySettlorTransferWithin7Years', value);
            if (value === 'no') {
              updateTrustData('discretionaryTransferMonth', '');
              updateTrustData('discretionaryTransferYear', '');
              updateTrustData('discretionaryValueAtTransfer', 0);
              updateTrustData('discretionarySettlorDateUnknown', false);
              updateTrustData('discretionarySettlorValueUnknown', false);
            }
          }}
        />

        {/* Success message when >7 years */}
        {trustData.discretionarySettlorTransferWithin7Years === 'no' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ Transfer fully exempt — no IHT impact
            </Text>
          </View>
        )}

        {/* Date + Value fields only when "Yes" */}
        {trustData.discretionarySettlorTransferWithin7Years === 'yes' && (
          <TransferDateValueFields
            dateLabel="When did you transfer this property into the trust? *"
            dateHelperText="For 7-year rule tracking"
            month={trustData.discretionaryTransferMonth}
            year={trustData.discretionaryTransferYear}
            onMonthChange={(v) => updateTrustData('discretionaryTransferMonth', v)}
            onYearChange={(v) => updateTrustData('discretionaryTransferYear', v)}
            showDateUnknown
            dateUnknown={trustData.discretionarySettlorDateUnknown}
            onDateUnknownChange={(v) => {
              updateTrustData('discretionarySettlorDateUnknown', v);
              if (v) {
                updateTrustData('discretionaryTransferMonth', '');
                updateTrustData('discretionaryTransferYear', '');
              }
            }}
            showContradictionWarning
            onContradiction={setDiscSettlorDateContradiction}
            showValue={isLessThan7Years || trustData.discretionarySettlorDateUnknown}
            valueLabel="Value at time of transfer *"
            value={trustData.discretionaryValueAtTransfer}
            onValueChange={(v) => updateTrustData('discretionaryValueAtTransfer', v)}
            showValueUnknown
            valueUnknown={trustData.discretionarySettlorValueUnknown}
            onValueUnknownChange={(v) => {
              updateTrustData('discretionarySettlorValueUnknown', v);
              if (v) updateTrustData('discretionaryValueAtTransfer', 0);
            }}
          />
        )}
      </View>
    );
  };

  const renderDiscretionaryBeneficiaryFieldset = () => {
    const gateway = trustData.discretionaryBeneficiaryTransferWithin7Years;
    const isDateUnknown = trustData.discretionaryBeneficiaryDateUnknown;
    const hasDate = !!trustData.discretionaryBeneficiaryTransferMonth && !!trustData.discretionaryBeneficiaryTransferYear;

    const isLessThan7Years = (() => {
      if (isDateUnknown) return true;
      if (!hasDate) return false;
      const transferDate = new Date(
        parseInt(trustData.discretionaryBeneficiaryTransferYear),
        parseInt(trustData.discretionaryBeneficiaryTransferMonth) - 1
      );
      const now = new Date();
      const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return yearsDiff < 7;
    })();

    const showInsuranceField = isLessThan7Years || isDateUnknown;

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          As a beneficiary of this discretionary trust, we need to check if there's potential tax liability from the 7-year rule.
        </Text>

        {/* 7-Year Gateway Question */}
        <RadioGroup
          label="Was this property transferred into the trust within the last 7 years? *"
          value={gateway}
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No, more than 7 years ago', value: 'no' },
            { label: "I'm not sure", value: 'not_sure' },
          ]}
          onChange={(value) => {
            updateTrustData('discretionaryBeneficiaryTransferWithin7Years', value);
            if (value === 'no') {
              updateTrustData('discretionaryBeneficiaryTransferMonth', '');
              updateTrustData('discretionaryBeneficiaryTransferYear', '');
              updateTrustData('discretionaryBeneficiaryValueAtTransfer', 0);
              updateTrustData('discretionaryBeneficiaryDateUnknown', false);
              updateTrustData('discretionaryBeneficiaryValueUnknown', false);
              updateTrustData('discretionaryBeneficiaryInsurancePolicy', '');
            }
            if (value === 'not_sure') {
              updateTrustData('discretionaryBeneficiaryDateUnknown', true);
              updateTrustData('discretionaryBeneficiaryTransferMonth', '');
              updateTrustData('discretionaryBeneficiaryTransferYear', '');
            }
          }}
        />

        {/* Success message when >7 years */}
        {gateway === 'no' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ Transfer fully exempt — no IHT impact
            </Text>
          </View>
        )}

        {/* Date + Value fields when "Yes" */}
        {gateway === 'yes' && (
          <TransferDateValueFields
            dateLabel="Month and year this property was transferred into trust *"
            dateHelperText="For 7-year rule tracking"
            month={trustData.discretionaryBeneficiaryTransferMonth}
            year={trustData.discretionaryBeneficiaryTransferYear}
            onMonthChange={(v) => updateTrustData('discretionaryBeneficiaryTransferMonth', v)}
            onYearChange={(v) => updateTrustData('discretionaryBeneficiaryTransferYear', v)}
            showDateUnknown
            dateUnknown={trustData.discretionaryBeneficiaryDateUnknown}
            onDateUnknownChange={(v) => {
              updateTrustData('discretionaryBeneficiaryDateUnknown', v);
              if (v) {
                updateTrustData('discretionaryBeneficiaryTransferMonth', '');
                updateTrustData('discretionaryBeneficiaryTransferYear', '');
              }
            }}
            showContradictionWarning
            onContradiction={setDiscBeneficiaryDateContradiction}
            showValue={isLessThan7Years || isDateUnknown}
            valueLabel="£ Value when transferred (not current value) *"
            value={trustData.discretionaryBeneficiaryValueAtTransfer}
            onValueChange={(v) => updateTrustData('discretionaryBeneficiaryValueAtTransfer', v)}
            valueHelperText="This determines potential tax if the settlor dies within 7 years"
            showValueUnknown
            valueUnknown={trustData.discretionaryBeneficiaryValueUnknown}
            onValueUnknownChange={(v) => {
              updateTrustData('discretionaryBeneficiaryValueUnknown', v);
              if (v) updateTrustData('discretionaryBeneficiaryValueAtTransfer', 0);
            }}
          />
        )}

        {/* Date + Value fields when "I'm not sure" (date pre-ticked as unknown) */}
        {gateway === 'not_sure' && (
          <TransferDateValueFields
            dateLabel="Month and year this property was transferred into trust *"
            dateHelperText="For 7-year rule tracking"
            month={trustData.discretionaryBeneficiaryTransferMonth}
            year={trustData.discretionaryBeneficiaryTransferYear}
            onMonthChange={(v) => updateTrustData('discretionaryBeneficiaryTransferMonth', v)}
            onYearChange={(v) => updateTrustData('discretionaryBeneficiaryTransferYear', v)}
            showDateUnknown
            dateUnknown={trustData.discretionaryBeneficiaryDateUnknown}
            onDateUnknownChange={(v) => {
              updateTrustData('discretionaryBeneficiaryDateUnknown', v);
              if (v) {
                updateTrustData('discretionaryBeneficiaryTransferMonth', '');
                updateTrustData('discretionaryBeneficiaryTransferYear', '');
              }
            }}
            showValue
            valueLabel="£ Value when transferred (not current value) *"
            value={trustData.discretionaryBeneficiaryValueAtTransfer}
            onValueChange={(v) => updateTrustData('discretionaryBeneficiaryValueAtTransfer', v)}
            valueHelperText="This determines potential tax if the settlor dies within 7 years"
            showValueUnknown
            valueUnknown={trustData.discretionaryBeneficiaryValueUnknown}
            onValueUnknownChange={(v) => {
              updateTrustData('discretionaryBeneficiaryValueUnknown', v);
              if (v) updateTrustData('discretionaryBeneficiaryValueAtTransfer', 0);
            }}
          />
        )}

        {/* Risk message when date is unknown */}
        {(gateway === 'yes' || gateway === 'not_sure') && isDateUnknown && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Estimated current IHT risk: Unknown. The trust may face a tax bill if the settlor dies within 7 years of transfer.
            </Text>
          </View>
        )}

        {/* Insurance Policy Field - only show if under 7 years or unknown, and gateway is yes/not_sure */}
        {(gateway === 'yes' || gateway === 'not_sure') && showInsuranceField && (
          <RadioGroup
            label="Is there an insurance policy to cover potentially exempt transfers? *"
            value={trustData.discretionaryBeneficiaryInsurancePolicy}
            onChange={(value) => updateTrustData('discretionaryBeneficiaryInsurancePolicy', value as any)}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
              { label: 'Unsure', value: 'unsure' },
            ]}
          />
        )}
      </View>
    );
  };

  const renderDiscretionarySettlorAndBeneficiaryFieldset = () => (
    <View style={styles.fieldsetContent}>
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Settlor-Interested Trust</Text>
        <Text style={styles.warningText}>
          This appears to be a settlor-interested trust. The property will remain in your estate for inheritance tax purposes as you have a beneficial interest.
        </Text>
      </View>

      {/* Spouse/Civil Partner Exclusion Question */}
      <RadioGroup
        label="Is your spouse/civil partner excluded from benefit? *"
        value={trustData.discretionarySettlorAndBeneficiarySpouseExcluded}
        onChange={(value) => updateTrustData('discretionarySettlorAndBeneficiarySpouseExcluded', value as any)}
        options={[
          { label: 'Yes - specifically excluded', value: 'yes' },
          { label: 'No - can benefit', value: 'no' },
          { label: 'Not sure', value: 'not_sure' },
        ]}
      />

      <Checkbox
        label="If your situation is more complex, check here and our team will reach out."
        checked={trustData.discretionaryComplexSituation}
        onCheckedChange={(value) => updateTrustData('discretionaryComplexSituation', value)}
      />
    </View>
  );

  // Validation helper
  const isFormValid = () => {
    // Base fields always required
    if (!trustData.trustName || !trustData.trustType) {
      return false;
    }
    
    // If trust type is 'other', no role is needed - team will collect details separately
    if (trustData.trustType === 'other') {
      return true;
    }
    
    // For other trust types, role is required
    if (!trustData.trustRole) {
      return false;
    }

    // Life Interest Settlor validation (new spec)
    if (trustData.trustType === 'life_interest' && trustData.trustRole === 'settlor') {
      // Gateway question is required
      if (!trustData.settlorTransferWithin7Years) {
        return false;
      }
      
      // If answered 'no' (>7 years), that's all we need
      if (trustData.settlorTransferWithin7Years === 'no') {
        return true;
      }
      
      // If answered 'yes' (<7 years), require date (or unknown) + value (or unknown) + benefit confirmation
      if (trustData.settlorTransferWithin7Years === 'yes') {
        const hasDateUnknown = trustData.lifeInterestDateUnknown;
        const hasDate = trustData.settlorTransferMonth !== '' && trustData.settlorTransferYear !== '';
        const hasValueUnknown = trustData.lifeInterestValueUnknown;
        const hasValue = trustData.settlorTransferValue > 0;

        // Block save if entered date actually exceeds 7 years (contradicts gateway answer)
        if (!hasDateUnknown && hasDate) {
          const enteredDate = new Date(parseInt(trustData.settlorTransferYear), parseInt(trustData.settlorTransferMonth) - 1);
          const elapsed = (Date.now() - enteredDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (elapsed >= 7) return false;
        }

        return (
          (hasDateUnknown || hasDate) &&
          (hasValueUnknown || hasValue) &&
          trustData.settlorNoBenefitConfirmed === true
        );
      }
      
      return false;
    }

    // Life Interest Settlor + Beneficial Interest validation (new spec)
    if (trustData.trustType === 'life_interest' && trustData.trustRole === 'settlor_and_beneficial_interest') {
      // Nature of benefit is required
      if (!trustData.settlorAndBeneficialBenefitType) {
        return false;
      }
      
      // Checkbox is optional, so if benefit type is selected, form is valid
      return true;
    }

    // Life Interest Beneficiary validation (life_interest role) - New Spec
    if (trustData.trustType === 'life_interest' && trustData.trustRole === 'life_interest') {
      // Required base fields
      if (!trustData.lifeInterestTrustCreationDate || !trustData.lifeInterestSpouseSuccession || !trustData.lifeInterestSharing) {
        return false;
      }
      
      // IPDI check required if post-2006
      if (trustData.lifeInterestTrustCreationDate === 'on_or_after_2006') {
        if (!trustData.lifeInterestIsIPDI || (trustData.lifeInterestIsIPDI !== 'yes' && trustData.lifeInterestIsIPDI !== 'no')) {
          return false; // Must answer IPDI question
        }
      }
      
      // Conditional fields based on sharing type
      if (trustData.lifeInterestSharing === 'shared_equally') {
        if (trustData.lifeInterestEqualSharingCount < 2) return false;
      } else if (trustData.lifeInterestSharing === 'shared_unequally') {
        if (trustData.lifeInterestUnequalSharingPercentage <= 0 || trustData.lifeInterestUnequalSharingPercentage >= 100) return false;
      } else if (trustData.lifeInterestSharing === 'successive') {
        if (!trustData.lifeInterestSuccessiveCurrentTenant || !trustData.lifeInterestSuccessiveCurrentStatus) return false;
      }
      
      return true;
    }

    // Remainderman validation - New Spec
    if (trustData.trustType === 'life_interest' && trustData.trustRole === 'remainderman') {
      // Life tenant status is required
      if (!trustData.remaindermanLifeTenantAlive) {
        return false;
      }
      
      // If life tenant has passed away, ownership clarification is required
      if (trustData.remaindermanLifeTenantAlive === 'no') {
        return trustData.remaindermanOwnershipClarification !== '';
      }
      
      // If life tenant is alive, require age, gateway answer, and succession beneficiary
      if (trustData.remaindermanLifeTenantAlive === 'yes') {
        if (!trustData.remaindermanLifeTenantAge || trustData.remaindermanLifeTenantAge < 18) {
          return false;
        }

        // Gateway question is required
        if (!trustData.remaindermanTransferWithin7Years) {
          return false;
        }

        // Succession beneficiary always required when life tenant is alive
        if (!trustData.remaindermanSuccessionBeneficiary) {
          return false;
        }

        // If "no" (>7 years), age + succession is all we need — skip date/value/settlor
        if (trustData.remaindermanTransferWithin7Years === 'no') {
          return true;
        }

        // If "yes" or "not_sure", require date (or unsure) + conditional value/settlor
        if (trustData.remaindermanTransferWithin7Years === 'yes' || trustData.remaindermanTransferWithin7Years === 'not_sure') {
          // Transfer date validation - not required if unsure
          if (!trustData.remaindermanTransferDateUnsure) {
            if (!trustData.remaindermanTransferMonth || !trustData.remaindermanTransferYear) {
              return false;
            }
          }

          // Calculate if within 7 years (only if date is provided)
          const isWithin7Years = (() => {
            if (!trustData.remaindermanTransferMonth || !trustData.remaindermanTransferYear) return false;
            const transferDate = new Date(
              parseInt(trustData.remaindermanTransferYear),
              parseInt(trustData.remaindermanTransferMonth) - 1
            );
            const now = new Date();
            const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            return yearsDiff < 7;
          })();

          // Settlor status - required if transfer date is unsure OR if within 7 years
          const showSettlorStatus = trustData.remaindermanTransferDateUnsure ||
            (trustData.remaindermanTransferMonth && trustData.remaindermanTransferYear && isWithin7Years);
          if (showSettlorStatus && !trustData.remaindermanSettlorAlive) {
            return false;
          }

          // Transfer value - only required if not unsure and within 7 years
          if (!trustData.remaindermanTransferValueUnsure && isWithin7Years) {
            if (trustData.remaindermanTransferValue <= 0) {
              return false;
            }
          }
        }
      }
      
      // If "not sure" about life tenant status, still allow save (they've indicated uncertainty)
      if (trustData.remaindermanLifeTenantAlive === 'not_sure') {
        return true;
      }
      
      return true;
    }

    // Bare Trust Settlor validation
    if (trustData.trustType === 'bare' && trustData.trustRole === 'settlor') {
      // 1. Gateway must be answered
      if (!trustData.bareSettlorTransferWithin7Years) return false;

      // 2. If "no" (>7 years), no further fields needed
      if (trustData.bareSettlorTransferWithin7Years === 'no') return true;

      // 3. Block save if date contradicts the "within 7 years" assertion
      if (bareSettlorDateContradiction) return false;

      // 4. If "yes", require date and conditional value
      const hasDate = trustData.bareSettlorTransferMonth && trustData.bareSettlorTransferYear;
      if (!hasDate) return false;

      const isLessThan7Years = (() => {
        const transferDate = new Date(
          parseInt(trustData.bareSettlorTransferYear),
          parseInt(trustData.bareSettlorTransferMonth) - 1
        );
        const now = new Date();
        const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return yearsDiff < 7;
      })();

      if (isLessThan7Years) {
        return trustData.bareValueAtTransfer > 0;
      }

      return true;
    }

    // Bare Trust Beneficiary validation (all optional)
    if (trustData.trustType === 'bare' && trustData.trustRole === 'beneficiary') {
      return true; // All fields optional
    }

    // Bare Trust Settlor & Beneficiary validation
    if (trustData.trustType === 'bare' && trustData.trustRole === 'settlor_and_beneficiary') {
      // Value: Either "I don't know" is checked OR value is > 0
      const hasValueUnknown = trustData.bareSettlorAndBeneficiaryValueUnknown;
      const hasValue = trustData.bareValueAtTransfer > 0;
      
      return (
        trustData.currentlyLiveInProperty !== '' &&
        (hasValueUnknown || hasValue) &&
        trustData.spouseExcludedFromBenefit !== '' // NEW: Spouse exclusion required
      );
    }

    // Discretionary Trust Settlor validation
    if (trustData.trustType === 'discretionary' && trustData.trustRole === 'settlor') {
      // Gateway is required
      if (!trustData.discretionarySettlorTransferWithin7Years) return false;

      // "No" — fully exempt, nothing else needed
      if (trustData.discretionarySettlorTransferWithin7Years === 'no') return true;

      // Block save if contradiction warning is active
      if (discSettlorDateContradiction) return false;

      // "Yes" — need date (or unknown) and value (or unknown)
      const hasDateUnknown = trustData.discretionarySettlorDateUnknown;
      const hasDate = trustData.discretionaryTransferMonth && trustData.discretionaryTransferYear;
      
      const hasValueUnknown = trustData.discretionarySettlorValueUnknown;
      const hasValue = trustData.discretionaryValueAtTransfer > 0;
      
      return (
        (hasDateUnknown || !!hasDate) &&
        (hasValueUnknown || hasValue)
      );
    }

    // Discretionary Trust Beneficiary validation
    if (trustData.trustType === 'discretionary' && trustData.trustRole === 'beneficiary') {
      // Gateway is required
      if (!trustData.discretionaryBeneficiaryTransferWithin7Years) return false;

      // "No" — fully exempt, nothing else needed
      if (trustData.discretionaryBeneficiaryTransferWithin7Years === 'no') return true;

      // Block save if contradiction warning is active
      if (discBeneficiaryDateContradiction) return false;

      // "Yes" or "I'm not sure" — need date (or unknown) and value (or unknown)
      const hasDateUnknown = trustData.discretionaryBeneficiaryDateUnknown;
      const hasDate = trustData.discretionaryBeneficiaryTransferMonth && trustData.discretionaryBeneficiaryTransferYear;

      if (!hasDateUnknown && !hasDate) return false;

      const hasValueUnknown = trustData.discretionaryBeneficiaryValueUnknown;
      const hasValue = trustData.discretionaryBeneficiaryValueAtTransfer > 0;

      if (!hasValueUnknown && !hasValue) return false;

      // Calculate if under 7 years or unknown for insurance requirement
      const isDateUnknown = trustData.discretionaryBeneficiaryDateUnknown;
      const isUnder7Years = (() => {
        if (isDateUnknown) return true;
        if (!hasDate) return false;
        const transferDate = new Date(
          parseInt(trustData.discretionaryBeneficiaryTransferYear),
          parseInt(trustData.discretionaryBeneficiaryTransferMonth) - 1
        );
        const now = new Date();
        const yearsDiff = (now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return yearsDiff < 7;
      })();

      // If under 7 years or unknown, insurance policy answer is required
      if ((isUnder7Years || isDateUnknown) && !trustData.discretionaryBeneficiaryInsurancePolicy) {
        return false;
      }

      return true;
    }

    // Discretionary Trust Settlor & Beneficiary validation
    if (trustData.trustType === 'discretionary' && trustData.trustRole === 'settlor_and_beneficiary') {
      return trustData.discretionarySettlorAndBeneficiarySpouseExcluded !== ''; // NEW: Spouse exclusion required
    }

    return true;
  };

  const handleSave = () => {
    // Get current user ID from willActions (consistent with other screens)
    const willMaker = willActions.getUser();
    const currentUserId = willMaker?.id || '';
    
    // Sandbox mode: save trust without property link
    if (isSandbox) {
      const trustEntityData = buildTrustEntityData({
        trustData,
        remaindermen,
        bareBeneficiaries,
        bareCoBeneficiaries,
        userId: currentUserId,
        assetIds: [],
        createdInContext: 'other',
      });
      
      const savedTrustId = trustId 
        ? (trustActions.updateTrust(trustId, trustEntityData), trustId)
        : trustActions.addTrust(trustEntityData);
      
      // TODO: If trustData.trustType === 'other', create backend task for team to reach out about trust details
      // Task should include: trust ID, trust name, user ID
      // This indicates property is owned by a trust but details need to be collected separately
      
      Alert.alert(
        '✅ Trust Saved',
        `Trust ID: ${savedTrustId}\n\nCheck Data Explorer to verify the trust was saved correctly.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/developer/trust-sandbox'),
          },
        ]
      );
      return;
    }
    
    // Normal flow - require propertyId
    if (!propertyId) {
      console.error('Property ID required');
      return;
    }
    
    const property = bequeathalActions.getAssetById(propertyId) as PropertyAsset;
    // Use property.userId as fallback, but prefer willActions
    const userId = currentUserId || property?.userId || '';
    
    const trustEntityData = buildTrustEntityData({
      trustData,
      remaindermen,
      bareBeneficiaries,
      bareCoBeneficiaries,
      userId,
      assetIds: [propertyId],
      createdInContext: 'property',
    });
    
    // Save to Trust entity
    let savedTrustId: string;
    if (trustId) {
      trustActions.updateTrust(trustId, trustEntityData);
      savedTrustId = trustId;
    } else {
      savedTrustId = trustActions.addTrust(trustEntityData);
    }
    
    // Build and save PropertyAsset transfer data from role-aware helpers
    const transferData = buildPropertyTransferData(trustData);
    
    // Update PropertyAsset with trustId reference + transfer fields
    if (property) {
      bequeathalActions.updateAsset(propertyId, {
        ...property,
        trustId: savedTrustId,
        ...transferData,
      });
    }
    
    // TODO: If trustData.trustType === 'other', create backend task for team to reach out about trust details
    // Task should include: property ID, trust ID, trust name, user ID
    // This indicates property is owned by a trust but details need to be collected separately
    
    // Trust-owned assets are excluded from net estate value (heldInTrust === 'yes'),
    // so delta is 0 — silent on the toast.
    toast.notifySave(0);
    
    // Clear draft on successful save
    discardTrustDraft();

    router.push('/bequeathal/property/summary');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="shield-account" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Trust Details</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Draft Banner */}
          <DraftBanner
            categoryLabel="trust details"
            isEditing={!!trustId}
            onDiscard={handleDiscardTrustDraft}
            visible={hasTrustDraft}
          />

          <Text style={styles.introText}>
            Property held in trust requires additional details for accurate estate planning and tax calculations.
          </Text>

          {/* Base Fields (3) - Always shown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trust Information</Text>

            <Input
              label="Trust Name *"
              placeholder="Enter trust name..."
              value={trustData.trustName}
              onChangeText={(value) => updateTrustData('trustName', value)}
            />

            <Select
              label="Trust Type *"
              placeholder="Select trust type..."
              value={trustData.trustType}
              options={[
                { label: 'Life Interest Trust', value: 'life_interest' },
                { label: 'Bare Trust', value: 'bare' },
                { label: 'Discretionary Trust', value: 'discretionary' },
                { label: 'Other', value: 'other' },
              ]}
              onChange={(value) => {
                updateTrustData('trustType', value as any);
                // TODO: If value is 'other', create backend task for team to reach out about trust details
                // Task should include: property ID, trust name (if provided), user ID
                // This indicates property is owned by a trust but details need to be collected separately
              }}
            />

            {/* Notification for 'other' trust type */}
            {trustData.trustType === 'other' && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  We will not take the trust details at this point, please continue and our team will reach out to speak to you regarding the details of the trust.
                </Text>
              </View>
            )}

            {trustData.trustType && trustData.trustType !== 'other' && (
              <RadioGroup
                label="Your Role in Trust *"
                options={getRoleOptions()}
                value={trustData.trustRole}
                onChange={(value) => updateTrustData('trustRole', value)}
              />
            )}
          </View>

          {/* Conditional Fieldset based on type + role */}
          {trustData.trustType && trustData.trustRole && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {trustData.trustType === 'life_interest' ? 'Life Interest Trust' : 
                 trustData.trustType === 'bare' ? 'Bare Trust' : 
                 'Discretionary Trust'} Details
              </Text>
              {renderFieldset()}
            </View>
          )}
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
          setBareCoBeneficiaries((prev) => [...prev, { id: person.id, type: 'person' }]);
        }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Button 
          onPress={handleSave}
          variant="primary"
          disabled={!isFormValid()}
        >
          Save Trust Details
        </Button>
        <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
      </View>
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
  introText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
  },
  section: {
    backgroundColor: `${KindlingColors.cream}33`, // Light cream tint to distinguish from page background
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  fieldset: {
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.beige}33`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  fieldsetContent: {
    gap: 0, // No gap - RadioGroup's marginVertical provides spacing
  },
  placeholderText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  warningTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#856404',
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#D4EDDA',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: KindlingColors.green,
  },
  successTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#155724',
    marginBottom: Spacing.xs,
  },
  successText: {
    fontSize: Typography.fontSize.sm,
    color: '#155724',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: `${KindlingColors.beige}33`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.brown,
  },
  messageButton: {
    marginTop: Spacing.md,
  },
  explainerBox: {
    backgroundColor: `${KindlingColors.green}10`, // Light green background
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.green,
    marginTop: Spacing.md,
  },
  explainerText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    lineHeight: 22,
  },
  explainerLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  explainerSpacer: {
    height: Spacing.sm,
  },
  labelWithHelpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    width: '100%',
  },
  fieldLabelInRow: {
    flex: 1,
    flexShrink: 1,
    // Allow text to wrap to multiple lines without being clipped when siblings change size
    flexBasis: 0,
    minWidth: 0,
    lineHeight: 22,
    marginBottom: 0,
  },
  helpIconButton: {
    marginLeft: Spacing.xs,
    marginTop: 2,
    flexShrink: 0,
  },
  helpIcon: {
    margin: 0,
  },
  suffixText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    marginTop: -Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  inlineFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  inlineInputContainer: {
    width: 70, // Width for 3 characters (e.g., "100") with padding
  },
  inlinePercentageInput: {
    marginBottom: 0,
  },
  inlinePercentSymbol: {
    fontSize: Typography.fontSize.md, // Same as input text (16px)
    fontWeight: Typography.fontWeight.semibold, // Same as RadioGroup label
    color: KindlingColors.navy,
  },
  inlineLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold, // Same as RadioGroup label
    color: KindlingColors.navy,
  },
  disabledInputContainer: {
    opacity: 0.5,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
  },
});

