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

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Input, Select, RadioGroup, Checkbox, CurrencyInput, PercentageInput } from '../../../src/components/ui';
import { BeneficiaryWithPercentages } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { BeneficiaryAssignment } from '../../../src/types';

/**
 * Trust data structure
 */
interface TrustData {
  // Base fields (3)
  trustName: string;
  trustType: 'life_interest' | 'bare' | 'discretionary' | '';
  trustRole: string; // Options depend on trust type
  
  // Life Interest Settlor fields (11)
  reservedBenefit: string;
  payingMarketRent: string;
  creationMonth: string;
  creationYear: string;
  propertyValueAtTransfer: number;
  chainedTrustStructure: boolean;
  lifeInterestEndingEvents: string;
  
  // Life Interest Beneficiary fields
  benefitType: string; // 'life_interest' or 'remainderman'
  settlorStillLiving: string;
  lifeInterestBeganOnPassing: string;
  lifeInterestBeganWhen: string;
  interestType: string;
  shareLifeInterestWithOthers: string;
  lifeInterestPercentage: number;
  hasComplexCircumstances: boolean;
  
  // Remainderman fields
  capitalInterestPercentage: number;
  lifeTenantAge: string;
  knownContingencies: string;
  
  // Bare Trust Settlor & Beneficiary fields
  currentlyLiveInProperty: string;
  bareValueAtTransfer: number;
  
  // Discretionary Trust fields
  discretionaryTransferMonth: string;
  discretionaryTransferYear: string;
  discretionaryValueAtTransfer: number;
  discretionaryComplexSituation: boolean;
  
  // Discretionary Beneficiary fields
  discretionaryBeneficiaryRightToCollapse: 'yes' | 'no' | 'not_sure' | '';
  discretionaryBeneficiaryDefaultEntitlement: 'yes' | 'no' | 'not_sure' | '';
}

export default function PropertyTrustDetailsScreen() {
  const { personActions, beneficiaryGroupActions } = useAppState();

  // Base trust data
  const [trustData, setTrustData] = useState<TrustData>({
    trustName: '',
    trustType: '',
    trustRole: '',
    // Life Interest Settlor
    reservedBenefit: '',
    payingMarketRent: '',
    creationMonth: '',
    creationYear: '',
    propertyValueAtTransfer: 0,
    chainedTrustStructure: false,
    lifeInterestEndingEvents: '',
    // Life Interest Beneficiary
    benefitType: '',
    settlorStillLiving: '',
    lifeInterestBeganOnPassing: '',
    lifeInterestBeganWhen: '',
    interestType: '',
    shareLifeInterestWithOthers: '',
    lifeInterestPercentage: 0,
    hasComplexCircumstances: false,
    // Remainderman
    capitalInterestPercentage: 0,
    lifeTenantAge: '',
    knownContingencies: '',
    // Bare Trust Settlor & Beneficiary
    currentlyLiveInProperty: '',
    bareValueAtTransfer: 0,
    // Discretionary Trust
    discretionaryTransferMonth: '',
    discretionaryTransferYear: '',
    discretionaryValueAtTransfer: 0,
    discretionaryComplexSituation: false,
    // Discretionary Beneficiary
    discretionaryBeneficiaryRightToCollapse: '',
    discretionaryBeneficiaryDefaultEntitlement: '',
  });

  // Remaindermen (for Life Interest Settlor and optional for Life Interest Beneficiary)
  const [remaindermen, setRemaindermen] = useState<BeneficiaryAssignment[]>([]);
  
  // Beneficiaries (for Bare Trust Settlor)
  const [bareBeneficiaries, setBareBeneficiaries] = useState<BeneficiaryAssignment[]>([]);
  
  // Co-beneficiaries (for Bare Trust Beneficiary and Settlor & Beneficiary)
  const [bareCoBeneficiaries, setBareCoBeneficiaries] = useState<BeneficiaryAssignment[]>([]);

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
    switch (trustData.trustType) {
      case 'life_interest':
        return [
          { label: 'Beneficiary', value: 'beneficiary' },
          { label: 'Settlor', value: 'settlor' },
        ];
      case 'bare':
      case 'discretionary':
        return [
          { label: 'Beneficiary', value: 'beneficiary' },
          { label: 'Settlor', value: 'settlor' },
          { label: 'Settlor & Beneficiary', value: 'settlor_and_beneficiary' },
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
      case 'life_interest_settlor':
        return renderLifeInterestSettlorFieldset();
      case 'life_interest_beneficiary':
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

  // Life Interest Trust → Settlor Fieldset (11 fields)
  const renderLifeInterestSettlorFieldset = () => {
    const hasOccupationBenefit = trustData.reservedBenefit.includes('occupy');
    const hasAnyBenefit = trustData.reservedBenefit && trustData.reservedBenefit !== 'none';
    const showGROBWarning = hasOccupationBenefit && trustData.payingMarketRent === 'no';
    const showInfoBox = (!hasAnyBenefit || trustData.payingMarketRent === 'yes') && trustData.reservedBenefit;

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          As the settlor who transferred this property into a life interest trust, we need details about the trust structure and any benefits you may have reserved.
        </Text>

        <Select
          label="Reserved benefit when creating trust? *"
          placeholder="Select reserved benefit..."
          value={trustData.reservedBenefit}
          options={[
            { label: 'None', value: 'none' },
            { label: 'Income only', value: 'income_only' },
            { label: 'Right to occupy only', value: 'occupy_only' },
            { label: 'Income and occupation', value: 'income_and_occupation' },
          ]}
          onChange={(value) => updateTrustData('reservedBenefit', value)}
        />

        {hasOccupationBenefit && (
          <RadioGroup
            label="Paying market rent? *"
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            value={trustData.payingMarketRent}
            onChange={(value) => updateTrustData('payingMarketRent', value)}
          />
        )}

        {/* GROB Warning */}
        {showGROBWarning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Gift with Reservation of Benefit (GROB)</Text>
            <Text style={styles.warningText}>
              This will be considered a 'gift with reservation' and the property will be included in your estate for inheritance tax purposes.
            </Text>
          </View>
        )}

        {/* Info Box */}
        {showInfoBox && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You're no longer the owner. Trust deed dictates enjoyment and ownership, not your will. We'll take critical details to pass to your executor.
            </Text>
          </View>
        )}

        {/* Trust Creation Date */}
        <Text style={styles.fieldLabel}>Trust Creation Date *</Text>
        <Text style={styles.helperText}>
          For tracking 7-year rule (tapered IHT if you die within 7 years of creating trust)
        </Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Select
              placeholder="Month..."
              value={trustData.creationMonth}
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
              onChange={(value) => updateTrustData('creationMonth', value)}
            />
          </View>
          <View style={styles.dateField}>
            <Select
              placeholder="Year..."
              value={trustData.creationYear}
              options={Array.from({ length: 100 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { label: year.toString(), value: year.toString() };
              })}
              onChange={(value) => updateTrustData('creationYear', value)}
            />
          </View>
        </View>

        <CurrencyInput
          label="Property value when transferred to trust *"
          placeholder="Enter value at transfer..."
          value={trustData.propertyValueAtTransfer}
          onValueChange={(value) => updateTrustData('propertyValueAtTransfer', value)}
        />

        <Checkbox
          label="Chained trust structure?"
          checked={trustData.chainedTrustStructure}
          onCheckedChange={(value) => updateTrustData('chainedTrustStructure', value)}
        />
        {trustData.chainedTrustStructure && (
          <Text style={styles.helperText}>
            Property passes from one life interest holder to another through successive life interests. May involve complicated IPDI considerations - our team will contact you.
          </Text>
        )}

        {/* TODO: Trustees (PersonSelector multi) - Phase 10 integration */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Trustees: PersonSelector integration pending (Phase 10)
          </Text>
        </View>

        {/* TODO: Life Interest Beneficiaries (PersonSelector with metadata) - Phase 10 integration */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Life Interest Beneficiaries: PersonSelector integration pending (Phase 10)
          </Text>
        </View>

        {/* Remaindermen */}
        <Text style={styles.fieldLabel}>Remaindermen *</Text>
        <Text style={styles.helperText}>
          Who inherits property after life interests end? Percentages must total 100%.
        </Text>
        <BeneficiaryWithPercentages
          allocationMode="percentage"
          value={remaindermen}
          onChange={setRemaindermen}
          personActions={personActions}
          beneficiaryGroupActions={beneficiaryGroupActions}
          label="Remaindermen"
          onAddNewPerson={() => {
            alert('Add person functionality to be implemented');
          }}
          onAddNewGroup={() => {
            alert('Add group functionality to be implemented');
          }}
        />

        <Input
          label="Events ending life interest"
          placeholder="e.g., Life interest ends on remarriage or moving out of property..."
          value={trustData.lifeInterestEndingEvents}
          onChangeText={(value) => updateTrustData('lifeInterestEndingEvents', value)}
          multiline
        />
        <Text style={styles.helperText}>
          Conditions that would end life interest early (e.g., remarriage, cohabitation, moving out)
        </Text>
      </View>
    );
  };

  const renderLifeInterestBeneficiaryFieldset = () => {
    const isLifeInterest = trustData.benefitType === 'life_interest';
    const isRemainderman = trustData.benefitType === 'remainderman';

    return (
      <View style={styles.fieldsetContent}>
        <Text style={styles.helperText}>
          As a beneficiary of a life interest trust, first tell us what type of interest you have.
        </Text>

        <RadioGroup
          label="Benefit Type *"
          options={[
            { label: 'Life Interest Beneficiary', value: 'life_interest' },
            { label: 'Remainderman', value: 'remainderman' },
          ]}
          value={trustData.benefitType}
          onChange={(value) => updateTrustData('benefitType', value)}
        />

        {/* Life Interest Path (10 fields) */}
        {isLifeInterest && (
          <>
            {/* TODO: Settlor PersonSelector - Phase 10 integration */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Settlor selection: PersonSelector integration pending
              </Text>
            </View>

            <RadioGroup
              label="Is settlor still living? *"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={trustData.settlorStillLiving}
              onChange={(value) => updateTrustData('settlorStillLiving', value)}
            />

            {trustData.settlorStillLiving === 'no' && (
              <>
                <RadioGroup
                  label="Did life interest begin immediately on their passing? *"
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                  ]}
                  value={trustData.lifeInterestBeganOnPassing}
                  onChange={(value) => updateTrustData('lifeInterestBeganOnPassing', value)}
                />

                {trustData.lifeInterestBeganOnPassing === 'no' && (
                  <Select
                    label="It began: *"
                    placeholder="Select when interest began..."
                    value={trustData.lifeInterestBeganWhen}
                    options={[
                      { label: 'On death of preceding life interest holder', value: 'on_preceding_death' },
                      { label: 'During their lifetime', value: 'during_lifetime' },
                    ]}
                    onChange={(value) => updateTrustData('lifeInterestBeganWhen', value)}
                  />
                )}
              </>
            )}

            <Select
              label="Interest type *"
              placeholder="Select interest type..."
              value={trustData.interestType}
              options={[
                { label: 'Occupation only', value: 'occupation_only' },
                { label: 'Income only', value: 'income_only' },
                { label: 'Income and Occupation', value: 'income_and_occupation' },
              ]}
              onChange={(value) => updateTrustData('interestType', value)}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Life interests are included in your estate for inheritance tax purposes. Note: You cannot pass on the interest - the trust deed dictates what happens on your passing.
              </Text>
            </View>

            <RadioGroup
              label="Share life interest with others?"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={trustData.shareLifeInterestWithOthers}
              onChange={(value) => updateTrustData('shareLifeInterestWithOthers', value)}
            />

            {trustData.shareLifeInterestWithOthers === 'yes' && (
              <PercentageInput
                label="Your % of life interest *"
                placeholder="Enter your percentage..."
                value={trustData.lifeInterestPercentage}
                onValueChange={(value) => updateTrustData('lifeInterestPercentage', value)}
              />
            )}

            {/* Optional remaindermen for visualization */}
            <Text style={styles.fieldLabel}>Remaindermen (Optional)</Text>
            <Text style={styles.helperText}>
              Though not yours to give, we can include in visualization of who gets what on your passing
            </Text>
            <BeneficiaryWithPercentages
              allocationMode="percentage"
              value={remaindermen}
              onChange={setRemaindermen}
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              label="Remaindermen"
              onAddNewPerson={() => alert('Add person functionality to be implemented')}
              onAddNewGroup={() => alert('Add group functionality to be implemented')}
            />

            <Checkbox
              label="More complicated? Check here, we'll contact you."
              checked={trustData.hasComplexCircumstances}
              onCheckedChange={(value) => updateTrustData('hasComplexCircumstances', value)}
            />
          </>
        )}

        {/* Remainderman Path (5 fields) */}
        {isRemainderman && (
          <>
            <PercentageInput
              label="Your % of capital interest *"
              placeholder="Enter your percentage..."
              value={trustData.capitalInterestPercentage}
              onValueChange={(value) => updateTrustData('capitalInterestPercentage', value)}
            />

            {/* TODO: Life Tenant PersonSelector - Phase 10 integration */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Life Tenant selection: PersonSelector integration pending
              </Text>
            </View>

            <Input
              label="Life tenant age estimate"
              placeholder="Approximate age..."
              value={trustData.lifeTenantAge}
              onChangeText={(value) => updateTrustData('lifeTenantAge', value)}
              type="number"
            />
            <Text style={styles.helperText}>
              Approximate age helps estimate when remainder interest might vest
            </Text>

            <Input
              label="Known contingencies"
              placeholder="e.g., Interest contingent on surviving life tenant..."
              value={trustData.knownContingencies}
              onChangeText={(value) => updateTrustData('knownContingencies', value)}
              multiline
            />
            <Text style={styles.helperText}>
              If your interest is contingent on you surviving life tenant, or other conditions, note here
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                If you survive the life tenant: Property becomes yours and passes per your will.{'\n\n'}
                If you die first: Your remainder interest passes to your chosen beneficiaries (unless contingent on surviving).
              </Text>
            </View>

            {/* TODO: Trustees PersonSelector - Phase 10 integration */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Trustees: PersonSelector integration pending
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderBareSettlorFieldset = () => (
    <View style={styles.fieldsetContent}>
      <Text style={styles.helperText}>
        The bare trust beneficiaries own the property absolutely. This property will not be a part of your estate for inheritance tax purposes, unless you die within 7 years of creating the trust. These details help with "7-year rule" calculations.
      </Text>

      {/* Trust Creation Date */}
      <Text style={styles.fieldLabel}>Trust Creation Date *</Text>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Select
            placeholder="Month..."
            value={trustData.creationMonth}
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
            onChange={(value) => updateTrustData('creationMonth', value)}
          />
        </View>
        <View style={styles.dateField}>
          <Select
            placeholder="Year..."
            value={trustData.creationYear}
            options={Array.from({ length: 100 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return { label: year.toString(), value: year.toString() };
            })}
            onChange={(value) => updateTrustData('creationYear', value)}
          />
        </View>
      </View>

      <CurrencyInput
        label="Property value when transferred *"
        placeholder="Enter value at transfer..."
        value={trustData.bareValueAtTransfer}
        onValueChange={(value) => updateTrustData('bareValueAtTransfer', value)}
      />

      {/* Beneficiaries */}
      <Text style={styles.fieldLabel}>Beneficiaries *</Text>
      <BeneficiaryWithPercentages
        allocationMode="percentage"
        value={bareBeneficiaries}
        onChange={setBareBeneficiaries}
        personActions={personActions}
        beneficiaryGroupActions={beneficiaryGroupActions}
        label="Bare Trust Beneficiaries"
        onAddNewPerson={() => alert('Add person functionality to be implemented')}
        onAddNewGroup={() => alert('Add group functionality to be implemented')}
      />
    </View>
  );

  const renderBareBeneficiaryFieldset = () => (
    <View style={styles.fieldsetContent}>
      <Text style={styles.helperText}>
        Bare trust beneficiaries own the property absolutely. As a beneficiary, you have absolute ownership.
      </Text>

      {/* Co-beneficiaries (Optional) */}
      <Text style={styles.fieldLabel}>Co-beneficiaries (Optional)</Text>
      <Text style={styles.helperText}>
        Others who share absolute ownership
      </Text>
      <BeneficiaryWithPercentages
        allocationMode="percentage"
        value={bareCoBeneficiaries}
        onChange={setBareCoBeneficiaries}
        personActions={personActions}
        beneficiaryGroupActions={beneficiaryGroupActions}
        label="Co-beneficiaries"
        onAddNewPerson={() => alert('Add person functionality to be implemented')}
        onAddNewGroup={() => alert('Add group functionality to be implemented')}
      />

      {/* TODO: Trustees PersonSelector - Phase 10 integration */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Trustees: PersonSelector integration pending. For executor information.
        </Text>
      </View>
    </View>
  );

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

        <CurrencyInput
          label="Property value at point of transfer *"
          placeholder="Enter value at transfer..."
          value={trustData.bareValueAtTransfer}
          onValueChange={(value) => updateTrustData('bareValueAtTransfer', value)}
        />
        <Text style={styles.helperText}>
          Value when property was transferred into the bare trust
        </Text>

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
          onAddNewPerson={() => alert('Add person functionality to be implemented')}
          onAddNewGroup={() => alert('Add group functionality to be implemented')}
        />

        {/* TODO: Trustees PersonSelector - Phase 10 integration */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Trustees: PersonSelector integration pending
          </Text>
        </View>
      </View>
    );
  };

  const renderDiscretionarySettlorFieldset = () => (
    <View style={styles.fieldsetContent}>
      <Text style={styles.helperText}>
        As the settlor who transferred property into a discretionary trust, we need the transfer details for 7-year rule calculations.
      </Text>

      {/* Transfer Date */}
      <Text style={styles.fieldLabel}>Month and year of property transferred into trust *</Text>
      <Text style={styles.helperText}>
        For 7-year rule tracking
      </Text>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Select
            placeholder="Month..."
            value={trustData.discretionaryTransferMonth}
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
            onChange={(value) => updateTrustData('discretionaryTransferMonth', value)}
          />
        </View>
        <View style={styles.dateField}>
          <Select
            placeholder="Year..."
            value={trustData.discretionaryTransferYear}
            options={Array.from({ length: 100 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return { label: year.toString(), value: year.toString() };
            })}
            onChange={(value) => updateTrustData('discretionaryTransferYear', value)}
          />
        </View>
      </View>

      <CurrencyInput
        label="Value at time of transfer *"
        placeholder="Enter value at transfer..."
        value={trustData.discretionaryValueAtTransfer}
        onValueChange={(value) => updateTrustData('discretionaryValueAtTransfer', value)}
      />
    </View>
  );

  const renderDiscretionaryBeneficiaryFieldset = () => (
    <View style={styles.fieldsetContent}>
      {/* Empty - questions moved to base section */}
    </View>
  );

  const renderDiscretionarySettlorAndBeneficiaryFieldset = () => (
    <View style={styles.fieldsetContent}>
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Settlor-Interested Trust</Text>
        <Text style={styles.warningText}>
          This appears to be a settlor-interested trust. The property will remain in your estate for inheritance tax purposes as you have a beneficial interest.
        </Text>
      </View>

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
    if (!trustData.trustName || !trustData.trustType || !trustData.trustRole) {
      return false;
    }

    // Life Interest Settlor validation
    if (trustData.trustType === 'life_interest' && trustData.trustRole === 'settlor') {
      const hasOccupationBenefit = trustData.reservedBenefit.includes('occupy');
      
      return (
        trustData.reservedBenefit !== '' &&
        (!hasOccupationBenefit || trustData.payingMarketRent !== '') &&
        trustData.creationMonth !== '' &&
        trustData.creationYear !== '' &&
        trustData.propertyValueAtTransfer > 0 &&
        remaindermen.length > 0
      );
    }

    // Life Interest Beneficiary validation
    if (trustData.trustType === 'life_interest' && trustData.trustRole === 'beneficiary') {
      if (!trustData.benefitType) return false;
      
      // Life Interest path
      if (trustData.benefitType === 'life_interest') {
        const needsBeganWhen = trustData.settlorStillLiving === 'no' && trustData.lifeInterestBeganOnPassing === 'no';
        const needsPercentage = trustData.shareLifeInterestWithOthers === 'yes';
        
        return (
          trustData.settlorStillLiving !== '' &&
          trustData.interestType !== '' &&
          (!needsBeganWhen || trustData.lifeInterestBeganWhen !== '') &&
          (!needsPercentage || trustData.lifeInterestPercentage > 0)
        );
      }
      
      // Remainderman path
      if (trustData.benefitType === 'remainderman') {
        return trustData.capitalInterestPercentage > 0;
      }
    }

    // Bare Trust Settlor validation
    if (trustData.trustType === 'bare' && trustData.trustRole === 'settlor') {
      return (
        trustData.creationMonth !== '' &&
        trustData.creationYear !== '' &&
        trustData.bareValueAtTransfer > 0 &&
        bareBeneficiaries.length > 0
      );
    }

    // Bare Trust Beneficiary validation (all optional)
    if (trustData.trustType === 'bare' && trustData.trustRole === 'beneficiary') {
      return true; // All fields optional
    }

    // Bare Trust Settlor & Beneficiary validation
    if (trustData.trustType === 'bare' && trustData.trustRole === 'settlor_and_beneficiary') {
      return (
        trustData.currentlyLiveInProperty !== '' &&
        trustData.bareValueAtTransfer > 0
      );
    }

    // Discretionary Trust Settlor validation
    if (trustData.trustType === 'discretionary' && trustData.trustRole === 'settlor') {
      return (
        trustData.discretionaryTransferMonth !== '' &&
        trustData.discretionaryTransferYear !== '' &&
        trustData.discretionaryValueAtTransfer > 0
      );
    }

    // Discretionary Trust Beneficiary validation
    if (trustData.trustType === 'discretionary' && trustData.trustRole === 'beneficiary') {
      return (
        trustData.discretionaryBeneficiaryRightToCollapse !== '' &&
        trustData.discretionaryBeneficiaryDefaultEntitlement !== ''
      );
    }

    // Discretionary Trust Settlor & Beneficiary validation
    if (trustData.trustType === 'discretionary' && trustData.trustRole === 'settlor_and_beneficiary') {
      return true; // Just warning + optional checkbox
    }

    return true;
  };

  const handleSave = () => {
    // TODO: Save trust data to property
    // TODO: Return to PropertySummaryScreen
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
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
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
              ]}
              onChange={(value) => updateTrustData('trustType', value as any)}
            />

            {trustData.trustType && (
              <RadioGroup
                label="Your Role in Trust *"
                options={getRoleOptions()}
                value={trustData.trustRole}
                onChange={(value) => updateTrustData('trustRole', value)}
              />
            )}

            {/* Discretionary Beneficiary Additional Questions */}
            {trustData.trustType === 'discretionary' && trustData.trustRole === 'beneficiary' && (
              <>
                <RadioGroup
                  label="Do all beneficiaries have the right to collapse the trust? *"
                  value={trustData.discretionaryBeneficiaryRightToCollapse}
                  onChange={(value) => updateTrustData('discretionaryBeneficiaryRightToCollapse', value)}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                    { label: 'Not sure', value: 'not_sure' },
                  ]}
                  style={styles.compactRadioGroup}
                />

                <RadioGroup
                  label="Does the trust give you a default entitlement? *"
                  value={trustData.discretionaryBeneficiaryDefaultEntitlement}
                  onChange={(value) => updateTrustData('discretionaryBeneficiaryDefaultEntitlement', value)}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                    { label: 'Not sure', value: 'not_sure' },
                  ]}
                  style={styles.compactRadioGroup}
                />

                {(() => {
                  const hasCollapse = trustData.discretionaryBeneficiaryRightToCollapse === 'yes';
                  const hasEntitlement = trustData.discretionaryBeneficiaryDefaultEntitlement === 'yes';
                  const needsReview = hasCollapse || hasEntitlement;
                  
                  return needsReview ? (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        ℹ️ Our team will reach out to you to clarify important details once the asset entry process is complete.
                      </Text>
                    </View>
                  ) : (
                    <Checkbox
                      label="If you think your situation may be more complicated than this, check this box and we'll reach out to you."
                      checked={trustData.discretionaryComplexSituation}
                      onCheckedChange={(value) => updateTrustData('discretionaryComplexSituation', value)}
                    />
                  );
                })()}
              </>
            )}
          </View>

          {/* Conditional Fieldset based on type + role */}
          {trustData.trustType && trustData.trustRole && (
            <View style={styles.section}>
              {renderFieldset()}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button 
          onPress={handleSave}
          variant="primary"
          disabled={!isFormValid()}
        >
          Save Trust Details
        </Button>
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
    gap: Spacing.md,
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
  compactRadioGroup: {
    marginVertical: 0, // Remove RadioGroup's default 16px margin
    marginBottom: 0,
    marginTop: 0,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
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
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
  },
});

