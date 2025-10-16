"use client";
import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        // console.log('SW registered', reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              // New content is available; you might want to notify the user
              // Here we simply reload to activate the new service worker
              if (navigator.serviceWorker.controller) {
                // There's an existing controller, so this is an update
                // Avoid infinite reload loops
                if (!refreshing) {
                  refreshing = true;
                  window.location.reload();
                }
              }
            }
          });
        });
      } catch (err) {
        // Registration failed
        console.warn('SW registration failed', err);
      }
    };

    register();
  }, []);

  return null;
}
