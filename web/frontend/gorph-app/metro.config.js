const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add WASM file support
config.resolver.assetExts.push('wasm');

// Ensure public folder assets are accessible
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 