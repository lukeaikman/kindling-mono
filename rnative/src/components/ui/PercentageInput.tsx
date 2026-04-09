/**
 * PercentageInput Component
 * 
 * A specialized input for percentage values (0-100%)
 * Handles validation and formatting
 * 
 * @module components/ui/PercentageInput
 */

import React, { useState, useEffect } from 'react';
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
  // Show placeholder when value is 0, otherwise show the value
  const [displayValue, setDisplayValue] = useState(value === 0 ? '' : value.toString());
  const [error, setError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Update display value when prop value changes externally (but not while user is typing)
  useEffect(() => {
    if (!isFocused) {
      // Only sync when input is not focused (user finished editing)
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toString());
      }
    }
  }, [value, isFocused]);
  
  const handleChange = (text: string) => {
    setDisplayValue(text);
    
    // If empty, clear the value
    if (text === '' || text.trim() === '') {
      onValueChange(0);
      setError(false);
      return;
    }
    
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
    // If empty on blur, set to 0
    if (displayValue === '' || displayValue.trim() === '') {
      setDisplayValue('');
      onValueChange(0);
      setError(false);
      return;
    }
    
    // Clamp value to range and reformat
    const clampedValue = Math.max(min, Math.min(max, value));
    setDisplayValue(clampedValue === 0 ? '' : clampedValue.toString());
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
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        handleBlur();
      }}
      type="number"
      rightIcon={props.rightIcon === "" ? undefined : (props.rightIcon || "percent")}
      placeholder={props.placeholder || "0"}
      error={error || props.error}
      errorMessage={error ? `Value must be between ${min} and ${max}` : props.errorMessage}
    />
  );
};

