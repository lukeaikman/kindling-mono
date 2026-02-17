/**
 * EstateCategoryCard Component
 *
 * A card for displaying estate asset categories on the Estate Dashboard.
 * Three visual states:
 *   - No assets: amber "Not started" pill, small close icon top-right to remove, chevron
 *   - Has assets, not complete: value summary subline, chevron
 *   - Complete: green accent bar, green "Complete" pill, value summary, chevron
 *
 * Deselection UX (Phase 1: close icon; Phase 2+ adds swipe-left-to-delete):
 *   - Zero-asset categories show a subtle close icon top-right corner
 *   - Categories with assets cannot be deselected from the card
 *
 * @module components/ui/EstateCategoryCard
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../styles/constants';

// ---------------------------------------------------------------------------
// Pill colours — mirrors the pattern from StageCard.tsx
// ---------------------------------------------------------------------------

interface PillStyle {
  bg: string;
  text: string;
}

const getPillStyle = (isComplete: boolean, hasAssets: boolean): PillStyle => {
  if (isComplete) {
    return { bg: `${KindlingColors.green}1a`, text: KindlingColors.green };
  }
  if (!hasAssets) {
    // Amber for "Not started"
    return { bg: '#FFF3E0', text: '#E65100' };
  }
  // Has assets but not complete — no pill shown
  return { bg: 'transparent', text: 'transparent' };
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EstateCategoryCardProps {
  /** MaterialCommunityIcons name (e.g. 'home', 'piggy-bank') */
  icon: string;
  /** Category display title (e.g. "Property") */
  title: string;
  /** Number of assets in this category */
  assetCount: number;
  /** Net value of assets in this category */
  netValue: number;
  /** Whether the category has been marked complete */
  isComplete: boolean;
  /** Tap handler — navigates into the category */
  onPress?: () => void;
  /** Deselect handler — only shown when assetCount === 0 */
  onDeselect?: () => void;
  /** Whether any asset in this category has an unknown value */
  hasUnknownValues?: boolean;
  /** Optional style override */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format number as short GBP string for display: £550k, £1.2m, etc. */
const formatShortValue = (value: number): string => {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `£${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `£${Math.round(value / 1_000)}k`;
  }
  return `£${value}`;
};

/** Build the subline text based on asset count and value */
const getSubline = (assetCount: number, netValue: number, hasUnknownValues?: boolean): string | null => {
  if (assetCount === 0) return null;
  const items = assetCount === 1 ? '1 item' : `${assetCount} items`;
  const suffix = hasUnknownValues ? '+' : '';
  return `${items} · ${formatShortValue(netValue)}${suffix} net`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EstateCategoryCard: React.FC<EstateCategoryCardProps> = ({
  icon,
  title,
  assetCount,
  netValue,
  isComplete,
  hasUnknownValues,
  onPress,
  onDeselect,
  style,
}) => {
  const hasAssets = assetCount > 0;
  const pill = getPillStyle(isComplete, hasAssets);
  const subline = getSubline(assetCount, netValue, hasUnknownValues);
  const showPill = isComplete || !hasAssets;
  const showCloseIcon = !hasAssets && !!onDeselect;

  return (
    <View style={[styles.cardWrapper, style]}>
      {/* Close / remove icon — top-right, only for zero-asset categories */}
      {showCloseIcon && (
        <TouchableOpacity
          onPress={onDeselect}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeButton}
          accessibilityLabel={`Remove ${title}`}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={KindlingColors.mutedForeground}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.card,
          isComplete && styles.cardComplete,
        ]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}${subline ? `, ${subline}` : ''}`}
      >
        {/* Green accent bar — complete state only */}
        {isComplete && <View style={styles.accentBar} />}

        {/* Icon circle */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={KindlingColors.navy}
          />
        </View>

        {/* Title + subline */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subline && <Text style={styles.subline}>{subline}</Text>}
          {!hasAssets && <Text style={styles.subline}>Not started</Text>}
        </View>

        {/* Right-side controls */}
        <View style={styles.rightControls}>
          {/* Status pill */}
          {showPill && (
            <View style={[styles.pill, { backgroundColor: pill.bg }]}>
              <Text style={[styles.pillText, { color: pill.text }]}>
                {isComplete ? 'Complete' : 'Not started'}
              </Text>
            </View>
          )}

          {/* Chevron */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={KindlingColors.mutedForeground}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 10,
    backgroundColor: KindlingColors.background,
    borderRadius: 10,
    padding: 1,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    padding: Spacing.md,
    minHeight: 64,
    overflow: 'hidden',
    ...Shadows.small,
  },
  cardComplete: {
    borderColor: `${KindlingColors.green}30`,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: KindlingColors.green,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${KindlingColors.navy}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 4,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  subline: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.mutedForeground,
    marginTop: 2,
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },

  pill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
