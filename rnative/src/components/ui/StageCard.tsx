/**
 * StageCard Component
 *
 * A card component for displaying will creation stages
 * Shows title, status, subline, and a chevron for navigation
 *
 * @module components/ui/StageCard
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

/**
 * Stage status types
 */
export type StageStatus = 'Not started' | 'In progress' | 'Complete';

/**
 * StageCard component props
 */
export interface StageCardProps {
  /**
   * Stage title (e.g., "Your People")
   */
  title: string;

  /**
   * Current status of the stage
   */
  status: StageStatus;

  /**
   * Descriptive subline with time estimate
   */
  subline: string;

  /**
   * Press handler for navigation
   */
  onPress?: () => void;

  /**
   * Whether the card is disabled (future stages)
   */
  disabled?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;

  /**
   * Additional style overrides
   */
  style?: ViewStyle;
}

/**
 * Get status text color based on status
 */
const getStatusColor = (status: StageStatus): string => {
  switch (status) {
    case 'Complete':
      return KindlingColors.green;
    case 'In progress':
    case 'Not started':
    default:
      return KindlingColors.mutedForeground;
  }
};

/**
 * StageCard component for will dashboard stages
 *
 * @example
 * ```tsx
 * <StageCard
 *   title="Your People"
 *   status="In progress"
 *   subline="Add partner, children, guardians · 3 mins"
 *   onPress={() => navigate('your-people')}
 * />
 * ```
 */
export const StageCard: React.FC<StageCardProps> = ({
  title,
  status,
  subline,
  onPress,
  disabled = false,
  testID,
  style,
}) => {
  const statusColor = getStatusColor(status);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.containerDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${status}`}
      accessibilityHint={subline}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
          <Text style={styles.subline}>{subline}</Text>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={disabled ? KindlingColors.border : KindlingColors.mutedForeground}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: KindlingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    padding: Spacing.md,
    minHeight: 48,
    ...Shadows.small,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  status: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    marginBottom: Spacing.xs,
  },
  subline: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.mutedForeground,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});
