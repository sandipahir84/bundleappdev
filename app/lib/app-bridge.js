import { createApp } from '@shopify/app-bridge';

// Global appBridgeInstance
export let appBridgeInstance = null;

// Set the instance
export function setAppBridgeInstance(app) {
  appBridgeInstance = app;
}

// Create the App Bridge instance
export function createAppBridge(config) {
  if (typeof window === 'undefined') return null; // Make sure it's client side

  const app = createApp(config);

  setAppBridgeInstance(app);

  return app;
}
