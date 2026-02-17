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
 *   2. Will-maker has name + DOB but sub-flows incomplete → 'In progress'
 *   3. Single, no children, all sub-flows complete → 'Complete'
 *   4. All complete, no children → 'Complete' (guardians skipped)
 *   5. Has children, no guardians → 'In progress'
 *   6. Has children, guardians set, invitations sent → 'Complete'
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

import { Person, WillData, EstateRemainderState, BequeathalData, Asset } from '../types';
import type { StageStatus } from '../components/ui/StageCard';

export type { StageStatus };

/** Minimal slice of app state needed by these utilities */
export interface WillProgressState {
  willMaker: Person | undefined;
  people: Person[];
  willData: WillData;
  estateRemainderState: EstateRemainderState;
  bequeathalData: BequeathalData;
}

// ---------------------------------------------------------------------------
// Low-level checks
// ---------------------------------------------------------------------------

/** Will-maker exists with the minimum data collected during onboarding (name + DOB) */
export function hasStartedOnboarding(willMaker: Person | undefined): boolean {
  if (!willMaker) return false;
  return !!(
    willMaker.firstName?.trim() &&
    willMaker.lastName?.trim() &&
    willMaker.dateOfBirth
  );
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
  // "Started" gate: will-maker exists with name + DOB from onboarding
  const started = hasStartedOnboarding(state.willMaker);
  if (!started) {
    console.log('[willProgress] deriveYourPeopleStatus → Not started (no will-maker or missing name/DOB)');
    return 'Not started';
  }

  const childrenExist = hasChildrenUnder18(state.people);

  // Completion checks: the 4 sub-flows that make up "Your People"
  const checkResults = {
    guardiansNominated: childrenExist ? areGuardiansNominated(state.people, state.willData) : true,
    residueAllocated: isResidueAllocated(state.estateRemainderState),
    executorsSelected: areExecutorsSelected(state.people),
    invitationsSent: areInvitationsSent(state.people, state.willData),
  };

  const allPassed = Object.values(checkResults).every(Boolean);
  const status: StageStatus = allPassed ? 'Complete' : 'In progress';

  console.log('[willProgress] deriveYourPeopleStatus →', status, checkResults);
  return status;
}

// ---------------------------------------------------------------------------
// Your Estate — status derivation & helpers
// ---------------------------------------------------------------------------

/** Out-of-scope categories excluded from calculations */
const OUT_OF_SCOPE_TYPES = new Set(['debts-credit', 'other']);

export function deriveYourEstateStatus(state: WillProgressState): StageStatus {
  const categoryStatus = state.bequeathalData?.categoryStatus || {};
  const selectedCategories = Object.keys(categoryStatus);

  // No categories selected = not started
  if (selectedCategories.length === 0) {
    return 'Not started';
  }

  // Check if all selected categories are marked complete
  const allComplete = selectedCategories.every(cat => {
    const entry = categoryStatus[cat];
    return entry?.completedAt !== null && entry?.completedAt !== undefined;
  });

  if (allComplete) {
    return 'Complete';
  }

  // Categories selected but not all complete = in progress
  return 'In progress';
}

/**
 * Net estate value: sum of estimatedValue for non-trust assets across
 * selected categories, minus mortgage outstanding amounts for properties.
 */
export function getEstateNetValue(state: WillProgressState): number {
  const bd = state.bequeathalData;
  if (!bd) return 0;

  const selected = Object.keys(bd.categoryStatus || {});
  let total = 0;

  for (const cat of selected) {
    if (OUT_OF_SCOPE_TYPES.has(cat)) continue;
    const assets = (bd[cat as keyof BequeathalData] as Asset[] | undefined) || [];
    for (const asset of assets) {
      if (asset.heldInTrust === 'yes') continue;

      const value = asset.estimatedValue || 0;
      if (asset.type === 'property') {
        const mortgage = (asset as any).mortgage?.outstandingAmount || 0;
        total += value - mortgage;
      } else {
        total += value;
      }
    }
  }

  return total;
}

/**
 * Gross value: sum of estimatedValue for non-trust assets (no deductions).
 */
export function getEstateGrossValue(state: WillProgressState): number {
  const bd = state.bequeathalData;
  if (!bd) return 0;

  const selected = Object.keys(bd.categoryStatus || {});
  let total = 0;

  for (const cat of selected) {
    if (OUT_OF_SCOPE_TYPES.has(cat)) continue;
    const assets = (bd[cat as keyof BequeathalData] as Asset[] | undefined) || [];
    for (const asset of assets) {
      if (asset.heldInTrust === 'yes') continue;
      total += asset.estimatedValue || 0;
    }
  }

  return total;
}

/**
 * Trust value: sum of estimatedValue for assets where heldInTrust === 'yes'.
 */
export function getEstateTrustValue(state: WillProgressState): number {
  const bd = state.bequeathalData;
  if (!bd) return 0;

  const selected = Object.keys(bd.categoryStatus || {});
  let total = 0;

  for (const cat of selected) {
    if (OUT_OF_SCOPE_TYPES.has(cat)) continue;
    const assets = (bd[cat as keyof BequeathalData] as Asset[] | undefined) || [];
    for (const asset of assets) {
      if (asset.heldInTrust === 'yes') {
        total += asset.estimatedValue || 0;
      }
    }
  }

  return total;
}

/** Total asset count across all selected categories. */
export function getTotalAssetCount(state: WillProgressState): number {
  const bd = state.bequeathalData;
  if (!bd) return 0;

  const selected = Object.keys(bd.categoryStatus || {});
  return selected.reduce((sum, cat) => {
    const arr = bd[cat as keyof BequeathalData];
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);
}

/** Format a number as a short GBP string: £550k, £1.2m, etc. */
export function formatShortCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

/** Dynamic subline for the "Your Estate" card on the Will Dashboard. */
export function getEstateSubline(state: WillProgressState): string {
  const status = deriveYourEstateStatus(state);

  if (status === 'Not started') {
    return 'Assets, gifts, and who gets what · 8 mins';
  }

  if (status === 'Complete') {
    const netValue = getEstateNetValue(state);
    const catCount = Object.keys(state.bequeathalData?.categoryStatus || {}).length;
    return `${catCount} categories · £${formatShortCurrency(netValue)} net estate`;
  }

  // In progress
  const totalAssets = getTotalAssetCount(state);
  const netValue = getEstateNetValue(state);
  if (totalAssets === 0) {
    return 'Categories selected · no assets yet';
  }
  return `${totalAssets} asset${totalAssets !== 1 ? 's' : ''} added · £${formatShortCurrency(netValue)} net`;
}

/** IHT can only be estimated once all selected categories are complete. */
export function isIHTReady(state: WillProgressState): boolean {
  return deriveYourEstateStatus(state) === 'Complete';
}

// Stub for future Legal Check stage
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
    console.log('[willProgress] getNextYourPeopleRoute → /guardianship/intro (guardians needed)');
    return '/guardianship/intro';
  }

  // 2. Residue allocation
  if (!isResidueAllocated(state.estateRemainderState)) {
    console.log('[willProgress] getNextYourPeopleRoute → /bequeathal/estate-remainder-who (residue needed)');
    return '/bequeathal/estate-remainder-who';
  }

  // 3. Executors selected
  if (!areExecutorsSelected(state.people)) {
    console.log('[willProgress] getNextYourPeopleRoute → /executors/intro (executors needed)');
    return '/executors/intro';
  }

  // 4. Invitations sent
  if (!areInvitationsSent(state.people, state.willData)) {
    console.log('[willProgress] getNextYourPeopleRoute → /invitations/confirm (invitations needed)');
    return '/invitations/confirm';
  }

  // All sub-flows complete — summary view
  console.log('[willProgress] getNextYourPeopleRoute → /people/summary (all sub-flows complete)');
  return '/people/summary';
}

/**
 * Top-level routing: determines where the Continue button should navigate.
 * Walks stages in order: Your People → Your Estate → Legal Check.
 */
export function getNextRoute(state: WillProgressState): string {
  const peopleStatus = deriveYourPeopleStatus(state);
  if (peopleStatus !== 'Complete') {
    const route = getNextYourPeopleRoute(state);
    console.log('[willProgress] getNextRoute → Your People not complete, route:', route);
    return route;
  }

  // Stage 2 & 3 – future implementation
  const estateStatus = deriveYourEstateStatus(state);
  if (estateStatus !== 'Complete') {
    console.log('[willProgress] getNextRoute → Your Estate not complete, route: /estate-dashboard');
    return '/estate-dashboard';
  }

  const legalStatus = deriveLegalCheckStatus(state);
  if (legalStatus !== 'Complete') {
    console.log('[willProgress] getNextRoute → Legal Check not complete, route: /legal-check');
    return '/legal-check'; // placeholder
  }

  // Everything done – go to review / signing
  console.log('[willProgress] getNextRoute → all stages complete, route: /review');
  return '/review';
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
  if (nextRoute.includes('people/summary')) return 'View Your People';
  if (nextRoute.includes('estate-dashboard')) return 'Continue to Your Estate';
  if (nextRoute.includes('legal-check')) return 'Continue to Legal Check';
  if (nextRoute.includes('review')) return 'Review & Sign';

  return 'Continue';
}

// ---------------------------------------------------------------------------
// People Summary CTA — context-aware button for the summary screen
// ---------------------------------------------------------------------------

export interface SummaryCTA {
  label: string;
  route: string;
  /** False when Your People is broken (regression) and user needs to fix it first */
  isForward: boolean;
}

/**
 * Determines the CTA for the People Summary screen.
 *
 * Three modes:
 *  1. Your People complete, next stages remain → "Continue to Your Estate"
 *  2. All stages complete → "Review & Sign"
 *  3. Regression (an edit broke completeness) → "Continue" back into the broken sub-flow
 */
export function getPeopleSummaryCTA(state: WillProgressState): SummaryCTA {
  const peopleStatus = deriveYourPeopleStatus(state);

  // Regression: user edited something and broke completeness
  if (peopleStatus !== 'Complete') {
    const fixRoute = getNextYourPeopleRoute(state);
    console.log('[willProgress] getPeopleSummaryCTA → regression, fix route:', fixRoute);
    return {
      label: 'Continue',
      route: fixRoute,
      isForward: false,
    };
  }

  // Your People is complete — advance to next stage
  const estateStatus = deriveYourEstateStatus(state);
  if (estateStatus !== 'Complete') {
    console.log('[willProgress] getPeopleSummaryCTA → forward to Your Estate');
    return {
      label: 'Continue to Your Estate',
      route: '/estate-dashboard',
      isForward: true,
    };
  }

  const legalStatus = deriveLegalCheckStatus(state);
  if (legalStatus !== 'Complete') {
    console.log('[willProgress] getPeopleSummaryCTA → forward to Legal Check');
    return {
      label: 'Continue to Legal Check',
      route: '/legal-check',
      isForward: true,
    };
  }

  // Everything done
  console.log('[willProgress] getPeopleSummaryCTA → all complete, review & sign');
  return {
    label: 'Review & Sign',
    route: '/review',
    isForward: true,
  };
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
