"use client";

import React from "react";
import { Scissors, Truck, ShieldCheck, MessageCircle } from "lucide-react";

export function TrustSignalsSection() {
  const signals = [
    {
      icon: Scissors,
      title: "Artisan Tailored Quality",
      description: "Handcrafted with precision stitching and premium fabric selection.",
    },
    {
      icon: Truck,
      title: "Nationwide Delivery",
      description: "Direct doorstep dispatch and express delivery across Nigeria.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Fashion Brand",
      description: "Authentic atelier pieces with transparent order status updates.",
    },
    {
      icon: MessageCircle,
      title: "Direct WhatsApp Line",
      description: "Instant sizing consultations and personal customer care.",
    },
  ];

  return (
    <section className="bg-white/70 border-y border-stone-200/80 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {signals.map((signal, idx) => {
            const Icon = signal.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-2 p-2">
                <div className="size-10 sm:size-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shadow-2xs">
                  <Icon className="size-5 sm:size-6" />
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-gray-950">
                  {signal.title}
                </h4>
                <p className="text-xs text-stone-500 max-w-[220px] leading-relaxed">
                  {signal.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
