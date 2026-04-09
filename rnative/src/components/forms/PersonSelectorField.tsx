/**
 * PersonSelectorField Component
 * 
 * A field for selecting a person from the list of people
 * With option to create a new person
 * 
 * @module components/forms/PersonSelectorField
 */

import React from 'react';
import { Select, SelectOption } from '../ui/Select';
import { Person } from '../../types';
import { getPersonFullName } from '../../utils/helpers';

/**
 * PersonSelectorField component props
 */
export interface PersonSelectorFieldProps {
  /**
   * Label for the selector
   */
  label?: string;
  
  /**
   * Currently selected person ID
   */
  value: string;
  
  /**
   * Change handler
   */
  onChange: (personId: string) => void;
  
  /**
   * Array of available people
   */
  people: Person[];
  
  /**
   * Filter function to limit available people
   */
  filter?: (person: Person) => boolean;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Whether to show "Add new person" option
   */
  allowCreate?: boolean;
  
  /**
   * Handler for creating new person
   */
  onCreateNew?: () => void;
  
  /**
   * Whether field is disabled
   */
  disabled?: boolean;
}

/**
 * PersonSelectorField component
 * 
 * @example
 * ```tsx
 * <PersonSelectorField
 *   label="Select Executor"
 *   value={selectedExecutorId}
 *   onChange={setSelectedExecutorId}
 *   people={allPeople}
 *   filter={(person) => person.roles.includes('executor')}
 *   allowCreate
 *   onCreateNew={() => setShowCreatePersonDialog(true)}
 * />
 * ```
 */
export const PersonSelectorField: React.FC<PersonSelectorFieldProps> = ({
  label = 'Select Person',
  value,
  onChange,
  people,
  filter,
  placeholder = 'Select a person',
  allowCreate = false,
  onCreateNew,
  disabled = false,
}) => {
  // Apply filter if provided
  const filteredPeople = filter ? people.filter(filter) : people;
  
  // Convert people to select options
  const options: SelectOption[] = filteredPeople.map(person => ({
    label: getPersonFullName(person),
    value: person.id,
  }));
  
  // Add "create new" option if allowed
  if (allowCreate && onCreateNew) {
    options.push({
      label: '+ Add new person',
      value: '__create_new__',
    });
  }
  
  const handleChange = (newValue: string) => {
    if (newValue === '__create_new__' && onCreateNew) {
      onCreateNew();
    } else {
      onChange(newValue);
    }
  };
  
  return (
    <Select
      label={label}
      value={value}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

