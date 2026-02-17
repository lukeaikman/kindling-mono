/**
 * AssetCard — compact row card for displaying any asset type.
 *
 * Layout:  Title                           £Value >
 *          <subline>
 *
 * Design language:
 *   - Green accent bar on the left (matches SummaryCard)
 *   - Warm beige/navy tinted borders (matches EstateCategoryCard)
 *   - Close-circle delete icon top-right (matches EstateCategoryCard)
 *   - Tapping the card triggers edit
 *
 * @module components/ui/AssetCard
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius, Shadows } from '../../styles/constants';
import { getAssetTitle, getAssetSubline } from '../../utils/assetDisplayFields';
import type { Asset } from '../../types';

export interface AssetCardProps {
  asset: Asset;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onEdit, onDelete }) => {
  const title = getAssetTitle(asset);
  const subline = getAssetSubline(asset);
  const isValueUnknown = asset.estimatedValueUnknown === true;
  const value = asset.estimatedValue || 0;

  return (
    <View style={styles.cardWrapper}>
      {/* Close / delete icon — top-right */}
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(asset.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeButton}
          accessibilityLabel={`Delete ${title}`}
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
        style={styles.card}
        activeOpacity={onEdit ? 0.7 : 1}
        onPress={onEdit ? () => onEdit(asset.id) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${isValueUnknown ? 'value unknown' : `£${value.toLocaleString()}`}${subline ? `, ${subline}` : ''}`}
      >
        {/* Green accent bar */}
        <View style={styles.accentBar} />

        {/* Left: title + subline */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subline && (
            <Text style={styles.subline} numberOfLines={1}>{subline}</Text>
          )}
        </View>

        {/* Right: value + chevron */}
        <View style={styles.rightSection}>
          <Text style={styles.value}>{isValueUnknown ? '?' : `£${value.toLocaleString()}`}</Text>
          {onEdit && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={KindlingColors.mutedForeground}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

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
    borderColor: `${KindlingColors.navy}10`,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingLeft: Spacing.md + 4,
    minHeight: 56,
    overflow: 'hidden',
    ...Shadows.small,
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
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  subline: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.brown,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  value: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
  },
});
