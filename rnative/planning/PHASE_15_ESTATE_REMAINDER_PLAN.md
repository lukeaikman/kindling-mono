# Phase 15: Estate Remainder (Residual) - Detailed Implementation Plan

## Planning Methodology

**Purpose:** The Estate Remainder flow allows users to designate who inherits the residual estate (everything not specifically gifted) and how it should be split. This is a critical part of will creation that ensures 100% of the estate is allocated.

**Approach:**
1. **Analyze web prototype thoroughly** - Understand two-screen flow and all interactions
2. **Verify existing data models** - Confirm EstateRemainderState and related types
3. **Identify reusable components** - BeneficiaryWithPercentages, GroupManagementDrawer, etc.
4. **Document "Who" screen** - Person/group selection with lazy group creation
5. **Document "Split" screen** - Percentage allocation with lock/unlock mechanics
6. **Map state management** - estateRemainderActions usage patterns
7. **Define validation rules** - Must total 100% before proceeding
8. **Create implementation plan** - Two screens, step-by-step with code examples

**Critical Success Factors:**
- Lazy group creation (only create BeneficiaryGroup when selected)
- "Make Equal to 100%" button proportionally adjusts all allocations
- Slider + manual input for precise control
- Support for adding charities inline
- Validation prevents progression unless exactly 100% allocated
- Seamless integration with existing Person and BeneficiaryGroup systems
- Haptic feedback on 100% achievement
- Smooth animations on normalization

---

## Step 1: Web Prototype Code Analysis

### Files Analyzed:
- `web-prototype/src/components/EstateRemainderWhoScreen.tsx` (411 lines)
- `web-prototype/src/components/EstateRemainderSplitScreen.tsx` (470 lines)
- `web-prototype/src/types.ts` (EstateRemainderState interface)
- `web-prototype/src/App.tsx` (navigation flow, lines 893-915)

### Navigation Flow in Web Prototype:
```typescript
// From App.tsx
'estate-division-entry' 
  → handleEstateDivisionEntryNext() 
  → 'estate-remainder-who'

'estate-remainder-who'
  → handleEstateRemainderWhoNext(selectedPeopleIds, selectedGroupIds)
  → estateRemainderActions.updateSelectedBeneficiaries(...)
  → 'estate-remainder-split'

'estate-remainder-split'
  → handleEstateRemainderSplitNext()
  → 'bequeathal-categories' (start specific asset allocation)
```

### EstateRemainderWhoScreen Analysis (411 lines):

**State Management:**
```typescript
const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
const [isAddingCategory, setIsAddingCategory] = useState(false);
const [newCategoryName, setNewCategoryName] = useState('');
const [showAddPerson, setShowAddPerson] = useState(false);

// Load on mount
useEffect(() => {
  const estateState = estateRemainderActions.getEstateRemainderState();
  setSelectedPeopleIds(estateState.selectedPeopleIds || []);
  setSelectedGroupIds(estateState.selectedGroupIds || []);
}, []);
```

**Person Toggle Logic (lines 49-55):**
```typescript
const handlePersonToggle = (personId: string) => {
  setSelectedPeopleIds(prev => 
    prev.includes(personId) 
      ? prev.filter(id => id !== personId)
      : [...prev, personId]
  );
};
```

**Lazy Group Creation (lines 57-83):**
```typescript
const handleGroupToggle = (groupName: string, isPredefined: boolean) => {
  const willId = willActions.getWillData().userId;
  let group = beneficiaryGroupActions.getGroupByName(groupName, willId);
  
  if (!group) {
    // LAZY CREATE - group doesn't exist yet, create it now
    const template = PREDEFINED_GROUP_TEMPLATES.find(t => t.name === groupName);
    const groupId = beneficiaryGroupActions.addGroup({
      name: groupName,
      description: template?.description || 'Custom category',
      isPredefined,
      isActive: true,
      willId
    });
    setSelectedGroupIds(prev => [...prev, groupId]);
  } else {
    // Toggle existing group
    const newActive = !group.isActive;
    beneficiaryGroupActions.setGroupActive(group.id, newActive);
    
    if (newActive) {
      setSelectedGroupIds(prev => [...prev, group.id]);
    } else {
      setSelectedGroupIds(prev => prev.filter(id => id !== group.id));
    }
  }
};
```

**Add Custom Category (lines 85-99):**
```typescript
const handleAddCategory = () => {
  if (newCategoryName.trim()) {
    const willId = willActions.getWillData().userId;
    const groupId = beneficiaryGroupActions.addGroup({
      name: newCategoryName.trim(),
      description: 'Custom category',
      isPredefined: false,
      isActive: true,
      willId
    });
    setSelectedGroupIds(prev => [groupId, ...prev]);
    setNewCategoryName('');
    setIsAddingCategory(false);
  }
};
```

**Inline Person Creation (lines 106-130):**
```typescript
const handleAddPerson = (personData: { 
  firstName: string; 
  lastName: string; 
  relationship: string; 
  email?: string; 
  phone?: string; 
}) => {
  const personId = personActions.addPerson({
    firstName: personData.firstName.trim(),
    lastName: personData.lastName.trim(),
    email: personData.email || '',
    phone: personData.phone || '',
    relationship: (personData.relationship as any) || 'other',
    roles: ['beneficiary']
  });
  
  setSelectedPeopleIds(prev => {
    if (prev.includes(personId)) {
      return prev;
    }
    return [...prev, personId];
  });
  setShowAddPerson(false);
  return personId;
};
```

**Save and Navigate (lines 132-134):**
```typescript
const handleNext = () => {
  onNext(selectedPeopleIds, selectedGroupIds);
};
```

**UI Structure:**
```
Header
├─ Back button
├─ Icon + "The Estate Residue" title
├─ Video embedded for explainer video (as per some other intro screens)
└─ Explanation text (2 paragraphs)

People Section (lines 184-260)
├─ Header: "People" + [Add Someone] button
├─ Add Person Form (BeneficiaryTrusteeSelectField if showAddPerson)
└─ Person Cards List
    └─ Each card: Checkbox + Name + Relationship label
    └─ Note that the person making the will should of course be excluded

Separator

Categories Section (lines 264-390)
├─ Header: "Categories" + [Add Category] button
├─ Explanation text
├─ Add Category Form (if isAddingCategory)
├─ Custom Groups List (removable with X button)
└─ Predefined Groups List (PREDEFINED_GROUP_TEMPLATES)

Footer (lines 393-408)
├─ [Next: Residual Split] button (disabled if no selections)
└─ Count text: "X people and Y categories selected"
```

### EstateRemainderSplitScreen Analysis (470 lines):

**State Management:**
```typescript
const [manualEntries, setManualEntries] = useState<Record<string, string>>({});
const [showAddCharity, setShowAddCharity] = useState(false);
const [charityName, setCharityName] = useState('');

// Get estate remainder state from actions
const estateState = estateRemainderActions.getEstateRemainderState();
const { selectedPeopleIds, selectedGroupIds, splits, lockedCards } = estateState;
```

**Split ID Format (lines 187-215):**
```typescript
// Person split IDs: "person-{personId}"
// Group split IDs: "group-{groupId}"

const recipients: SharingRecipient[] = [
  ...selectedPeople.map((person) => ({
    splitId: `person-${person.id}`,
    label: getPersonFullName(person),
    subLabel: person.relationship ? person.relationship.replace('-', ' ') : undefined,
    avatar: <PersonAvatar />
  })),
  ...selectedGroupIds
    .map((groupId) => {
      const group = beneficiaryGroupActions.getGroupById(groupId);
      if (!group) return null;
      return {
        splitId: `group-${groupId}`,
        label: group.name,
        subLabel: "Category",
        avatar: <GroupAvatar />
      };
    })
    .filter((item): item is SharingRecipient => item !== null)
];
```

**Total Calculation (lines 48-52):**
```typescript
const totalPercentage = (Object.values(splits) as number[]).reduce(
  (sum, percentage) => sum + (Number.isFinite(percentage) ? percentage : 0),
  0
);
const remainingPercentage = 100 - totalPercentage;
```

**Update Split (lines 63-65):**
```typescript
const updateSplit = (id: string, percentage: number) => {
  estateRemainderActions.updateSplit(id, percentage);
};
```

**Toggle Lock (lines 67-69):**
```typescript
const toggleLock = (id: string) => {
  estateRemainderActions.toggleLock(id);
};
```

**Manual Input Handling (lines 78-117):**
```typescript
const handleManualInputChange = (splitId: string, value: string) => {
  setManualEntries((prev) => ({
    ...prev,
    [splitId]: value
  }));
};

const handleManualInputBlur = (splitId: string) => {
  if (!(splitId in manualEntries)) {
    return;
  }

  const rawValue = manualEntries[splitId];
  let parsedValue = clampPercentage(parseFloat(rawValue));
  
  // Calculate maximum allowed for this split
  const lockedTotal = Object.keys(splits)
    .filter(id => id !== splitId && lockedCards[id])
    .reduce((sum, id) => sum + (splits[id] || 0), 0);
  const maxAllowed = 100 - lockedTotal;
  
  // Further clamp to respect the 100% total constraint
  parsedValue = Math.min(parsedValue, maxAllowed);
  
  const currentValue = splits[splitId] || 0;

  if (parsedValue !== currentValue) {
    updateSplit(splitId, parsedValue);
  }

  // Auto-lock when manually edited
  if (!lockedCards[splitId]) {
    toggleLock(splitId);
  }

  // Clear from manual entries
  setManualEntries((prev) => {
    const next = { ...prev };
    delete next[splitId];
    return next;
  });
};
```

**Slider Change (lines 119-129):**
```typescript
const handleSliderChange = (splitId: string, value: number) => {
  updateSplit(splitId, clampPercentage(value));
  // Clear any pending manual entry
  setManualEntries((prev) => {
    if (!(splitId in prev)) {
      return prev;
    }
    const next = { ...prev };
    delete next[splitId];
    return next;
  });
};
```

**Equalise Unlocked Cards (lines 155-174):**
```typescript
const handleEqualiseUnlocked = () => {
  // Calculate total locked percentage
  const lockedTotal = Object.keys(splits)
    .filter(id => lockedCards[id])
    .reduce((sum, id) => sum + (splits[id] || 0), 0);
  
  // Get unlocked card IDs
  const unlockedIds = Object.keys(splits).filter(id => !lockedCards[id]);
  
  if (unlockedIds.length === 0) return;
  
  // Calculate equal share for each unlocked card
  const remainingPercentage = 100 - lockedTotal;
  const equalShare = remainingPercentage / unlockedIds.length;
  
  // Update all unlocked cards to equal share
  unlockedIds.forEach(id => {
    estateRemainderActions.updateSplit(id, equalShare);
  });
};
```

**Add Charity (lines 135-153):**
```typescript
const handleAddCharity = () => {
  if (charityName.trim()) {
    const willId = willActions.getWillData().userId;
    const groupId = beneficiaryGroupActions.addGroup({
      name: charityName.trim(),
      description: 'Charity',
      isPredefined: false,
      isActive: true,
      willId
    });
    
    // Add to estate remainder state
    const updatedGroupIds = [...selectedGroupIds, groupId];
    estateRemainderActions.updateSelectedBeneficiaries(selectedPeopleIds, updatedGroupIds);
    
    setCharityName('');
    setShowAddCharity(false);
  }
};
```

**Remove Recipient (lines 176-178):**
```typescript
const handleRemoveRecipient = (splitId: string) => {
  estateRemainderActions.removeRecipient(splitId);
};
```

**UI Structure:**
```
Header
├─ Back button
└─ "Residue Split" title

Content
├─ [Equalise unlocked cards] link (if >1 unlocked)
├─ Warning if locked cards exceed 100%
└─ Recipient Cards (for each person/group)
    ├─ Avatar + Name + Relationship
    ├─ Lock/Unlock button + Percentage input (with % suffix)
    ├─ Slider (0-100%)
    ├─ Helper text (if only one unlocked)
    └─ [Remove] link (if percentage < 0.1)

[+ Add Charity] section

Footer
├─ Over-allocation warning (if total > 100)
└─ [Continue] button
    ├─ Enabled: total = 100% (±0.1 tolerance)
    ├─ Disabled states:
        └─ "Allocate remaining X%" (if under)
        └─ "Reduce allocation to continue" (if over)
```

---

## Step 2: Native App Data Model Verification

### ✅ EstateRemainderState Interface Exists
**File:** `native-app/src/types/index.ts` (lines 969-975)

```typescript
export interface EstateRemainderState {
  selectedPeopleIds: string[];
  selectedGroupIds: string[];
  splits: Record<string, number>;
  lockedCards: Record<string, boolean>; // Exists in type but NOT used in native implementation
  lastUpdated: Date;
}
```

**Status:** ✅ AVAILABLE - Type supports locks but native implementation uses simpler "Make Equal to 100%" approach instead

### ✅ BeneficiaryGroup Interface Exists
**File:** `native-app/src/types/index.ts` (lines 922-932)

```typescript
export interface BeneficiaryGroup {
  id: string;
  name: string;
  description: string;
  isPredefined: boolean;
  isActive: boolean;
  memberIds?: string[];
  willId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Status:** ✅ PERFECT - Full feature parity with web prototype

### ✅ BeneficiaryGroupActions Exists
**File:** `native-app/src/types/index.ts` (lines 939-954)

```typescript
export interface BeneficiaryGroupActions {
  addGroup: (group: Omit<BeneficiaryGroup, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateGroup: (id: string, updates: Partial<BeneficiaryGroup>) => void;
  getGroups: () => BeneficiaryGroup[];
  getGroupById: (id: string) => BeneficiaryGroup | undefined;
  getActiveGroups: () => BeneficiaryGroup[];
  getGroupByName: (name: string, willId: string) => BeneficiaryGroup | undefined;
  setGroupActive: (id: string, isActive: boolean) => void;
}
```

**Status:** ✅ PERFECT - All methods needed for lazy creation

### ✅ estateRemainderActions Exists
**File:** `native-app/src/hooks/useAppState.ts` (lines 1191-1437)

**Methods Available:**
```typescript
const estateRemainderActions = {
  updateSelectedBeneficiaries: (peopleIds: string[], groupIds: string[]) => {
    // Initializes splits with equal distribution
    // Sets up locks (all unlocked initially)
    // Persists to AsyncStorage
  },
  
  updateSplit: (splitId: string, percentage: number) => {
    // Updates single split percentage
    // Auto-redistributes unlocked cards
    // Maintains 100% total
  },
  
  toggleLock: (splitId: string) => {
    // Toggles lock state for a split
  },
  
  removeRecipient: (splitId: string) => {
    // Removes person/group from splits
    // Redistributes their percentage to unlocked cards
    // Updates selectedPeopleIds or selectedGroupIds
  },
  
  getEstateRemainderState: () => estateRemainderState,
  
  clearEstateRemainderState: async () => {
    // Resets to empty state
    // Clears AsyncStorage
  }
};
```

**Status:** ✅ PERFECT - All logic needed is implemented

### ✅ PREDEFINED_GROUP_TEMPLATES Exists
**File:** `native-app/src/constants/index.ts` (lines 88-96)

```typescript
export const PREDEFINED_GROUP_TEMPLATES = [
  { name: 'Children', description: 'All your children' },
  { name: 'Grandchildren', description: 'All your grandchildren' },
  { name: 'Great Grandchildren', description: 'All your great grandchildren' },
  { name: 'Siblings', description: 'All your brothers and sisters' },
  { name: 'Parents', description: 'Your parents' },
  { name: 'Cousins', description: 'All your cousins' },
  { name: 'Friends', description: 'All your friends' }
] as const;
```

**Status:** ✅ PERFECT - Same as web prototype

---

## Step 3: Reusable Components Inventory

### ✅ BeneficiaryWithPercentages Component
**File:** `native-app/src/components/forms/BeneficiaryWithPercentages.tsx` (514 lines)

**Features:**
- Percentage or amount allocation modes
- Manual percentage input (NO sliders)
- Add people/groups via drawer
- "Equally distribute rest" helper (user-triggered, not auto)
- Validation (totals must equal 100% or totalValue)
- Remove beneficiary option

**What it DOESN'T have:**
- ❌ NO sliders (manual input only)
- ❌ NO lock/unlock mechanism
- ❌ NO auto-redistribution

**Status:** ✅ USEFUL PATTERN - But Estate Remainder needs sliders + "Make Equal to 100%" button for better UX

**Key Pattern to Replicate:**
```typescript
// From BeneficiaryWithPercentages.tsx (lines 222-253)
const handleEquallyDistributeRest = (currentIndex: number) => {
  const filledTotal = value.reduce((sum, b) => 
    sum + ((allocationMode === 'percentage' ? b.percentage : b.amount) || 0), 0
  );
  
  const remaining = (allocationMode === 'percentage' ? 100 : (totalValue || 0)) - filledTotal;
  
  const emptyIndices = value
    .map((b, idx) => ({ b, idx }))
    .filter(({b, idx}) => {
      const currentValue = allocationMode === 'percentage' ? b.percentage : b.amount;
      return idx !== currentIndex && (!currentValue || currentValue === 0);
    })
    .map(({idx}) => idx);
  
  if (emptyIndices.length === 0 || remaining <= 0) return;
  
  const equalShare = parseFloat((remaining / emptyIndices.length).toFixed(1));
  
  const updated = [...value];
  emptyIndices.forEach(idx => {
    if (allocationMode === 'percentage') {
      updated[idx] = { ...updated[idx], percentage: equalShare };
    } else {
      updated[idx] = { ...updated[idx], amount: Math.round(equalShare) };
    }
  });
  
  onChange(updated);
};
```

### ✅ MultiBeneficiarySelector Component
**File:** `native-app/src/components/forms/MultiBeneficiarySelector.tsx`

**Features:**
- Multi-select people/groups
- Drawer-based selection UI
- Add new person inline
- Add new group inline
- Exclude certain people (e.g., will-maker)

**Status:** ✅ POTENTIALLY USEFUL - Alternative to building custom person list

### ✅ GroupManagementDrawer Component
**File:** `native-app/src/components/forms/GroupManagementDrawer.tsx`

**Features:**
- Create new beneficiary groups
- Select from PREDEFINED_GROUP_TEMPLATES
- Create custom groups
- Returns selected group IDs

**Status:** ✅ USEFUL - Can be used for "Add Category" flow

### ✅ PersonSelector Component
**File:** `native-app/src/components/forms/PersonSelector.tsx`

**Features:**
- Select existing person
- Add new person inline
- Shows relationship labels
- Filter options

**Status:** ✅ USEFUL - Can be used for "Add Someone" flow

### ⚠️ Slider Component (NEEDS IMPLEMENTATION)
**File:** `native-app/src/components/ui/Slider.tsx`

**Current Status:** Placeholder only (line 115: "requires @react-native-community/slider")
**Action Required:** Install `@react-native-community/slider` and implement functional Slider component
**Priority:** HIGH - Must be completed before EstateRemainderSplitScreen
**Estimated Time:** 30-45 minutes

### ✅ Checkbox Component
**File:** `native-app/src/components/ui/Checkbox.tsx`

**Status:** ✅ REQUIRED - For person/group selection in who screen

### ✅ Card Component
**File:** `native-app/src/components/ui/Card.tsx`

**Status:** ✅ REQUIRED - For person/group cards

---

## Step 3.5: Simplified Approach for Native (IMPORTANT)

### Why Not Use Web Prototype's Lock/Unlock Pattern?

**Web Prototype Approach:**
- Lock/unlock individual cards
- Auto-redistribute only unlocked cards
- Complex state management
- Implementation time: ~16 hours

**Native Implementation Approach (SIMPLIFIED):**
- NO lock/unlock buttons
- Manual adjustment via slider + input
- "Make Equal to 100%" button when off target
- Proportionally adjusts ALL recipients
- Implementation time: ~10-12 hours

### "Make Equal to 100%" Button Logic

**Problem:** Users have allocations that don't total 100%

**Examples:**

**Scenario 1: Under 100%**
```
Current: 45% + 30% + 15% = 90% (under by 10%)

Press [Make Equal to 100%]

Result:
45 → 50.0% (45/90 * 100 = 50%)
30 → 33.3% (30/90 * 100 = 33.3%)
15 → 16.7% (15/90 * 100 = 16.7%)
Total: 100% ✓
```

**Scenario 2: Over 100%**
```
Current: 50% + 40% + 30% = 120% (over by 20%)

Press [Make Equal to 100%]

Result:
50 → 41.7% (50/120 * 100 = 41.7%)
40 → 33.3% (40/120 * 100 = 33.3%)
30 → 25.0% (30/120 * 100 = 25.0%)
Total: 100% ✓
```

**Implementation:**
```typescript
const handleMakeEqualTo100 = () => {
  const currentTotal = getTotalPercentage(splits);
  if (currentTotal === 0) return; // Prevent division by zero
  
  const scaleFactor = 100 / currentTotal;
  
  // Scale all splits proportionally
  const updatedSplits = Object.keys(splits).reduce((acc, splitId) => {
    acc[splitId] = splits[splitId] * scaleFactor;
    return acc;
  }, {} as Record<string, number>);
  
  // Update all splits at once
  estateRemainderActions.updateAllSplits(updatedSplits);
  
  // Haptic feedback on success
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
```

### Two Key Animations/Haptics

**1. Haptic Feedback on 100% Achievement** ⭐⭐⭐⭐⭐
```typescript
// In component, watch for 100% achievement
const [previousTotal, setPreviousTotal] = useState(0);

useEffect(() => {
  const total = getTotalPercentage(splits);
  const isExactly100 = Math.abs(total - 100) <= 0.1;
  const wasNot100 = Math.abs(previousTotal - 100) > 0.1;
  
  if (isExactly100 && wasNot100) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  setPreviousTotal(total);
}, [splits]);
```

**2. Spring Animation on Normalize** ⭐⭐⭐⭐
```typescript
import { Animated } from 'react-native';

const handleMakeEqualTo100WithAnimation = () => {
  const currentTotal = getTotalPercentage(splits);
  const scaleFactor = 100 / currentTotal;
  
  // Animate each percentage value
  Object.keys(splits).forEach(splitId => {
    const newValue = splits[splitId] * scaleFactor;
    
    // Create animated value
    const animatedValue = new Animated.Value(splits[splitId]);
    
    // Spring to new value
    Animated.spring(animatedValue, {
      toValue: newValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    
    // Update actual value
    estateRemainderActions.updateSplit(splitId, newValue);
  });
  
  // Success haptic
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
```

---

## Step 4: EstateRemainderWhoScreen Implementation Plan

### File Location
**Path:** `native-app/app/bequeathal/estate-remainder-who.tsx`

### Screen Purpose
Allow user to select which people and/or categories will share the estate residue (everything not specifically gifted).

### Dependencies
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppState } from '@/src/hooks/useAppState';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Checkbox } from '@/src/components/ui/Checkbox';
import { Input } from '@/src/components/ui/Input';
import { PersonSelector } from '@/src/components/forms/PersonSelector';
import { GroupManagementDrawer } from '@/src/components/forms/GroupManagementDrawer';
import { PREDEFINED_GROUP_TEMPLATES } from '@/src/constants';
import { Users, Plus, Check, X } from 'lucide-react-native';
```

### State Structure
```typescript
interface EstateRemainderWhoScreenState {
  selectedPeopleIds: string[];
  selectedGroupIds: string[];
  isAddingCategory: boolean;
  newCategoryName: string;
  showAddPersonDrawer: boolean;
  showGroupDrawer: boolean;
}
```

### Implementation Steps

#### Step 4.1: Screen Shell (30 minutes)
**Create:** `app/bequeathal/estate-remainder-who.tsx`

```typescript
export default function EstateRemainderWhoScreen() {
  const { 
    personActions, 
    beneficiaryGroupActions, 
    estateRemainderActions, 
    willActions 
  } = useAppState();

  // Local state
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddPersonDrawer, setShowAddPersonDrawer] = useState(false);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);

  // Load existing selections on mount
  useEffect(() => {
    const estateState = estateRemainderActions.getEstateRemainderState();
    setSelectedPeopleIds(estateState.selectedPeopleIds || []);
    setSelectedGroupIds(estateState.selectedGroupIds || []);
  }, []);

  // Get will-maker to exclude from list
  const willMaker = willActions.getUser();
  
  // Get all people except will-maker
  const allPeople = personActions.getPeople().filter(
    person => person.id !== willMaker?.id
  );

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    // Save selections to estate remainder state
    estateRemainderActions.updateSelectedBeneficiaries(
      selectedPeopleIds, 
      selectedGroupIds
    );
    
    // Navigate to split screen
    router.push('/bequeathal/estate-remainder-split');
  };

  const hasSelections = selectedPeopleIds.length > 0 || selectedGroupIds.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        {/* Header content */}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* People section */}
        {/* Categories section */}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleNext}
          disabled={!hasSelections}
          title={`Next: Residual Split`}
        />
        {hasSelections && (
          <Text style={styles.footerText}>
            {selectedPeopleIds.length} people and {selectedGroupIds.length} categories selected
          </Text>
        )}
      </View>

      {/* Drawers */}
      {showAddPersonDrawer && (
        <PersonSelector
          visible={showAddPersonDrawer}
          onClose={() => setShowAddPersonDrawer(false)}
          onSelect={(personId) => {
            // Handle person selection
          }}
          allowAddNew={true}
        />
      )}

      {showGroupDrawer && (
        <GroupManagementDrawer
          visible={showGroupDrawer}
          onClose={() => setShowGroupDrawer(false)}
          onSelect={(groupIds) => {
            // Handle group selection
          }}
        />
      )}
    </View>
  );
}
```

**Test Checkpoint:**
- Screen renders without crashes
- Back button navigates correctly
- Next button disabled when no selections
- Drawers open/close

#### Step 4.2: Header Implementation (15 minutes)

```typescript
<View style={styles.header}>
  <View style={styles.headerTop}>
    <BackButton onPress={handleBack} />
    <View style={styles.titleContainer}>
      <View style={styles.iconCircle}>
        <Users size={20} color="#1E3A5F" />
      </View>
      <Text style={styles.title}>The Estate Residue</Text>
    </View>
  </View>

  <View style={styles.explanationContainer}>
    <Text style={styles.explanationText}>
      In a moment we'll create a complete inventory of your assets and for every 
      asset you can specify a specific person or group who will inherit it.
    </Text>
    <Text style={styles.explanationText}>
      Anything left is known as the Residue and can be split as you wish.
    </Text>
    
    <View style={styles.separator} />
    
    <Text style={styles.questionTitle}>
      Who will inherit The Residue?
    </Text>
  </View>
</View>
```

**Styles:**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  explanationContainer: {
    gap: 12,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(30, 58, 95, 0.6)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(30, 58, 95, 0.1)',
    marginVertical: 8,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
});
```

**Test Checkpoint:**
- Header displays all text correctly
- Icon renders
- Layout matches design

#### Step 4.3: People Section Implementation (45 minutes)

```typescript
const handlePersonToggle = (personId: string) => {
  setSelectedPeopleIds(prev => 
    prev.includes(personId)
      ? prev.filter(id => id !== personId)
      : [...prev, personId]
  );
};

const handleAddNewPerson = (personData: {
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
}) => {
  const personId = personActions.addPerson({
    firstName: personData.firstName.trim(),
    lastName: personData.lastName.trim(),
    email: personData.email || '',
    phone: personData.phone || '',
    relationship: personData.relationship as any,
    roles: ['beneficiary'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Auto-select newly created person
  setSelectedPeopleIds(prev => {
    if (prev.includes(personId)) return prev;
    return [...prev, personId];
  });
  
  setShowAddPersonDrawer(false);
  return personId;
};

// Helper function to get person display name
const getPersonFullName = (person: Person) => {
  return `${person.firstName} ${person.lastName}`.trim();
};

// Helper function to get relationship label
const getRelationshipLabel = (relationship: string) => {
  return relationship.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

{/* People Section */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>People</Text>
    <Pressable
      onPress={() => setShowAddPersonDrawer(true)}
      style={styles.addButton}
    >
      <Plus size={16} color="#4CAF50" />
      <Text style={styles.addButtonText}>Add Someone</Text>
    </Pressable>
  </View>

  <View style={styles.itemsList}>
    {allPeople.length === 0 ? (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No people found</Text>
        <Text style={styles.emptySubtext}>
          Add someone above to get started
        </Text>
      </Card>
    ) : (
      allPeople.map((person) => {
        const isSelected = selectedPeopleIds.includes(person.id);
        return (
          <Pressable
            key={person.id}
            onPress={() => handlePersonToggle(person.id)}
            style={[
              styles.personCard,
              isSelected && styles.personCardSelected
            ]}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handlePersonToggle(person.id)}
            />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>
                {getPersonFullName(person)}
              </Text>
              <Text style={styles.personRelationship}>
                {getRelationshipLabel(person.relationship)}
              </Text>
            </View>
          </Pressable>
        );
      })
    )}
  </View>
</View>
```

**Styles:**
```typescript
section: {
  marginBottom: 24,
},
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1E3A5F',
},
addButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
},
addButtonText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#4CAF50',
},
itemsList: {
  gap: 12,
},
emptyCard: {
  padding: 32,
  alignItems: 'center',
  backgroundColor: '#F9FAFB',
},
emptyTitle: {
  fontSize: 15,
  color: 'rgba(30, 58, 95, 0.6)',
  marginBottom: 4,
},
emptySubtext: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.4)',
},
personCard: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: 'rgba(30, 58, 95, 0.1)',
  borderRadius: 12,
},
personCardSelected: {
  borderColor: '#4CAF50',
  backgroundColor: 'rgba(76, 175, 80, 0.05)',
},
personInfo: {
  flex: 1,
},
personName: {
  fontSize: 15,
  fontWeight: '500',
  color: '#1E3A5F',
  marginBottom: 2,
},
personRelationship: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
  textTransform: 'capitalize',
},
```

**Test Checkpoint:**
- People list displays correctly
- Checkbox toggles selection
- Card visual states work (selected/unselected)
- Empty state shows when no people
- Add person drawer opens

#### Step 4.4: Categories Section - Custom Groups (30 minutes)

```typescript
const handleAddCategory = () => {
  if (newCategoryName.trim()) {
    const willId = willActions.getWillData().userId;
    const groupId = beneficiaryGroupActions.addGroup({
      name: newCategoryName.trim(),
      description: 'Custom category',
      isPredefined: false,
      isActive: true,
      willId,
    });
    
    setSelectedGroupIds(prev => [groupId, ...prev]);
    setNewCategoryName('');
    setIsAddingCategory(false);
  }
};

const handleRemoveCustomCategory = (groupId: string) => {
  beneficiaryGroupActions.setGroupActive(groupId, false);
  setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
};

// Get active custom groups for this will
const willId = willActions.getWillData().userId;
const activeCustomGroups = beneficiaryGroupActions.getActiveGroups()
  .filter(g => !g.isPredefined && g.willId === willId);

{/* Categories Section */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Categories</Text>
    <Pressable
      onPress={() => setIsAddingCategory(!isAddingCategory)}
      style={styles.addButton}
    >
      <Plus size={16} color="#4CAF50" />
      <Text style={styles.addButtonText}>Add Category</Text>
    </Pressable>
  </View>

  <Text style={styles.sectionDescription}>
    You can add any defined category, from kin to members of a club at the 
    date of death to all your ex's cats ... though we wouldn't recommend the latter.
  </Text>

  {/* Add Category Form */}
  {isAddingCategory && (
    <Card style={styles.addCategoryCard}>
      <View style={styles.addCategoryForm}>
        <Input
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholder="Enter category name (e.g., Godchildren)"
          style={styles.categoryInput}
          onSubmitEditing={handleAddCategory}
        />
        <View style={styles.addCategoryButtons}>
          <Pressable
            onPress={handleAddCategory}
            disabled={!newCategoryName.trim()}
            style={[
              styles.iconButton,
              styles.iconButtonPrimary,
              !newCategoryName.trim() && styles.iconButtonDisabled
            ]}
          >
            <Check size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => setIsAddingCategory(false)}
            style={[styles.iconButton, styles.iconButtonSecondary]}
          >
            <X size={16} color="#1E3A5F" />
          </Pressable>
        </View>
      </View>
    </Card>
  )}

  {/* Custom Categories List */}
  {activeCustomGroups.map((group) => {
    const isSelected = selectedGroupIds.includes(group.id);
    return (
      <Pressable
        key={group.id}
        onPress={() => handleGroupToggle(group.name, false)}
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected
        ]}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleGroupToggle(group.name, false)}
        />
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{group.name}</Text>
          <Text style={styles.categoryDescription}>{group.description}</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveCustomCategory(group.id);
          }}
          style={styles.removeButton}
        >
          <X size={16} color="rgba(30, 58, 95, 0.4)" />
        </Pressable>
      </Pressable>
    );
  })}
</View>
```

**Styles:**
```typescript
sectionDescription: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
  marginBottom: 16,
  lineHeight: 18,
},
addCategoryCard: {
  backgroundColor: 'rgba(76, 175, 80, 0.05)',
  borderColor: 'rgba(76, 175, 80, 0.2)',
  marginBottom: 12,
},
addCategoryForm: {
  flexDirection: 'row',
  gap: 8,
  padding: 12,
},
categoryInput: {
  flex: 1,
},
addCategoryButtons: {
  flexDirection: 'row',
  gap: 8,
},
iconButton: {
  width: 36,
  height: 36,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
iconButtonPrimary: {
  backgroundColor: '#4CAF50',
},
iconButtonSecondary: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: 'rgba(30, 58, 95, 0.2)',
},
iconButtonDisabled: {
  opacity: 0.4,
},
categoryCard: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: 'rgba(30, 58, 95, 0.1)',
  borderRadius: 12,
  marginBottom: 12,
},
categoryCardSelected: {
  borderColor: '#4CAF50',
  backgroundColor: 'rgba(76, 175, 80, 0.05)',
},
categoryInfo: {
  flex: 1,
},
categoryName: {
  fontSize: 15,
  fontWeight: '500',
  color: '#1E3A5F',
  marginBottom: 2,
},
categoryDescription: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
},
removeButton: {
  padding: 4,
},
```

**Test Checkpoint:**
- Add category form shows/hides
- Creating custom category works
- Custom categories appear in list
- Remove button works (soft deletes)
- Input validation works

#### Step 4.5: Categories Section - Predefined Templates (30 minutes)

```typescript
const handleGroupToggle = (groupName: string, isPredefined: boolean) => {
  const willId = willActions.getWillData().userId;
  let group = beneficiaryGroupActions.getGroupByName(groupName, willId);
  
  if (!group) {
    // LAZY CREATE - group doesn't exist yet, create it now
    const template = PREDEFINED_GROUP_TEMPLATES.find(t => t.name === groupName);
    const groupId = beneficiaryGroupActions.addGroup({
      name: groupName,
      description: template?.description || 'Custom category',
      isPredefined,
      isActive: true,
      willId,
    });
    setSelectedGroupIds(prev => [...prev, groupId]);
  } else {
    // Toggle existing group
    const newActive = !group.isActive;
    beneficiaryGroupActions.setGroupActive(group.id, newActive);
    
    if (newActive) {
      setSelectedGroupIds(prev => [...prev, group.id]);
    } else {
      setSelectedGroupIds(prev => prev.filter(id => id !== group.id));
    }
  }
};

{/* Predefined Categories List */}
{PREDEFINED_GROUP_TEMPLATES.map((template) => {
  const existingGroup = beneficiaryGroupActions.getGroupByName(template.name, willId);
  const isSelected = existingGroup ? selectedGroupIds.includes(existingGroup.id) : false;
  
  return (
    <Pressable
      key={template.name}
      onPress={() => handleGroupToggle(template.name, true)}
      style={[
        styles.categoryCard,
        isSelected && styles.categoryCardSelected
      ]}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => handleGroupToggle(template.name, true)}
      />
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{template.name}</Text>
        <Text style={styles.categoryDescription}>{template.description}</Text>
      </View>
    </Pressable>
  );
})}
```

**Test Checkpoint:**
- Predefined templates render
- Lazy creation works (only creates on first select)
- Toggle works for existing groups
- Selection state persists

#### Step 4.6: Footer Implementation (15 minutes)

```typescript
{/* Footer */}
<View style={styles.footer}>
  <Button
    onPress={handleNext}
    disabled={!hasSelections}
    style={[
      styles.nextButton,
      !hasSelections && styles.nextButtonDisabled
    ]}
  >
    <Text style={[
      styles.nextButtonText,
      !hasSelections && styles.nextButtonTextDisabled
    ]}>
      Next: Residual Split
    </Text>
  </Button>
  
  {hasSelections && (
    <Text style={styles.footerCount}>
      {selectedPeopleIds.length} people and {selectedGroupIds.length} categories selected
    </Text>
  )}
</View>
```

**Styles:**
```typescript
footer: {
  padding: 24,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
},
nextButton: {
  height: 48,
  backgroundColor: '#1E3A5F',
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
nextButtonDisabled: {
  backgroundColor: 'rgba(30, 58, 95, 0.2)',
},
nextButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFFFFF',
},
nextButtonTextDisabled: {
  color: 'rgba(30, 58, 95, 0.4)',
},
footerCount: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
  textAlign: 'center',
  marginTop: 8,
},
```

**Test Checkpoint:**
- Button disabled when no selections
- Button enabled when selections exist
- Count text shows correct numbers
- Navigation works on press

---

## Step 5: EstateRemainderSplitScreen Implementation Plan

### File Location
**Path:** `native-app/app/bequeathal/estate-remainder-split.tsx`

### Screen Purpose
Allow user to adjust percentage split for each selected person/group, ensuring total equals 100%.

### Dependencies
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useAppState } from '@/src/hooks/useAppState';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Slider } from '@/src/components/ui/Slider';
import { Users, Lock, Unlock, Plus, Check, X } from 'lucide-react-native';
```

### State Structure
```typescript
interface EstateRemainderSplitScreenState {
  manualEntries: Record<string, string>;
  showAddCharity: boolean;
  charityName: string;
}
```

### Implementation Steps

#### Step 5.1: Screen Shell (30 minutes)

```typescript
export default function EstateRemainderSplitScreen() {
  const { 
    personActions, 
    beneficiaryGroupActions, 
    estateRemainderActions, 
    willActions 
  } = useAppState();

  // Local state for manual input tracking
  const [manualEntries, setManualEntries] = useState<Record<string, string>>({});
  const [showAddCharity, setShowAddCharity] = useState(false);
  const [charityName, setCharityName] = useState('');

  // Get estate remainder state from actions
  const estateState = estateRemainderActions.getEstateRemainderState();
  const { selectedPeopleIds, selectedGroupIds, splits, lockedCards } = estateState;

  // Get person/group objects
  const selectedPeople = selectedPeopleIds
    .map(id => personActions.getPersonById(id))
    .filter((person): person is Person => Boolean(person));

  // Calculate total percentage
  const totalPercentage = Object.values(splits).reduce(
    (sum, percentage) => sum + (Number.isFinite(percentage) ? percentage : 0),
    0
  );
  const remainingPercentage = 100 - totalPercentage;

  // Helper function to get person full name
  const getPersonFullName = (person: Person) => {
    return `${person.firstName} ${person.lastName}`.trim();
  };

  // Helper to clamp percentage 0-100
  const clampPercentage = (value: number) => {
    if (Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, value));
  };

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    // Navigate to next screen (bequeathal categories)
    router.push('/bequeathal/categories');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        {/* Header content */}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Equalise link */}
        {/* Recipient cards */}
        {/* Add charity section */}
      </ScrollView>

      <View style={styles.footer}>
        {/* Validation message */}
        <Button
          onPress={handleNext}
          disabled={Math.abs(remainingPercentage) > 0.1}
        >
          {/* Button text */}
        </Button>
      </View>
    </View>
  );
}
```

**Test Checkpoint:**
- Screen renders without crashes
- Estate remainder state loads correctly
- Total calculation works
- Back button navigates

#### Step 5.2: Header Implementation (15 minutes)

```typescript
<View style={styles.header}>
  <View style={styles.headerTop}>
    <BackButton onPress={handleBack} />
    <View style={styles.titleContainer}>
      <View style={styles.iconCircle}>
        <Users size={20} color="#1E3A5F" />
      </View>
      <Text style={styles.title}>Residue Split</Text>
    </View>
  </View>

  <Text style={styles.subtitle}>
    Adjust how the residual estate should be split
  </Text>
</View>
```

**Styles:**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(30, 58, 95, 0.6)',
    textAlign: 'center',
  },
});
```

#### Step 5.3: Split Update Logic (30 minutes)

```typescript
// Simple update - no lock logic needed
const updateSplit = (splitId: string, percentage: number) => {
  const clamped = clampPercentage(percentage);
  estateRemainderActions.updateSplit(splitId, clamped);
};

const handleManualInputChange = (splitId: string, value: string) => {
  setManualEntries(prev => ({
    ...prev,
    [splitId]: value
  }));
};

const handleManualInputBlur = (splitId: string) => {
  if (!(splitId in manualEntries)) return;

  const rawValue = manualEntries[splitId];
  const parsedValue = clampPercentage(parseFloat(rawValue));
  
  if (parsedValue !== splits[splitId]) {
    updateSplit(splitId, parsedValue);
  }

  // Clear from manual entries
  setManualEntries(prev => {
    const next = { ...prev };
    delete next[splitId];
    return next;
  });
};

const handleSliderChange = (splitId: string, value: number) => {
  updateSplit(splitId, value);
  
  // Clear any pending manual entry
  setManualEntries(prev => {
    if (!(splitId in prev)) return prev;
    const next = { ...prev };
    delete next[splitId];
    return next;
  });
};

// NEW: Proportional normalization to 100%
const handleMakeEqualTo100 = () => {
  const currentTotal = getTotalPercentage(splits);
  if (currentTotal === 0) return; // Prevent division by zero
  
  const scaleFactor = 100 / currentTotal;
  
  // Update all splits proportionally
  Object.keys(splits).forEach(splitId => {
    const newValue = splits[splitId] * scaleFactor;
    estateRemainderActions.updateSplit(splitId, newValue);
  });
  
  // Success haptic
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

const handleRemoveRecipient = (splitId: string) => {
  estateRemainderActions.removeRecipient(splitId);
};

// Helper to get total percentage
const getTotalPercentage = (splitsObj: Record<string, number>) => {
  return Object.values(splitsObj).reduce(
    (sum, percentage) => sum + (Number.isFinite(percentage) ? percentage : 0),
    0
  );
};
```

**Test Checkpoint:**
- Manual input updates split correctly
- Slider updates split correctly
- Make Equal to 100% proportionally adjusts all
- Remove recipient works

#### Step 5.4: Recipient Cards Implementation (45 minutes)

```typescript
// Build recipients array
interface SharingRecipient {
  splitId: string;
  label: string;
  subLabel?: string;
  avatarText?: string;
  isGroup: boolean;
}

const recipients: SharingRecipient[] = [
  ...selectedPeople.map(person => ({
    splitId: `person-${person.id}`,
    label: getPersonFullName(person),
    subLabel: person.relationship?.replace(/-/g, ' '),
    avatarText: `${person.firstName?.[0]}${person.lastName?.[0]}`,
    isGroup: false,
  })),
  ...selectedGroupIds
    .map(groupId => {
      const group = beneficiaryGroupActions.getGroupById(groupId);
      if (!group) return null;
      return {
        splitId: `group-${groupId}`,
        label: group.name,
        subLabel: 'Category',
        avatarText: group.name[0],
        isGroup: true,
      };
    })
    .filter((item): item is SharingRecipient => item !== null)
];

// Render recipient cards (SIMPLIFIED - NO LOCK BUTTONS)
{recipients.map(({ splitId, label, subLabel, avatarText, isGroup }) => {
  const percentage = splits[splitId] || 0;
  
  // Format percentage for display
  const formattedPercentage = percentage === 100 ? '100' : percentage.toFixed(1);
  const displayValue = manualEntries[splitId] ?? formattedPercentage;

  return (
    <Card key={splitId} style={styles.recipientCard}>
      <View style={styles.recipientHeader}>
        <View style={styles.recipientInfo}>
          <View style={[
            styles.avatar,
            isGroup ? styles.avatarGroup : styles.avatarPerson
          ]}>
            {isGroup ? (
              <Users size={20} color="#8B4513" />
            ) : (
              <Text style={styles.avatarText}>{avatarText}</Text>
            )}
          </View>
          <View style={styles.recipientLabels}>
            <Text style={styles.recipientName}>{label}</Text>
            {subLabel && (
              <Text style={styles.recipientSubLabel}>{subLabel}</Text>
            )}
          </View>
        </View>

        {/* Percentage Input - NO LOCK BUTTON */}
        <View style={styles.percentageInputContainer}>
          <TextInput
            value={displayValue}
            onChangeText={(value) => handleManualInputChange(splitId, value)}
            onBlur={() => handleManualInputBlur(splitId)}
            keyboardType="numeric"
            style={styles.percentageInput}
            placeholder="0"
          />
          <Text style={styles.percentageSymbol}>%</Text>
        </View>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          value={percentage}
          onValueChange={(value) => handleSliderChange(splitId, value)}
          minimumValue={0}
          maximumValue={100}
          step={0.1}
          style={styles.slider}
        />
        
        {/* Show Remove link when allocation is 0 */}
        {percentage < 0.1 && (
          <Pressable
            onPress={() => handleRemoveRecipient(splitId)}
            style={styles.removeLink}
          >
            <Text style={styles.removeLinkText}>Remove</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
})}
```

**Styles:**
```typescript
recipientCard: {
  padding: 16,
  marginBottom: 12,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: 'rgba(30, 58, 95, 0.1)',
  borderRadius: 16,
},
recipientHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
recipientInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  flex: 1,
},
avatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
},
avatarPerson: {
  backgroundColor: 'rgba(76, 175, 80, 0.1)',
},
avatarGroup: {
  backgroundColor: 'rgba(139, 69, 19, 0.1)',
},
avatarText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#4CAF50',
},
recipientLabels: {
  flex: 1,
},
recipientName: {
  fontSize: 15,
  fontWeight: '500',
  color: '#1E3A5F',
  marginBottom: 2,
},
recipientSubLabel: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
  textTransform: 'capitalize',
},
recipientControls: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
lockButton: {
  padding: 8,
},
percentageInputContainer: {
  position: 'relative',
  width: 96,
},
percentageInput: {
  height: 36,
  paddingLeft: 8,
  paddingRight: 28,
  fontSize: 15,
  color: '#1E3A5F',
  borderWidth: 1,
  borderColor: 'rgba(30, 58, 95, 0.2)',
  borderRadius: 8,
  textAlign: 'right',
},
percentageInputDisabled: {
  backgroundColor: '#F9FAFB',
  color: 'rgba(30, 58, 95, 0.4)',
},
percentageSymbol: {
  position: 'absolute',
  right: 8,
  top: 8,
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
},
sliderContainer: {
  marginTop: 8,
},
slider: {
  width: '100%',
},
helperText: {
  fontSize: 11,
  color: 'rgba(30, 58, 95, 0.6)',
  textAlign: 'center',
  marginTop: 8,
},
removeLink: {
  alignSelf: 'center',
  marginTop: 8,
  padding: 4,
},
removeLinkText: {
  fontSize: 11,
  color: '#EF4444',
  textDecorationLine: 'underline',
},
```

**Test Checkpoint:**
- Recipient cards render correctly
- Manual input updates work
- Slider updates work
- Remove link appears/works when percentage < 0.1

#### Step 5.5: "Make Equal to 100%" Button (25 minutes)

```typescript
{/* Show "Make Equal to 100%" button when NOT at 100% */}
{Math.abs(remainingPercentage) > 0.1 && recipients.length > 0 && (
  <Card style={styles.normalizeCard}>
    <View style={styles.normalizeContent}>
      <View>
        <Text style={styles.normalizeTitle}>
          {remainingPercentage > 0 
            ? `Under allocated by ${remainingPercentage.toFixed(1)}%`
            : `Over allocated by ${Math.abs(remainingPercentage).toFixed(1)}%`}
        </Text>
        <Text style={styles.normalizeSubtext}>
          Proportionally adjust all allocations to total 100%
        </Text>
      </View>
      <Button
        onPress={handleMakeEqualTo100}
        style={styles.normalizeButton}
      >
        <Text style={styles.normalizeButtonText}>
          Make Equal to 100%
        </Text>
      </Button>
    </View>
  </Card>
)}
```

**Styles:**
```typescript
normalizeCard: {
  padding: 16,
  marginBottom: 16,
  backgroundColor: 'rgba(76, 175, 80, 0.05)',
  borderColor: 'rgba(76, 175, 80, 0.2)',
  borderWidth: 1,
},
normalizeContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
},
normalizeTitle: {
  fontSize: 15,
  fontWeight: '600',
  color: '#1E3A5F',
  marginBottom: 4,
},
normalizeSubtext: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
},
normalizeButton: {
  backgroundColor: '#4CAF50',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
},
normalizeButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
},
```

**Test Checkpoint:**
- "Make Equal to 100%" button appears when total ≠ 100%
- Button proportionally adjusts all allocations
- Haptic feedback fires on press
- Button hides when total = 100%

#### Step 5.6: Add Charity Section (30 minutes)

```typescript
const handleAddCharity = () => {
  if (charityName.trim()) {
    const willId = willActions.getWillData().userId;
    const groupId = beneficiaryGroupActions.addGroup({
      name: charityName.trim(),
      description: 'Charity',
      isPredefined: false,
      isActive: true,
      willId,
    });
    
    // Add to estate remainder state
    const updatedGroupIds = [...selectedGroupIds, groupId];
    estateRemainderActions.updateSelectedBeneficiaries(
      selectedPeopleIds, 
      updatedGroupIds
    );
    
    setCharityName('');
    setShowAddCharity(false);
  }
};

{/* Add Charity Section */}
<View style={styles.addCharitySection}>
  {!showAddCharity ? (
    <Pressable
      onPress={() => setShowAddCharity(true)}
      style={styles.addCharityButton}
    >
      <Plus size={14} color="#4CAF50" />
      <Text style={styles.addCharityButtonText}>Add Charity</Text>
    </Pressable>
  ) : (
    <Card style={styles.addCharityCard}>
      <View style={styles.addCharityForm}>
        <Input
          value={charityName}
          onChangeText={setCharityName}
          placeholder="Enter charity name"
          style={styles.charityInput}
          onSubmitEditing={handleAddCharity}
        />
        <View style={styles.addCharityButtons}>
          <Pressable
            onPress={handleAddCharity}
            disabled={!charityName.trim()}
            style={[
              styles.iconButton,
              styles.iconButtonPrimary,
              !charityName.trim() && styles.iconButtonDisabled
            ]}
          >
            <Check size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => {
              setShowAddCharity(false);
              setCharityName('');
            }}
            style={[styles.iconButton, styles.iconButtonSecondary]}
          >
            <X size={16} color="#1E3A5F" />
          </Pressable>
        </View>
      </View>
    </Card>
  )}
</View>
```

**Styles:**
```typescript
addCharitySection: {
  marginTop: 16,
},
addCharityButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  padding: 8,
  alignSelf: 'flex-start',
},
addCharityButtonText: {
  fontSize: 13,
  color: '#4CAF50',
},
addCharityCard: {
  backgroundColor: 'rgba(76, 175, 80, 0.05)',
  borderColor: 'rgba(76, 175, 80, 0.2)',
},
addCharityForm: {
  flexDirection: 'row',
  gap: 8,
  padding: 12,
},
charityInput: {
  flex: 1,
},
addCharityButtons: {
  flexDirection: 'row',
  gap: 8,
},
iconButton: {
  width: 36,
  height: 36,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
iconButtonPrimary: {
  backgroundColor: '#4CAF50',
},
iconButtonSecondary: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: 'rgba(30, 58, 95, 0.2)',
},
iconButtonDisabled: {
  opacity: 0.4',
},
```

**Test Checkpoint:**
- Add charity button toggles form
- Input accepts text
- Check/X buttons work
- Charity added to splits
- Form resets after add

#### Step 5.7: Footer with Validation (30 minutes)

```typescript
{/* Footer */}
<View style={styles.footer}>
  {/* Over-allocation warning */}
  {remainingPercentage < -0.1 && (
    <Card style={styles.overAllocationCard}>
      <Text style={styles.overAllocationTitle}>
        You've allocated more than 100%
      </Text>
      <Text style={styles.overAllocationText}>
        Please reduce allocations by {Math.abs(remainingPercentage).toFixed(1)}%
      </Text>
    </Card>
  )}
  
  <Button
    onPress={handleNext}
    disabled={Math.abs(remainingPercentage) > 0.1}
    style={[
      styles.nextButton,
      Math.abs(remainingPercentage) > 0.1 && styles.nextButtonDisabled
    ]}
  >
    <Text style={[
      styles.nextButtonText,
      Math.abs(remainingPercentage) > 0.1 && styles.nextButtonTextDisabled
    ]}>
      {Math.abs(remainingPercentage) <= 0.1 
        ? 'Continue' 
        : remainingPercentage > 0.1 
        ? `Allocate remaining ${remainingPercentage.toFixed(1)}%` 
        : 'Reduce allocation to continue'}
    </Text>
  </Button>
  
  {Math.abs(remainingPercentage) > 0.1 && remainingPercentage > 0 && (
    <Text style={styles.footerHelper}>
      You must allocate 100% of the residual to continue
    </Text>
  )}
</View>
```

**Styles:**
```typescript
footer: {
  padding: 24,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
},
overAllocationCard: {
  padding: 12,
  backgroundColor: 'rgba(139, 69, 19, 0.1)',
  borderColor: 'rgba(139, 69, 19, 0.2)',
  marginBottom: 12,
},
overAllocationTitle: {
  fontSize: 14,
  fontWeight: '500',
  color: '#8B4513',
  textAlign: 'center',
  marginBottom: 4,
},
overAllocationText: {
  fontSize: 12,
  color: 'rgba(139, 69, 19, 0.7)',
  textAlign: 'center',
},
nextButton: {
  height: 48,
  backgroundColor: '#1E3A5F',
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
nextButtonDisabled: {
  backgroundColor: 'rgba(30, 58, 95, 0.2)',
},
nextButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFFFFF',
},
nextButtonTextDisabled: {
  color: 'rgba(30, 58, 95, 0.4)',
},
footerHelper: {
  fontSize: 13,
  color: 'rgba(30, 58, 95, 0.6)',
  textAlign: 'center',
  marginTop: 8,
},
```

**Test Checkpoint:**
- Warning shows when over 100%
- Button disabled unless total = 100% (±0.1)
- Button text changes based on state
- Helper text shows when appropriate
- Navigation works when valid

---

## Step 6: Integration & Testing

### Integration Points

#### 6.1: Add Route to Navigation (5 minutes)
**File:** `native-app/app/_layout.tsx` or relevant router config

Ensure routes exist:
- `/bequeathal/estate-remainder-who`
- `/bequeathal/estate-remainder-split`

#### 6.2: Add to Onboarding Flow (10 minutes)
**File:** Where onboarding flow is managed

Insert between guardianship and asset allocation:
```
guardian-wishes 
  → estate-remainder-who 
  → estate-remainder-split 
  → bequeathal-categories
```

#### 6.3: Add to Order of Things (10 minutes)
**File:** `native-app/app/order-of-things.tsx`

Add section between guardianship and specific assets:
```typescript
{
  title: "Estate Residue",
  description: "Who inherits everything not specifically gifted",
  completed: checkEstateRemainderComplete(),
  onPress: () => router.push('/bequeathal/estate-remainder-who'),
}
```

Helper function:
```typescript
const checkEstateRemainderComplete = () => {
  const state = estateRemainderActions.getEstateRemainderState();
  const totalPercentage = Object.values(state.splits).reduce(
    (sum, p) => sum + (Number.isFinite(p) ? p : 0), 0
  );
  return Math.abs(totalPercentage - 100) <= 0.1;
};
```

### Testing Checklist

#### Manual Testing Sequence

**Test 1: Fresh Estate Remainder Flow**
1. Start from clean state (no previous residue data)
2. Navigate to `estate-remainder-who`
3. ✅ Header displays correctly
4. ✅ No people/groups selected initially
5. ✅ Next button disabled
6. ✅ Add 2 people, select them
7. ✅ Add 1 custom category
8. ✅ Select 1 predefined category (Children)
9. ✅ Next button enabled
10. ✅ Count shows "2 people and 2 categories selected"
11. Press Next → navigates to split screen
12. ✅ Split screen shows 4 cards (2 people + 2 groups)
13. ✅ All initialized to 25% each
14. ✅ All unlocked initially
15. ✅ Total = 100%, button enabled

**Test 2: Manual Split Adjustment**
1. On split screen with 4 recipients at 25% each (default equal split)
2. Adjust first person to 50% (via slider)
3. ✅ Total now = 125% (over allocated)
4. ✅ "Make Equal to 100%" button appears
5. Manually type 30 into second person input
6. ✅ Input updates, no auto-lock
7. ✅ Total now = 130%
8. ✅ Button still visible

**Test 3: "Make Equal to 100%" Function**
1. Have 4 recipients: 50%, 30%, 30%, 10% (Total: 120%)
2. ✅ "Make Equal to 100%" button visible
3. ✅ Shows "Over allocated by 20.0%"
4. Press button
5. ✅ Proportional adjustment:
   - 50% → 41.7%
   - 30% → 25.0%
   - 30% → 25.0%
   - 10% → 8.3%
6. ✅ Total = 100%
7. ✅ Button disappears
8. ✅ Haptic feedback fires

**Test 4: Under-Allocation Normalization**
1. Have 3 recipients: 30%, 25%, 20% (Total: 75%)
2. ✅ "Make Equal to 100%" button visible
3. ✅ Shows "Under allocated by 25.0%"
4. Press button
5. ✅ Proportional adjustment:
   - 30% → 40.0%
   - 25% → 33.3%
   - 20% → 26.7%
6. ✅ Total = 100%
7. ✅ Continue button enabled

**Test 5: Remove Recipient**
1. Adjust one recipient to 0%
2. ✅ "Remove" link appears
3. Press Remove
4. ✅ Card disappears
5. ✅ Percentage redistributes to remaining
6. ✅ Total remains 100%

**Test 6: Add Charity**
1. On split screen with existing allocations
2. Press "+ Add Charity"
3. ✅ Form appears
4. Type "RSPCA"
5. Press check button
6. ✅ New card appears with 0%
7. ✅ Other allocations unchanged
8. Adjust RSPCA to 10%
9. ✅ Other unlocked cards adjust proportionally
10. ✅ Total = 100%

**Test 7: Validation States**
1. Adjust allocations to total 95%
2. ✅ Button disabled
3. ✅ Button text: "Allocate remaining 5.0%"
4. ✅ Helper text visible
5. Adjust to total 105%
6. ✅ Button disabled
7. ✅ Warning card visible
8. ✅ Button text: "Reduce allocation to continue"
9. Adjust back to 100%
10. ✅ Button enabled
11. ✅ Button text: "Continue"

**Test 8: Persistence**
1. Complete estate remainder flow
2. Press Continue
3. Navigate away
4. Return to `estate-remainder-who`
5. ✅ Previous selections still checked
6. Navigate to `estate-remainder-split`
7. ✅ Previous percentages and locks preserved
8. Make changes
9. Press back
10. Return to split screen
11. ✅ Changes persisted

**Test 9: Empty States**
1. Navigate to who screen with no people in system
2. ✅ Empty state card shows
3. ✅ "Add someone above to get started" text
4. Add person inline
5. ✅ Person appears in list
6. ✅ Auto-selected

**Test 10: Edge Cases**
1. Select only 1 person
2. Navigate to split
3. ✅ Shows at 100%
4. ✅ Lock button works
5. ✅ Slider disabled (only one card)
6. ✅ Helper text visible
7. Add charity
8. ✅ Both recipients now adjustable
9. Delete charity (reduce to 0%)
10. ✅ Back to one recipient at 100%

### AsyncStorage Verification

After completing both screens, check Developer Dashboard:

**Expected Structure:**
```json
{
  "estateRemainderData": {
    "selectedPeopleIds": ["person-id-1", "person-id-2"],
    "selectedGroupIds": ["group-id-1", "group-id-2"],
    "splits": {
      "person-person-id-1": 40,
      "person-person-id-2": 30,
      "group-group-id-1": 20,
      "group-group-id-2": 10
    },
    "lockedCards": {
      "person-person-id-1": true,
      "person-person-id-2": false,
      "group-group-id-1": false,
      "group-group-id-2": true
    },
    "lastUpdated": "2024-12-13T10:30:00.000Z"
  },
  "beneficiaryGroups": [
    {
      "id": "group-id-1",
      "name": "Children",
      "description": "All your children",
      "isPredefined": true,
      "isActive": true,
      "willId": "will-maker-id",
      "createdAt": "2024-12-13T10:25:00.000Z",
      "updatedAt": "2024-12-13T10:25:00.000Z"
    },
    {
      "id": "group-id-2",
      "name": "Godchildren",
      "description": "Custom category",
      "isPredefined": false,
      "isActive": true,
      "willId": "will-maker-id",
      "createdAt": "2024-12-13T10:26:00.000Z",
      "updatedAt": "2024-12-13T10:26:00.000Z"
    }
  ]
}
```

### TypeScript Compilation Check

```bash
cd native-app
npx tsc --noEmit
```

**Expected:** No errors related to:
- `EstateRemainderState`
- `BeneficiaryGroup`
- `estateRemainderActions`
- `beneficiaryGroupActions`

---

## Step 7: Future Enhancements (Post-MVP)

### Nice-to-Have Features (Not in Web Prototype)

1. **Visual Estate Pie Chart**
   - Show percentage distribution visually
   - Color-coded segments per recipient
   - Real-time updates as sliders move

2. **Estimated Value Display**
   - Calculate residue value based on total estate and specific gifts
   - Show estimated £ amount next to percentage
   - Example: "40% (approx £340,000)"

3. **Conflict Detection**
   - Warn if person appears in both specific gift and residue
   - "John is receiving property AND 20% of residue"
   - Suggest consolidation

4. **Templates/Presets**
   - "Split equally among children"
   - "All to spouse"
   - "50/50 spouse and children"
   - One-tap application

5. **Undo/Redo**
   - Stack of allocation states
   - Undo button to revert changes
   - Useful if equalise creates unwanted split

6. **Beneficiary Notes**
   - Add free-text note to each allocation
   - "Alice gets 40% because she's primary caregiver"
   - Display in will summary

7. **Conditional Allocations**
   - "If Alice predeceases me, her share goes to Bob"
   - Advanced logic for edge cases
   - Requires new data model

### Known Limitations

1. **No fractional percentages in UI**
   - Web prototype allows 0.1% precision
   - Native app uses same (good)
   - But small screens may make slider adjustment difficult

2. **No bulk operations**
   - Can't select multiple cards and lock/unlock together
   - Can't apply percentage to multiple at once

3. **No allocation history**
   - Can't see previous allocation attempts
   - Can't compare different scenarios side-by-side

4. **No validation warnings for tax implications**
   - Giving 100% to non-spouse may trigger IHT
   - App doesn't warn about tax efficiency
   - Future: integrate with estate value calculator

---

## Implementation Timeline

**Estimated Total: 10-12 hours** (reduced from 12-14 by removing lock/unlock complexity)

### Session 0 (45 minutes): Slider Component Setup
- ✅ Install @react-native-community/slider (5 min)
- ✅ Implement functional Slider component (30 min)
- ✅ Test slider in isolation (10 min)

**Critical:** Must complete before starting Split Screen

### Session 1 (4 hours): EstateRemainderWhoScreen
- ✅ Step 4.1: Screen shell (30 min)
- ✅ Step 4.2: Header (15 min)
- ✅ Step 4.3: People section (45 min)
- ✅ Step 4.4: Custom categories (30 min)
- ✅ Step 4.5: Predefined categories (30 min)
- ✅ Step 4.6: Footer (15 min)
- ✅ Test 1-3: Basic functionality (45 min)

**Break/Review Point:** Manual test all features, fix bugs

### Session 2 (4 hours): EstateRemainderSplitScreen (SIMPLIFIED)
- ✅ Step 5.1: Screen shell (30 min)
- ✅ Step 5.2: Header (15 min)
- ✅ Step 5.3: Split logic WITHOUT locks (30 min) ⬇️ reduced from 45
- ✅ Step 5.4: Recipient cards simplified (45 min) ⬇️ reduced from 60
- ✅ Step 5.5: "Make Equal to 100%" button (25 min) ⬆️ new feature
- ✅ Step 5.6: Add charity (30 min)
- ✅ Step 5.7: Footer with validation (30 min)
- ✅ Test 4-7: Split mechanics (45 min) ⬇️ reduced from 60

**Break/Review Point:** Manual test all split features

### Session 3 (2.5 hours): Integration, Animations & Polish
- ✅ Step 6.1: Add routes (5 min)
- ✅ Step 6.2: Onboarding integration (10 min)
- ✅ Step 6.3: Order of things (10 min)
- ✅ Add 100% achievement haptic (15 min) ⬆️ new
- ✅ Add normalize animation (20 min) ⬆️ new
- ✅ Test 8-10: Edge cases and persistence (60 min)
- ✅ AsyncStorage verification (15 min)
- ✅ Final polish and bug fixes (35 min)

---

## Success Criteria

### Must Have (MVP)
- ✅ User can select people and categories to share residue
- ✅ User can adjust percentage split via slider + manual input
- ✅ Total must equal 100% before proceeding
- ✅ "Make Equal to 100%" button proportionally adjusts all allocations
- ✅ Haptic feedback when achieving 100%
- ✅ Add charity inline
- ✅ Remove recipient when allocation = 0%
- ✅ Lazy group creation (only create when selected)
- ✅ State persists across navigation
- ✅ Validation prevents progression when invalid

### Should Have (Included in MVP)
- ✅ Functional Slider component
- ✅ Spring animation on normalization
- ✅ Visual percentage indicators (slider track)
- ⚠️ Estimated £ values next to percentages (future)

### Nice to Have (Future)
- ➖ Pie chart visualization
- ➖ Allocation templates
- ➖ Undo/redo functionality
- ➖ Tax efficiency warnings
- ➖ Conditional allocations

---

## Dependencies & Prerequisites

### Before Starting Implementation

1. ✅ **Verify types exist**
   - `EstateRemainderState` interface
   - `BeneficiaryGroup` interface
   - All action interfaces

2. ✅ **Verify actions work**
   - `estateRemainderActions` methods
   - `beneficiaryGroupActions` methods
   - `personActions` methods

3. ✅ **Verify components available**
   - Slider, Checkbox, Card, Input, Button
   - PersonSelector, GroupManagementDrawer (if using)

4. ✅ **Verify constants exist**
   - `PREDEFINED_GROUP_TEMPLATES`

### External Dependencies

```json
{
  "expo-router": "^latest",
  "react-native": "^latest",
  "lucide-react-native": "^latest"
}
```

All dependencies already in project.

---

## Rollback Plan

If implementation blocked or problematic:

**Option 1: Simplify to Single Screen**
- Combine who + split into one screen
- Show people/groups with inline percentage inputs
- No fancy lock/unlock, just direct entry
- Still must total 100%

**Option 2: Skip Residue in Onboarding**
- Make residue allocation optional
- User can complete will without it
- Add "Estate Residue" to Order of Things for later completion
- Default: equal split among all beneficiaries

**Option 3: Use Existing BeneficiaryWithPercentages**
- Reuse `BeneficiaryWithPercentages` component
- Less custom UI, more code reuse
- May lose some UX polish
- Faster implementation

---

## Questions for User

1. **Navigation flow confirmed?**
   - guardian-wishes → estate-remainder-who → estate-remainder-split → bequeathal-categories
   - OR should residue come after specific gifts?

2. **Required or optional?**
   - Can user skip residue allocation in onboarding?
   - Or must they allocate before proceeding?

3. **Default behavior when no allocation?**
   - If user skips, what's the legal default?
   - Equal split among all beneficiaries?
   - Follow intestacy rules?

4. **Mock estate value?**
   - Web prototype shows mock £850k residual value
   - Should native app show estimated value?
   - Or just percentages for now?

---

## End of Plan

**Next Action:** Review this plan, confirm approach, then begin Session 1 (EstateRemainderWhoScreen implementation).

