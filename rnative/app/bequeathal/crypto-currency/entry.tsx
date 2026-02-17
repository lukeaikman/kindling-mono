/**
 * Cryptocurrency Entry Screen
 *
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 *
 * Navigation:
 * - Back: Category Summary (/bequeathal/crypto-currency/summary)
 * - Save: Category Summary (/bequeathal/crypto-currency/summary)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Select, Input, CurrencyInput, ValidationAttentionButton } from '../../../src/components/ui';
import { useAppState } from '../../../src/hooks/useAppState';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import type { CryptoCurrencyAsset } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/crypto-currency/summary';

interface CryptoForm {
  platform: string;
  accountUsername: string;
  estimatedValue: number;
  notes: string;
}

export default function CryptoCurrencyEntryScreen() {
  const { bequeathalActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<CryptoForm>({
    platform: '',
    accountUsername: '',
    estimatedValue: 0,
    notes: '',
  });
  const [balanceNotSure, setBalanceNotSure] = useState(false);

  const { attentionLabel, triggerValidation } = useFormValidation({
    fields: [
      { key: 'platform', label: 'Platform', isValid: !!formData.platform },
    ],
    scrollViewRef,
  });

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
    if (!asset || asset.type !== 'crypto-currency') {
      router.push(SUMMARY_ROUTE as any);
      return;
    }

    const holding = asset as CryptoCurrencyAsset;
    loadedIdRef.current = editingAssetId;

    setFormData({
      platform: holding.platform || '',
      accountUsername: holding.accountUsername || '',
      estimatedValue: holding.estimatedValue || 0,
      notes: (holding as any).notes || '',
    });
    setBalanceNotSure(holding.estimatedValueUnknown === true);
  }, [editingAssetId, bequeathalActions]);

  const handleSave = () => {
    // Validation
    if (!formData.platform) return;

    // Round value to nearest £1 — undefined when unsure (not 0)
    const estimatedValue = balanceNotSure ? undefined : Math.round(formData.estimatedValue);

    const holdingData = {
      title: formData.accountUsername
        ? `${formData.platform} - ${formData.accountUsername}`
        : formData.platform,
      platform: formData.platform,
      accountUsername: formData.accountUsername || undefined,
      notes: formData.notes || undefined,
      estimatedValue,
      estimatedValueUnknown: balanceNotSure || undefined,
      netValue: estimatedValue,
    };

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, holdingData);
    } else {
      bequeathalActions.addAsset('crypto-currency', holdingData);
    }

    // Compute delta for net wealth toast (avoids reading stale batched state)
    const oldAssetValue = editingAssetId
      ? (bequeathalActions.getAssetById(editingAssetId)?.estimatedValue || 0)
      : 0;
    toast.notifySave((estimatedValue ?? 0) - oldAssetValue);

    router.push(SUMMARY_ROUTE as any);
  };

  const handleBack = () => {
    router.push(SUMMARY_ROUTE as any);
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
          <Text style={styles.headerTitle}>
            {editingAssetId ? 'Edit Crypto Account' : 'Add Crypto Account'}
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
              {editingAssetId ? 'Update the details below.' : 'Add a crypto account or wallet.'}
            </Text>

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
              onPress={handleSave}
              variant="primary"
              disabled={!canSubmit}
            >
              {editingAssetId ? 'Save changes' : 'Add this holding'}
            </Button>
            <ValidationAttentionButton label={attentionLabel} onPress={triggerValidation} />
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
  valueNote: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    lineHeight: 16,
    marginTop: -Spacing.xs,
  },
});
