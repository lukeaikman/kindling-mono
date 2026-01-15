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
   * Whether accordion is expanded (controlled mode)
   */
  expanded?: boolean;
  
  /**
   * Expansion change handler (controlled mode)
   */
  onExpandedChange?: (expanded: boolean) => void;
  
  /**
   * Whether accordion is expanded by default (uncontrolled mode)
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
 * Supports both controlled and uncontrolled modes.
 * 
 * @example
 * ```tsx
 * // Uncontrolled mode
 * <Accordion title="Property Details" icon="home" defaultExpanded={false}>
 *   <Text>Property information goes here</Text>
 * </Accordion>
 * 
 * // Controlled mode
 * <Accordion 
 *   title="Property Details" 
 *   icon="home" 
 *   expanded={isExpanded}
 *   onExpandedChange={setIsExpanded}
 * >
 *   <Text>Property information goes here</Text>
 * </Accordion>
 * ```
 */
export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  expanded: controlledExpanded,
  onExpandedChange,
  defaultExpanded = false,
  icon,
}) => {
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handlePress = () => {
    const newExpanded = !isExpanded;
    
    if (isControlled) {
      // Controlled mode - notify parent
      onExpandedChange?.(newExpanded);
    } else {
      // Uncontrolled mode - update internal state
      setInternalExpanded(newExpanded);
    }
  };

  return (
    <List.Accordion
      title={title}
      expanded={isExpanded}
      onPress={handlePress}
      left={icon ? (props) => <List.Icon {...props} icon={icon} /> : undefined}
      titleStyle={styles.title}
      style={[styles.accordion, isExpanded && styles.accordionExpanded]}
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
  accordionExpanded: {
    backgroundColor: `${KindlingColors.cream}66`, // Light cream background when expanded
    borderBottomColor: KindlingColors.navy,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
});

