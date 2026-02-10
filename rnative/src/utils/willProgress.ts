/**
 * Will Progress Utilities
 *
 * Pure functions for deriving stage status and determining navigation
 * routes from current app state. No side effects – read-only derivation.
 *
 * @module utils/willProgress
 *
 * TEST CASES – deriveYourPeopleStatus():
 *
 *   1. Empty state (no will-maker) → 'Not started'
 *   2. Only personal details filled → 'In progress'
 *   3. All complete, no children → 'Complete' (guardians skipped)
 *   4. All complete, has children, no guardians → 'In progress'
 *   5. All complete, has children, guardians set, invitations sent → 'Complete'
 *
 * TEST CASES – getNextYourPeopleRoute():
 *
 *   1. Has children, no guardians → '/guardianship/intro'
 *   2. Guardians done, no residue → '/bequeathal/estate-remainder-who'
 *   3. Residue done, no executors selected → '/executors/intro'
 *   4. Executors selected, invitations not sent → '/invitations/confirm'
 *   5. All complete → '/will-dashboard'
 *   6. No children, no residue → '/bequeathal/estate-remainder-who' (skip guardians)
 */

import { Person, WillData, EstateRemainderState } from '../types';
import type { StageStatus } from '../components/ui/StageCard';

export type { StageStatus };

/** Minimal slice of app state needed by these utilities */
export interface WillProgressState {
  willMaker: Person | undefined;
  people: Person[];
  willData: WillData;
  estateRemainderState: EstateRemainderState;
}

// ---------------------------------------------------------------------------
// Low-level checks
// ---------------------------------------------------------------------------

/** Will-maker has firstName, lastName, dateOfBirth, and a valid address */
export function hasFullUserDetails(willMaker: Person | undefined): boolean {
  if (!willMaker) return false;
  return !!(
    willMaker.firstName?.trim() &&
    willMaker.lastName?.trim() &&
    willMaker.dateOfBirth &&
    willMaker.address?.address1?.trim() &&
    willMaker.address?.city?.trim() &&
    willMaker.address?.postcode?.trim()
  );
}

/** At least one family member was captured during onboarding */
export function hasOnboardingData(people: Person[]): boolean {
  return people.some((p) => p.createdInOnboarding === true);
}

/** True when there are children under 18 in the person list */
export function hasChildrenUnder18(people: Person[]): boolean {
  return people.some((p) => p.isUnder18 === true);
}

/** Every child under 18 has at least one guardian assigned */
export function areGuardiansNominated(
  people: Person[],
  willData: WillData,
): boolean {
  const children = people.filter((p) => p.isUnder18 === true);
  if (children.length === 0) return true; // No children → nothing to nominate

  return children.every((child) => {
    const assigned = willData.guardianship?.[child.id];
    return assigned && assigned.length > 0;
  });
}

/**
 * Residue has been allocated: at least one person or group selected
 * AND splits have been configured.
 */
export function isResidueAllocated(state: EstateRemainderState): boolean {
  const hasSelections =
    (state.selectedPeopleIds?.length ?? 0) > 0 ||
    (state.selectedGroupIds?.length ?? 0) > 0;
  const hasSplits = Object.keys(state.splits ?? {}).length > 0;
  return hasSelections && hasSplits;
}

/** At least one executor exists (selected but not necessarily invited) */
export function areExecutorsSelected(people: Person[]): boolean {
  return people.some((p) => p.roles?.includes('executor'));
}

/**
 * All executors AND guardians have been invited (invitedAt set).
 * This is the final gate for "Your People" stage completion.
 */
export function areInvitationsSent(
  people: Person[],
  willData: WillData,
): boolean {
  // Check executors
  const executors = people.filter((p) => p.roles?.includes('executor'));
  if (executors.length === 0) return false;
  if (!executors.every((e) => !!e.invitedAt)) return false;

  // Check guardians (if children exist)
  const children = people.filter((p) => p.isUnder18 === true);
  if (children.length > 0) {
    const guardianIds = new Set<string>();
    for (const child of children) {
      const assignments = willData.guardianship?.[child.id] ?? [];
      for (const a of assignments) {
        guardianIds.add(a.guardian);
      }
    }
    for (const gid of guardianIds) {
      const guardian = people.find((p) => p.id === gid);
      if (!guardian?.guardianDetails?.invitedAt) return false;
    }
  }

  return true;
}

/**
 * @deprecated Use areExecutorsSelected + areInvitationsSent instead.
 * Kept for backward compat – returns true when executors are selected AND invited.
 */
export function areExecutorsInvited(people: Person[]): boolean {
  const executors = people.filter((p) => p.roles?.includes('executor'));
  if (executors.length === 0) return false;
  return executors.every((e) => !!e.invitedAt);
}

/** All executors have accepted their invitation */
export function haveExecutorsAccepted(people: Person[]): boolean {
  const executors = people.filter((p) => p.roles?.includes('executor'));
  if (executors.length === 0) return false;
  return executors.every((e) => e.executorStatus === 'accepted');
}

/** All guardians have accepted (required for signing, not for section completion) */
export function haveGuardiansAccepted(
  people: Person[],
  willData: WillData,
): boolean {
  const children = people.filter((p) => p.isUnder18 === true);
  if (children.length === 0) return true; // No children → vacuously true

  for (const child of children) {
    const assignments = willData.guardianship?.[child.id] ?? [];
    for (const a of assignments) {
      const guardian = people.find((p) => p.id === a.guardian);
      if (!guardian || guardian.guardianDetails?.hasAccepted !== true) {
        return false;
      }
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Stage status derivation
// ---------------------------------------------------------------------------

export function deriveYourPeopleStatus(state: WillProgressState): StageStatus {
  const started =
    hasFullUserDetails(state.willMaker) || hasOnboardingData(state.people);
  if (!started) return 'Not started';

  const childrenExist = hasChildrenUnder18(state.people);

  const checks: boolean[] = [
    hasFullUserDetails(state.willMaker),
    hasOnboardingData(state.people),
    childrenExist ? areGuardiansNominated(state.people, state.willData) : true,
    isResidueAllocated(state.estateRemainderState),
    areExecutorsSelected(state.people),
    areInvitationsSent(state.people, state.willData),
  ];

  return checks.every(Boolean) ? 'Complete' : 'In progress';
}

// Stubs for future stages
export function deriveYourEstateStatus(_state: WillProgressState): StageStatus {
  return 'Not started';
}

export function deriveLegalCheckStatus(_state: WillProgressState): StageStatus {
  return 'Not started';
}

// ---------------------------------------------------------------------------
// Progress display
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable fractional progress string for Stage 1.
 * Sub-flows: Guardians (if children) → Residue → Executors → Invitations
 * e.g. "1/4 done", "3/3 done", "Complete"
 */
export function getYourPeopleProgress(state: WillProgressState): string {
  const childrenExist = hasChildrenUnder18(state.people);
  // Steps: guardians (if children) + residue + executors + invitations
  const totalSteps = childrenExist ? 4 : 3;

  let completed = 0;

  // 1. Guardians (only if children)
  if (childrenExist) {
    if (areGuardiansNominated(state.people, state.willData)) completed++;
  }

  // 2. Residue
  if (isResidueAllocated(state.estateRemainderState)) completed++;

  // 3. Executors selected
  if (areExecutorsSelected(state.people)) completed++;

  // 4. Invitations sent
  if (areInvitationsSent(state.people, state.willData)) completed++;

  if (completed >= totalSteps) return 'Complete';
  return `${completed}/${totalSteps} done`;
}

// ---------------------------------------------------------------------------
// Navigation routing
// ---------------------------------------------------------------------------

/**
 * The next route the user should visit inside the "Your People" stage.
 * Order: Guardians (if children) → Residue → Executors → Invitations
 */
export function getNextYourPeopleRoute(state: WillProgressState): string {
  const childrenExist = hasChildrenUnder18(state.people);

  // 1. Guardians (if applicable)
  if (childrenExist && !areGuardiansNominated(state.people, state.willData)) {
    return '/guardianship/intro';
  }

  // 2. Residue allocation
  if (!isResidueAllocated(state.estateRemainderState)) {
    return '/bequeathal/estate-remainder-who';
  }

  // 3. Executors selected
  if (!areExecutorsSelected(state.people)) {
    return '/executors/intro';
  }

  // 4. Invitations sent
  if (!areInvitationsSent(state.people, state.willData)) {
    return '/invitations/confirm';
  }

  // All complete
  return '/will-dashboard';
}

/**
 * Top-level routing: determines where the Continue button should navigate.
 * Walks stages in order: Your People → Your Estate → Legal Check.
 */
export function getNextRoute(state: WillProgressState): string {
  if (deriveYourPeopleStatus(state) !== 'Complete') {
    return getNextYourPeopleRoute(state);
  }

  // Stage 2 & 3 – future implementation
  if (deriveYourEstateStatus(state) !== 'Complete') {
    return '/bequeathal/categories'; // placeholder – estate intro
  }

  if (deriveLegalCheckStatus(state) !== 'Complete') {
    return '/legal-check'; // placeholder
  }

  // Everything done – go to review / signing
  return '/will-dashboard';
}

// ---------------------------------------------------------------------------
// Dynamic button label
// ---------------------------------------------------------------------------

export function getContinueLabel(state: WillProgressState): string {
  const nextRoute = getNextRoute(state);

  if (nextRoute.includes('guardianship')) return 'Continue to Guardians';
  if (nextRoute.includes('estate-remainder')) return 'Continue to Residue';
  if (nextRoute.includes('executors')) return 'Continue to Executors';
  if (nextRoute.includes('invitations/confirm')) return 'Review Invitations';
  if (nextRoute.includes('bequeathal/categories')) return 'Continue to Your Estate';
  if (nextRoute.includes('legal-check')) return 'Continue to Legal Check';

  return 'Continue';
}

// ---------------------------------------------------------------------------
// Signing eligibility
// ---------------------------------------------------------------------------

export function canSign(state: WillProgressState): boolean {
  return (
    deriveYourPeopleStatus(state) === 'Complete' &&
    deriveYourEstateStatus(state) === 'Complete' &&
    deriveLegalCheckStatus(state) === 'Complete' &&
    haveExecutorsAccepted(state.people) &&
    haveGuardiansAccepted(state.people, state.willData)
  );
}

export function isWaitingForAcceptances(state: WillProgressState): boolean {
  const allStagesComplete =
    deriveYourPeopleStatus(state) === 'Complete' &&
    deriveYourEstateStatus(state) === 'Complete' &&
    deriveLegalCheckStatus(state) === 'Complete';
  if (!allStagesComplete) return false;

  // Stages done but invitees haven't all accepted yet
  return (
    !haveExecutorsAccepted(state.people) ||
    !haveGuardiansAccepted(state.people, state.willData)
  );
}
