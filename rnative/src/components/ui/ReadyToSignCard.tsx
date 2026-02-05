/**
 * ReadyToSignCard Component
 *
 * A compact card showing signing eligibility status
 * Displays different states: not eligible, waiting for acceptances, or ready
 *
 * @module components/ui/ReadyToSignCard
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
 * ReadyToSignCard component props
 */
export interface ReadyToSignCardProps {
  /**
   * Whether all stages are complete and invitations accepted
   */
  eligible: boolean;

  /**
   * Whether waiting for executor/guardian acceptances
   * Only relevant when stages are complete but can't sign yet
   */
  waitingForAcceptances?: boolean;

  /**
   * Press handler
   */
  onPress?: () => void;

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
 * Get the appropriate copy based on eligibility state
 */
const getStatusCopy = (
  eligible: boolean,
  waitingForAcceptances: boolean
): string => {
  if (eligible) {
    return "You're ready to sign";
  }
  if (waitingForAcceptances) {
    return 'Waiting for executors and guardians to accept';
  }
  return 'Complete all three sections to unlock signing';
};

/**
 * ReadyToSignCard component for will dashboard
 *
 * @example
 * ```tsx
 * <ReadyToSignCard
 *   eligible={false}
 *   waitingForAcceptances={false}
 *   onPress={() => handleSigningPress()}
 * />
 * ```
 */
export const ReadyToSignCard: React.FC<ReadyToSignCardProps> = ({
  eligible,
  waitingForAcceptances = false,
  onPress,
  testID,
  style,
}) => {
  const statusCopy = getStatusCopy(eligible, waitingForAcceptances);
  const iconName = eligible ? 'check-circle' : 'lock';
  const iconColor = eligible ? KindlingColors.green : KindlingColors.mutedForeground;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        eligible && styles.containerEligible,
        !eligible && styles.containerDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Ready to sign, ${statusCopy}`}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={iconColor}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Ready to sign</Text>
          <Text style={[styles.statusCopy, eligible && styles.statusCopyEligible]}>
            {statusCopy}
          </Text>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={KindlingColors.mutedForeground}
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
  containerEligible: {
    backgroundColor: `${KindlingColors.green}0d`, // 5% opacity green tint
    borderColor: `${KindlingColors.green}33`, // 20% opacity green border
  },
  containerDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Spacing.md,
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
  statusCopy: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: KindlingColors.mutedForeground,
  },
  statusCopyEligible: {
    color: KindlingColors.green,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});
