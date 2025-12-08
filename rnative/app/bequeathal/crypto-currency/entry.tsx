/**
 * Cryptocurrency Entry Screen
 * 
 * Form for adding and managing cryptocurrency accounts/wallets.
 * Simplified account-based model: one entry per platform/wallet.
 * 
 * Navigation:
 * - Back: Returns to cryptocurrency intro
 * - Continue: Proceeds to next category or order-of-things
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getNextCategoryRoute } from '../../../src/utils/categoryNavigation';
import type { CryptoCurrencyAsset } from '../../../src/types';

interface CryptoForm {
  platform: string;
  accountUsername: string;
  estimatedValue: number;
  notes: string;
}

export default function CryptoCurrencyEntryScreen() {
  const { bequeathalActions } = useAppState();
  const [showForm, setShowForm] = useState(true);
  const [showHoldingsList, setShowHoldingsList] = useState(true);
  const [formData, setFormData] = useState<CryptoForm>({
    platform: '',
    accountUsername: '',
    estimatedValue: 0,
    notes: '',
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);

  // Platform/Wallet options
  const platformOptions = [
    // Exchanges
    { label: 'Coinbase', value: 'Coinbase' },
    { label: 'Binance', value: 'Binance' },
    { label: 'Kraken', value: 'Kraken' },
    { label: 'Bitstamp', value: 'Bitstamp' },
    { label: 'Gemini', value: 'Gemini' },
    { label: 'Crypto.com', value: 'Crypto.com' },
    { label: 'KuCoin', value: 'KuCoin' },
    { label: 'OKX', value: 'OKX' },
    { label: 'Huobi', value: 'Huobi' },
    { label: '────────────────', value: 'separator', disabled: true },
    // Wallets
    { label: 'Hardware Wallet', value: 'Hardware Wallet' },
    { label: 'Software Wallet', value: 'Software Wallet' },
    { label: 'Paper Wallet', value: 'Paper Wallet' },
    { label: 'Mobile Wallet', value: 'Mobile Wallet' },
    { label: 'Browser Wallet', value: 'Browser Wallet' },
    { label: 'Other', value: 'Other' },
  ];

  // Load existing holdings
  const cryptoHoldings = bequeathalActions.getAssetsByType('crypto-currency') as CryptoCurrencyAsset[];
  const totalValue = cryptoHoldings.reduce((sum, holding) => sum + (holding.estimatedValue || 0), 0);
  const unknownValueCount = cryptoHoldings.filter(h => (h.estimatedValue || 0) === 0).length;

  // Hide form after first holding if none existed initially
  useEffect(() => {
    if (cryptoHoldings.length === 0) {
      setShowForm(true);
    } else if (cryptoHoldings.length > 0) {
      setShowForm(false);
    }
  }, []);

  const handleAddHolding = () => {
    // Validation
    if (!formData.platform) return;

    // Round value to nearest £1
    const estimatedValue = Math.round(balanceNotSure ? 0 : formData.estimatedValue);

    const holdingData = {
      title: formData.accountUsername 
        ? `${formData.platform} - ${formData.accountUsername}`
        : formData.platform,
      platform: formData.platform,
      accountUsername: formData.accountUsername || undefined,
      notes: formData.notes || undefined,
      estimatedValue,
      netValue: estimatedValue,
    };

    bequeathalActions.addAsset('crypto-currency', holdingData);

    // Reset form
    setFormData({
      platform: '',
      accountUsername: '',
      estimatedValue: 0,
      notes: '',
    });
    setBalanceNotSure(false);
    setShowForm(false);
  };

  const handleRemoveHolding = (id: string) => {
    bequeathalActions.removeAsset(id);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    const selectedCategories = bequeathalActions.getSelectedCategories();
    const nextRoute = getNextCategoryRoute('crypto-currency', selectedCategories);
    router.push(nextRoute);
  };

  const canSubmit = formData.platform;

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
          <Text style={styles.headerTitle}>Enter Crypto Accounts</Text>
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
          {/* Add Holding Form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add Crypto Account</Text>
              
              <Select
                label="Platform or Wallet *"
                placeholder="Select wallet or exchange..."
                value={formData.platform}
                options={platformOptions}
                onChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              />

              <Input
                label="Account Username/ID"
                placeholder="e.g., john@email.com, Account ID"
                value={formData.accountUsername}
                onChangeText={(value) => setFormData(prev => ({ ...prev, accountUsername: value }))}
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

              <Text style={styles.valueNote}>
                Cryptocurrency values fluctuate - this is just for estate planning estimates
              </Text>

              <Input
                label="Notes"
                placeholder="Any other important details about this holding..."
                value={formData.notes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                multiline
                numberOfLines={3}
              />

              <Button
                onPress={handleAddHolding}
                variant="primary"
                disabled={!canSubmit}
              >
                Add Holding
              </Button>
            </View>
          )}

          {/* Existing Holdings List */}
          {cryptoHoldings.length > 0 && (
            <View style={styles.holdingsSection}>
              <View style={styles.holdingsHeader}>
                <Text style={styles.holdingsTitle}>
                  Your Cryptocurrency ({cryptoHoldings.length})
                </Text>
                <TouchableOpacity onPress={() => setShowHoldingsList(!showHoldingsList)}>
                  <IconButton
                    icon={showHoldingsList ? 'eye-off' : 'eye'}
                    size={20}
                    iconColor={KindlingColors.brown}
                  />
                </TouchableOpacity>
              </View>

              {showHoldingsList && (
                <View style={styles.holdingsList}>
                  {cryptoHoldings.map((holding) => (
                    <View key={holding.id} style={styles.holdingCard}>
                      <View style={styles.holdingInfo}>
                        <Text style={styles.holdingPlatform}>{holding.platform}</Text>
                        {holding.accountUsername && (
                          <Text style={styles.holdingAccount}>{holding.accountUsername}</Text>
                        )}
                        {holding.notes && (
                          <Text style={styles.holdingNotes} numberOfLines={1}>{holding.notes}</Text>
                        )}
                        <Text style={styles.holdingValue}>
                          {(holding.estimatedValue || 0) === 0 ? 'Value not known' : `£${(holding.estimatedValue || 0).toLocaleString()}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveHolding(holding.id)}
                        style={styles.deleteButton}
                      >
                        <IconButton icon="delete" size={20} iconColor={KindlingColors.destructive} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Total Summary */}
                  <View style={styles.totalSection}>
                    <Text style={styles.totalText}>
                      Crypto Total: <Text style={styles.totalValue}>£{totalValue.toLocaleString()}</Text>
                    </Text>
                    {unknownValueCount > 0 && (
                      <Text style={styles.unknownValueText}>
                        (+ {unknownValueCount} unknown {unknownValueCount === 1 ? 'balance' : 'balances'})
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons - at bottom of content */}
          {cryptoHoldings.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={styles.addAnotherButton}
                activeOpacity={0.7}
              >
                <Text style={styles.addAnotherText}>Add Another Holding</Text>
              </TouchableOpacity>

              <Button onPress={handleContinue} variant="primary" style={styles.continueButton}>
                Continue
              </Button>
            </>
          )}
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
    zIndex: 10,
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
  valueNote: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    lineHeight: 16,
    marginTop: -Spacing.xs,
  },
  holdingsSection: {
    gap: Spacing.md,
  },
  holdingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  holdingsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  holdingsList: {
    gap: Spacing.sm,
  },
  holdingCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  holdingInfo: {
    flex: 1,
    gap: 4,
  },
  holdingPlatform: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  holdingAccount: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
  },
  holdingNotes: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}80`,
  },
  holdingValue: {
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
  unknownValueText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  addAnotherButton: {
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.green,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  addAnotherText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  continueButton: {
    marginTop: Spacing.sm,
  },
});

