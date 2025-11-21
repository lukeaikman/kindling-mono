/**
 * Accordion Component
 * 
 * An expandable/collapsible section using React Native Paper's List.Accordion
 * 
 * @module components/ui/Accordion
 */

import React from 'react';
import { List } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Accordion component props
 */
export interface AccordionProps {
  /**
   * Accordion title
   */
  title: string;
  
  /**
   * Accordion content
   */
  children: React.ReactNode;
  
  /**
   * Whether accordion is expanded by default
   */
  defaultExpanded?: boolean;
  
  /**
   * Left icon
   */
  icon?: string;
}

/**
 * Accordion expandable section component
 * 
 * @example
 * ```tsx
 * <Accordion title="Property Details" icon="home">
 *   <Text>Property information goes here</Text>
 * </Accordion>
 * ```
 */
export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  icon,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <List.Accordion
      title={title}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      left={icon ? (props) => <List.Icon {...props} icon={icon} /> : undefined}
      titleStyle={styles.title}
      style={styles.accordion}
    >
      {children}
    </List.Accordion>
  );
};

const styles = StyleSheet.create({
  accordion: {
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
});

