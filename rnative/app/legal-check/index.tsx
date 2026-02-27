/**
 * Legal Check Dashboard
 *
 * Hub screen for all legal check activities. Mirrors the estate dashboard's
 * visual language: morphic background blobs, centered icon header, hero card,
 * section dividers, and StageCard items.
 *
 * Front-end only for now — status is hardcoded.
 *
 * @module screens/legal-check
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BackButton } from '../../src/components/ui';
import { StageCard } from '../../src/components/ui/StageCard';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../src/styles/constants';

export default function LegalCheckDashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Morphic background blobs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>Legal Check</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <MaterialCommunityIcons
            name="scale-balance"
            size={32}
            color={KindlingColors.navy}
          />
          <Text style={styles.heroTitle}>Protect Your Wishes</Text>
          <Text style={styles.heroSubtitle}>
            Flag anything a solicitor would want to know — so your will stands up when it matters most.
          </Text>
        </View>

        {/* Section divider */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionLabel}>YOUR CHECKS</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Stage cards */}
        <View style={styles.cards}>
          <StageCard
            title="Avoid Common Issues"
            status="Not started"
            subline="Quick-fire questions to flag potential risks"
            emphasis="hero"
            onPress={() => router.push('/legal-check/avoid-issues')}
          />
        </View>

        {/* Warm progress sentence */}
        <View style={styles.progressRow}>
          <MaterialCommunityIcons
            name="flag-checkered"
            size={18}
            color={KindlingColors.mutedForeground}
          />
          <Text style={styles.progressText}>
            Complete your checks to strengthen your will.
          </Text>
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
    opacity: 0.12,
  },
  blob1: {
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    backgroundColor: KindlingColors.navy,
    borderRadius: 175,
    transform: [{ rotate: '-20deg' }],
  },
  blob2: {
    top: '45%' as any,
    left: -80,
    width: 260,
    height: 200,
    backgroundColor: KindlingColors.brown,
    borderRadius: 130,
    transform: [{ rotate: '30deg' }],
  },
  blob3: {
    bottom: -80,
    right: -60,
    width: 220,
    height: 170,
    backgroundColor: KindlingColors.beige,
    borderRadius: 110,
    transform: [{ rotate: '50deg' }],
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
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  headerRight: {
    width: 48,
  },

  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },

  heroCard: {
    backgroundColor: KindlingColors.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  heroTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.6,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: KindlingColors.border,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.mutedForeground,
    letterSpacing: 1.2,
  },

  cards: {
    gap: Spacing.sm,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: `${KindlingColors.muted}80`,
    borderRadius: BorderRadius.lg,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    color: KindlingColors.mutedForeground,
  },
});
