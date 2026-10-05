"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Scissors,
  Ruler,
  Calendar,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface BespokeTailorViewProps {
  vendor: any;
  handle: string;
}

export function BespokeTailorView({ vendor, handle }: BespokeTailorViewProps) {
  const whatsappNumber = vendor?.socials?.whatsapp
    ? vendor.socials.whatsapp.replace(/\D/g, "")
    : "";

  const steps = [
    {
      num: "01",
      title: "Share Your Vision",
      desc: "Submit your desired style, garment category, and reference photos.",
    },
    {
      num: "02",
      title: "Body Measurements",
      desc: "Provide your measurements online or request our guided size chart.",
    },
    {
      num: "03",
      title: "WhatsApp Consultation",
      desc: "We discuss fabric choices, fitting preferences, and provide an exact quote.",
    },
    {
      num: "04",
      title: "Handcrafted Delivery",
      desc: "Your bespoke piece is tailored to perfection and dispatched to your door.",
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* ── Bespoke Hero ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-stone-50 border-b border-stone-200/80 py-16 sm:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Scissors size={14} className="text-amber-700" />
            <span>Bespoke Fashion House & Atelier</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-950 tracking-tight leading-tight">
            Crafted Exclusively For Your Silhouette
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {vendor?.bio ||
              "Every stitch is intentional. We create custom, made-to-measure garments tailored to your personal aesthetic and precise measurements."}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/store/${handle}/request`}
              className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-md active:scale-98"
            >
              <Sparkles size={16} className="text-amber-400" />
              <span>Book Bespoke Design</span>
              <ArrowRight size={16} />
            </Link>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  `Hello ${vendor.businessName}, I would like to consult with you on a bespoke tailoring design!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 py-3.5 px-6 rounded-xl border border-stone-300 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/40 text-stone-800 font-medium text-sm transition-all shadow-2xs"
              >
                <MessageCircle size={18} className="text-emerald-600" />
                <span>Chat with Tailor</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── How Bespoke Works ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            The Bespoke Journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-950">
            How Custom Tailoring Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            From your concept to doorstep delivery in four structured steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs relative space-y-3"
            >
              <span className="text-2xl font-serif font-bold text-amber-600/80 block">
                {step.num}
              </span>
              <h3 className="font-serif font-bold text-lg text-gray-950">
                {step.title}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive CTA Card ───────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl text-center space-y-6">
          <div className="size-16 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center mx-auto border border-white/15">
            <Ruler size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">
              Ready to submit your design?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Upload your style reference photos, provide your bust, waist, hips, and length
              measurements, and receive a personal quote directly from the designer.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/store/${handle}/request`}
              className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm transition-all shadow-md"
            >
              <span>Open Custom Request Form</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
