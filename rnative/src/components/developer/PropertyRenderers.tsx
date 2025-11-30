/**
 * Property Renderers for Developer Data Explorer
 * 
 * Components for displaying complex data types in readable format
 * 
 * @module components/developer/PropertyRenderers
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';
import { getDisplayRoleLabel } from '../../utils/executorHelpers';
import { PersonActions } from '../../types';

interface ExecutorListRendererProps {
  executors: Array<{ executor: string; level: number }>;
  personActions: PersonActions;
}

/**
 * Render executors array with level labels
 */
export const ExecutorListRenderer: React.FC<ExecutorListRendererProps> = ({
  executors,
  personActions,
}) => {
  if (!executors || executors.length === 0) {
    return <Text style={styles.emptyText}>No executors assigned</Text>;
  }

  const sortedExecutors = [...executors].sort((a, b) => a.level - b.level);

  return (
    <View style={styles.listContainer}>
      {sortedExecutors.map((exec, idx) => {
        const person = personActions.getPersonById(exec.executor);
        const name = person ? `${person.firstName} ${person.lastName}` : exec.executor.slice(0, 8);
        const levelLabel = getDisplayRoleLabel(exec.level, executors);

        return (
          <View key={idx} style={styles.listItem}>
            <Text style={styles.levelLabel}>{levelLabel}:</Text>
            <Text style={styles.itemValue}>{name}</Text>
          </View>
        );
      })}
    </View>
  );
};

interface GuardianshipHierarchyRendererProps {
  guardianship: { [childId: string]: Array<{ guardian: string; level: number }> };
  personActions: PersonActions;
}

/**
 * Render guardianship hierarchy organized by child
 */
export const GuardianshipHierarchyRenderer: React.FC<GuardianshipHierarchyRendererProps> = ({
  guardianship,
  personActions,
}) => {
  if (!guardianship || Object.keys(guardianship).length === 0) {
    return <Text style={styles.emptyText}>No guardian assignments</Text>;
  }

  return (
    <View style={styles.hierarchyContainer}>
      {Object.entries(guardianship).map(([childId, guardians]) => {
        const child = personActions.getPersonById(childId);
        const childName = child ? `${child.firstName} ${child.lastName}` : childId.slice(0, 8);
        const guardiansList = Array.isArray(guardians) ? guardians : [];

        return (
          <View key={childId} style={styles.childCard}>
            <Text style={styles.childName}>{childName}</Text>
            {guardiansList.length === 0 ? (
              <Text style={styles.emptyText}>No guardians assigned</Text>
            ) : (
              <View style={styles.guardiansList}>
                {guardiansList
                  .sort((a, b) => a.level - b.level)
                  .map((g, idx) => {
                    const guardian = personActions.getPersonById(g.guardian);
                    const guardianName = guardian 
                      ? `${guardian.firstName} ${guardian.lastName}` 
                      : g.guardian.slice(0, 8);
                    const levelLabel = getDisplayRoleLabel(g.level, guardiansList);

                    return (
                      <View key={idx} style={styles.listItem}>
                        <Text style={styles.levelLabel}>{levelLabel}:</Text>
                        <Text style={styles.itemValue}>{guardianName}</Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

interface RelationshipEdgeRendererProps {
  edge: {
    id: string;
    aId: string;
    bId: string;
    type: string;
    phase?: string;
  };
  personActions: PersonActions;
}

/**
 * Render relationship edge with person names
 */
export const RelationshipEdgeRenderer: React.FC<RelationshipEdgeRendererProps> = ({
  edge,
  personActions,
}) => {
  const personA = personActions.getPersonById(edge.aId);
  const personB = personActions.getPersonById(edge.bId);
  
  const nameA = personA ? `${personA.firstName} ${personA.lastName}` : edge.aId.slice(0, 8);
  const nameB = personB ? `${personB.firstName} ${personB.lastName}` : edge.bId.slice(0, 8);

  return (
    <View style={styles.relationshipContainer}>
      <Text style={styles.relationshipText}>
        {nameA} ↔ {nameB}
      </Text>
      <Text style={styles.relationshipType}>({edge.type})</Text>
      {edge.phase && (
        <Text style={styles.relationshipPhase}>Phase: {edge.phase}</Text>
      )}
    </View>
  );
};

interface AlignmentStatusRendererProps {
  alignment: { [childId: string]: { alignedUser: string; status: string } };
  personActions: PersonActions;
}

/**
 * Render alignment status with colored badges
 */
export const AlignmentStatusRenderer: React.FC<AlignmentStatusRendererProps> = ({
  alignment,
  personActions,
}) => {
  if (!alignment || Object.keys(alignment).length === 0) {
    return <Text style={styles.emptyText}>No alignment records</Text>;
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return styles.statusAccepted;
      case 'pending':
        return styles.statusPending;
      case 'declined':
        return styles.statusDeclined;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <View style={styles.alignmentContainer}>
      {Object.entries(alignment).map(([childId, info]) => {
        const child = personActions.getPersonById(childId);
        const childName = child ? `${child.firstName} ${child.lastName}` : childId.slice(0, 8);
        
        const alignedUser = personActions.getPersonById(info.alignedUser);
        const alignedUserName = alignedUser 
          ? `${alignedUser.firstName} ${alignedUser.lastName}` 
          : info.alignedUser.slice(0, 8);

        return (
          <View key={childId} style={styles.alignmentCard}>
            <View style={styles.alignmentInfo}>
              <Text style={styles.alignmentChild}>{childName}</Text>
              <Text style={styles.alignmentWith}>Aligned with: {alignedUserName}</Text>
            </View>
            <View style={[styles.statusBadge, getStatusStyle(info.status)]}>
              <Text style={styles.statusText}>{info.status}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  levelLabel: {
    width: 100,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: `${KindlingColors.navy}99`,
  },
  itemValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: `${KindlingColors.navy}66`,
    fontStyle: 'italic',
  },
  hierarchyContainer: {
    gap: Spacing.md,
  },
  childCard: {
    backgroundColor: `${KindlingColors.cream}80`,
    borderRadius: 8,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  childName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  guardiansList: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  relationshipContainer: {
    gap: Spacing.xs,
  },
  relationshipText: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.navy,
  },
  relationshipType: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
  },
  relationshipPhase: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}66`,
  },
  alignmentContainer: {
    gap: Spacing.sm,
  },
  alignmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${KindlingColors.cream}80`,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  alignmentInfo: {
    flex: 1,
  },
  alignmentChild: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  alignmentWith: {
    fontSize: Typography.fontSize.xs,
    color: `${KindlingColors.navy}99`,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusDeclined: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
});


