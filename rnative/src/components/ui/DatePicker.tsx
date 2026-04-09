/**
 * DatePicker Component
 * 
 * A native date picker component that adapts to platform standards.
 * - iOS: Opens a modal with a spinner/calendar
 * - Android: Opens the native date picker dialog
 * 
 * @module components/ui/DatePicker
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform, ViewStyle } from 'react-native';
import { Text, Button } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import { IconButton } from 'react-native-paper';

/**
 * DatePicker props
 */
export interface DatePickerProps {
  /**
   * Label for the field
   */
  label?: string;
  
  /**
   * Current value (Date object or ISO string)
   */
  value?: Date | string | null;
  
  /**
   * Change handler
   */
  onChange: (date: Date) => void;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Disabled state
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
   * Minimum date
   */
  minDate?: Date;
  
  /**
   * Maximum date
   */
  maxDate?: Date;
  
  /**
   * Style overrides
   */
  style?: ViewStyle;
}

/**
 * Format date to DD-MM-YYYY string
 */
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Parse value to Date object
 */
const parseValue = (value?: Date | string | null): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
};

/**
 * Native DatePicker component
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
  disabled = false,
  error = false,
  errorMessage,
  minDate,
  maxDate,
  style,
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parseValue(value));

  // Handle value changes from the native picker
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false); // Android picker dismisses itself, but we sync state
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS: Update temp state, confirm on button press
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  // Confirm selection on iOS
  const handleConfirmIOS = () => {
    onChange(tempDate);
    setShow(false);
  };

  // Open picker
  const handlePress = () => {
    if (disabled) return;
    setTempDate(parseValue(value)); // Reset temp date to current value
    setShow(true);
  };

  const displayValue = value ? formatDate(parseValue(value)) : placeholder;
  const isPlaceholder = !value;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
      >
        <Text style={[
          styles.inputText,
          isPlaceholder && styles.placeholderText
        ]}>
          {displayValue}
        </Text>
        <IconButton
          icon="calendar"
          size={20}
          iconColor={isPlaceholder ? KindlingColors.mutedForeground : KindlingColors.navy}
          style={styles.icon}
        />
      </TouchableOpacity>
      
      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* Android Picker */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={parseValue(value)}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}

      {/* iOS Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          transparent
          visible={show}
          animationType="slide"
          supportedOrientations={['portrait', 'landscape']}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              onPress={() => setShow(false)} 
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Button onPress={() => setShow(false)} textColor={KindlingColors.mutedForeground}>
                  Cancel
                </Button>
                <Button onPress={handleConfirmIOS} textColor={KindlingColors.green} labelStyle={{ fontWeight: 'bold' }}>
                  Done
                </Button>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                style={styles.iosPicker}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: KindlingColors.navy,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: KindlingColors.border,
    borderRadius: 8,
    backgroundColor: KindlingColors.background,
    paddingHorizontal: 12,
    paddingVertical: 12, // Matches text input height roughly
    minHeight: 56,
  },
  inputError: {
    borderColor: KindlingColors.destructive,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: KindlingColors.muted,
  },
  inputText: {
    fontSize: 16,
    color: KindlingColors.navy,
    flex: 1,
  },
  placeholderText: {
    color: KindlingColors.mutedForeground,
  },
  icon: {
    margin: 0,
  },
  errorText: {
    color: KindlingColors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
  // iOS Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: KindlingColors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Spacing.xl, // Safety for home indicator
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
    backgroundColor: KindlingColors.muted,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iosPicker: {
    height: 200,
    backgroundColor: KindlingColors.background,
  },
});

