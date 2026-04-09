/**
 * StepCard Component
 *
 * Reusable card surface for multi-step question flows.
 * Matches the SwipeCard aesthetic — cream surface with warm/cool
 * decorative blobs — but designed for scrollable, interactive content
 * rather than swipe gestures.
 *
 * @module components/ui/StepCard
 */

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../styles/constants';

const CARD_RADIUS = 24;

export interface StepCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** When true the card content scrolls internally */
  scrollable?: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({
  title,
  subtitle,
  children,
  style,
  scrollable = false,
}) => {
  const inner = (
    <>
      {/* Decorative blobs */}
      <View style={styles.warmBlob} pointerEvents="none" />
      <View style={styles.coolBlob} pointerEvents="none" />

      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>

      <View style={styles.bottomEdge}>
        <View style={styles.bottomLine} />
      </View>
    </>
  );

  return (
    <View style={[styles.card, scrollable && styles.cardScrollable, style]}>
      {scrollable ? (
        <ScrollView
          style={[styles.surface, styles.surfaceScrollable]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.surface}>{inner}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: '#ffffff',
    ...Shadows.medium,
  },
  cardScrollable: {
    flex: 1,
  },
  surface: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#f9f8f6',
  },
  surfaceScrollable: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  warmBlob: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: KindlingColors.cream,
    opacity: 0.7,
  },
  coolBlob: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${KindlingColors.green}12`,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: Typography.fontSize.sm * 1.6,
    marginBottom: Spacing.md,
  },
  bottomEdge: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  bottomLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: `${KindlingColors.green}30`,
  },
});
