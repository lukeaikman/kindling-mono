/**
 * Executor Selection Screen
 * 
 * Main screen for adding and managing executors.
 * Reference: web-prototype/src/components/ExecutorSelectionScreen.tsx
 * 
 * Features:
 * - Optional dropdown to load existing contacts
 * - Always-visible executor form
 * - List of added executors with edit/delete
 * - Under-18 validation and warnings
 * - Confirmation dialog for 2 executors
 * - Level hierarchy enforcement
 * 
 * @module app/executors/selection
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Contacts from 'expo-contacts';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { Input } from '../../src/components/ui/Input';
import { Select } from '../../src/components/ui/Select';
import { VideoPlayer } from '../../src/components/ui/VideoPlayer';
import { ExecutorConfirmationDialog } from '../../src/components/ui/ExecutorConfirmationDialog';
import { Under18ExecutorDialog } from '../../src/components/ui/Under18ExecutorDialog';
import { KindlingLogo } from '../../src/components/ui/KindlingLogo';
import { useAppState } from '../../src/hooks/useAppState';
import { getDisplayRoleLabel, getDropdownRoleLabel, getAvailableLevels, isUnder18 } from '../../src/utils';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { Person } from '../../src/types';

interface ExecutorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  level: number;
}

/**
 * ExecutorSelectionScreen component
 * 
 * Allows user to add, edit, and manage executors for their will.
 */
export default function ExecutorSelectionScreen() {
  const { personActions, willActions } = useAppState();
  
  // UI State
  const [showVideo, setShowVideo] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUnder18Dialog, setShowUnder18Dialog] = useState(false);
  const [editingExecutorId, setEditingExecutorId] = useState<string | null>(null);
  
  // Double tap functionality for dev dashboard (on header)
  const lastTapRef = useRef<number>(0);
  
  // Form state
  const [formData, setFormData] = useState<ExecutorFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    level: 1,
  });
  
  const [formErrors, setFormErrors] = useState<Partial<ExecutorFormData>>({});
  
  // Get will data and executor levels
  const willData = willActions.getWillData();
  const executorLevels = willData.executors || [];
  
  // Get all people and filter to executors
  const allPeople = personActions.getPeople();
  const executors = executorLevels
    .map(el => {
      const person = personActions.getPersonById(el.executor);
      return person ? { ...person, level: el.level } : null;
    })
    .filter(Boolean) as (Person & { level: number })[];
  
  // Get available levels for dropdown - memoized to prevent infinite loops
  const availableLevels = useMemo(() => {
    return getAvailableLevels(executorLevels);
  }, [executorLevels.length, JSON.stringify(executorLevels)]);
  
  // Memoize level select options to prevent Menu component from breaking
  const levelOptions = useMemo(() => {
    return availableLevels.map(level => ({
      label: getDropdownRoleLabel(level, executorLevels),
      value: level.toString(),
    }));
  }, [availableLevels, executorLevels.length, JSON.stringify(executorLevels)]);
  
  // Check if we have a primary executor
  const hasPrimaryExecutor = executorLevels.some(e => e.level === 1);
  
  // Get existing contacts for dropdown (exclude will-maker and existing executors)
  const user = willActions.getUser();
  const existingExecutorIds = executors.map(e => e.id);
  const excludedIds = user ? [user.id, ...existingExecutorIds] : existingExecutorIds;
  
  // Memoize contact options to prevent re-creating on every render
  const contactOptions = useMemo(() => {
    const availableContacts = allPeople.filter(person => 
      !excludedIds.includes(person.id) &&
      person.roles.some(role => ['family-member', 'beneficiary', 'guardian', 'co-guardian'].includes(role))
    );
    
    return availableContacts.map(person => ({
      label: `${person.firstName} ${person.lastName}`,
      value: person.id,
    }));
  }, [allPeople.length, existingExecutorIds.length, user?.id]);
  
  // Update form level when executors change - defaults to next unfilled level
  useEffect(() => {
    if (!editingExecutorId && availableLevels.length > 0) {
      // Find the first level that has NO executors yet (the next unfilled level)
      const usedLevels = executorLevels.map(e => e.level);
      const firstUnfilledLevel = availableLevels.find(level => !usedLevels.includes(level));
      
      // Default to first unfilled level, or lowest available if all are filled (co- scenario)
      const targetLevel = firstUnfilledLevel || availableLevels[0];
      
      if (formData.level !== targetLevel) {
        setFormData(prev => ({
          ...prev,
          level: targetLevel,
        }));
      }
    }
  }, [executorLevels.length, editingExecutorId, formData.level, JSON.stringify(executorLevels)]);
  
  const handleHeaderPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      router.push('/developer/dashboard');
    }
    lastTapRef.current = now;
  }, []);
  
  const handleBack = useCallback(() => {
    router.back();
  }, []);
  
  /**
   * Handle changing the executor level in the form
   */
  const handleLevelChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, level: parseInt(value) }));
  }, []);
  
  /**
   * Handle loading an existing contact into the form
   */
  const handleLoadContact = useCallback((personId: string) => {
    const person = personActions.getPersonById(personId);
    if (!person) return;
    
    setFormData(prev => ({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      level: prev.level, // Keep current level selection
    }));
    
    // Clear any existing errors
    setFormErrors({});
  }, [personActions]);
  
  /**
   * Handle importing from phone contacts
   */
  const handleImportFromPhoneContacts = useCallback(async () => {
    try {
      // Use native contact picker (no permission request needed upfront)
      const result = await Contacts.presentContactPickerAsync();
      
      if (result) {
        // Populate form with contact data
        setFormData(prev => ({
          firstName: result.firstName || result.name?.split(' ')[0] || '',
          lastName: result.lastName || result.name?.split(' ').slice(1).join(' ') || '',
          email: result.emails?.[0]?.email || '',
          phone: result.phoneNumbers?.[0]?.number || '',
          level: prev.level, // Keep current level selection
        }));
        
        // Clear any existing errors
        setFormErrors({});
      }
    } catch (error) {
      console.error('Error loading contact:', error);
      Alert.alert(
        'Unable to Load Contact',
        'There was an error accessing your contacts. Please enter the details manually.',
        [{ text: 'OK' }]
      );
    }
  }, []);
  
  /**
   * Validate the executor form
   */
  const validateForm = (): boolean => {
    const errors: Partial<ExecutorFormData> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Handle adding a new executor
   */
  const handleAddExecutor = () => {
    if (!validateForm()) return;
    
    // Create new person with executor role
    const personId = personActions.addPerson({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      relationship: 'other',
      roles: ['executor'],
    });
    
    // Add to will executors with level
    const newExecutors = [...executorLevels, { executor: personId, level: formData.level }];
    willActions.updateWillData({ executors: newExecutors });
    
    // Reset form
    resetForm();
  };
  
  /**
   * Handle updating an existing executor
   */
  const handleUpdateExecutor = () => {
    if (!editingExecutorId || !validateForm()) return;
    
    // Update person data
    personActions.updatePerson(editingExecutorId, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    });
    
    // Update executor level
    const newExecutors = executorLevels.map(e =>
      e.executor === editingExecutorId ? { ...e, level: formData.level } : e
    );
    willActions.updateWillData({ executors: newExecutors });
    
    // Reset form
    resetForm();
    setEditingExecutorId(null);
  };
  
  /**
   * Handle removing an executor
   */
  const handleRemoveExecutor = (personId: string) => {
    // Find the executor level
    const executorLevel = executorLevels.find(e => e.executor === personId);
    if (!executorLevel) return;
    
    const level = executorLevel.level;
    
    // Check if there are other executors at the same level
    const sameLevelExecutors = executorLevels.filter(e => e.level === level);
    
    if (sameLevelExecutors.length > 1) {
      // Multiple executors at this level - just remove this one
      const newExecutors = executorLevels.filter(e => e.executor !== personId);
      willActions.updateWillData({ executors: newExecutors });
    } else {
      // Only executor at this level - rebuild hierarchy
      const newExecutors = executorLevels
        .filter(e => e.executor !== personId)
        .map(e => {
          if (e.level < level) {
            return e; // Keep lower levels unchanged
          } else {
            return { ...e, level: e.level - 1 }; // Promote higher levels down
          }
        });
      
      willActions.updateWillData({ executors: newExecutors });
    }
    
    // Handle person removal
    const person = personActions.getPersonById(personId);
    if (person) {
      personActions.removeRoleFromPerson(personId, 'executor');
      
      const updatedPerson = personActions.getPersonById(personId);
      if (updatedPerson && updatedPerson.roles.length === 0) {
        personActions.removePerson(personId);
      }
    }
    
    // Clear editing state if removing the currently edited executor
    if (editingExecutorId === personId) {
      resetForm();
      setEditingExecutorId(null);
    }
  };
  
  /**
   * Handle editing an executor
   */
  const handleEditExecutor = (executor: Person & { level: number }) => {
    setFormData({
      firstName: executor.firstName,
      lastName: executor.lastName,
      email: executor.email,
      phone: executor.phone,
      level: executor.level,
    });
    setEditingExecutorId(executor.id);
    setFormErrors({});
  };
  
  /**
   * Handle canceling edit
   */
  const handleCancelEdit = () => {
    resetForm();
    setEditingExecutorId(null);
  };
  
  /**
   * Reset form to initial state
   * Note: Level will be updated by useEffect when availableLevels changes
   */
  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      level: 1, // Will be updated by useEffect to correct available level
    });
    setFormErrors({});
  }, []);
  
  /**
   * Handle continue button
   */
  const handleContinue = () => {
    if (!hasPrimaryExecutor) return;
    
    if (executors.length <= 2) {
      // Show confirmation dialog recommending 3 executors
      setShowConfirmDialog(true);
    } else {
      // 3+ executors, proceed directly
      router.push('/executors/invitation');
    }
  };
  
  /**
   * Handle confirmation dialog - proceed with 2 executors
   */
  const handleConfirmProceed = useCallback(() => {
    setShowConfirmDialog(false);
    router.push('/executors/invitation');
  }, []);
  
  /**
   * Handle confirmation dialog - add more executors
   */
  const handleAddMore = useCallback(() => {
    setShowConfirmDialog(false);
    // User stays on screen to add more
  }, []);
  
  /**
   * Handle dismissing confirmation dialog
   */
  const handleDismissConfirm = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);
  
  /**
   * Handle dismissing under-18 dialog
   */
  const handleDismissUnder18 = useCallback(() => {
    setShowUnder18Dialog(false);
  }, []);
  
  /**
   * Handle dismissing video
   */
  const handleDismissVideo = useCallback(() => {
    setShowVideo(false);
  }, []);
  
  // Get continue button text
  const getContinueButtonText = () => {
    if (!hasPrimaryExecutor) {
      return 'Add at least one primary executor';
    } else if (executors.length === 1) {
      return 'Continue with one executor';
    } else if (executors.length === 2) {
      return 'Continue with two executors';
    } else {
      return 'Continue with multiple executors';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Subtle Morphic Background */}
      <View style={styles.backgroundOverlay} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.morphicBlob1]} />
        <View style={[styles.morphicBlob, styles.morphicBlob2]} />
      </View>
      
      {/* Header */}
      <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.9}>
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <View style={styles.headerCenter}>
            <View style={styles.iconCircle}>
              <IconButton
                icon="account-group"
                size={20}
                iconColor={KindlingColors.navy}
              />
            </View>
            <Text style={styles.headerTitle}>Choose Your Executors</Text>
          </View>
          <IconButton
            icon="play-circle-outline"
            size={24}
            iconColor={KindlingColors.navy}
            onPress={() => setShowVideo(true)}
          />
        </View>
      </TouchableOpacity>
      
      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentCard}>
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Select the people who will carry out your will. You can have multiple executors at different levels.
            </Text>
            
            {/* Optional Contact Loader */}
            {!editingExecutorId && contactOptions.length > 0 && (
              <View style={styles.contactLoaderSection}>
                <Select
                  label="Load existing contact (optional)"
                  placeholder="Select a contact..."
                  value=""
                  onChange={handleLoadContact}
                  options={contactOptions}
                />
              </View>
            )}
            
            {/* Executor Form */}
            <View style={styles.executorForm}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderLeft}>
                  <IconButton
                    icon="account-plus"
                    size={20}
                    iconColor={KindlingColors.navy}
                  />
                  <Text style={styles.formTitle}>
                    {editingExecutorId ? 'Edit Executor' : 'Add New Executor'}
                  </Text>
                </View>
                {!editingExecutorId && (
                  <IconButton
                    icon="card-account-phone"
                    size={20}
                    iconColor={KindlingColors.green}
                    onPress={handleImportFromPhoneContacts}
                  />
                )}
              </View>
              
              {/* Name Fields */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChangeText={(value) => setFormData({ ...formData, firstName: value })}
                    placeholder="John"
                    error={!!formErrors.firstName}
                    errorMessage={formErrors.firstName}
                  />
                </View>
                <View style={styles.nameField}>
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChangeText={(value) => setFormData({ ...formData, lastName: value })}
                    placeholder="Doe"
                    error={!!formErrors.lastName}
                    errorMessage={formErrors.lastName}
                  />
                </View>
              </View>
              
              {/* Email */}
              <Input
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => setFormData({ ...formData, email: value })}
                placeholder="john.doe@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!formErrors.email}
                errorMessage={formErrors.email}
              />
              
              {/* Phone */}
              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => setFormData({ ...formData, phone: value })}
                placeholder="+44 20 1234 5678"
                keyboardType="phone-pad"
              />
              
              {/* Executor Level */}
              <Select
                label="Executor Level"
                value={formData.level.toString()}
                onChange={handleLevelChange}
                options={levelOptions}
              />
              
              {/* Form Actions */}
              <View style={styles.formActions}>
                <Button
                  variant="primary"
                  onPress={editingExecutorId ? handleUpdateExecutor : handleAddExecutor}
                  style={styles.formButton}
                >
                  {editingExecutorId ? 'Update Executor' : 'Add Executor'}
                </Button>
                {editingExecutorId && (
                  <Button
                    variant="outline"
                    onPress={handleCancelEdit}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                )}
              </View>
            </View>
            
            {/* Executor List */}
            {executors.length > 0 && (
              <View style={styles.executorList}>
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderText}>Added Executors:</Text>
                  <Text style={styles.listHeaderCount}>
                    {executors.length} {executors.length === 1 ? 'Executor' : 'Executors'}
                  </Text>
                </View>
                
                {executors
                  .sort((a, b) => a.level - b.level)
                  .map((executor) => {
                    const under18 = isUnder18(executor.dateOfBirth);
                    
                    return (
                      <TouchableOpacity
                        key={executor.id}
                        style={styles.executorCard}
                        onPress={() => handleEditExecutor(executor)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.executorCardContent}>
                          <View style={styles.executorInfo}>
                            <View style={styles.executorNameRow}>
                              <Text style={styles.executorName}>
                                {executor.firstName} {executor.lastName}
                              </Text>
                              <View style={styles.executorBadge}>
                                <Text style={styles.executorBadgeText}>
                                  {getDisplayRoleLabel(executor.level, executorLevels)}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.executorContact}>{executor.email}</Text>
                            {executor.phone && (
                              <Text style={styles.executorContact}>{executor.phone}</Text>
                            )}
                            
                            {/* Under-18 Warning */}
                            {under18 && (
                              <View style={styles.warningBox}>
                                <IconButton
                                  icon="alert-circle"
                                  size={16}
                                  iconColor="#D97706"
                                  style={styles.warningIcon}
                                />
                                <View style={styles.warningTextContainer}>
                                  <Text style={styles.warningText}>
                                    <Text style={styles.warningTextBold}>{executor.firstName}</Text> cannot 
                                    act as an Executor until they reach 18 years of age.{' '}
                                    <Text 
                                      style={styles.warningLink}
                                      onPress={() => setShowUnder18Dialog(true)}
                                    >
                                      Learn more
                                    </Text>
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                          
                          <IconButton
                            icon="close"
                            size={20}
                            iconColor={KindlingColors.brown}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRemoveExecutor(executor.id);
                            }}
                            style={styles.removeButton}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={!hasPrimaryExecutor}
        >
          {getContinueButtonText()}
        </Button>
      </View>
      
      {/* Modals and Dialogs - Only render when visible */}
      {showVideo && (
        <VideoPlayer
          videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title="Understanding Executors"
          visible={showVideo}
          onDismiss={handleDismissVideo}
        />
      )}
      
      {showConfirmDialog && (
        <ExecutorConfirmationDialog
          visible={showConfirmDialog}
          onDismiss={handleDismissConfirm}
          onAddMore={handleAddMore}
          onProceed={handleConfirmProceed}
        />
      )}
      
      {showUnder18Dialog && (
        <Under18ExecutorDialog
          visible={showUnder18Dialog}
          onDismiss={handleDismissUnder18}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  morphicBlob: {
    position: 'absolute',
    opacity: 0.2,
  },
  morphicBlob1: {
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.navy,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  morphicBlob2: {
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    backgroundColor: KindlingColors.navy,
    borderRadius: 120,
    transform: [{ rotate: '45deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
    zIndex: 10,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${KindlingColors.navy}1a`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  contentCard: {
    marginHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}99`,
    lineHeight: 20,
    textAlign: 'center',
  },
  contactLoaderSection: {
    marginBottom: Spacing.sm,
  },
  executorForm: {
    backgroundColor: `${KindlingColors.cream}4d`,
    borderRadius: 12,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  formHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: -8,
  },
  formTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameField: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  formButton: {
    flex: 1,
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
  },
  executorList: {
    gap: Spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  listHeaderCount: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  executorCard: {
    backgroundColor: `${KindlingColors.cream}80`,
    borderWidth: 1,
    borderColor: `${KindlingColors.beige}80`,
    borderRadius: 12,
    padding: Spacing.md,
  },
  executorCardContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  executorInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  executorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  executorName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
  },
  executorBadge: {
    backgroundColor: `${KindlingColors.navy}1a`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  executorBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.navy,
    textTransform: 'capitalize',
  },
  executorContact: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
  },
  removeButton: {
    margin: -8,
  },
  warningBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
  },
  warningIcon: {
    margin: 0,
    marginTop: -2,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningText: {
    fontSize: Typography.fontSize.xs,
    color: '#92400E',
    lineHeight: 18,
  },
  warningTextBold: {
    fontWeight: Typography.fontWeight.semibold,
  },
  warningLink: {
    textDecorationLine: 'underline',
    color: '#B45309',
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: KindlingColors.background,
    borderTopWidth: 0.5,
    borderTopColor: KindlingColors.cream,
  },
});

