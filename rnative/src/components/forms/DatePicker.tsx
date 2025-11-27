/**
 * DatePicker Component - Native Implementation
 * 
 * Uses @react-native-community/datetimepicker with Modal wrapper for iOS
 * 
 * Implementation follows strict minimal structure:
 * - Modal -> View (overlay) -> View (picker container) -> DateTimePicker
 * - No extra wrappers, no width constraints unless proven necessary
 * 
 * @module components/forms/DatePicker
 */

import React, { useState } from 'react';
import { View, Modal, StyleSheet, Platform, TouchableOpacity, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
  
  /**
   * Minimum selectable date
   */
  minimumDate?: Date;
  
  /**
   * Maximum selectable date
   */
  maximumDate?: Date;
}

/**
 * Format date for display (DD-MM-YYYY)
 */
const formatDateForDisplay = (date: Date | null): string => {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * DatePicker component with native picker
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
  placeholder = 'DD-MM-YYYY',
  disabled = false,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const displayDate = value || new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      // User cancelled - don't update value
      setShowPicker(false);
    }
  };

  const handleDone = () => {
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  // Handle press - opens picker (prevents keyboard)
  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  // Android: Show picker directly (native modal)
  if (Platform.OS === 'android') {
    return (
      <>
        <Pressable onPress={handlePress} disabled={disabled}>
          <Input
            label={label}
            value={formatDateForDisplay(value)}
            onChangeText={() => {}} // Read-only, opens picker
            placeholder={placeholder}
            disabled={disabled}
            editable={false}
            leftIcon="calendar"
            onFocus={handlePress} // Also handle focus as fallback
          />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={displayDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )}
      </>
    );
  }

  // iOS: Show in Modal with minimal structure
  // STEP 1: Absolute minimum - Modal -> View (overlay) -> View (container) -> DateTimePicker
  return (
    <>
      <Pressable onPress={handlePress} disabled={disabled}>
        <Input
          label={label}
          value={formatDateForDisplay(value)}
          onChangeText={() => {}} // Read-only, opens picker
          placeholder={placeholder}
          disabled={disabled}
          editable={false}
          leftIcon="calendar"
          onFocus={handlePress} // Also handle focus as fallback
        />
      </Pressable>
      
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        {/* Overlay: flex: 1, justifyContent: 'flex-end', backgroundColor */}
        <TouchableOpacity
          style={styles.iosOverlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          {/* Picker container: backgroundColor ONLY (no width, no alignSelf, no constraints) */}
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={displayDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
            
            {/* Action buttons */}
            <View style={styles.iosActions}>
              <Button
                variant="outline"
                onPress={handleCancel}
                style={styles.actionButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleDone}
                style={styles.actionButton}
              >
                Done
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iosOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosPickerContainer: {
    backgroundColor: KindlingColors.background,
    // NO width, NO alignSelf, NO constraints
    // Let DateTimePicker handle its own layout
  },
  iosActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
});
