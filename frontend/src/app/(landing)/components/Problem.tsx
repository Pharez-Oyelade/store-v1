"use client";

import { Title } from "@/components/ui/Title";
import { motion, easeOut } from "framer-motion";
import React from "react";
import {
  Package,
  MessageSquareDashed,
  BanknoteX,
  TrendingDown,
} from "lucide-react";

const problems = [
  {
    id: 1,
    icon: <Package className="w-6 h-6" />,
    title: "Inventory in a notebook",
    description:
      "You sold a dress three customers ago and you can't remember the size or colour. You find out it's gone when the next order comes in.",
  },
  {
    id: 2,
    icon: <MessageSquareDashed className="w-6 h-6" />,
    title: "Orders buried in DMs",
    description:
      "Orders across Instagram, WhatsApp and phone calls. No single place to see what's pending, what's paid, what's waiting to be dispatched.",
  },
  {
    id: 3,
    icon: <BanknoteX className="w-6 h-6" />,
    title: "Lost revenue, no visibility",
    description:
      "You made good money this month but you couldn't tell how much, which items drove it, or which customer owe you a balance.",
  },
  {
    id: 4,
    icon: <TrendingDown className="w-6 h-6" />,
    title: "No customer history",
    description:
      "A customer orders again but you don't remember their size, their last purchase, or whether they actually paid in full last time. Every interaction starts from zero.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const Problem = () => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="dark bg-brand-950 text-white relative px-5 md:px-15 py-24 md:py-32 overflow-hidden"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-brand-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />

      <div className="relative z-10">
        <Title
          headingStart="Running a fashion brand through DMs"
          headingSpan="isn't"
          headingEnd="a strategy."
          eyebrowTitle="The Problem"
          text="Every order lost in chat. Every inventory mistake costing you money. Every customer forgotten. Sound familiar?"
        />
      </div>

      {/* Problem cards */}
      <div className="mt-16 grid md:grid-cols-2 gap-6 h-auto relative z-10">
        {problems.map((problem) => (
          <motion.div
            variants={itemVariants}
            key={problem.id}
            className="rounded-2xl"
          >
            <div className="relative h-full p-8 md:p-10 space-y-5 bg-brand-900/50 backdrop-blur-md rounded-2xl overflow-hidden group transition-all duration-300">
              <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-brand-800/80 rounded-xl text-brand-300 group-hover:scale-110 group-hover:text-white group-hover:bg-brand-600 transition-all duration-300 shadow-lg">
                {problem.icon}
              </div>

              <div className="relative z-10">
                <h3 className="font-bold text-2xl text-white mb-3 group-hover:text-brand-100 transition-colors">
                  {problem.title}
                </h3>
                <p className="text-gray-400 text-base leading-relaxed group-hover:text-gray-300 transition-colors">
                  {problem.description}
                </p>
              </div>

              {/* Huge background number */}
              <div className="absolute -bottom-10 -right-4 font-black text-[180px] leading-none text-white/5 select-none group-hover:text-brand-500/10 group-hover:-translate-y-4 transition-all duration-500">
                0{problem.id}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Problem;
