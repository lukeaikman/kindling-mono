/**
 * InformationCard Component
 * 
 * A card component for displaying informational content with a title and body.
 * Used in intro screens to present key information to users.
 * 
 * @module components/ui/InformationCard
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * InformationCard props
 */
export interface InformationCardProps {
  /**
   * Card title
   */
  title: string;
  
  /**
   * Card content (can be string or React elements)
   */
  children: React.ReactNode;
  
  /**
   * Additional styles for the container
   */
  style?: object;
}

/**
 * InformationCard component for displaying structured information
 * 
 * @example
 * ```tsx
 * <InformationCard title="Why is this important?">
 *   <Text>Information content here</Text>
 * </InformationCard>
 * ```
 */
export const InformationCard: React.FC<InformationCardProps> = ({
  title,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: KindlingColors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: KindlingColors.navy,
    marginBottom: Spacing.md,
  },
  content: {
    gap: Spacing.sm,
  },
});

