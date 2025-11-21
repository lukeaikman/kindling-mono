/**
 * Button Component
 * 
 * A styled button component wrapping React Native Paper's Button
 * with Kindling brand variants (primary, secondary, destructive)
 * 
 * @module components/ui/Button
 */

import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';
import { KindlingColors } from '../../styles/theme';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline';

/**
 * Button component props
 */
export interface ButtonProps {
  /**
   * Button label text
   */
  children: string;
  
  /**
   * Button click handler
   */
  onPress: () => void;
  
  /**
   * Button variant (default: primary)
   */
  variant?: ButtonVariant;
  
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether button is in loading state
   */
  loading?: boolean;
  
  /**
   * Icon to display (left side)
   */
  icon?: string;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
  
  /**
   * Button mode (contained, outlined, text)
   */
  mode?: 'contained' | 'outlined' | 'text';
}

/**
 * Button component with Kindling brand styling
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onPress={() => console.log('Pressed')}>
 *   Continue
 * </Button>
 * 
 * <Button variant="destructive" onPress={() => deleteItem()}>
 *   Delete
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  mode: modeProp,
}) => {
  // Determine mode based on variant if not explicitly provided
  const mode = modeProp || (variant === 'outline' ? 'outlined' : 'contained');
  
  // Determine button color based on variant
  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return KindlingColors.navy;
      case 'secondary':
        return KindlingColors.green;
      case 'destructive':
        return KindlingColors.destructive;
      case 'outline':
        return KindlingColors.navy;
      default:
        return KindlingColors.navy;
    }
  };

  const buttonColor = getButtonColor();
  
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={mode === 'contained' ? buttonColor : undefined}
      textColor={mode === 'outlined' ? buttonColor : KindlingColors.cream}
      style={[styles.button, style]}
      contentStyle={styles.buttonContent}
      labelStyle={styles.buttonLabel}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

