// lib/use-init-app-bridge.js
import { useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { setAppBridgeInstance } from './app-bridge';

export function useInitAppBridge() {
  const app = useAppBridge();

  useEffect(() => {
    if (app) {
      setAppBridgeInstance(app);
    }
  }, [app]);
}
