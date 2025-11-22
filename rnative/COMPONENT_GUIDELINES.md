# Kindling Component Guidelines

## Overview

This document describes the component architecture and design decisions for the Kindling React Native app.

## Component Philosophy

### 1. Build with Primitives, Not Library Components

**Why**: When a library component doesn't work as expected or limits our design, we build our own using React Native primitives.

**Example**: RadioGroup Component

**❌ Don't do this:**
```typescript
// Using RadioButton.Item - broken, no control
<RadioButton.Item
  label="Option"
  value="value"
/>
// Issues: Circle not rendering, limited styling, can't customize
```

**✅ Do this instead:**
```typescript
// Manual build with primitives
<TouchableOpacity onPress={...}>
  <RadioButton value="value" status="checked" />
  <Text>Option</Text>
</TouchableOpacity>
// Benefits: Full control, works reliably, designer-friendly
```

### 2. Components We Build Manually

These components are built with primitives for maximum control:

#### RadioGroup (`src/components/ui/RadioGroup.tsx`)
- **Why**: RadioButton.Item wasn't rendering circles
- **Built with**: TouchableOpacity + RadioButton + Text
- **Benefits**: Shows radio circle, fully customizable, clickable feedback

#### Checkbox (`src/components/ui/Checkbox.tsx`)
- **Why**: Need full control over layout and interaction
- **Built with**: TouchableOpacity + Checkbox + Text
- **Benefits**: Consistent with RadioGroup pattern

#### Button (`src/components/ui/Button.tsx`)
- **Wraps**: Paper's Button
- **Why**: Add Kindling brand variants (primary, secondary, destructive)
- **Benefits**: Consistent styling across app

#### Input (`src/components/ui/Input.tsx`)
- **Wraps**: Paper's TextInput
- **Why**: Add type-specific behavior, icons, validation
- **Benefits**: One component for all input types

### 3. Components That Wrap Paper

These components wrap Paper components to add Kindling-specific styling:

- **Dialog**: Wraps Paper Dialog with brand colors and action buttons
- **Select**: Wraps Paper Menu for dropdown functionality
- **Card**: Wraps Paper Card (use sparingly for lists, not layouts)
- **Switch**: Wraps Paper Switch with label integration

## Styling Principles

### Global Changes

All our custom components support **global styling changes**. To change a component's appearance across the entire app:

1. **Edit the component file** (e.g., `RadioGroup.tsx`)
2. **Change the StyleSheet** at the bottom
3. **Reload the app** - change applies everywhere

**Example**: Making radio buttons look like bordered buttons:

```typescript
// In RadioGroup.tsx
optionContainer: {
  borderWidth: 2,
  borderColor: KindlingColors.border,
  borderRadius: 12,
  paddingVertical: Spacing.lg,
  // etc.
}
```

This change affects **all RadioGroups** in the app instantly.

### Designer Handoff

When the designer comes to restyle:

1. **Show them Storybook** (when set up) - all components in isolation
2. **Point them to component files** (`src/components/ui/`)
3. **Each component has inline styles** - easy to modify
4. **Global changes** - modify component once, affects all usage
5. **No surprises** - all manually built components, no hidden library behaviors

## Component Organization

```
src/components/
├── ui/              # Base UI components (Button, Input, etc.)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── RadioGroup.tsx  ← Manually built
│   ├── Checkbox.tsx    ← Manually built
│   ├── Select.tsx      ← Wraps Paper Menu
│   └── index.ts        ← Barrel export
├── forms/           # Form-specific components
│   ├── DatePicker.tsx
│   ├── CurrencyInput.tsx
│   └── PersonSelectorField.tsx
└── screens/         # Screen-specific components (future)
```

## Documentation Standards

Every component must have:

1. **File-level JSDoc** - explains component purpose and architecture decisions
2. **Props interface** - with JSDoc for each prop
3. **Usage examples** - in JSDoc comments
4. **Storybook story** - for visual testing (when Storybook is set up)

## Testing Components

### Manual Testing (Now)
1. Use the component in a screen
2. Test all states (default, selected, disabled)
3. Test on iOS and Android
4. Check accessibility (VoiceOver/TalkBack)

### Storybook Testing (Future - requires Node 20.19+)
1. Run `npm run storybook`
2. View component in isolation
3. Test all props and variants
4. Show to designer for feedback

### Automated Testing (Future)
1. Jest + React Native Testing Library
2. Test component logic and interactions
3. Snapshot testing for UI regression

## Common Patterns

### Clickable Row Pattern
Used in: RadioGroup, Checkbox, Switch

```typescript
<TouchableOpacity
  onPress={handlePress}
  activeOpacity={0.7}
  style={styles.container}
>
  <ComponentIcon />
  <Text style={styles.label}>{label}</Text>
</TouchableOpacity>
```

### Conditional Styling Pattern
```typescript
style={[
  styles.base,
  isSelected && styles.selected,
  isDisabled && styles.disabled,
  customStyle  // Allow override
]}
```

### State Management in Components
```typescript
// Controlled component (parent manages state)
<RadioGroup value={value} onChange={setValue} />

// Uncontrolled component (internal state)
const [expanded, setExpanded] = useState(false);
```

## Lessons Learned

### RadioButton.Item Failure
- **Problem**: RadioButton.Item from Paper didn't render radio circles
- **Root Cause**: Unknown Paper library issue
- **Solution**: Built manually with TouchableOpacity + RadioButton + Text
- **Lesson**: Don't fight the library, build what you need

### Card Component for Layout
- **Problem**: Card component has built-in margins, constrains children
- **Root Cause**: Card designed for lists, not main layout containers
- **Solution**: Use plain View for main content areas, Card for lists only
- **Lesson**: Use primitives for layout, components for repeated elements

### Padding vs Margins
- **Problem**: Padding on parent constrained child width
- **Root Cause**: Misunderstanding box model (padding reduces content box)
- **Solution**: Use margins on children, not padding on parents
- **Lesson**: Parent padding = less space for children. Child margins = positioning.

## Future Enhancements

When designer arrives:
- [ ] Replace component-by-component with custom designs
- [ ] Use Storybook for design review
- [ ] Maintain same prop interfaces (easy swap)
- [ ] Test on multiple screen sizes
- [ ] Add animations and micro-interactions
- [ ] Ensure accessibility compliance

## Questions?

For component questions, check:
1. Component file JSDoc
2. Storybook stories (when available)
3. This guidelines document
4. Ask the senior dev who wrote this after learning their lesson 😅

