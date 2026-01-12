/**
 * BackButton Component
 * 
 * A lightweight back navigation button for headers
 * Displays as text with a chevron icon instead of a heavy button
 * 
 * @module components/ui/BackButton
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Typography } from '../../styles/constants';

/**
 * BackButton props
 */
export interface BackButtonProps {
  /**
   * Back action handler
   */
  onPress: () => void;
  
  /**
   * Custom label (default: "Back")
   */
  label?: string;
  
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
}

/**
 * BackButton component for header navigation
 * 
 * @example
 * ```tsx
 * <BackButton onPress={() => router.back()} />
 * ```
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  label = 'Back',
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      style={[styles.container, disabled && styles.disabled]}
    >
      <IconButton
        icon="chevron-left"
        size={20}
        iconColor={KindlingColors.navy}
        style={styles.icon}
      />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8, // Offset icon button padding for alignment
  },
  icon: {
    margin: 0,
  },
  label: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: -4, // Tighten spacing between icon and text
  },
  disabled: {
    opacity: 0.5,
  },
});





