// Sentry's wrapper over Expo's default config: adds debug ids so EAS builds upload source maps.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = getSentryExpoConfig(__dirname);
