"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Search,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Title } from "@/components/ui/Title";
import { showcaseFeatures } from "./whatsappShowcaseData";
import { PhoneMockup } from "./PhoneMockup";

const CYCLE_DURATION_MS = 8000;

const iconMap = {
  ShoppingBag,
  TrendingUp,
  Package,
  Search,
  AlertCircle,
};

export const WhatsAppShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.25 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeFeature = showcaseFeatures[activeIndex];

  const nextFeature = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % showcaseFeatures.length);
  }, []);

  // Performance-optimized Auto-cycle timer: ONLY runs when visible in viewport
  useEffect(() => {
    if (!isInView || isPaused) return;

    const timer = setInterval(() => {
      nextFeature();
    }, CYCLE_DURATION_MS);

    return () => clearInterval(timer);
  }, [isInView, isPaused, nextFeature, activeIndex]);

  const handleSelectFeature = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <section
      ref={sectionRef}
      id="whatsapp-assistant"
      aria-label="WhatsApp AI Assistant Showcase"
      className="relative px-5 md:px-15 py-20 md:py-28 bg-gradient-to-b from-surface-base via-emerald-50/25 to-white overflow-hidden border-t border-gray-100/80"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-200/25 rounded-full blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-brand-100/30 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Top Title & Eyebrow */}
      <div className="max-w-6xl mx-auto mb-8 md:mb-14">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4 shadow-2xs">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
            <span>Built-in WhatsApp Commerce</span>
          </div> */}

          <Title
            eyebrowTitle="Vendra Assistant"
            headingStart="Manage your store with a"
            headingSpan="simple text."
            text="No complicated software to learn. Record sales, manage inventory, and check debtor balances directly through WhatsApp text messages."
          />
        </div>
      </div>

      {/* Mobile-Only Horizontal Pill Tabs */}
      <div className="lg:hidden max-w-6xl mx-auto mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
          {showcaseFeatures.map((feature, idx) => {
            const Icon = iconMap[feature.iconName];
            const isActive = idx === activeIndex;

            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleSelectFeature(idx)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-2xs",
                  isActive
                    ? "bg-[#075e54] text-white shadow-md shadow-emerald-950/20 scale-[1.02]"
                    : "bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50",
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    isActive ? "text-emerald-300" : "text-gray-500",
                  )}
                />
                <span>{feature.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile active feature tagline badge */}
        <div className="text-center mt-2 mb-2">
          <p className="text-xs text-emerald-800 font-medium bg-emerald-50/80 px-3.5 py-1 rounded-full inline-block border border-emerald-200/60 shadow-2xs">
            {activeFeature.tagline}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Phone Mockup, Right Feature List */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Phone Mockup */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex justify-center"
          >
            <PhoneMockup
              conversation={activeFeature.conversation}
              featureId={activeFeature.id}
              isInView={isInView}
            />
          </motion.div>

          {/* Mobile-Only CTA & Value Props (placed below phone for smooth mobile hierarchy) */}
          <div className="lg:hidden mt-8 w-full flex flex-col items-center text-center space-y-4 pt-6 border-t border-gray-200/70">
            <div className="space-y-1.5 text-xs font-semibold text-gray-700">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Available 24/7 on your existing WhatsApp</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Understands Nigerian shopping terms</span>
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#075e54] hover:bg-[#064e46] text-white text-sm font-semibold shadow-md shadow-emerald-950/20 active:scale-95 transition-all group"
            >
              <span className="text-white">Try Vendra Assistant</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-white" />
            </Link>
          </div>
        </div>

        {/* Right Column: Desktop-Only Interactive Feature List */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center">
          {/* Feature Selector Cards */}
          <div className="space-y-3.5">
            {showcaseFeatures.map((feature, idx) => {
              const Icon = iconMap[feature.iconName];
              const isActive = idx === activeIndex;

              return (
                <div
                  key={feature.id}
                  onClick={() => handleSelectFeature(idx)}
                  className={cn(
                    "relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden",
                    isActive
                      ? "bg-white border-2 border-emerald-500/80 shadow-lg shadow-emerald-900/5 p-5 md:p-6"
                      : "bg-white/70 hover:bg-white border border-gray-200/70 hover:border-gray-300 p-4 md:p-4.5 opacity-85 hover:opacity-100",
                  )}
                >
                  {/* Active Card Progress Bar (only animates while visible and not paused) */}
                  {isActive && isInView && !isPaused && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-100 overflow-hidden">
                      <motion.div
                        key={`bar-${activeIndex}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: CYCLE_DURATION_MS / 1000,
                          ease: "linear",
                        }}
                        className="h-full bg-emerald-600 rounded-r-full"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Feature Icon Badge */}
                    <div
                      className={cn(
                        "w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 group-hover:bg-emerald-50",
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4
                          className={cn(
                            "text-base md:text-lg font-bold tracking-tight transition-colors",
                            isActive ? "text-gray-900" : "text-gray-700",
                          )}
                        >
                          {feature.title}
                        </h4>
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-colors",
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {feature.badge}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "text-xs md:text-sm mt-0.5 transition-colors line-clamp-1",
                          isActive
                            ? "text-emerald-700 font-medium"
                            : "text-gray-500",
                        )}
                      >
                        {feature.tagline}
                      </p>

                      {/* Expandable description on active item */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="mt-3 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                              {feature.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Bottom CTAs & Value Props */}
          <div className="mt-8 pt-6 border-t border-gray-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Available 24/7 on your existing WhatsApp number</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>
                  Understands voice notes & Nigerian shopping phrasing
                </span>
              </div>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#075e54] hover:bg-[#064e46] text-white text-sm font-semibold shadow-md shadow-emerald-950/20 active:scale-95 transition-all group"
            >
              <span className="text-white">Try Vendra Assistant</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppShowcase;
