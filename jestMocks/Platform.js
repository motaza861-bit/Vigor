'use strict';

const Platform = {
  OS: 'ios',
  Version: 16,
  isPad: false,
  isTVOS: false,
  isTV: false,
  select: (obj) => {
    if (obj.ios !== undefined) return obj.ios;
    if (obj.native !== undefined) return obj.native;
    return obj.default;
  },
};

module.exports = { default: Platform, ...Platform };
