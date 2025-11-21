/**
 * RadioGroup Component
 * 
 * A radio button group component using React Native Paper's RadioButton
 * 
 * @module components/ui/RadioGroup
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
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
 * RadioGroup component
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
          <RadioButton.Item
            key={option.value}
            label={option.label}
            value={option.value}
            disabled={disabled}
            color={KindlingColors.green}
            labelStyle={styles.itemLabel}
            style={styles.item}
          />
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
  item: {
    paddingVertical: Spacing.xs,
  },
  itemLabel: {
    fontSize: 16,
    color: KindlingColors.navy,
  },
});

