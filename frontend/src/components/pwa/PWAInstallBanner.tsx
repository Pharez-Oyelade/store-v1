"use client";

import React from "react";
import Image from "next/image";
import { Download, X, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { IOSInstallModal } from "./IOSInstallModal";

export default function PWAInstallBanner() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showBanner,
    showIOSInstructions,
    setShowIOSInstructions,
    promptInstall,
    dismissBanner,
  } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-md w-auto"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-200/90 text-gray-900">
              <div className="flex items-start gap-3.5">
                {/* App Logo */}
                <div className="w-12 h-12 rounded-xl bg-slate-900 p-2 shrink-0 shadow-xs flex items-center justify-center relative overflow-hidden">
                  <Image
                    src="/vendra-icon.svg"
                    alt="Vendra Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">
                      Install Vendra App
                    </h4>
                    {/* <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Sparkles className="w-2.5 h-2.5" /> Fast
                    </span> */}
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">
                    Full-screen dashboard, faster order lookups, and offline
                    reliability.
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => promptInstall()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isIOS ? "How to Install" : "Install Now"}
                    </button>
                    <button
                      onClick={() => dismissBanner(7)}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>

                {/* Dismiss X */}
                <button
                  onClick={() => dismissBanner(7)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors -mr-1 -mt-1"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for iOS Safari user instructions */}
      <IOSInstallModal
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  );
}
