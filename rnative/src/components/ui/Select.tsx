/**
 * Select Component
 * 
 * A dropdown select component using React Native Paper's Menu
 * Provides a clean interface for selecting from a list of options
 * 
 * @module components/ui/Select
 */

import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Menu, Button, Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Select option interface
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps {
  /**
   * Label for the select
   */
  label?: string;
  
  /**
   * Currently selected value
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (value: string) => void;
  
  /**
   * Array of options
   */
  options: SelectOption[];
  
  /**
   * Placeholder text when nothing selected
   */
  placeholder?: string;
  
  /**
   * Whether select is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether select has error
   */
  error?: boolean;
  
  /**
   * Error message
   */
  errorMessage?: string;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
}

/**
 * Select dropdown component
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Property Type"
 *   value={propertyType}
 *   onChange={setPropertyType}
 *   options={[
 *     { label: 'Residential', value: 'residential' },
 *     { label: 'Commercial', value: 'commercial' },
 *   ]}
 *   placeholder="Select property type"
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  error = false,
  errorMessage,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);

  const openMenu = () => !disabled && setVisible(true);
  const closeMenu = () => {
    setVisible(false);
    setMenuKey(prev => prev + 1);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    closeMenu();
  };

  // Find the selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Menu
        key={menuKey}
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            disabled={disabled}
            icon="chevron-down"
            contentStyle={styles.buttonContent}
            style={[
              styles.selectButton,
              error && styles.selectButtonError,
              disabled && styles.selectButtonDisabled
            ]}
            labelStyle={[
              styles.selectButtonLabel,
              !selectedOption && styles.placeholderText
            ]}
          >
            {displayValue}
          </Button>
        }
        contentStyle={styles.menuContent}
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value || option.label}
            onPress={() => !option.disabled && handleSelect(option.value)}
            title={option.label}
            disabled={option.disabled}
            titleStyle={value === option.value ? styles.selectedItem : undefined}
          />
        ))}
      </Menu>
      
      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
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
  selectButton: {
    borderColor: KindlingColors.border,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'flex-start',
  },
  selectButtonError: {
    borderColor: KindlingColors.destructive,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  selectButtonLabel: {
    color: KindlingColors.navy,
    fontSize: 16,
    textAlign: 'left',
  },
  placeholderText: {
    color: KindlingColors.mutedForeground,
  },
  menuContent: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
  },
  selectedItem: {
    fontWeight: '600',
    color: KindlingColors.green,
  },
  errorText: {
    color: KindlingColors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
});

