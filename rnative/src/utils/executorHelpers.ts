/**
 * Executor Role Label Utilities
 * 
 * Provides functions for calculating executor role labels based on hierarchical levels.
 * Ported from web-prototype/src/helpers/roleLabels.ts
 * 
 * @module utils/executorHelpers
 */

type LevelAssignment = {
  level: number;
};

/**
 * Get the display label for someone already in the list
 * Shows "Co-" prefix ONLY if there are multiple people at the same level
 * 
 * @param level - The level number (1 = Primary, 2 = Secondary, etc.)
 * @param allAssignments - All current level assignments
 * @returns Display label (e.g., "Primary", "Co-Primary", "Secondary")
 * 
 * @example
 * ```tsx
 * const executors = [{executor: 'id1', level: 1}, {executor: 'id2', level: 1}];
 * getDisplayRoleLabel(1, executors); // "Co-Primary"
 * ```
 */
export function getDisplayRoleLabel(
  level: number,
  allAssignments: LevelAssignment[]
): string {
  const levelCount = allAssignments.filter(a => a.level === level).length;
  const levelNames = ['', 'Primary', 'Secondary', 'Tertiary', 'Quaternary'];
  const baseName = levelNames[level] || `Level ${level}`;
  
  // Show "Co-" prefix only if there are multiple people at this level
  return levelCount > 1 ? `Co-${baseName}` : baseName;
}

/**
 * Get the dropdown label when selecting a level for a NEW person
 * Shows "Co-" prefix if there's ALREADY someone at this level
 * (because the new person will become a co-holder)
 * 
 * @param level - The level number (1 = Primary, 2 = Secondary, etc.)
 * @param allAssignments - All current level assignments
 * @returns Dropdown label (e.g., "Primary", "Co-Primary")
 * 
 * @example
 * ```tsx
 * const executors = [{executor: 'id1', level: 1}];
 * getDropdownRoleLabel(1, executors); // "Co-Primary" (will be co- when added)
 * ```
 */
export function getDropdownRoleLabel(
  level: number,
  allAssignments: LevelAssignment[]
): string {
  const levelCount = allAssignments.filter(a => a.level === level).length;
  const levelNames = ['', 'Primary', 'Secondary', 'Tertiary', 'Quaternary'];
  const baseName = levelNames[level] || `Level ${level}`;
  
  // Show "Co-" prefix if there's already at least one person at this level
  // (the new person being added will make it a co-role)
  return levelCount > 0 ? `Co-${baseName}` : baseName;
}

/**
 * Get available levels for adding a new person
 * Ensures hierarchical order (must fill level 1 before level 2, etc.)
 * 
 * @param allAssignments - All current level assignments
 * @param maxLevels - Maximum number of levels (default 4)
 * @returns Array of available level numbers
 * 
 * @example
 * ```tsx
 * const executors = [{executor: 'id1', level: 1}];
 * getAvailableLevels(executors); // [1, 2] (can add to level 1 or level 2)
 * 
 * const noExecutors = [];
 * getAvailableLevels(noExecutors); // [1] (must start with level 1)
 * ```
 */
export function getAvailableLevels(
  allAssignments: LevelAssignment[],
  maxLevels: number = 4
): number[] {
  const levels = Array.from({ length: maxLevels }, (_, i) => i + 1);
  const usedLevels = allAssignments.map(a => a.level);
  
  return levels.filter(level => {
    // Level 1 must be filled before level 2, etc.
    const previousLevels = levels.slice(0, level - 1);
    return previousLevels.every(prevLevel => usedLevels.includes(prevLevel));
  });
}





