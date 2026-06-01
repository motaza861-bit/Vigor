'use strict';

// Lightweight mock for react-native-reanimated that works in Jest without native modules
// This is returned when tests call jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

const noop = () => {};
const identity = (v) => v;

// Minimal shared value mock using plain JS ref
function makeSharedValue(init) {
  let _value = init;
  return {
    get value() { return _value; },
    set value(v) { _value = v; },
    modify: noop,
    addListener: noop,
    removeListener: noop,
  };
}

function useSharedValue(init) {
  // In tests, we just return a plain object since hooks work without full React
  return makeSharedValue(init);
}

function useAnimatedStyle(factory) {
  try { return factory(); } catch { return {}; }
}

function useAnimatedProps(factory) {
  try { return factory(); } catch { return {}; }
}

const withTiming = (value) => value;
const withSpring = (value) => value;
const withDelay = (delay, value) => value;
const withRepeat = (animation) => animation;
const withSequence = (...args) => args[args.length - 1];
const cancelAnimation = noop;
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

const Easing = {
  linear: identity,
  ease: identity,
  quad: identity,
  cubic: identity,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
  back: () => identity,
  bezier: () => identity,
  elastic: () => identity,
  bounce: identity,
  exp: identity,
  circle: identity,
};

function createAnimatedComponent(Component) {
  return Component;
}

const Animated = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  createAnimatedComponent,
  call: noop,
  event: () => noop,
};

module.exports = {
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: () => noop,
  useAnimatedGestureHandler: () => ({}),
  useAnimatedReaction: noop,
  useDerivedValue: (factory) => makeSharedValue(factory()),
  useScrollViewOffset: () => makeSharedValue(0),
  useEvent: () => noop,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withDecay: (config) => (config && config.velocity) ? config.velocity : 0,
  cancelAnimation,
  runOnJS,
  runOnUI,
  Easing,
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  interpolate: (value, input, output) => (output && output[0] !== undefined) ? output[0] : 0,
  interpolateColor: () => 'transparent',
  createAnimatedComponent,
  Animated,
  ...Animated,
};
