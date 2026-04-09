/**
 * SummaryCard Component
 *
 * A warm, readable card for stage summary screens. Shows an icon,
 * title, human-readable sentences, optional detail lines, and an
 * optional edit affordance.
 *
 * Reusable across all stage summaries (Your People, Your Estate, Legal Check).
 *
 * @module components/ui/SummaryCard
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography, BorderRadius } from '../../styles/constants';

export interface SummaryCardProps {
  /** MaterialCommunityIcons name */
  icon: string;
  /** Section title (e.g. "Guardians") */
  title: string;
  /** Human-readable sentences — the main content */
  sentences: string[];
  /** Optional subtle secondary lines (percentages, roles, status) */
  details?: string[];
  /** If provided, shows a pencil icon that calls this on tap */
  onEdit?: () => void;
  /** Optional style override */
  style?: ViewStyle;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  title,
  sentences,
  details,
  onEdit,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Green accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.cardInner}>
        {/* Header row: icon + title + edit */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name={icon as any}
                size={16}
                color={KindlingColors.navy}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={KindlingColors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Sentences */}
        <View style={styles.sentencesContainer}>
          {sentences.map((sentence, idx) => (
            <Text key={idx} style={styles.sentence}>
              {sentence}
            </Text>
          ))}
        </View>

        {/* Details */}
        {details && details.length > 0 && (
          <View style={styles.detailsContainer}>
            {details.map((detail, idx) => (
              <Text key={idx} style={styles.detail}>
                {detail}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${KindlingColors.navy}10`,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    backgroundColor: KindlingColors.green,
  },
  cardInner: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${KindlingColors.navy}0d`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sentencesContainer: {
    gap: Spacing.xs,
  },
  sentence: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.md * 1.5,
  },
  detailsContainer: {
    gap: 2,
    marginTop: Spacing.xs,
  },
  detail: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
});
