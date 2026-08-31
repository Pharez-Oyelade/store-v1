"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Title } from "@/components/ui/Title";
import Button from "@/components/custom/Button";
import Card from "@/components/ui/Card";
import { 
  UserPlus, 
  PlusCircle, 
  Share2, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Clock,
  ChevronRight
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Your Shop in 60 Seconds",
    description: "Sign up and claim your brand's unique link (e.g., vendra.ng/yourbrand). Set up your basic shop name, contact details, and currency.",
    icon: <UserPlus className="w-6 h-6 text-brand-600" />,
    badge: "Fast Setup",
    color: "from-brand-50 to-brand-100/50"
  },
  {
    number: "02",
    title: "Add Products with Fashion Variants",
    description: "No more generic product listings. Input sizes (UK sizes, custom measurements, or XS-XXL), fabric options, and colorways with up to 5 photos per item.",
    icon: <PlusCircle className="w-6 h-6 text-accent-600" />,
    badge: "Built for Fashion",
    color: "from-accent-50 to-accent-100/30"
  },
  {
    number: "03",
    title: "Share Your Catalog & Stop DM Chaos",
    description: "Add your new link to your Instagram Bio or WhatsApp status. Customers can browse what's in stock, select their sizes, and order directly — no DM required to ask 'Is this available?'",
    icon: <Share2 className="w-6 h-6 text-emerald-600" />,
    badge: "Auto Stock-Sync",
    color: "from-emerald-50 to-emerald-100/30"
  },
  {
    number: "04",
    title: "Log Offline Orders & Send WhatsApp Alerts",
    description: "Got an order from an in-person customer or custom DM order? Log it on your dashboard. Vendra generates a pre-formatted receipt/confirmation that you can send to WhatsApp in one tap.",
    icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
    badge: "WhatsApp Ready",
    color: "from-blue-50 to-blue-100/30"
  },
  {
    number: "05",
    title: "Ship, Collect Balances, & Track Growth",
    description: "Track payment statuses (Deposit vs. Full payment). Automatically update inventory upon fulfillment. Review clean mobile-first reports showing revenue, best sellers, and outstanding payments.",
    icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
    badge: "Clean Analytics",
    color: "from-purple-50 to-purple-100/30"
  }
];

export default function HowItWorksPage() {
  return (
    <div className="relative overflow-hidden bg-surface-base text-gray-900 pb-20">
      {/* Visual background accents */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-accent-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Header */}
      <section className="relative px-4 md:px-15 pt-20 pb-16 md:py-24 max-w-7xl mx-auto text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-brand-50 px-4 py-1.5 rounded-full border border-brand-100"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span className="text-brand-700 text-xs md:text-sm font-semibold uppercase tracking-wider">
            Simple, Seamless, Smart
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]"
        >
          How Vendra <br />
          <span className="text-brand-600 font-cursive text-5xl md:text-8xl">
            Saves Your Time
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
        >
          Go from messy notebooks and DM lists to a clean, structured workflow. Here is the step-by-step path to taking your fashion brand to the next level.
        </motion.p>
      </section>

      {/* Step-by-Step Walkthrough */}
      <section className="px-4 md:px-15 max-w-7xl mx-auto py-10">
        <div className="relative border-l-2 border-brand-100 md:border-l-0 space-y-16 md:space-y-24">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline circle indicator for mobile/desktop */}
                <div className="absolute left-[-9px] md:left-1/2 md:transform md:-translate-x-1/2 w-4 h-4 rounded-full bg-brand-500 border-4 border-white shadow-sm z-10" />

                {/* Left/Content block */}
                <div className="w-full md:w-1/2 pl-6 md:pl-0 space-y-4">
                  <span className="inline-block bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    {step.badge}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-extrabold text-brand-300 font-sans">
                      {step.number}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Right/Visual Placeholder Mockup */}
                <div className="w-full md:w-1/2 pl-6 md:pl-0">
                  <div className={`p-8 rounded-2xl bg-gradient-to-br ${step.color} border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col justify-between`}>
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        {step.icon}
                      </div>
                      <span className="text-6xl font-black text-white/40 select-none group-hover:scale-105 transition-transform duration-300">
                        {step.number}
                      </span>
                    </div>

                    <div className="space-y-2 mt-6">
                      <div className="h-2 w-1/3 bg-gray-200 rounded-full" />
                      <div className="h-2 w-2/3 bg-gray-200/70 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Interactive Feature Spotlight */}
      <section className="bg-brand-950 text-white py-20 px-4 md:px-15 mt-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              Why Fashion Vendors <span className="text-accent-400 font-cursive text-4xl md:text-6xl">Prefer</span> Vendra
            </h2>
            <p className="text-brand-200 max-w-xl mx-auto text-sm md:text-base">
              Unlike generic shop builders, Vendra is fine-tuned to how you run your business offline and online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-900/50 p-8 rounded-xl border border-brand-800/60 space-y-4">
              <div className="w-10 h-10 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold">Mobile-First Control</h4>
              <p className="text-brand-200 text-sm leading-relaxed">
                Log items directly using your phone camera at photoshoot locations or straight from your store back-room.
              </p>
            </div>

            <div className="bg-brand-900/50 p-8 rounded-xl border border-brand-800/60 space-y-4">
              <div className="w-10 h-10 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold">No-App Download Needed</h4>
              <p className="text-brand-200 text-sm leading-relaxed">
                Your customers don't need to sign up or download anything. They browse and select sizes on a ultra-fast browser storefront.
              </p>
            </div>

            <div className="bg-brand-900/50 p-8 rounded-xl border border-brand-800/60 space-y-4">
              <div className="w-10 h-10 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold">Quick WhatsApp Receipt</h4>
              <p className="text-brand-200 text-sm leading-relaxed">
                One-tap to send pre-formatted purchase summaries directly to your customer's chat, keeping records clear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

          <h2 className="text-3xl md:text-5xl font-bold">
            Start saving hours today
          </h2>
          <p className="text-brand-200 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Create your account and list your first product in under two minutes. Experience the ease of Vendra today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button variant="primary" className="bg-accent-500 hover:bg-accent-600 text-brand-950 border-none font-bold" size="large">
                Get Started Free
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" className="border-white text-white hover:bg-white/10" size="large">
                Learn About Vendra
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
