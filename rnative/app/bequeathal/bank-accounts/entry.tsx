/**
 * Bank Accounts Entry Screen
 * 
 * Form for adding and managing bank accounts.
 * Handles UK and non-UK banks with conditional fields.
 * ISAs are saved as InvestmentAsset but shown in this list.
 * 
 * Navigation:
 * - Back: Returns to bank accounts intro
 * - Continue: Proceeds to next category or will-dashboard
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, SearchableSelect } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import type { BankAccountAsset, InvestmentAsset } from '../../../src/types';

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
  const [showForm, setShowForm] = useState(true);
  const [showAccountsList, setShowAccountsList] = useState(true);
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

  // Load existing accounts
  const bankAccounts = bequeathalActions.getAssetsByType('bank-accounts') as BankAccountAsset[];
  const allInvestments = bequeathalActions.getAssetsByType('investment') as InvestmentAsset[];
  const isaAccounts = allInvestments.filter(inv => inv.investmentType === 'ISA');
  
  const allAccounts = [...bankAccounts, ...isaAccounts];
  const totalValue = allAccounts.reduce((sum, acc) => sum + (acc.estimatedValue || 0), 0);
  const unknownBalanceCount = allAccounts.filter(acc => (acc.estimatedValue || 0) === 0).length;

  // Hide form after first account if none existed initially
  useEffect(() => {
    if (bankAccounts.length === 0 && isaAccounts.length === 0) {
      setShowForm(true);
    } else if (bankAccounts.length > 0 || isaAccounts.length > 0) {
      setShowForm(false);
    }
  }, []);

  const isNonUkBank = formData.bankName === 'Non UK Bank';
  const isISA = formData.accountType === 'isa';

  const handleAddAccount = () => {
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

    // ISA Handling: Save as InvestmentAsset
    if (isISA) {
      const investmentData = {
        title: `${displayBankName} - ${accountTypeLabel}`,
        investmentType: 'ISA',
        provider: displayBankName,
        accountNumber: isNonUkBank ? formData.accountId : formData.accountNumber,
        estimatedValue,
        netValue: estimatedValue,
      };
      bequeathalActions.addAsset('investment', investmentData);
    } else {
      // Regular bank account
      const accountData = {
        title: `${displayBankName} - ${accountTypeLabel}`,
        provider: displayBankName,
        accountType: formData.accountType,
        accountNumber: isNonUkBank ? undefined : (formData.accountNumber || undefined),
        sortCode: undefined, // Not collected in form, but field exists for future
        ownershipType: formData.ownershipType,
        isNonUkBank,
        nonUkBankName: isNonUkBank ? formData.nonUkBankName : undefined,
        accountId: isNonUkBank ? formData.accountId : undefined,
        notes: isNonUkBank ? formData.notes : undefined,
        estimatedValue,
        netValue: estimatedValue,
      };
      bequeathalActions.addAsset('bank-accounts', accountData);
    }

    // Reset form
    setFormData({
      bankName: '',
      accountType: 'current',
      ownershipType: 'personal',
      estimatedBalance: 0,
      accountNumber: '',
      nonUkBankName: '',
      accountId: '',
      notes: '',
    });
    setBalanceNotSure(false);
    setShowForm(false);
  };

  const handleRemoveAccount = (id: string) => {
    bequeathalActions.removeAsset(id);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('bank-accounts', selectedCategories);
    router.push(nextRoute);
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
          <Text style={styles.headerTitle}>Enter Accounts</Text>
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
          {/* Add Account Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add Bank Account</Text>
              
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
                    This will be saved under Investments and appear in that section in future screens
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
                    // Only allow digits
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
                      // Clear the input when "Unsure" is checked
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
                onPress={handleAddAccount}
                variant="primary"
                disabled={!canSubmit}
              >
                Add Account
              </Button>
            </View>
          )}

          {/* Existing Accounts List */}
          {(bankAccounts.length > 0 || isaAccounts.length > 0) && (
            <View style={styles.accountsSection}>
              <View style={styles.accountsHeader}>
                <Text style={styles.accountsTitle}>
                  Your Bank Accounts ({bankAccounts.length + isaAccounts.length})
                </Text>
                <TouchableOpacity onPress={() => setShowAccountsList(!showAccountsList)}>
                  <IconButton
                    icon={showAccountsList ? 'eye-off' : 'eye'}
                    size={20}
                    iconColor={KindlingColors.brown}
                  />
                </TouchableOpacity>
              </View>

              {showAccountsList && (
                <View style={styles.accountsList}>
                  {/* Bank Accounts */}
                  {bankAccounts.map((account) => {
                    const accountTypeName = accountTypeOptions.find(opt => opt.value === account.accountType)?.label || 'Current Account';
                    let secondLine = accountTypeName;
                    
                    // Build second line with account type and number
                    if (account.isNonUkBank && account.accountId) {
                      secondLine = `${accountTypeName} - ID: ${account.accountId}`;
                    } else if (!account.isNonUkBank && account.accountNumber) {
                      secondLine = `${accountTypeName} - ${account.accountNumber}`;
                    }
                    
                    return (
                      <View key={account.id} style={styles.accountCard}>
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountBank}>
                            {account.isNonUkBank ? (account.nonUkBankName || account.provider) : account.provider}
                          </Text>
                          <Text style={styles.accountType}>
                            {secondLine}
                          </Text>
                          
                          {/* Notes for non-UK banks */}
                          {account.isNonUkBank && account.notes && (
                            <Text style={styles.accountNotes} numberOfLines={1}>
                              {account.notes}
                            </Text>
                          )}
                          
                          <Text style={styles.accountBalance}>
                            {(account.estimatedValue || 0) === 0 ? 'Balance not known' : `£${(account.estimatedValue || 0).toLocaleString()}`}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveAccount(account.id)}
                          style={styles.deleteButton}
                        >
                          <IconButton icon="delete" size={20} iconColor={KindlingColors.destructive} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* ISAs (shown with note) */}
                  {isaAccounts.map((isa) => {
                    const secondLine = isa.accountNumber ? `ISA - ${isa.accountNumber}` : 'ISA';
                    
                    return (
                      <View key={isa.id} style={styles.accountCard}>
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountBank}>{isa.provider}</Text>
                          <Text style={styles.accountType}>{secondLine}</Text>
                          <View style={styles.isaNote}>
                            <IconButton icon="information" size={16} iconColor={KindlingColors.green} style={styles.isaIcon} />
                            <Text style={styles.isaText}>Will appear under Investments</Text>
                          </View>
                          <Text style={styles.accountBalance}>
                            {(isa.estimatedValue || 0) === 0 ? 'Balance not known' : `£${(isa.estimatedValue || 0).toLocaleString()}`}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveAccount(isa.id)}
                          style={styles.deleteButton}
                        >
                          <IconButton icon="delete" size={20} iconColor={KindlingColors.destructive} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Total Accounts Summary */}
              {(bankAccounts.length > 0 || isaAccounts.length > 0) && (
                <View style={styles.totalSection}>
                  <Text style={styles.totalText}>
                    Accounts Total: <Text style={styles.totalValue}>£{totalValue.toLocaleString()}</Text>
                  </Text>
                  {unknownBalanceCount > 0 && (
                    <Text style={styles.unknownBalanceText}>
                      (+ {unknownBalanceCount} unknown {unknownBalanceCount === 1 ? 'balance' : 'balances'})
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {(bankAccounts.length > 0 || isaAccounts.length > 0) && !showForm && (
          <>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={styles.addAnotherButton}
              activeOpacity={0.7}
            >
              <Text style={styles.addAnotherText}>Add Another Account</Text>
            </TouchableOpacity>

            <Button onPress={handleContinue} variant="primary">
              Continue
            </Button>
          </>
        )}
      </View>
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
    zIndex: 10,
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
    zIndex: 10,
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
  accountsSection: {
    gap: Spacing.md,
  },
  accountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  accountsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  accountsList: {
    gap: Spacing.sm,
  },
  accountCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountInfo: {
    flex: 1,
    gap: 4,
  },
  accountBank: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  accountType: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  accountNumber: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}80`,
  },
  accountNotes: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}80`,
  },
  accountBalance: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    backgroundColor: `${KindlingColors.cream}80`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  isaNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  isaIcon: {
    margin: 0,
    padding: 0,
  },
  isaText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.green,
    fontWeight: Typography.fontWeight.medium,
  },
  deleteButton: {
    marginLeft: Spacing.sm,
  },
  totalSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.cream}66`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  totalText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    textAlign: 'center',
  },
  totalValue: {
    fontWeight: Typography.fontWeight.semibold,
  },
  unknownBalanceText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.border}1a`,
    zIndex: 10,
    gap: Spacing.sm,
  },
  addAnotherButton: {
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.green,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAnotherText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
});

