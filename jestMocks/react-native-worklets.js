'use strict';

// Lightweight mock for react-native-worklets used during Jest testing
// Prevents native module initialization errors

const noop = () => {};
const identity = (v) => v;
const makeShareable = (v) => ({ __workletValue: v });

const RuntimeKind = { ReactNative: 1, UI: 2, Worker: 3 };

module.exports = {
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  runOnUISync: (fn, ...args) => (typeof fn === 'function' ? fn(...args) : undefined),
  scheduleOnUI: (fn) => fn,
  makeMutable: (value) => ({ value, modify: noop, addListener: noop, removeListener: noop }),
  makeShareableCloneRecursive: identity,
  makeShareableClone: identity,
  createSerializable: makeShareable,
  createWorkletRuntime: () => ({}),
  runOnRuntime: (runtime, fn) => fn,
  setDynamicFeatureFlag: noop,
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
  isWorkletFunction: () => false,
  RuntimeKind,
  serializableMappingCache: new Map(),
  WorkletEventHandler: class WorkletEventHandler {
    constructor(handler) { this.handler = handler; }
  },
  default: {
    runOnUI: (fn) => fn,
    runOnJS: (fn) => fn,
    createSerializable: makeShareable,
    serializableMappingCache: new Map(),
  },
};
