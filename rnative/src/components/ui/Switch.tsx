/**
 * Switch Component
 * 
 * A toggle switch component using React Native Paper's Switch
 * 
 * @module components/ui/Switch
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Switch as PaperSwitch, Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Switch component props
 */
export interface SwitchProps {
  /**
   * Switch label
   */
  label?: string;
  
  /**
   * Whether switch is on
   */
  value: boolean;
  
  /**
   * Change handler
   */
  onValueChange: (value: boolean) => void;
  
  /**
   * Whether switch is disabled
   */
  disabled?: boolean;
}

/**
 * Switch toggle component
 * 
 * @example
 * ```tsx
 * <Switch
 *   label="Primary Residence"
 *   value={isPrimaryResidence}
 *   onValueChange={setIsPrimaryResidence}
 * />
 * ```
 */
export const Switch: React.FC<SwitchProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={styles.container}
      activeOpacity={0.7}
    >
      {label && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
      <PaperSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        color={KindlingColors.green}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: 16,
    color: KindlingColors.navy,
    flex: 1,
    marginRight: Spacing.md,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});

