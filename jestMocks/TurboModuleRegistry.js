'use strict';

const deviceInfoModule = {
  getConstants: () => ({
    Dimensions: {
      window: { width: 375, height: 812, scale: 2, fontScale: 1 },
      screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
    },
  }),
};

const featureFlagsModule = {
  commonTestFlag: () => false,
  commonTestFlagWithoutNative: () => false,
  useModernForkingLogic: () => false,
};

const noop = () => ({});

module.exports = {
  getEnforcing: (name) => {
    if (name === 'DeviceInfo') return deviceInfoModule;
    if (name === 'ReactNativeFeatureFlags') return featureFlagsModule;
    if (name === 'NativeReactNativeFeatureFlags') return featureFlagsModule;
    return noop();
  },
  get: (name) => {
    if (name === 'DeviceInfo') return deviceInfoModule;
    if (name === 'ReactNativeFeatureFlags') return featureFlagsModule;
    if (name === 'NativeReactNativeFeatureFlags') return featureFlagsModule;
    return null;
  },
};
