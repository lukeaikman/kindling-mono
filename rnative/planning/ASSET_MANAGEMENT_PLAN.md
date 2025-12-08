# Asset Management Implementation Plan

## Analysis Summary

### Data Structures (from [web-prototype/src/types.ts](web-prototype/src/types.ts))

**Asset Types (10 total):**
1. `property` - Most complex (2000+ lines, trusts, mortgages, ownership)
2. `bank-accounts` - Simple (provider, type, balance, ownership)
3. `investment` - Moderate (provider, type, value, beneficiary)
4. `pensions` - Moderate (provider, type, value, beneficiary status)
5. `life-insurance` - Moderate (provider, policy, beneficiaries array)
6. `private-company-shares` - Moderate (company, shares, IHT planning)
7. `assets-held-through-business` - Complex (business linkage, asset types)
8. `agricultural-assets` - Very complex (APR/BPR fields, ownership, usage)
9. `crypto-currency` - Simple (type, platform, quantity, value)
10. `important-items` - Simple (title, beneficiaries, value)

**Key Data Structure Patterns:**
- All assets extend `BaseAsset` (id, type, title, description, estimatedValue, netValue, beneficiaryId, heldInTrust)
- Assets stored in `BequeathalData` object with arrays per type
- `selectedCategories` stored as Set<string>
- Beneficiary assignments can be: single ID, multiple IDs, or group IDs

### Identified Incoherences

**1. Property Asset Complexity**
- PropertyAsset interface has `basicDetails` nested object AND top-level fields (duplication)
- Lines 330-362: Redundant data between nested and flat structure

**2. Beneficiary Assignment Inconsistency**
- `ImportantItemAsset` has both `beneficiaryId` (legacy) and `beneficiaryAssignments` (new)
- Lines 369-378: Migration pattern exists but inconsistent across types

**3. Missing Fields**
- `PensionAsset` has no `accountNumber` but others do
- `CryptoCurrencyAsset` lacks `heldInTrust` usage patterns - WHICH IS FINE

**4. Ownership Type Variations**
- Property: `ownershipType` = 'sole' | 'joint-tenants' | 'tenants-in-common'
- Bank Account: `ownershipType` = 'personal' | 'joint'
- No consistency across asset types -- WHICH IS FINE

**5. Value Field Naming**
- Some use `estimatedValue`, some use `currentValue`, some use `currentBalance` -- WHICH IS FINE
- All map to BaseAsset.estimatedValue eventually but entry forms vary 

### Screen Flow Pattern

**Common Pattern (from web prototype):**
```
BequeathalIntro → BequeathalCategories → [For Each Selected]:
  {AssetType}Intro → {AssetType}Entry → [Next Category or Done]
```

**Intro Screen Structure:**
- Video player (dismissible)
- Information content sections
- "Start" and "Skip" buttons
- Morphic background (consistent design)

**Entry Screen Structure:**
- Form at top (expandable/collapsible)
- List of added assets below
- Add/Edit/Delete operations
- Total value summary
- "Add Another" and "Continue" buttons

---

## Phase 1-2: Foundation & Analysis ✅ COMPLETE

### Task 1.1: Data Structure Analysis Document ✅
Created `native-app/planning/ASSET_MANAGEMENT_ANALYSIS.md`:
- ✅ Complete asset type breakdown
- ✅ Field-by-field comparison table
- ✅ Identified incoherences with recommendations
- ✅ Migration strategy for inconsistent patterns

### Task 1.2: Type Definitions ✅
`native-app/src/types/index.ts`:
- ✅ All asset interfaces already present from web prototype
- ✅ Beneficiary assignment format documented (use new format)
- ✅ Asset types validated and ready
- ✅ JSDoc documentation present

### Task 1.3: Utility Functions ✅
Created `native-app/src/utils/assetHelpers.ts`:
- ✅ Value formatting functions (formatCurrency, parseCurrency)
- ✅ Asset validation logic (isAssetValid, isAssetComplete)
- ✅ Default value generators per type (getDefaultAsset)
- ✅ Asset summary calculations (calculateTotalValue, groupAssetsByType)

---

## Phase 3: Bequeathal Intro Screen ✅ COMPLETE

### Task 3.1: Create Intro Screen ✅
File: `native-app/app/bequeathal/intro.tsx`

**Components created:**
- ✅ InformationCard component (`src/components/ui/InformationCard.tsx`)
- ✅ Header with back button + icon (Gift icon)
- ✅ VideoPlayer component (YouTube embed)
- ✅ Information cards (Scary Facts, Why Important)
- ✅ Action button ("Let's Go")
- ✅ Morphic background styling (5 blobs matching pattern)

**Content:**
- ✅ "What To Give?" title
- ✅ Video: Introduction to asset management
- ✅ Info cards: Scary Facts (3 bullets), Why Important (3 numbered items)
- ✅ Navigate to category selection (/bequeathal/categories)

**Navigation integration:**
- ✅ Added to order-of-things.tsx ("Assets & Bequests" option)

---

## Phase 4: Category Selection Screen ✅ COMPLETE

### Task 4.1: Create Category Selection Screen ✅
File: `native-app/app/bequeathal/categories.tsx`

**Completed:**
- ✅ Category selection screen with 10 asset categories
- ✅ Split into "What makes up your estate?" and "Paid on death" sections
- ✅ Checkbox circles on right with on-brand styling (beige/cream/green)
- ✅ State management via bequeathalActions (getSelectedCategories, setSelectedCategories, toggleCategory)
- ✅ AsyncStorage persistence
- ✅ Continue button (disabled when none selected)
- ✅ Inline video at top of screen
- ✅ Morphic background

### Task 4.2: Create Placeholder Screens for All Asset Types ✅
Created 20 placeholder screens (10 asset types × intro + entry):
- ✅ `app/bequeathal/bank-accounts/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/important-items/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/crypto-currency/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/investment/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/pensions/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/life-insurance/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/private-company-shares/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/assets-held-through-business/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/agricultural-assets/` (intro.tsx, entry.tsx)
- ✅ `app/bequeathal/property/` (intro.tsx, entry.tsx)

All placeholders use consistent header structure and basic navigation wiring.

---

## Phase 5: Bank Accounts Implementation (SIMPLE - 1-2 days)

**Reference:** Web prototype `BankAccountsIntroScreen.tsx` and `BankAccountsEntryScreen.tsx`

### Task 5.1: Bank Accounts Intro Screen
File: `native-app/app/bequeathal/bank-accounts/intro.tsx`

**Content (from web prototype):**
- Header: "Bank Accounts" with piggy-bank icon
- Optional video player (inline at top, NOT modal)
- InformationCard: "Estimate the Balances"
  - "Here we do a quick brain dump of what you've got so you can see your net worth and how this will be divided on your passing."
  - "You don't need the exact balances."
  - "If you want exact balances - later, Kindling will allow you to connect your bank accounts so that you always have a live view of your net worth."
  - External link: "Learn more about bank accounts in wills"
- Primary button: "Let's Go" → `/bequeathal/bank-accounts/entry`
- Skip button: "Skip for now" → next category or `/order-of-things`

**Components:**
- VideoPlayer (inline embed, NOT modal - already updated in intro.tsx)
- InformationCard (existing component)
- Button (existing component)

**Effort:** 1-2 hours

### Task 5.2: Bank Accounts Entry Screen
File: `native-app/app/bequeathal/bank-accounts/entry.tsx`

**Data Structure (from native-app types):**
```typescript
interface BankAccountAsset extends BaseAsset {
  type: 'bank-accounts';
  accountType: string;        // current, savings, isa, fixed-term, other
  provider: string;           // Bank name
  accountNumber?: string;     // UK banks only, 3-8 digits
  sortCode?: string;          // UK banks only
  ownershipType?: 'personal' | 'joint';
  isNonUkBank?: boolean;
}

interface InvestmentAsset extends BaseAsset {
  type: 'investment';
  investmentType: string;     // "ISA" when migrated from bank accounts
  provider: string;           // Bank name
  accountNumber?: string;     // Account number
}
```

**ISA HANDLING DECISION:**
When user selects "ISA" as account type:
- Save as `type: 'investment'` (InvestmentAsset) NOT bank-accounts
- Map fields: `investmentType: 'ISA'`, `provider: [bank name]`, `accountNumber: [account number]`
- Display in bank accounts list with note: "This will appear under Investments in future screens"
- TODO Phase 8 (Investments): Load and display ISAs alongside other investments
- TODO Phase 8: Consider migrating any ISAs saved as bank-accounts (backward compatibility)

**Form Fields (from web prototype + clarifications):**
1. **Bank Provider** (SearchableSelectField - MUST be searchable)
   - Dropdown with UK banks: Barclays, HSBC, Lloyds, NatWest, Santander, TSB, Halifax, Bank of Scotland, Nationwide, Coventry BS, Yorkshire BS, Skipton BS, Leeds BS, Principality BS, Newcastle BS, Virgin Money, First Direct, Metro Bank, Starling, Monzo, Revolut, Chase, Atom Bank, Tide, Co-operative Bank, Other
   - "Non UK Bank" option at top (triggers conditional fields)
   - Separator line after "Non UK Bank"

2. **Conditional: Non-UK Bank Fields** (shown when "Non UK Bank" selected)
   - Bank Name (text input) - REQUIRED
   - Account ID (text input) - optional
   - Notes (textarea) - "Any other helpful details, e.g. sort code, Routing Number, Branch Number, Private Banker Details, etc"

3. **Account Type** (SearchableSelectField)
   - Options: Current Account, Savings Account, ISA, Fixed Term Deposit, Other
   - NOTE: If ISA selected, save as InvestmentAsset instead

4. **Ownership Type** (SearchableSelectField)
   - Options: Personal Account, Joint Account
   - CONDITIONAL: Hide if ISA selected (ISAs are always personal by UK law)
   - Default when hidden: Don't set (InvestmentAsset doesn't have ownershipType field)

5. **Account Number** (text input)
   - Only shown for UK banks (when NOT "Non UK Bank")
   - Optional field
   - Placeholder: "12345678"
   - Validation: 3-8 digits, numeric only

6. **Estimated Balance** (CurrencyInput)
   - Currency input with £ symbol
   - "Not sure" button (toggles value)
   - Round to nearest £1 when saving (standard rounding: 0.5 rounds up)
   - Privacy note: "IMPORTANT: This is only stored on your phone and never on our servers - it allows us to estimate your inheritance tax and help structure your estate"

**UI Behavior:**
- Form starts VISIBLE if no accounts exist
- Form HIDDEN after first account added (shows "Add Another Account" button)
- List shows: bank name, account type, account number (if UK), balance
- ISAs shown in list with badge: "Will appear under Investments"
- Accounts shown in collapsible card with eye icon to hide/show
- Total accounts value displayed in footer (includes ISAs for now)
- Edit/Delete buttons on each account card

**Validation:**
- Bank provider REQUIRED
- If "Non UK Bank", bank name REQUIRED
- Account type REQUIRED (default: 'current')
- Ownership type REQUIRED when visible (default: 'personal'), HIDDEN when ISA selected
- Account number: 3-8 digits, numeric only (UK banks only)
- Balance optional ("Not sure" = £0), rounded to nearest £1 on save

**State Management:**
- Load existing accounts via `bequeathalActions.getAssetsByType('bank-accounts')`
- Load ISAs via `bequeathalActions.getAssetsByType('investment')` filtered by `investmentType === 'ISA'`
- **Add logic:**
  - If accountType === 'isa': `bequeathalActions.addAsset('investment', { investmentType: 'ISA', provider, accountNumber, estimatedValue })`
  - Else: `bequeathalActions.addAsset('bank-accounts', assetData)`
- Remove account via `bequeathalActions.removeAsset(id)`
- Calculate total: `accounts.reduce((sum, acc) => sum + acc.estimatedValue, 0)` + ISAs total

**Navigation:**
- Back → `/bequeathal/bank-accounts/intro`
- Continue → Next selected category's intro OR `/order-of-things`

**Components Needed:**
- SearchableSelectField → Create or use Select component
- CurrencyInput (existing)
- Input (existing)
- Textarea → Create or use Input with multiline
- Card (existing)
- Button (existing)

**Effort:** 4-6 hours

---

## Phase 6: Important Items Implementation (SIMPLE - 1-2 days)

**Reference:** Web prototype `ImportantItemsIntroScreen.tsx` and `ImportantItemsEntryScreen.tsx`

### Task 6.1: Important Items Intro Screen
File: `native-app/app/bequeathal/important-items/intro.tsx`

**Content (from web prototype):**
- Header: "Important Items" with gem/diamond icon
- Optional video player (inline at top)
- InformationCard: "Your Valuable Possessions"
  - "Typically your items are left to your 'estate'. That means they are split by the Executor across your beneficiaries in the proportions you dictate."
  - "It is important to list specific items if they are:"
    1. "Very valuable (preventing them 'disappearing', and/or ensuring special care is taken by executors to have them valued and sold appropriately)"
    2. "You want a specific person to inherit them"
  - "If you have anything specifically insured, it should be listed."
  - "Including these details prevents family disputes and ensures your wishes."
- Primary button: "Start Adding Important Items" → `/bequeathal/important-items/entry`
- Skip button: "Skip for now" → next category or `/order-of-things`

**Effort:** 1-2 hours

### Task 6.2: Important Items Entry Screen
File: `native-app/app/bequeathal/important-items/entry.tsx`

**Data Structure (from native-app types - category field REMOVED):**
```typescript
interface ImportantItemAsset extends BaseAsset {
  type: 'important-items';
  specificDetails?: string;
  sentimentalValue?: boolean;
  beneficiaryAssignments?: {
    beneficiaries: Array<{
      id: string;
      type: 'person' | 'group' | 'estate';
      name?: string;
    }>;
  };
}
```

**Form Fields (from web prototype):**
1. **What's the item?** (text input)
   - Placeholder: "e.g., Wedding ring, Painting, Car"
   - REQUIRED

2. **Who will receive this?** (PersonSelectorField - multi-select)
   - Mode: 'multi'
   - Roles: ['beneficiary']
   - Allow groups: true
   - Allow estate: true
   - REQUIRED (at least one beneficiary)
   - Returns: `SelectedPerson[]` format

3. **What's it worth?** (CurrencyInput)
   - Estimated value
   - REQUIRED

**UI Behavior:**
- Form ALWAYS VISIBLE at top in a card
- "Add New Item" or "Edit Item" mode (controlled by `isEditing` state)
- Edit mode: Pre-fills form, shows "Update Item" and "Cancel" buttons
- List of added items below form
- Each item shows: title, beneficiaries (with relationships), value
- Edit/Delete buttons on each item
- Empty state: "No items added yet" with icon

**Beneficiary Display:**
- For persons: "FirstName LastName (Relationship)"
- For groups: Group name (e.g., "Children")
- For estate: "The Estate"
- Multiple beneficiaries shown as list

**State Management:**
- Load existing items via `bequeathalActions.getAssetsByType('important-items')`
- Add item via `bequeathalActions.addAsset('important-items', itemData)`
- Update item via `bequeathalActions.updateAsset(id, updates)`
- Remove item via `bequeathalActions.removeAsset(id)`
- Convert beneficiaries format: `SelectedPerson[]` ↔ `beneficiaryAssignments`

**Helper Functions Needed:**
```typescript
// Convert SelectedPerson[] to beneficiaryAssignments format
const convertBeneficiariesToAssignments = (beneficiaries: SelectedPerson[]) => ({
  beneficiaries: beneficiaries.map(b => ({
    id: b.id,
    type: b.type,
    name: b.name
  }))
});

// Convert beneficiaryAssignments back to SelectedPerson[] format
const convertAssignmentsToBeneficiaries = (item: ImportantItemAsset): SelectedPerson[] => {
  if (!item.beneficiaryAssignments?.beneficiaries) return [];
  return item.beneficiaryAssignments.beneficiaries.map(b => ({
    id: b.id,
    type: b.type,
    name: b.name || '',
    relationship: b.type === 'person' ? getPersonRelationshipDisplay(personActions.getPersonById(b.id)) : undefined
  }));
};

// Get display name for beneficiary
const getBeneficiaryDisplayName = (beneficiary: SelectedPerson, personActions): string => {
  if (beneficiary.type === 'estate') return 'The Estate';
  if (beneficiary.type === 'group') return beneficiary.name || 'Group';
  if (beneficiary.type === 'person') {
    const person = personActions.getPersonById(beneficiary.id);
    if (person) return `${getPersonFullName(person)} (${getPersonRelationshipDisplay(person)})`;
  }
  return beneficiary.name || 'Unknown';
};
```

**Validation:**
- Item title REQUIRED (trim whitespace)
- At least one beneficiary REQUIRED
- Estimated value REQUIRED (numeric)

**Navigation:**
- Back → `/bequeathal/important-items/intro`
- Continue → Next selected category's intro OR `/order-of-things`

**Components Needed:**
- MultiBeneficiarySelector (NEW - see Task 6.3 below)
- CurrencyInput (existing)
- Input (existing)
- Button (existing)
- Card (existing)

**Effort:** 5-7 hours (includes MultiBeneficiarySelector component creation)

### Task 6.3: Create MultiBeneficiarySelector Component
File: `native-app/src/components/forms/MultiBeneficiarySelector.tsx`

**Purpose:** Reusable component for selecting people, groups, or estate as beneficiaries

**Props Interface:**
```typescript
interface MultiBeneficiarySelectorProps {
  // Core behavior
  mode: 'single' | 'multi';
  
  // Current value
  value: BeneficiarySelection | BeneficiarySelection[];
  onChange: (value: BeneficiarySelection | BeneficiarySelection[]) => void;
  
  // Selection options
  allowEstate?: boolean;      // Show "The Estate" option
  allowGroups?: boolean;      // Show beneficiary groups
  
  // Filtering
  excludePersonIds?: string[]; // Person IDs to exclude from dropdown
  
  // UI customization
  label?: string;
  placeholder?: string;
  
  // Callbacks
  onAddNewPerson?: () => void; // Parent handles person creation dialog
  onAddNewGroup?: () => void;  // Parent handles group creation dialog
  
  // Actions
  personActions: PersonActions;
  beneficiaryGroupActions: BeneficiaryGroupActions;
}

interface BeneficiarySelection {
  id: string;
  type: 'person' | 'group' | 'estate';
  name: string;
  relationship?: string;
}
```

**Implementation Approach:**
1. **Dropdown with filtered people**
   - Load people via personActions.getPeople()
   - Filter out excludePersonIds
   - Convert to SelectOption format
   - Add "+ Add New Person" option at bottom (triggers onAddNewPerson callback)

2. **Groups dropdown** (if allowGroups)
   - Load groups via beneficiaryGroupActions.getActiveGroups()
   - Show in dropdown with group icon
   - Add "+ Create New Group" option (triggers onAddNewGroup callback)

3. **Estate option** (if allowEstate)
   - Special option in dropdown: "The Estate"
   - When selected, adds { id: 'estate', type: 'estate', name: 'The Estate' }

4. **Single mode display**
   - Selected person shown with name and relationship
   - "Change" button to reopen dropdown

5. **Multi mode display**
   - Chips for each selected beneficiary
   - Person chip: "Name (Relationship)" with X button
   - Group chip: "Group Name" with group icon and X button
   - Estate chip: "The Estate" with X button
   - Dropdown to add more beneficiaries

6. **Helper functions in component**
   - getBeneficiaryFromPerson(person: Person): BeneficiarySelection
   - getBeneficiaryFromGroup(group: BeneficiaryGroup): BeneficiarySelection
   - getDisplayName(beneficiary: BeneficiarySelection): string

**Components Used:**
- Select (existing)
- TouchableOpacity (primitive)
- Text (primitive)
- View (primitive)
- IconButton (from react-native-paper)

**Styling:**
- Follow existing chip pattern from categories screen
- On-brand colors (beige, cream, navy, green)
- Consistent with other form components

**Effort:** 2-3 hours

### Task 6.4: Beneficiary Groups Management (NEEDS DISCUSSION BEFORE IMPLEMENTATION)
File: `native-app/app/groups/manage.tsx` OR inline in beneficiary selector

⚠️ **DISCUSSION REQUIRED:** Determine approach before implementing

**Option A - Standalone Groups Screen (Recommended):**
- Dedicated screen at `/groups/manage`
- Accessible from settings or developer menu
- Full CRUD for groups (Create, Read, Update, Delete)
- List of all groups with edit/delete buttons
- Form: Group name + description
- No member management yet (just group definitions)
- Simple, focused implementation

**Option B - Inline Quick-Add:**
- Dialog triggered from MultiBeneficiarySelector
- Quick form: name + description only
- No list view or management UI
- Limited functionality

**Option C - Hybrid:**
- Inline quick-add from MultiBeneficiarySelector
- Plus full management screen for advanced editing
- Most complete but most work

**Data Structure (already exists in types):**
```typescript
interface BeneficiaryGroup {
  id: string;
  name: string;              // e.g., "Children", "Godchildren"
  description: string;
  isPredefined: boolean;     // System templates vs user-created
  isActive: boolean;         // Soft delete flag
  memberIds?: string[];      // Person IDs (future feature)
  willId: string;           // Links to will-maker
}
```

**Required Discussion Points:**
1. Where should users access group management? (Settings? Inline? Both?)
2. Should groups have members now or later? (Member assignment adds complexity)
3. Do we need predefined templates (Children, Siblings, etc.) or user-created only?
4. Should groups be shared across users or per-will?

**Estimated Effort:**
- Option A: 2-3 hours
- Option B: 1 hour
- Option C: 4-5 hours

---

## Phase 5-14: Individual Asset Type Implementations (High-Level)

### High-Level Structure (per asset type)

Each asset type requires:
1. **Intro screen** (`app/bequeathal/{type}/intro.tsx`)
2. **Entry screen** (`app/bequeathal/{type}/entry.tsx`)
3. **Form component** (if complex, extract to `src/components/forms/{Type}Form.tsx`)

**Complexity Tiers:**
- **Simple (1-2 days each):** bank-accounts, crypto-currency, important-items
- **Moderate (2-3 days each):** investment, pensions, life-insurance, private-company-shares
- **Complex (4-5 days each):** assets-held-through-business, agricultural-assets
- **Very Complex (5-7 days):** property

### Phase 5: Bank Accounts (SIMPLE - Start Here)
**Screens:**
- `app/bequeathal/bank-accounts/intro.tsx`
- `app/bequeathal/bank-accounts/entry.tsx`

**Form fields:**
- Bank provider (dropdown with UK banks + "Non UK Bank") // Must be searchable.
- Account type (current, savings, ISA, fixed-term, other) // Note if ISA is selected, we need to save the entry in the investments section
- Ownership type (personal, joint) // note this should not show if ISA is selected
- Account number (optional, hide for non-UK) // validate length
- Estimated balance (currency input with "Not sure") // round to nearest £1 when storing

**Estimated effort:** 1 day (good starter, simple pattern)

### Phase 6: Important Items (SIMPLE)
**Screens:**
- `app/bequeathal/important-items/intro.tsx`
- `app/bequeathal/important-items/entry.tsx`

**Form fields:**
- Item title (text input)
- Beneficiaries (multi-select person selector)
- Estimated value (currency input)

**Estimated effort:** 1 day

### Phase 7: Crypto Currency (SIMPLE)
**Screens:**
- `app/bequeathal/crypto-currency/intro.tsx`
- `app/bequeathal/crypto-currency/entry.tsx`

**Form fields:**
- Crypto type (dropdown: Bitcoin, Ethereum, other)
- Platform/Exchange (text input)
- Quantity (number input)
- Current value (currency input)

**Estimated effort:** 1 day

### Phase 8: Investments (MODERATE)
**Screens:**
- `app/bequeathal/investment/intro.tsx`
- `app/bequeathal/investment/entry.tsx`

**Form fields:**
- Investment name (text)
- Provider (searchable select)
- Investment type (9 options: GIA, AIM, ISA, etc.)
- Beneficiary (person selector)
- Estimated value (currency)

**Views:**
- List view with edit/delete
- Summary by type/beneficiary (optional)

**ISA INTEGRATION (CRITICAL - from Phase 5):**
- TODO: Load ISAs created in Phase 5 (Bank Accounts screen) via `bequeathalActions.getAssetsByType('investment').filter(inv => inv.investmentType === 'ISA')`
- TODO: Display ISAs in investments list alongside manually added investments
- TODO: Show ISA source indicator (e.g., badge "Added from Bank Accounts")
- TODO: Allow editing ISAs from investments screen
- TODO: Test that ISAs appear in correct section and calculations
- TODO: Consider backward compatibility migration for any ISAs incorrectly saved as 'bank-accounts' type

**Estimated effort:** 2 days

### Phase 9: Pensions (MODERATE)
**Screens:**
- `app/bequeathal/pensions/intro.tsx`
- `app/bequeathal/pensions/entry.tsx`

**Form fields:**
- Provider (text)
- Policy number (optional)
- Pension type (dropdown)
- Current value (currency)
- Monthly contribution (optional)
- Pension owner (me, spouse, child, other)
- Beneficiary nominated (yes, no, not sure)

**Estimated effort:** 2 days

### Phase 10: Life Insurance (MODERATE)
**Screens:**
- `app/bequeathal/life-insurance/intro.tsx`
- `app/bequeathal/life-insurance/entry.tsx`

**Form fields:**
- Provider (text)
- Policy number (text)
- Policy type (dropdown)
- Life assured (person selector)
- Sum insured (currency)
- Monthly premium (currency, optional)
- Premium status (active, paid-up, lapsed, suspended)
- Beneficiaries (array with % or £ allocation)

**Estimated effort:** 2-3 days

### Phase 11: Private Company Shares (MODERATE)
**Screens:**
- `app/bequeathal/private-company-shares/intro.tsx`
- `app/bequeathal/private-company-shares/entry.tsx`

**Form fields:**
- Company name (text)
- Number of shares (number)
- Share class (text, optional)
- Total value (currency)
- Cost basis (currency, optional)
- IHT planning questions (4 yes/no/not sure)

**Estimated effort:** 2 days

### Phase 12: Assets Held Through Business (COMPLEX)
**Screens:**
- `app/bequeathal/assets-held-through-business/intro.tsx`
- `app/bequeathal/assets-held-through-business/entry.tsx`

**Form fields:**
- Business selector (from Business[])
- Asset type (dropdown)
- Asset description (text)
- Business ownership % (percentage)
- Number of units (optional)
- Estimated value (currency)
- Exclude from valuation (checkbox)

**Dependencies:** Requires Business data structure and management

**Estimated effort:** 3-4 days

### Phase 13: Agricultural Assets (VERY COMPLEX)
**Screens:**
- `app/bequeathal/agricultural-assets/intro.tsx`
- `app/bequeathal/agricultural-assets/entry.tsx`

**Form fields (25+ fields):**
- Asset type (11 options: land, buildings, farmhouse, etc.)
- Location (text)
- Ownership structure (5 options)
- Size/quantity (text)
- Years owned (number)
- Active agricultural use (yes, no, partial)
- Debts/encumbrances (yes/no with details)
- APR-specific questions (5 fields)
- BPR-specific questions (3 fields)
- Conditional fields based on asset type

**Estimated effort:** 4-5 days (most complex form)

### Phase 14: Property (VERY COMPLEX)
**Screens:**
- `app/bequeathal/property/intro.tsx`
- `app/bequeathal/property/address.tsx` (address search step)
- `app/bequeathal/property/entry.tsx` (basic details)
- `app/bequeathal/property/trust-details.tsx` (if held in trust)
- `app/bequeathal/property/summary.tsx` (property summary)

**Form fields (100+ fields across multiple steps):**
- Address search (AddressSearchField)
- Property type, usage, ownership
- Joint ownership details
- Company ownership details
- Trust ownership details (extensive)
- Mortgage information
- Funding type (multiple options)
- Usage-specific fields (FHL, agricultural, mixed-use, buy-to-let)

**Notes:**
- Most complex asset type by far
- Requires multi-step wizard
- Trust integration (Trust data structure)
- Beneficiary assignment complex logic

**Estimated effort:** 5-7 days

---

## Detailed Plans (Created When Reached)

When reaching each phase, create detailed implementation plan:
- Component breakdown
- State management strategy
- Validation rules
- Navigation flow
- Testing checklist

---

## Navigation Integration

Update `native-app/app/order-of-things.tsx`:
- Add "Assets & Bequests" section
- Link to `/bequeathal/intro`
- Show completion status per category

---

## Developer Tools Enhancement

Update `native-app/app/developer/dashboard.tsx`:
- Add "Assets" section
- Quick navigation to each asset type
- Show counts per category

Update `native-app/app/developer/data-explorer.tsx`:
- Add BequeathalData interface
- Show assets by type
- Asset value summaries

---

## Recommendations

**1. Start with Simple Assets First**
Build confidence and establish patterns:
- Bank Accounts (simplest)
- Important Items (multi-beneficiary pattern)
- Crypto Currency (simple)

**2. Address Data Inconsistencies**
Before implementing:
- Standardize beneficiary assignment format
- Resolve ownership type variations
- Unify value field naming

**3. Reusable Form Components**
Extract common patterns:
- AssetFormCard (wrapper for all asset forms)
- BeneficiaryMultiSelect
- ValueInput (with "Not sure" option)
- OwnershipTypeSelect

**4. Defer Property Until Last**
- Most complex by far
- Learn patterns from other assets first
- May need multi-session implementation

**5. Testing Strategy**
For each asset type:
- Add sample data in seedData
- Test CRUD operations
- Verify AsyncStorage persistence
- Test navigation flow

---

## Implementation Todos

1. ✅ **analysis-doc** - Create ASSET_MANAGEMENT_ANALYSIS.md documenting incoherences and recommendations
2. ✅ **type-definitions** - Port and standardize all asset type definitions to native-app types
3. ✅ **asset-helpers** - Create assetHelpers.ts utility functions
4. ✅ **bequeathal-intro** - Implement bequeathal intro screen with video and information cards
5. ✅ **category-selection** - Implement category selection screen with 10 asset type checkboxes
6. ✅ **bank-accounts-flow** - Implement bank accounts intro and entry screens (SIMPLE starter)
7. 🚧 **important-items-flow** - Implement important items intro and entry screens
8. **crypto-flow** - Implement crypto currency intro and entry screens
9. **investments-flow** - Implement investments intro and entry screens (MODERATE)
10. **pensions-flow** - Implement pensions intro and entry screens
11. **life-insurance-flow** - Implement life insurance intro and entry screens
12. **company-shares-flow** - Implement private company shares intro and entry screens
13. **business-assets-flow** - Implement assets-held-through-business screens (COMPLEX)
14. **agricultural-flow** - Implement agricultural assets screens (VERY COMPLEX)
15. **property-flow** - Implement property screens with multi-step wizard (VERY COMPLEX)

---

## Component Architecture Strategy

### Decision: Break Down PersonSelectorField

**Analysis:**
- Web prototype PersonSelectorField is 765 lines
- Used 13 times across 10 files
- 70% of complexity is trust-specific (collectPercentage, collectInterestType, collectCessationCriteria)
- 9 out of 13 usages are in trust fieldsets we won't build until Phase 14+
- React Native implementation would differ significantly from web (dropdown/modal patterns)

**Decision: Create Two Specialized Components**

#### 1. MultiBeneficiarySelector (Build Now - Phase 6.2)
**Purpose:** Simple person/group/estate selection without percentages or trust metadata
**File:** `src/components/forms/MultiBeneficiarySelector.tsx`
**Size:** ~200-250 lines
**Features:**
- Single and multi-select modes
- Person selection from filtered list
- Groups support (beneficiary groups)
- Estate option ("The Estate")
- Add/remove beneficiaries (chip display in multi mode)
- Callback for adding new person (parent handles Dialog)
- No percentages, no trust metadata, no complex normalization

**Used in:** Important Items, future simple asset beneficiary assignments (Phases 6-11)

#### 2. BeneficiaryWithPercentages (Build Later - Phase 14)
**Purpose:** Extends MultiBeneficiarySelector with percentage splits and trust metadata
**File:** `src/components/forms/BeneficiaryWithPercentages.tsx`
**Size:** ~300-400 lines
**Features:**
- Everything from MultiBeneficiarySelector
- Percentage inputs with lock/unlock
- Interest type selection (income, occupation, income-and-occupation)
- Cessation criteria text fields
- Automatic percentage normalization to 100%
- Locked percentage management

**Used in:** Property trust configurations, complex estate splits

**Benefits:**
- Simpler, maintainable code following KISS principle
- Faster implementation now (2-3 hours vs 8-10 hours)
- Single responsibility per component
- Can add advanced features when actually needed
- Follows COMPONENT_GUIDELINES.md philosophy

---

