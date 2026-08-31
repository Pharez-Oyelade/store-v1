"use client";

import Button from "@/components/custom/Button";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, easeOut } from "framer-motion";
import React, { useRef } from "react";
import { Check, TrendingUp, ArrowRight } from "lucide-react";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative px-4 sm:px-8 md:px-16 lg:px-20 pt-32 md:pt-16 pb-8  items-center md:pb-16 flex flex-col md:flex-row md:gap-8 lg:gap-0 min-h-svh overflow-hidden bg-white"
    >
      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-100 rounded-full blur-[120px] opacity-40 animate-gradient-slow -z-10 translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-50 rounded-full blur-[100px] opacity-60 -z-10 -translate-x-1/4 translate-y-1/4" />

      {/* Hero content — left column */}
      <motion.div
        style={{ y, opacity }}
        className="w-full md:w-[52%] lg:w-[46%] shrink-0 space-y-6 md:space-y-8 z-10"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-card border-brand-200"
        >
          <span className="text-brand-700 text-xs md:text-sm font-semibold uppercase tracking-wider">
            Built for Nigerian Fashion Vendors
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: easeOut }}
          className="text-[3rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[4.75rem] xl:text-[5.5rem] font-black text-gray-900 tracking-tighter leading-[1.05]"
        >
          Your Store, <br /> <span className="text-brand-600">finally</span>{" "}
          under control.
        </motion.h1>

        {/* Sub-text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: easeOut }}
          className="max-w-xl text-base md:text-lg text-gray-600 leading-relaxed"
        >
          Stop managing orders in DMs and inventory in notebooks. Vendra gives
          fashion vendors one clean, powerful dashboard for everything.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: easeOut }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2"
        >
          <Link href="/login">
            <Button
              size="large"
              variant="primary"
              className="shadow-lg active:scale-95 hover:shadow-brand-500/50 transition-shadow"
            >
              Get Started Free
            </Button>
          </Link>

          <Link href="/how-it-works">
            <Button
              size="large"
              variant="ghost"
              className="hover:bg-brand-50 text-brand-700 group active:scale-95"
            >
              <span className="flex items-center gap-2">
                <span>See how it works</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex gap-8 lg:gap-10 items-center text-sm"
        >
          {[
            "No credit card\nrequired",
            "Easy setup in\nminutes",
            "Cancel anytime",
          ].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <div className="p-1 rounded-full border-2 font-bold border-brand-600 shrink-0">
                <Check className="w-3 h-3 text-brand-500 font-bold" />
              </div>
              <p className="whitespace-pre-line leading-snug">{label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Hero Image — right column */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: easeOut }}
        className="w-full md:flex-1 mt-10 md:mt-0 z-10 min-w-0"
      >
        <div className="relative w-full aspect-[4/3] scale-110 origin-center transition-transform duration-300 ease-in-out group">
          <Image
            fill
            src="/vendra_dash.png"
            alt="Vendra Dashboard Preview"
            priority
            className="object-contain group-hover:scale-105 transition-transform duration-300 ease-in-out"
          />

          {/* Card 1 — Analytics (bottom-left) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6, ease: easeOut }}
            className="absolute top-[68%] left-[2%] -rotate-6 glass-card p-3 lg:p-4 rounded-xl shadow-xl border-glow w-[34%] max-w-[240px] hidden sm:block"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-brand-600" />
              </div>
              <h3 className="text-xs lg:text-sm font-bold text-gray-800">
                Analytics
              </h3>
            </div>
            <p className="text-[10px] lg:text-xs text-gray-500 font-medium leading-snug">
              Get insights on your sales and inventory
            </p>
          </motion.div>

          {/* Card 2 — Order #302 (bottom-right area) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6, ease: easeOut }}
            className="absolute top-[68%] left-[58%] glass-card p-3 lg:p-4 rounded-xl shadow-xl border-glow w-[28%] max-w-[196px] hidden sm:block"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-success-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xs lg:text-sm font-bold text-gray-800">
                Order #302
              </h3>
            </div>
            <p className="text-[10px] lg:text-xs text-gray-500 font-medium">
              Payment confirmed
            </p>
            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-success-500 w-full animate-pulse" />
            </div>
          </motion.div>

          {/* Card 3 — Today's Revenue (top-right corner) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6, ease: easeOut }}
            className="absolute -top-[30%] -right-[50%] -rotate-3 glass-card p-3 lg:p-4 rounded-xl shadow-xl border-glow w-[30%] max-w-[196px] hidden sm:block"
          >
            <h3 className="text-[10px] lg:text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
              Today's Revenue
            </h3>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg lg:text-2xl font-bold text-gray-900">
                ₦245K
              </span>
              <span className="text-[10px] lg:text-xs text-success-600 font-bold flex items-center">
                <svg
                  className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                12%
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
