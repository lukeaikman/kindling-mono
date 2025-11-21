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
export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'value' | 'onChangeText'> {
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
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(formatCurrency(value));
  
  const handleChange = (text: string) => {
    setDisplayValue(text);
    const numericValue = parseCurrency(text);
    onValueChange(numericValue);
  };
  
  const handleBlur = () => {
    // Reformat on blur to ensure consistent formatting
    setDisplayValue(formatCurrency(value));
  };
  
  return (
    <Input
      {...props}
      value={displayValue}
      onChangeText={handleChange}
      type="number"
      leftIcon="currency-gbp"
      placeholder="£0"
    />
  );
};

