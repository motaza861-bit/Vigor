'use strict';

const React = require('react');
const { View } = require('react-native/Libraries/Components/View/View');

module.exports = {
  get: (name, viewConfigProvider) => {
    // Return a basic View-based component for any native component
    const Component = React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref });
    });
    Component.displayName = name;
    return Component;
  },
  setRuntimeConfigProvider: () => {},
};
