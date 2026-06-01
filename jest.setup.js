'use strict';

// Define globals needed by React Native
global.__DEV__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
global.nativeFabricUIManager = {};
global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true, renderers: { values: () => [] } };

// Prevent BatchedBridge NativeModules from throwing:
// "nativeModuleProxy" is checked first in NativeModules.js; if set, __fbBatchedBridgeConfig is not needed
global.nativeModuleProxy = {};

// react-native-worklets is mocked via moduleNameMapper in package.json

// Provide mock for TurboModuleRegistry.getEnforcing so it doesn't throw when
// modules like 'DeviceInfo' or 'ReactNativeFeatureFlags' are requested
global.__turboModuleProxy = (name) => {
  if (name === 'DeviceInfo') {
    return {
      getConstants: () => ({
        Dimensions: {
          window: { width: 375, height: 812, scale: 2, fontScale: 1 },
          screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
        },
      }),
    };
  }
  if (name === 'ReactNativeFeatureFlags' || name === 'NativeReactNativeFeatureFlags') {
    return {
      commonTestFlag: () => false,
      commonTestFlagWithoutNative: () => false,
      commonTestFlagWithoutNativeImplementation: () => false,
    };
  }
  if (name === 'UIManager') {
    return {
      getConstants: () => ({}),
      getViewManagerConfig: () => null,
      hasViewManagerConfig: () => false,
      getConstantsForViewManager: () => ({}),
      getDefaultEventTypes: () => [],
    };
  }
  if (name === 'PlatformConstants') {
    return {
      getConstants: () => ({
        forceTouchAvailable: false,
        osVersion: '16.0',
        interfaceIdiom: 'phone',
        isTesting: true,
        reactNativeVersion: { major: 0, minor: 85, patch: 0 },
      }),
    };
  }
  // Return a proxy for anything else to avoid getEnforcing errors
  return {};
};

// window and performance globals
if (typeof global.window === 'undefined') {
  global.window = global;
}
if (typeof global.performance === 'undefined') {
  global.performance = { now: () => Date.now() };
}
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
}
if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}
