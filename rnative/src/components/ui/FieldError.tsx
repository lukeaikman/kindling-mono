/**
 * FieldError — "We'll need this" text shown below a field when it fails validation.
 *
 * Only renders when `visible` is true (i.e. showErrors && fieldErrors[key]).
 *
 * @module components/ui/FieldError
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Typography, Spacing } from '../../styles/constants';

interface FieldErrorProps {
  visible: boolean;
}

/** Muted red border color for invalid fields — use in style overrides */
export const FIELD_ERROR_BORDER_COLOR = `${KindlingColors.destructive}B3`; // ~70% opacity

export function FieldError({ visible }: FieldErrorProps) {
  if (!visible) return null;
  return <Text style={styles.text}>We'll need this</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.destructive}B3`, // ~70% opacity muted red
    marginTop: Spacing.xs / 2,
    marginBottom: Spacing.xs,
  },
});
