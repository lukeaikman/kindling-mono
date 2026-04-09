/**
 * Accordion Component
 * 
 * An expandable/collapsible section using React Native Paper's List.Accordion
 * 
 * @module components/ui/Accordion
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, List, Text } from 'react-native-paper';
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
    <View style={[styles.accordion, isExpanded && styles.accordionExpanded]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <List.Icon icon={icon} color={KindlingColors.navy} style={styles.headerIcon} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <IconButton
          icon={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          iconColor={KindlingColors.navy}
          style={styles.chevronIcon}
        />
      </TouchableOpacity>
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    margin: 0,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  chevronIcon: {
    margin: 0,
  },
  content: {
    padding: 0,
  },
});

