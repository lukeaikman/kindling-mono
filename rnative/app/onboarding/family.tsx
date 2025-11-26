/**
 * Onboarding Family Screen - Remediated Version
 * 
 * Third screen in the onboarding flow
 * Matches web prototype exactly (except RadioGroup for relationship status - design decision)
 * 
 * Features:
 * - Relationship status selection (Single, Married, Civil partnership, Cohabiting, Widowed)
 * - Spouse/partner details form (first name + last name ONLY)
 * - Divorce question with 8 options
 * - Children management with inline cards (no modals)
 * - Per-child: relationship type, parental responsibility, capacity as guardian
 * - Co-guardian inline form
 * - Auto-add first child on "Yes"
 * - Delete button only shown when >1 children
 * - Last name pre-population from user's details
 * - HelpCircle tooltips on questions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RadioGroup } from '../../src/components/ui/RadioGroup';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Select } from '../../src/components/ui/Select';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { Tooltip } from '../../src/components/ui/Tooltip';
import { useAppState } from '../../src/hooks/useAppState';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { RelationshipType, PersonRelationshipType } from '../../src/types';

/**
 * Relationship status options - matches prototype exactly
 */
const RELATIONSHIP_STATUSES = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Civil partnership', value: 'civil-partnership' },
  { label: 'Cohabiting', value: 'cohabiting' },
  { label: 'Widowed', value: 'widowed' },
];

/**
 * Divorce status options - matches prototype exactly
 */
const DIVORCE_OPTIONS = [
  { label: 'No, never divorced', value: 'no' },
  { label: 'Yes, divorced once', value: 'yes-once' },
  { label: 'Yes, divorced multiple times', value: 'yes-multiple' },
  { label: 'Currently going through divorce', value: 'currently-divorcing' },
  { label: 'Separated but not divorced', value: 'separated' },
  { label: 'Marriage was annulled', value: 'annulled' },
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
  { label: 'Other', value: 'other' },
];

/**
 * Child relationship options - matches prototype
 */
const CHILD_RELATIONSHIP_OPTIONS = [
  { label: 'Biological child', value: 'biological-child' },
  { label: 'Adopted child', value: 'adopted-child' },
  { label: 'Stepchild', value: 'stepchild' },
  { label: 'Foster child', value: 'foster-child' },
  { label: 'Other', value: 'other' },
];

/**
 * Capacity as guardian options - matches prototype
 */
const CAPACITY_OPTIONS = [
  { label: 'Child is under 18', value: 'under-18' },
  { label: 'Child is over 18 but lacks mental capacity', value: 'over-18-lacks-capacity' },
  { label: 'Child is over 18 with full capacity', value: 'over-18-full-capacity' },
  { label: 'Special circumstances', value: 'special-circumstances' },
];

/**
 * Check if relationship status indicates having a partner
 */
const hasPartner = (status: string): boolean => {
  return ['married', 'civil-partnership', 'cohabiting'].includes(status);
};

/**
 * Child data interface - matches prototype
 */
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  relationship: string;
  guardianIds: string[];
  capacityStatus: 'under-18' | 'over-18-lacks-capacity' | 'over-18-full-capacity' | 'special-circumstances';
}

/**
 * Co-guardian form data
 */
interface CoGuardianFormData {
  firstName: string;
  lastName: string;
  relationship: string;
}

/**
 * OnboardingFamilyScreen component
 */
export default function OnboardingFamilyScreen() {
  const { personActions, willActions, relationshipActions } = useAppState();
  
  // Form state - matches prototype
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [divorced, setDivorced] = useState('no');
  const [hasChildren, setHasChildren] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  
  // Spouse details - first and last name only (matches prototype)
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  
  // Last name pre-population tracking
  const [spouseLastNamePrePopulated, setSpouseLastNamePrePopulated] = useState(false);
  const [spouseLastNameTouched, setSpouseLastNameTouched] = useState(false);
  const [childLastNamePrePopulated, setChildLastNamePrePopulated] = useState<{[key: string]: boolean}>({});
  const [childLastNameTouched, setChildLastNameTouched] = useState<{[key: string]: boolean}>({});
  
  // Co-guardian management
  const [coGuardians, setCoGuardians] = useState<any[]>([]);
  const [showCoGuardianForm, setShowCoGuardianForm] = useState<string | null>(null);
  const [coGuardianForm, setCoGuardianForm] = useState<CoGuardianFormData>({
    firstName: '',
    lastName: '',
    relationship: '',
  });
  
  // Get user's last name for pre-population
  const user = willActions.getUser();
  const userLastName = user?.lastName || '';
  
  // Load existing data on mount
  useEffect(() => {
    loadExistingData();
  }, []);
  
  /**
   * Load existing family data from storage
   */
  const loadExistingData = () => {
    const currentUser = willActions.getUser();
    if (!currentUser) return;
    
    // Load spouse/partner
    const existingSpouse = relationshipActions.getSpouse(currentUser.id, 'active');
    if (existingSpouse) {
      setSpouseFirstName(existingSpouse.firstName);
      setSpouseLastName(existingSpouse.lastName);
      
      // Determine relationship status
      if (existingSpouse.relationship === 'spouse') {
        setRelationshipStatus('married');
      } else if (existingSpouse.relationship === 'partner') {
        setRelationshipStatus('cohabiting');
      }
    }
    
    // Load children
    const existingChildren = relationshipActions.getChildren(currentUser.id);
    if (existingChildren.length > 0) {
      setHasChildren('yes');
      setChildren(existingChildren.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth,
        relationship: child.relationship || 'biological-child',
        guardianIds: child.guardianIds || [],
        capacityStatus: (child.capacityStatus as Child['capacityStatus']) || 'under-18',
      })));
    }
  };
  
  /**
   * Handle relationship status change with spouse last name pre-population
   */
  const handleRelationshipStatusChange = (value: string) => {
    setRelationshipStatus(value);
    
    // Pre-populate spouse last name if has partner and user has a last name
    if (hasPartner(value) && userLastName && !spouseLastNameTouched) {
      setSpouseLastName(userLastName);
      setSpouseLastNamePrePopulated(true);
    }
    
    // Clear spouse details if no partner
    if (!hasPartner(value)) {
      setSpouseFirstName('');
      setSpouseLastName('');
      setSpouseLastNamePrePopulated(false);
      setSpouseLastNameTouched(false);
    }
  };
  
  /**
   * Handle spouse last name focus - clear pre-populated value on first focus
   */
  const handleSpouseLastNameFocus = () => {
    if (spouseLastNamePrePopulated && !spouseLastNameTouched) {
      setSpouseLastName('');
      setSpouseLastNameTouched(true);
    }
  };
  
  /**
   * Handle spouse last name change
   */
  const handleSpouseLastNameChange = (value: string) => {
    setSpouseLastName(value);
    setSpouseLastNameTouched(true);
  };
  
  /**
   * Add a new child - matches prototype logic
   */
  const addChild = useCallback(() => {
    const userId = 'user-placeholder';
    const spouseId = 'spouse-placeholder';
    
    // Default guardians based on relationship status
    const defaultGuardianIds = hasPartner(relationshipStatus)
      ? [userId, spouseId]
      : [userId];
    
    // Pre-populate last name if spouse has been entered
    const shouldPrePopulate = spouseLastName.trim() !== '';
    const childLastName = shouldPrePopulate ? userLastName : '';
    
    const newChild: Child = {
      id: Date.now().toString(),
      firstName: '',
      lastName: childLastName,
      relationship: 'biological-child',
      guardianIds: defaultGuardianIds,
      capacityStatus: 'under-18',
    };
    
    setChildren(prev => [...prev, newChild]);
    
    // Track pre-population
    if (shouldPrePopulate) {
      setChildLastNamePrePopulated(prev => ({ ...prev, [newChild.id]: true }));
    }
    setChildLastNameTouched(prev => ({ ...prev, [newChild.id]: false }));
  }, [relationshipStatus, spouseLastName, userLastName]);
  
  /**
   * Handle hasChildren change - auto-add first child on "Yes"
   */
  const handleHasChildrenChange = (value: string) => {
    setHasChildren(value);
    if (value === 'yes' && children.length === 0) {
      addChild();
    } else if (value === 'no') {
      setChildren([]);
    }
  };
  
  /**
   * Remove a child
   */
  const removeChild = (id: string) => {
    setChildren(prev => prev.filter(child => child.id !== id));
    // Clean up tracking
    setChildLastNamePrePopulated(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setChildLastNameTouched(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };
  
  /**
   * Update a child field
   */
  const updateChild = (id: string, field: keyof Omit<Child, 'id'>, value: any) => {
    setChildren(prev => prev.map(child =>
      child.id === id ? { ...child, [field]: value } : child
    ));
  };
  
  /**
   * Handle child last name focus - clear if pre-populated
   */
  const handleChildLastNameFocus = (childId: string) => {
    if (childLastNamePrePopulated[childId] && !childLastNameTouched[childId]) {
      updateChild(childId, 'lastName', '');
      setChildLastNameTouched(prev => ({ ...prev, [childId]: true }));
    }
  };
  
  /**
   * Handle child last name change
   */
  const handleChildLastNameChange = (childId: string, value: string) => {
    updateChild(childId, 'lastName', value);
    setChildLastNameTouched(prev => ({ ...prev, [childId]: true }));
    setChildLastNamePrePopulated(prev => ({ ...prev, [childId]: false }));
  };
  
  /**
   * Get parental responsibility options
   */
  const getParentalResponsibilityOptions = () => {
    const options = [
      { label: 'Sole responsibility', value: 'sole-responsibility' },
    ];
    
    if (hasPartner(relationshipStatus)) {
      const partnerLabel = relationshipStatus === 'married' ? 'spouse' : 
                           relationshipStatus === 'civil-partnership' ? 'civil partner' : 'partner';
      options.push({
        label: `Co-responsibility with ${partnerLabel}`,
        value: 'co-responsibility-with-spouse',
      });
    }
    
    // Add existing co-guardians
    coGuardians.forEach(cg => {
      options.push({
        label: `Co-responsibility with ${cg.firstName} ${cg.lastName}`,
        value: `co-guardian-${cg.id}`,
      });
    });
    
    options.push({ label: 'Add co-guardian', value: 'add-co-guardian' });
    
    return options;
  };
  
  /**
   * Handle parental responsibility change
   */
  const handleParentalResponsibilityChange = (childId: string, value: string) => {
    const userId = 'user-placeholder';
    const spouseId = 'spouse-placeholder';
    
    if (value === 'add-co-guardian') {
      setShowCoGuardianForm(childId);
      setCoGuardianForm({ firstName: '', lastName: '', relationship: '' });
    } else if (value === 'sole-responsibility') {
      updateChild(childId, 'guardianIds', [userId]);
    } else if (value === 'co-responsibility-with-spouse') {
      updateChild(childId, 'guardianIds', [userId, spouseId]);
    } else if (value.startsWith('co-guardian-')) {
      const coGuardianId = value.replace('co-guardian-', '');
      updateChild(childId, 'guardianIds', [userId, coGuardianId]);
    }
  };
  
  /**
   * Get parental responsibility value from guardianIds
   */
  const getParentalResponsibilityValue = (child: Child): string => {
    const userId = 'user-placeholder';
    const spouseId = hasPartner(relationshipStatus) ? 'spouse-placeholder' : undefined;
    
    if (!child.guardianIds || child.guardianIds.length === 0) {
      return 'sole-responsibility';
    }
    
    if (spouseId && child.guardianIds.includes(spouseId)) {
      return 'co-responsibility-with-spouse';
    }
    
    const otherGuardianId = child.guardianIds.find(id => id !== userId && id !== spouseId);
    if (otherGuardianId) {
      return `co-guardian-${otherGuardianId}`;
    }
    
    return 'sole-responsibility';
  };
  
  /**
   * Handle co-guardian form submit
   */
  const handleCoGuardianSubmit = (childId: string) => {
    if (!coGuardianForm.firstName.trim()) return;
    
    const newCoGuardian = {
      id: Date.now().toString(),
      firstName: coGuardianForm.firstName.trim(),
      lastName: coGuardianForm.lastName.trim(),
      relationship: coGuardianForm.relationship || 'Co-guardian',
    };
    
    setCoGuardians(prev => [...prev, newCoGuardian]);
    
    // Add to child's guardians
    const userId = 'user-placeholder';
    updateChild(childId, 'guardianIds', [userId, newCoGuardian.id]);
    
    // Reset form
    setCoGuardianForm({ firstName: '', lastName: '', relationship: '' });
    setShowCoGuardianForm(null);
  };
  
  /**
   * Cancel co-guardian form
   */
  const handleCoGuardianCancel = () => {
    setCoGuardianForm({ firstName: '', lastName: '', relationship: '' });
    setShowCoGuardianForm(null);
  };
  
  /**
   * Save all family data and navigate to next screen
   */
  const handleContinue = () => {
    if (!isValid) return;
    
    const currentUser = willActions.getUser();
    if (!currentUser) {
      console.error('No will-maker found');
      return;
    }
    
    // Clear existing onboarding family members
    personActions.clearOnboardingFamilyMembers();
    
    console.log('Saving family data...');
    
    // Save spouse/partner
    if (hasPartner(relationshipStatus) && spouseFirstName && spouseLastName) {
      const spouseRelationship: PersonRelationshipType = 
        relationshipStatus === 'married' || relationshipStatus === 'civil-partnership'
          ? 'spouse'
          : 'partner';
      
      const spouseId = personActions.addPerson({
        firstName: spouseFirstName,
        lastName: spouseLastName,
        email: '',
        phone: '',
        relationship: spouseRelationship,
        roles: ['family-member', 'beneficiary'],
        createdInOnboarding: true,
      });
      
      const relType = spouseRelationship === 'spouse' ? RelationshipType.SPOUSE : RelationshipType.PARTNER;
      relationshipActions.addRelationship(currentUser.id, spouseId, relType, { phase: 'active' });
      
      console.log('Created spouse/partner:', spouseId);
    }
    
    // Save children
    if (hasChildren === 'yes' && children.length > 0) {
      children.forEach((child, index) => {
        // Determine qualifiers from relationship type
        const qualifiers: Record<string, boolean> = {};
        if (child.relationship === 'biological-child') qualifiers.biological = true;
        if (child.relationship === 'adopted-child') qualifiers.adoptive = true;
        if (child.relationship === 'stepchild') qualifiers.step = true;
        if (child.relationship === 'foster-child') qualifiers.foster = true;
        
        const childId = personActions.addPerson({
          firstName: child.firstName,
          lastName: child.lastName,
          email: '',
          phone: '',
          dateOfBirth: child.dateOfBirth,
          relationship: child.relationship as PersonRelationshipType,
          roles: ['family-member', 'beneficiary'],
          isUnder18: child.capacityStatus === 'under-18',
          inCare: child.capacityStatus === 'under-18' || child.capacityStatus === 'over-18-lacks-capacity',
          careCategory: child.capacityStatus === 'under-18' ? 'child-under-18' : undefined,
          capacityStatus: child.capacityStatus,
          guardianIds: child.guardianIds,
          createdInOnboarding: true,
        });
        
        relationshipActions.addRelationship(currentUser.id, childId, RelationshipType.PARENT_OF, {
          qualifiers,
        });
        
        console.log(`Created child ${index + 1}:`, childId);
      });
    }
    
    console.log('Family data saved successfully');
    router.push('/onboarding/extended-family');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  // Validation - matches prototype
  const isSpouseValid = !hasPartner(relationshipStatus) || (spouseFirstName && spouseLastName);
  const areChildrenValid = hasChildren === 'no' || (
    children.length > 0 && children.every(child => 
      child.firstName && child.lastName && child.relationship
    )
  );
  const isValid = relationshipStatus && divorced && hasChildren && isSpouseValid && areChildrenValid;
  
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
                icon="heart"
                iconColor={KindlingColors.green}
                size={24}
              />
            </View>
          </View>
          
          {/* Title - matches prototype */}
          <Text style={styles.title}>Your family</Text>
          <Text style={styles.subtitle}>
            This helps us make sure the right people are protected
          </Text>
          
          {/* Form */}
          <View style={styles.form}>
            {/* Relationship Status - with tooltip */}
            <View style={styles.questionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.questionLabel}>Which best describes your current situation?</Text>
                <Tooltip content="Your relationship status affects inheritance rights and tax allowances for your partner.">
                  <IconButton
                    icon="help-circle"
                    size={16}
                    iconColor={KindlingColors.mutedForeground}
                  />
                </Tooltip>
              </View>
              <RadioGroup
                value={relationshipStatus}
                onChange={handleRelationshipStatusChange}
                options={RELATIONSHIP_STATUSES}
              />
            </View>
            
            {/* Spouse/Partner Details - Conditional */}
            {hasPartner(relationshipStatus) && (
              <View style={styles.spouseSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionTitle}>
                    {relationshipStatus === 'married' ? 'Spouse details' : 
                     relationshipStatus === 'civil-partnership' ? 'Civil partner details' : 
                     'Partner details'}
                  </Text>
                  <Tooltip content="We need these details to ensure your spouse/partner can be properly identified in your will.">
                    <IconButton
                      icon="help-circle"
                      size={16}
                      iconColor={KindlingColors.mutedForeground}
                    />
                  </Tooltip>
                </View>
                
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <Input
                      label="First name"
                      value={spouseFirstName}
                      onChangeText={setSpouseFirstName}
                      placeholder="Enter first name"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.nameField}>
                    <Input
                      label="Last name"
                      value={spouseLastName}
                      onChangeText={handleSpouseLastNameChange}
                      onFocus={handleSpouseLastNameFocus}
                      placeholder="Enter last name"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            {/* Divorce Question - with tooltip */}
            <View style={styles.questionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.questionLabel}>Have you ever been divorced?</Text>
                <Tooltip content="Divorce can affect how your estate is distributed.">
                  <IconButton
                    icon="help-circle"
                    size={16}
                    iconColor={KindlingColors.mutedForeground}
                  />
                </Tooltip>
              </View>
              <Select
                value={divorced}
                onChange={setDivorced}
                options={DIVORCE_OPTIONS}
                placeholder="Select divorce status"
              />
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Children Question - with tooltip, correct wording */}
            <View style={styles.questionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.questionLabel}>Do you have children or guardianship responsibilities?</Text>
                <Tooltip content="Include all children: biological, adopted, step-children, and those you consider as your own.">
                  <IconButton
                    icon="help-circle"
                    size={16}
                    iconColor={KindlingColors.mutedForeground}
                  />
                </Tooltip>
              </View>
              <RadioGroup
                value={hasChildren}
                onChange={handleHasChildrenChange}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
              />
            </View>
            
            {/* Children Inline Cards - matches prototype */}
            {hasChildren === 'yes' && (
              <View style={styles.childrenSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionTitle}>Tell us about those in your care</Text>
                  <Tooltip content="Providing names helps us identify them clearly in your will and plan for guardianship if needed.">
                    <IconButton
                      icon="help-circle"
                      size={16}
                      iconColor={KindlingColors.mutedForeground}
                    />
                  </Tooltip>
                </View>
                
                {children.map((child, index) => (
                  <View key={child.id} style={styles.childCard}>
                    {/* Delete button - only show when >1 children */}
                    {children.length > 1 && (
                      <View style={styles.childDeleteRow}>
                        <TouchableOpacity
                          onPress={() => removeChild(child.id)}
                          style={styles.deleteButton}
                        >
                          <IconButton
                            icon="delete"
                            size={18}
                            iconColor={KindlingColors.destructive}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Name fields */}
                    <View style={styles.nameRow}>
                      <View style={styles.nameField}>
                        <Input
                          label="First name"
                          value={child.firstName}
                          onChangeText={(value) => updateChild(child.id, 'firstName', value)}
                          placeholder="Enter first name"
                          autoCapitalize="words"
                        />
                      </View>
                      <View style={styles.nameField}>
                        <Input
                          label="Last name"
                          value={child.lastName}
                          onChangeText={(value) => handleChildLastNameChange(child.id, value)}
                          onFocus={() => handleChildLastNameFocus(child.id)}
                          placeholder="Enter last name"
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                    
                    {/* Date of birth (optional) */}
                    <Input
                      label="Date of birth (optional)"
                      value={child.dateOfBirth || ''}
                      onChangeText={(value) => updateChild(child.id, 'dateOfBirth', value)}
                      placeholder="YYYY-MM-DD"
                    />
                    
                    {/* Relationship dropdown */}
                    <Select
                      label="Relationship to you"
                      value={child.relationship}
                      onChange={(value) => updateChild(child.id, 'relationship', value)}
                      options={CHILD_RELATIONSHIP_OPTIONS}
                      placeholder="Select relationship"
                    />
                    
                    {/* Parental responsibility dropdown */}
                    <Select
                      label="Responsibility"
                      value={getParentalResponsibilityValue(child)}
                      onChange={(value) => handleParentalResponsibilityChange(child.id, value)}
                      options={getParentalResponsibilityOptions()}
                      placeholder="Select parental responsibility"
                    />
                    
                    {/* Capacity as Guardian dropdown */}
                    <Select
                      label="Capacity as Guardian"
                      value={child.capacityStatus}
                      onChange={(value) => updateChild(child.id, 'capacityStatus', value)}
                      options={CAPACITY_OPTIONS}
                      placeholder="Select capacity status"
                    />
                    
                    {/* Co-guardian inline form - matches prototype */}
                    {showCoGuardianForm === child.id && (
                      <View style={styles.coGuardianForm}>
                        <Text style={styles.coGuardianTitle}>Add Co-guardian</Text>
                        
                        <View style={styles.nameRow}>
                          <View style={styles.nameField}>
                            <Input
                              label="First name"
                              value={coGuardianForm.firstName}
                              onChangeText={(value) => setCoGuardianForm(prev => ({ ...prev, firstName: value }))}
                              placeholder="Enter first name"
                              autoCapitalize="words"
                            />
                          </View>
                          <View style={styles.nameField}>
                            <Input
                              label="Last name"
                              value={coGuardianForm.lastName}
                              onChangeText={(value) => setCoGuardianForm(prev => ({ ...prev, lastName: value }))}
                              placeholder="Enter last name"
                              autoCapitalize="words"
                            />
                          </View>
                        </View>
                        
                        <Input
                          label="Relationship (optional)"
                          value={coGuardianForm.relationship}
                          onChangeText={(value) => setCoGuardianForm(prev => ({ ...prev, relationship: value }))}
                          placeholder="e.g., Ex-partner, Friend"
                        />
                        
                        <View style={styles.coGuardianActions}>
                          <Button
                            variant="outline"
                            onPress={handleCoGuardianCancel}
                            style={styles.coGuardianButton}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onPress={() => handleCoGuardianSubmit(child.id)}
                            disabled={!coGuardianForm.firstName.trim()}
                            style={styles.coGuardianButton}
                          >
                            Add
                          </Button>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
                
                {/* Add another child button - matches prototype */}
                {children.length > 0 && (
                  <View style={styles.addAnotherContainer}>
                    <Button
                      variant="outline"
                      onPress={addChild}
                      icon="plus"
                    >
                      Add another
                    </Button>
                  </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${KindlingColors.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  questionContainer: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  questionLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    flex: 1,
  },
  divider: {
    marginVertical: Spacing.sm,
    backgroundColor: KindlingColors.border,
  },
  spouseSection: {
    backgroundColor: `${KindlingColors.cream}50`,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.border,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  childrenSection: {
    gap: Spacing.md,
  },
  childCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    gap: Spacing.sm,
  },
  childDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    marginRight: -Spacing.sm,
    marginTop: -Spacing.sm,
  },
  coGuardianForm: {
    backgroundColor: `${KindlingColors.green}08`,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${KindlingColors.green}30`,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  coGuardianTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  coGuardianActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  coGuardianButton: {
    flex: 1,
  },
  addAnotherContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: KindlingColors.background,
  },
});
