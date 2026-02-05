# Kindling - React Native App

Kindling is a mobile application for will creation and estate planning, built with React Native and Expo.

## Technology Stack

- **Framework**: Expo SDK 54 with React Native
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: AsyncStorage + custom hooks
- **Forms**: React Hook Form
- **TypeScript**: Strict mode enabled
- **API Mocking**: JSON Server (planned)

## Prerequisites

- Node.js >= 20.11.0
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Studio (for Android development)
- Expo Go app on your physical device (optional)

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

**For Development (Recommended):**
```bash
# Start Expo development server
npm start

# Then press:
# - i for iOS Simulator
# - a for Android Emulator
# - Scan QR code with Expo Go app on your device
```

**Platform-Specific Commands:**
```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android

# Web Browser (not recommended for this app)
npm run web
```

**Mock API (Optional - Not Currently Used):**
```bash
# In a separate terminal window:
npm run mock-api

# Note: The app currently uses AsyncStorage only.
# Mock API is configured for future backend integration.
```

## Project Structure

```
native-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with theme provider
│   └── index.tsx          # Entry screen
├── src/
│   ├── types/             # TypeScript interfaces and types
│   ├── constants/         # App constants and configuration
│   ├── hooks/             # Custom React hooks
│   ├── components/        # Reusable components
│   │   ├── ui/           # Base UI components
│   │   ├── forms/        # Form components
│   │   └── screens/      # Screen-specific components
│   ├── utils/            # Helper functions
│   ├── services/         # API and data services
│   └── styles/           # Theme and style constants
├── assets/               # Images, fonts, and other static files
│   └── videos/          # Video assets for intro screens
└── mock-api/            # JSON Server mock API (planned)
```

## Video Assets

Intro videos are stored in `assets/videos/` with naming convention:
- `intro-v1.mp4` - Version 1 intro video
- `intro-v2.mp4` - Version 2 intro video (if created)

The version number corresponds to the `show_video` parameter from deep links.

## Development Workflow

### Path Aliases

The project uses TypeScript path aliases for clean imports:

```typescript
import { Button } from '@components/ui/Button';
import { useAppState } from '@hooks/useAppState';
import type { Person } from '@types';
```

### Theme System

The app uses a custom theme based on Kindling's brand colors:

```typescript
import { KindlingColors, kindlingTheme } from '@styles/theme';
import { Spacing, Typography, Shadows } from '@styles/constants';
```

### Git Workflow

- Commit frequently with conventional commit messages:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for tests
  - `refactor:` for code refactoring
- Test before every commit
- Never commit broken code

## Scripts

```bash
# Development
npm start              # Start Expo development server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run on web browser

# Testing (planned)
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode

# Building (planned)
npm run build         # Build for production

# Linting (planned)
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues
```

## Features (Planned)

### Phase 1 - Foundation ✅ COMPLETE
- [x] Expo project setup with TypeScript
- [x] React Native Paper UI library
- [x] Expo Router navigation
- [x] Theme system with Kindling brand colors
- [x] Project structure and path aliases

### Phase 2 - Data Layer ✅ COMPLETE
- [x] Type definitions from web prototype (500+ lines, 50+ interfaces)
- [x] AsyncStorage persistence (storage service wrapper)
- [x] useAppState hook (700+ lines with all actions)
- [x] Seed data system (6 seed functions)

### Phase 3 - API Layer ✅ COMPLETE
- [x] JSON Server mock API configured
- [x] API service layer with type-safe methods
- [x] Offline queue management
- [x] Network state detection (NetInfo)

### Phase 4 - Component Library ✅ COMPLETE
- [x] Base UI components (11 components: Button, Input, Select, Checkbox, RadioGroup, Switch, Slider, Dialog, Card, Accordion, Tabs)
- [x] Form components (5 components: Currency, Percentage, Date, Address, PersonSelector)
- [x] Specialized components (KindlingLogo created)
- [ ] List components (will be created as needed)

### Phase 5 - Onboarding Flow ✅ COMPLETE (Enhanced)
- [x] OnboardingWelcomeScreen (name, DOB, age validation)
- [x] OnboardingLocationScreen (UK region, nationality, domicile)
- [x] **OnboardingFamilyScreen (ENHANCED)** - Full spouse/partner forms, children management with add/edit/remove, relationship edge creation
- [x] **OnboardingExtendedFamilyScreen (NEW)** - Parents, siblings, and other important people management
- [x] **OnboardingWrapUpScreen (ENHANCED)** - Dynamic summary with family statistics and next steps preview
- [x] **OrderOfThingsScreen (ENHANCED)** - Progress tracking, dynamic section visibility, "Coming Soon" placeholders, family overview stats
- [x] Developer Dashboard (AsyncStorage data viewer)

### Phase 5.5 - Relationship System ✅ COMPLETE
- [x] Full relationship edge creation (spouse, children, siblings, parents, friends)
- [x] Children under 18 detection and care category assignment
- [x] Bidirectional relationship querying
- [x] Clear onboarding family members functionality

### Phase 6 - Executor Flow ✅ COMPLETE
- [x] Executors Intro Screen
- [x] Executor Selection Screen (full CRUD with level hierarchy)
- [x] Executor Invitation Screen
- [x] Professional Executor Screen (placeholder)
- [x] Under-18 validation and warnings
- [x] Phone contacts integration
- [x] Video player integration

### Phase 7 - Developer Tools ✅ COMPLETE
- [x] Enhanced developer dashboard with organized navigation
- [x] Data Explorer with 3-level drill-down (Interfaces → Instances → Properties)
- [x] Role filtering, copy to clipboard, pretty renderers
- [x] Global dev dashboard access (header double-tap)

### Phase 8+ - Remaining Screens (Next)
- [ ] Guardianship flow (3-5 screens) ← RECOMMENDED NEXT
- [ ] Asset management (40+ screens: property, investments, pensions, etc.)
- [ ] Estate division (5-7 screens)
- [ ] Authentication screens (splash, login)
- [ ] Quiz flow (7 screens)
- [ ] And more...

## Documentation

- All components and functions include JSDoc comments
- Architecture documentation (coming soon)
- Component usage guides (coming soon)
- API integration guide (coming soon)

## Contributing

This is a private project. Please follow the established patterns and conventions when adding new features.

## License

Private - All rights reserved

## Support

For issues and questions, contact the development team.

