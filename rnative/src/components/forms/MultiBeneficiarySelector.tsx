/**
 * MultiBeneficiarySelector Component
 * 
 * Reusable component for selecting people, groups, or estate as beneficiaries.
 * Supports both single and multi-select modes.
 * 
 * Simplified version without percentage/trust metadata (for Phases 6-11).
 * For trust configurations requiring percentages, use BeneficiaryWithPercentages (Phase 14).
 * 
 * @module components/forms/MultiBeneficiarySelector
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../utils/helpers';
import type { Person, PersonActions, BeneficiaryGroupActions, BeneficiaryGroup } from '../../types';

/**
 * Beneficiary selection object
 */
export interface BeneficiarySelection {
  id: string;
  type: 'person' | 'group' | 'estate';
  name: string;
  relationship?: string;
}

/**
 * MultiBeneficiarySelector Props
 */
export interface MultiBeneficiarySelectorProps {
  /**
   * Selection mode: single person or multiple
   */
  mode: 'single' | 'multi';
  
  /**
   * Current selected value(s)
   */
  value: BeneficiarySelection | BeneficiarySelection[];
  
  /**
   * Change handler
   */
  onChange: (value: BeneficiarySelection | BeneficiarySelection[]) => void;
  
  /**
   * Allow selecting "The Estate" option
   */
  allowEstate?: boolean;
  
  /**
   * Allow selecting beneficiary groups
   */
  allowGroups?: boolean;
  
  /**
   * Person IDs to exclude from selection
   */
  excludePersonIds?: string[];
  
  /**
   * Label for the field
   */
  label?: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Callback when user wants to add new person
   */
  onAddNewPerson?: () => void;
  
  /**
   * Callback when user wants to create new group
   */
  onAddNewGroup?: () => void;
  
  /**
   * Person actions for accessing people data
   */
  personActions: PersonActions;
  
  /**
   * Beneficiary group actions for accessing groups
   */
  beneficiaryGroupActions: BeneficiaryGroupActions;
}

/**
 * MultiBeneficiarySelector Component
 * 
 * @example Single Mode
 * ```tsx
 * <MultiBeneficiarySelector
 *   mode="single"
 *   value={selectedBeneficiary}
 *   onChange={setSelectedBeneficiary}
 *   personActions={personActions}
 *   beneficiaryGroupActions={beneficiaryGroupActions}
 *   onAddNewPerson={() => setShowAddPersonDialog(true)}
 * />
 * ```
 * 
 * @example Multi Mode with Groups and Estate
 * ```tsx
 * <MultiBeneficiarySelector
 *   mode="multi"
 *   value={beneficiaries}
 *   onChange={setBeneficiaries}
 *   allowEstate={true}
 *   allowGroups={true}
 *   label="Who will receive this?"
 *   personActions={personActions}
 *   beneficiaryGroupActions={beneficiaryGroupActions}
 *   onAddNewPerson={() => setShowAddPersonDialog(true)}
 *   onAddNewGroup={() => setShowAddGroupDialog(true)}
 * />
 * ```
 */
export const MultiBeneficiarySelector: React.FC<MultiBeneficiarySelectorProps> = ({
  mode,
  value,
  onChange,
  allowEstate = false,
  allowGroups = false,
  excludePersonIds = [],
  label = 'Select recipient',
  placeholder = 'Select a person...',
  onAddNewPerson,
  onAddNewGroup,
  personActions,
  beneficiaryGroupActions,
}) => {
  const selections = Array.isArray(value) ? value : (value ? [value] : []);
  const [dropdownValue, setDropdownValue] = React.useState('');

  // Get available people (excluding already selected and excluded IDs)
  const allPeople = personActions.getPeople();
  const selectedPersonIds = selections.filter(s => s.type === 'person').map(s => s.id);
  const availablePeople = allPeople.filter(person => 
    !excludePersonIds.includes(person.id) && 
    !selectedPersonIds.includes(person.id)
  );

  // Get available groups (excluding already selected)
  const allGroups = allowGroups ? beneficiaryGroupActions.getActiveGroups() : [];
  const selectedGroupIds = selections.filter(s => s.type === 'group').map(s => s.id);
  const availableGroups = allGroups.filter(group => !selectedGroupIds.includes(group.id));

  // Check if estate is already selected
  const estateSelected = selections.some(s => s.type === 'estate');

  // Build dropdown options
  const options = [];
  
  // People options
  availablePeople.forEach(person => {
    options.push({
      label: `${getPersonFullName(person)} (${getPersonRelationshipDisplay(person)})`,
      value: `person:${person.id}`,
    });
  });

  // Group options
  if (allowGroups) {
    availableGroups.forEach(group => {
      options.push({
        label: `👥 ${group.name}`,
        value: `group:${group.id}`,
      });
    });
  }

  // Estate option
  if (allowEstate && !estateSelected) {
    options.push({
      label: 'The Estate',
      value: 'estate:estate',
    });
  }

  // Add new options
  if (onAddNewPerson) {
    options.push({
      label: '+ Add New Person',
      value: '__add_person__',
    });
  }

  if (allowGroups && onAddNewGroup) {
    options.push({
      label: '+ Create New Group',
      value: '__add_group__',
    });
  }

  // Convert person to BeneficiarySelection
  const getBeneficiaryFromPerson = (personId: string): BeneficiarySelection | null => {
    const person = personActions.getPersonById(personId);
    if (!person) return null;
    
    return {
      id: person.id,
      type: 'person',
      name: getPersonFullName(person),
      relationship: getPersonRelationshipDisplay(person),
    };
  };

  // Convert group to BeneficiarySelection
  const getBeneficiaryFromGroup = (groupId: string): BeneficiarySelection | null => {
    const group = beneficiaryGroupActions.getGroupById(groupId);
    if (!group) return null;
    
    return {
      id: group.id,
      type: 'group',
      name: group.name,
    };
  };

  // Handle selection from dropdown
  const handleSelect = (selectedValue: string) => {
    if (!selectedValue) return;

    // Handle special actions
    if (selectedValue === '__add_person__') {
      onAddNewPerson?.();
      setDropdownValue('');
      return;
    }

    if (selectedValue === '__add_group__') {
      onAddNewGroup?.();
      setDropdownValue('');
      return;
    }

    // Parse selection type and ID
    const [type, id] = selectedValue.split(':');
    
    let beneficiary: BeneficiarySelection | null = null;

    if (type === 'person') {
      beneficiary = getBeneficiaryFromPerson(id);
    } else if (type === 'group') {
      beneficiary = getBeneficiaryFromGroup(id);
    } else if (type === 'estate') {
      beneficiary = {
        id: 'estate',
        type: 'estate',
        name: 'The Estate',
      };
    }

    if (!beneficiary) return;

    if (mode === 'single') {
      onChange(beneficiary);
    } else {
      onChange([...selections, beneficiary]);
    }

    setDropdownValue('');
  };

  // Remove a selection (multi mode)
  const handleRemove = (id: string) => {
    if (mode === 'single') {
      onChange({ id: '', type: 'person', name: '' });
    } else {
      onChange(selections.filter(s => s.id !== id));
    }
  };

  // Get display text for beneficiary
  const getDisplayText = (beneficiary: BeneficiarySelection): string => {
    if (beneficiary.type === 'estate') return 'The Estate';
    if (beneficiary.type === 'group') return beneficiary.name;
    if (beneficiary.relationship) {
      return `${beneficiary.name} (${beneficiary.relationship})`;
    }
    return beneficiary.name;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Multi Mode: Show selected chips */}
      {mode === 'multi' && selections.length > 0 && (
        <View style={styles.chipsContainer}>
          {selections.map((beneficiary) => (
            <View key={beneficiary.id} style={styles.chip}>
              {beneficiary.type === 'group' && (
                <IconButton icon="account-multiple" size={16} iconColor={KindlingColors.navy} style={styles.chipIcon} />
              )}
              {beneficiary.type === 'estate' && (
                <IconButton icon="bank" size={16} iconColor={KindlingColors.navy} style={styles.chipIcon} />
              )}
              <Text style={styles.chipText}>{getDisplayText(beneficiary)}</Text>
              <TouchableOpacity onPress={() => handleRemove(beneficiary.id)}>
                <IconButton icon="close" size={16} iconColor={KindlingColors.brown} style={styles.chipRemove} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Dropdown */}
      {(mode === 'multi' || selections.length === 0 || !selections[0].id) && (
        <Select
          placeholder={placeholder}
          value={dropdownValue}
          options={options}
          onChange={handleSelect}
        />
      )}

      {/* Single Mode: Show selected with change button */}
      {mode === 'single' && selections.length > 0 && selections[0].id && (
        <View style={styles.singleSelection}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{getDisplayText(selections[0])}</Text>
          </View>
          <Button variant="outline" onPress={() => handleRemove(selections[0].id)}>
            Change
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  chipsContainer: {
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  chipIcon: {
    margin: 0,
    padding: 0,
    marginRight: -4,
  },
  chipText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  chipRemove: {
    margin: 0,
    padding: 0,
    marginLeft: Spacing.xs,
  },
  singleSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
});

