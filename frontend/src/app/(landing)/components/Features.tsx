"use client";

import { Title } from "@/components/ui/Title";
import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  Clipboard,
  Users,
  ChartColumnBig,
  Store,
  ArrowRight,
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
    id: "orders",
    icon: <Clipboard className="w-6 h-6 text-accent-500" />,
    title: "Manage orders without chaos",
    description:
      "Log orders from DM or WhatsApp. One-tap WhatsApp confirmation messages.",
    className: "md:col-span-1 md:row-span-2 bg-accent-50",
  },
  {
    id: "customers",
    icon: <Users className="w-6 h-6 text-success-500" />,
    title: "Built-in CRM",
    description:
      "Full order history, total spend, and last purchase date per customer.",
    className: "md:col-span-1 md:row-span-1 bg-white",
  },
  {
    id: "analytics",
    icon: <ChartColumnBig className="w-6 h-6 text-info-500" />,
    title: "Clear, visual analytics",
    description:
      "Know your best sellers, peak days, and outstanding balances instantly.",
    className: "md:col-span-2 md:row-span-1 bg-brand-900 text-white",
  },
  {
    id: "storefront",
    icon: <Store className="w-6 h-6 text-brand-400" />,
    title: "Your public storefront",
    description:
      "Get a clean, fast, shareable store page (vendra.ng/yourname) that updates in real-time.",
    className: "md:col-span-3 md:row-span-1 bg-brand-100",
  },
];

const Features = () => {
  return (
    <section className="px-5 md:px-15 py-24 bg-surface-base">
      <div className="mb-16 flex flex-col items-center md:items-start">
        <Title
          eyebrowTitle="Features"
          headingStart="Everything your store needs."
          headingSpan="Nothing"
          headingEnd="it doesn't"
          text="A powerful toolkit disguised as a simple dashboard. Built specifically for the workflow of a modern Nigerian fashion vendor."
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
            {/* Hover subtle scale background (pseudo-element effect without pseudo element for simplicity) */}
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

            {/* Decorative arrow on hover */}
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
    </section>
  );
};

export default Features;
