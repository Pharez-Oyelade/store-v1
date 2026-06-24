"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Title } from "@/components/ui/Title";
import Button from "@/components/custom/Button";
import Card from "@/components/ui/Card";
import {
  Heart,
  Sparkles,
  Users,
  TrendingUp,
  Package,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
} from "lucide-react";

const page = () => {
  return (
    <div className="relative overflow-hidden bg-surface-base text-gray-900 pb-20">
      {/* Background blobs for premium glassmorphism aesthetic */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-brand-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative px-4 md:px-15 pt-20 pb-16 md:py-18 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="w-full lg:w-3/5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <span className="text-brand-600 text-xs md:text-sm font-bold uppercase tracking-wider">
                Behind the Platform
              </span>
              <div className="w-10 h-0.5 bg-brand-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]"
            >
              Empowering Africa's <br />
              <span className="text-brand-600 font-cursive text-5xl md:text-8xl">
                Fashion Creators
              </span>{" "}
              to scale.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg text-gray-600 max-w-2xl leading-relaxed"
            >
              Vendra is built out of a simple observation: African fashion is
              booming, but the tools to manage it are stuck in the past. We are
              building the modern operating system that lets fashion vendors
              focus on what they do best - creating beautiful garments.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link href="/login">
                <Button variant="primary" size="large">
                  Join Vendra Today
                </Button>
              </Link>
              <Link href="#story">
                <Button variant="outline" size="large">
                  Read Our Story
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full lg:w-2/5 flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-tr from-brand-100 to-accent-100 p-8 flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="w-8 h-8 text-accent-500 animate-pulse" />
              </div>
              <div className="space-y-4">
                <span className="bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-semibold inline-block">
                  Lagos, Nigeria
                </span>
                <h3 className="text-2xl font-bold text-brand-950 font-sans">
                  "We believe clothing is art, and business should be
                  effortless."
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
                  V
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Vendra Team
                  </h4>
                  <p className="text-xs text-gray-500">
                    Made with 🤍 in Nigeria
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="bg-brand-950 text-white py-16 px-4 md:px-15">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-2"
            >
              <h3 className="text-4xl md:text-5xl font-extrabold text-accent-400">
                1,500+
              </h3>
              <p className="text-sm md:text-base text-brand-200 uppercase font-bold tracking-wider">
                Active Vendors
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-2"
            >
              <h3 className="text-4xl md:text-5xl font-extrabold text-accent-400">
                ₦250M+
              </h3>
              <p className="text-sm md:text-base text-brand-200 uppercase font-bold tracking-wider">
                Volume Managed
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-2"
            >
              <h3 className="text-4xl md:text-5xl font-extrabold text-accent-400">
                150,000+
              </h3>
              <p className="text-sm md:text-base text-brand-200 uppercase font-bold tracking-wider">
                Orders Processed
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-2"
            >
              <h3 className="text-4xl md:text-5xl font-extrabold text-accent-400">
                10h+
              </h3>
              <p className="text-sm md:text-base text-brand-200 uppercase font-bold tracking-wider">
                Weekly Time Saved
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-20 px-4 md:px-15 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <Title
              eyebrowTitle="Our Story"
              headingStart="How Vendra"
              headingSpan="Sabi"
              headingEnd="Your Hustle"
            />
            <p className="text-gray-600 leading-relaxed pt-2">
              It all started watching Instagram boutiques - fashion vendors
              spend more time answering "Is this available in size M?" and
              tracking deposits in scrapbooks than actually designing clothing,
              we knew there had to be a better way.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Generic e-commerce platforms don't understand the nuance of
              fashion. They don't support custom measurements, or
              WhatsApp-driven workflows, or multiple fabric variations. Vendra
              was born to bridge that gap — a platform built specifically for
              the Nigerian fashion ecosystem.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="p-6 bg-white">
                <span className="text-xs uppercase font-extrabold tracking-widest text-brand-500">
                  The Spark
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                  Tackling the DM Chaos
                </h4>
                <p className="text-sm text-gray-600">
                  Fashion vendors lose up to 30% of sales because DMs are messy.
                  We built automatic stock status and custom WhatsApp
                  confirmations to solve this.
                </p>
              </Card>

              <Card className="p-6 bg-white">
                <span className="text-xs uppercase font-extrabold tracking-widest text-accent-600">
                  Tailored to You
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                  Designed for Fashion Nuance
                </h4>
                <p className="text-sm text-gray-600">
                  Whether it is ready-to-wear or bespoke (tailor-made), our
                  inventory handles size variations, measurements, and
                  pre-orders perfectly.
                </p>
              </Card>
            </div>

            <div className="space-y-6 md:mt-8">
              <Card className="p-6 bg-white">
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600">
                  Empowerment First
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                  Supporting Local Brands
                </h4>
                <p className="text-sm text-gray-600">
                  We empower independent designers to present themselves with
                  the same digital sophistication as global luxury retail
                  platforms.
                </p>
              </Card>

              <Card className="p-6 bg-white">
                <span className="text-xs uppercase font-extrabold tracking-widest text-blue-600">
                  The Vision
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                  Exporting African Fashion
                </h4>
                <p className="text-sm text-gray-600">
                  Our long-term mission is to build the pipelines that allow
                  African designers to seamlessly sell, manage and ship to
                  customers globally.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-brand-50 py-20 px-4 md:px-15">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
              Values That{" "}
              <span className="text-brand-600 font-cursive text-4xl md:text-6xl">
                Define
              </span>{" "}
              Us
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Our principles are simple, actionable, and centered around making
              the fashion business effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Radical Simplicity
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Software should make your life easier, not more complex.
                Vendra's interface is designed to be learned in 5 minutes, works
                beautifully on mobile, and doesn't get in your way.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Vendor Obsessed
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every feature we build starts with deep conversations with real
                fashion vendors. If a feature doesn't directly solve a headache
                for a vendor, we don't build it.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Trust & Reliability
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your orders and catalog are your livelihood. We ensure 99.9%
                uptime, robust database safety, and instant customer support
                when you need it most.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive / Visual Timeline Section */}
      <section className="py-20 px-4 md:px-15 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-brand-600 text-xs md:text-sm font-bold uppercase tracking-wider">
            The Journey
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            Our Key{" "}
            <span className="text-brand-600 font-cursive text-4xl md:text-6xl">
              Milestones
            </span>
          </h2>
        </div>

        <div className="relative border-l border-gray-200 ml-4 md:ml-1/2 md:translate-x-[-0.5px] space-y-12">
          {/* Milestone 1 */}
          <div className="relative pl-8 md:pl-0 md:w-1/2 md:ml-auto md:text-left md:even:mr-auto md:even:ml-0 md:even:text-right">
            <div className="absolute left-[-6px] top-1.5 md:left-auto md:right-[-6px] md:group-even:left-[-6px] w-3 h-3 rounded-full bg-brand-600" />
            <div className="md:pr-8 md:even:pl-8 md:even:pr-0">
              <span className="bg-brand-100 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                January 2026
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">
                The Seed Idea
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Started building after conducting research interviews with local
                designers.
              </p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="relative pl-8 md:pl-0 md:w-1/2 md:mr-auto md:text-right">
            <div className="absolute left-[-6px] top-1.5 md:left-auto md:left-[-6px] w-3 h-3 rounded-full bg-accent-500" />
            <div className="md:pl-8">
              <span className="bg-accent-100 text-accent-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                July, 2026
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">
                Beta Launch
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Released prototype to fashion brands. Logged over 5,000 orders
                in the first 30 days.
              </p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="relative pl-8 md:pl-0 md:w-1/2 md:ml-auto md:text-left">
            <div className="absolute left-[-6px] top-1.5 md:left-auto md:right-[-6px] w-3 h-3 rounded-full bg-emerald-500" />
            <div className="md:pr-8">
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                October 2026
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">
                Vendra v1.0 Release
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Launched full package including custom shareable Storefront
                links, multi-currency display, and automated SMS alerts.
              </p>
            </div>
          </div>

          {/* Milestone 4 */}
          <div className="relative pl-8 md:pl-0 md:w-1/2 md:mr-auto md:text-right">
            <div className="absolute left-[-6px] top-1.5 md:left-auto md:left-[-6px] w-3 h-3 rounded-full bg-brand-500" />
            <div className="md:pl-8">
              <span className="bg-brand-100 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Today
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">
                Slowing Down DM Mess Nationwide
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Now serving thousands of designers across Lagos, Abuja, Port
                Harcourt, and looking forward to scaling West Africa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="bg-white py-20 px-4 md:px-15 border-y border-gray-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-brand-600 text-xs md:text-sm font-bold uppercase tracking-wider">
              Our People
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
              Meet the{" "}
              <span className="text-brand-600 font-cursive text-4xl md:text-6xl">
                Visionaries
              </span>
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              A passionate team of builders, designers, and former retail
              managers trying to make retail business easy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="space-y-4 group">
              <div className="aspect-[4/5] bg-gradient-to-br from-brand-100 to-brand-300 rounded-xl relative overflow-hidden flex items-end justify-center p-6 border border-gray-150">
                <div className="absolute inset-0 bg-brand-950/20 group-hover:bg-brand-950/45 transition-colors duration-300" />
                <div className="relative text-center z-10 space-y-1">
                  <span className="text-white font-bold text-lg block">
                    Co-Founder & CEO
                  </span>
                  <span className="text-brand-200 text-xs font-medium uppercase tracking-wider block">
                    [Executive Leadership]
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Pharez Oyelade
                </h4>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Leadership & Strategy
                </p>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="space-y-4 group">
              <div className="aspect-[4/5] bg-gradient-to-br from-accent-100 to-accent-300 rounded-xl relative overflow-hidden flex items-end justify-center p-6 border border-gray-150">
                <div className="absolute inset-0 bg-brand-950/20 group-hover:bg-brand-950/45 transition-colors duration-300" />
                <div className="relative text-center z-10 space-y-1">
                  <span className="text-white font-bold text-lg block">
                    Head of Product
                  </span>
                  <span className="text-brand-200 text-xs font-medium uppercase tracking-wider block">
                    [Product & UX]
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Product Lead
                </h4>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Product Strategy & Design
                </p>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="space-y-4 group">
              <div className="aspect-[4/5] bg-gradient-to-br from-emerald-100 to-emerald-300 rounded-xl relative overflow-hidden flex items-end justify-center p-6 border border-gray-150">
                <div className="absolute inset-0 bg-brand-950/20 group-hover:bg-brand-950/45 transition-colors duration-300" />
                <div className="relative text-center z-10 space-y-1">
                  <span className="text-white font-bold text-lg block">
                    Lead Engineer
                  </span>
                  <span className="text-brand-200 text-xs font-medium uppercase tracking-wider block">
                    [Engineering]
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Tech Lead</h4>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Architecture & Code
                </p>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="space-y-4 group">
              <div className="aspect-[4/5] bg-gradient-to-br from-indigo-100 to-indigo-300 rounded-xl relative overflow-hidden flex items-end justify-center p-6 border border-gray-150">
                <div className="absolute inset-0 bg-brand-950/20 group-hover:bg-brand-950/45 transition-colors duration-300" />
                <div className="relative text-center z-10 space-y-1">
                  <span className="text-white font-bold text-lg block">
                    Community & Growth
                  </span>
                  <span className="text-brand-200 text-xs font-medium uppercase tracking-wider block">
                    [Sales & Support]
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Growth Manager
                </h4>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Vendor Engagement
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 px-4 md:px-15 max-w-5xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-brand-900 to-brand-950 rounded-2xl p-8 md:p-16 text-white space-y-6 relative overflow-hidden shadow-xl"
        >
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-accent-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

          <Sparkles className="w-12 h-12 text-accent-400 mx-auto" />
          <h2 className="text-3xl md:text-5xl font-bold font-sans">
            Ready to take back control?
          </h2>
          <p className="text-brand-200 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Stop drowning in DMs and notebooks. Build a beautiful, professional
            fashion business with Vendra today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button
                variant="primary"
                className="bg-accent-500 hover:bg-accent-600 text-brand-950 border-none font-bold"
                size="large"
              >
                Get Started Now
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                size="large"
              >
                View Pricing Plan
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default page;
