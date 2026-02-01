const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Handle WASM files properly
config.resolver.assetExts.push('wasm');

module.exports = config;
