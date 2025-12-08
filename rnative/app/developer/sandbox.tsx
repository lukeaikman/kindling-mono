/**
 * Developer Sandbox Screen
 * 
 * Test page for experimenting with new components
 * Accessible from Developer Dashboard
 * 
 * @module screens/developer/sandbox
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Dialog, Select } from '../../src/components/ui';
import { SearchableSelect } from '../../src/components/ui/SearchableSelect';
import { GroupManagementDrawer } from '../../src/components/forms/GroupManagementDrawer';
import { MultiBeneficiarySelector, BeneficiarySelection } from '../../src/components/forms/MultiBeneficiarySelector';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

export default function SandboxScreen() {
  const { beneficiaryGroupActions, willActions, personActions } = useAppState();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedBankWithCard, setSelectedBankWithCard] = useState('');
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [singleBeneficiary, setSingleBeneficiary] = useState<BeneficiarySelection>({ id: '', type: 'person', name: '' });
  const [multiBeneficiaries, setMultiBeneficiaries] = useState<BeneficiarySelection[]>([]);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [shortSelect, setShortSelect] = useState('');
  const [longSelect, setLongSelect] = useState('');

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
              onAddNewPerson={() => setShowAddPersonDialog(true)}
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
              onAddNewPerson={() => setShowAddPersonDialog(true)}
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
});

