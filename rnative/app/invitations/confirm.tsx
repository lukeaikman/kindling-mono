/**
 * Unified Invitations Confirm Screen
 *
 * The emotional climax of "Your People" — the user sees everyone they've
 * chosen, grouped by role, in a warm, human layout. One tap to ask them all.
 *
 * On send: marks all executors + guardians as invited, plays full
 * confetti celebration, then navigates back to the dashboard.
 *
 * @module app/invitations/confirm
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
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

interface InvitationCard {
  name: string;
  role: string;
}

/** Build structured invitation data for guardians and executors */
function buildInvitationCards(
  people: Person[],
  guardianship: Record<string, Array<{ guardian: string; level: number }>>,
): { executorCards: InvitationCard[]; guardianCards: InvitationCard[] } {
  // --- Executors ---
  const executors = people
    .filter((p) => p.roles?.includes('executor'))
    .sort((a, b) => (a.executorRole ?? '').localeCompare(b.executorRole ?? ''));

  const executorCards: InvitationCard[] = executors.map((ex) => ({
    name: ex.firstName || 'Someone',
    role: executorRoleLabel(ex.executorRole),
  }));

  // --- Guardians ---
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

  const guardianCards: InvitationCard[] = [];
  guardianToChildren.forEach((childNames, guardianId) => {
    const guardian = people.find((p) => p.id === guardianId);
    if (!guardian) return;
    guardianCards.push({
      name: guardian.firstName || 'Someone',
      role: `Guardian for ${childNames.join(', ')}`,
    });
  });

  return { executorCards, guardianCards };
}

// ---------------------------------------------------------------------------
// Person card
// ---------------------------------------------------------------------------

const PersonCard: React.FC<{ name: string; role: string }> = ({ name, role }) => (
  <View style={styles.personCard}>
    <View style={styles.personAvatar}>
      <Text style={styles.personInitial}>{name.charAt(0).toUpperCase()}</Text>
    </View>
    <View style={styles.personInfo}>
      <Text style={styles.personName}>{name}</Text>
      <Text style={styles.personRole}>{role}</Text>
    </View>
  </View>
);

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

  const { executorCards, guardianCards } = useMemo(
    () => buildInvitationCards(people, willData.guardianship || {}),
    [people, willData.guardianship],
  );

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    router.push('/will-dashboard' as any);
  }, []);

  const handleSend = useCallback(() => {
    if (sending) return;
    setSending(true);

    personActions.sendExecutorInvitations();
    if (childrenExist) {
      personActions.sendGuardianInvitations();
    }

    setShowCelebration(true);
  }, [sending, personActions, childrenExist]);

  const hasCards = executorCards.length > 0 || guardianCards.length > 0;

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
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <IconButton
              icon="email-send-outline"
              size={20}
              iconColor={KindlingColors.navy}
              style={{ margin: 0 }}
            />
          </View>
          <Text style={styles.headerTitle}>Invitations</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Ready to ask them?</Text>

        {/* Guardian section */}
        {guardianCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Guardians</Text>
            <View style={styles.cardList}>
              {guardianCards.map((card, idx) => (
                <PersonCard key={`g-${idx}`} name={card.name} role={card.role} />
              ))}
            </View>
          </View>
        )}

        {/* Executor section */}
        {executorCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Executors</Text>
            <View style={styles.cardList}>
              {executorCards.map((card, idx) => (
                <PersonCard key={`e-${idx}`} name={card.name} role={card.role} />
              ))}
            </View>
          </View>
        )}

        {/* Subtext */}
        <Text style={styles.subtext}>
          Once they accept the honour, they'll be asked for some basic
          information so we're ready for signing.
        </Text>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button onPress={handleSend} disabled={sending || !hasCards}>
          {sending ? 'Sending…' : 'Ask Them'}
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
    opacity: 0.15,
  },
  morphicBlob1: {
    top: -100,
    right: -100,
    width: 320,
    height: 320,
    backgroundColor: KindlingColors.green,
    borderRadius: 160,
    transform: [{ rotate: '-15deg' }],
  },
  morphicBlob2: {
    bottom: -60,
    left: -100,
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
    borderBottomWidth: 0.5,
    borderBottomColor: KindlingColors.cream,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  headerRight: {
    width: 40,
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
    fontWeight: Typography.fontWeight.medium,
    color: KindlingColors.navy,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: KindlingColors.navy,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  cardList: {
    gap: Spacing.sm,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${KindlingColors.background}`,
    borderWidth: 1,
    borderColor: `${KindlingColors.navy}10`,
    borderRadius: 12,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${KindlingColors.navy}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    marginBottom: 2,
  },
  personRole: {
    fontSize: Typography.fontSize.sm,
    color: KindlingColors.mutedForeground,
  },
  subtext: {
    fontSize: Typography.fontSize.md,
    color: KindlingColors.grey,
    lineHeight: Typography.fontSize.md * 1.5,
    marginTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: KindlingColors.cream,
  },
});
