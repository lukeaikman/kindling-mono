/**
 * Life Insurance Intro Screen
 * 
 * Educational intro about life insurance policies in estate planning.
 * Emphasizes held in trust vs part of estate distinction.
 * 
 * @module screens/bequeathal/life-insurance/intro
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Button, BackButton, InformationCard } from '../../../src/components/ui';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';

export default function LifeInsuranceIntroScreen() {
  const handleSkip = () => {
    router.back();
  };

  const handleLearnMore = () => {
    Linking.openURL('https://www.which.co.uk/money/tax/inheritance-tax/guides/life-insurance-and-inheritance-tax-aMqUp6q9q8Xe');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background */}
      <View style={styles.morphicBackground}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="shield-account" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>Life Insurance Policies 🛡️</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {/* Information Card */}
          <InformationCard title="Understanding Life Insurance in Your Estate">
            <Text style={styles.infoText}>
              Life insurance policies can be complex when it comes to your estate. The key factor is whether your policy is <Text style={styles.bold}>held in trust</Text> or not.
            </Text>
            
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Policies held in trust</Text> typically sit outside your estate, meaning they won't be subject to inheritance tax and can be paid out more quickly to your chosen beneficiaries. <Text style={styles.bold}>Policies not in trust</Text> form part of your estate and may be subject to inheritance tax.
            </Text>
            
            <Text style={styles.infoText}>
              Our goal here is to capture the basics of your life insurance arrangements. This helps your executors understand what policies exist and provides a starting point for beneficiaries to claim payouts when needed.
            </Text>
            
            <Text style={styles.infoText}>
              We'll gather key details like policy providers, coverage amounts, and beneficiary information to create a comprehensive overview for your estate planning.
            </Text>

            {/* Learn More Link */}
            <TouchableOpacity onPress={handleLearnMore} style={styles.learnMoreButton}>
              <View style={styles.learnMoreRow}>
                <Text style={styles.learnMoreText}>
                  Learn about life insurance and inheritance tax
                </Text>
                <IconButton icon="open-in-new" size={16} iconColor={KindlingColors.navy} style={styles.learnMoreIcon} />
              </View>
            </TouchableOpacity>
          </InformationCard>

          {/* Action Buttons */}
          <Button
            onPress={() => router.replace('/bequeathal/life-insurance/entry' as any)}
            variant="primary"
            style={styles.startButton}
          >
            Let's Go
          </Button>

          <Button
            onPress={handleSkip}
            variant="secondary"
            style={styles.skipButton}
          >
            Skip This Section
          </Button>
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
  morphicBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  blob: {
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
    left: '25%',
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
  infoText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  bold: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  learnMoreButton: {
    marginTop: Spacing.sm,
  },
  learnMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  learnMoreText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
  },
  learnMoreIcon: {
    margin: 0,
    padding: 0,
  },
  startButton: {
    marginTop: Spacing.md,
  },
  skipButton: {
    marginTop: Spacing.sm,
  },
});
