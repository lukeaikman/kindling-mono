/**
 * Executor Confirmation Dialog
 * 
 * Prompts user to add a third executor when they have only two.
 * Adapted from web-prototype/src/components/ConfirmationDialog.tsx
 * 
 * @module components/ui/ExecutorConfirmationDialog
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Dialog } from './Dialog';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

export interface ExecutorConfirmationDialogProps {
  /**
   * Whether the dialog is visible
   */
  visible: boolean;
  
  /**
   * Handler for closing the dialog
   */
  onDismiss: () => void;
  
  /**
   * Handler for adding another executor
   */
  onAddMore: () => void;
  
  /**
   * Handler for proceeding with current executors
   */
  onProceed: () => void;
}

/**
 * Executor Confirmation Dialog
 * 
 * Shown when user has 2 executors and attempts to continue.
 * Recommends adding a 3rd executor for better security and redundancy.
 * 
 * @example
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 * 
 * <ExecutorConfirmationDialog
 *   visible={showConfirm}
 *   onDismiss={() => setShowConfirm(false)}
 *   onAddMore={() => {
 *     setShowConfirm(false);
 *     // User stays on screen to add more
 *   }}
 *   onProceed={() => {
 *     setShowConfirm(false);
 *     navigateToNextScreen();
 *   }}
 * />
 * ```
 */
export const ExecutorConfirmationDialog: React.FC<ExecutorConfirmationDialogProps> = ({
  visible,
  onDismiss,
  onAddMore,
  onProceed,
}) => {
  // Memoize actions to prevent infinite re-renders
  const actions = useMemo(() => [
    {
      label: 'Continue with 2 Executors',
      onPress: onProceed,
      variant: 'secondary' as const,
    },
    {
      label: 'Add Another Executor',
      onPress: onAddMore,
      variant: 'primary' as const,
    },
  ], [onProceed, onAddMore]);
  
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="Add Another Executor?"
      actions={actions}
    >
      <View style={styles.content}>
        <Text style={styles.message}>
          While not a requirement, we would recommend 3 executors. 
          This provides better security and reduces the risk if one executor 
          is unable to fulfill their duties.
        </Text>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xs,
  },
  message: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    lineHeight: 22,
  },
});

