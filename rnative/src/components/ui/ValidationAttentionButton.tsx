/**
 * ValidationAttentionButton — "X little things left" button below Save.
 *
 * Ghost-style button in muted red. Disappears when all required fields
 * are satisfied. Tapping triggers validation highlighting.
 *
 * @module components/ui/ValidationAttentionButton
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

interface ValidationAttentionButtonProps {
  /** Copy to display, e.g. "3 little things left" or null to hide */
  label: string | null;
  /** Called when the user taps the button */
  onPress: () => void;
}

export function ValidationAttentionButton({ label, onPress }: ValidationAttentionButtonProps) {
  if (!label) return null;

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${KindlingColors.destructive}40`,
    backgroundColor: `${KindlingColors.destructive}08`,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.destructive}CC`, // ~80% opacity muted red
    textAlign: 'center',
  },
});
