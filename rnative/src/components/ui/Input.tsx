/**
 * Input Component
 * 
 * A styled text input component wrapping React Native Paper's TextInput
 * with support for various input types (text, email, phone, number)
 * 
 * Supports auto-focus chaining for smooth form navigation.
 * 
 * @module components/ui/Input
 */

import React, { forwardRef, RefObject, useEffect, useRef } from 'react';
import { TextInput as PaperTextInput, TextInput } from 'react-native-paper';
import { StyleSheet, ViewStyle, TextStyle, KeyboardTypeOptions, TextInput as RNTextInput, Platform } from 'react-native';
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
  
  /**
   * Enable auto-focus to next field when "next" is pressed on keyboard
   * @default false
   */
  autoFocusNext?: boolean;
  
  /**
   * Ref to the next input field to focus
   * Required when autoFocusNext is true
   */
  nextFieldRef?: RefObject<RNTextInput>;
  
  /**
   * Return key type override
   * Auto-set based on autoFocusNext if not provided
   */
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  
  /**
   * Callback before auto-focusing next field
   * Useful for validation or side effects
   */
  onBeforeAutoFocus?: () => void;
  
  /**
   * iOS clear button mode
   * Controls when the clear button (X) appears in the text input
   * @default 'while-editing' (shows while editing, hides when not focused)
   */
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
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
 * // Basic input
 * <Input
 *   label="Email Address"
 *   value={email}
 *   onChangeText={setEmail}
 *   type="email"
 *   placeholder="Enter your email"
 * />
 * 
 * // Auto-focus chain
 * const lastNameRef = useRef<TextInput>(null);
 * const dobRef = useRef<TextInput>(null);
 * 
 * <Input
 *   label="First name"
 *   value={firstName}
 *   onChangeText={setFirstName}
 *   autoFocusNext={true}
 *   nextFieldRef={lastNameRef}
 * />
 * 
 * <Input
 *   ref={lastNameRef}
 *   label="Last name"
 *   value={lastName}
 *   onChangeText={setLastName}
 *   autoFocusNext={true}
 *   nextFieldRef={dobRef}
 * />
 * 
 * <Input
 *   ref={dobRef}
 *   label="Date of Birth"
 *   value={dob}
 *   onChangeText={setDob}
 * />
 * ```
 */
export const Input = forwardRef<RNTextInput, InputProps>(({
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
  autoFocusNext = false,
  nextFieldRef,
  returnKeyType: returnKeyTypeProp,
  onBeforeAutoFocus,
  clearButtonMode = 'while-editing',
}, ref) => {
  const keyboardType = keyboardTypeProp || getKeyboardType(type);
  const autoCapitalize = autoCapitalizeProp || getAutoCapitalize(type);
  
  // Auto-determine return key type if not provided
  const returnKeyType = returnKeyTypeProp || (autoFocusNext ? 'next' : 'done');

  const isPasswordField = type === 'password';
  const devAutofillDisabled = __DEV__ && isPasswordField;
  
  // Handle submit editing (when user presses keyboard return key)
  const handleSubmitEditing = () => {
    if (autoFocusNext && nextFieldRef?.current) {
      onBeforeAutoFocus?.();
      // Small delay ensures smooth transition
      setTimeout(() => nextFieldRef.current?.focus(), 50);
    }
  };
  
  // Internal ref to access underlying native TextInput for clearButtonMode
  const internalRef = useRef<RNTextInput>(null);
  
  // Merge forwarded ref with internal ref
  const setRefs = (node: RNTextInput | null) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };
  
  // Set clearButtonMode on underlying native TextInput (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios' && internalRef.current && clearButtonMode) {
      // Use setNativeProps to set clearButtonMode on the native component
      internalRef.current.setNativeProps({ clearButtonMode });
    }
  }, [clearButtonMode]);
  
  return (
    <PaperTextInput
      ref={setRefs}
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry || isPasswordField}
      // TODO: Re-enable password AutoFill before launch by removing the dev-only override below.
      // iOS often ignores "none" for password fields; "oneTimeCode" reliably disables the strong-password overlay.
      textContentType={
        isPasswordField ? (devAutofillDisabled ? 'oneTimeCode' : 'password') : undefined
      }
      autoComplete={isPasswordField ? (devAutofillDisabled ? 'off' : 'password') : undefined}
      importantForAutofill={devAutofillDisabled ? 'no' : 'auto'}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      maxLength={maxLength}
      multiline={multiline}
      numberOfLines={numberOfLines}
      onFocus={onFocus}
      onBlur={onBlur}
      returnKeyType={returnKeyType}
      onSubmitEditing={handleSubmitEditing}
      blurOnSubmit={!autoFocusNext}
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
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: KindlingColors.background,
    marginVertical: 8,
  },
  inputContent: {
    fontSize: 16,
  },
});

