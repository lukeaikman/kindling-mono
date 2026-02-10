/**
 * Guardian Wishes Screen
 * 
 * Allows user to assign guardian hierarchies to dependents (children).
 * Uses LOCAL STATE during editing, writes to willData on submit/back.
 * 
 * Features:
 * - Add/edit/remove guardians for each child
 * - Copy guardian assignments between children
 * - Visual card stacking for children sharing guardians
 * - Validation: all children must have at least one guardian
 * 
 * Architecture:
 * - Load: Read willData.guardianship → local guardianData state
 * - Edit: All changes update local state only
 * - Submit: Write guardianData → willData.guardianship, navigate
 * - Back: Write guardianData → willData.guardianship, go back
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Contacts from 'expo-contacts';
import { useAppState } from '../../src/hooks/useAppState';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { Input } from '../../src/components/ui/Input';
import { Select } from '../../src/components/ui/Select';
import { Dialog } from '../../src/components/ui/Dialog';
import { Celebration } from '../../src/components/ui/Celebration';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import { getDisplayRoleLabel, getDropdownRoleLabel, getAvailableLevels } from '../../src/utils/executorHelpers';
import { getNextYourPeopleRoute, type WillProgressState } from '../../src/utils/willProgress';
import type { Person } from '../../src/types';

type GuardianAssignment = { guardian: string; level: number };

export default function GuardianWishesScreen() {
  const { personActions, willActions, estateRemainderActions } = useAppState();

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Build progress state for smart routing after celebration
  const progressState: WillProgressState = useMemo(() => ({
    willMaker: willActions.getUser(),
    people: personActions.getPeople(),
    willData: willActions.getWillData(),
    estateRemainderState: estateRemainderActions.getEstateRemainderState(),
  }), [willActions, personActions, estateRemainderActions]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    const next = getNextYourPeopleRoute(progressState);
    router.push(next as any);
  }, [progressState]);

  // Get dependents
  const dependents = personActions.getPeopleInCare();
  const sortedDependents = [...dependents].sort((a, b) => a.firstName.localeCompare(b.firstName));
  
  // Local state - single source of truth during editing
  const [guardianData, setGuardianData] = useState<Record<string, GuardianAssignment[]>>({});
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [stackedGroups, setStackedGroups] = useState<string[][]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    level: 1,
    selectedContactId: '',
  });
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  
  // Modal state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetChildId, setCopyTargetChildId] = useState<string | null>(null);
  
  // Load guardians from willData on mount
  useEffect(() => {
    const initialData: Record<string, GuardianAssignment[]> = {};
    const user = willActions.getUser();
    const userId = user?.id;
    
    sortedDependents.forEach(dep => {
      const guardians = willActions.getGuardians(dep.id);
      // Filter out parents (current guardians) - they'll be dead
      const nominatedOnly = guardians.filter(g => {
        const isParent = dep.guardianIds?.includes(g.guardian);
        return !isParent;
      });
      initialData[dep.id] = nominatedOnly;
    });
    
    setGuardianData(initialData);
    
    // Set first child as active
    if (sortedDependents.length > 0 && !activeChildId) {
      setActiveChildId(sortedDependents[0].id);
    }
  }, [sortedDependents.length]);
  
  // Get excluded person IDs for contact loader
  const getExcludedPersonIds = (childId: string) => {
    const excluded: string[] = [];
    const child = sortedDependents.find(d => d.id === childId);
    if (!child) return excluded;
    
    // Exclude will-maker
    const user = willActions.getUser();
    if (user?.id) {
      excluded.push(user.id);
    }
    
    // Exclude current guardians (parents) from Person.guardianIds
    if (child.guardianIds && child.guardianIds.length > 0) {
      excluded.push(...child.guardianIds);
    }
    
    // Exclude already nominated guardians (from local state)
    const nominated = guardianData[childId] || [];
    nominated.forEach(g => {
      if (!excluded.includes(g.guardian)) {
        excluded.push(g.guardian);
      }
    });
    
    // Exclude all children
    sortedDependents.forEach(dep => {
      if (!excluded.includes(dep.id)) {
        excluded.push(dep.id);
      }
    });
    
    return excluded;
  };
  
  // Get all children in a stack
  const getStackMembers = (childId: string) => {
    for (const group of stackedGroups) {
      if (group.includes(childId)) {
        return group;
      }
    }
    return [childId];
  };
  
  // Check if child has guardians
  const childHasGuardians = (childId: string) => {
    const guardians = guardianData[childId] || [];
    return guardians.length > 0;
  };
  
  // Add or update guardian
  const handleAddGuardian = async () => {
    if (editingGuardianId) {
      handleUpdateGuardian();
      return;
    }
    
    if (!activeChildId) return;
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    if (!formData.email.trim()) return;
    
    // Get or create person
    let personId = formData.selectedContactId;
    
    if (!personId) {
      // Create new person
      personId = await personActions.addPerson({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        relationship: 'other',
        roles: ['guardian'],
      });
    } else {
      // Add guardian role to existing person
      personActions.addRoleToPerson(personId, 'guardian');
      personActions.updatePerson(personId, {
        email: formData.email,
        phone: formData.phone,
      });
    }
    
    // Add to ALL children in stack
    const stackMembers = getStackMembers(activeChildId);
    const newGuardianData = { ...guardianData };
    
    stackMembers.forEach(childId => {
      const current = newGuardianData[childId] || [];
      newGuardianData[childId] = [...current, { guardian: personId, level: formData.level }];
    });
    
    setGuardianData(newGuardianData);
    resetForm();
  };
  
  // Remove guardian
  const handleRemoveGuardian = (guardianId: string) => {
    if (!activeChildId) return;
    
    // Remove from ALL children in stack
    const stackMembers = getStackMembers(activeChildId);
    const newGuardianData = { ...guardianData };
    
    stackMembers.forEach(childId => {
      const current = newGuardianData[childId] || [];
      newGuardianData[childId] = current.filter(g => g.guardian !== guardianId);
    });
    
    setGuardianData(newGuardianData);
    
    // Clear edit mode if removing the guardian being edited
    if (editingGuardianId === guardianId) {
      setEditingGuardianId(null);
      resetForm();
    }
  };
  
  // Edit guardian
  const handleEditGuardian = (guardianId: string) => {
    if (!activeChildId) return;
    
    const person = personActions.getPersonById(guardianId);
    if (!person) return;
    
    const guardians = guardianData[activeChildId] || [];
    const guardianLevel = guardians.find(g => g.guardian === guardianId);
    if (!guardianLevel) return;
    
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      level: guardianLevel.level,
      selectedContactId: '',
    });
    setEditingGuardianId(guardianId);
  };
  
  // Update guardian
  const handleUpdateGuardian = () => {
    if (!activeChildId || !editingGuardianId) return;
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    if (!formData.email.trim()) return;
    
    // Update person data
    personActions.updatePerson(editingGuardianId, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    });
    
    // Update level in ALL children in stack
    const stackMembers = getStackMembers(activeChildId);
    const newGuardianData = { ...guardianData };
    
    stackMembers.forEach(childId => {
      const current = newGuardianData[childId] || [];
      newGuardianData[childId] = current.map(g =>
        g.guardian === editingGuardianId ? { ...g, level: formData.level } : g
      );
    });
    
    setGuardianData(newGuardianData);
    resetForm();
  };
  
  // Copy guardians
  const handleCopyGuardians = (sourceChildId: string) => {
    if (!copyTargetChildId) return;
    
    // Copy guardian array
    const sourceGuardians = guardianData[sourceChildId] || [];
    const newGuardianData = { ...guardianData };
    newGuardianData[copyTargetChildId] = [...sourceGuardians];
    setGuardianData(newGuardianData);
    
    // Add to stacked group
    let addedToGroup = false;
    const newGroups = stackedGroups.map(group => {
      if (group.includes(sourceChildId)) {
        addedToGroup = true;
        return [...group, copyTargetChildId];
      }
      return group;
    });
    
    if (!addedToGroup) {
      newGroups.push([sourceChildId, copyTargetChildId]);
    }
    
    setStackedGroups(newGroups);
    setShowCopyModal(false);
    setCopyTargetChildId(null);
  };
  
  // Unstack child
  const handleUnstack = (childId: string) => {
    // Remove from group
    const newGroups = stackedGroups
      .map(group => group.filter(id => id !== childId))
      .filter(group => group.length > 1);
    setStackedGroups(newGroups);
    
    // Clear guardians
    const newGuardianData = { ...guardianData };
    newGuardianData[childId] = [];
    setGuardianData(newGuardianData);
  };
  
  // Load contact
  const handleLoadContact = (contactId: string) => {
    const person = personActions.getPersonById(contactId);
    if (!person) return;
    
    setFormData({
      ...formData,
      selectedContactId: contactId,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
    });
  };
  
  // Import from phone contacts
  const handleImportFromPhoneContacts = async () => {
    try {
      const result = await Contacts.presentContactPickerAsync();
      
      if (result) {
        setFormData({
          ...formData,
          firstName: result.firstName || result.name?.split(' ')[0] || '',
          lastName: result.lastName || result.name?.split(' ').slice(1).join(' ') || '',
          email: result.emails?.[0]?.email || '',
          phone: result.phoneNumbers?.[0]?.number || '',
          selectedContactId: '',
        });
      }
    } catch (error) {
      console.error('Error importing contact:', error);
    }
  };
  
  // Reset form
  const resetForm = () => {
    const currentGuardians = activeChildId ? guardianData[activeChildId] || [] : [];
    const availableLevels = getAvailableLevels(currentGuardians.map(g => ({ level: g.level })));
    
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      level: availableLevels[0] || 1,
      selectedContactId: '',
    });
    setEditingGuardianId(null);
  };
  
  // Validation
  const allChildrenHaveGuardians = sortedDependents.every(dep => childHasGuardians(dep.id));
  const childrenWithoutGuardians = sortedDependents.filter(dep => !childHasGuardians(dep.id));
  
  // Save to willData
  const saveToWillData = () => {
    // Update willData.guardianship
    const newGuardianship: Record<string, GuardianAssignment[]> = {};
    
    Object.keys(guardianData).forEach(childId => {
      newGuardianship[childId] = guardianData[childId];
    });
    
    willActions.updateWillData({ guardianship: newGuardianship });
  };
  
  // Handle back
  const handleBack = () => {
    saveToWillData();
    router.back();
  };
  
  // Handle continue – save, celebrate, then auto-progress to next sub-flow
  const handleContinue = () => {
    if (!allChildrenHaveGuardians) return;
    saveToWillData();
    setShowCelebration(true);
  };
  
  // Get contact options
  const getContactOptions = () => {
    if (!activeChildId) return [];
    const excluded = getExcludedPersonIds(activeChildId);
    const allPeople = personActions.getPeople();
    return allPeople
      .filter(p => !excluded.includes(p.id))
      .map(p => ({
        label: `${p.firstName} ${p.lastName}`,
        value: p.id,
      }));
  };
  
  // Get level options
  const getLevelOptions = () => {
    if (!activeChildId) return [];
    const current = guardianData[activeChildId] || [];
    const availableLevels = getAvailableLevels(current.map(g => ({ level: g.level })));
    return availableLevels.map(level => ({
      label: getDropdownRoleLabel(level, current.map(g => ({ level: g.level }))),
      value: level.toString(),
    }));
  };
  
  // Get guardian persons
  const getGuardianPersons = (childId: string) => {
    const guardians = guardianData[childId] || [];
    return guardians
      .map(g => {
        const person = personActions.getPersonById(g.guardian);
        return person ? { ...person, level: g.level } : null;
      })
      .filter(Boolean) as Array<Person & { level: number }>;
  };
  
  // Find primary child in stack
  const getPrimaryChildInStack = (childId: string) => {
    for (const group of stackedGroups) {
      if (group.includes(childId)) {
        return group[0];
      }
    }
    return childId;
  };
  
  // Check if child is primary in its stack
  const isPrimaryInStack = (childId: string) => {
    return getPrimaryChildInStack(childId) === childId;
  };
  
  // Get stacked children (excluding primary)
  const getStackedChildren = (primaryChildId: string) => {
    for (const group of stackedGroups) {
      if (group[0] === primaryChildId) {
        return group.slice(1).map(id => sortedDependents.find(d => d.id === id)).filter(Boolean) as Person[];
      }
    }
    return [];
  };
  
  // Check if should show copy button
  const shouldShowCopyButton = (childId: string) => {
    if (childHasGuardians(childId)) return false;
    return sortedDependents.some(d => d.id !== childId && childHasGuardians(d.id));
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
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton
              icon="heart"
              size={20}
              iconColor={KindlingColors.navy}
            />
          </View>
          <Text style={styles.headerTitle}>Guardian Choices</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      
      {/* Content with Keyboard Handling */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
        
        {/* Children Cards */}
        {sortedDependents.length === 0 ? (
          <View style={styles.emptyState}>
            <IconButton icon="heart" size={48} iconColor={KindlingColors.gold} />
            <Text style={styles.emptyTitle}>No Dependents Found</Text>
            <Text style={styles.emptyText}>
              You need to add dependents before assigning guardians.
            </Text>
            <Button variant="outline" onPress={handleBack}>
              Go Back to Add Dependents
            </Button>
          </View>
        ) : (
          sortedDependents
            .filter(dep => isPrimaryInStack(dep.id))
            .map(dep => {
              const isActive = activeChildId === dep.id;
              const stackedChildren = getStackedChildren(dep.id);
              const guardians = getGuardianPersons(dep.id);
              const guardianCount = guardians.length;
              
              return (
                <View key={dep.id} style={styles.cardContainer}>
                  {/* Stacked cards effect - behind active card, peeking from top */}
                  {stackedChildren.map((stackedChild, index) => (
                    <View 
                      key={stackedChild.id}
                      style={[
                        styles.stackedCard,
                        { 
                          top: -(stackedChildren.length - index) * 16,
                          left: (stackedChildren.length - index) * 4,
                          zIndex: -(stackedChildren.length - index),
                        }
                      ]}
                    >
                      <View style={styles.stackedCardHeader}>
                        <Text style={styles.stackedCardName}>{stackedChild.firstName} {stackedChild.lastName}</Text>
                        <TouchableOpacity 
                          onPress={() => handleUnstack(stackedChild.id)}
                          style={styles.unstackButton}
                        >
                          <IconButton icon="link-off" size={20} iconColor={KindlingColors.navy} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  {/* Main card */}
                  <TouchableOpacity
                    style={[styles.card, isActive && styles.cardActive]}
                    onPress={() => setActiveChildId(dep.id)}
                    activeOpacity={0.7}
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.childName}>{dep.firstName} {dep.lastName}</Text>
                      {!isActive && (
                        <Text style={styles.guardianStatus}>
                          {guardianCount > 0 
                            ? `${guardianCount} guardian${guardianCount !== 1 ? 's' : ''} assigned`
                            : 'No guardians assigned'}
                        </Text>
                      )}
                    </View>
                    
                    {/* Active Card Content */}
                    {isActive && (
                      <View style={styles.activeContent}>
                        {/* Guardian Form */}
                        <View style={styles.guardianForm}>
                          {/* Form Header */}
                          <View style={styles.formHeader}>
                            <View style={styles.formHeaderLeft}>
                              <IconButton
                                icon="account-plus"
                                size={20}
                                iconColor={KindlingColors.navy}
                              />
                              <Text style={styles.formTitle}>
                                {editingGuardianId ? 'Edit Guardian' : 'Add New Guardian'}
                              </Text>
                            </View>
                            {!editingGuardianId && (
                              <IconButton
                                icon="card-account-phone"
                                size={20}
                                iconColor={KindlingColors.green}
                                onPress={handleImportFromPhoneContacts}
                              />
                            )}
                          </View>
                          
                          {/* Load Contact */}
                          {getContactOptions().length > 0 && !editingGuardianId && (
                            <Select
                              placeholder="Load a contact"
                              value={formData.selectedContactId}
                              options={getContactOptions()}
                              onChange={handleLoadContact}
                            />
                          )}
                          
                          {/* Name Fields */}
                          <View style={styles.nameRow}>
                            <View style={styles.nameField}>
                              <Input
                                label="First Name"
                                value={formData.firstName}
                                onChangeText={(value) => setFormData({ ...formData, firstName: value })}
                                placeholder="First name"
                              />
                            </View>
                            <View style={styles.nameField}>
                              <Input
                                label="Last Name"
                                value={formData.lastName}
                                onChangeText={(value) => setFormData({ ...formData, lastName: value })}
                                placeholder="Last name"
                              />
                            </View>
                          </View>
                          
                          {/* Email */}
                          <Input
                            label="Email Address"
                            value={formData.email}
                            onChangeText={(value) => setFormData({ ...formData, email: value })}
                            placeholder="email@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                          
                          {/* Phone */}
                          <Input
                            label="Phone Number"
                            value={formData.phone}
                            onChangeText={(value) => setFormData({ ...formData, phone: value })}
                            placeholder="Phone number"
                            keyboardType="phone-pad"
                          />
                          
                          {/* Guardian Level */}
                          <Select
                            label="Guardian Level"
                            value={formData.level.toString()}
                            options={getLevelOptions()}
                            onChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
                          />
                          
                          {/* Form Actions */}
                          <View style={styles.formActions}>
                            <Button
                              variant="primary"
                              onPress={handleAddGuardian}
                              disabled={!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()}
                              style={styles.formButton}
                            >
                              {editingGuardianId ? 'Update Guardian' : 'Add Guardian'}
                            </Button>
                            {editingGuardianId && (
                              <Button
                                variant="outline"
                                onPress={resetForm}
                                style={styles.formButton}
                              >
                                Cancel
                              </Button>
                            )}
                          </View>
                        </View>
                        
                        {/* Guardian List */}
                        {guardians.length > 0 && (
                          <View style={styles.guardianList}>
                            <Text style={styles.guardianListTitle}>Assigned Guardians:</Text>
                            {guardians
                              .sort((a, b) => a.level - b.level)
                              .map((guardian) => (
                                <TouchableOpacity
                                  key={guardian.id}
                                  style={styles.guardianItem}
                                  onPress={() => handleEditGuardian(guardian.id)}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.guardianInfo}>
                                    <Text style={styles.guardianName}>
                                      {guardian.firstName} {guardian.lastName}
                                    </Text>
                                    <View style={styles.guardianMeta}>
                                      <View style={styles.levelBadge}>
                                        <Text style={styles.levelBadgeText}>
                                          {getDisplayRoleLabel(
                                            guardian.level,
                                            guardians.map(g => ({ level: g.level }))
                                          )}
                                        </Text>
                                      </View>
                                      <Text style={styles.guardianEmail}>{guardian.email}</Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e?.stopPropagation?.();
                                      handleRemoveGuardian(guardian.id);
                                    }}
                                    style={styles.removeButton}
                                  >
                                    <IconButton icon="close" size={20} iconColor={KindlingColors.brown} />
                                  </TouchableOpacity>
                                </TouchableOpacity>
                              ))}
                          </View>
                        )}
                        
                        {/* Copy Button */}
                        {shouldShowCopyButton(dep.id) && (
                          <Button
                            variant="outline"
                            onPress={() => {
                              setCopyTargetChildId(dep.id);
                              setShowCopyModal(true);
                            }}
                            icon="content-copy"
                          >
                            Copy from another child
                          </Button>
                        )}
                      </View>
                    )}
                    
                    {/* Collapsed Card Actions */}
                    {!isActive && (
                      <View style={styles.collapsedActions}>
                        {shouldShowCopyButton(dep.id) && (
                          <Button
                            variant="outline"
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              setCopyTargetChildId(dep.id);
                              setShowCopyModal(true);
                            }}
                            icon="content-copy"
                          >
                            Copy from another child
                          </Button>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
        )}
        
        {/* Validation Message */}
        {!allChildrenHaveGuardians && sortedDependents.length > 0 && (
          <View style={styles.validationMessage}>
            <Text style={styles.validationText}>
              Please assign at least one guardian to {childrenWithoutGuardians.map(c => c.firstName).join(', ')} before continuing.
            </Text>
          </View>
        )}
        </ScrollView>
        
        {/* Footer */}
        {sortedDependents.length > 0 && (
          <View style={styles.footer}>
            <Button
              variant="primary"
              onPress={handleContinue}
              disabled={!allChildrenHaveGuardians}
              style={styles.continueButton}
            >
              Continue
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
      
      {/* Copy From Modal */}
      <Dialog
        visible={showCopyModal}
        onDismiss={() => {
          setShowCopyModal(false);
          setCopyTargetChildId(null);
        }}
        title="Copy From"
      >
        <View style={styles.modalContent}>
          {sortedDependents
            .filter(d => d.id !== copyTargetChildId && childHasGuardians(d.id))
            .map(child => {
              const guardianCount = (guardianData[child.id] || []).length;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={styles.copyOption}
                  onPress={() => handleCopyGuardians(child.id)}
                >
                  <View style={styles.copyOptionInfo}>
                    <Text style={styles.copyOptionName}>
                      {child.firstName} {child.lastName}
                    </Text>
                    <Text style={styles.copyOptionMeta}>
                      {guardianCount} guardian{guardianCount !== 1 ? 's' : ''} assigned
                    </Text>
                  </View>
                  <IconButton icon="content-copy" size={20} iconColor={KindlingColors.gold} />
                </TouchableOpacity>
              );
            })}
          
          <Button
            variant="outline"
            onPress={() => {
              setShowCopyModal(false);
              setCopyTargetChildId(null);
            }}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </Dialog>

      {/* Micro celebration – brief checkmark + haptic after completing guardians */}
      <Celebration
        visible={showCelebration}
        variant="micro"
        onComplete={handleCelebrationComplete}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: KindlingColors.background,
    borderBottomWidth: 1,
    borderBottomColor: `${KindlingColors.border}1a`,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
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
  headerRight: {
    width: 48,
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
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    color: KindlingColors.navy,
  },
  emptyText: {
    ...Typography.body,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
  cardContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    paddingTop: 32, // Space for stacked cards peeking from top
  },
  stackedCard: {
    position: 'absolute',
    width: '100%',
    backgroundColor: KindlingColors.gold,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KindlingColors.navy,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  stackedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stackedCardName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  unstackButton: {
    padding: 0,
    margin: 0,
  },
  card: {
    backgroundColor: `${KindlingColors.cream}4d`,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 5,
  },
  cardActive: {
    backgroundColor: `${KindlingColors.cream}4d`,
    zIndex: 5,
  },
  cardHeader: {
    gap: Spacing.xs,
  },
  childName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  guardianStatus: {
    ...Typography.caption,
    color: KindlingColors.brown,
  },
  activeContent: {
    gap: Spacing.md,
  },
  guardianForm: {
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
  },
  formButton: {
    flex: 1,
  },
  guardianList: {
    gap: Spacing.sm,
  },
  guardianListTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  guardianItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.cream}`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${KindlingColors.beige}`,
  },
  guardianInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  guardianName: {
    ...Typography.body,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  guardianMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  levelBadge: {
    backgroundColor: `${KindlingColors.navy}10`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: KindlingColors.navy,
    textTransform: 'capitalize',
  },
  guardianEmail: {
    ...Typography.caption,
    color: KindlingColors.brown,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  collapsedActions: {
    marginTop: Spacing.xs,
  },
  validationMessage: {
    backgroundColor: `${KindlingColors.brown}10`,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${KindlingColors.brown}30`,
  },
  validationText: {
    ...Typography.body,
    color: KindlingColors.brown,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${KindlingColors.navy}1a`,
  },
  continueButton: {
    width: '100%',
  },
  modalContent: {
    gap: Spacing.sm,
  },
  copyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.gold}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${KindlingColors.gold}30`,
  },
  copyOptionInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  copyOptionName: {
    ...Typography.body,
    fontWeight: '600',
    color: KindlingColors.navy,
  },
  copyOptionMeta: {
    ...Typography.caption,
    color: KindlingColors.brown,
  },
  cancelButton: {
    marginTop: Spacing.sm,
  },
});
