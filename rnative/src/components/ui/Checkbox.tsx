/**
 * Checkbox Component
 * 
 * A styled checkbox component wrapping React Native Paper's Checkbox
 * 
 * @module components/ui/Checkbox
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Checkbox component props
 */
export interface CheckboxProps {
  /**
   * Checkbox label
   */
  label?: string;
  
  /**
   * Whether checkbox is checked
   */
  checked: boolean;
  
  /**
   * Change handler
   */
  onCheckedChange: (checked: boolean) => void;
  
  /**
   * Whether checkbox is disabled
   */
  disabled?: boolean;
  
  /**
   * Custom border color for unchecked state (matches adjacent info boxes)
   */
  borderColor?: string;
}

/**
 * Checkbox component
 * 
 * @example
 * ```tsx
 * <Checkbox
 *   label="I agree to the terms"
 *   checked={agreed}
 *   onCheckedChange={setAgreed}
 * />
 * ```
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onCheckedChange,
  disabled = false,
  borderColor,
}) => {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkboxCircle, 
        checked && styles.checkboxCircleSelected,
        borderColor && !checked && { borderColor }
      ]}>
        {checked && (
          <IconButton
            icon="check"
            size={16}
            iconColor={KindlingColors.background}
            style={styles.checkIcon}
          />
        )}
      </View>
      {label && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}4D`, // Visible border matching pattern from bank-accounts/entry.tsx
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  label: {
    fontSize: 16,
    color: KindlingColors.navy,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});

