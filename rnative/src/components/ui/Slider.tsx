/**
 * Slider Component
 * 
 * A slider component using React Native's built-in Slider
 * Used for percentage inputs and range selections
 * 
 * @module components/ui/Slider
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Slider component props
 */
export interface SliderProps {
  /**
   * Slider label
   */
  label?: string;
  
  /**
   * Current value
   */
  value: number;
  
  /**
   * Change handler
   */
  onValueChange: (value: number) => void;
  
  /**
   * Minimum value
   */
  minimumValue?: number;
  
  /**
   * Maximum value
   */
  maximumValue?: number;
  
  /**
   * Step increment
   */
  step?: number;
  
  /**
   * Whether slider is disabled
   */
  disabled?: boolean;
  
  /**
   * Show value label
   */
  showValue?: boolean;
  
  /**
   * Value formatter (e.g., to add %)
   */
  formatValue?: (value: number) => string;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
}

/**
 * Slider component for range inputs
 * 
 * @example
 * ```tsx
 * <Slider
 *   label="Ownership Percentage"
 *   value={percentage}
 *   onValueChange={setPercentage}
 *   minimumValue={0}
 *   maximumValue={100}
 *   step={1}
 *   showValue
 *   formatValue={(val) => `${val}%`}
 * />
 * ```
 */
export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  showValue = true,
  formatValue = (val) => val.toString(),
  style,
}) => {
  // Note: We need to install @react-native-community/slider
  // For now, this is a placeholder that will work once installed
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        {label && <Text style={styles.label}>{label}</Text>}
        {showValue && (
          <Text style={styles.value}>{formatValue(value)}</Text>
        )}
      </View>
      
      {/* Placeholder for slider - will use @react-native-community/slider */}
      <View style={styles.sliderPlaceholder}>
        <Text style={styles.placeholderText}>
          Slider: {formatValue(value)} (requires @react-native-community/slider)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: KindlingColors.navy,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.green,
  },
  sliderPlaceholder: {
    height: 40,
    backgroundColor: KindlingColors.muted,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  placeholderText: {
    color: KindlingColors.mutedForeground,
    fontSize: 14,
  },
});

