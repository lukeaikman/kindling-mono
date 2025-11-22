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

# Start the development server
npx expo start
```

### Running on Different Platforms

```bash
# Run on iOS Simulator (macOS only)
npm run ios

# Run on Android Emulator
npm run android

# Run on web browser
npm run web

# Scan QR code with Expo Go app on your device
# (QR code appears after running npx expo start)
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
└── mock-api/            # JSON Server mock API (planned)
```

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

### Phase 5 - Onboarding Flow ✅ PROOF OF CONCEPT COMPLETE
- [x] OnboardingWelcomeScreen (name, DOB, age validation)
- [x] OnboardingLocationScreen (UK region, nationality, domicile)
- [x] OnboardingFamilyScreen (relationship status, children - simplified)
- [x] OnboardingWrapUpScreen (summary and completion)
- [x] OrderOfThingsScreen (next steps navigation hub)
- [x] Developer Dashboard (AsyncStorage data viewer)

### Phase 6+ - Remaining Screens (In Progress)
- [ ] Full family management screens (complex forms)
- [ ] Executors flow (5 screens)
- [ ] Asset management (40+ screens)
- [ ] Guardianship (3 screens)
- [ ] Estate division (5 screens)
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

