"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import React from "react";

const Hero = () => {
  return (
    <section className="relative px-4 md:px-15 py-15 md:py-20 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-0 min-h-dvh">
      {/* Hero content */}
      <div className="w-full md:w-1/2 space-y-8">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeIn" }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-0.5 bg-accent-600" />
          <span className="text-accent-600 text-xs md:text-sm font-bold uppercase">
            Built for Nigerian Fashion Vendors
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3, ease: "easeIn" }}
          className="text-6xl md:text-8xl font-bold tracking-tight"
        >
          Your Store. <br />
          <span className="text-accent-900 font-cursive text-6xl md:text-9xl">
            Finally
          </span>{" "}
          <br />
          under control.
        </motion.h1>

        {/* text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3, ease: "easeIn" }}
          className="max-w-lg text-base text-gray-600"
        >
          Stop managing orders in DMs and inventory in notebooks. Sabi Store
          gives fashion vendors one clean dashboard for everything — stock,
          orders, customers, and sales. Built for the Nigerian market.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delayChildren: 0.3, delay: 0.5, ease: "easeIn" }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <Link href="/login">
            <Button size="large" variant="primary">
              Get Started
            </Button>
          </Link>

          <Link href="/how-it-works">
            <Button size="large" variant="ghost">
              Learn how it works →
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: "circIn" }}
        className="relative w-full md:w-1/2"
      >
        <div className="w-full p-4 border-2 border-brand-400 rounded-lg overflow-hidden group shadow-lg">
          <Image
            width={700}
            height={700}
            src="/sabi_screenshot.png"
            alt="Hero Image"
            className="w-full h-full rounded-xl group:hover:scale-90 transition-transform duration-300"
          />

          {/* floating card */}
          <div className="hidden md:block absolute top-20 -left-20 border border-gray-300 bg-white p-4 rounded-lg shadow-lg w-64 pointer-events-none group-hover:-translate-x-1.5 transform transition-transform duration-400">
            <h3 className="text-sm font-bold text-gray-800">Live Tracking</h3>
            <p className="text-xs text-gray-500">
              Monitor your orders in real-time
            </p>
          </div>

          <div className="hidden md:block absolute top-40 -left-30 border border-gray-300 bg-white p-4 rounded-lg shadow-lg w-64 pointer-events-none group-hover:translate-x-1.5 transform transition-transform duration-400">
            <h3 className="text-sm font-bold text-gray-800">340+</h3>
            <p className="text-xs text-gray-500">Vendors using SabiStore</p>
          </div>
        </div>
      </motion.div>

      {/* faded product name */}
      {/* <div className="absolute bottom-0 left-0">
        <h1 className="text-[150px] -z-99 outline-text opacity-6 px-20 pointer-events-none">
          SABI
        </h1>
      </div> */}
    </section>
  );
};

export default Hero;
