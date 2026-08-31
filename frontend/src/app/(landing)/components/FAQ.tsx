"use client";

import { Title } from "@/components/ui/Title";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqData = [
  {
    question: "Do I need to be tech-savvy to use Vendra?",
    answer:
      "Not at all! Vendra is designed specifically to be as simple as sending a WhatsApp message. If you can use Instagram, you can use Vendra to manage your entire business.",
  },
  {
    question: "Can I use Vendra if I don't have a registered business?",
    answer:
      "Yes, you can. You can start using Vendra to track your inventory and orders immediately, whether your business is formally registered or you're just starting out.",
  },
  {
    question: "Is my store and customer data secure?",
    answer:
      "Absolutely. We use industry-standard security to protect your data. Your customer list and sales numbers are completely private and only accessible by you.",
  },
  {
    question: "What happens if I need help getting set up?",
    answer:
      "We offer dedicated support for all our vendors. You can reach out to us anytime via email or WhatsApp, and we'll guide you step-by-step through setting up your store.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-5 md:px-15 py-24 bg-surface-base relative">
      {/* Background pattern reused from Testimonials */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#2722c5 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10 flex flex-col items-center mb-12">
        <Title
          eyebrowTitle="Got Questions?"
          headingStart="Frequently Asked"
          headingSpan="Questions."
        />
        <p className="text-gray-600 items-center mt-4 max-w-lg text-lg">
          Everything you need to know about getting started with Vendra.
        </p>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-4">
        {faqData.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              key={index}
              className={`bg-white/70 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                isOpen
                  ? "border-brand-200 shadow-md"
                  : "border-white shadow-sm hover:border-brand-100"
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-semibold text-lg text-gray-900 pr-4">
                  {faq.question}
                </span>
                <div
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300 ${
                    isOpen
                      ? "bg-brand-100 text-brand-600"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {isOpen ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQ;
