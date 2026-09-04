"use client";

import { useState, useEffect, useCallback } from "react";

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

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setIsInstalled(true);
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
      }
    }

    // 3. Check if user recently dismissed the banner
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);
    const isDismissed =
      dismissedUntil !== null && Number(dismissedUntil) > Date.now();

    // 4. Capture Chromium / Android `beforeinstallprompt`
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // UX Guideline: Delay prompt appearance by 3s to not interrupt initial page load
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    // 5. If iOS Safari and not dismissed, also show after delay
    if (isIosDevice && isSafari && !isDismissed && !isStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    // 6. Listen for successful installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Trigger the installation flow
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return false;
    }

    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
        setDeferredPrompt(null);
        return true;
      } else {
        // User clicked cancel on native dialog, dismiss for cooldown
        dismissBanner(3);
        return false;
      }
    } catch (err) {
      console.error("[PWA] Error triggering install prompt:", err);
      return false;
    }
  }, [deferredPrompt, isIOS]);

  // Dismiss with cooldown
  const dismissBanner = useCallback((days = COOLDOWN_DAYS) => {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(STORAGE_KEY, until.toString());
    } catch {
      // Ignore storage errors
    }
    setShowBanner(false);
  }, []);

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
