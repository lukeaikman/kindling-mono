/**
 * RadioGroup Component
 * 
 * A radio button group component built manually with React Native primitives
 * and Paper's RadioButton for the circle visual.
 * 
 * Supports a "collapse on select" variant (default) where only the selected option
 * is shown after selection, with a refresh button to change the choice.
 * 
 * We build this manually instead of using RadioButton.Item because:
 * - RadioButton.Item wasn't rendering the radio circle properly
 * - Manual build gives full control over styling
 * - Designer can customize every aspect later
 * - Consistent pattern with our Checkbox component
 * 
 * @module components/ui/RadioGroup
 */

import React, { useState, useEffect, RefObject } from 'react';
import { View, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, ScrollView } from 'react-native';
import { RadioButton, Text, IconButton } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Radio option interface
 */
export interface RadioOption {
  label: string;
  value: string;
  /**
   * Optional helper text displayed below the label
   * Provides additional context or explanation for the option
   */
  helperText?: string;
}

/**
 * RadioGroup component props
 */
export interface RadioGroupProps {
  /**
   * Group label
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
   * Array of radio options
   */
  options: RadioOption[];
  
  /**
   * Whether group is disabled
   */
  disabled?: boolean;
  
  /**
   * When true, only the selected option is shown after selection.
   * A refresh icon appears to allow changing the selection.
   * @default true
   */
  collapseOnSelect?: boolean;
  
  /**
   * Enable auto-scroll to next section after selection
   * @default false
   */
  autoScrollOnSelect?: boolean;
  
  /**
   * Ref to the parent ScrollView
   * Required when autoScrollOnSelect is true
   */
  scrollViewRef?: RefObject<ScrollView>;
  
  /**
   * Y-offset to scroll to (in pixels)
   * Required when autoScrollOnSelect is true
   */
  scrollOffset?: number;
  
  /**
   * Delay (ms) before auto-scrolling
   * Allows user to see their selection before scrolling
   * @default 400
   */
  scrollDelay?: number;
  
  /**
   * Callback after selection is made
   * Useful for custom logic after selection
   */
  onAfterSelect?: (value: string) => void;
}

/**
 * RadioGroup component with manual layout for full control
 * 
 * Each option is a clickable row with:
 * - Radio circle (left) - uses Paper's RadioButton for the circle visual
 * - Label text (right) - fully customizable typography
 * - Subtle background highlight when selected
 * - Active opacity for press feedback
 * 
 * By default, the group collapses to show only the selected option after selection.
 * A refresh icon allows the user to expand and change their selection.
 * 
 * @example
 * ```tsx
 * // Default behavior - collapses after selection
 * <RadioGroup
 *   label="Will Type"
 *   value={willType}
 *   onChange={setWillType}
 *   options={[
 *     { label: 'Simple Will', value: 'simple' },
 *     { label: 'Complex Will', value: 'complex' },
 *   ]}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Always show all options (no collapse)
 * <RadioGroup
 *   label="Locked Options"
 *   value={selected}
 *   onChange={setSelected}
 *   options={options}
 *   collapseOnSelect={false}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Auto-scroll to next section after selection
 * const scrollViewRef = useRef<ScrollView>(null);
 * 
 * <RadioGroup
 *   label="Relationship status"
 *   value={status}
 *   onChange={setStatus}
 *   options={options}
 *   autoScrollOnSelect={true}
 *   scrollViewRef={scrollViewRef}
 *   scrollOffset={400}
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  collapseOnSelect = true,
  autoScrollOnSelect = false,
  scrollViewRef,
  scrollOffset = 0,
  scrollDelay = 400,
  onAfterSelect,
}) => {
  // Track whether the group is expanded (showing all options)
  // Start expanded if no value is selected, or if collapseOnSelect is false
  const [isExpanded, setIsExpanded] = useState(!value || !collapseOnSelect);
  
  // When a selection is made and collapseOnSelect is true, collapse the group
  useEffect(() => {
    if (collapseOnSelect && value) {
      // Small delay to let the selection visual show before collapsing
      const timer = setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, collapseOnSelect]);
  
  // When collapseOnSelect changes to false, expand
  useEffect(() => {
    if (!collapseOnSelect) {
      setIsExpanded(true);
    }
  }, [collapseOnSelect]);
  
  // Handle option selection
  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    
    // Call after-select callback
    onAfterSelect?.(optionValue);
    
    // Auto-scroll if enabled
    if (autoScrollOnSelect && scrollViewRef?.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollOffset,
          animated: true,
        });
      }, scrollDelay);
    }
  };
  
  // Handle refresh/reset button press - expand to show all options
  const handleRefresh = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(true);
    onChange(''); // Clear the selection
  };
  
  // Determine which options to show
  const visibleOptions = collapseOnSelect && !isExpanded && value
    ? options.filter(opt => opt.value === value)
    : options;
  
  // Check if we're in collapsed state (showing refresh icon)
  const isCollapsed = collapseOnSelect && !isExpanded && value;
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <RadioButton.Group onValueChange={handleSelect} value={value}>
        {visibleOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => !isCollapsed && handleSelect(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.optionContainer,
              value === option.value && styles.optionContainerSelected,
              disabled && styles.optionContainerDisabled
            ]}
          >
            {/* Always use Android-style radio for visible circles on all platforms */}
            <RadioButton.Android
              value={option.value}
              disabled={disabled}
              color={KindlingColors.green}
              uncheckedColor={KindlingColors.border}
            />
            <View style={styles.optionTextContainer}>
              <Text style={[
                styles.optionLabel,
                value === option.value && styles.optionLabelSelected,
                disabled && styles.optionLabelDisabled
              ]}>
                {option.label}
              </Text>
              {option.helperText && (
                <Text style={[
                  styles.optionHelperText,
                  value === option.value && styles.optionHelperTextSelected,
                  disabled && styles.optionHelperTextDisabled
                ]}>
                  {option.helperText}
                </Text>
              )}
            </View>
            
            {/* Right side icon: refresh for collapsed selected */}
            {value === option.value && isCollapsed && (
              <TouchableOpacity 
                onPress={handleRefresh}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.refreshButton}
              >
                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor={KindlingColors.green}
                  style={styles.refreshIcon}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </RadioButton.Group>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
    marginBottom: Spacing.sm,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    backgroundColor: KindlingColors.background,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: KindlingColors.border,
  },
  optionContainerSelected: {
    backgroundColor: `${KindlingColors.green}10`, // 10% opacity green background
    borderStyle: 'solid', // Solid border when selected
    borderColor: KindlingColors.green,
  },
  optionContainerDisabled: {
    opacity: 0.5,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  optionLabel: {
    fontSize: 16,
    color: KindlingColors.navy,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: KindlingColors.green,
  },
  optionLabelDisabled: {
    opacity: 0.5,
  },
  optionHelperText: {
    fontSize: 13,
    color: KindlingColors.brown,
    marginTop: Spacing.xs / 2,
    lineHeight: 18,
  },
  optionHelperTextSelected: {
    color: KindlingColors.brown,
  },
  optionHelperTextDisabled: {
    opacity: 0.5,
  },
  refreshButton: {
    marginRight: -8,
  },
  refreshIcon: {
    margin: 0,
  },
});
