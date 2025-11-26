/**
 * Tooltip Component
 * 
 * A simple tooltip component for displaying help text
 * Uses a basic implementation for React Native (no hover, tap to show)
 * 
 * @module components/ui/Tooltip
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

/**
 * Tooltip component props
 */
export interface TooltipProps {
  /**
   * Tooltip content text
   */
  content: string;
  
  /**
   * Child component to wrap (typically an IconButton)
   */
  children: React.ReactNode;
}

/**
 * Tooltip component
 * 
 * Simple tap-to-show tooltip for mobile
 * 
 * @example
 * ```tsx
 * <Tooltip content="This is helpful information">
 *   <IconButton icon="help-circle" />
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        {children}
      </TouchableOpacity>
      
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{content}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  tooltip: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
});

