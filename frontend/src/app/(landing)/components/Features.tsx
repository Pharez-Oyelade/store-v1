"use client";

import { Title } from "@/components/ui/Title";
import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Package,
  Clipboard,
  Users,
  ChartColumnBig,
  Store,
  ArrowRight,
  Scissors,
  WifiOff,
  MessageCircle,
} from "lucide-react";

const bentoFeatures = [
  {
    id: "inventory",
    icon: <Package className="w-8 h-8 text-brand-500" />,
    title: "Inventory built for fashion",
    description:
      "Track sizes, colour variants, fabrics, and quantities. Mark items as sold out, restocked, or discontinued with one tap.",
    className: "md:col-span-2 md:row-span-2 bg-brand-50",
  },
  {
    id: "whatsapp",
    icon: <MessageCircle className="w-6 h-6 text-green-600" />,
    title: "Vendra WhatsApp Assistant",
    description:
      "Our smart AI assistant works directly via WhatsApp to help you manage inventory, record orders, and send automated updates.",
    className: "md:col-span-1 md:row-span-2 bg-green-50",
  },
  {
    id: "bespoke",
    icon: <Scissors className="w-6 h-6 text-purple-600" />,
    title: "Bespoke & Tailoring Board",
    description:
      "No ready-made stock yet? Record customer demands, save body measurements, track fabric requirements, and schedule fittings.",
    className:
      "md:col-span-1 md:row-span-1 bg-purple-50/70 border-purple-200/60",
  },
  {
    id: "customers",
    icon: <Users className="w-6 h-6 text-success-500" />,
    title: "Built-in CRM & Measurements",
    description:
      "Full order history, customer body measurements map, and purchase debt tracking.",
    className: "md:col-span-1 md:row-span-1 bg-white",
  },
  {
    id: "analytics",
    icon: <ChartColumnBig className="w-6 h-6 text-info-500" />,
    title: "Clear, visual analytics",
    description:
      "Know your best sellers, peak days, outstanding balances, and active tailoring demands.",
    className: "md:col-span-1 md:row-span-1 bg-brand-900 text-white",
  },
  {
    id: "offline",
    icon: <WifiOff className="w-6 h-6 text-orange-600" />,
    title: "Offline Compatibility",
    description:
      "Keep working when the internet drops. View inventory and log sales offline. Syncs automatically when back online.",
    className: "md:col-span-3 md:row-span-1 bg-orange-50",
  },
];

const Features = () => {
  return (
    <section className="px-5 md:px-15 py-24 bg-surface-base">
      <div className="mb-16 flex flex-col items-center md:items-start">
        <Title
          eyebrowTitle="Features"
          headingStart="Everything your store needs."
          text="A powerful tool disguised as a simple dashboard. Built specifically for the workflow of a modern Nigerian fashion vendor."
        />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
        {bentoFeatures.map((feature, i) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            className={cn(
              "relative rounded-3xl p-8 overflow-hidden group border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300",
              feature.className,
            )}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div className="bg-white/80 backdrop-blur p-3 rounded-2xl w-fit shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              <div className="space-y-3 mt-auto">
                <h3
                  className={cn(
                    "text-2xl font-bold tracking-tight",
                    feature.id === "analytics" ? "text-white" : "text-gray-900",
                  )}
                >
                  {feature.title}
                </h3>
                <p
                  className={cn(
                    "text-base leading-relaxed max-w-sm",
                    feature.id === "analytics"
                      ? "text-gray-300"
                      : "text-gray-600",
                  )}
                >
                  {feature.description}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <ArrowRight
                className={cn(
                  "w-6 h-6",
                  feature.id === "analytics" ? "text-white" : "text-brand-500",
                )}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Standalone Features */}
      <div className="mt-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-sm font-medium text-gray-500 bg-gray-50 px-5 md:px-8 py-3 rounded-2xl md:rounded-full border border-gray-100">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Clipboard className="w-4 h-4 text-accent-500" /> Manage orders
            without chaos
          </span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-gray-300"></span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Store className="w-4 h-4 text-brand-500" /> Public storefront &
            Custom Requests
          </span>
          {/* <span className="hidden md:block w-1 h-1 rounded-full bg-gray-300"></span> */}
          {/* <span className="whitespace-nowrap">And much more...</span> */}
        </div>

        <Link
          href="/features"
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white transition-all bg-brand-600 rounded-full hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/25 mt-4"
        >
          <span className="text-white">Explore All Features</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-white" />
        </Link>
      </div>
    </section>
  );
};

export default Features;
