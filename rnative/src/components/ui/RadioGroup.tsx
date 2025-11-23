/**
 * RadioGroup Component
 * 
 * A radio button group component built manually with React Native primitives
 * and Paper's RadioButton for the circle visual.
 * 
 * We build this manually instead of using RadioButton.Item because:
 * - RadioButton.Item wasn't rendering the radio circle properly
 * - Manual build gives full control over styling
 * - Designer can customize every aspect later
 * - Consistent pattern with our Checkbox component
 * 
 * @module components/ui/RadioGroup
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { RadioButton, Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Radio option interface
 */
export interface RadioOption {
  label: string;
  value: string;
}

/**
 * RadioGroup component props
 */
export interface RadioGroupProps {
  /**
   * Group label
   */
  label?: string;
  
  /**
   * Currently selected value
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (value: string) => void;
  
  /**
   * Array of radio options
   */
  options: RadioOption[];
  
  /**
   * Whether group is disabled
   */
  disabled?: boolean;
}

/**
 * RadioGroup component with manual layout for full control
 * 
 * Each option is a clickable row with:
 * - Radio circle (left) - uses Paper's RadioButton for the circle visual
 * - Label text (right) - fully customizable typography
 * - Subtle background highlight when selected
 * - Active opacity for press feedback
 * 
 * @example
 * ```tsx
 * <RadioGroup
 *   label="Will Type"
 *   value={willType}
 *   onChange={setWillType}
 *   options={[
 *     { label: 'Simple Will', value: 'simple' },
 *     { label: 'Complex Will', value: 'complex' },
 *   ]}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Disabled state
 * <RadioGroup
 *   label="Locked Options"
 *   value={selected}
 *   onChange={setSelected}
 *   options={options}
 *   disabled={true}
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <RadioButton.Group onValueChange={onChange} value={value}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.optionContainer,
              value === option.value && styles.optionContainerSelected,
              disabled && styles.optionContainerDisabled
            ]}
          >
            {/* Use platform-specific RadioButton components for guaranteed rendering */}
            {Platform.OS === 'android' ? (
              <RadioButton.Android
                value={option.value}
                disabled={disabled}
                color={KindlingColors.green}
                uncheckedColor={KindlingColors.border}
              />
            ) : (
              <RadioButton.IOS
                value={option.value}
                disabled={disabled}
                color={KindlingColors.green}
              />
            )}
            <Text style={[
              styles.optionLabel,
              value === option.value && styles.optionLabelSelected,
              disabled && styles.optionLabelDisabled
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </RadioButton.Group>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    backgroundColor: KindlingColors.background,
  },
  optionContainerSelected: {
    backgroundColor: `${KindlingColors.green}10`, // 10% opacity green background
  },
  optionContainerDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 16,
    color: KindlingColors.navy,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: KindlingColors.green,
  },
  optionLabelDisabled: {
    opacity: 0.5,
  },
});

