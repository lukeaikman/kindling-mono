/**
 * DatePicker Component
 * 
 * A native date picker component for React Native
 * Simple wrapper around platform date pickers
 * 
 * @module components/forms/DatePicker
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { Button } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Input } from '../ui/Input';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

export interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  minimumDate?: Date;
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
 * DatePicker component
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
  
  const displayValue = value ? formatDateForDisplay(value) : '';
  
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      const isoDate = dateToString(selectedDate);
      setTempDate(selectedDate);
      onChange(isoDate);
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };
  
  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.7}>
        <View pointerEvents="none">
          <Input
            label={label}
            value={displayValue}
            onChangeText={() => {}}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            errorMessage={errorMessage}
            leftIcon="calendar"
          />
        </View>
      </TouchableOpacity>
      
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal
            transparent
            animationType="slide"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.iosModal}>
              <View style={styles.iosPickerWrapper}>
                <View style={styles.iosHeader}>
                  <Button onPress={() => setShowPicker(false)} textColor={KindlingColors.green}>
                    Done
                  </Button>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  iosModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosPickerWrapper: {
    backgroundColor: KindlingColors.background,
    alignSelf: 'stretch',
  },
  iosHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
});
