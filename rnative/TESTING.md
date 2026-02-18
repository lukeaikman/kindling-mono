# Testing

## Architecture

Two test suites, both using Jest as the runner:

| Suite | Framework | Purpose | Runs on |
|-------|-----------|---------|---------|
| **Unit** | Jest | Pure logic, data mapping, hooks | Node (no simulator) |
| **E2E** | Detox (grey-box) | Full app flows on iOS simulator | iPhone 16 Pro sim |

E2E tests use a **seed state** approach — a Detox launch argument triggers in-app AsyncStorage seeding so tests skip onboarding/auth and land directly on the will dashboard.

## Commands

```bash
# Unit tests
npm test                        # run all unit tests
npm run test:watch              # watch mode

# E2E tests (must build first)
npm run build:e2e:ios           # build debug app for simulator
npm run test:e2e:ios            # run all E2E suites
npm run test:e2e:ios:release    # build + run release E2E

# Run a single E2E file
npx detox test --configuration ios.sim.debug e2e/bankAccounts.test.ts
```

## Test Files

### Unit

| File | Covers |
|------|--------|
| `app/bequeathal/property/__tests__/trustDataMapping.test.ts` | Trust ↔ form data mapping |

### E2E

| File | Covers |
|------|--------|
| `e2e/seedVerification.test.ts` | Seed pipeline smoke test (lands on will-dashboard) |
| `e2e/bankAccounts.test.ts` | Bank accounts — 37 tests across 5 describe blocks, 2 app resets |

### E2E Helpers

| File | Purpose |
|------|---------|
| `e2e/helpers/testSetup.ts` | `resetApp()`, `relaunchApp()`, `seedAndLaunch()` |
| `e2e/jest.config.ts` | Jest config for Detox (isolated from unit tests) |
| `.detoxrc.js` | Detox build/device configuration |
