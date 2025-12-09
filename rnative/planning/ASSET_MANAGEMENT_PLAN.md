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

✅ **UPDATED & READY FOR REVIEW**

**Phase 9 Plan Location:** Lines 823-994 in @native-app/planning/ASSET_MANAGEMENT_PLAN.md

**Please review and approve before implementation** 🎯

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
12. **investments-flow** - Implement investments intro and entry screens (MODERATE)
13. **pensions-flow** - Implement pensions intro and entry screens
14. **life-insurance-flow** - Implement life insurance intro and entry screens
15. **company-shares-flow** - Implement private company shares intro and entry screens
16. **business-assets-flow** - Implement assets-held-through-business screens (COMPLEX)
17. **agricultural-flow** - Implement agricultural assets screens (VERY COMPLEX)
18. **property-flow** - Implement property screens with multi-step wizard (VERY COMPLEX)

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

