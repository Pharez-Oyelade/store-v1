"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";
import DemandForm from "@/components/demands/DemandForm";

export default function NewDemandPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <Link
          href="/dashboard/demands"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-700 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Demand Board
        </Link>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
            <Scissors size={22} />
          </span>
          Record Bespoke Demand
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Capture client design preferences, reference photos, custom body measurements, and fabric requirements.
        </p>
      </div>

      <DemandForm />
    </div>
  );
}
