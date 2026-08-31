"use client";

import { Title } from "@/components/ui/Title";
import React from "react";
import { getInitials } from "@/lib/utils";
import { Quote, Dot } from "lucide-react";
import { motion, easeOut } from "framer-motion";

const testimonialData = [
  {
    comment:
      "Before Vendra I was using three WhatsApp groups and a notebook to track everything. I lost at least two big orders a week. Now everything is in one place and I actually know my numbers.",
    name: "Temi Okonkwo",
    handle: "temi_closet",
    location: "Ogbomoso",
  },
  {
    comment:
      "The storefront link is what sold me. I put it in my bio and customers can just see what's available without pinging me every five minutes asking 'what do you have in stock?'",
    name: "Funke Adeyemi",
    handle: "fabbybyfunke",
    location: "Ibadan",
  },
  {
    comment:
      "I did ₦1.2 million in sales last month and for the first time I could actually see which items drove it. The analytics are simple but they tell me exactly what to restock.",
    name: "Chidinma Nweke",
    handle: "chidinmafashion",
    location: "Enugu",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const Testimonials = () => {
  return (
    <section className="px-5 md:px-15 py-24 bg-surface-base relative">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#2722c5 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10 flex flex-col items-center">
        <Title
          eyebrowTitle="vendors love it"
          headingStart="Real vendors."
          headingSpan="Real results."
        />
      </div>

      {/* TESTIMONIALS */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto relative z-10"
      >
        {testimonialData.map((td, index) => (
          <motion.div
            variants={cardVariants}
            key={index}
            className="relative flex flex-col justify-between space-y-6 bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className="absolute -top-4 -left-2 rotate-12">
              <Quote className="w-16 h-16 text-brand-200 fill-brand-100 opacity-60" />
            </div>

            <p className="pt-6 text-gray-700 leading-relaxed font-medium relative z-10 text-lg">
              "{td.comment}"
            </p>

            <div className="flex gap-4 items-center pt-4 border-t border-gray-100 mt-auto">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-lg bg-brand-500 text-white shadow-md">
                {getInitials(td.name)}
              </div>

              <div className="leading-tight">
                <p className="font-bold text-gray-900">{td.name}</p>
                <div className="flex gap-1 tracking-tight items-center text-gray-500 text-xs font-medium mt-1">
                  <span>@{td.handle}</span>
                  <Dot className="w-3 h-3" />
                  <span>{td.location}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Testimonials;
