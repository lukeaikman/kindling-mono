/**
 * Card Component
 * 
 * A card container component using React Native Paper's Card
 * Used for grouping related content
 * 
 * @module components/ui/Card
 */

import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Shadows } from '../../styles/constants';

/**
 * Card component props
 */
export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Card title
   */
  title?: string;
  
  /**
   * Card subtitle
   */
  subtitle?: string;
  
  /**
   * Whether card is clickable
   */
  onPress?: () => void;
  
  /**
   * Elevation level (0-5)
   */
  elevation?: number;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
}

/**
 * Card container component
 * 
 * @example
 * ```tsx
 * <Card title="Property Details" subtitle="8 Garden Close">
 *   <Text>Content goes here</Text>
 * </Card>
 * 
 * <Card onPress={() => navigate('details')}>
 *   <Text>Clickable card</Text>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  elevation = 1,
  style,
}) => {
  return (
    <PaperCard
      mode="outlined"
      onPress={onPress}
      style={[styles.card, style]}
    >
      {(title || subtitle) && (
        <PaperCard.Title
          title={title}
          subtitle={subtitle}
          titleStyle={styles.title}
          subtitleStyle={styles.subtitle}
        />
      )}
      
      <PaperCard.Content>{children}</PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.sm,
    borderRadius: 12,
    borderColor: KindlingColors.border,
    backgroundColor: KindlingColors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  subtitle: {
    fontSize: 14,
    color: KindlingColors.mutedForeground,
  },
});

