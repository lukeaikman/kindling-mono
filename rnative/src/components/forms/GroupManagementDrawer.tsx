/**
 * GroupManagementDrawer Component
 * 
 * Bottom drawer for managing beneficiary groups
 * Allows creating, viewing, and editing groups
 * 
 * @module components/forms/GroupManagementDrawer
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '../ui';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import type { BeneficiaryGroup, BeneficiaryGroupActions } from '../../types';

// Group templates (top 8)
const GROUP_TEMPLATES = [
  { value: 'custom', label: 'Custom Group', name: '', description: '' },
  { value: 'bloodline-children', label: 'Bloodline Children', name: 'Bloodline Children', description: 'Your biological and legally adopted children only' },
  { value: 'all-children', label: 'All Children', name: 'All Children', description: 'All your children including step-children' },
  { value: 'bloodline-grandchildren', label: 'Bloodline Grandchildren', name: 'Bloodline Grandchildren', description: 'All biological and adopted grandchildren at the time of death' },
  { value: 'all-grandchildren', label: 'All Grandchildren', name: 'All Grandchildren', description: 'All grandchildren including step-grandchildren' },
  { value: 'siblings', label: 'Siblings', name: 'Siblings', description: 'Your brothers and sisters' },
  { value: 'nieces-nephews', label: 'Nieces and Nephews', name: 'Nieces and Nephews', description: 'Children of your siblings' },
  { value: 'cousins', label: 'Cousins', name: 'Cousins', description: 'Children of your parents\' siblings' },
];

/**
 * GroupManagementDrawer Props
 */
export interface GroupManagementDrawerProps {
  /**
   * Whether drawer is visible
   */
  visible: boolean;
  
  /**
   * Close handler
   */
  onClose: () => void;
  
  /**
   * Handler when group is selected
   */
  onSelectGroup: (groupId: string, group?: BeneficiaryGroup) => void;
  
  /**
   * Beneficiary group actions
   */
  beneficiaryGroupActions: BeneficiaryGroupActions;
  
  /**
   * Current user/will ID for group ownership
   */
  willId: string;

  /**
   * IDs of groups already added as beneficiaries on the parent form.
   * These appear pre-selected and disabled (can't be deselected).
   */
  alreadySelectedGroupIds?: string[];
}

/**
 * GroupManagementDrawer Component
 * 
 * Bottom drawer for creating and managing beneficiary groups
 * 
 * @example
 * ```tsx
 * <GroupManagementDrawer
 *   visible={showGroupDrawer}
 *   onClose={() => setShowGroupDrawer(false)}
 *   onSelectGroup={(id) => {
 *     handleGroupSelected(id);
 *     setShowGroupDrawer(false);
 *   }}
 *   beneficiaryGroupActions={beneficiaryGroupActions}
 *   willId={userId}
 * />
 * ```
 */
export const GroupManagementDrawer: React.FC<GroupManagementDrawerProps> = ({
  visible,
  onClose,
  onSelectGroup,
  beneficiaryGroupActions,
  willId,
  alreadySelectedGroupIds = [],
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [newSelections, setNewSelections] = useState<string[]>([]);

  const groups = beneficiaryGroupActions.getActiveGroups();
  const hasGroups = groups.length > 0;

  React.useEffect(() => {
    if (!hasGroups && visible) {
      setShowCreateForm(true);
      setTemplateExpanded(true);
    }
  }, [hasGroups, visible]);

  React.useEffect(() => {
    if (visible) {
      setNewSelections([]);
    }
  }, [visible]);

  const handleTemplateChange = (templateValue: string) => {
    setSelectedTemplate(templateValue);
    const template = GROUP_TEMPLATES.find(t => t.value === templateValue);
    if (template) {
      setNewGroupName(template.name);
      setNewGroupDescription(template.description);
    }
    setTemplateExpanded(false);
  };

  const selectedTemplateLabel = GROUP_TEMPLATES.find(t => t.value === selectedTemplate)?.label || 'Choose a Group template...';

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const group = beneficiaryGroupActions.addGroup({
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      isPredefined: false,
      isActive: true,
      willId,
    });

    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedTemplate('');
    setShowCreateForm(false);

    setNewSelections(prev => [...prev, group.id]);
  };

  const handleCancelCreate = () => {
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedTemplate('');
    setShowCreateForm(false);
  };

  const handleUpdateGroup = (groupId: string) => {
    if (!editingDescription.trim()) return;

    beneficiaryGroupActions.updateGroup(groupId, {
      description: editingDescription.trim(),
    });

    setEditingGroupId(null);
    setEditingDescription('');
  };

  const handleStartEdit = (group: BeneficiaryGroup) => {
    setEditingGroupId(group.id);
    setEditingDescription(group.description);
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingDescription('');
  };

  const toggleGroupSelection = (groupId: string) => {
    const isAlreadyOnForm = alreadySelectedGroupIds.includes(groupId);
    if (isAlreadyOnForm) return;

    setNewSelections(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleConfirmSelections = () => {
    for (const groupId of newSelections) {
      const group = beneficiaryGroupActions.getGroupById(groupId);
      onSelectGroup(groupId, group || undefined);
    }
    setNewSelections([]);
    onClose();
  };

  const selectableCount = newSelections.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Beneficiary Groups</Text>
          <TouchableOpacity onPress={onClose}>
            <IconButton icon="close" size={24} iconColor={KindlingColors.navy} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.section}>
            {!hasGroups && (
              <Text style={styles.introText}>
                Beneficiary groups make it easy to leave specific assets, or the residue of an estate to pre-defined groups of people, especially where the group may not be known yet (e.g. all my bloodline grandchildren at the moment of death).
              </Text>
            )}

            {/* Create New Group Form */}
            {showCreateForm && (
              <View style={styles.createForm}>
                <View>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => setTemplateExpanded(!templateExpanded)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionHeaderText}>
                      {selectedTemplateLabel}
                    </Text>
                    <IconButton
                      icon={templateExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      iconColor={KindlingColors.navy}
                      style={styles.accordionIcon}
                    />
                  </TouchableOpacity>

                  {templateExpanded && (
                    <View style={styles.templateList}>
                      {GROUP_TEMPLATES.map((template) => (
                        <TouchableOpacity
                          key={template.value}
                          style={[
                            styles.templateOption,
                            selectedTemplate === template.value && styles.templateOptionSelected
                          ]}
                          onPress={() => handleTemplateChange(template.value)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.templateOptionText,
                            selectedTemplate === template.value && styles.templateOptionTextSelected
                          ]}>
                            {template.label}
                          </Text>
                          {selectedTemplate === template.value && (
                            <IconButton
                              icon="check"
                              size={18}
                              iconColor={KindlingColors.green}
                              style={styles.templateCheckIcon}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {selectedTemplate && (
                  <>
                    <Input
                      label="Group Name *"
                      placeholder="e.g., Children, Godchildren, Siblings"
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                    />
                    <Input
                      label="Description"
                      placeholder="Who is included in this group?"
                      value={newGroupDescription}
                      onChangeText={setNewGroupDescription}
                      multiline
                      numberOfLines={2}
                    />
                    <View style={styles.formActions}>
                      <Button
                        onPress={handleCreateGroup}
                        variant="primary"
                        disabled={!newGroupName.trim()}
                        style={styles.formActionButton}
                      >
                        Create Group
                      </Button>
                      <Button
                        onPress={handleCancelCreate}
                        variant="outline"
                        style={styles.formActionButton}
                      >
                        Cancel
                      </Button>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Existing Groups List */}
            {hasGroups && (
              <View style={styles.groupsList}>
                {groups.map((group) => {
                  const isAlreadyOnForm = alreadySelectedGroupIds.includes(group.id);
                  const isNewlySelected = newSelections.includes(group.id);
                  const isChecked = isAlreadyOnForm || isNewlySelected;

                  return (
                    <View key={group.id} style={styles.groupCard}>
                      <View style={styles.groupRow}>
                        {/* Checkbox */}
                        <TouchableOpacity
                          onPress={() => toggleGroupSelection(group.id)}
                          disabled={isAlreadyOnForm}
                          activeOpacity={0.7}
                          style={styles.checkboxTouchArea}
                        >
                          <View style={[
                            styles.checkboxCircle,
                            isChecked && styles.checkboxCircleSelected,
                            isAlreadyOnForm && styles.checkboxCircleDisabled,
                          ]}>
                            {isChecked && (
                              <IconButton icon="check" size={16} iconColor={KindlingColors.background} style={styles.checkIcon} />
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Group icon + name */}
                        <TouchableOpacity
                          style={styles.groupInfo}
                          onPress={() => !isAlreadyOnForm && toggleGroupSelection(group.id)}
                          disabled={isAlreadyOnForm}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.groupEmoji}>👥</Text>
                          <View style={styles.groupNameBlock}>
                            <Text style={styles.groupName}>
                              {group.name}
                            </Text>
                            {group.description && editingGroupId !== group.id && (
                              <Text style={styles.groupDescription} numberOfLines={1}>
                                {group.description}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Edit icon */}
                        <TouchableOpacity
                          onPress={() => handleStartEdit(group)}
                          style={styles.editButton}
                          activeOpacity={0.7}
                        >
                          <IconButton
                            icon="pencil"
                            size={16}
                            iconColor={KindlingColors.mutedForeground}
                            style={styles.editIcon}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Inline edit form */}
                      {editingGroupId === group.id && (
                        <View style={styles.editForm}>
                          <Input
                            placeholder="Enter group description"
                            value={editingDescription}
                            onChangeText={setEditingDescription}
                            multiline
                            numberOfLines={2}
                          />
                          <View style={styles.editActions}>
                            <Button
                              onPress={() => handleUpdateGroup(group.id)}
                              variant="primary"
                              style={styles.editActionButton}
                            >
                              Save
                            </Button>
                            <Button
                              onPress={handleCancelEdit}
                              variant="outline"
                              style={styles.editActionButton}
                            >
                              Cancel
                            </Button>
                          </View>
                        </View>
                      )}

                      {isAlreadyOnForm && (
                        <Text style={styles.alreadyAddedLabel}>Already added</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Create New Group — estate-dashboard "Add something else" style */}
            {!showCreateForm && (
              <TouchableOpacity
                onPress={() => setShowCreateForm(true)}
                style={styles.createNewButton}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={KindlingColors.green} />
                <Text style={styles.createNewText}>Create New Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Footer with selection count + Select button */}
        {hasGroups && (
          <View style={styles.drawerFooter}>
            <Text style={styles.selectedCount}>
              {selectableCount === 0
                ? 'No new groups selected'
                : `${selectableCount} group${selectableCount === 1 ? '' : 's'} selected`}
            </Text>
            <Button
              onPress={handleConfirmSelections}
              variant="primary"
              disabled={selectableCount === 0}
            >
              Select
            </Button>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  introText: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.brown,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  createNewText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.green,
  },
  createForm: {
    backgroundColor: `${KindlingColors.cream}33`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: KindlingColors.border,
  },
  accordionHeaderText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: KindlingColors.navy,
  },
  accordionIcon: {
    margin: 0,
    padding: 0,
  },
  templateList: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KindlingColors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: KindlingColors.border,
  },
  templateOptionSelected: {
    borderColor: KindlingColors.green,
    backgroundColor: `${KindlingColors.green}15`,
  },
  templateOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
  },
  templateOptionTextSelected: {
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.green,
  },
  templateCheckIcon: {
    margin: 0,
    padding: 0,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formActionButton: {
    flex: 1,
  },
  groupsList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  groupCard: {
    backgroundColor: KindlingColors.background,
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkboxTouchArea: {
    padding: 2,
  },
  checkboxCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: `${KindlingColors.beige}80`,
    backgroundColor: KindlingColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: KindlingColors.green,
    borderColor: KindlingColors.green,
  },
  checkboxCircleDisabled: {
    backgroundColor: KindlingColors.mutedForeground,
    borderColor: KindlingColors.mutedForeground,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupEmoji: {
    fontSize: 16,
  },
  groupNameBlock: {
    flex: 1,
  },
  groupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  groupDescription: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.brown,
    lineHeight: 16,
  },
  editButton: {
    padding: 4,
  },
  editIcon: {
    margin: 0,
    padding: 0,
  },
  editForm: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editActionButton: {
    flex: 1,
  },
  alreadyAddedLabel: {
    fontSize: Typography.fontSize.xs,
    color: KindlingColors.mutedForeground,
    fontStyle: 'italic',
    marginLeft: 38,
    marginTop: 2,
  },
  drawerFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
    gap: Spacing.sm,
  },
  selectedCount: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    textAlign: 'center',
  },
});

