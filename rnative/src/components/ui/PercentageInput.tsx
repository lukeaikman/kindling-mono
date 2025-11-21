/**
 * PercentageInput Component
 * 
 * A specialized input for percentage values (0-100%)
 * Handles validation and formatting
 * 
 * @module components/ui/PercentageInput
 */

import React, { useState } from 'react';
import { Input, InputProps } from './Input';
import { formatPercentage } from '../../utils/helpers';

/**
 * PercentageInput component props
 */
export interface PercentageInputProps extends Omit<InputProps, 'type' | 'value' | 'onChangeText'> {
  /**
   * Numeric value (0-100)
   */
  value: number;
  
  /**
   * Change handler (receives numeric value)
   */
  onValueChange: (value: number) => void;
  
  /**
   * Minimum allowed value (default: 0)
   */
  min?: number;
  
  /**
   * Maximum allowed value (default: 100)
   */
  max?: number;
}

/**
 * Percentage input component with % formatting and validation
 * 
 * @example
 * ```tsx
 * <PercentageInput
 *   label="Ownership Percentage"
 *   value={ownershipPercentage}
 *   onValueChange={setOwnershipPercentage}
 * />
 * ```
 */
export const PercentageInput: React.FC<PercentageInputProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());
  const [error, setError] = useState(false);
  
  const handleChange = (text: string) => {
    setDisplayValue(text);
    
    // Parse the numeric value
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(cleanedText);
    
    if (isNaN(numericValue)) {
      setError(true);
      return;
    }
    
    // Validate range
    if (numericValue < min || numericValue > max) {
      setError(true);
    } else {
      setError(false);
      onValueChange(numericValue);
    }
  };
  
  const handleBlur = () => {
    // Clamp value to range and reformat
    const clampedValue = Math.max(min, Math.min(max, value));
    setDisplayValue(clampedValue.toString());
    setError(false);
    
    if (clampedValue !== value) {
      onValueChange(clampedValue);
    }
  };
  
  return (
    <Input
      {...props}
      value={displayValue}
      onChangeText={handleChange}
      type="number"
      rightIcon="percent"
      placeholder="0"
      error={error || props.error}
      errorMessage={error ? `Value must be between ${min} and ${max}` : props.errorMessage}
    />
  );
};

