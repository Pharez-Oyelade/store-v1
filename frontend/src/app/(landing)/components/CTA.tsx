"use client";

import Button from "@/components/custom/Button";
import { Title } from "@/components/ui/Title";
import React from "react";
import Link from "next/link";
import { motion, easeOut } from "framer-motion";

const CTA = () => {
  return (
    <section className="relative overflow-hidden bg-brand-950 px-5 md:px-15 py-32 flex justify-center items-center">
      {/* Abstract Background Elements */}
      {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-brand-600/30 blur-[120px] rounded-full rotate-12 mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[150%] bg-accent-600/20 blur-[120px] rounded-full -rotate-12 mix-blend-screen" />
      </div> */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: easeOut }}
        className="relative z-10 w-full max-w-4xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 md:p-16 text-center shadow-2xl flex flex-col items-center"
      >
        <span className="px-4 py-2 rounded-full bg-brand-500/20 text-brand-200 text-xs font-bold uppercase tracking-widest mb-6 border border-brand-400/30">
          Ready to scale?
        </span>

        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Stop losing sales to{" "}
          <span className="text-brand-400 font-cursive font-normal">
            chaos.
          </span>
        </h2>

        <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
          Join the Nigerian fashion vendors who have taken control of their
          inventory, orders, and customer relationships with Vendra.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="large"
              variant="primary"
              className="w-full relative group overflow-hidden shadow-lg border-0 h-14 px-8 rounded-xl bg-brand-500 hover:bg-brand-400"
            >
              <span className="relative z-10 font-bold text-white text-base">
                Start Selling Smarter
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              size="large"
              variant="ghost"
              className="w-full h-14 px-8 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all font-semibold"
            >
              View Pricing
            </Button>
          </Link>
        </div>

        <p className="text-gray-400 text-sm mt-6">
          14-day free trial on Growth plan. No credit card required.
        </p>
      </motion.div>
    </section>
  );
};

export default CTA;
