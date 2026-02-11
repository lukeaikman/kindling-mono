/**
 * Bank Accounts Entry Screen
 *
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Handles UK and non-UK banks with conditional fields.
 * ISAs are saved as InvestmentAsset (cross-category save).
 *
 * Navigation:
 * - Back: Category Summary (/bequeathal/bank-accounts/summary)
 * - Save: Category Summary (/bequeathal/bank-accounts/summary)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, SearchableSelect } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { BankAccountAsset } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/bank-accounts/summary';

interface BankAccountForm {
  bankName: string;
  accountType: 'current' | 'savings' | 'isa' | 'fixed-term' | 'other';
  ownershipType: 'personal' | 'joint';
  estimatedBalance: number;
  accountNumber: string;
  nonUkBankName: string;
  accountId: string;
  notes: string;
}

export default function BankAccountsEntryScreen() {
  const { bequeathalActions } = useAppState();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);

  const [formData, setFormData] = useState<BankAccountForm>({
    bankName: '',
    accountType: 'current',
    ownershipType: 'personal',
    estimatedBalance: 0,
    accountNumber: '',
    nonUkBankName: '',
    accountId: '',
    notes: '',
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);

  // UK Bank Providers
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

  const accountTypeOptions = [
    { label: 'Current Account', value: 'current' },
    { label: 'Savings Account', value: 'savings' },
    { label: 'ISA', value: 'isa' },
    { label: 'Fixed Term Deposit', value: 'fixed-term' },
    { label: 'Other', value: 'other' },
  ];

  const ownershipTypeOptions = [
    { label: 'Personal Account', value: 'personal' },
    { label: 'Joint Account', value: 'joint' },
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
    if (!asset || asset.type !== 'bank-accounts') {
      router.push(SUMMARY_ROUTE as any);
      return;
    }

    const account = asset as BankAccountAsset;
    loadedIdRef.current = editingAssetId;

    setFormData({
      bankName: account.isNonUkBank ? 'Non UK Bank' : (account.provider || ''),
      accountType: (account.accountType as any) || 'current',
      ownershipType: (account.ownershipType as any) || 'personal',
      estimatedBalance: account.estimatedValue || 0,
      accountNumber: account.accountNumber || '',
      nonUkBankName: account.nonUkBankName || '',
      accountId: (account as any).accountId || '',
      notes: (account as any).notes || '',
    });
    setBalanceNotSure((account.estimatedValue || 0) === 0);
  }, [editingAssetId, bequeathalActions]);

  const isNonUkBank = formData.bankName === 'Non UK Bank';
  const isISA = formData.accountType === 'isa';

  const handleSave = () => {
    // Validation
    if (!formData.bankName) return;
    if (isNonUkBank && !formData.nonUkBankName) return;

    // Round balance to nearest £1
    const estimatedValue = Math.round(balanceNotSure ? 0 : formData.estimatedBalance);

    // Validate account number if provided
    if (!isNonUkBank && formData.accountNumber) {
      const accountNumberDigits = formData.accountNumber.replace(/\D/g, '');
      if (accountNumberDigits.length < 3 || accountNumberDigits.length > 8) {
        Alert.alert('Invalid Account Number', 'UK account numbers must be 3-8 digits');
        return;
      }
    }

    const accountTypeLabel = accountTypeOptions.find(opt => opt.value === formData.accountType)?.label || 'Current Account';
    const displayBankName = isNonUkBank ? formData.nonUkBankName : formData.bankName;

    // ISA Handling: Save as InvestmentAsset (cross-category)
    if (isISA) {
      const investmentData = {
        title: `${displayBankName} - ${accountTypeLabel}`,
        investmentType: 'ISA',
        provider: displayBankName,
        accountNumber: isNonUkBank ? formData.accountId : formData.accountNumber,
        estimatedValue,
        netValue: estimatedValue,
      };

      if (editingAssetId) {
        bequeathalActions.updateAsset(editingAssetId, investmentData);
      } else {
        bequeathalActions.addAsset('investment', investmentData);
      }
    } else {
      // Regular bank account
      const accountData = {
        title: `${displayBankName} - ${accountTypeLabel}`,
        provider: displayBankName,
        accountType: formData.accountType,
        accountNumber: isNonUkBank ? undefined : (formData.accountNumber || undefined),
        sortCode: undefined,
        ownershipType: formData.ownershipType,
        isNonUkBank,
        nonUkBankName: isNonUkBank ? formData.nonUkBankName : undefined,
        accountId: isNonUkBank ? formData.accountId : undefined,
        notes: isNonUkBank ? formData.notes : undefined,
        estimatedValue,
        netValue: estimatedValue,
      };

      if (editingAssetId) {
        bequeathalActions.updateAsset(editingAssetId, accountData);
      } else {
        bequeathalActions.addAsset('bank-accounts', accountData);
      }
    }

    router.push(SUMMARY_ROUTE as any);
  };

  const handleBack = () => {
    router.push(SUMMARY_ROUTE as any);
  };

  const canSubmit = formData.bankName && (!isNonUkBank || formData.nonUkBankName);

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
            {editingAssetId ? 'Edit Account' : 'Add Account'}
          </Text>
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
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add a bank account.'}
            </Text>

            <SearchableSelect
              label="Held With *"
              placeholder="Search bank or building society..."
              value={formData.bankName}
              options={bankProviders}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                bankName: value,
                nonUkBankName: value === 'Non UK Bank' ? prev.nonUkBankName : '',
                accountId: value === 'Non UK Bank' ? prev.accountId : '',
                notes: value === 'Non UK Bank' ? prev.notes : ''
              }))}
            />

            {isNonUkBank && (
              <>
                <Input
                  label="Bank Name *"
                  placeholder="Enter bank name"
                  value={formData.nonUkBankName}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, nonUkBankName: value }))}
                />

                <Input
                  label="Account ID"
                  placeholder="Enter account identifier"
                  value={formData.accountId}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                />

                <Input
                  label="Notes"
                  placeholder="Any other helpful details, e.g. sort code, Routing Number, Branch Number, Private Banker Details, etc"
                  value={formData.notes}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            <Select
              label="Account Type *"
              placeholder="Select account type..."
              value={formData.accountType}
              options={accountTypeOptions}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                accountType: value as typeof formData.accountType
              }))}
            />

            {isISA && (
              <View style={styles.isaWarning}>
                <IconButton icon="information" size={20} iconColor={KindlingColors.green} style={styles.isaWarningIcon} />
                <Text style={styles.isaWarningText}>
                  This will be saved under Investments and appear in that section
                </Text>
              </View>
            )}

            {!isISA && (
              <Select
                label="Ownership *"
                placeholder="Select ownership type..."
                value={formData.ownershipType}
                options={ownershipTypeOptions}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  ownershipType: value as typeof formData.ownershipType
                }))}
              />
            )}

            {!isNonUkBank && (
              <Input
                label="Account Number"
                placeholder="12345678"
                value={formData.accountNumber}
                onChangeText={(value) => {
                  const digitsOnly = value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, accountNumber: digitsOnly }));
                }}
                keyboardType="number-pad"
                maxLength={8}
              />
            )}

            <View style={styles.balanceSection}>
              <View style={balanceNotSure && styles.disabledInputContainer}>
                <CurrencyInput
                  label="Estimated Balance"
                  placeholder="0"
                  value={balanceNotSure ? 0 : formData.estimatedBalance}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, estimatedBalance: value }));
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
                    setFormData(prev => ({ ...prev, estimatedBalance: 0 }));
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

            <Text style={styles.privacyNote}>
              IMPORTANT: This is only stored on your phone and never on our servers - it allows us to estimate your inheritance tax and help structure your estate
            </Text>

            <Button
              onPress={handleSave}
              variant="primary"
              disabled={!canSubmit}
            >
              {editingAssetId ? 'Save changes' : 'Add this account'}
            </Button>
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
  privacyNote: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    lineHeight: 16,
    marginTop: Spacing.xs,
  },
  isaWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.green}15`,
    borderRadius: 8,
    padding: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: `${KindlingColors.green}40`,
  },
  isaWarningIcon: {
    margin: 0,
    padding: 0,
  },
  isaWarningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.green,
    lineHeight: 18,
  },
});
