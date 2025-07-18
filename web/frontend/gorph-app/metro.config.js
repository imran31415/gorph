const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for WASM and large modules
config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('wasm');

// Increase the maximum bundle size to accommodate large WASM modules
config.transformer.maxWorkers = 1;

// Add resolver for @hpcc-js/wasm
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config; 