/**
 * Trust Sandbox Screen
 * 
 * Isolated testing environment for trust details functionality
 * Allows testing all trust types and roles without creating full property
 * 
 * @module screens/developer/trust-sandbox
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { BackButton } from '../../src/components/ui/BackButton';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';

export default function TrustSandboxScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Trust Details Sandbox</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            Test trust details form in isolation. Navigate to the actual trust details screen to test all trust types and roles.
          </Text>
          
          <View style={styles.linkCard}>
            <Text style={styles.linkTitle}>Trust Details Screen</Text>
            <Text style={styles.linkDescription}>
              Full trust details form with all types (Bare, Life Interest, Discretionary) and roles (Settlor, Beneficiary, Both).
            </Text>
            <View style={styles.linkButton}>
              <Text
                style={styles.linkButtonText}
                onPress={() => router.push('/bequeathal/property/trust-details')}
              >
                Open Trust Details →
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Quick Testing Tips:</Text>
            <Text style={styles.infoText}>• Select different trust types to see conditional fields</Text>
            <Text style={styles.infoText}>• Test Settlor vs Beneficiary roles</Text>
            <Text style={styles.infoText}>• Check BeneficiaryWithPercentages with sliders (3+ beneficiaries)</Text>
            <Text style={styles.infoText}>• Verify date pickers work correctly</Text>
            <Text style={styles.infoText}>• Test Save button validation</Text>
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
  description: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    gap: Spacing.sm,
  },
  linkTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  linkDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: Spacing.sm,
  },
  linkButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
    textDecorationLine: 'underline',
  },
  infoCard: {
    backgroundColor: `${KindlingColors.cream}66`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    gap: Spacing.xs,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
  },
});

