/**
 * Unified Invitations Confirm Screen
 *
 * Final step of the "Your People" stage. Displays all executors and
 * guardians in a human-readable sentence format and lets the user
 * send invitations with a single tap.
 *
 * On send: marks all executors + guardians as invited, plays full
 * confetti celebration, then navigates back to the dashboard.
 *
 * @module app/invitations/confirm
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';
import { Celebration } from '../../src/components/ui/Celebration';
import { useAppState } from '../../src/hooks/useAppState';
import { hasChildrenUnder18 } from '../../src/utils/willProgress';
import { KindlingColors } from '../../src/styles/theme';
import { Spacing, Typography } from '../../src/styles/constants';
import type { Person, ExecutorRole } from '../../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Display-friendly executor role label */
function executorRoleLabel(role: ExecutorRole | undefined): string {
  switch (role) {
    case 'primary':
      return 'Primary Executor';
    case 'co-primary':
      return 'Co-Primary Executor';
    case 'secondary':
      return 'Secondary Executor';
    case 'co-secondary':
      return 'Co-Secondary Executor';
    case 'tertiary':
      return 'Tertiary Executor';
    case 'co-tertiary':
      return 'Co-Tertiary Executor';
    case 'quaternary':
      return 'Quaternary Executor';
    default:
      return 'Executor';
  }
}

/** Build human-readable invitation lines */
function buildInvitationLines(
  people: Person[],
  guardianship: Record<string, Array<{ guardian: string; level: number }>>,
): { executorLines: string[]; guardianLines: string[] } {
  // --- Executors ---
  const executors = people
    .filter((p) => p.roles?.includes('executor'))
    .sort((a, b) => (a.executorRole ?? '').localeCompare(b.executorRole ?? ''));

  const executorLines = executors.map((ex) => {
    const name = ex.firstName || 'Someone';
    const role = executorRoleLabel(ex.executorRole);
    return `${name} will be asked to be your ${role}`;
  });

  // --- Guardians ---
  // Invert the child→guardian map to guardian→children[]
  const guardianToChildren = new Map<string, string[]>();

  for (const [childId, assignments] of Object.entries(guardianship)) {
    const child = people.find((p) => p.id === childId);
    if (!child) continue;
    const childName = child.firstName || 'a child';

    for (const a of assignments) {
      const existing = guardianToChildren.get(a.guardian) ?? [];
      existing.push(childName);
      guardianToChildren.set(a.guardian, existing);
    }
  }

  const guardianLines: string[] = [];
  guardianToChildren.forEach((childNames, guardianId) => {
    const guardian = people.find((p) => p.id === guardianId);
    if (!guardian) return;
    const gName = guardian.firstName || 'Someone';
    const childList = childNames.join(', ');
    guardianLines.push(`${gName} will be asked to be Guardian for ${childList}`);
  });

  return { executorLines, guardianLines };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InvitationsConfirmScreen() {
  const { personActions, willActions } = useAppState();
  const [showCelebration, setShowCelebration] = useState(false);
  const [sending, setSending] = useState(false);

  const people = personActions.getPeople();
  const willData = willActions.getWillData();
  const childrenExist = hasChildrenUnder18(people);

  const { executorLines, guardianLines } = useMemo(
    () => buildInvitationLines(people, willData.guardianship || {}),
    [people, willData.guardianship],
  );

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    router.push('/will-dashboard' as any);
  }, []);

  const handleSend = useCallback(() => {
    if (sending) return;
    setSending(true);

    // Mark all executors and guardians as invited
    personActions.sendExecutorInvitations();
    if (childrenExist) {
      personActions.sendGuardianInvitations();
    }

    // Trigger full celebration
    setShowCelebration(true);
  }, [sending, personActions, childrenExist]);

  const allLines = [...guardianLines, ...executorLines];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Ready to ask them?</Text>

        {/* Invitation lines */}
        <View style={styles.linesContainer}>
          {allLines.map((line, idx) => (
            <View key={idx} style={styles.lineRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.lineText}>{line}</Text>
            </View>
          ))}
        </View>

        {/* Subtext */}
        <Text style={styles.subtext}>
          Once they accept the honour, they'll be asked for some basic
          information so we're ready for signing.
        </Text>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button onPress={handleSend} disabled={sending || allLines.length === 0}>
          {sending ? 'Sending…' : 'Send Invitations'}
        </Button>
      </View>

      {/* Full confetti celebration */}
      <Celebration
        visible={showCelebration}
        variant="full"
        onComplete={handleCelebrationComplete}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.xl,
  },
  linesContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: Spacing.md,
  },
  bullet: {
    fontSize: Typography.fontSize.lg,
    color: KindlingColors.green,
    marginRight: Spacing.sm,
    lineHeight: Typography.fontSize.lg * 1.5,
  },
  lineText: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    lineHeight: Typography.fontSize.lg * 1.5,
  },
  subtext: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.grey,
    lineHeight: Typography.fontSize.md * 1.6,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KindlingColors.divider,
  },
});
