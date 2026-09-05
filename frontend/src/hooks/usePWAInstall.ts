"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = "vendra_pwa_dismissed_until";
const COOLDOWN_DAYS = 7;

// Module-level cache so deferredPrompt survives route changes and component remounts
let cachedPromptEvent: BeforeInstallPromptEvent | null = null;

function isCurrentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return false;
    const expiresAt = Number(item);
    return !isNaN(expiresAt) && expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(cachedPromptEvent);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(!!cachedPromptEvent);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to safely clear any scheduled banner timer
  const clearBannerTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Dismiss with cooldown
  const dismissBanner = useCallback(
    (days = COOLDOWN_DAYS) => {
      clearBannerTimer();
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      try {
        localStorage.setItem(STORAGE_KEY, until.toString());
      } catch {
        // Ignore storage errors
      }
      setShowBanner(false);
    },
    [clearBannerTimer]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setIsInstalled(true);
      setShowBanner(false);
      clearBannerTimer();
      return;
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;
    const isSafari =
      /safari/.test(ua) && !/chrome|crios|crmo|fxios|edg|opr/.test(ua);

    if (isIosDevice) {
      setIsIOS(true);
      if (isSafari && !isStandalone) {
        setIsInstallable(true);

        // Schedule banner for iOS Safari only if not dismissed
        if (!isCurrentlyDismissed()) {
          clearBannerTimer();
          timerRef.current = setTimeout(() => {
            if (!isCurrentlyDismissed()) {
              setShowBanner(true);
            }
          }, 3000);
        }
      }
    }

    // 3. Capture Chromium / Android `beforeinstallprompt`
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      cachedPromptEvent = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Schedule banner display only if not already dismissed in localStorage
      if (!isCurrentlyDismissed()) {
        clearBannerTimer();
        timerRef.current = setTimeout(() => {
          if (!isCurrentlyDismissed()) {
            setShowBanner(true);
          }
        }, 3000);
      }
    };

    // If cached prompt already existed from earlier event
    if (cachedPromptEvent && !isCurrentlyDismissed()) {
      clearBannerTimer();
      timerRef.current = setTimeout(() => {
        if (!isCurrentlyDismissed()) {
          setShowBanner(true);
        }
      }, 3000);
    }

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      cachedPromptEvent = null;
      clearBannerTimer();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearBannerTimer();
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [clearBannerTimer]);

  // Trigger the installation flow
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return false;
    }

    const prompt = deferredPrompt || cachedPromptEvent;
    if (!prompt) {
      return false;
    }

    try {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
        setDeferredPrompt(null);
        cachedPromptEvent = null;
        return true;
      } else {
        // User cancelled native dialog, dismiss for 3 days cooldown
        dismissBanner(3);
        return false;
      }
    } catch (err) {
      console.error("[PWA] Error triggering install prompt:", err);
      return false;
    }
  }, [deferredPrompt, isIOS, dismissBanner]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showBanner,
    showIOSInstructions,
    setShowIOSInstructions,
    promptInstall,
    dismissBanner,
  };
}
