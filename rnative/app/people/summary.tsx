/**
 * People Summary Screen
 *
 * The "home base" for the completed Your People stage. Shows everything
 * the user chose — guardians, residue recipients, executors, invitation
 * status — as warm, readable sentences with edit affordances.
 *
 * Reached when all Your People sub-flows are complete. Tapping a stage
 * card on the dashboard or pressing Continue routes here instead of
 * bouncing back to the dashboard.
 *
 * @module app/people/summary
 */

import React, { useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { SummaryCard } from '../../src/components/ui/SummaryCard';
import { useAppState } from '../../src/hooks/useAppState';
import {
  hasChildrenUnder18,
  haveExecutorsAccepted,
  haveGuardiansAccepted,
  getPeopleSummaryCTA,
  deriveYourPeopleStatus,
  type WillProgressState,
} from '../../src/utils/willProgress';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import type { Person, ExecutorRole } from '../../src/types';

// ---------------------------------------------------------------------------
// Sentence builders
// ---------------------------------------------------------------------------

function executorRoleShort(role: ExecutorRole | undefined): string {
  switch (role) {
    case 'primary':
      return 'Primary';
    case 'co-primary':
      return 'Co-Primary';
    case 'secondary':
      return 'Secondary';
    case 'co-secondary':
      return 'Co-Secondary';
    case 'tertiary':
      return 'Tertiary';
    case 'co-tertiary':
      return 'Co-Tertiary';
    case 'quaternary':
      return 'Quaternary';
    default:
      return '';
  }
}

/** Join names with commas and "and" for the last one */
function naturalJoin(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/** Build guardian sentences: "Dec is looked after by John and Anna." */
function buildGuardianSentences(
  people: Person[],
  guardianship: Record<string, Array<{ guardian: string; level: number }>>,
): string[] {
  // Group children by their guardian set (so children with identical guardians combine)
  const guardianKeyToChildren = new Map<string, string[]>();
  const guardianKeyToNames = new Map<string, string[]>();

  for (const [childId, assignments] of Object.entries(guardianship)) {
    const child = people.find((p) => p.id === childId);
    if (!child || assignments.length === 0) continue;

    const guardianIds = assignments
      .sort((a, b) => a.level - b.level)
      .map((a) => a.guardian);
    const key = guardianIds.join(',');

    const existing = guardianKeyToChildren.get(key) ?? [];
    existing.push(child.firstName || 'a child');
    guardianKeyToChildren.set(key, existing);

    if (!guardianKeyToNames.has(key)) {
      const guardianNames = guardianIds.map((gid) => {
        const g = people.find((p) => p.id === gid);
        return g?.firstName || 'Someone';
      });
      guardianKeyToNames.set(key, guardianNames);
    }
  }

  const sentences: string[] = [];
  guardianKeyToChildren.forEach((childNames, key) => {
    const guardianNames = guardianKeyToNames.get(key) ?? [];
    const children = naturalJoin(childNames);
    const guardians = naturalJoin(guardianNames);
    const verb = childNames.length === 1 ? 'is' : 'are';
    sentences.push(`${children} ${verb} looked after by ${guardians}.`);
  });

  return sentences;
}

/** Build residue sentences: "Dawn, Heidi, and David will share everything else." */
function buildResidueSentences(
  people: Person[],
  selectedPeopleIds: string[],
  selectedGroupIds: string[],
  splits: Record<string, number>,
  getGroupById: (id: string) => { name: string } | undefined,
): { sentences: string[]; details: string[] } {
  const names: string[] = [];
  const detailLines: string[] = [];

  // People
  for (const pid of selectedPeopleIds) {
    const person = people.find((p) => p.id === pid);
    if (!person) continue;
    const name = person.firstName || 'Someone';
    names.push(name);
    const pct = splits[`person-${pid}`];
    if (pct !== undefined) {
      detailLines.push(`${name}: ${pct % 1 === 0 ? pct : pct.toFixed(1)}%`);
    }
  }

  // Groups
  for (const gid of selectedGroupIds) {
    const group = getGroupById(gid);
    if (!group) continue;
    names.push(group.name);
    const pct = splits[`group-${gid}`];
    if (pct !== undefined) {
      detailLines.push(`${group.name}: ${pct % 1 === 0 ? pct : pct.toFixed(1)}%`);
    }
  }

  if (names.length === 0) {
    return { sentences: ['No one selected yet.'], details: [] };
  }

  const allEqual =
    detailLines.length > 1 &&
    new Set(Object.values(splits).map((v) => Math.round(v * 10))).size === 1;

  const sentence = `${naturalJoin(names)} will share everything else.`;

  return {
    sentences: [sentence],
    details: allEqual ? ['Split equally'] : detailLines,
  };
}

/** Build executor sentences: "Kate and Hank will carry out your wishes." */
function buildExecutorSentences(people: Person[]): { sentences: string[]; details: string[] } {
  const executors = people
    .filter((p) => p.roles?.includes('executor'))
    .sort((a, b) => (a.executorRole ?? '').localeCompare(b.executorRole ?? ''));

  if (executors.length === 0) {
    return { sentences: ['No executors selected yet.'], details: [] };
  }

  const names = executors.map((e) => e.firstName || 'Someone');
  const sentence = `${naturalJoin(names)} will carry out your wishes.`;

  const details = executors
    .map((e) => {
      const role = executorRoleShort(e.executorRole);
      return role ? `${e.firstName || 'Someone'} — ${role}` : null;
    })
    .filter(Boolean) as string[];

  return { sentences: [sentence], details };
}

/** Build invitation status sentence */
function buildInvitationSentence(
  people: Person[],
  willData: { guardianship?: Record<string, Array<{ guardian: string; level: number }>> },
): string {
  const executors = people.filter((p) => p.roles?.includes('executor'));
  const allExecsAccepted = executors.length > 0 && executors.every((e) => e.executorStatus === 'accepted');

  const children = people.filter((p) => p.isUnder18 === true);
  let allGuardiansAccepted = true;
  if (children.length > 0) {
    for (const child of children) {
      const assignments = willData.guardianship?.[child.id] ?? [];
      for (const a of assignments) {
        const guardian = people.find((p) => p.id === a.guardian);
        if (!guardian || guardian.guardianDetails?.hasAccepted !== true) {
          allGuardiansAccepted = false;
          break;
        }
      }
      if (!allGuardiansAccepted) break;
    }
  }

  if (allExecsAccepted && allGuardiansAccepted) {
    return 'Everyone has accepted.';
  }

  return 'All invitations sent. Waiting for responses.';
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PeopleSummaryScreen() {
  const {
    willActions,
    personActions,
    estateRemainderActions,
    beneficiaryGroupActions,
  } = useAppState();

  const people = personActions.getPeople();
  const willData = willActions.getWillData();
  const estateState = estateRemainderActions.getEstateRemainderState();
  const childrenExist = hasChildrenUnder18(people);

  const progressState: WillProgressState = useMemo(
    () => ({
      willMaker: willActions.getUser(),
      people,
      willData,
      estateRemainderState: estateState,
    }),
    [willActions, people, willData, estateState],
  );

  // Context-aware CTA: forward to next stage, regression fix, or review & sign
  const cta = useMemo(() => getPeopleSummaryCTA(progressState), [progressState]);
  const peopleStatus = useMemo(() => deriveYourPeopleStatus(progressState), [progressState]);

  // Guardian sentences
  const guardianSentences = useMemo(
    () => (childrenExist ? buildGuardianSentences(people, willData.guardianship || {}) : []),
    [people, willData.guardianship, childrenExist],
  );

  // Residue sentences
  const { sentences: residueSentences, details: residueDetails } = useMemo(
    () =>
      buildResidueSentences(
        people,
        estateState.selectedPeopleIds || [],
        estateState.selectedGroupIds || [],
        estateState.splits || {},
        beneficiaryGroupActions.getGroupById,
      ),
    [people, estateState, beneficiaryGroupActions],
  );

  // Executor sentences
  const { sentences: executorSentences, details: executorDetails } = useMemo(
    () => buildExecutorSentences(people),
    [people],
  );

  // Invitation sentence
  const invitationSentence = useMemo(
    () => buildInvitationSentence(people, willData),
    [people, willData],
  );

  // Navigation
  const handleContinue = useCallback(() => {
    console.log('[PeopleSummary] CTA pressed →', cta.route, '(isForward:', cta.isForward, ')');
    router.push(cta.route as any);
  }, [cta]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Subtle morphic background */}
      <View style={styles.backgroundOverlay} pointerEvents="none">
        <View style={[styles.morphicBlob, styles.morphicBlob1]} />
        <View style={[styles.morphicBlob, styles.morphicBlob2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Your People</Text>
          <Text style={styles.subtitle}>
            {peopleStatus === 'Complete'
              ? "Everyone's in place."
              : 'Almost there — one thing needs your attention.'}
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {/* Guardians — only if children exist */}
          {childrenExist && guardianSentences.length > 0 && (
            <SummaryCard
              icon="heart-outline"
              title="Guardians"
              sentences={guardianSentences}
              onEdit={() => router.push('/guardianship/wishes' as any)}
            />
          )}

          {/* Residue */}
          <SummaryCard
            icon="account-group-outline"
            title="The Residue"
            sentences={residueSentences}
            details={residueDetails}
            onEdit={() => router.push('/bequeathal/estate-remainder-who' as any)}
          />

          {/* Executors */}
          <SummaryCard
            icon="briefcase-outline"
            title="Executors"
            sentences={executorSentences}
            details={executorDetails}
            onEdit={() => router.push('/executors/selection' as any)}
          />

          {/* Invitations — informational, no edit */}
          <SummaryCard
            icon="email-check-outline"
            title="Invitations"
            sentences={[invitationSentence]}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button variant="primary" onPress={handleContinue}>
          {cta.label}
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    opacity: 0.12,
  },
  morphicBlob1: {
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    backgroundColor: KindlingColors.green,
    borderRadius: 150,
    transform: [{ rotate: '-20deg' }],
  },
  morphicBlob2: {
    bottom: -80,
    left: -100,
    width: 260,
    height: 260,
    backgroundColor: KindlingColors.navy,
    borderRadius: 130,
    transform: [{ rotate: '30deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  titleBlock: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.mutedForeground,
  },
  cardsContainer: {
    gap: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: KindlingColors.cream,
  },
});
