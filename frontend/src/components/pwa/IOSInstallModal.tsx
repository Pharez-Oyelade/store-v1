"use client";

import React from "react";
import { Share, PlusSquare, X, Smartphone } from "lucide-react";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center border border-brand-100 text-brand-600">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Install Vendra on iOS</h3>
            <p className="text-xs text-gray-500">Run as a standalone app on your iPhone or iPad</p>
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 shrink-0 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              1
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              Tap the <span className="font-semibold text-gray-900 inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs"><Share className="w-3.5 h-3.5 text-blue-600" /> Share</span> button in Safari&apos;s bottom toolbar.
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 shrink-0 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              2
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              Scroll down the menu and tap <span className="font-semibold text-gray-900 inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs"><PlusSquare className="w-3.5 h-3.5 text-gray-800" /> Add to Home Screen</span>.
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 shrink-0 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              3
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              Tap <span className="font-semibold text-blue-600">Add</span> in the top right corner. Vendra will be added to your home screen!
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
