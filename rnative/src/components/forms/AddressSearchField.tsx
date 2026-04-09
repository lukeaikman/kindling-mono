/**
 * AddressSearchField Component
 * 
 * An address search field with API integration placeholder
 * Currently allows manual entry, will be enhanced with address lookup API
 * 
 * @module components/forms/AddressSearchField
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../ui/Input';
import { AddressData } from '../../types';
import { Spacing } from '../../styles/constants';

/**
 * AddressSearchField component props
 */
export interface AddressSearchFieldProps {
  /**
   * Label for the field
   */
  label?: string;
  
  /**
   * Current address value
   */
  value: AddressData | null;
  
  /**
   * Change handler
   */
  onChange: (address: AddressData) => void;
  
  /**
   * Whether field is disabled
   */
  disabled?: boolean;
}

/**
 * Address search field component
 * 
 * @example
 * ```tsx
 * <AddressSearchField
 *   label="Property Address"
 *   value={address}
 *   onChange={setAddress}
 * />
 * ```
 */
export const AddressSearchField: React.FC<AddressSearchFieldProps> = ({
  label = 'Address',
  value,
  onChange,
  disabled = false,
}) => {
  const handleFieldChange = (field: keyof AddressData, text: string) => {
    onChange({
      ...(value || {
        address1: '',
        address2: '',
        city: '',
        county: '',
        postcode: '',
        country: 'United Kingdom',
      }),
      [field]: text,
    });
  };
  
  return (
    <View style={styles.container}>
      <Input
        label="Address Line 1"
        value={value?.address1 || ''}
        onChangeText={(text) => handleFieldChange('address1', text)}
        disabled={disabled}
        placeholder="Street address"
      />
      
      <Input
        label="Address Line 2"
        value={value?.address2 || ''}
        onChangeText={(text) => handleFieldChange('address2', text)}
        disabled={disabled}
        placeholder="Apartment, suite, etc. (optional)"
      />
      
      <Input
        label="City"
        value={value?.city || ''}
        onChangeText={(text) => handleFieldChange('city', text)}
        disabled={disabled}
        placeholder="City"
      />
      
      <Input
        label="County"
        value={value?.county || ''}
        onChangeText={(text) => handleFieldChange('county', text)}
        disabled={disabled}
        placeholder="County"
      />
      
      <Input
        label="Postcode"
        value={value?.postcode || ''}
        onChangeText={(text) => handleFieldChange('postcode', text)}
        disabled={disabled}
        placeholder="SW1A 1AA"
        autoCapitalize="characters"
      />
      
      <Input
        label="Country"
        value={value?.country || 'United Kingdom'}
        onChangeText={(text) => handleFieldChange('country', text)}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
});

