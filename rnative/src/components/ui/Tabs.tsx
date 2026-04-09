/**
 * Tabs Component
 * 
 * A tabbed interface component
 * For React Native, tabs are better handled by React Navigation's Tab Navigator
 * This is a simple alternative for inline tabs within a screen
 * 
 * @module components/ui/Tabs
 */

import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing } from '../../styles/constants';

/**
 * Tab item interface
 */
export interface TabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

/**
 * Tabs component props
 */
export interface TabsProps {
  /**
   * Array of tab items
   */
  tabs: TabItem[];
  
  /**
   * Default selected tab value
   */
  defaultValue?: string;
  
  /**
   * Controlled value
   */
  value?: string;
  
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  
  /**
   * Additional style overrides
   */
  style?: ViewStyle;
}

/**
 * Tabs component for tabbed content
 * 
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { label: 'Overview', value: 'overview', content: <OverviewContent /> },
 *     { label: 'Details', value: 'details', content: <DetailsContent /> },
 *   ]}
 *   defaultValue="overview"
 * />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value: controlledValue,
  onChange,
  style,
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue || tabs[0]?.value || '');
  
  const currentValue = controlledValue !== undefined ? controlledValue : selectedTab;
  
  const handleTabChange = (value: string) => {
    if (controlledValue === undefined) {
      setSelectedTab(value);
    }
    onChange?.(value);
  };
  
  const currentTab = tabs.find(tab => tab.value === currentValue);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabList}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => handleTabChange(tab.value)}
            style={[
              styles.tab,
              currentValue === tab.value && styles.tabActive
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                currentValue === tab.value && styles.tabLabelActive
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.tabContent}>
        {currentTab?.content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabList: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: KindlingColors.green,
  },
  tabLabel: {
    fontSize: 16,
    color: KindlingColors.mutedForeground,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.md,
  },
});

