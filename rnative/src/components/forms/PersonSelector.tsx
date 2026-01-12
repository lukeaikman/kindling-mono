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
import { Button } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../utils/helpers';
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
  onAddNewPerson,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [tempSelection, setTempSelection] = useState<string>('');

  // Get available people
  const allPeople = personActions.getPeople();
  const availablePeople = allPeople.filter(person => !excludePersonIds.includes(person.id));

  // Get display name for selected person
  const getDisplayName = () => {
    if (!value) return placeholder;
    
    if (value === 'unknown') {
      return '🔍 Unknown Person';
    }
    
    const person = personActions.getPersonById(value);
    if (!person) return 'Unknown';
    
    const fullName = getPersonFullName(person);
    const relationship = getPersonRelationshipDisplay(person);
    return relationship ? `${fullName} (${relationship})` : fullName;
  };

  const handleOpenDrawer = () => {
    setTempSelection(value);
    setShowDrawer(true);
  };

  const handleConfirm = () => {
    onChange(tempSelection);
    setShowDrawer(false);
  };

  const handleSelect = (personId: string) => {
    setTempSelection(personId);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Selection Button */}
      <TouchableOpacity
        style={styles.selectionButton}
        onPress={handleOpenDrawer}
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
              ...(allowUnknown ? [{ id: 'unknown', label: '🔍 Unknown Person', isSpecial: true }] : []),
              ...availablePeople.map(p => ({ 
                id: p.id, 
                label: `${getPersonFullName(p)} (${getPersonRelationshipDisplay(p)})`,
                isSpecial: false
              })),
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const selected = tempSelection === item.id;
              
              return (
                <TouchableOpacity
                  style={styles.drawerOption}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.drawerOptionText}>{item.label}</Text>
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

          {/* Confirm Button */}
          <View style={styles.drawerFooter}>
            <Button
              onPress={handleConfirm}
              variant="primary"
              disabled={!tempSelection}
            >
              Select
            </Button>
          </View>
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
  drawerFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
  },
});




