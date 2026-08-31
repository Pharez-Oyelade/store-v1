"use client";

import { Title } from "@/components/ui/Title";
import React from "react";
import { motion, easeOut } from "framer-motion";

const processData = [
  {
    id: 1,
    title: "Sign up instantly",
    subtitle:
      "Enter your details and set up your business profile in under 5 minutes.",
  },
  {
    id: 2,
    title: "Add your inventory",
    subtitle:
      "Upload products with sizes and colours. Your catalogue is live immediately.",
  },
  {
    id: 3,
    title: "Start logging orders",
    subtitle:
      "Every order in one place. Tap to generate a WhatsApp confirmation.",
  },
  {
    id: 4,
    title: "Share your storefront",
    subtitle:
      "Put your vendra.ng link in your bio. Buyers can browse what's in stock.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

const Process = () => {
  return (
    <section className="px-5 md:px-15 py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      {/* <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-accent-500 rounded-full blur-[100px] opacity-40 -z-10" /> */}

      <div className="flex flex-col items-center">
        <Title
          eyebrowTitle="Process"
          headingStart="Up and running in"
          headingSpan="minutes."
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-6xl mx-auto mt-20 relative"
      >
        {/* Glowing connected line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-brand-500"
          />
        </div>

        {/* Glowing connected line (Mobile) */}
        <div className="md:hidden absolute top-0 left-6 h-full w-1 bg-gray-200">
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-full bg-brand-500 "
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-15">
          {processData.map((pd) => (
            <motion.div
              variants={itemVariants}
              key={pd.id}
              className="relative flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-8 z-10"
            >
              {/* Number */}
              <div className="relative flex-shrink-0 group">
                <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white border-2 border-brand-200 shadow-md text-brand-600 font-bold text-xl md:text-2xl group-hover:border-brand-500 group-hover:bg-brand-50 transition-all duration-300">
                  {pd.id}
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1 md:text-center mt-1 md:mt-0 bg-white pt-8 pb-6 px-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {pd.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {pd.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Process;
