/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: 'e2e/jest.config.ts',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/nativeapp.app',
      build:
        'xcodebuild -workspace ios/nativeapp.xcworkspace -scheme nativeapp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/nativeapp.app',
      build:
        'xcodebuild -workspace ios/nativeapp.xcworkspace -scheme nativeapp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 16 Pro' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
  },
};
