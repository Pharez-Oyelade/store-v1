import React from "react";
import Link from "next/link";
import {
  Scissors,
  Sparkles,
  Home,
  ArrowLeft,
  ShoppingBag,
  HelpCircle,
} from "lucide-react";
import Logo from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#fbfbfe] via-white to-brand-50/30 flex flex-col justify-between text-gray-900 selection:bg-brand-100 selection:text-brand-900">
      {/* Subtle background fashion grid / glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#2722c5_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>
        <Link
          href="/pricing"
          className="text-xs font-bold text-gray-600 hover:text-brand-700 transition-colors"
        >
          View Plans &rarr;
        </Link>
      </header>

      {/* Main Fashion 404 Hero */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 sm:py-20 text-center space-y-8">
        {/* Animated Visual Motif */}
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-brand-100/60 rotate-6 transition-transform hover:rotate-12 duration-300" />
          <div className="absolute inset-0 rounded-3xl bg-amber-100/80 -rotate-3 transition-transform hover:-rotate-6 duration-300" />
          <div className="relative size-24 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center text-brand-700">
            <Scissors size={40} className="rotate-45" />
          </div>
          <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-brand-600 text-white shadow-md">
            <Sparkles size={14} />
          </span>
        </div>

        {/* 404 & Copy */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-800 text-xs font-bold uppercase tracking-widest">
            <span>Out of Style</span>
          </div>

          <h1 className="text-4xl sm:text-8xl font-serif font-bold text-gray-950 tracking-tight leading-tight">
            404
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
            Style not found. Looks like this piece was unstitched
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-all shadow-md active:scale-98"
          >
            <Home size={16} fill="white" />
            <span className="text-white">Return to Homepage</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold transition-all shadow-xs active:scale-98"
          >
            <ShoppingBag size={16} />
            <span>Vendor Dashboard</span>
          </Link>
        </div>

        {/* Helpful Direct Links */}
        <div className="pt-8 border-t border-gray-100 max-w-md mx-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Popular Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-brand-700">
            <Link
              href="/how-it-works"
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 transition-colors"
            >
              Pricing Tiers
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 transition-colors"
            >
              About Vendra
            </Link>
            <Link
              href="/contact"
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-200 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 max-w-7xl mx-auto w-full text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Vendra. Empowering African fashion
        brands to scale.
      </footer>
    </div>
  );
}
