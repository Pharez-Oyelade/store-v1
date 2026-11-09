"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Globe, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

function InactiveDomainContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "this domain";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between p-6 sm:p-12">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <Link href="https://tryvendra.ng" className="flex items-center gap-2 group">
          <span className="font-serif font-black text-2xl tracking-tight text-gray-950 group-hover:text-amber-800 transition-colors">
            VENDRA
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
            Platform
          </span>
        </Link>

        <Link
          href="/login"
          className="text-xs font-bold text-stone-700 hover:text-stone-950 transition-colors"
        >
          Vendor Login &rarr;
        </Link>
      </header>

      <main className="max-w-xl mx-auto w-full my-auto py-12 text-center space-y-6">
        <div className="size-16 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 mx-auto flex items-center justify-center shadow-xs">
          <Globe size={28} />
        </div>

        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full">
            Custom Domain Setup In Progress
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950 tracking-tight">
            Storefront Domain Inactive
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
            The domain <strong className="font-mono text-stone-900 bg-stone-200/60 px-1.5 py-0.5 rounded">{domain}</strong> is pointed to Vendra, but has not completed DNS verification or the boutique storefront is currently unpublished.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 text-left text-xs space-y-3 shadow-xs">
          <h4 className="font-bold text-gray-950 flex items-center gap-1.5">
            <HelpCircle size={14} className="text-amber-600" />
            Are you the boutique owner?
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-stone-600">
            <li>Sign in to your Vendra Vendor Dashboard.</li>
            <li>Go to <strong>Storefront Settings &rarr; Store Links & Domains</strong>.</li>
            <li>Verify that your <strong>CNAME record</strong> points to <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-900 font-mono">cname.tryvendra.ng</code> and click <strong>Verify DNS</strong>.</li>
            <li>Ensure your storefront launch checklist is complete and published.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <span>Open Vendor Dashboard</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="https://tryvendra.ng"
            className="w-full sm:w-auto inline-flex items-center justify-center py-3 px-6 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors"
          >
            Visit Vendra Home
          </Link>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center text-[11px] text-stone-400 flex items-center justify-center gap-1">
        <ShieldCheck size={13} />
        <span>Vendra Luxury Fashion Operating System &bull; Secured with Automated SSL</span>
      </footer>
    </div>
  );
}

export default function CustomDomainInactivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <InactiveDomainContent />
    </Suspense>
  );
}
