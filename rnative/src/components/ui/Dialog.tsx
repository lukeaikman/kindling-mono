/**
 * Dialog Component
 * 
 * A modal dialog component using React Native Paper's Dialog
 * Used for confirmations, forms, and important messages
 * 
 * @module components/ui/Dialog
 */

import React from 'react';
import { Dialog as PaperDialog, Portal, Text } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button } from './Button';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Dialog action interface
 */
export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

/**
 * Dialog component props
 */
export interface DialogProps {
  /**
   * Whether dialog is visible
   */
  visible: boolean;
  
  /**
   * Handler for dismissing dialog
   */
  onDismiss: () => void;
  
  /**
   * Dialog title
   */
  title?: string;
  
  /**
   * Dialog content (can be string or React node)
   */
  children: React.ReactNode;
  
  /**
   * Action buttons
   */
  actions?: DialogAction[];
  
  /**
   * Whether dialog can be dismissed by tapping backdrop
   */
  dismissable?: boolean;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
}

/**
 * Dialog modal component
 * 
 * @example
 * ```tsx
 * <Dialog
 *   visible={showDialog}
 *   onDismiss={() => setShowDialog(false)}
 *   title="Confirm Delete"
 *   actions={[
 *     { label: 'Cancel', onPress: () => setShowDialog(false) },
 *     { label: 'Delete', onPress: handleDelete, variant: 'destructive' },
 *   ]}
 * >
 *   Are you sure you want to delete this property?
 * </Dialog>
 * ```
 */
export const Dialog: React.FC<DialogProps> = ({
  visible,
  onDismiss,
  title,
  children,
  actions = [],
  dismissable = true,
  style,
}) => {
  return (
    <Portal>
      <PaperDialog
        visible={visible}
        onDismiss={onDismiss}
        dismissable={dismissable}
        style={[styles.dialog, style]}
      >
        {title && (
          <PaperDialog.Title style={styles.title}>{title}</PaperDialog.Title>
        )}
        
        <PaperDialog.Content>
          {typeof children === 'string' ? (
            <Text style={styles.content}>{children}</Text>
          ) : (
            children
          )}
        </PaperDialog.Content>
        
        {actions.length > 0 && (
          <PaperDialog.Actions style={styles.actions}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                onPress={action.onPress}
                mode={action.variant === 'primary' ? 'contained' : 'outlined'}
                style={styles.actionButton}
              >
                {action.label}
              </Button>
            ))}
          </PaperDialog.Actions>
        )}
      </PaperDialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  content: {
    fontSize: 16,
    color: KindlingColors.navy,
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  actionButton: {
    marginLeft: Spacing.sm,
  },
});

