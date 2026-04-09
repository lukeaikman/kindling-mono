/**
 * SearchableSelect Component
 * 
 * A dropdown select with search/filter capability
 * Built with React Native primitives for maximum control
 * 
 * @module components/ui/SearchableSelect
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

/**
 * Select option interface
 */
export interface SearchableSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * SearchableSelect component props
 */
export interface SearchableSelectProps {
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
  options: SearchableSelectOption[];
  
  /**
   * Placeholder text when nothing selected
   */
  placeholder?: string;
  
  /**
   * Whether select is disabled
   */
  disabled?: boolean;
  
  /**
   * Error message
   */
  errorMessage?: string;
  
  /**
   * Show selected value as a card below the select (with clear button)
   * When false (default), selected value shows in the select button
   */
  showSelectedCards?: boolean;
}

/**
 * SearchableSelect component
 * 
 * Opens a modal with search input and filterable list
 * 
 * @example
 * ```tsx
 * <SearchableSelect
 *   label="Select Bank"
 *   value={selectedBank}
 *   onChange={setSelectedBank}
 *   options={bankProviders}
 *   placeholder="Search bank or building society..."
 * />
 * ```
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  errorMessage,
  showSelectedCards = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get display label for selected value
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = showSelectedCards 
    ? placeholder 
    : (selectedOption?.label || placeholder);

  // Filter options based on search query
  const filteredOptions = searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !opt.disabled
      )
    : options;

  const handleSelect = (optionValue: string) => {
    const option = options.find(opt => opt.value === optionValue);
    if (option?.disabled) return;
    
    onChange(optionValue);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Select Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          disabled && styles.selectButtonDisabled,
          errorMessage && styles.selectButtonError,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            !value && styles.selectTextPlaceholder,
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        <IconButton
          icon="chevron-down"
          size={20}
          iconColor={KindlingColors.navy}
          style={styles.chevronIcon}
        />
      </TouchableOpacity>

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* Selected Card Display (when showSelectedCards is true) */}
      {showSelectedCards && value && selectedOption && (
        <View style={styles.selectedCardContainer}>
          <View style={styles.selectedCard}>
            <Text style={styles.selectedCardText}>{selectedOption.label}</Text>
            <TouchableOpacity
              onPress={() => onChange('')}
              style={styles.removeButton}
            >
              <IconButton
                icon="close"
                size={18}
                iconColor={KindlingColors.brown}
                style={styles.removeIcon}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => onChange('')}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear Selection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal with Search */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
            <TouchableOpacity onPress={handleClose}>
              <IconButton
                icon="close"
                size={24}
                iconColor={KindlingColors.navy}
              />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <IconButton
              icon="magnify"
              size={20}
              iconColor={KindlingColors.brown}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={`${KindlingColors.brown}80`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconButton
                  icon="close-circle"
                  size={20}
                  iconColor={KindlingColors.brown}
                  style={styles.clearIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Options List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  item.value === value && styles.optionSelected,
                  item.disabled && styles.optionDisabled,
                ]}
                onPress={() => handleSelect(item.value)}
                disabled={item.disabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    item.value === value && styles.optionTextSelected,
                    item.disabled && styles.optionTextDisabled,
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === value && (
                  <IconButton
                    icon="check"
                    size={20}
                    iconColor={KindlingColors.green}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No matches found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KindlingColors.background,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonError: {
    borderColor: KindlingColors.destructive,
  },
  selectText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  selectTextPlaceholder: {
    color: `${KindlingColors.brown}80`,
  },
  chevronIcon: {
    margin: 0,
    padding: 0,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.destructive,
    marginTop: Spacing.xs,
  },
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.inputBackground,
    borderRadius: 8,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  searchIcon: {
    margin: 0,
    padding: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  clearIcon: {
    margin: 0,
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}40`,
  },
  optionSelected: {
    backgroundColor: `${KindlingColors.green}15`,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  optionTextSelected: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  optionTextDisabled: {
    color: KindlingColors.brown,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  emptyState: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
  },
  selectedCardContainer: {
    marginTop: Spacing.sm,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  selectedCardText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  removeButton: {
    marginLeft: Spacing.sm,
  },
  removeIcon: {
    margin: 0,
    padding: 0,
  },
  clearButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
  },
});

