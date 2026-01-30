import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import type { PersonActions, PersonRelationshipType, PersonRole } from '../../types';
import { RELATIONSHIP_OPTIONS } from '../../utils/relationshipOptions';

export interface AddPersonDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onCreated: (personId: string) => void;
  personActions: PersonActions;
  roles?: PersonRole[];
  title?: string;
}

const DEFAULT_ROLES: PersonRole[] = ['beneficiary'];

export const AddPersonDialog: React.FC<AddPersonDialogProps> = ({
  visible,
  onDismiss,
  onCreated,
  personActions,
  roles = DEFAULT_ROLES,
  title = 'Add New Person',
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState<PersonRelationshipType | ''>('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setRelationship('');
    setCustomRelationship('');
    setEmail('');
    setPhone('');
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const requiresCustomRelationship = relationship === 'other';
  const canSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !relationship) return false;
    if (requiresCustomRelationship && !customRelationship.trim()) return false;
    return true;
  }, [firstName, lastName, relationship, requiresCustomRelationship, customRelationship]);

  const handleSave = async () => {
    if (!canSubmit) return;

    const personId = await personActions.addPerson({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      relationship: relationship as PersonRelationshipType,
      customRelationship: requiresCustomRelationship ? customRelationship.trim() : undefined,
      roles,
    });

    onCreated(personId);
    onDismiss();
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      dismissable={true}
    >
      <View style={styles.container}>
        <View style={styles.row}>
          <Input
            label="First name *"
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Input
            label="Last name *"
            placeholder="Enter last name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <Select
          label="Relationship *"
          placeholder="Select relationship"
          value={relationship}
          options={RELATIONSHIP_OPTIONS}
          onChange={(value) => setRelationship(value as PersonRelationshipType)}
        />

        {requiresCustomRelationship && (
          <Input
            label="Custom relationship *"
            placeholder="Describe relationship"
            value={customRelationship}
            onChangeText={setCustomRelationship}
          />
        )}

        <Input
          label="Email (optional)"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Phone (optional)"
          placeholder="Enter phone number"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.helperText}>
          You can edit details later from the Family section.
        </Text>

        <View style={styles.actions}>
          <Button variant="secondary" onPress={onDismiss}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave} disabled={!canSubmit}>
            Save
          </Button>
        </View>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  row: {
    gap: Spacing.sm,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 18,
  },
  actions: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
});
