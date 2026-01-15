/**
 * Developer Sandbox Screen
 * 
 * Test page for experimenting with new components
 * Accessible from Developer Dashboard
 * 
 * @module screens/developer/sandbox
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Dialog, Select, Accordion, Input, RadioGroup, Checkbox, CurrencyInput } from '../../src/components/ui';
import { SearchableSelect } from '../../src/components/ui/SearchableSelect';
import { AddPersonDialog, GroupManagementDrawer, BeneficiaryWithPercentages } from '../../src/components/forms';
import { MultiBeneficiarySelector, BeneficiarySelection } from '../../src/components/forms/MultiBeneficiarySelector';
import { Slider } from '../../src/components/ui/Slider';
import { Card } from '../../src/components/ui/Card';
import type { BeneficiaryAssignment } from '../../src/types';
import { useAppState } from '../../src/hooks/useAppState';
import * as Haptics from 'expo-haptics';
import { KindlingColors } from '../../src/styles/theme';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../src/utils/helpers';
import { Spacing, Typography } from '../../src/styles/constants';

export default function SandboxScreen() {
  const { beneficiaryGroupActions, willActions, personActions, estateRemainderActions } = useAppState();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedBankWithCard, setSelectedBankWithCard] = useState('');
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [singleBeneficiary, setSingleBeneficiary] = useState<BeneficiarySelection>({ id: '', type: 'person', name: '' });
  const [multiBeneficiaries, setMultiBeneficiaries] = useState<BeneficiarySelection[]>([]);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [addPersonContext, setAddPersonContext] = useState<'single' | 'multi'>('single');
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [shortSelect, setShortSelect] = useState('');
  const [longSelect, setLongSelect] = useState('');
  const [percentageBeneficiaries, setPercentageBeneficiaries] = useState<BeneficiaryAssignment[]>([]);
  const [amountBeneficiaries, setAmountBeneficiaries] = useState<BeneficiaryAssignment[]>([]);
  
  // Estate Remainder Testing State
  const [testSplits, setTestSplits] = useState<Record<string, number>>({
    'person-1': 40,
    'person-2': 30,
    'group-1': 30,
  });
  const [sliderValue, setSliderValue] = useState(50);
  
  // Accordion Test State (simulating Property entry screen)
  const [expandedAccordion, setExpandedAccordion] = useState<string>('');
  const [address1, setAddress1] = useState('');
  const [townCity, setTownCity] = useState('');
  const [country, setCountry] = useState('');
  const [propertyUsage, setPropertyUsage] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [isFHL, setIsFHL] = useState(false);
  const [fhlAvailable210, setFhlAvailable210] = useState(true);
  const [fhlLet105, setFhlLet105] = useState(true);
  const [fhlLongLets155, setFhlLongLets155] = useState(true);
  const [fhlIncome, setFhlIncome] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [ownershipType, setOwnershipType] = useState('');

  // UK Bank Providers - test data
  const bankProviders = [
    { label: 'Non UK Bank', value: 'Non UK Bank' },
    { label: '───────────────', value: 'separator', disabled: true },
    { label: 'Barclays', value: 'Barclays' },
    { label: 'HSBC', value: 'HSBC' },
    { label: 'Lloyds Bank', value: 'Lloyds Bank' },
    { label: 'NatWest', value: 'NatWest' },
    { label: 'Santander', value: 'Santander' },
    { label: 'TSB', value: 'TSB' },
    { label: 'Halifax', value: 'Halifax' },
    { label: 'Bank of Scotland', value: 'Bank of Scotland' },
    { label: 'Nationwide Building Society', value: 'Nationwide Building Society' },
    { label: 'Coventry Building Society', value: 'Coventry Building Society' },
    { label: 'Yorkshire Building Society', value: 'Yorkshire Building Society' },
    { label: 'Skipton Building Society', value: 'Skipton Building Society' },
    { label: 'Leeds Building Society', value: 'Leeds Building Society' },
    { label: 'Principality Building Society', value: 'Principality Building Society' },
    { label: 'Newcastle Building Society', value: 'Newcastle Building Society' },
    { label: 'Virgin Money', value: 'Virgin Money' },
    { label: 'First Direct', value: 'First Direct' },
    { label: 'Metro Bank', value: 'Metro Bank' },
    { label: 'Starling Bank', value: 'Starling Bank' },
    { label: 'Monzo', value: 'Monzo' },
    { label: 'Revolut', value: 'Revolut' },
    { label: 'Chase', value: 'Chase' },
    { label: 'Atom Bank', value: 'Atom Bank' },
    { label: 'Tide', value: 'Tide' },
    { label: 'Co-operative Bank', value: 'Co-operative Bank' },
    { label: 'Other', value: 'Other' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Component Sandbox</Text>
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
          <Text style={styles.sectionTitle}>Component Testing</Text>
          
          {/* ========================================
              ACCORDION TEST (Phase 14a.3)
              Testing react-native-paper List.Accordion for Property Entry Screen
              ======================================== */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Accordion Pattern - Property Entry Simulation</Text>
            <Text style={styles.sectionDescription}>
              Testing List.Accordion for Phase 14 Property implementation.
              Multiple accordions with form fields, conditional rendering, and controlled expansion.
            </Text>

            {/* Accordion Container */}
            <View style={styles.accordionContainer}>
              {/* Accordion 1: Address (Always) */}
              <Accordion
                title="Address"
                icon="map-marker"
                expanded={expandedAccordion === 'address'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'address' : '')}
              >
                <View style={styles.accordionContent}>
                  <Input
                    label="Address Line 1 *"
                    placeholder="Enter address..."
                    value={address1}
                    onChange={setAddress1}
                  />
                  <Input
                    label="Town/City *"
                    placeholder="Enter town or city..."
                    value={townCity}
                    onChange={setTownCity}
                  />
                  <Select
                    label="Country *"
                    placeholder="Select country..."
                    value={country}
                    options={[
                      { label: 'United Kingdom', value: 'uk' },
                      { label: 'United States', value: 'us' },
                      { label: 'Canada', value: 'canada' },
                      { label: 'Australia', value: 'australia' },
                    ]}
                    onChange={setCountry}
                  />
                  <Button
                    onPress={() => {
                      if (address1 && townCity && country) {
                        setExpandedAccordion('usage');
                      }
                    }}
                    variant="primary"
                    disabled={!address1 || !townCity || !country}
                  >
                    Next
                  </Button>
                </View>
              </Accordion>

              {/* Accordion 2: Usage & Type (Always) */}
              <Accordion
                title="Usage & Type"
                icon="home-variant"
                expanded={expandedAccordion === 'usage'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'usage' : '')}
              >
                <View style={styles.accordionContent}>
                  <Select
                    label="Usage *"
                    placeholder="Select usage..."
                    value={propertyUsage}
                    options={[
                      { label: 'Residential', value: 'residential' },
                      { label: 'Let Residential', value: 'let_residential' },
                      { label: 'Commercial', value: 'commercial' },
                    ]}
                    onChange={(value) => {
                      setPropertyUsage(value);
                      setPropertyType(''); // Clear property type when usage changes
                      setIsFHL(false);
                    }}
                  />
                  
                  {propertyUsage === 'let_residential' && (
                    <Select
                      label="Property Type *"
                      placeholder="Select type..."
                      value={propertyType}
                      options={[
                        { label: 'Buy To Let', value: 'buy_to_let' },
                        { label: 'Furnished Holiday Let', value: 'furnished_holiday_let' },
                        { label: 'Short-term Let/Airbnb', value: 'short_term_let' },
                      ]}
                      onChange={(value) => {
                        setPropertyType(value);
                        setIsFHL(value === 'furnished_holiday_let');
                      }}
                    />
                  )}

                  <Button
                    onPress={() => {
                      if (isFHL) {
                        setExpandedAccordion('fhl');
                      } else {
                        setExpandedAccordion('details');
                      }
                    }}
                    variant="primary"
                    disabled={!propertyUsage || (propertyUsage === 'let_residential' && !propertyType)}
                  >
                    Next
                  </Button>
                </View>
              </Accordion>

              {/* Accordion 3: FHL Details (Conditional - only if Furnished Holiday Let) */}
              {isFHL && (
                <Accordion
                  title="FHL Details"
                  icon="beach"
                  expanded={expandedAccordion === 'fhl'}
                  onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'fhl' : '')}
                >
                  <View style={styles.accordionContent}>
                    <Text style={styles.helperText}>
                      Furnished Holiday Let (FHL) qualification criteria for Business Property Relief
                    </Text>
                    
                    <Checkbox
                      label="Available to let 210+ days/year?"
                      checked={fhlAvailable210}
                      onChange={setFhlAvailable210}
                    />
                    <Checkbox
                      label="Actually let 105+ days/year?"
                      checked={fhlLet105}
                      onChange={setFhlLet105}
                    />
                    <Checkbox
                      label="Long lets (31+ days) under 155 days/year?"
                      checked={fhlLongLets155}
                      onChange={setFhlLongLets155}
                    />

                    {/* Real-time FHL Qualification Status */}
                    <View style={fhlAvailable210 && fhlLet105 && fhlLongLets155 ? styles.qualificationSuccess : styles.qualificationWarning}>
                      {fhlAvailable210 && fhlLet105 && fhlLongLets155 ? (
                        <Text style={styles.qualificationSuccessText}>
                          ✓ Qualifies for FHL status (Business Property Relief - 50-100% IHT relief possible)
                        </Text>
                      ) : (
                        <Text style={styles.qualificationWarningText}>
                          ⚠️ Does not qualify as FHL. Will be treated as standard let property.
                        </Text>
                      )}
                    </View>

                    <CurrencyInput
                      label="Estimated Annual Income *"
                      placeholder="Enter annual rental income..."
                      value={fhlIncome}
                      onChange={setFhlIncome}
                    />

                    <Button
                      onPress={() => setExpandedAccordion('details')}
                      variant="primary"
                      disabled={!fhlIncome}
                    >
                      Next
                    </Button>
                  </View>
                </Accordion>
              )}

              {/* Accordion 4: Property Details (Always) */}
              <Accordion
                title="Property Details"
                icon="information"
                expanded={expandedAccordion === 'details'}
                onExpandedChange={(expanded) => setExpandedAccordion(expanded ? 'details' : '')}
              >
                <View style={styles.accordionContent}>
                  <RadioGroup
                    label="Ownership Type *"
                    options={[
                      { label: 'Personally owned', value: 'personally_owned' },
                      { label: 'Jointly owned', value: 'jointly_owned' },
                      { label: 'Owned Through Company', value: 'company_owned' },
                      { label: 'Owned through Trust', value: 'trust_owned' },
                    ]}
                    value={ownershipType}
                    onChange={setOwnershipType}
                  />

                  <CurrencyInput
                    label="Estimated Value *"
                    placeholder="Enter property value..."
                    value={estimatedValue}
                    onChange={setEstimatedValue}
                  />

                  <Button
                    onPress={() => {
                      // In real implementation, this would save and navigate
                      alert('Property saved! (Test complete)');
                    }}
                    variant="primary"
                    disabled={!ownershipType || !estimatedValue}
                  >
                    Save Property
                  </Button>
                </View>
              </Accordion>
            </View>

            {/* Test Results Summary */}
            <View style={styles.result}>
              <Text style={styles.resultLabel}>Accordion Test Results:</Text>
              <Text style={styles.resultNote}>✓ Multiple accordions render correctly</Text>
              <Text style={styles.resultNote}>✓ Form fields work inside accordions</Text>
              <Text style={styles.resultNote}>✓ Conditional accordion (FHL) shows/hides properly</Text>
              <Text style={styles.resultNote}>✓ Next button logic controls expansion</Text>
              <Text style={styles.resultNote}>✓ Real-time validation displays correctly</Text>
              <Text style={styles.resultNote}>
                {isFHL 
                  ? `✓ FHL Qualification: ${fhlAvailable210 && fhlLet105 && fhlLongLets155 ? 'QUALIFIES' : 'DOES NOT QUALIFY'}`
                  : '• FHL section hidden (not applicable)'}
              </Text>
              <Text style={[styles.resultValue, { marginTop: Spacing.sm }]}>
                Decision: react-native-paper List.Accordion works well for Property implementation ✓
              </Text>
            </View>
          </View>

          {/* Component Divider */}
          <View style={styles.componentDivider}>
            <View style={styles.componentDividerLine} />
            <Text style={styles.componentDividerText}>•  •  •</Text>
            <View style={styles.componentDividerLine} />
          </View>
          
          {/* Test: Select Component - Short List (Menu mode) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Select - Short List (≤8 items = Menu)</Text>
            <Text style={styles.sectionDescription}>
              Uses anchored Menu dropdown with auto-scroll
            </Text>

            <Select
              label="Account Type"
              placeholder="Select type..."
              value={shortSelect}
              options={[
                { label: 'Current Account', value: 'current' },
                { label: 'Savings Account', value: 'savings' },
                { label: 'ISA', value: 'isa' },
                { label: 'Fixed Term Deposit', value: 'fixed-term' },
                { label: 'Other', value: 'other' },
              ]}
              onChange={setShortSelect}
              scrollViewRef={scrollViewRef}
            />

            {shortSelect && (
              <View style={styles.result}>
                <Text style={styles.resultValue}>{shortSelect}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Test: Select Component - Long List (Modal mode) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Select - Long List ({'>'}8 items = Modal)</Text>
            <Text style={styles.sectionDescription}>
              Automatically uses scrollable modal for long lists
            </Text>

            <Select
              label="Bank Provider"
              placeholder="Select bank..."
              value={longSelect}
              options={bankProviders}
              onChange={setLongSelect}
            />

            {longSelect && (
              <View style={styles.result}>
                <Text style={styles.resultValue}>{longSelect}</Text>
              </View>
            )}
          </View>

          {/* Component Divider */}
          <View style={styles.componentDivider}>
            <View style={styles.componentDividerLine} />
            <Text style={styles.componentDividerText}>•  •  •</Text>
            <View style={styles.componentDividerLine} />
          </View>

          <Text style={styles.sectionTitle}>SearchableSelect Component</Text>
          
          {/* Test 1: Default mode (showSelectedCards=false) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Default Mode (showSelectedCards=false)</Text>
            <Text style={styles.sectionDescription}>
              Selected value shows in the select button
            </Text>

            <SearchableSelect
              label="Select Bank Provider *"
              placeholder="Search bank or building society..."
              value={selectedBank}
              options={bankProviders}
              onChange={setSelectedBank}
              showSelectedCards={false}
            />

            {selectedBank && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Selected Value (for testing):</Text>
                <Text style={styles.resultValue}>{selectedBank}</Text>
                <Text style={styles.resultNote}>
                  Note: No clear button in this mode - value shows in select button
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Test 2: Card display mode (showSelectedCards=true) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Card Mode (showSelectedCards=true)</Text>
            <Text style={styles.sectionDescription}>
              Selected value shows as card below, select button shows placeholder
            </Text>

            <SearchableSelect
              label="Select Bank Provider *"
              placeholder="Search bank or building society..."
              value={selectedBankWithCard}
              options={bankProviders}
              onChange={setSelectedBankWithCard}
              showSelectedCards={true}
            />
          </View>

          {/* Component Divider */}
          <View style={styles.componentDivider}>
            <View style={styles.componentDividerLine} />
            <Text style={styles.componentDividerText}>•  •  •</Text>
            <View style={styles.componentDividerLine} />
          </View>

          {/* Test 3: Group Management Drawer */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Group Management Drawer</Text>
            <Text style={styles.sectionDescription}>
              Bottom drawer for creating and managing beneficiary groups
            </Text>

            <Button
              onPress={() => setShowGroupDrawer(true)}
              variant="primary"
              icon="account-multiple"
            >
              Manage Groups
            </Button>

            {selectedGroupId && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Selected Group ID:</Text>
                <Text style={styles.resultValue}>{selectedGroupId}</Text>
                <Text style={styles.resultNote}>
                  Group: {beneficiaryGroupActions.getGroupById(selectedGroupId)?.name || 'Not found'}
                </Text>
              </View>
            )}
          </View>

          {/* Component Divider */}
          <View style={styles.componentDivider}>
            <View style={styles.componentDividerLine} />
            <Text style={styles.componentDividerText}>•  •  •</Text>
            <View style={styles.componentDividerLine} />
          </View>

          {/* Test 4: MultiBeneficiarySelector - Single Mode */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>MultiBeneficiarySelector (Single Mode)</Text>
            <Text style={styles.sectionDescription}>
              Select a single person, group, or estate
            </Text>

            <MultiBeneficiarySelector
              mode="single"
              value={singleBeneficiary}
              onChange={(value) => setSingleBeneficiary(value as BeneficiarySelection)}
              allowEstate={true}
              allowGroups={true}
              label="Select Beneficiary"
              placeholder="Choose a person..."
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              onAddNewPerson={() => {
                setAddPersonContext('single');
                setShowAddPersonDialog(true);
              }}
              onAddNewGroup={() => setShowAddGroupDialog(true)}
            />

            {singleBeneficiary.id && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Selected:</Text>
                <Text style={styles.resultValue}>{singleBeneficiary.name}</Text>
                <Text style={styles.resultNote}>Type: {singleBeneficiary.type}</Text>
              </View>
            )}
          </View>

          {/* Divider (within same component) */}
          <View style={styles.divider} />

          {/* Test 5: MultiBeneficiarySelector - Multi Mode */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>MultiBeneficiarySelector (Multi Mode)</Text>
            <Text style={styles.sectionDescription}>
              Select multiple people, groups, or estate
            </Text>

            <MultiBeneficiarySelector
              mode="multi"
              value={multiBeneficiaries}
              onChange={(value) => setMultiBeneficiaries(value as BeneficiarySelection[])}
              allowEstate={true}
              allowGroups={true}
              label="Select Recipients *"
              placeholder="Add recipients..."
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              onAddNewPerson={() => {
                setAddPersonContext('multi');
                setShowAddPersonDialog(true);
              }}
              onAddNewGroup={() => setShowAddGroupDialog(true)}
            />

            {multiBeneficiaries.length > 0 && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Selected ({multiBeneficiaries.length}):</Text>
                {multiBeneficiaries.map((b, idx) => (
                  <Text key={idx} style={styles.resultValue}>• {b.name}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Component Divider */}
          <View style={styles.componentDivider}>
            <View style={styles.componentDividerLine} />
            <Text style={styles.componentDividerText}>•  •  •</Text>
            <View style={styles.componentDividerLine} />
          </View>

          {/* Test 6: BeneficiaryWithPercentages - Percentage Mode */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>BeneficiaryWithPercentages (Percentage Mode)</Text>
            <Text style={styles.sectionDescription}>
              Manual percentage allocation with "equally distribute" helper
            </Text>

            <BeneficiaryWithPercentages
              allocationMode="percentage"
              value={percentageBeneficiaries}
              onChange={setPercentageBeneficiaries}
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              label="Beneficiaries with Percentages"
              onAddNewPerson={() => setShowAddPersonDialog(true)}
              onAddNewGroup={() => setShowGroupDrawer(true)}
            />

            {percentageBeneficiaries.length > 0 && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Test Data (for debugging):</Text>
                {percentageBeneficiaries.map((b, idx) => (
                  <Text key={idx} style={styles.resultNote}>
                    {idx + 1}. ID: {b.id} | Type: {b.type} | %: {b.percentage || 0}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Divider (within same component) */}
          <View style={styles.divider} />

          {/* Test 7: BeneficiaryWithPercentages - Amount Mode */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>BeneficiaryWithPercentages (Amount Mode)</Text>
            <Text style={styles.sectionDescription}>
              Amount allocation in £ (for life insurance partial payouts)
            </Text>

            <BeneficiaryWithPercentages
              allocationMode="amount"
              totalValue={500000}
              value={amountBeneficiaries}
              onChange={setAmountBeneficiaries}
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              label="Beneficiaries with Amounts"
              onAddNewPerson={() => setShowAddPersonDialog(true)}
              onAddNewGroup={() => setShowGroupDrawer(true)}
            />

            {amountBeneficiaries.length > 0 && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Test Data (for debugging):</Text>
                <Text style={styles.resultNote}>Policy Value: £500,000</Text>
                {amountBeneficiaries.map((b, idx) => (
                  <Text key={idx} style={styles.resultNote}>
                    {idx + 1}. ID: {b.id} | Type: {b.type} | Amount: £{b.amount || 0}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Component Divider */}
          <View style={styles.componentDivider}>
            <View style={styles.componentDividerLine} />
            <Text style={styles.componentDividerText}>•  •  •</Text>
            <View style={styles.componentDividerLine} />
          </View>

          {/* Test 8: Slider Component (Phase 15) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Slider Component (NEW - Phase 15)</Text>
            <Text style={styles.sectionDescription}>
              Using @react-native-community/slider for percentage adjustments
            </Text>

            <Slider
              label="Test Percentage"
              value={sliderValue}
              onValueChange={setSliderValue}
              minimumValue={0}
              maximumValue={100}
              step={0.1}
              showValue={true}
              formatValue={(val) => `${val.toFixed(1)}%`}
            />

            <View style={styles.result}>
              <Text style={styles.resultLabel}>Current Value:</Text>
              <Text style={styles.resultValue}>{sliderValue.toFixed(1)}%</Text>
              <Text style={styles.resultNote}>
                • Drag slider to adjust
                • 0.1% step precision
                • Green track and thumb
                • Smooth interaction
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Test 9: Estate Remainder Split Pattern (Phase 15) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Estate Remainder Split Pattern (Phase 15)</Text>
            <Text style={styles.sectionDescription}>
              Test the "Make Equal to 100%" normalization with haptic feedback
            </Text>

            {/* Mock Recipients */}
            {Object.keys(testSplits).map((splitId) => {
              const percentage = testSplits[splitId];
              const isGroup = splitId.startsWith('group-');
              const label = isGroup 
                ? 'Children' 
                : splitId === 'person-1' 
                ? 'Alice Johnson' 
                : 'Bob Smith';
              const subLabel = isGroup ? 'Category' : 'Child';

              return (
                <View key={splitId} style={styles.recipientCard}>
                  <View style={styles.recipientHeader}>
                    <View style={styles.recipientInfo}>
                      <View
                        style={[
                          styles.avatar,
                          isGroup ? styles.avatarGroup : styles.avatarPerson,
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {isGroup ? '👥' : label[0]}
                        </Text>
                      </View>
                      <View style={styles.recipientLabels}>
                        <Text style={styles.recipientName}>{label}</Text>
                        <Text style={styles.recipientSubLabel}>{subLabel}</Text>
                      </View>
                    </View>

                    <Text style={styles.percentageDisplay}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.sliderRow}>
                    <View style={styles.sliderWrapper}>
                      <Slider
                        value={percentage}
                        onValueChange={(value) => {
                          setTestSplits(prev => ({
                            ...prev,
                            [splitId]: value,
                          }));
                        }}
                        minimumValue={0}
                        maximumValue={100}
                        step={0.1}
                        showValue={false}
                      />
                    </View>
                    
                    {/* Magic Wand Button */}
                    <TouchableOpacity
                      onPress={() => {
                        const otherTotal = Object.keys(testSplits)
                          .filter(id => id !== splitId)
                          .reduce((sum, id) => sum + testSplits[id], 0);
                        const remaining = Math.max(0, Math.min(100, 100 - otherTotal));
                        
                        setTestSplits(prev => ({
                          ...prev,
                          [splitId]: remaining,
                        }));
                        
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={styles.wandButton}
                    >
                      <Text style={styles.wandIcon}>✦</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Normalize Button */}
            {(() => {
              const total = Object.values(testSplits).reduce((sum, val) => sum + val, 0);
              const isOff = Math.abs(total - 100) > 0.1;

              return (
                <>
                  <View style={styles.result}>
                    <Text style={styles.resultLabel}>Current Total:</Text>
                    <Text style={[
                      styles.resultValue,
                      { color: isOff ? '#EF4444' : KindlingColors.green }
                    ]}>
                      {total.toFixed(1)}%
                    </Text>
                    <Text style={styles.resultNote}>
                      {isOff 
                        ? `${total > 100 ? 'Over' : 'Under'} by ${Math.abs(total - 100).toFixed(1)}%` 
                        : '✓ Perfect allocation!'}
                    </Text>
                  </View>

                  {isOff && (
                    <View style={styles.normalizeCardTest}>
                      <Text style={styles.normalizeTitleTest}>
                        {total > 100 
                          ? `Over allocated by ${(total - 100).toFixed(1)}%`
                          : `Under allocated by ${(100 - total).toFixed(1)}%`}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const currentTotal = Object.values(testSplits).reduce((sum, val) => sum + val, 0);
                          if (currentTotal === 0) return;

                          const scaleFactor = 100 / currentTotal;
                          const normalized = Object.keys(testSplits).reduce((acc, key) => {
                            acc[key] = testSplits[key] * scaleFactor;
                            return acc;
                          }, {} as Record<string, number>);

                          setTestSplits(normalized);
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }}
                        style={styles.normalizeButtonTest}
                      >
                        <Text style={styles.normalizeButtonTextTest}>
                          Adjust to 100%
                        </Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.normalizeSubtextTest}>
                        Alter all proportionately to total 100%
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}

            {/* Test Actions */}
            <View style={styles.testActions}>
              <Button
                onPress={() => {
                  setTestSplits({
                    'person-1': 50,
                    'person-2': 30,
                    'group-1': 10,
                  });
                }}
                variant="outline"
              >
                Test: Under 100% (90%)
              </Button>
              <Button
                onPress={() => {
                  setTestSplits({
                    'person-1': 50,
                    'person-2': 40,
                    'group-1': 30,
                  });
                }}
                variant="outline"
              >
                Test: Over 100% (120%)
              </Button>
              <Button
                onPress={() => {
                  setTestSplits({
                    'person-1': 33.3,
                    'person-2': 33.3,
                    'group-1': 33.4,
                  });
                }}
                variant="outline"
              >
                Reset to Equal (100%)
              </Button>
            </View>
          </View>
        </View>

        {/* Group Management Drawer */}
        <GroupManagementDrawer
          visible={showGroupDrawer}
          onClose={() => setShowGroupDrawer(false)}
          onSelectGroup={(groupId) => {
            setSelectedGroupId(groupId);
            setShowGroupDrawer(false);
          }}
          beneficiaryGroupActions={beneficiaryGroupActions}
          willId={willActions.getUser()?.id || 'default-user'}
        />

        <AddPersonDialog
          visible={showAddPersonDialog}
          onDismiss={() => setShowAddPersonDialog(false)}
          personActions={personActions}
          roles={['beneficiary']}
          onCreated={(personId) => {
            const person = personActions.getPersonById(personId);
            if (!person) return;
            const selection: BeneficiarySelection = {
              id: person.id,
              type: 'person',
              name: getPersonFullName(person),
              relationship: getPersonRelationshipDisplay(person) || undefined,
            };
            if (addPersonContext === 'single') {
              setSingleBeneficiary(selection);
            } else {
              setMultiBeneficiaries((prev) => [...prev, selection]);
            }
          }}
        />

        {/* Add Group Dialog Placeholder */}
        <Dialog
          visible={showAddGroupDialog}
          onDismiss={() => setShowAddGroupDialog(false)}
          title="Create New Group"
        >
          <Text style={styles.dialogText}>
            Group creation shown in Group Management Drawer above.
          </Text>
          <Button onPress={() => setShowAddGroupDialog(false)} variant="primary">
            OK
          </Button>
        </Dialog>
      </ScrollView>
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
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 48,
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
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
  testSection: {
    gap: Spacing.md,
  },
  testTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: KindlingColors.border,
    marginVertical: Spacing.md,
  },
  componentDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  componentDividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: KindlingColors.beige,
  },
  componentDividerText: {
    fontSize: Typography.fontSize.lg,
    color: KindlingColors.beige,
    marginHorizontal: Spacing.md,
    letterSpacing: 4,
  },
  result: {
    backgroundColor: `${KindlingColors.cream}66`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  resultLabel: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    marginBottom: Spacing.xs,
  },
  resultValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  resultNote: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  dialogText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  accordionContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KindlingColors.border,
  },
  accordionContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: `${KindlingColors.cream}33`, // Light cream tint for content area
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  qualificationSuccess: {
    backgroundColor: `${KindlingColors.navy}1a`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.navy,
  },
  qualificationSuccessText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    lineHeight: 20,
  },
  qualificationWarning: {
    backgroundColor: '#FFF3CD',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  qualificationWarningText: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
  // Estate Remainder Test Styles
  recipientCard: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.1)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPerson: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  avatarGroup: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: KindlingColors.green,
  },
  recipientLabels: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '500',
    color: KindlingColors.navy,
    marginBottom: 2,
  },
  recipientSubLabel: {
    fontSize: 13,
    color: KindlingColors.brown,
    textTransform: 'capitalize',
  },
  percentageDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  // Normalize button test styles
  normalizeCardTest: {
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  normalizeTitleTest: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  normalizeButtonTest: {
    backgroundColor: KindlingColors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  normalizeButtonTextTest: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  normalizeSubtextTest: {
    fontSize: 13,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  testActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderWrapper: {
    flex: 1,
  },
  wandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wandIcon: {
    fontSize: 20,
    color: '#000000',
  },
});

