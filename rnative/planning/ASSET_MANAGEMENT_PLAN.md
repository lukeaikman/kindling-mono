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

## Phase 5: Bank Accounts Implementation ✅ COMPLETE

**Reference:** Web prototype `BankAccountsIntroScreen.tsx` and `BankAccountsEntryScreen.tsx`

### Task 5.1: Bank Accounts Intro Screen ✅
File: `native-app/app/bequeathal/bank-accounts/intro.tsx`

**Completed:**
- ✅ Header: "Bank Accounts" with piggy-bank icon
- ✅ Inline video player at top (16:9 aspect ratio, WebView)
- ✅ InformationCard: "Estimate the Balances" with all content matching web prototype
- ✅ "Learn more" external link with icon
- ✅ Primary button: "Let's Go" → `/bequeathal/bank-accounts/entry`
- ✅ Skip button: "Skip for now" → sequential navigation to next category
- ✅ Morphic background (3 blobs)

### Task 5.2: Bank Accounts Entry Screen ✅
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

**Completed:**
- ✅ All 6 form fields implemented exactly as web prototype
- ✅ SearchableSelect component created and integrated for bank provider
- ✅ UK/Non-UK bank conditional logic working
- ✅ ISA detection and routing to InvestmentAsset
- ✅ ISA warning badge in form when selected
- ✅ Account number validation (3-8 digits, numeric only)
- ✅ CurrencyInput with numeric-only validation
- ✅ "Unsure of balance" checkbox (custom visible checkbox circle)
- ✅ Form show/hide logic (hidden after first add)
- ✅ Collapsible accounts list with eye icon
- ✅ Account cards display all fields (including notes for non-UK, sort code for UK)
- ✅ ISAs shown in list with green badge "Will appear under Investments"
- ✅ Green "Add Another Account" button
- ✅ Total value in footer
- ✅ Delete functionality
- ✅ Rounding to nearest £1
- ✅ Privacy disclaimer
- ✅ Sequential navigation to next category

**Components Created:**
- ✅ SearchableSelect (`src/components/ui/SearchableSelect.tsx`)
  - Modal-based searchable dropdown
  - Real-time search filtering
  - FlatList for performance
  - Two modes: default (shows value in button) and card mode (shows value as card below with clear button)
  - ~330 lines, fully documented
  - Exported from ui/index.ts
- ✅ Component Sandbox (`app/developer/sandbox.tsx`)
  - Test page for new components
  - Linked from Developer Dashboard
  - Tests both SearchableSelect modes

### Task 5.3: Sequential Navigation System ✅
File: `native-app/src/utils/categoryNavigation.ts`

**Completed:**
- ✅ Centralized route mapping for all 10 asset categories
- ✅ `getFirstCategoryRoute()` - Navigate to first selected category
- ✅ `getNextCategoryRoute()` - Sequential flow through selected categories
- ✅ Integrated into categories, intro, and entry screens
- ✅ User flow: Categories → Category1 Intro → Category1 Entry → Category2 Intro → Category2 Entry → Order of Things

---

## Phase 6: Important Items Implementation ✅ COMPLETE

**Reference:** Web prototype `ImportantItemsIntroScreen.tsx` and `ImportantItemsEntryScreen.tsx`

### Task 6.1: Important Items Intro Screen ✅
File: `native-app/app/bequeathal/important-items/intro.tsx`

**Completed:**
- ✅ Header: "Important Items" with diamond icon
- ✅ Inline video player at top (16:9 aspect ratio)
- ✅ InformationCard: "Your Valuable Possessions" with all content matching web prototype
- ✅ Numbered list explaining when to list items
- ✅ Primary button: "Start Adding Important Items" → entry screen
- ✅ Skip button: "Skip for now" → sequential navigation
- ✅ Morphic background (5 blobs)

### Task 6.2: Important Items Entry Screen ✅
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

**Completed:**
- ✅ All 3 form fields implemented
- ✅ Item title input with placeholder
- ✅ MultiBeneficiarySelector (multi mode, groups + estate support)
- ✅ CurrencyInput for estimated value (numeric only, £ icon in design)
- ✅ Form always visible at top
- ✅ Edit/Add mode toggle with proper button text
- ✅ Cancel button in edit mode
- ✅ Items list with full display: title, beneficiaries with relationships, value
- ✅ Beneficiary display: "Name (Relationship)", "The Estate", groups
- ✅ Edit/Delete buttons on each item
- ✅ Empty state with icon and message
- ✅ Full CRUD operations
- ✅ BeneficiaryAssignments format conversion
- ✅ Sequential navigation to next category
- ✅ Add person dialog placeholder (triggers from MultiBeneficiarySelector)

### Task 6.3: Create MultiBeneficiarySelector Component ✅
File: `native-app/src/components/forms/MultiBeneficiarySelector.tsx`

**Completed:** 327 lines, fully functional reusable component

**Features Implemented:**
- ✅ Single and multi-select modes
- ✅ Person selection with relationship display
- ✅ Groups support (ready for when groups are created)
- ✅ Estate option ("The Estate")
- ✅ Chip display in multi mode with remove buttons
- ✅ Icons for groups (account-multiple) and estate (bank)
- ✅ Callback pattern for adding new person/group (parent controls Dialog)
- ✅ Filters out already-selected people
- ✅ Helper functions for conversions
- ✅ On-brand styling (beige borders, green accents)
- ✅ Full JSDoc documentation
- ✅ Exported from forms/index.ts

**Used in:**
- Important Items Entry screen
- Future: All simple asset beneficiary assignments (Phases 7-11)

### Task 6.4: Beneficiary Groups Management ✅
File: `native-app/src/components/forms/GroupManagementDrawer.tsx`

**Implemented:** Bottom drawer approach (Option B variant)

**Features:**
- ✅ Modal drawer triggered from MultiBeneficiarySelector
- ✅ 8 template-based group creation (Bloodline Children, All Children, Bloodline Grandchildren, All Grandchildren, Siblings, Nieces and Nephews, Cousins, Custom)
- ✅ Accordion template selector (no Menu clipping issues)
- ✅ Auto-fill name + description from template (editable)
- ✅ Inline group editing (pencil icon reveals description editor)
- ✅ List of existing groups with select buttons
- ✅ Introduction text when no groups exist
- ✅ "+ Add New Group" button when groups exist
- ✅ Full CRUD operations via beneficiaryGroupActions
- ✅ Integrated into Important Items screen
- ✅ Tested in Component Sandbox

---

## Phase 7: Cryptocurrency Implementation ✅ COMPLETE

**Reference:** Web prototype `CryptoCurrencyIntroScreen.tsx` and `CryptoCurrencyEntryScreen.tsx`

### DESIGN DECISION: Simplified Account-Based Model

**Rationale:**
- Estate planning requires knowing WHERE to find assets, not portfolio composition
- Users think in accounts (Coinbase account, Hardware wallet), not individual holdings
- Executors need account access, not per-coin tracking
- Reduces friction: 1 entry per platform vs. N entries for N currencies
- Crypto values fluctuate too much for quantity tracking to be meaningful

**Web prototype over-engineered** this by tracking individual currency holdings separately.

### Task 7.1: Cryptocurrency Intro Screen ✅
File: `native-app/app/bequeathal/crypto-currency/intro.tsx`

**Completed:**
- ✅ Header: "Cryptocurrency" with bitcoin icon
- ✅ Inline video player (16:9 aspect ratio)
- ✅ InformationCard: "Digital Assets Need Planning" with all web prototype content
- ✅ Bold emphasis on "lost forever" risk
- ✅ External link: "Learn about cryptocurrency inheritance planning"
- ✅ "Let's Go" and "Skip for now" buttons
- ✅ Sequential navigation
- ✅ Morphic background (5 blobs)

### Task 7.2: Update CryptoCurrencyAsset Type Definition ✅
File: `native-app/src/types/index.ts`

**Completed:** Updated to simplified account-based model
- ✅ Removed: `cryptoType`, `quantity`
- ✅ Added: `accountUsername`, `notes`
- ✅ Uses BaseAsset.estimatedValue instead of currentValue

### Task 7.3: Cryptocurrency Entry Screen ✅
File: `native-app/app/bequeathal/crypto-currency/entry.tsx`

**Data Structure:**
```typescript
interface CryptoCurrencyAsset extends BaseAsset {
  type: 'crypto-currency';
  platform: string;         // Coinbase, Binance, Hardware Wallet, etc.
  accountUsername?: string; // Username or account identifier
  notes?: string;          // Important details for access
  estimatedValue: number;  // Total account value in £
  netValue: number;        // Same as estimatedValue
}
```

**Form Fields (SIMPLIFIED MODEL):**

1. **Platform or Wallet** (Select with 16 options - uses hybrid Menu/Modal)
   - Exchanges: Coinbase, Binance, Kraken, Bitstamp, Gemini, Crypto.com, KuCoin, OKX, Huobi
   - Separator: ────────────────
   - Wallets: Hardware Wallet, Software Wallet, Paper Wallet, Mobile Wallet, Browser Wallet
   - Other
   - NOTE: Searchable NOT required (only 16 items, will use Menu mode)

2. **Account Username/ID** (text input)
   - Placeholder: "e.g., john@email.com, Account ID"
   - Optional
   - Helps executors identify the specific account

3. **Estimated Value** (CurrencyInput)
   - Total value of ALL crypto in this account
   - "Unsure of balance" checkbox (matching bank accounts pattern)
   - Note: "Cryptocurrency values fluctuate - this is just for estate planning estimates"

4. **Notes** (multiline Input)
   - Placeholder: "Any other important details about this holding..."
   - Optional
   - For additional context (hardware wallet location, recovery info note, etc.)

**Important Notice Card:**
Display warning at top of form:
```
⚠️ Access Information Required Later
We'll collect detailed access instructions and private key storage information 
in the Executor Facilitation section to keep it secure and separate.
```
- Orange background, alert triangle icon
- Informs users we're not collecting seed phrases here

**UI Behavior:**
- Form starts VISIBLE if no holdings exist
- Form HIDDEN after first holding added (shows "Add Another Holding" button)
- Holdings list shows: platform name, account username (if provided), value
- Collapsible list with eye icon
- Holdings Total displayed under last card
- Delete button on each holding
- Continue button HIDDEN when form visible (matching bank accounts pattern)

**Display in List:**
```
Coinbase
john@email.com
£25,000
```
Or if no username:
```
Hardware Wallet
£15,000
```

**Validation:**
- Platform REQUIRED
- Estimated value optional ("Unsure of balance" = £0)
- Round to nearest £1 when saving

**State Management:**
- Load holdings via `bequeathalActions.getAssetsByType('crypto-currency')`
- Add holding via `bequeathalActions.addAsset('crypto-currency', holdingData)`
- Remove holding via `bequeathalActions.removeAsset(id)`
- Calculate total: `holdings.reduce((sum, h) => sum + h.estimatedValue, 0)`

**Title Generation:**
- Format: `[Platform Name]` (simple, since it's account-based)
- Or: `[Platform Name] - [Account Username]` if username provided

**Navigation:**
- Back → `/bequeathal/crypto-currency/intro`
- Continue → Next selected category or `/order-of-things`

**Components Needed:**
- Select (existing - will use Menu mode for 16 items)
- Input (existing)
- CurrencyInput (existing)
- Button (existing)
- Custom checkbox for "Unsure of balance" (existing pattern)

**Effort:** 3-4 hours

---

## Phase 8: Investments Implementation (MODERATE - 1-2 days)

**Reference:** Web prototype `InvestmentsIntroScreen.tsx` and `InvestmentsEntryScreen.tsx`

**CRITICAL:** ISA Integration from Phase 5

### Task 8.1: Investments Intro Screen
File: `native-app/app/bequeathal/investment/intro.tsx`

**Content (from web prototype):**
- Header: "Investment Accounts" with trending-up icon
- Optional video player (inline at top)
- InformationCard: "Your Investment Portfolio"
  - "Let's record your investments and financial assets to ensure they're properly distributed. We'll help you document:"
  - Bulleted list:
    - stocks & shares portfolios
    - ISAs & investment accounts
    - bonds & government securities
    - mutual funds & unit trusts
    - investment platforms & brokers
  - "Recording your investments helps ensure they transfer smoothly to your beneficiaries and provides clarity for your executors."
  - External link: "Learn about investments in wills"
- Primary button: "Start Adding Investments" → `/bequeathal/investment/entry`
- Skip button: "Skip for now" → next category

**Effort:** 1-2 hours

### Task 8.2: Investments Entry Screen
File: `native-app/app/bequeathal/investment/entry.tsx`

**Data Structure:**
```typescript
interface InvestmentAsset extends BaseAsset {
  type: 'investment';
  investmentType: string;   // Type of investment (ISA, GIA, AIM, etc.)
  provider: string;         // Platform/provider name
  accountNumber?: string;   // Account number (ISAs from Bank Accounts will have this)
  beneficiaryAssignments?: { // NEW format (multi-beneficiary support)
    beneficiaries: Array<{
      id: string;
      type: 'person' | 'group' | 'estate';
      name?: string;
    }>;
  };
}
```

**NOTE:** Using `beneficiaryAssignments` (multi) instead of web prototype's `beneficiaryId` (single) for consistency with Important Items.

**Form Fields (4 TOTAL - SIMPLIFIED):**

1. **Investment With** (text input)
   - Placeholder: "e.g., AJ Bell, Hargreaves Lansdown"
   - Provider/platform name
   - REQUIRED
   - NOT searchable (free text input)

2. **Investment Type** (Select with 9 options)
   - Options:
     - General Investment Account
     - AIM holdings
     - ISA (Stocks & Shares)
     - Cash ISA
     - Direct CREST Holding
     - Junior ISA (JISA)
     - NS&I Products
     - Employee Share Scheme
     - Other
   - Optional (defaults to 'Other' if not selected)
   - NOTE: ISAs created in Phase 5 will have investmentType = 'ISA'

3. **Who will receive this?** (MultiBeneficiarySelector - multi mode)
   - Multi-select beneficiaries
   - Allow groups and estate
   - At least one required
   - Uses beneficiaryAssignments format

4. **Estimated Value** (CurrencyInput)
   - Total account value
   - "Unsure of balance" checkbox
   - Optional ("Unsure" = £0)
   - Round to £1 on save

**ISA INTEGRATION (CRITICAL):**

**Loading ISAs from Phase 5:**
- Load all investments: `bequeathalActions.getAssetsByType('investment')`
- ISAs from Bank Accounts will have `investmentType === 'ISA'` and `accountNumber` populated
- All ISAs (from Bank Accounts or manually added) appear in same list
- No special distinction needed - treat all ISAs the same

**UI Behavior:**

**From Web Prototype:**
- Add Investment button-triggered (form appears when clicked)
- "Add Another" / "Add Investment" button based on count
- Expanded/Collapsed view modes with toggle
- Statistical Summary with pie charts (by type or beneficiary)
- Edit/Delete functionality
- Total displayed
- Form has Cancel button

**DECISIONS (APPROVED):**

1. **Statistical Summary:** ❌ SKIP
   - No pie charts, no breakdown tables
   - Can add as future enhancement

2. **View Modes:** ❌ SKIP
   - Single list view only (no expanded/collapsed toggle)

3. **Beneficiary Selection:** ✅ MULTI
   - Use MultiBeneficiarySelector in MULTI mode
   - Deviation from web (which uses single)
   - Reason: Consistency with Important Items, more flexible

4. **ISA Distinction:** ❌ SKIP
   - All ISAs treated the same
   - No special badge for Bank Accounts origin

5. **"Unsure of balance" checkbox:** ✅ ADD
   - Consistent with Bank Accounts and Crypto

**APPROVED Implementation:**

**UI Flow:**
- Form starts VISIBLE if no investments exist
- Form HIDDEN after first add (shows "Add Another Investment" button)
- Single list view (no toggle)
- NO statistical summary
- List shows: account label, provider, investment type, beneficiaries, value
- ISAs from Bank Accounts appear in list (no special treatment)
- Total under last investment
- Edit/Delete buttons
- Continue button in ScrollView content (hidden when form visible)

**Display in List:**
```
AJ Bell - ISA (Stocks & Shares)
For: John Smith (Spouse), Jane Doe (Daughter)
£50,000
```

ISAs from Bank Accounts (no special treatment):
```
Barclays - ISA
For: The Estate
£25,000
```

**Validation:**
- Provider REQUIRED
- Investment type optional (defaults to 'Other')
- At least one beneficiary REQUIRED
- Estimated value optional ("Unsure of balance" = £0)

**State Management:**
- Load all investments: `bequeathalActions.getAssetsByType('investment')` (includes ISAs from Phase 5)
- Add investment via `bequeathalActions.addAsset('investment', investmentData)` with beneficiaryAssignments
- Update investment via `bequeathalActions.updateAsset(id, updates)`
- Remove investment via `bequeathalActions.removeAsset(id)`
- Total calculation includes ALL investments (manual + ISAs from Bank Accounts)
- Convert beneficiaries: MultiBeneficiarySelector format ↔ beneficiaryAssignments

**Title Generation:**
- Format: `[Provider]` (simple, user-defined)
- Or: `[Provider] - [Investment Type]` if type selected

**UI Pattern:**
- Matches Bank Accounts and Crypto patterns
- Form show/hide logic
- Collapsible list with eye icon
- Total under last card with unknown balance count
- Edit mode pre-fills form
- Delete with immediate removal

**Navigation:**
- Back → `/bequeathal/investment/intro`
- Continue → Next selected category or `/order-of-things`

**Components Needed:**
- Select (existing - 9 options will use Menu mode)
- Input (existing)
- CurrencyInput (existing)
- MultiBeneficiarySelector in MULTI mode (existing)
- Button (existing)
- Custom checkbox for "Unsure of balance" (existing pattern)

**Summary of Changes from Web Prototype:**
- ✅ Multi-beneficiary support (web uses single `beneficiaryId`)
- ✅ "Unsure of balance" checkbox (web doesn't have)
- ❌ Removed "Account Label" field (redundant with provider)
- ❌ No statistical summary/pie charts (web has ~200 lines of charts)
- ❌ No view mode toggle (web has expanded/collapsed views)
- ❌ No special ISA badges (treat all ISAs the same)
- ✅ Edit functionality (match web)
- ✅ Form show/hide pattern (match Bank Accounts/Crypto)
- ✅ 4 fields instead of 5 (simpler, faster)

**Effort:** 3-4 hours (reduced from 4-6 due to simplifications)

✅ **FINALIZED & READY FOR IMPLEMENTATION**

---

## Phase 8.5: Retrofit Investments with Percentage Allocations (1 hour)

**Rationale:** Investment accounts often split among multiple beneficiaries with specific percentages. Current single-beneficiary approach is too limiting.

**Example Use Cases:**
- "60% to eldest child, 40% split between younger children"
- "70% to spouse, 30% to children as a group"
- Large ISA portfolios with complex distribution wishes

### Task 8.5.1: Update Investments Entry Screen

**File:** `native-app/app/bequeathal/investment/entry.tsx`

**Changes:**

**FROM (Current):**
```typescript
<MultiBeneficiarySelector
  mode="single"
  value={formData.beneficiary}
  onChange={handleBeneficiaryChange}
  ...
/>
```

**TO:**
```typescript
<BeneficiaryWithPercentages
  allocationMode="percentage"
  value={formData.beneficiaries}  // Now array with percentages
  onChange={handleBeneficiariesChange}
  personActions={personActions}
  beneficiaryGroupActions={beneficiaryGroupActions}
  excludePersonIds={excludePersonIds}
  label="Who will receive this?"
  onAddNewPerson={() => setShowAddPersonDialog(true)}
  onAddNewGroup={() => setShowGroupDrawer(true)}
/>
```

**Form State Changes:**
```typescript
// FROM:
beneficiary: BeneficiarySelection

// TO:
beneficiaries: BeneficiaryAssignment[]  // With percentage fields
```

**Validation:**
- At least one beneficiary REQUIRED
- Percentages must total 100%
- Provider REQUIRED
- Value optional

**Display in List:**
```
AJ Bell - ISA (Stocks & Shares)
For: Jane Doe 60% (£30k), Bob Smith 40% (£20k)
£50,000
```

**Data Storage (updated):**
```json
{
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-456", "type": "person", "percentage": 60 },
      { "id": "person-789", "type": "person", "percentage": 40 }
    ]
  }
}
```

**Effort:** 1 hour (component already built, just swap it in)

### ⚠️ CRITICAL GOTCHAS - Phase 8.5

**1. Form State Conversion (EASY TO MESS UP):**

**OLD:**
```typescript
beneficiary: BeneficiarySelection  // Single object
```

**NEW:**
```typescript
beneficiaries: BeneficiaryAssignment[]  // Array with percentages
```

**MUST UPDATE:**
- ✅ Initial state: `beneficiary: {...}` → `beneficiaries: []`
- ✅ Reset form: `beneficiary: {...}` → `beneficiaries: []`
- ✅ Edit mode: Load single beneficiary → Load array of beneficiaries
- ✅ Save logic: Save single → Save array with percentage validation
- ✅ Validation: `beneficiary.id` → `beneficiaries.length > 0 AND validatePercentageAllocation()`

**SEARCH AND DESTROY:** Find ALL instances of `formData.beneficiary` and convert to `formData.beneficiaries`

**2. Existing Data Migration (CRITICAL):**

If users already created investments with OLD single beneficiary format:
```typescript
// On load, check for old format and migrate:
const investment = bequeathalActions.getAssetById(id);
if (investment.beneficiaryAssignments?.beneficiaries.length === 1 && 
    !investment.beneficiaryAssignments.beneficiaries[0].percentage) {
  // Old single beneficiary - auto-convert to 100%
  const updated = {...investment};
  updated.beneficiaryAssignments.beneficiaries[0].percentage = 100;
  bequeathalActions.updateAsset(id, updated);
}
```

**3. Display Logic Update:**

**OLD:**
```typescript
For: {beneficiary.name}
```

**NEW:**
```typescript
For: {beneficiaries.map(b => `${getName(b)} ${b.percentage}%`).join(', ')}
```

**MUST UPDATE:** All display locations that show beneficiary

**4. Edit Mode Conversion:**

**OLD:** Single beneficiary object
**NEW:** Array with one beneficiary at 100%

**CODE:**
```typescript
// In handleEditInvestment:
// OLD: setFormData({ beneficiary: firstBeneficiary })
// NEW: setFormData({ beneficiaries: investment.beneficiaryAssignments?.beneficiaries || [] })
```

**5. Validation Before Save:**

**MUST ADD:**
```typescript
const isValid = validatePercentageAllocation({ beneficiaries: formData.beneficiaries });
if (!isValid) {
  Alert.alert('Invalid', 'Percentages must total 100%');
  return;
}
```

### 📋 EXPLICIT INSTRUCTIONS - Phase 8.5

**Step 1: SEARCH for old code**
```bash
# In investment/entry.tsx, search for:
- "beneficiary:" (form state)
- "formData.beneficiary" (all references)
- "handleBeneficiaryChange" (handler name)
- "setBeneficiary" (state setter)
```

**Step 2: DELETE old imports**
```typescript
// REMOVE if present:
import { MultiBeneficiarySelector, BeneficiarySelection } from '...'

// ADD:
import { BeneficiaryWithPercentages } from '../../../src/components/forms';
import type { BeneficiaryAssignment } from '../../../src/types';
import { validatePercentageAllocation } from '../../../src/utils/beneficiaryHelpers';
```

**Step 3: UPDATE form state**
```typescript
// Find interface PensionForm or InvestmentForm
// Change beneficiary field to beneficiaries array
// Add percentage to initial state
```

**Step 4: REPLACE component JSX**
```typescript
// Find <MultiBeneficiarySelector mode="single" ...>
// Replace entire component with <BeneficiaryWithPercentages allocationMode="percentage" ...>
// Update all prop names
```

**Step 5: UPDATE validation**
```typescript
// Find canSubmit or validation logic
// ADD percentage validation
// REMOVE old single beneficiary validation
```

**Step 6: UPDATE save logic**
```typescript
// Find handleAddInvestment or similar
// CHANGE from single beneficiary to array
// ADD percentage validation before save
```

**Step 7: UPDATE edit logic**
```typescript
// Find handleEditInvestment
// CHANGE: Convert single beneficiary to array for backward compatibility
// Handle both old (no %) and new (with %) data formats
```

**Step 8: UPDATE display logic**
```typescript
// Find all places that display beneficiary
// CHANGE from single to list with percentages
// Use getBeneficiaryDisplayName() helper
// Show percentage next to each name
```

**Step 9: TEST thoroughly**
- Create new investment with percentages
- Edit existing investment
- Load investment created before retrofit
- Verify percentages total 100%

---

## Phase 9: Pensions Implementation (MODERATE - 3-4 hours)

**Reference:** Web prototype `PensionsIntroScreen.tsx` and `PensionsEntryScreen.tsx`

**CRITICAL:** Pensions often bypass estate - "Beneficiary Nominated" field affects distribution visualization

### DESIGN PHILOSOPHY: Value First, Details Later

**For Will Creation + Visualization, we need:**
- What pension exists (provider)
- Rough value (for estate total)
- Does it bypass estate? (beneficiary nominated question)

**For Executor Facilitation (LATER phase):**
- Policy numbers, account numbers, access details

### Task 9.1: Clean Up PensionAsset Data Model
File: `native-app/src/types/index.ts`

**CURRENT (Bloated - 9 fields):**
```typescript
interface PensionAsset extends BaseAsset {
  type: 'pensions';
  provider: string;
  policyNumber?: string;           // ❌ NOT USING (deferred)
  linkedEmployer?: string;         // ❌ NOT USING (removed from plan)
  pensionType: string;
  monthlyContribution?: number;    // ❌ NOT USING (removed from plan)
  employerContribution?: number;   // ❌ NOT USING (removed from plan)
  pensionOwner?: 'me' | 'spouse' | 'child' | 'other'; // ❌ NOT USING (removed from plan)
  customOwner?: string;            // ❌ NOT USING (removed from plan)
  beneficiaryNominated?: 'yes' | 'no' | 'not-sure';
}
```

**UPDATED (Clean - 3 fields):**
```typescript
interface PensionAsset extends BaseAsset {
  type: 'pensions';
  provider: string;             // Pension provider name
  pensionType: string;          // 'defined-benefit' | 'defined-contribution' | 'sipp' | 'workplace' | 'unsure'
  beneficiaryNominated?: 'yes' | 'no' | 'not-sure'; // Critical for distribution visualization
  // Fields deferred to Executor Facilitation phase:
  // - policyNumber will be added when building executor facilitation
}
```

**Removed Fields (6 total):**
- ❌ `policyNumber` - Deferred to Executor Facilitation (value first!)
- ❌ `linkedEmployer` - Not needed for will creation/visualization
- ❌ `monthlyContribution` - Not needed for will creation/visualization
- ❌ `employerContribution` - Not needed for will creation/visualization
- ❌ `pensionOwner` - Single will assumption
- ❌ `customOwner` - Not needed

**Result:** 67% reduction in fields, cleaner data model, faster queries

### Task 9.2: Pensions Intro Screen
File: `native-app/app/bequeathal/pensions/intro.tsx`

**Content (from web prototype - TBD, needs research):**
- Header: "Pensions" with shield icon
- Optional video player (inline at top)
- InformationCard with educational content about pensions in wills
- External link to pension inheritance info
- Primary button: "Let's Go" → `/bequeathal/pensions/entry`
- Skip button: "Skip for now" → next category

**Effort:** 1-2 hours

### Task 9.3: Pensions Entry Screen
File: `native-app/app/bequeathal/pensions/entry.tsx`

**Data Structure (CLEANED UP - see Task 9.1):**
```typescript
export type PensionType = 
  | 'defined-benefit'
  | 'defined-contribution'
  | 'sipp'
  | 'workplace'
  | 'unsure';

interface PensionAsset extends BaseAsset {
  type: 'pensions';
  provider: string;
  pensionType: PensionType;     // Strict union type
  beneficiaryNominated?: 'yes' | 'no' | 'not-sure';
}
```

**NOTE:** For DB pensions, estimatedValue stores ANNUAL amount (£/year), not lump sum. Display logic will need to handle this.

**Form Fields (4 TOTAL - SIMPLIFIED):**

1. **Provider** (text input)
   - Placeholder: "e.g., Scottish Widows, Aviva"
   - REQUIRED
   - Free text entry (not searchable)

2. **Pension Type** (Select with 5 options)
   - Options:
     - Defined Benefit (pays £X/year in retirement)
     - Defined Contribution (lump sum pot)
     - SIPP (Self-Invested Personal Pension)
     - Workplace Pension (not sure which type)
     - Unsure
   - REQUIRED
   - Determines value field label
   - User-friendly labels that people recognize

3. **Value** (CurrencyInput - CONDITIONAL LABEL)
   - **IF Defined Benefit:** Label = "Annual Amount (£/year)"
   - **IF DC, SIPP, Workplace, OR Unsure:** Label = "Total Value"
   - "Unsure of value" checkbox (can be unsure of both type AND value)
   - Optional ("Unsure of value" = £0)
   - Round to £1 on save
   - NOTE: DB pensions display differently in visualization (annual income vs lump sum)

4. **Has Beneficiary Been Nominated?** (RadioGroup with 3 options)
   - Options: Yes / No / Not Sure
   - REQUIRED
   - Critical for distribution visualization:
     - YES: Pension bypasses estate, goes to nominated beneficiary
     - NO: Pension goes to estate, distributed per will
     - NOT SURE: Flagged for user to check with provider
   - Default: "Not Sure" // Don'd have this help text as we can flag this later.

**UI Behavior:**
- Form starts VISIBLE if no pensions exist
- Form HIDDEN after first pension (shows "Add Another Pension" button)
- Pensions list shows: provider, type, value (with "/year" if DB), beneficiary status
- Collapsible list with eye icon
- Pensions Total under last card (with note about nominated beneficiaries)
- Edit/Delete buttons
- Continue button in ScrollView content

**Display in List:**

Defined Benefit:
```
Scottish Widows - Defined Benefit
£15,000/year
Beneficiary: Not Sure
```

SIPP:
```
Hargreaves Lansdown - SIPP
£200,000
Beneficiary: No (goes to estate)
```

Workplace (Unsure):
```
Company Pension - Workplace Pension
£150,000
Beneficiary: Yes (bypasses estate)
```

**Validation:**
- Provider REQUIRED
- Pension Type REQUIRED
- Beneficiary Nominated REQUIRED (defaults to "Not Sure")
- Value optional ("Unsure of value" = £0)

**State Management:**
- Load pensions via `bequeathalActions.getAssetsByType('pensions')`
- Add pension via `bequeathalActions.addAsset('pensions', pensionData)`
- Update pension via `bequeathalActions.updateAsset(id, updates)`
- Remove pension via `bequeathalActions.removeAsset(id)`
- Total calculation: Sum all pension values

**Title Generation:**
- Format: `[Provider]` or `[Provider] - [Pension Type]`

**Special Considerations:**

**Visualization Impact:**
- Pensions with "Beneficiary: Yes" should be marked as "Paid Outside Estate"
- Total estate calculation might exclude these
- Future: Estate visualization screen will need to handle this

**Value Display:**
- DB pensions: Show as "£15,000/year" (not converted to lump sum)
- DC, SIPP, Workplace, Unsure: Show as "£200,000" (lump sum)
- Visualization screen will need to handle annual vs lump sum differently

**Pension Type → Value Field Mapping:**
- **Defined Benefit** → Shows "Annual Amount (£/year)" field
- **All Others** (DC, SIPP, Workplace, Unsure) → Shows "Total Value" field

**Navigation:**
- Back → `/bequeathal/pensions/intro`
- Continue → Next selected category or `/order-of-things`

**Components Needed:**
- Select (existing - 5 options will use Menu mode)
- Input (existing)
- CurrencyInput (existing - with conditional label)
- RadioGroup (existing) for beneficiary nominated question
- Button (existing)
- Custom checkbox for "Unsure of value" (existing pattern)

**Summary of Changes from Web Prototype:**
- ❌ Removed "Policy Number" (deferred to Executor Facilitation phase - value first!)
- ❌ Removed "Monthly Contribution" (not needed for visualization)
- ❌ Removed "Pension Owner" field (single will assumption)
- ❌ Removed "Linked Employer" (not needed for value visualization)
- ✅ Expanded "Pension Type" to 5 user-friendly options (DB/DC/SIPP/Workplace/Unsure)
- ✅ Kept "Beneficiary Nominated" (CRITICAL for distribution visualization)
- ✅ Added "Unsure of value" checkbox (consistency with other assets)
- ✅ Conditional value field label (DB = £/year, others = total)
- ✅ 4 fields instead of 7 (43% reduction, faster user flow)

**Effort:** 
- Task 9.1 (Clean types): 15 minutes
- Task 9.2 (Intro screen): 1-2 hours
- Task 9.3 (Entry screen): 2-3 hours
- **Total: 3-4 hours**

**NOTES FOR FUTURE:**
- Policy numbers and detailed access info will be collected in "Executor Facilitation" phase
- This keeps initial will creation fast and focused on value/distribution
- User gets visualization of "who gets what" without getting bogged down in admin details
- DB pensions store ANNUAL values (£/year) in estimatedValue field - visualization must handle this

---

✅ **PHASE 9 COMPLETE**

---

## Phase 9.6: Add Conditional Beneficiary Percentages to Pensions (1 hour)

**Rationale:** When user selects "Has Beneficiary Been Nominated? YES", we need to track WHO those beneficiaries are and their % splits for visualization.

**Example:**
```
Scottish Widows SIPP (£200,000)
Beneficiary Nominated: Yes
Split: Spouse 60% (£120k), Children 40% (£80k)
```

**Visualization Impact:** Shows exactly where pension money goes, not just "bypasses estate"

### Task 9.6.1: Update PensionAsset Type

**File:** `native-app/src/types/index.ts`

**Add beneficiaryAssignments field:**
```typescript
export interface PensionAsset extends BaseAsset {
  type: 'pensions';
  provider: string;
  pensionType: PensionType;
  beneficiaryNominated?: 'yes' | 'no' | 'not-sure';
  beneficiaryAssignments?: BeneficiaryAssignments;  // ← ADD THIS (conditional)
}
```

**Used when:** `beneficiaryNominated === 'yes'`

### Task 9.6.2: Update Pensions Entry Screen

**File:** `native-app/app/bequeathal/pensions/entry.tsx`

**Add conditional field after "Has Beneficiary Been Nominated?":**

```typescript
{/* Beneficiary Nominated Question */}
<RadioGroup
  label="Has Beneficiary Been Nominated? *"
  value={formData.beneficiaryNominated}
  onChange={(value) => {
    setFormData(prev => ({ ...prev, beneficiaryNominated: value }));
    // Clear beneficiaries if changing from Yes to No/Not Sure
    if (value !== 'yes' && formData.beneficiaries.length > 0) {
      setFormData(prev => ({ ...prev, beneficiaries: [] }));
    }
  }}
  options={beneficiaryNominatedOptions}
/>

{/* Conditional: Show beneficiary percentages if "Yes" selected */}
{formData.beneficiaryNominated === 'yes' && (
  <BeneficiaryWithPercentages
    allocationMode="percentage"
    value={formData.beneficiaries}
    onChange={(beneficiaries) => setFormData(prev => ({ ...prev, beneficiaries }))}
    personActions={personActions}
    beneficiaryGroupActions={beneficiaryGroupActions}
    label="Who are the beneficiaries?"
    onAddNewPerson={() => setShowAddPersonDialog(true)}
    onAddNewGroup={() => setShowGroupDrawer(true)}
  />
)}
```

**Form State Update:**
```typescript
interface PensionForm {
  provider: string;
  pensionType: PensionType | '';
  estimatedValue: number;
  beneficiaryNominated: 'yes' | 'no' | 'not-sure' | '';
  beneficiaries: BeneficiaryAssignment[];  // ← ADD THIS
}
```

**Validation:**
- If beneficiaryNominated === 'yes': beneficiaries.length > 0 AND percentages total 100%
- If beneficiaryNominated !== 'yes': beneficiaries not required

**Display in List:**

With Beneficiaries:
```
Scottish Widows - SIPP
£200,000
Beneficiary: Yes
For: Spouse 60% (£120k), Children 40% (£80k)
```

Without Beneficiaries:
```
Aviva - Workplace Pension  
£150,000
Beneficiary: No (goes to estate)
```

**Storage (when Yes):**
```json
{
  "beneficiaryNominated": "yes",
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-123", "type": "person", "percentage": 60 },
      { "id": "group-456", "type": "group", "percentage": 40 }
    ]
  }
}
```

**Effort:** 1 hour (component already built, conditional logic straightforward)

**Benefit:** Complete visualization - know exactly where pension proceeds go, not just that they bypass estate

### ⚠️ CRITICAL GOTCHAS - Phase 9.6

**1. Conditional Field Visibility (MUST HANDLE CAREFULLY):**

**Scenario:** User selects "Yes", adds beneficiaries, then changes to "No"

**MUST:**
- Clear beneficiaries array when changing from Yes to No/Not Sure
- Don't leave orphaned beneficiary data
- Show warning if they already entered percentages?

**CODE:**
```typescript
onChange={(value) => {
  setFormData(prev => ({ ...prev, beneficiaryNominated: value }));
  // Clear beneficiaries if changing from Yes to No/Not Sure
  if (value !== 'yes' && prev.beneficiaries.length > 0) {
    // Optional: Show confirmation dialog
    setFormData(prev => ({ ...prev, beneficiaries: [] }));
  }
}}
```

**2. Validation Complexity:**

**OLD:** Just check `beneficiaryNominated` is selected
**NEW:** 
- If Yes: MUST have beneficiaries AND percentages must total 100%
- If No/Not Sure: beneficiaries optional (should be empty)

**CODE:**
```typescript
const canSubmit = formData.provider.trim() && 
  formData.pensionType && 
  formData.beneficiaryNominated &&
  (formData.beneficiaryNominated !== 'yes' || 
   (formData.beneficiaries.length > 0 && validatePercentageAllocation({ beneficiaries: formData.beneficiaries })));
```

**3. Display Logic Branching:**

**MUST show different displays:**
- Yes + has beneficiaries: Show percentage breakdown
- Yes + no beneficiaries: Show "Beneficiary: Yes (not specified)"
- No: Show "Goes to estate"
- Not Sure: Show "Check with provider"

**4. Edit Mode Backward Compatibility:**

**OLD pensions don't have beneficiaryAssignments field**

**CODE:**
```typescript
setFormData({
  ...
  beneficiaryNominated: pension.beneficiaryNominated || '',
  beneficiaries: pension.beneficiaryAssignments?.beneficiaries || []  // ← Handles old data
});
```

### 📋 EXPLICIT INSTRUCTIONS - Phase 9.6

**Step 1: UPDATE PensionAsset type**
```typescript
// In src/types/index.ts
// Find: export interface PensionAsset
// ADD: beneficiaryAssignments?: BeneficiaryAssignments;
```

**Step 2: ADD to form state**
```typescript
// Find: interface PensionForm
// ADD: beneficiaries: BeneficiaryAssignment[];
// Initialize: beneficiaries: []
```

**Step 3: ADD imports**
```typescript
import { BeneficiaryWithPercentages } from '../../../src/components/forms';
import { validatePercentageAllocation } from '../../../src/utils/beneficiaryHelpers';
import type { BeneficiaryAssignment } from '../../../src/types';
```

**Step 4: ADD conditional field in JSX**
```typescript
// AFTER RadioGroup for "Has Beneficiary Been Nominated?"
// ADD: {formData.beneficiaryNominated === 'yes' && (
//   <BeneficiaryWithPercentages ... />
// )}
```

**Step 5: UPDATE RadioGroup onChange**
```typescript
// Add logic to clear beneficiaries when changing from Yes to No
```

**Step 6: UPDATE validation (canSubmit)**
```typescript
// OLD: formData.beneficiaryNominated
// NEW: formData.beneficiaryNominated AND (if yes, validate beneficiaries)
```

**Step 7: UPDATE save logic**
```typescript
// In handleAddPension:
// ADD: beneficiaryAssignments when beneficiaryNominated === 'yes'
// OMIT: beneficiaryAssignments when 'no' or 'not-sure'
```

**Step 8: UPDATE display in list**
```typescript
// Find pension card display
// ADD: Show beneficiary breakdown if beneficiaryAssignments exists
// Show percentage allocations inline
```

**Step 9: UPDATE edit mode**
```typescript
// In handleEditPension:
// LOAD: beneficiaryAssignments?.beneficiaries || []
// Handle old pensions without this field
```

**Step 10: NO DUPLICATION**
```bash
# Search for duplicate beneficiary display logic
# Use getBeneficiaryDisplayName() helper (already exists)
# Don't rewrite display logic - reuse helpers
```

### 🚨 OVER-COMPLICATION CHECK

**Question:** Are we over-engineering this?

**Analysis:**
- Pensions with nominated beneficiaries: Common ✓
- Knowing WHO gets it: Essential for visualization ✓
- Percentage splits: Common (spouse 50%, kids 50%) ✓
- Conditional field: Appropriate (only ask if relevant) ✓

**Verdict:** NOT over-complicated. This is necessary for complete visualization.

**Alternative (simpler but worse):**
- Just have "Beneficiary Nominated? Yes/No/Not Sure" with no details
- Pro: Simpler code
- Con: Can't visualize WHERE pension money goes
- **Decision:** Current approach is right. Complexity justified by value.

---

## Phase 9.5: Unified Beneficiary Model + BeneficiaryWithPercentages Component (3 hours)

**Purpose:** Build reusable component for beneficiary selection with percentage/amount allocations

**Required For:**
- Phase 10: Life Insurance (beneficiaries with % or £ splits)
- Future Phase 14: Property trusts (remainder beneficiaries with %)
- Future: Estate Remainder distribution

**Reference:** Web prototype `PersonSelectorField.tsx` lines 56-158 (PercentageInputWithLock) and percentage normalization logic

### Unified Beneficiary Data Model

**CRITICAL:** Before building the component, we need a consistent data structure across ALL asset types.

**Problem:** Current native app has duplicate, inconsistent beneficiaryAssignments definitions:
- PropertyAsset: Has `percentage` field
- ImportantItemAsset: NO `percentage` field
- InvestmentAsset: NO `percentage` field
- **Same structure defined 3 times!** Maintenance nightmare.

**Solution:** Create single reusable type used by all assets.

#### Task 9.5.1: Define Unified Beneficiary Types

**File:** `native-app/src/types/index.ts`

**New Type Definitions (ULTRA-CLEAN):**

```typescript
/**
 * Beneficiary Assignment
 * 
 * Minimal, denormalized beneficiary allocation structure.
 * Stores only IDs and allocations - names/relationships looked up from Person/Group records.
 * 
 * Design Principles:
 * - Single source of truth (Person/Group records for names)
 * - No cached data (prevents stale data issues)
 * - No calculated fields (compute when needed)
 * - Minimal storage (4 fields max)
 * 
 * Usage Patterns:
 * 
 * SIMPLE (no allocations):
 *   { id: 'person-123', type: 'person' }
 *   Used in: Important Items, Investments, Crypto
 *   Name/relationship looked up via personActions.getPersonById()
 * 
 * PERCENTAGE ALLOCATION:
 *   { id: 'person-123', type: 'person', percentage: 50 }
 *   Used in: Life Insurance, Property trusts
 *   Validation: Use getAllocationType() and getTotalAllocated() helpers
 * 
 * AMOUNT ALLOCATION:
 *   { id: 'person-123', type: 'person', amount: 250000 }
 *   Used in: Life Insurance (partial payouts)
 *   Validation: amounts can be partial
 * 
 * @property id - Person ID, Group ID, or 'estate'
 * @property type - Discriminator ('person' | 'group' | 'estate')
 * @property percentage - Percentage allocation 0-100 (optional, for percentage mode)
 * @property amount - Amount allocation in £ (optional, for amount mode)
 */
export interface BeneficiaryAssignment {
  id: string;
  type: 'person' | 'group' | 'estate';
  percentage?: number;
  amount?: number;
}

/**
 * Beneficiary Assignments Container
 * 
 * Simple array wrapper for beneficiary assignments.
 * All metadata (allocationType, totalAllocated, names, relationships) are COMPUTED not stored.
 * 
 * Data Integrity:
 * - Person names come from Person records (single source of truth)
 * - Allocation totals calculated when needed (no stale cached totals)
 * - Allocation type inferred from data (no redundant type field)
 * 
 * Storage in AsyncStorage:
 * {
 *   "beneficiaries": [
 *     { "id": "person-123", "type": "person", "percentage": 50 },
 *     { "id": "person-456", "type": "person", "percentage": 50 }
 *   ]
 * }
 * 
 * Display: Use helper functions to get names/totals/types
 * 
 * @property beneficiaries - Array of beneficiary assignments (4 fields each max)
 */
export interface BeneficiaryAssignments {
  beneficiaries: BeneficiaryAssignment[];
}
```

**Helper Functions (src/utils/beneficiaryHelpers.ts):**

```typescript
import type { BeneficiaryAssignments, BeneficiaryAssignment } from '../types';
import type { PersonActions, BeneficiaryGroupActions } from '../types';

/**
 * Get allocation type by inspecting data
 * No need to store it - just check if percentage/amount fields exist
 * 
 * @param assignments - Beneficiary assignments object
 * @returns Allocation type ('none', 'percentage', or 'amount')
 */
export function getAllocationType(
  assignments?: BeneficiaryAssignments
): 'none' | 'percentage' | 'amount' {
  if (!assignments?.beneficiaries.length) return 'none';
  
  const hasPercentage = assignments.beneficiaries.some(b => 
    b.percentage !== undefined && b.percentage !== null
  );
  if (hasPercentage) return 'percentage';
  
  const hasAmount = assignments.beneficiaries.some(b => 
    b.amount !== undefined && b.amount !== null
  );
  if (hasAmount) return 'amount';
  
  return 'none';
}

/**
 * Calculate total allocated (percentage or amount)
 * Always computed fresh - never stale
 * 
 * @param assignments - Beneficiary assignments object
 * @returns Total percentage (0-100) or total amount (£)
 */
export function getTotalAllocated(
  assignments?: BeneficiaryAssignments
): number {
  if (!assignments?.beneficiaries.length) return 0;
  
  const type = getAllocationType(assignments);
  
  if (type === 'percentage') {
    return assignments.beneficiaries.reduce((sum, b) => sum + (b.percentage || 0), 0);
  }
  
  if (type === 'amount') {
    return assignments.beneficiaries.reduce((sum, b) => sum + (b.amount || 0), 0);
  }
  
  return 0;
}

/**
 * Validate percentage allocations
 * Ensures percentages total 100% (with floating point tolerance)
 * 
 * @param assignments - Beneficiary assignments object
 * @returns True if valid (totals 100% within tolerance)
 */
export function validatePercentageAllocation(
  assignments?: BeneficiaryAssignments
): boolean {
  if (getAllocationType(assignments) !== 'percentage') return true;
  
  const total = getTotalAllocated(assignments);
  return Math.abs(total - 100) < 0.01; // 0.01 tolerance for floating point
}

/**
 * Get display name for beneficiary
 * Looks up from Person/Group records (never stale)
 * 
 * @param beneficiary - Beneficiary assignment
 * @param personActions - Person actions for lookups
 * @param beneficiaryGroupActions - Group actions for lookups
 * @returns Display name with relationship if person
 */
export function getBeneficiaryDisplayName(
  beneficiary: BeneficiaryAssignment,
  personActions: PersonActions,
  beneficiaryGroupActions: BeneficiaryGroupActions
): string {
  if (beneficiary.type === 'estate') {
    return 'The Estate';
  }
  
  if (beneficiary.type === 'group') {
    const group = beneficiaryGroupActions.getGroupById(beneficiary.id);
    return group?.name || 'Unknown Group';
  }
  
  if (beneficiary.type === 'person') {
    const person = personActions.getPersonById(beneficiary.id);
    if (!person) return 'Unknown Person';
    
    const fullName = getPersonFullName(person);
    const relationship = getPersonRelationshipDisplay(person);
    return relationship ? `${fullName} (${relationship})` : fullName;
  }
  
  return 'Unknown';
}

/**
 * Get all assets for a specific beneficiary
 * Useful for "Who inherits what?" visualization
 * 
 * @param beneficiaryId - Person, group, or 'estate' ID
 * @param allAssets - All assets in the estate
 * @returns Assets where beneficiary is assigned
 */
export function getAssetsForBeneficiary(
  beneficiaryId: string,
  allAssets: Asset[]
): Asset[] {
  return allAssets.filter(asset =>
    asset.beneficiaryAssignments?.beneficiaries.some(b => b.id === beneficiaryId)
  );
}

/**
 * Calculate total value allocated to beneficiary across all assets
 * Handles percentage and amount allocations
 * 
 * @param beneficiaryId - Person, group, or 'estate' ID
 * @param allAssets - All assets in the estate
 * @returns Total £ value allocated to this beneficiary
 */
export function calculateBeneficiaryInheritance(
  beneficiaryId: string,
  allAssets: Asset[]
): number {
  return allAssets.reduce((total, asset) => {
    const beneficiary = asset.beneficiaryAssignments?.beneficiaries.find(
      b => b.id === beneficiaryId
    );
    
    if (!beneficiary) return total;
    
    const assetValue = asset.estimatedValue || 0;
    
    // Percentage allocation
    if (beneficiary.percentage) {
      return total + (assetValue * (beneficiary.percentage / 100));
    }
    
    // Amount allocation
    if (beneficiary.amount) {
      return total + beneficiary.amount;
    }
    
    // Simple allocation (split equally among all beneficiaries)
    const beneficiaryCount = asset.beneficiaryAssignments?.beneficiaries.length || 1;
    return total + (assetValue / beneficiaryCount);
  }, 0);
}
```

**Update All Asset Types to Use Unified Type:**

```typescript
// Remove ALL duplicate beneficiaryAssignments inline definitions
// Replace with single BeneficiaryAssignments type reference

export interface ImportantItemAsset extends BaseAsset {
  type: 'important-items';
  beneficiaryAssignments?: BeneficiaryAssignments;  // ← Unified type (no percentages)
}

export interface InvestmentAsset extends BaseAsset {
  type: 'investment';
  investmentType: string;
  provider: string;
  accountNumber?: string;
  beneficiaryAssignments?: BeneficiaryAssignments;  // ← Unified type (no percentages)
}

export interface LifeInsuranceAsset extends BaseAsset {
  type: 'life-insurance';
  provider: string;
  policyType: string;
  sumInsured: number;
  beneficiaryAssignments?: BeneficiaryAssignments;  // ← Unified type (WITH percentages/amounts)
}

export interface PensionAsset extends BaseAsset {
  type: 'pensions';
  provider: string;
  pensionType: PensionType;
  beneficiaryNominated?: 'yes' | 'no' | 'not-sure';
  beneficiaryAssignments?: BeneficiaryAssignments;  // ← Unified type (optional future enhancement)
}

export interface PropertyAsset extends BaseAsset {
  type: 'property';
  address: AddressData;
  propertyType: string;
  beneficiaryAssignments?: BeneficiaryAssignments;  // ← Unified type (WITH percentages for trusts)
}

// Cryptocurrency and Bank Accounts: No beneficiaries (left to estate by default)
```

**Benefits of Ultra-Clean Model:**
- ✅ **Single source of truth** - Person names in Person records, not cached
- ✅ **No stale data** - John Smith changes name, immediately reflects everywhere
- ✅ **No redundant calculations** - totalAllocated computed when needed
- ✅ **Minimal storage** - 4 fields per beneficiary max (vs 6 with caching)
- ✅ **DRY principle** - One BeneficiaryAssignment type for all assets
- ✅ **Type-safe** - TypeScript prevents errors
- ✅ **Flexible** - Simple assets use 2 fields, complex use 4 fields
- ✅ **Fast queries** - AsyncStorage lookups are instant (offline-first)

**Storage Examples in AsyncStorage (JSON):**

**Simple Beneficiaries (Important Items):**
```json
{
  "id": "item-001",
  "type": "important-items",
  "title": "Wedding Ring",
  "estimatedValue": 2500,
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-123", "type": "person" },
      { "id": "estate", "type": "estate" }
    ]
  }
}
```
Names looked up when displaying: `getBeneficiaryDisplayName(b, personActions, groupActions)`

**Percentage Allocation (Life Insurance):**
```json
{
  "id": "life-001",
  "type": "life-insurance",
  "title": "Aviva Life Policy",
  "estimatedValue": 500000,
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-123", "type": "person", "percentage": 60 },
      { "id": "person-456", "type": "person", "percentage": 40 }
    ]
  }
}
```
Total calculated: `getTotalAllocated(assignments)` → 100
Type inferred: `getAllocationType(assignments)` → 'percentage'

**Amount Allocation (Life Insurance Partial Payout):**
```json
{
  "id": "life-002",
  "type": "life-insurance",
  "title": "Scottish Widows Policy",
  "estimatedValue": 1000000,
  "beneficiaryAssignments": {
    "beneficiaries": [
      { "id": "person-123", "type": "person", "amount": 200000 },
      { "id": "person-456", "type": "person", "amount": 100000 },
      { "id": "estate", "type": "estate", "amount": 700000 }
    ]
  }
}
```
Total calculated: `getTotalAllocated(assignments)` → 1000000
Type inferred: `getAllocationType(assignments)` → 'amount'

**Validation Patterns Using Helper Functions:**

```typescript
import { getAllocationType, getTotalAllocated, validatePercentageAllocation } from '../utils/beneficiaryHelpers';

// Validate before saving life insurance
const type = getAllocationType(beneficiaryAssignments);
if (type === 'percentage' && !validatePercentageAllocation(beneficiaryAssignments)) {
  Alert.alert('Invalid Allocation', 'Percentages must total 100%');
  return;
}

// Display total
const total = getTotalAllocated(beneficiaryAssignments);
const isValid = type === 'percentage' ? Math.abs(total - 100) < 0.01 : true;
```

**Query Patterns Using Helper Functions:**

```typescript
import { 
  getAssetsForBeneficiary, 
  calculateBeneficiaryInheritance,
  getBeneficiaryDisplayName 
} from '../utils/beneficiaryHelpers';

// Find all assets for a person (simple)
const johnsAssets = getAssetsForBeneficiary('person-123', allAssets);

// Calculate John's total inheritance (handles %, £, and simple allocations)
const johnsTotal = calculateBeneficiaryInheritance('person-123', allAssets);

// Display beneficiary name with relationship (always current)
const displayName = getBeneficiaryDisplayName(
  beneficiary, 
  personActions, 
  beneficiaryGroupActions
);
// Returns: "John Smith (Spouse)" - looked up from Person record

// Visualization: Group assets by beneficiary
const beneficiaryMap = new Map<string, { total: number, assets: Asset[] }>();
allAssets.forEach(asset => {
  asset.beneficiaryAssignments?.beneficiaries.forEach(b => {
    if (!beneficiaryMap.has(b.id)) {
      beneficiaryMap.set(b.id, { total: 0, assets: [] });
    }
    beneficiaryMap.get(b.id)!.assets.push(asset);
  });
});

// Calculate totals for each beneficiary
beneficiaryMap.forEach((data, beneficiaryId) => {
  data.total = calculateBeneficiaryInheritance(beneficiaryId, allAssets);
});
```

**Data Integrity & Performance:**

**No Caching = No Stale Data:**
- Person changes name → Immediately reflects in all asset displays
- Group renamed → Immediately updates everywhere
- No sync issues, no cache invalidation logic

**Lookup Performance (AsyncStorage):**
- `personActions.getPersonById()` reads from in-memory state (instant)
- State loaded from AsyncStorage on app start
- All lookups are synchronous, no await needed
- **Displaying 100 beneficiaries = 100 instant lookups**

**When to Compute:**
- Names/relationships: On display (render time)
- Allocation type: When validating or displaying type-specific UI
- Total allocated: When validating or showing progress
- **Never stored, always fresh**

**Migration from Current Implementation:**
- Current PropertyAsset has percentage field ✓ Compatible
- Current ImportantItemAsset has no percentage field ✓ Compatible  
- Current InvestmentAsset has no percentage field ✓ Compatible
- **NO data migration needed** - existing data works with new types
- Only update TypeScript interface definitions

**Effort:** 
- Define BeneficiaryAssignment + BeneficiaryAssignments types: 15 min
- Define helper functions in beneficiaryHelpers.ts: 15 min
- Update all asset type interfaces to use unified type: 10 min
- Test helper functions: 10 min
- **Total: 50 minutes**

---

### Component Specification

**File:** `src/components/forms/BeneficiaryWithPercentages.tsx`

**Uses:** Unified BeneficiaryAssignments type defined above

**Additional Features:**
1. **Percentage Input Per Beneficiary**
   - Input field next to each selected beneficiary
   - Auto-calculation to ensure 100% total
   - Lock/unlock icon per beneficiary
   - Locked beneficiaries don't auto-adjust

2. **Allocation Mode**
   - Percentage mode: Split by % (must total 100%)
   - Amount mode: Split by £ (for life insurance)
   - Toggle between modes

3. **Auto-Normalization**
   - When percentages don't total 100%, auto-adjust unlocked beneficiaries
   - Locked beneficiaries keep their %
   - Last unlocked beneficiary gets the difference

4. **Validation**
   - Percentages must total 100% (with tolerance for floating point)
   - Amounts can total anything (for life insurance partial allocations)
   - At least one beneficiary required

**Component Props Interface:**
```typescript
interface BeneficiaryWithPercentagesProps {
  // Allocation settings
  allocationMode: 'percentage' | 'amount';
  totalValue?: number;  // For amount mode: total policy value for context
  
  // Value management (uses unified BeneficiaryAssignment type)
  value: BeneficiaryAssignment[];
  onChange: (value: BeneficiaryAssignment[]) => void;
  
  // Person/Group lookups
  personActions: PersonActions;
  beneficiaryGroupActions: BeneficiaryGroupActions;
  
  // Optional callbacks
  onAddNewPerson?: () => void;
  onAddNewGroup?: () => void;
  
  // UI
  label?: string;
  excludePersonIds?: string[];
}

// Uses BeneficiaryAssignment from types (no component-specific type needed)
// BeneficiaryAssignment already has percentage and amount fields
```

**UI Components (SIMPLIFIED):**

**Beneficiary Chip with Manual Input:**
```
┌─────────────────────────────────────┐
│ John Smith (Spouse)             [X] │
│ Percentage: [50]%                   │
│ ↳ Equally distribute the rest      │ ← Shows when focused
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Jane Doe (Daughter)             [X] │
│ Percentage: [  ]%  ← Empty          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Bob Smith (Son)                 [X] │
│ Percentage: [  ]%  ← Empty          │
└─────────────────────────────────────┘
```

**Total Display:**
```
Total: 50% (50% remaining) ⚠️

[Clear All Percentages]
```

**After "Equally Distribute":**
```
Total: 100% ✓
```

**Implementation Approach (SIMPLIFIED):**

1. **Render MultiBeneficiarySelector at top** (person selection)
2. **For each selected beneficiary**, show:
   - Name and relationship chip
   - Percentage or Amount input field
   - "Equally distribute the rest" link (shows when input focused)
   - Remove button (X)
3. **Total indicator** at bottom:
   - Current total with remaining: "Total: 75% (25% remaining)"
   - Green checkmark when 100%
   - Red warning when !== 100%
4. **Clear All button** at bottom:
   - Resets all percentages to empty
   - Quick way to start over

**Simplified Implementation Logic (NOT using web prototype complexity):****

**1. Manual Percentage Entry:**
```typescript
<TextInput
  value={beneficiary.percentage?.toString() || ''}
  onChangeText={(text) => {
    const num = parseFloat(text.replace(/[^\d.]/g, '')) || 0;
    updateBeneficiaryPercentage(index, Math.min(100, num));
  }}
  onFocus={() => setFocusedIndex(index)}
  keyboardType="decimal-pad"
  placeholder="0"
/>
<Text>%</Text>
```

**2. "Equally Distribute the Rest" Helper (User-Triggered):**
```typescript
function handleEquallyDistributeRest(currentIndex) {
  // Calculate remaining %
  const filledTotal = beneficiaries
    .reduce((sum, b) => sum + (b.percentage || 0), 0);
  const remaining = 100 - filledTotal;
  
  // Find EMPTY beneficiaries only (excluding current)
  const emptyBeneficiaries = beneficiaries
    .filter((b, idx) => idx !== currentIndex && (!b.percentage || b.percentage === 0));
  
  if (emptyBeneficiaries.length === 0) return;
  
  // Distribute equally among empty ones
  const equalShare = remaining / emptyBeneficiaries.length;
  
  const updated = [...beneficiaries];
  emptyBeneficiaries.forEach((_, originalIdx) => {
    const idx = beneficiaries.findIndex((b, i) => 
      i !== currentIndex && (!beneficiaries[i].percentage || beneficiaries[i].percentage === 0)
    );
    updated[idx].percentage = parseFloat(equalShare.toFixed(1));
  });
  
  onChange(updated);
}
```

**3. Clear All Percentages:**
```typescript
function handleClearAll() {
  const cleared = beneficiaries.map(b => ({ 
    ...b, 
    percentage: undefined,
    amount: undefined 
  }));
  onChange(cleared);
}
```

**4. Total Calculation & Validation:**
```typescript
const total = beneficiaries.reduce((sum, b) => sum + (b.percentage || 0), 0);
const isValid = Math.abs(total - 100) < 0.01; // 0.01 tolerance for floating point
const remaining = 100 - total;

// Submit disabled if not 100%
const canSubmit = isValid && beneficiaries.length > 0;
```

**Testing in Sandbox:**
- Test manual entry: User enters 50%, 30%, 20% manually
- Test equally distribute: User enters 50%, taps "equally distribute" → other 2 get 25% each
- Test clear all: Reset all percentages to empty
- Test validation: Total !== 100% shows error, disables submit
- Test amount mode: Enter £ amounts instead of %
- Test floating point: 33.3% × 3 (user must manually fix to 100%)

**Components Needed:**
- MultiBeneficiarySelector (existing - for person selection)
- Input (existing - for percentage/amount entry)
- IconButton (existing - for lock/unlock)
- TouchableOpacity (primitive)

**State Management:**
- Local state for lock status (which beneficiaries are locked)
- Parent handles overall beneficiary list with allocations
- Component handles percentage calculations and normalization

**React Native Implementation - Simplified Approach:**

**What We're Building:**
- Manual percentage input per beneficiary
- "Equally distribute the rest" helper button (user-triggered)
- "Clear All" reset button
- Total validation (must equal 100%)
- NO auto-lock, NO auto-redistribution, NO complex normalization

**Differences from Web Prototype:**
- ❌ **No auto-lock on edit** - removed complexity
- ❌ **No lock/unlock icons** - removed state management
- ❌ **No proportional redistribution** - removed algorithm
- ❌ **No automatic normalization** - user enters values manually
- ❌ **No useEffect auto-redistribution** - removed side effects
- ❌ **No interest types** - trust-specific, defer to Phase 14
- ❌ **No cessation criteria** - trust-specific, defer to Phase 14
- ✅ **"Equally distribute" helper** - simple, user-triggered assistance
- ✅ **Total validation** - clear feedback, disable submit if !== 100%
- ✅ **Amount mode** - for life insurance £ allocations

**Effort Breakdown:**

**Task 9.5.1 - Unified Data Model (50 minutes):**
- Define BeneficiaryAssignment interface: 15 min
- Define BeneficiaryAssignments interface: 5 min  
- Create beneficiaryHelpers.ts with 5 helper functions: 20 min
- Update all asset type interfaces: 10 min

**Task 9.5.2 - BeneficiaryWithPercentages Component (2 hours):**
- Build beneficiary selection (reuse MultiBeneficiarySelector): 10 min
- Build percentage input per beneficiary chip: 30 min
- Implement "equally distribute the rest" button logic: 30 min
- Implement "clear all" button: 10 min
- Build total calculation display with validation: 20 min
- Amount mode variant: 10 min
- Testing in Component Sandbox with all scenarios: 30 min

**Total: 2.8 hours (~3 hours)** (down from 5+ hours in original plan!)

**Time Saved:**
- No auto-lock logic: -1 hour
- No proportional redistribution: -1 hour
- No normalization algorithm: -30 min
- Clean data model prevents future debugging: -∞ hours

**Implementation Principles:**

1. **No Caching** - Names/relationships looked up from Person/Group records
   - `getBeneficiaryDisplayName()` called on render
   - Always current, never stale
   - Single source of truth

2. **No Calculated Storage** - totals/types computed when needed
   - `getTotalAllocated()` called for validation
   - `getAllocationType()` called for conditional logic
   - Never out of sync

3. **Helper Functions Over Methods** - Pure functions in utils
   - Testable in isolation
   - Reusable across components
   - No class inheritance complexity

4. **Minimal Storage** - Only store IDs and allocations
   - 2-4 fields per beneficiary (vs 6 with caching)
   - Smaller AsyncStorage footprint
   - Faster serialization/deserialization

5. **Manual Control** - User triggers distributions, not automatic
   - "Equally distribute" button, not auto-redistribution
   - Predictable behavior
   - No confusing side effects

**NOTES:**
- Build in Component Sandbox FIRST
- Test unified BeneficiaryAssignment type with mock data
- Helper functions in beneficiaryHelpers.ts before component
- Manual control is BETTER than magic
- ~150 lines component + ~100 lines helpers = 250 lines total
- Vs web prototype: 765 lines (67% reduction!)

---

✅ **READY TO BUILD**

**Phase 9.5 Plan:** Lines 1056-1528 in @native-app/planning/ASSET_MANAGEMENT_PLAN.md

**Deliverables:**
1. BeneficiaryAssignment + BeneficiaryAssignments interfaces
2. beneficiaryHelpers.ts with 5 functions
3. Updated asset type interfaces (remove duplicate definitions)
4. BeneficiaryWithPercentages component  
5. Component Sandbox tests

**Estimated: 3 hours total**

**Phase 9.5 Plan Location:** Lines 1052-1202 in @native-app/planning/ASSET_MANAGEMENT_PLAN.md

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
7. ✅ **important-items-flow** - Implement important items intro and entry screens
8. ✅ **searchable-select** - Create SearchableSelect component for bank provider dropdown
9. ✅ **multi-beneficiary-selector** - Create MultiBeneficiarySelector component for beneficiary selection
10. ✅ **sequential-navigation** - Implement category navigation system
11. ✅ **crypto-flow** - Implement crypto currency intro and entry screens  
12. ✅ **investments-flow** - Implement investments intro and entry screens (MODERATE)
13. **investments-percentages-retrofit** - Retrofit investments with BeneficiaryWithPercentages (Phase 8.5)
14. ✅ **pensions-flow** - Implement pensions intro and entry screens
15. ✅ **beneficiary-model-unified** - Create unified beneficiary data model and helpers (Phase 9.5)
16. ✅ **beneficiary-with-percentages** - Build BeneficiaryWithPercentages component (Phase 9.5)
17. **pensions-beneficiaries-retrofit** - Add conditional beneficiary percentages to pensions (Phase 9.6)
18. **life-insurance-flow** - Implement life insurance intro and entry screens (uses Phase 9.5 component)
19. **company-shares-flow** - Implement private company shares intro and entry screens
20. **business-assets-flow** - Implement assets-held-through-business screens (COMPLEX)
21. **agricultural-flow** - Implement agricultural assets screens (VERY COMPLEX)
22. **property-flow** - Implement property screens with multi-step wizard (VERY COMPLEX)

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

#### 2. BeneficiaryWithPercentages (Built in Phase 9.5 - SIMPLIFIED APPROACH)
**Purpose:** Manual percentage/amount allocation for beneficiaries
**File:** `src/components/forms/BeneficiaryWithPercentages.tsx`
**Size:** ~150 lines (down from 300-400 in original plan)
**Features:**
- Everything from MultiBeneficiarySelector (person selection)
- Manual percentage inputs per beneficiary
- "Equally distribute the rest" helper button (user-triggered)
- "Clear All" reset button
- Total validation (must equal 100% for percentage mode)
- Amount mode (for life insurance £ allocations)
- NO auto-lock, NO auto-redistribution, NO complex normalization

**NOT Included (see Appendix for rationale):**
- ❌ Auto-lock on edit
- ❌ Automatic percentage redistribution
- ❌ Lock/unlock toggle icons
- ❌ Proportional vs equal redistribution algorithms
- ❌ Normalization to last beneficiary
- ❌ Trust metadata (deferred to Phase 14)

**Used in:** Life Insurance (Phase 10), Pensions (optional), Property (Phase 14)

**Benefits:**
- Simple, predictable user experience
- Manual control (no magic)
- Fast to build (2-2.5 hours vs 5+ hours)
- Easy to maintain (150 lines vs 300+)
- Follows KISS principle
- Can enhance later if needed

---

## APPENDIX: Unimplemented Features - BeneficiaryWithPercentages Component

**For Notion / Product Backlog**

### Features NOT Implemented (Simplified Approach vs Web Prototype)

**Context:** The web prototype's `PersonSelectorField` component includes sophisticated percentage allocation features (765 lines total). For the native app MVP, we deliberately simplified to a manual, user-controlled approach.

#### 1. Auto-Lock on Edit
**Web Prototype Behavior:**
- When user edits a beneficiary's percentage and blurs the input, that beneficiary automatically locks
- Prevents future auto-adjustments from changing user's explicit allocation
- Locked beneficiaries show a lock icon

**Why Removed:**
- Adds hidden complexity (users don't understand why some beneficiaries lock and others don't)
- Requires lock state management across component
- Users lose control (can't unlock easily)
- **Simplified to:** Manual percentage entry only, no automatic locking

#### 2. Automatic Percentage Redistribution
**Web Prototype Behavior:**
- When user changes one percentage, unlocked beneficiaries automatically adjust
- Uses proportional redistribution if unlocked beneficiaries have existing percentages
- Uses equal redistribution if unlocked beneficiaries are empty
- Triggered on every percentage change (onBlur)

**Example:** User changes John from 30% to 50%. System automatically reduces Jane and Bob from 35% each to 25% each (proportionally).

**Why Removed:**
- "Magic" behavior confuses users ("Why did Jane's % change when I edited John?")
- Complex algorithm with proportional vs equal redistribution logic
- Requires tracking locked vs unlocked state
- **Simplified to:** "Equally distribute the rest" button (user-triggered, predictable)

#### 3. Normalization to Last Beneficiary
**Web Prototype Behavior:**
- After redistribution, adds/subtracts rounding errors to last unlocked beneficiary
- Ensures total is exactly 100% even with floating point math
- Example: 33.3% × 3 = 99.9%, last beneficiary becomes 33.4%

**Why Removed:**
- Over-engineering for edge case (0.1% rounding errors)
- Users can manually adjust if total shows 99.9%
- Adds unexpected behavior (last person's % changes without user action)
- **Simplified to:** Show validation error if !== 100%, user fixes manually

#### 4. Lock/Unlock Toggle Icons
**Web Prototype Behavior:**
- Each beneficiary has lock icon (🔓/🔒)
- Tap to manually lock/unlock
- Locked beneficiaries excluded from auto-redistribution
- Visual indicator of which allocations are "protected"

**Why Removed:**
- Adds UI complexity (extra icon, extra state)
- Most users don't need fine-grained lock control
- Confusing UX for non-technical users
- **Simplified to:** All percentages are "manual" (user has full control, no locking needed)

#### 5. Proportional vs Equal Redistribution Logic
**Web Prototype Behavior:**
- Smart detection: If unlocked beneficiaries have existing percentages, redistribute proportionally
- If unlocked beneficiaries are empty/zero, redistribute equally
- Preserves relative proportions when possible

**Example:** 
- Before: John 50% (locked), Jane 30% (unlocked), Bob 20% (unlocked)
- User changes John to 60%
- System: Jane becomes 24% (30 × 0.8 ratio), Bob becomes 16% (20 × 0.8 ratio)

**Why Removed:**
- Complex algorithm users don't understand
- "Why did my percentages change to weird decimals?"
- Requires tracking which beneficiaries had values vs were empty
- **Simplified to:** "Equally distribute" button always uses equal split (predictable)

#### 6. useEffect Auto-Redistribution on Add/Remove
**Web Prototype Behavior:**
- When beneficiary added: Automatically redistributes percentages among all unlocked
- When beneficiary removed: Redistributes their % to remaining unlocked beneficiaries
- Maintains 100% total automatically

**Why Removed:**
- User adds Jane, suddenly John and Bob's percentages change without warning
- Confusing side effects
- Requires complex useEffect dependency tracking
- **Simplified to:** Manual percentage entry, no auto-redistribution

### Rationale for Simplified Approach

**Product Philosophy - Value First:**
- Goal: Get beneficiary allocations for will visualization
- NOT goal: Build a sophisticated financial planning calculator
- Users can handle entering percentages manually
- Complex auto-adjustment creates confusion, not value

**Engineering Philosophy - KISS Principle:**
- Simpler code = fewer bugs
- Manual control = predictable behavior
- User-triggered actions = clear cause and effect
- 150 lines of code instead of 300+

**User Experience:**
- "Equally distribute" helper button provides assist without magic
- Clear All button provides easy reset
- Total display with validation provides clear feedback
- User always knows why percentages changed (they changed them)

**Time to Value:**
- Simplified version: 2-2.5 hours to build
- Complex version: 5+ hours to build
- Difference: 2.5 hours saved per similar component
- Faster iteration, faster MVP

**Future Enhancement Path:**
If user testing shows need for auto-redistribution:
- Can add as Phase 2 enhancement
- Keep it optional (toggle "Auto-adjust mode")
- Learn from user behavior first before adding complexity

### Implementation Status

**Native App (Simplified):**
- Manual percentage entry per beneficiary
- "Equally distribute the rest" helper button
- "Clear All" button
- Total validation
- **Build time: 2-2.5 hours**

**Web Prototype (Complex):**
- Auto-lock on edit
- Automatic redistribution (proportional + equal modes)
- Lock/unlock toggle icons
- Normalization to last beneficiary
- useEffect auto-redistribution
- **Build time: 5+ hours (already built in web)**

**Decision:** Ship simplified version in native app MVP. Add complexity later ONLY if user testing shows it's needed.

---

