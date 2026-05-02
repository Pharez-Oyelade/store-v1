import { Title } from "@/components/ui/Title";
import React from "react";

const processData = [
  {
    id: 1,
    title: "Sign up with your phone",
    subtitle:
      "No email required. Enter your number, verify with OTP, set up your business profile in under 5 minutes.",
  },
  {
    id: 2,
    title: "Add your inventory",
    subtitle:
      "Upload products with sizes and colours. Import from CSV or add one by one. Your catalogue is live immediately.",
  },
  {
    id: 3,
    title: "Start logging orders",
    subtitle:
      "Every order in one place. Tap to generate a WhatsApp confirmation. Stock updates automatically.",
  },
  {
    id: 4,
    title: "Share your storefront",
    subtitle:
      "Put your vendra.ng link in your bio. Buyers can browse what's in stock and enquire directly — no DM needed to check availability.",
  },
];

const Process = () => {
  return (
    <section className="px-5 md:px-15 py-20">
      <div>
        <Title
          eyebrowTitle="Process"
          headingStart="Up and running in"
          headingSpan="minutes."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:md:grid-cols-4 gap-5 mt-10">
        {processData.map((pd) => (
          <div
            key={pd.id}
            className="space-y-4 border border-gray-400 hover:bg-accent-50 hover:border-accent-300 hover:-translate-y-2 transition-all duration-300 ease-in-out p-4 shadow-lg rounded-xl"
          >
            <span className="w-12 h-12 inline-flex items-center justify-center rounded-full border-2 font-cursive text-4xl font-bold border-gray-400 p-3">
              {pd.id}
            </span>
            <h3 className="text-2xl font-bold">{pd.title}</h3>
            <p>{pd.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Process;
