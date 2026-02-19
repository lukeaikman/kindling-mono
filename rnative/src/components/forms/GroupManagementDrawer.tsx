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
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  // Get all active groups
  const groups = beneficiaryGroupActions.getActiveGroups();
  const hasGroups = groups.length > 0;

  // Auto-show form if no groups exist
  React.useEffect(() => {
    if (!hasGroups && visible) {
      setShowCreateForm(true);
      setTemplateExpanded(true); // Auto-expand template selector on first use
    }
  }, [hasGroups, visible]);

  // Handle template selection
  const handleTemplateChange = (templateValue: string) => {
    setSelectedTemplate(templateValue);
    const template = GROUP_TEMPLATES.find(t => t.value === templateValue);
    if (template) {
      setNewGroupName(template.name);
      setNewGroupDescription(template.description);
    }
    setTemplateExpanded(false); // Collapse after selection
  };

  // Get selected template label
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

    // Reset form
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedTemplate('');
    setShowCreateForm(false);

    // Select the newly created group — pass object to avoid stale-closure lookup
    onSelectGroup(group.id, group);
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
            {/* Introduction (when no groups exist) */}
            {!hasGroups && (
              <Text style={styles.introText}>
                Beneficiary groups make it easy to leave specific assets, or the residue of an estate to pre-defined groups of people, especially where the group may not be known yet (e.g. all my bloodline grandchildren at the moment of death).
              </Text>
            )}

            {/* Add New Group Button (when groups exist) */}
            {hasGroups && !showCreateForm && (
              <TouchableOpacity
                onPress={() => setShowCreateForm(true)}
                style={styles.addNewButton}
              >
                <Text style={styles.addNewText}>+ Add New Group</Text>
              </TouchableOpacity>
            )}

            {/* Create New Group Form */}
            {showCreateForm && (
              <View style={styles.createForm}>
                {/* Template Selection - Accordion/Collapsible */}
                <View>
                  {/* Accordion Header */}
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

                  {/* Accordion Content */}
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

                {/* Name and Description (only show when template selected) */}
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
                {groups.map((group) => (
                  <View key={group.id} style={styles.groupCard}>
                    {/* Group Header */}
                    <View style={styles.groupHeader}>
                      <TouchableOpacity
                        style={styles.groupInfo}
                        onPress={() => onSelectGroup(group.id)}
                        activeOpacity={0.7}
                      >
                        <IconButton
                          icon="account-multiple"
                          size={20}
                          iconColor={KindlingColors.navy}
                          style={styles.groupIcon}
                        />
                        <Text style={styles.groupName}>{group.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleStartEdit(group)}
                        style={styles.editButton}
                      >
                        <IconButton
                          icon="pencil"
                          size={18}
                          iconColor={KindlingColors.navy}
                          style={styles.editIcon}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Group Description (always visible) */}
                    {!editingGroupId || editingGroupId !== group.id ? (
                      group.description && (
                        <Text style={styles.groupDescription}>{group.description}</Text>
                      )
                    ) : (
                      /* Edit Mode */
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

                    {/* Select Button */}
                    <Button
                      onPress={() => onSelectGroup(group.id)}
                      variant="outline"
                      style={styles.selectGroupButton}
                    >
                      Select This Group
                    </Button>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  addNewButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  addNewText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
    textDecorationLine: 'underline',
    fontWeight: Typography.fontWeight.semibold,
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
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.beige,
    gap: Spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    margin: 0,
    padding: 0,
    marginRight: -4,
  },
  groupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  editButton: {
    padding: Spacing.xs,
  },
  editIcon: {
    margin: 0,
    padding: 0,
  },
  groupDescription: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.brown,
    lineHeight: 20,
    marginLeft: 28, // Align with group name (icon width)
  },
  editForm: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editActionButton: {
    flex: 1,
  },
  selectGroupButton: {
    marginTop: Spacing.xs,
  },
});

