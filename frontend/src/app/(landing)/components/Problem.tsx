"use client";

import Eyebrow from "@/components/ui/Eyebrow";
import { Title } from "@/components/ui/Title";
import { motion } from "framer-motion";
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
    icon: <Package />,
    title: "Inventory in a notebook",
    description:
      "You sold a dress three customers ago and you can't remember the size or colour. You find out it's gone when the next order comes in.",
  },
  {
    id: 2,
    icon: <MessageSquareDashed />,
    title: "Orders buried in DMs",
    description:
      "Orders across Instagram, WhatsApp and phone calls. No single place to see what's pending, what's paid, what's waiting to be dispatched.",
  },
  {
    id: 3,
    icon: <BanknoteX />,
    title: "Lost revenue, no visibility",
    description:
      "You made good money this month but you couldn't tell how much, which items drove it, or which customer owe you a balance.",
  },
  {
    id: 4,
    icon: <TrendingDown />,
    title: "No customer history",
    description:
      "A customer orders again but you don't remember their size, their last purchase, or whether they actually paid in full last time. Every interaction starts from zero.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Problem = () => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="px-5 md:px-15 py-20"
    >
      <div>
        <Title
          headingStart="Running a fashion brand through DMs"
          headingSpan="isn't"
          headingEnd="a strategy."
          eyebrowTitle="The Problem"
          text="Every order lost in chat. Every inventory mistake costing you money. Every customer forgotten. Sound familiar?"
        />
      </div>

      {/* Problem cards */}
      <div className="mt-10 grid md:grid-cols-2 gap-3 h-auto">
        {problems.map((problem) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            key={problem.id}
            className="relative p-10 space-y-3 bg-white shadow-card border border-gray-400 rounded-md overflow-hidden hover:border-accent-500 hover:bg-accent-50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="bg-accent-700 p-2 rounded-md w-10 text-white">
              {problem.icon}
            </div>

            <h1 className="font-bold text-xl">{problem.title}</h1>

            <p>{problem.description}</p>

            <div className="absolute -top-25 right-2 outline-text text-[200px] opacity-10">
              {problem.id}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Problem;
