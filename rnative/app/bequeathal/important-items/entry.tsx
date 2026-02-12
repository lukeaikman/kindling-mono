/**
 * Important Items Entry Screen
 *
 * Single-asset entry form. Supports add (new) and edit (?id=xxx).
 * Items can be assigned to specific people, groups, or the estate.
 *
 * Navigation:
 * - Back: Category Summary (/bequeathal/important-items/summary)
 * - Save: Category Summary (/bequeathal/important-items/summary)
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, BackButton, Input, CurrencyInput } from '../../../src/components/ui';
import { AddPersonDialog, MultiBeneficiarySelector, BeneficiarySelection, GroupManagementDrawer } from '../../../src/components/forms';
import { useAppState } from '../../../src/hooks/useAppState';
import { useNetWealthToast } from '../../../src/context/NetWealthToastContext';
import { KindlingColors } from '../../../src/styles/theme';
import { Spacing, Typography } from '../../../src/styles/constants';
import { getPersonFullName, getPersonRelationshipDisplay } from '../../../src/utils/helpers';
import type { ImportantItemAsset } from '../../../src/types';

const SUMMARY_ROUTE = '/bequeathal/important-items/summary';

interface ImportantItemForm {
  title: string;
  beneficiaries: BeneficiarySelection[];
  estimatedValue: number;
}

export default function ImportantItemsEntryScreen() {
  const { bequeathalActions, personActions, beneficiaryGroupActions, willActions } = useAppState();
  const toast = useNetWealthToast();
  const params = useLocalSearchParams();
  const editingAssetId = params.id as string | undefined;
  const loadedIdRef = useRef<string | null>(null);

  const [formData, setFormData] = useState<ImportantItemForm>({
    title: '',
    beneficiaries: [],
    estimatedValue: 0,
  });
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  // Get will-maker ID to exclude from beneficiary selection
  const willMaker = willActions.getUser();
  const excludePersonIds = willMaker?.id ? [willMaker.id] : [];

  // Load existing asset when editing
  useEffect(() => {
    if (!editingAssetId) {
      loadedIdRef.current = null;
      return;
    }

    if (loadedIdRef.current === editingAssetId) return;

    const allAssets = bequeathalActions.getAllAssets();
    if (allAssets.length === 0) return;

    const asset = bequeathalActions.getAssetById(editingAssetId);
    if (!asset || asset.type !== 'important-items') {
      router.push(SUMMARY_ROUTE as any);
      return;
    }

    const item = asset as ImportantItemAsset;
    loadedIdRef.current = editingAssetId;

    const beneficiaries: BeneficiarySelection[] = item.beneficiaryAssignments?.beneficiaries.map(b => {
      if (b.type === 'estate') {
        return { id: 'estate', type: 'estate', name: 'The Estate' };
      }
      if (b.type === 'person') {
        const person = personActions.getPersonById(b.id);
        return {
          id: b.id,
          type: 'person',
          name: person ? getPersonFullName(person) : b.name || 'Unknown',
          relationship: person ? getPersonRelationshipDisplay(person) : undefined,
        };
      }
      return { id: b.id, type: b.type, name: b.name || 'Unknown' };
    }) || [];

    setFormData({
      title: item.title,
      beneficiaries,
      estimatedValue: item.estimatedValue || 0,
    });
  }, [editingAssetId, bequeathalActions]);

  const handleBeneficiariesChange = (newBeneficiaries: BeneficiarySelection | BeneficiarySelection[]) => {
    const beneficiariesArray = Array.isArray(newBeneficiaries) ? newBeneficiaries : [newBeneficiaries];
    setFormData(prev => ({ ...prev, beneficiaries: beneficiariesArray }));
  };

  const handleSave = () => {
    if (!formData.title.trim() || formData.beneficiaries.length === 0 || formData.estimatedValue === 0) {
      return;
    }

    const estimatedValue = Math.round(formData.estimatedValue);

    const itemData = {
      title: formData.title.trim(),
      beneficiaryAssignments: {
        beneficiaries: formData.beneficiaries.map(b => ({
          id: b.id,
          type: b.type,
          name: b.name,
        }))
      },
      estimatedValue,
      netValue: estimatedValue,
    };

    if (editingAssetId) {
      bequeathalActions.updateAsset(editingAssetId, itemData);
    } else {
      bequeathalActions.addAsset('important-items', itemData);
    }

    // Compute delta for net wealth toast (avoids reading stale batched state)
    const oldAssetValue = editingAssetId
      ? (bequeathalActions.getAssetById(editingAssetId)?.estimatedValue || 0)
      : 0;
    toast.notifySave(estimatedValue - oldAssetValue);

    router.push(SUMMARY_ROUTE as any);
  };

  const handleBack = () => {
    router.push(SUMMARY_ROUTE as any);
  };

  const canSubmit = formData.title.trim() && formData.beneficiaries.length > 0 && formData.estimatedValue > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Morphic Background */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.morphicBlob, styles.blob1]} />
        <View style={[styles.morphicBlob, styles.blob2]} />
        <View style={[styles.morphicBlob, styles.blob3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton icon="diamond" size={20} iconColor={KindlingColors.navy} />
          </View>
          <Text style={styles.headerTitle}>
            {editingAssetId ? 'Edit Item' : 'Add Item'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingAssetId ? 'Update the details below.' : 'Add a valuable or sentimental item.'}
            </Text>

            <Input
              label="What's the item?"
              placeholder="e.g., Wedding ring, Painting, Car"
              value={formData.title}
              onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
            />

            {/* Beneficiary Selector */}
            <MultiBeneficiarySelector
              mode="multi"
              value={formData.beneficiaries}
              onChange={handleBeneficiariesChange}
              allowEstate={true}
              allowGroups={true}
              excludePersonIds={excludePersonIds}
              label="Who will receive this? *"
              placeholder="Select recipient(s)"
              personActions={personActions}
              beneficiaryGroupActions={beneficiaryGroupActions}
              onAddNewPerson={() => setShowAddPersonDialog(true)}
              onAddNewGroup={() => setShowGroupDrawer(true)}
            />

            <CurrencyInput
              label="What's it worth?"
              placeholder="0"
              value={formData.estimatedValue}
              onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedValue: value }))}
            />

            <Button
              onPress={handleSave}
              variant="primary"
              disabled={!canSubmit}
            >
              {editingAssetId ? 'Save changes' : 'Add this item'}
            </Button>
          </View>
        </View>
      </ScrollView>

      <AddPersonDialog
        visible={showAddPersonDialog}
        onDismiss={() => setShowAddPersonDialog(false)}
        personActions={personActions}
        roles={['beneficiary']}
        onCreated={(personId) => {
          const person = personActions.getPersonById(personId);
          if (!person) return;
          const relationship = getPersonRelationshipDisplay(person);
          const selection: BeneficiarySelection = {
            id: person.id,
            type: 'person',
            name: getPersonFullName(person),
            relationship: relationship || undefined,
          };
          setFormData(prev => ({
            ...prev,
            beneficiaries: [...prev.beneficiaries, selection]
          }));
        }}
      />

      {/* Group Management Drawer */}
      <GroupManagementDrawer
        visible={showGroupDrawer}
        onClose={() => setShowGroupDrawer(false)}
        onSelectGroup={(groupId) => {
          const group = beneficiaryGroupActions.getGroupById(groupId);
          if (group) {
            const groupSelection: BeneficiarySelection = {
              id: group.id,
              type: 'group',
              name: group.name,
            };
            setFormData(prev => ({
              ...prev,
              beneficiaries: [...prev.beneficiaries, groupSelection]
            }));
          }
          setShowGroupDrawer(false);
        }}
        beneficiaryGroupActions={beneficiaryGroupActions}
        willId={willActions.getUser()?.id || 'default-user'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  backgroundContainer: {
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
  blob1: {
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.navy,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  blob2: {
    top: '33%',
    left: -64,
    width: 256,
    height: 192,
    backgroundColor: KindlingColors.brown,
    borderRadius: 128,
    transform: [{ rotate: '25deg' }],
  },
  blob3: {
    bottom: -64,
    left: '25%',
    width: 192,
    height: 160,
    backgroundColor: KindlingColors.beige,
    borderRadius: 96,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: `${KindlingColors.cream}33`,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: KindlingColors.cream,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
});
