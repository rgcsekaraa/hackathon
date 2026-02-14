"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Rendered at the bottom of the body so it does not block paint.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // Service worker registration failed -- non-critical for dev
        });
    }
  }, []);

  return null;
}
