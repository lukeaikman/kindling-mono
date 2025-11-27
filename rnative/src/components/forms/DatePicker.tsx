/**
 * DatePicker Component
 * 
 * A native date picker component for React Native
 * Uses platform-specific native date pickers (iOS UIDatePicker, Android DatePickerDialog)
 * 
 * Features:
 * - Native date picker UI on iOS and Android
 * - Display format: DD-MM-YYYY (UK standard)
 * - Storage format: YYYY-MM-DD (ISO standard)
 * - Validates date inputs
 * - Consistent with Kindling brand styling
 * 
 * @module components/forms/DatePicker
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Input } from '../ui/Input';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * DatePicker component props
 */
export interface DatePickerProps {
  /**
   * Label for the date picker
   */
  label?: string;
  
  /**
   * Current date value in YYYY-MM-DD format
   * @example "1990-05-15"
   */
  value: string;
  
  /**
   * Change handler - receives date in YYYY-MM-DD format
   */
  onChange: (date: string) => void;
  
  /**
   * Placeholder text
   * @default "DD-MM-YYYY"
   */
  placeholder?: string;
  
  /**
   * Whether picker is disabled
   */
  disabled?: boolean;
  
  /**
   * Error state
   */
  error?: boolean;
  
  /**
   * Error message
   */
  errorMessage?: string;
  
  /**
   * Minimum selectable date (YYYY-MM-DD format)
   */
  minimumDate?: Date;
  
  /**
   * Maximum selectable date (YYYY-MM-DD format)
   */
  maximumDate?: Date;
}

/**
 * Convert YYYY-MM-DD to DD-MM-YYYY for display
 */
const formatDateForDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return isoDate;
};

/**
 * Convert DD-MM-YYYY to YYYY-MM-DD for storage
 */
const formatDateForStorage = (displayDate: string): string => {
  if (!displayDate) return '';
  const parts = displayDate.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  return displayDate;
};

/**
 * Convert YYYY-MM-DD string to Date object
 */
const stringToDate = (isoDate: string): Date => {
  if (!isoDate) return new Date();
  return new Date(isoDate);
};

/**
 * Convert Date object to YYYY-MM-DD string
 */
const dateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * DatePicker component with native picker UI
 * 
 * On iOS: Shows inline wheel picker or modal based on iOS version
 * On Android: Shows native DatePickerDialog
 * 
 * @example
 * ```tsx
 * <DatePicker
 *   label="Date of Birth"
 *   value={dateOfBirth}
 *   onChange={setDateOfBirth}
 *   placeholder="DD-MM-YYYY"
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // With min/max dates
 * <DatePicker
 *   label="Start Date"
 *   value={startDate}
 *   onChange={setStartDate}
 *   minimumDate={new Date()}
 *   maximumDate={new Date(2030, 11, 31)}
 * />
 * ```
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
  disabled = false,
  error = false,
  errorMessage,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ? stringToDate(value) : new Date());
  
  // Display value in DD-MM-YYYY format
  const displayValue = value ? formatDateForDisplay(value) : '';
  
  // Handle date change from native picker
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, picker closes automatically
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      const isoDate = dateToString(selectedDate);
      setTempDate(selectedDate);
      onChange(isoDate);
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };
  
  // Handle iOS "Done" button (close picker)
  const handleIOSDone = () => {
    setShowPicker(false);
  };
  
  // Open the picker
  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Input field (acts as trigger) */}
      <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.7}>
        <View pointerEvents="none">
          <Input
            label={label}
            value={displayValue}
            onChangeText={() => {}} // No-op, handled by picker
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            errorMessage={errorMessage}
            leftIcon="calendar"
          />
        </View>
      </TouchableOpacity>
      
      {/* Native Date Picker */}
      {showPicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={handleIOSDone}>
                  <Text style={styles.iosDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={KindlingColors.navy}
              />
            </View>
          )}
          
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  iosPickerContainer: {
    backgroundColor: KindlingColors.background,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  iosDoneButton: {
    color: KindlingColors.green,
    fontSize: 16,
    fontWeight: '600',
  },
});
