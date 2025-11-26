/**
 * Input Component
 * 
 * A styled text input component wrapping React Native Paper's TextInput
 * with support for various input types (text, email, phone, number)
 * 
 * @module components/ui/Input
 */

import React from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { StyleSheet, ViewStyle, TextStyle, KeyboardTypeOptions } from 'react-native';
import { KindlingColors } from '../../styles/theme';

/**
 * Input type variants
 */
export type InputType = 'text' | 'email' | 'phone' | 'number' | 'password';

/**
 * Input component props
 */
export interface InputProps {
  /**
   * Input label
   */
  label?: string;
  
  /**
   * Input value
   */
  value: string;
  
  /**
   * Value change handler
   */
  onChangeText: (text: string) => void;
  
  /**
   * Input type (affects keyboard and validation)
   */
  type?: InputType;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether input has error
   */
  error?: boolean;
  
  /**
   * Error message to display
   */
  errorMessage?: string;
  
  /**
   * Whether to show character counter
   */
  maxLength?: number;
  
  /**
   * Whether input is multiline (textarea)
   */
  multiline?: boolean;
  
  /**
   * Number of lines for multiline input
   */
  numberOfLines?: number;
  
  /**
   * Icon to display on the left
   */
  leftIcon?: string;
  
  /**
   * Icon to display on the right
   */
  rightIcon?: string;
  
  /**
   * Whether to show password toggle (for password type)
   */
  secureTextEntry?: boolean;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
  
  /**
   * Additional text style overrides
   */
  textStyle?: TextStyle;
  
  /**
   * Auto-capitalize mode
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  
  /**
   * Auto-correct enabled
   */
  autoCorrect?: boolean;
  
  /**
   * Focus handler
   */
  onFocus?: () => void;
  
  /**
   * Blur handler
   */
  onBlur?: () => void;
  
  /**
   * Keyboard type override
   */
  keyboardType?: KeyboardTypeOptions;
}

/**
 * Get keyboard type based on input type
 */
const getKeyboardType = (type: InputType): KeyboardTypeOptions => {
  switch (type) {
    case 'email':
      return 'email-address';
    case 'phone':
      return 'phone-pad';
    case 'number':
      return 'numeric';
    default:
      return 'default';
  }
};

/**
 * Get auto-capitalize mode based on input type
 */
const getAutoCapitalize = (type: InputType): 'none' | 'sentences' | 'words' | 'characters' => {
  switch (type) {
    case 'email':
      return 'none';
    case 'password':
      return 'none';
    default:
      return 'sentences';
  }
};

/**
 * Input component with Kindling brand styling
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email Address"
 *   value={email}
 *   onChangeText={setEmail}
 *   type="email"
 *   placeholder="Enter your email"
 * />
 * 
 * <Input
 *   label="Phone Number"
 *   value={phone}
 *   onChangeText={setPhone}
 *   type="phone"
 *   leftIcon="phone"
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  type = 'text',
  placeholder,
  disabled = false,
  error = false,
  errorMessage,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  style,
  textStyle,
  autoCapitalize: autoCapitalizeProp,
  autoCorrect = true,
  onFocus,
  onBlur,
  keyboardType: keyboardTypeProp,
}) => {
  const keyboardType = keyboardTypeProp || getKeyboardType(type);
  const autoCapitalize = autoCapitalizeProp || getAutoCapitalize(type);
  
  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry || type === 'password'}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      maxLength={maxLength}
      multiline={multiline}
      numberOfLines={numberOfLines}
      onFocus={onFocus}
      onBlur={onBlur}
      left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} /> : undefined}
      right={rightIcon ? <PaperTextInput.Icon icon={rightIcon} /> : undefined}
      mode="flat"
      underlineColor={KindlingColors.border}
      activeUnderlineColor={KindlingColors.navy}
      textColor={KindlingColors.navy}
      style={[styles.input, style]}
      contentStyle={[styles.inputContent, textStyle]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: KindlingColors.background,
    marginVertical: 8,
  },
  inputContent: {
    fontSize: 16,
  },
});

