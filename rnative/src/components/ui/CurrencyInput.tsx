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
  const isFocusedRef = React.useRef(false);
  
  // Update display only when value changes externally (e.g., "Unsure" checkbox clears it).
  // Skip while the user is actively typing — formatting/rounding happens on blur.
  // Only clear to '' when disabled (Unsure ticked) — a genuine user-typed 0 must persist.
  React.useEffect(() => {
    if (isFocusedRef.current) return;
    if (value === 0 && disabled) {
      setDisplayValue('');
    } else if (value > 0) {
      setDisplayValue(value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    }
  }, [value, disabled]);
  
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
  
  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    // Format with commas on blur — preserve user-typed 0 (displayValue !== '')
    if (value >= 0 && displayValue !== '') {
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
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType="numeric"
      leftIcon="currency-gbp"
      placeholder="0"
      disabled={disabled}
      clearButtonMode={clearButtonMode}
    />
  );
};

