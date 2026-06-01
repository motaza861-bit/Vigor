'use strict';

// Stub that always reports worklets version as compatible
module.exports = function validateWorkletsVersion() {
  return { ok: true };
};
