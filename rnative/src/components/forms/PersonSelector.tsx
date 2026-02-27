/**
 * PersonSelector Component
 * 
 * Single-person selector with drawer interface.
 * Used for selecting one person from family members.
 * 
 * Features:
 * - Drawer-based selection (like BeneficiaryWithPercentages)
 * - Custom checkbox circles (radio behavior - single select)
 * - Optional "Unknown Person" support
 * - Person exclusion support
 * 
 * @module components/forms/PersonSelector
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import { getPersonFullName } from '../../utils/helpers';
import { useAppState } from '../../hooks/useAppState';
import type { PersonActions } from '../../types';

export interface PersonSelectorProps {
  /**
   * Selected person ID
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (personId: string) => void;
  
  /**
   * Person actions for lookups
   */
  personActions: PersonActions;
  
  /**
   * Label for the field
   */
  label?: string;
  
  /**
   * Placeholder text when no selection
   */
  placeholder?: string;
  
  /**
   * Show "Unknown Person" option
   */
  allowUnknown?: boolean;
  
  /**
   * Person IDs to exclude from selection
   */
  excludePersonIds?: string[];
  
  /**
   * Person IDs to show first in the list
   */
  prioritizePersonIds?: string[];
  
  /**
   * Callback for adding new person
   */
  onAddNewPerson?: () => void;
}

/**
 * PersonSelector Component
 * 
 * @example
 * ```tsx
 * <PersonSelector
 *   value={lifeAssuredId}
 *   onChange={setLifeAssuredId}
 *   personActions={personActions}
 *   label="Life Assured"
 *   allowUnknown={true}
 * />
 * ```
 */
export const PersonSelector: React.FC<PersonSelectorProps> = ({
  value,
  onChange,
  personActions,
  label = 'Select Person',
  placeholder = 'Tap to select',
  allowUnknown = false,
  excludePersonIds = [],
  prioritizePersonIds = [],
  onAddNewPerson,
}) => {
  const { relationshipActions } = useAppState();
  const [showDrawer, setShowDrawer] = useState(false);

  const allPeople = personActions.getPeople();
  const filtered = allPeople.filter(person => !excludePersonIds.includes(person.id));
  const availablePeople = prioritizePersonIds.length > 0
    ? [
        ...filtered.filter(p => prioritizePersonIds.includes(p.id)),
        ...filtered.filter(p => !prioritizePersonIds.includes(p.id)),
      ]
    : filtered;

  const getDisplayName = () => {
    if (!value) return placeholder;
    
    if (value === 'unknown') {
      return '🔍 Unknown Person';
    }
    
    const person = personActions.getPersonById(value);
    if (!person) return 'Unknown';
    
    const fullName = getPersonFullName(person);
    if (prioritizePersonIds.includes(value)) return fullName;
    const relationship = relationshipActions.getDisplayLabel(person.id);
    return relationship ? `${fullName} (${relationship})` : fullName;
  };

  const handleSelect = (personId: string) => {
    onChange(personId);
    setShowDrawer(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Selection Button */}
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => setShowDrawer(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectionText, !value && styles.placeholderText]}>
          {getDisplayName()}
        </Text>
        <IconButton icon="chevron-down" size={20} iconColor={KindlingColors.navy} style={styles.chevronIcon} />
      </TouchableOpacity>

      {/* Selection Drawer */}
      <Modal
        visible={showDrawer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDrawer(false)}
      >
        <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setShowDrawer(false)}>
              <IconButton icon="close" size={24} iconColor={KindlingColors.navy} />
            </TouchableOpacity>
          </View>

          {/* Person List */}
          <FlatList
            data={[
              ...(allowUnknown ? [{ id: 'unknown', label: '🔍 Unknown Person', isSpecial: true, isPrioritized: false }] : []),
              ...availablePeople.map(p => {
                const isPrioritized = prioritizePersonIds.includes(p.id);
                const fullName = getPersonFullName(p);
                const relationship = relationshipActions.getDisplayLabel(p.id);
                const label = isPrioritized ? fullName : (relationship ? `${fullName} (${relationship})` : fullName);
                return { id: p.id, label, isSpecial: false, isPrioritized };
              }),
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const selected = value === item.id;
              
              return (
                <TouchableOpacity
                  style={styles.drawerOption}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.drawerOptionText, item.isPrioritized && styles.drawerOptionTextBold]}>{item.label}</Text>
                  <View style={[styles.checkboxCircle, selected && styles.checkboxCircleSelected]}>
                    {selected && (
                      <IconButton
                        icon="check"
                        size={16}
                        iconColor={KindlingColors.background}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              onAddNewPerson ? (
                <TouchableOpacity
                  style={styles.drawerOptionSpecial}
                  onPress={() => {
                    setShowDrawer(false);
                    onAddNewPerson();
                  }}
                >
                  <Text style={styles.drawerOptionSpecialText}>+ Add New Person</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KindlingColors.background,
    borderWidth: 2,
    borderColor: KindlingColors.beige,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  selectionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  placeholderText: {
    color: `${KindlingColors.brown}80`,
  },
  chevronIcon: {
    margin: 0,
    padding: 0,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  drawerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  drawerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}40`,
  },
  drawerOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  drawerOptionTextBold: {
    fontWeight: Typography.fontWeight.semibold,
  },
  drawerOptionSpecial: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}40`,
  },
  drawerOptionSpecialText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
    fontWeight: Typography.fontWeight.medium,
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}4D`,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
});




