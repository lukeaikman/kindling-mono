/**
 * Developer Sandbox Screen
 * 
 * Test page for experimenting with new components
 * Accessible from Developer Dashboard
 * 
 * @module screens/developer/sandbox
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton } from '../../src/components/ui';
import { SearchableSelect } from '../../src/components/ui/SearchableSelect';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

export default function SandboxScreen() {
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedBankWithCard, setSelectedBankWithCard] = useState('');

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
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
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
        </View>
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
});

