/**
 * DatePicker Component
 * 
 * A date picker component for React Native
 * Uses a simple date input for now (will enhance with native date picker later)
 * 
 * @module components/forms/DatePicker
 */

import React from 'react';
import { Input } from '../ui/Input';
import { formatDateForInput } from '../../utils/helpers';

/**
 * DatePicker component props
 */
export interface DatePickerProps {
  /**
   * Label for the date picker
   */
  label?: string;
  
  /**
   * Current date value
   */
  value: Date | null;
  
  /**
   * Change handler
   */
  onChange: (date: Date | null) => void;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Whether picker is disabled
   */
  disabled?: boolean;
}

/**
 * DatePicker component
 * 
 * @example
 * ```tsx
 * <DatePicker
 *   label="Date of Birth"
 *   value={dateOfBirth}
 *   onChange={setDateOfBirth}
 * />
 * ```
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
}) => {
  const displayValue = value ? formatDateForInput(value) : '';
  
  const handleChange = (text: string) => {
    // Simple date parsing for now
    // TODO: Add proper date validation and native date picker
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      onChange(date);
    } else {
      onChange(null);
    }
  };
  
  return (
    <Input
      label={label}
      value={displayValue}
      onChangeText={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      leftIcon="calendar"
    />
  );
};

