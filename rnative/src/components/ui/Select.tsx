/**
 * Select Component
 * 
 * A dropdown select component with hybrid rendering:
 * - Short lists (≤8 items): Menu dropdown anchored to button
 * - Long lists (>8 items): Full-screen modal with scrollable list
 * 
 * @module components/ui/Select
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Modal, FlatList, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Button, Text, IconButton } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

const MODAL_THRESHOLD = 8; // Switch to modal when more than 8 options
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  
  /**
   * Optional ref to parent ScrollView for auto-scrolling (Menu mode only)
   */
  scrollViewRef?: React.RefObject<ScrollView | null>;

  testID?: string;
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
  scrollViewRef,
  testID,
}) => {
  const [visible, setVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const buttonRef = useRef<View>(null);

  const useModal = options.length > MODAL_THRESHOLD;

  const openMenu = () => {
    if (disabled) return;
    
    // Auto-scroll for Menu mode (not modal)
    if (!useModal && scrollViewRef?.current && buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        const targetY = SCREEN_HEIGHT * 0.15; // 15% down from top
        if (y > targetY) {
          const scrollOffset = y - targetY;
          scrollViewRef.current?.scrollTo({ y: scrollOffset, animated: true });
        }
      });
      // Small delay to let scroll happen before opening menu
      setTimeout(() => setVisible(true), 100);
    } else {
      setVisible(true);
    }
  };

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

  // Render select button (same for both modes)
  const selectButton = (
    <View ref={buttonRef} collapsable={false} testID={testID}>
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
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Short list: Use Menu (≤8 items) */}
      {!useModal ? (
        <>
          <Menu
            key={menuKey}
            visible={visible}
            onDismiss={closeMenu}
            anchor={selectButton}
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
        </>
      ) : (
        /* Long list: Use Modal (>8 items) */
        <>
          {selectButton}
          
          <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={closeMenu}
          >
            <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
                <TouchableOpacity onPress={closeMenu}>
                  <IconButton icon="close" size={24} iconColor={KindlingColors.navy} />
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <FlatList
                data={options}
                keyExtractor={(item) => item.value || item.label}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      item.value === value && styles.modalOptionSelected,
                      item.disabled && styles.modalOptionDisabled,
                    ]}
                    onPress={() => !item.disabled && handleSelect(item.value)}
                    disabled={item.disabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        item.value === value && styles.modalOptionTextSelected,
                        item.disabled && styles.modalOptionTextDisabled,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <IconButton
                        icon="check"
                        size={20}
                        iconColor={KindlingColors.green}
                        style={styles.modalCheckIcon}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </Modal>
        </>
      )}
      
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
    backgroundColor: KindlingColors.background,
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
  // Modal styles (for long lists)
  modalContainer: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}40`,
  },
  modalOptionSelected: {
    backgroundColor: `${KindlingColors.green}15`,
  },
  modalOptionDisabled: {
    opacity: 0.4,
  },
  modalOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  modalOptionTextSelected: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  modalOptionTextDisabled: {
    color: KindlingColors.brown,
  },
  modalCheckIcon: {
    margin: 0,
    padding: 0,
  },
});

