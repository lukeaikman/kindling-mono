/**
 * Estate Remainder Who Screen
 * 
 * First screen in estate residue flow - select WHO will inherit the residual estate
 * (everything not specifically gifted to others)
 * 
 * Features:
 * - Select people from existing list
 * - Add new people inline
 * - Select predefined beneficiary groups (Children, Grandchildren, etc.)
 * - Create custom categories
 * - Lazy group creation (only creates when selected)
 * 
 * @module app/bequeathal/estate-remainder-who
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconButton } from 'react-native-paper';
import { useAppState } from '../../src/hooks/useAppState';
import { BackButton } from '../../src/components/ui/BackButton';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Checkbox } from '../../src/components/ui/Checkbox';
import { Input } from '../../src/components/ui/Input';
import { PREDEFINED_GROUP_TEMPLATES } from '../../src/constants';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import type { Person } from '../../src/types';

export default function EstateRemainderWhoScreen() {
  const {
    personActions,
    beneficiaryGroupActions,
    estateRemainderActions,
    willActions,
    relationshipActions,
    isAppStateReady,
  } = useAppState();

  // Local state
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load existing selections on mount (safe: runs after hydration gate below)
  useEffect(() => {
    if (!isAppStateReady) return;
    const estateState = estateRemainderActions.getEstateRemainderState();
    setSelectedPeopleIds(estateState.selectedPeopleIds || []);
    setSelectedGroupIds(estateState.selectedGroupIds || []);
  }, [isAppStateReady]);

  if (!isAppStateReady) return null;

  // Get will-maker to exclude from list
  const willMaker = willActions.getUser();

  // Get all people except will-maker
  const allPeople = personActions
    .getPeople()
    .filter((person) => person.id !== willMaker?.id);

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    // Save selections to estate remainder state
    estateRemainderActions.updateSelectedBeneficiaries(
      selectedPeopleIds,
      selectedGroupIds
    );

    // Navigate to split screen
    router.push('/bequeathal/estate-remainder-split');
  };

  const handlePersonToggle = (personId: string) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleGroupToggle = (groupName: string, isPredefined: boolean) => {
    const willId = willActions.getWillData().userId;
    let group = beneficiaryGroupActions.getGroupByName(groupName, willId);

    if (!group) {
      // LAZY CREATE - group doesn't exist yet, create it now
      const template = PREDEFINED_GROUP_TEMPLATES.find(
        (t) => t.name === groupName
      );
      const newGroup = beneficiaryGroupActions.addGroup({
        name: groupName,
        description: template?.description || 'Custom category',
        isPredefined,
        isActive: true,
        willId,
      });
      setSelectedGroupIds((prev) => [...prev, newGroup.id]);
    } else {
      // Toggle existing group
      const newActive = !group.isActive;
      beneficiaryGroupActions.setGroupActive(group.id, newActive);

      if (newActive) {
        setSelectedGroupIds((prev) => [...prev, group.id]);
      } else {
        setSelectedGroupIds((prev) => prev.filter((id) => id !== group.id));
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const willId = willActions.getWillData().userId;
      const newCatGroup = beneficiaryGroupActions.addGroup({
        name: newCategoryName.trim(),
        description: 'Custom category',
        isPredefined: false,
        isActive: true,
        willId,
      });
      setSelectedGroupIds((prev) => [newCatGroup.id, ...prev]);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleRemoveCustomCategory = (groupId: string) => {
    beneficiaryGroupActions.setGroupActive(groupId, false);
    setSelectedGroupIds((prev) => prev.filter((id) => id !== groupId));
  };

  const handleAddNewPerson = () => {
    // TODO: Implement add person dialog (Phase 16)
    alert('Add person functionality to be implemented');
  };

  // Helper functions
  const getPersonFullName = (person: Person) => {
    return `${person.firstName} ${person.lastName}`.trim();
  };

  // Get active custom groups for this will
  const willId = willActions.getWillData().userId;
  const activeCustomGroups = beneficiaryGroupActions
    .getActiveGroups()
    .filter((g) => !g.isPredefined && g.willId === willId);

  const hasSelections =
    selectedPeopleIds.length > 0 || selectedGroupIds.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton onPress={handleBack} />
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <IconButton icon="account-group" size={20} iconColor={KindlingColors.navy} style={{margin: 0}} />
            </View>
            <Text style={styles.title}>The Residue</Text>
          </View>
        </View>

        <View style={styles.explanationContainer}>
          <Text style={styles.explanationText}>
            Everything you don't leave to someone specific gets shared here.
          </Text>
          <Text style={styles.explanationText}>
            Choose the people and groups who'll divide it between them — groups
            like "Grandchildren" automatically include anyone born in the future.
          </Text>

          <View style={styles.separator} />

          <Text style={styles.questionTitle}>
            Who will share The Residue?
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* People Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People</Text>
            <Pressable
              onPress={handleAddNewPerson}
              style={styles.addButton}
            >
              <IconButton icon="plus" size={16} iconColor={KindlingColors.green} style={{margin: 0}} />
              <Text style={styles.addButtonText}>Add Someone</Text>
            </Pressable>
          </View>

          <View style={styles.itemsList}>
            {allPeople.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No people found</Text>
                <Text style={styles.emptySubtext}>
                  Add someone above to get started
                </Text>
              </Card>
            ) : (
              allPeople.map((person) => {
                const isSelected = selectedPeopleIds.includes(person.id);
                return (
                  <Pressable
                    key={person.id}
                    onPress={() => handlePersonToggle(person.id)}
                    style={[
                      styles.personCard,
                      isSelected && styles.personCardSelected,
                    ]}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handlePersonToggle(person.id)}
                    />
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>
                        {getPersonFullName(person)}
                      </Text>
                      <Text style={styles.personRelationship}>
                        {relationshipActions.getDisplayLabel(person.id)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.separator} />

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable
              onPress={() => setIsAddingCategory(!isAddingCategory)}
              style={styles.addButton}
            >
              <IconButton icon="plus" size={16} iconColor={KindlingColors.green} style={{margin: 0}} />
              <Text style={styles.addButtonText}>Add Category</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionDescription}>
            You can add any defined category, from kin to members of a club at
            the date of death to all your ex's cats ... though we wouldn't
            recommend the latter.
          </Text>

          {/* Add Category Form */}
          {isAddingCategory && (
            <Card style={styles.addCategoryCard}>
              <View style={styles.addCategoryForm}>
                <Input
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name (e.g., Godchildren)"
                  style={styles.categoryInput}
                />
                <View style={styles.addCategoryButtons}>
                  <Pressable
                    onPress={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    style={[
                      styles.iconButton,
                      styles.iconButtonPrimary,
                      !newCategoryName.trim() && styles.iconButtonDisabled,
                    ]}
                  >
                    <IconButton icon="check" size={16} iconColor={KindlingColors.background} style={{margin: 0, padding: 0}} />
                  </Pressable>
                  <Pressable
                    onPress={() => setIsAddingCategory(false)}
                    style={[styles.iconButton, styles.iconButtonSecondary]}
                  >
                    <IconButton icon="close" size={16} iconColor={KindlingColors.navy} style={{margin: 0, padding: 0}} />
                  </Pressable>
                </View>
              </View>
            </Card>
          )}

          {/* Custom Categories List */}
          {activeCustomGroups.map((group) => {
            const isSelected = selectedGroupIds.includes(group.id);
            return (
              <Pressable
                key={group.id}
                onPress={() => handleGroupToggle(group.name, false)}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleGroupToggle(group.name, false)}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{group.name}</Text>
                  <Text style={styles.categoryDescription}>
                    {group.description}
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveCustomCategory(group.id);
                  }}
                  style={styles.removeButton}
                >
                  <IconButton icon="close" size={16} iconColor={`${KindlingColors.navy}66`} style={{margin: 0, padding: 0}} />
                </Pressable>
              </Pressable>
            );
          })}

          {/* Predefined Categories */}
          {PREDEFINED_GROUP_TEMPLATES.map((template) => {
            const existingGroup = beneficiaryGroupActions.getGroupByName(
              template.name,
              willId
            );
            const isSelected = existingGroup
              ? selectedGroupIds.includes(existingGroup.id)
              : false;

            return (
              <Pressable
                key={template.name}
                onPress={() => handleGroupToggle(template.name, true)}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleGroupToggle(template.name, true)}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{template.name}</Text>
                  <Text style={styles.categoryDescription}>
                    {template.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleNext}
          disabled={!hasSelections}
          style={[
            styles.nextButton,
            !hasSelections && styles.nextButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.nextButtonText,
              !hasSelections && styles.nextButtonTextDisabled,
            ]}
          >
            Next: Residual Split
          </Text>
        </Pressable>

        {hasSelections && (
          <Text style={styles.footerCount}>
            {selectedPeopleIds.length} people and {selectedGroupIds.length}{' '}
            categories selected
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  explanationContainer: {
    gap: 12,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(30, 58, 95, 0.6)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(30, 58, 95, 0.1)',
    marginVertical: 8,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  sectionDescription: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    marginBottom: 16,
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  itemsList: {
    gap: 12,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  emptyTitle: {
    fontSize: 15,
    color: 'rgba(30, 58, 95, 0.6)',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.4)',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.1)',
    borderRadius: 12,
  },
  personCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  personRelationship: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    textTransform: 'capitalize',
  },
  addCategoryCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderColor: 'rgba(76, 175, 80, 0.2)',
    marginBottom: 12,
  },
  addCategoryForm: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  categoryInput: {
    flex: 1,
  },
  addCategoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  iconButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.2)',
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    height: 48,
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: 'rgba(30, 58, 95, 0.4)',
  },
  footerCount: {
    fontSize: 13,
    color: 'rgba(30, 58, 95, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
});

