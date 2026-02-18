/**
 * DraftBanner — warm banner + discreet discard button for draft auto-save.
 *
 * Renders a cream/beige strip at the top of a form when a draft has been
 * restored or the user has unsaved changes. Copy varies by mode:
 *   - New asset with draft:     "Continue where you left off with your {category}"
 *   - Editing with changes:     "Continue editing your {category} where you left off"
 *
 * The discard button copy also varies:
 *   - New asset:     "Clear form"
 *   - Editing:       "Revert changes"
 *
 * @module components/ui/DraftBanner
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

interface DraftBannerProps {
  /** Friendly category name for the copy, e.g. "property", "bank account" */
  categoryLabel: string;
  /** true when editing an existing asset (affects copy) */
  isEditing: boolean;
  /** Called when user taps "Clear form" or "Revert changes" */
  onDiscard: () => void;
  /** Whether the banner is visible */
  visible: boolean;
}

export function DraftBanner({ categoryLabel, isEditing, onDiscard, visible }: DraftBannerProps) {
  if (!visible) return null;

  const bannerText = isEditing
    ? `Continue editing, or: `
    : `Continue where you left off, or: `;

  const discardLabel = isEditing ? 'Revert changes' : 'Clear form';

  return (
    <View style={styles.container} testID="draft-banner">
      <Text style={styles.bannerText}>{bannerText}</Text>
      <TouchableOpacity onPress={onDiscard} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID="draft-banner-discard">
        <Text style={styles.discardText}>{discardLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${KindlingColors.beige}30`,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: `${KindlingColors.beige}60`,
  },
  bannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
    marginRight: Spacing.sm,
  },
  discardText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
});
