/**
 * Onboarding Family Screen - Enhanced Version
 * 
 * Third screen in the onboarding flow
 * Collects comprehensive information about spouse/partner and children
 * Creates relationship edges in the data model
 * 
 * Features:
 * - Relationship status selection (married, civil partnership, living with partner, single, divorced, widowed)
 * - Spouse/partner details form (name, DOB, email, phone) - conditional on relationship status
 * - Children management (add, edit, remove children with full details)
 * - Relationship edge creation between will-maker and family members
 * - Data persistence via useAppState hook
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
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { RelationshipType, Person, PersonRelationshipType } from '../../src/types';
import { calculateAge } from '../../src/utils/helpers';

/**
 * Relationship status options
 */
const RELATIONSHIP_STATUSES = [
  { label: 'Married', value: 'married' },
  { label: 'Civil Partnership', value: 'civil-partnership' },
  { label: 'Living with Partner', value: 'living-with-partner' },
  { label: 'Single', value: 'single' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' },
];

/**
 * Check if relationship status indicates having a partner
 */
const hasPartner = (status: string): boolean => {
  return ['married', 'civil-partnership', 'living-with-partner'].includes(status);
};

/**
 * Child data for local state management before saving
 */
interface ChildFormData {
  id?: string; // Only present for existing children
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isUnder18?: boolean;
}

/**
 * OnboardingFamilyScreen component
 * 
 * Enhanced version with full spouse/partner and children management
 */
export default function OnboardingFamilyScreen() {
  const { personActions, willActions, relationshipActions } = useAppState();
  
  // Relationship status
  const [relationshipStatus, setRelationshipStatus] = useState('');
  
  // Spouse/Partner details
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  const [spouseDateOfBirth, setSpouseDateOfBirth] = useState('');
  const [spouseEmail, setSpouseEmail] = useState('');
  const [spousePhone, setSpousePhone] = useState('');
  
  // Children
  const [hasChildren, setHasChildren] = useState('');
  const [children, setChildren] = useState<ChildFormData[]>([]);
  
  // Child dialog
  const [isChildDialogVisible, setIsChildDialogVisible] = useState(false);
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [childFormFirstName, setChildFormFirstName] = useState('');
  const [childFormLastName, setChildFormLastName] = useState('');
  const [childFormDateOfBirth, setChildFormDateOfBirth] = useState('');
  
  // Load existing data on mount
  useEffect(() => {
    loadExistingData();
  }, []);
  
  /**
   * Load existing family data from storage
   */
  const loadExistingData = () => {
    const user = willActions.getUser();
    if (!user) return;
    
    // Load spouse/partner
    const existingSpouse = relationshipActions.getSpouse(user.id, 'active');
    if (existingSpouse) {
      setSpouseFirstName(existingSpouse.firstName);
      setSpouseLastName(existingSpouse.lastName);
      if (existingSpouse.dateOfBirth) {
        // Convert YYYY-MM-DD to DD-MM-YYYY for display
        const parts = existingSpouse.dateOfBirth.split('-');
        if (parts.length === 3) {
          setSpouseDateOfBirth(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      setSpouseEmail(existingSpouse.email || '');
      setSpousePhone(existingSpouse.phone || '');
      
      // Determine relationship status from spouse relationship
      if (existingSpouse.relationship === 'spouse') {
        setRelationshipStatus('married');
      } else if (existingSpouse.relationship === 'partner') {
        setRelationshipStatus('living-with-partner');
      }
    }
    
    // Load children
    const existingChildren = relationshipActions.getChildren(user.id);
    if (existingChildren.length > 0) {
      setHasChildren('yes');
      setChildren(existingChildren.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth ? formatDateForDisplay(child.dateOfBirth) : '',
        isUnder18: child.isUnder18,
      })));
    }
  };
  
  /**
   * Format date from YYYY-MM-DD to DD-MM-YYYY for display
   */
  const formatDateForDisplay = (isoDate: string): string => {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDate;
  };
  
  /**
   * Format date from DD-MM-YYYY to YYYY-MM-DD for storage
   */
  const formatDateForStorage = (displayDate: string): string => {
    const parts = displayDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return displayDate;
  };
  
  /**
   * Calculate if a person is under 18 based on date of birth
   */
  const isUnder18FromDOB = (displayDate: string): boolean => {
    const isoDate = formatDateForStorage(displayDate);
    const age = calculateAge(isoDate);
    return age !== null && age < 18;
  };
  
  /**
   * Handle opening child dialog for new child
   */
  const handleAddChild = () => {
    setEditingChildIndex(null);
    setChildFormFirstName('');
    setChildFormLastName('');
    setChildFormDateOfBirth('');
    setIsChildDialogVisible(true);
  };
  
  /**
   * Handle opening child dialog for editing
   */
  const handleEditChild = (index: number) => {
    const child = children[index];
    setEditingChildIndex(index);
    setChildFormFirstName(child.firstName);
    setChildFormLastName(child.lastName);
    setChildFormDateOfBirth(child.dateOfBirth);
    setIsChildDialogVisible(true);
  };
  
  /**
   * Handle saving child from dialog
   */
  const handleSaveChild = () => {
    const newChild: ChildFormData = {
      id: editingChildIndex !== null ? children[editingChildIndex].id : undefined,
      firstName: childFormFirstName,
      lastName: childFormLastName,
      dateOfBirth: childFormDateOfBirth,
      isUnder18: isUnder18FromDOB(childFormDateOfBirth),
    };
    
    if (editingChildIndex !== null) {
      // Update existing child
      const updatedChildren = [...children];
      updatedChildren[editingChildIndex] = newChild;
      setChildren(updatedChildren);
    } else {
      // Add new child
      setChildren([...children, newChild]);
    }
    
    setIsChildDialogVisible(false);
  };
  
  /**
   * Handle removing a child
   */
  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };
  
  /**
   * Save all family data and navigate to next screen
   */
  const handleContinue = () => {
    if (!isValid) return;
    
    const user = willActions.getUser();
    if (!user) {
      console.error('❌ No will-maker found');
      return;
    }
    
    // Clear any existing onboarding family members before re-creating
    personActions.clearOnboardingFamilyMembers();
    
    console.log('👨‍👩‍👧‍👦 Saving family data...');
    
    // Save spouse/partner if applicable
    if (hasPartner(relationshipStatus) && spouseFirstName && spouseLastName) {
      const spouseRelationship: PersonRelationshipType = 
        relationshipStatus === 'married' || relationshipStatus === 'civil-partnership' 
          ? 'spouse' 
          : 'partner';
      
      const spouseId = personActions.addPerson({
        firstName: spouseFirstName,
        lastName: spouseLastName,
        email: spouseEmail,
        phone: spousePhone,
        dateOfBirth: spouseDateOfBirth ? formatDateForStorage(spouseDateOfBirth) : undefined,
        relationship: spouseRelationship,
        roles: ['family-member', 'beneficiary'],
        createdInOnboarding: true,
      });
      
      // Create relationship edge
      const relType = spouseRelationship === 'spouse' ? RelationshipType.SPOUSE : RelationshipType.PARTNER;
      relationshipActions.addRelationship(user.id, spouseId, relType, { phase: 'active' });
      
      console.log('✅ Created spouse/partner:', spouseId);
    }
    
    // Save children if applicable
    if (hasChildren === 'yes' && children.length > 0) {
      children.forEach((child, index) => {
        const childId = personActions.addPerson({
          firstName: child.firstName,
          lastName: child.lastName,
          email: '',
          phone: '',
          dateOfBirth: child.dateOfBirth ? formatDateForStorage(child.dateOfBirth) : undefined,
          relationship: 'biological-child',
          roles: ['family-member', 'beneficiary'],
          isUnder18: child.isUnder18,
          inCare: child.isUnder18, // Children under 18 are in care
          careCategory: child.isUnder18 ? 'child-under-18' : undefined,
          createdInOnboarding: true,
        });
        
        // Create parent-child relationship edge
        relationshipActions.addRelationship(user.id, childId, RelationshipType.PARENT_OF, {
          qualifiers: { biological: true }
        });
        
        console.log(`✅ Created child ${index + 1}:`, childId);
      });
    }
    
    console.log('✅ Family data saved successfully');
    
    // Navigate to extended family screen
    router.push('/onboarding/extended-family');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  // Validation
  const isSpouseValid = !hasPartner(relationshipStatus) || (spouseFirstName && spouseLastName);
  const isChildrenValid = hasChildren !== 'yes' || children.length > 0;
  const isValid = relationshipStatus && hasChildren && isSpouseValid && isChildrenValid;
  
  // Child dialog validation
  const isChildFormValid = childFormFirstName && childFormLastName && childFormDateOfBirth;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button variant="outline" onPress={handleBack}>Back</Button>
        <KindlingLogo size="sm" variant="dark" showText={false} />
        <Text style={styles.stepText}>Step 3 of 5</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentCard}>
          {/* Icon Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account-group"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Tell us about your family</Text>
          <Text style={styles.subtitle}>
            This helps us understand who might inherit from you and who might need guardians
          </Text>
          
          {/* Form */}
          <View style={styles.form}>
            {/* Relationship Status */}
            <RadioGroup
              label="What's your relationship status?"
              value={relationshipStatus}
              onChange={setRelationshipStatus}
              options={RELATIONSHIP_STATUSES}
            />
            
            {/* Spouse/Partner Details - Conditional */}
            {hasPartner(relationshipStatus) && (
              <View style={styles.section}>
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>
                  {relationshipStatus === 'married' || relationshipStatus === 'civil-partnership' 
                    ? 'Your spouse/partner details' 
                    : 'Your partner details'}
                </Text>
                
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <Input
                      label="First name"
                      value={spouseFirstName}
                      onChangeText={setSpouseFirstName}
                      placeholder="First name"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.nameField}>
                    <Input
                      label="Last name"
                      value={spouseLastName}
                      onChangeText={setSpouseLastName}
                      placeholder="Last name"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                
                <Input
                  label="Date of Birth"
                  value={spouseDateOfBirth}
                  onChangeText={setSpouseDateOfBirth}
                  placeholder="DD-MM-YYYY"
                  leftIcon="calendar"
                />
                
                <Input
                  label="Email (optional)"
                  value={spouseEmail}
                  onChangeText={setSpouseEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Input
                  label="Phone (optional)"
                  value={spousePhone}
                  onChangeText={setSpousePhone}
                  placeholder="+44 7xxx xxxxxx"
                  keyboardType="phone-pad"
                />
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            {/* Children Question */}
            <RadioGroup
              label="Do you have any children?"
              value={hasChildren}
              onChange={(value) => {
                setHasChildren(value);
                if (value === 'no') {
                  setChildren([]);
                }
              }}
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
            />
            
            {/* Children List - Conditional */}
            {hasChildren === 'yes' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your children</Text>
                <Text style={styles.sectionSubtitle}>
                  Add each of your children below. We'll ask about stepchildren and adopted children later.
                </Text>
                
                {/* Children Cards */}
                {children.map((child, index) => (
                  <View key={index} style={styles.childCard}>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>
                        {child.firstName} {child.lastName}
                      </Text>
                      {child.dateOfBirth && (
                        <Text style={styles.childDetails}>
                          DOB: {child.dateOfBirth}
                          {child.isUnder18 && ' • Under 18'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.childActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor={KindlingColors.navy}
                        onPress={() => handleEditChild(index)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={KindlingColors.destructive}
                        onPress={() => handleRemoveChild(index)}
                      />
                    </View>
                  </View>
                ))}
                
                {/* Add Child Button */}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddChild}
                  activeOpacity={0.7}
                >
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor={KindlingColors.green}
                  />
                  <Text style={styles.addButtonText}>
                    {children.length === 0 ? 'Add your first child' : 'Add another child'}
                  </Text>
                </TouchableOpacity>
                
                {/* Validation message */}
                {hasChildren === 'yes' && children.length === 0 && (
                  <Text style={styles.validationText}>
                    Please add at least one child to continue
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={!isValid}
        >
          Continue
        </Button>
      </View>
      
      {/* Child Dialog */}
      <Dialog
        visible={isChildDialogVisible}
        onDismiss={() => setIsChildDialogVisible(false)}
        title={editingChildIndex !== null ? 'Edit Child' : 'Add Child'}
        actions={[
          {
            label: 'Cancel',
            onPress: () => setIsChildDialogVisible(false),
            variant: 'outline',
          },
          {
            label: 'Save',
            onPress: handleSaveChild,
            disabled: !isChildFormValid,
          },
        ]}
      >
        <View style={styles.dialogContent}>
          <Input
            label="First name"
            value={childFormFirstName}
            onChangeText={setChildFormFirstName}
            placeholder="Enter first name"
            autoCapitalize="words"
          />
          
          <Input
            label="Last name"
            value={childFormLastName}
            onChangeText={setChildFormLastName}
            placeholder="Enter last name"
            autoCapitalize="words"
          />
          
          <Input
            label="Date of Birth"
            value={childFormDateOfBirth}
            onChangeText={setChildFormDateOfBirth}
            placeholder="DD-MM-YYYY"
            leftIcon="calendar"
          />
          
          {childFormDateOfBirth && isUnder18FromDOB(childFormDateOfBirth) && (
            <View style={styles.under18Badge}>
              <IconButton
                icon="baby-face"
                size={16}
                iconColor={KindlingColors.green}
              />
              <Text style={styles.under18Text}>
                This child is under 18 - we'll ask about guardians later
              </Text>
            </View>
          )}
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
    gap: Spacing.md,
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
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KindlingColors.muted,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  childDetails: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  childActions: {
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
  validationText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.destructive,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  dialogContent: {
    gap: Spacing.md,
  },
  under18Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.green}15`,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  under18Text: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.green,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});
