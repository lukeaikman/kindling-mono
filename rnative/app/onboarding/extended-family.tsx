/**
 * Onboarding Extended Family Screen
 * 
 * Fourth screen in the onboarding flow
 * Collects information about parents, siblings, and other extended family
 * 
 * Features:
 * - Parents information (optional)
 * - Siblings management
 * - Other important people (optional)
 * - Relationship edge creation
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RadioGroup } from '../../src/components/ui/RadioGroup';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Dialog } from '../../src/components/ui/Dialog';
import { Checkbox } from '../../src/components/ui/Checkbox';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { RelationshipType, PersonRelationshipType } from '../../src/types';

/**
 * Family member data for local state
 */
interface FamilyMemberData {
  id?: string;
  firstName: string;
  lastName: string;
  type: 'parent' | 'sibling' | 'other';
  customRelationship?: string;
}

/**
 * OnboardingExtendedFamilyScreen component
 */
export default function OnboardingExtendedFamilyScreen() {
  const { personActions, willActions, relationshipActions } = useAppState();
  
  // Parents
  const [parentsLiving, setParentsLiving] = useState('');
  const [motherFirstName, setMotherFirstName] = useState('');
  const [motherLastName, setMotherLastName] = useState('');
  const [fatherFirstName, setFatherFirstName] = useState('');
  const [fatherLastName, setFatherLastName] = useState('');
  
  // Siblings
  const [hasSiblings, setHasSiblings] = useState('');
  const [siblings, setSiblings] = useState<FamilyMemberData[]>([]);
  
  // Other important people
  const [hasOtherImportant, setHasOtherImportant] = useState('');
  const [otherPeople, setOtherPeople] = useState<FamilyMemberData[]>([]);
  
  // Dialog state
  const [isSiblingDialogVisible, setIsSiblingDialogVisible] = useState(false);
  const [isOtherDialogVisible, setIsOtherDialogVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formRelationship, setFormRelationship] = useState('');
  
  // Load existing data
  useEffect(() => {
    loadExistingData();
  }, []);
  
  /**
   * Load existing extended family data
   */
  const loadExistingData = () => {
    const user = willActions.getUser();
    if (!user) return;
    
    // Load parents
    const parents = relationshipActions.getParents(user.id);
    if (parents.length > 0) {
      setParentsLiving('yes');
      // Try to identify mother and father (basic assumption by name pattern)
      // In practice, we'd store this info in qualifiers
    }
    
    // Load siblings
    const existingSiblings = relationshipActions.getSiblings(user.id);
    if (existingSiblings.length > 0) {
      setHasSiblings('yes');
      setSiblings(existingSiblings.map(sib => ({
        id: sib.id,
        firstName: sib.firstName,
        lastName: sib.lastName,
        type: 'sibling',
      })));
    }
  };
  
  /**
   * Handle adding a sibling
   */
  const handleAddSibling = () => {
    setEditingIndex(null);
    setFormFirstName('');
    setFormLastName('');
    setIsSiblingDialogVisible(true);
  };
  
  /**
   * Handle editing a sibling
   */
  const handleEditSibling = (index: number) => {
    const sibling = siblings[index];
    setEditingIndex(index);
    setFormFirstName(sibling.firstName);
    setFormLastName(sibling.lastName);
    setIsSiblingDialogVisible(true);
  };
  
  /**
   * Handle saving sibling
   */
  const handleSaveSibling = () => {
    const newSibling: FamilyMemberData = {
      id: editingIndex !== null ? siblings[editingIndex].id : undefined,
      firstName: formFirstName,
      lastName: formLastName,
      type: 'sibling',
    };
    
    if (editingIndex !== null) {
      const updated = [...siblings];
      updated[editingIndex] = newSibling;
      setSiblings(updated);
    } else {
      setSiblings([...siblings, newSibling]);
    }
    
    setIsSiblingDialogVisible(false);
  };
  
  /**
   * Handle removing a sibling
   */
  const handleRemoveSibling = (index: number) => {
    setSiblings(siblings.filter((_, i) => i !== index));
  };
  
  /**
   * Handle adding other person
   */
  const handleAddOtherPerson = () => {
    setEditingIndex(null);
    setFormFirstName('');
    setFormLastName('');
    setFormRelationship('');
    setIsOtherDialogVisible(true);
  };
  
  /**
   * Handle editing other person
   */
  const handleEditOtherPerson = (index: number) => {
    const person = otherPeople[index];
    setEditingIndex(index);
    setFormFirstName(person.firstName);
    setFormLastName(person.lastName);
    setFormRelationship(person.customRelationship || '');
    setIsOtherDialogVisible(true);
  };
  
  /**
   * Handle saving other person
   */
  const handleSaveOtherPerson = () => {
    const newPerson: FamilyMemberData = {
      id: editingIndex !== null ? otherPeople[editingIndex].id : undefined,
      firstName: formFirstName,
      lastName: formLastName,
      type: 'other',
      customRelationship: formRelationship,
    };
    
    if (editingIndex !== null) {
      const updated = [...otherPeople];
      updated[editingIndex] = newPerson;
      setOtherPeople(updated);
    } else {
      setOtherPeople([...otherPeople, newPerson]);
    }
    
    setIsOtherDialogVisible(false);
  };
  
  /**
   * Handle removing other person
   */
  const handleRemoveOtherPerson = (index: number) => {
    setOtherPeople(otherPeople.filter((_, i) => i !== index));
  };
  
  /**
   * Save all extended family data and continue
   */
  const handleContinue = () => {
    const user = willActions.getUser();
    if (!user) {
      console.error('❌ No will-maker found');
      return;
    }
    
    console.log('👨‍👩‍👧‍👦 Saving extended family data...');
    
    // Save parents if applicable
    if (parentsLiving === 'yes') {
      // Save mother
      if (motherFirstName && motherLastName) {
        const motherId = personActions.addPerson({
          firstName: motherFirstName,
          lastName: motherLastName,
          email: '',
          phone: '',
          relationship: 'parent',
          roles: ['family-member'],
          createdInOnboarding: true,
        });
        
        // Create parent relationship (parent -> child)
        relationshipActions.addRelationship(motherId, user.id, RelationshipType.PARENT_OF, {
          qualifiers: { biological: true, mother: true }
        });
        
        console.log('✅ Created mother:', motherId);
      }
      
      // Save father
      if (fatherFirstName && fatherLastName) {
        const fatherId = personActions.addPerson({
          firstName: fatherFirstName,
          lastName: fatherLastName,
          email: '',
          phone: '',
          relationship: 'parent',
          roles: ['family-member'],
          createdInOnboarding: true,
        });
        
        relationshipActions.addRelationship(fatherId, user.id, RelationshipType.PARENT_OF, {
          qualifiers: { biological: true, father: true }
        });
        
        console.log('✅ Created father:', fatherId);
      }
    }
    
    // Save siblings
    if (hasSiblings === 'yes') {
      siblings.forEach((sibling, index) => {
        const siblingId = personActions.addPerson({
          firstName: sibling.firstName,
          lastName: sibling.lastName,
          email: '',
          phone: '',
          relationship: 'sibling',
          roles: ['family-member'],
          createdInOnboarding: true,
        });
        
        relationshipActions.addRelationship(user.id, siblingId, RelationshipType.SIBLING_OF);
        
        console.log(`✅ Created sibling ${index + 1}:`, siblingId);
      });
    }
    
    // Save other important people
    if (hasOtherImportant === 'yes') {
      otherPeople.forEach((person, index) => {
        const personId = personActions.addPerson({
          firstName: person.firstName,
          lastName: person.lastName,
          email: '',
          phone: '',
          relationship: 'friend',
          customRelationship: person.customRelationship,
          roles: ['beneficiary'],
          createdInOnboarding: true,
        });
        
        relationshipActions.addRelationship(user.id, personId, RelationshipType.FRIEND);
        
        console.log(`✅ Created other person ${index + 1}:`, personId);
      });
    }
    
    console.log('✅ Extended family data saved');
    
    // Navigate to wrap-up
    router.push('/onboarding/wrap-up');
  };
  
  /**
   * Skip this screen
   */
  const handleSkip = () => {
    router.push('/onboarding/wrap-up');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  // Form validation for dialogs
  const isSiblingFormValid = formFirstName && formLastName;
  const isOtherFormValid = formFirstName && formLastName && formRelationship;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button variant="outline" onPress={handleBack}>Back</Button>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 4 of 5</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentCard}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account-multiple"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Extended Family & Others</Text>
          <Text style={styles.subtitle}>
            Tell us about other important people in your life. This is optional but helps us understand who might be beneficiaries.
          </Text>
          
          {/* Form */}
          <View style={styles.form}>
            {/* Parents Section */}
            <RadioGroup
              label="Are either of your parents still living?"
              value={parentsLiving}
              onChange={setParentsLiving}
              options={[
                { label: 'Yes, both', value: 'yes' },
                { label: 'Yes, one parent', value: 'one' },
                { label: 'No', value: 'no' },
                { label: "I'd rather not say", value: 'skip' },
              ]}
            />
            
            {/* Parent Details - Conditional */}
            {(parentsLiving === 'yes' || parentsLiving === 'one') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parent details (optional)</Text>
                
                {/* Mother */}
                <Text style={styles.fieldLabel}>Mother</Text>
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <Input
                      label="First name"
                      value={motherFirstName}
                      onChangeText={setMotherFirstName}
                      placeholder="First name"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.nameField}>
                    <Input
                      label="Last name"
                      value={motherLastName}
                      onChangeText={setMotherLastName}
                      placeholder="Last name"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                
                {/* Father */}
                <Text style={styles.fieldLabel}>Father</Text>
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <Input
                      label="First name"
                      value={fatherFirstName}
                      onChangeText={setFatherFirstName}
                      placeholder="First name"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.nameField}>
                    <Input
                      label="Last name"
                      value={fatherLastName}
                      onChangeText={setFatherLastName}
                      placeholder="Last name"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            {/* Siblings Section */}
            <RadioGroup
              label="Do you have any brothers or sisters?"
              value={hasSiblings}
              onChange={(value) => {
                setHasSiblings(value);
                if (value === 'no') {
                  setSiblings([]);
                }
              }}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
            />
            
            {/* Siblings List */}
            {hasSiblings === 'yes' && (
              <View style={styles.section}>
                {siblings.map((sibling, index) => (
                  <View key={index} style={styles.personCard}>
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>
                        {sibling.firstName} {sibling.lastName}
                      </Text>
                      <Text style={styles.personType}>Sibling</Text>
                    </View>
                    <View style={styles.personActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor={KindlingColors.navy}
                        onPress={() => handleEditSibling(index)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={KindlingColors.destructive}
                        onPress={() => handleRemoveSibling(index)}
                      />
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSibling}
                  activeOpacity={0.7}
                >
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor={KindlingColors.green}
                  />
                  <Text style={styles.addButtonText}>
                    {siblings.length === 0 ? 'Add a sibling' : 'Add another sibling'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            {/* Other Important People */}
            <RadioGroup
              label="Are there other important people you want to include?"
              value={hasOtherImportant}
              onChange={(value) => {
                setHasOtherImportant(value);
                if (value === 'no') {
                  setOtherPeople([]);
                }
              }}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
            />
            
            {/* Other People List */}
            {hasOtherImportant === 'yes' && (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>
                  Add friends, godchildren, charities, or anyone else important to you.
                </Text>
                
                {otherPeople.map((person, index) => (
                  <View key={index} style={styles.personCard}>
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>
                        {person.firstName} {person.lastName}
                      </Text>
                      <Text style={styles.personType}>{person.customRelationship}</Text>
                    </View>
                    <View style={styles.personActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor={KindlingColors.navy}
                        onPress={() => handleEditOtherPerson(index)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={KindlingColors.destructive}
                        onPress={() => handleRemoveOtherPerson(index)}
                      />
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddOtherPerson}
                  activeOpacity={0.7}
                >
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor={KindlingColors.green}
                  />
                  <Text style={styles.addButtonText}>Add a person</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <Button
            variant="outline"
            onPress={handleSkip}
            style={styles.skipButton}
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            onPress={handleContinue}
            style={styles.continueButton}
          >
            Continue
          </Button>
        </View>
      </View>
      
      {/* Sibling Dialog */}
      <Dialog
        visible={isSiblingDialogVisible}
        onDismiss={() => setIsSiblingDialogVisible(false)}
        title={editingIndex !== null ? 'Edit Sibling' : 'Add Sibling'}
        actions={[
          {
            label: 'Cancel',
            onPress: () => setIsSiblingDialogVisible(false),
            variant: 'outline',
          },
          {
            label: 'Save',
            onPress: handleSaveSibling,
            disabled: !isSiblingFormValid,
          },
        ]}
      >
        <View style={styles.dialogContent}>
          <Input
            label="First name"
            value={formFirstName}
            onChangeText={setFormFirstName}
            placeholder="Enter first name"
            autoCapitalize="words"
          />
          
          <Input
            label="Last name"
            value={formLastName}
            onChangeText={setFormLastName}
            placeholder="Enter last name"
            autoCapitalize="words"
          />
        </View>
      </Dialog>
      
      {/* Other Person Dialog */}
      <Dialog
        visible={isOtherDialogVisible}
        onDismiss={() => setIsOtherDialogVisible(false)}
        title={editingIndex !== null ? 'Edit Person' : 'Add Person'}
        actions={[
          {
            label: 'Cancel',
            onPress: () => setIsOtherDialogVisible(false),
            variant: 'outline',
          },
          {
            label: 'Save',
            onPress: handleSaveOtherPerson,
            disabled: !isOtherFormValid,
          },
        ]}
      >
        <View style={styles.dialogContent}>
          <Input
            label="First name"
            value={formFirstName}
            onChangeText={setFormFirstName}
            placeholder="Enter first name"
            autoCapitalize="words"
          />
          
          <Input
            label="Last name"
            value={formLastName}
            onChangeText={setFormLastName}
            placeholder="Enter last name"
            autoCapitalize="words"
          />
          
          <Input
            label="Relationship"
            value={formRelationship}
            onChangeText={setFormRelationship}
            placeholder="e.g., Godchild, Best Friend, Neighbour"
            autoCapitalize="words"
          />
        </View>
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
    flexGrow: 1,
  },
  contentCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 12,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${KindlingColors.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  divider: {
    marginVertical: Spacing.md,
    backgroundColor: KindlingColors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.muted,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  personType: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  personActions: {
    flexDirection: 'row',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: KindlingColors.green,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.green,
    fontWeight: Typography.fontWeight.medium,
  },
  dialogContent: {
    gap: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});

