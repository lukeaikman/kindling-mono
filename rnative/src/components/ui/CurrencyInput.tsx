/**
 * CurrencyInput Component
 * 
 * A specialized input for currency amounts (£)
 * Handles formatting with thousands separators
 * 
 * @module components/ui/CurrencyInput
 */

import React, { useState } from 'react';
import { Input, InputProps } from './Input';
import { formatCurrency, parseCurrency } from '../../utils/helpers';

/**
 * CurrencyInput component props
 */
export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'value' | 'onChangeText' | 'onBlur' | 'keyboardType'> {
  /**
   * Numeric value (in pounds)
   */
  value: number;
  
  /**
   * Change handler (receives numeric value)
   */
  onValueChange: (value: number) => void;
}

/**
 * Currency input component with £ formatting
 * 
 * @example
 * ```tsx
 * <CurrencyInput
 *   label="Property Value"
 *   value={propertyValue}
 *   onValueChange={setPropertyValue}
 * />
 * ```
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  disabled = false,
  clearButtonMode = 'while-editing',
  ...props
}) => {
  // Display value as plain number (no £ in the text itself)
  const [displayValue, setDisplayValue] = React.useState(value > 0 ? value.toString() : '');
  
  // Update display when value changes externally (e.g., "Not sure" clears it)
  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else if (value > 0) {
      setDisplayValue(value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    }
  }, [value]);
  
  const handleChange = (text: string) => {
    // Only allow digits and one decimal point
    const filtered = text.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = filtered.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;
    
    setDisplayValue(sanitized);
    const numericValue = parseCurrency(sanitized);
    onValueChange(numericValue);
  };
  
  const handleBlur = () => {
    // Format number with commas on blur (no £ symbol in text)
    if (value > 0) {
      setDisplayValue(value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    } else {
      setDisplayValue('');
    }
  };
  
  return (
    <Input
      {...props}
      value={displayValue}
      onChangeText={handleChange}
      onBlur={handleBlur}
      keyboardType="numeric"
      leftIcon="currency-gbp"
      placeholder="0"
      disabled={disabled}
      clearButtonMode={clearButtonMode}
    />
  );
};

