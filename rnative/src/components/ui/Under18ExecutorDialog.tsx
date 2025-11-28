/**
 * Under-18 Executor Information Dialog
 * 
 * Explains legal requirements for executor age in England and Wales.
 * Adapted from web-prototype/src/components/Under18ExecutorInfoDialog.tsx
 * 
 * @module components/ui/Under18ExecutorDialog
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Dialog } from './Dialog';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

export interface Under18ExecutorDialogProps {
  /**
   * Whether the dialog is visible
   */
  visible: boolean;
  
  /**
   * Handler for closing the dialog
   */
  onDismiss: () => void;
}

/**
 * Under-18 Executor Information Dialog
 * 
 * Provides information about the legal requirements for executors under 18 years old
 * in England and Wales.
 * 
 * @example
 * ```tsx
 * const [showDialog, setShowDialog] = useState(false);
 * 
 * <Under18ExecutorDialog
 *   visible={showDialog}
 *   onDismiss={() => setShowDialog(false)}
 * />
 * ```
 */
export const Under18ExecutorDialog: React.FC<Under18ExecutorDialogProps> = ({
  visible,
  onDismiss,
}) => {
  // Memoize actions to prevent infinite re-renders
  const actions = useMemo(() => [
    {
      label: 'Got it',
      onPress: onDismiss,
      variant: 'primary' as const,
    },
  ], [onDismiss]);
  
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title="Under-18 Executors"
      actions={actions}
    >
      <View style={styles.content}>
        <Text style={styles.paragraph}>
          In England and Wales, an executor must be at least 18 years old to act in this role. 
          If you name someone who is currently under 18, they will be able to serve as an executor 
          once they reach 18 years of age.
        </Text>
        
        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>What happens if all executors are under 18?</Text>
          <Text style={styles.warningText}>
            If all named executors are under 18 when you pass away, the court will appoint a temporary 
            administrator to manage your estate until at least one of your named executors reaches 18. 
            Once they turn 18, they can then assume their role as executor.
          </Text>
        </View>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Best practice:</Text> It's advisable to name at least 
          one executor who is currently over 18 years old to ensure your estate can be managed promptly. 
          You can still include younger people as backup or co-executors.
        </Text>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
  paragraph: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#FEF3C7', // amber-100
    borderWidth: 1,
    borderColor: '#FCD34D', // amber-300
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  warningTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    lineHeight: 22,
  },
  bold: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
});

