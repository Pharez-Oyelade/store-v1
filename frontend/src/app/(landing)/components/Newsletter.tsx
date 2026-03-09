import Button from "@/components/ui/Button";
import { Title } from "@/components/ui/Title";
import React from "react";

const Newsletter = () => {
  return (
    <section className="bg-brand-900 flex flex-col md:flex-row justify-between items-center gap-20 border-t-3 border-t-accent-600 px-5 md:px-15 py-30">
      <div className="w-full">
        <Title
          eyebrowTitle="Join the waitlist"
          headingStart="Stop losing sales to"
          headingSpan="chaos."
          text="Join the waitlist. Early access vendors get 3 months of Growth plan for free and permanaent early-adopter pricing."
        />
      </div>

      {/* NEWSLETTER input */}
      <form className="flex flex-col gap-5 w-full">
        <input
          type="text"
          placeholder="Your store name"
          className="border border-gray-400 px-6 py-3 rounded-2xl text-white"
        />
        <input
          type="text"
          placeholder="phone number/email"
          className="border border-gray-400 px-6 py-3 rounded-2xl text-white"
        />
        <Button variant="primary" size="large">
          SECURE MY SPOT
        </Button>
      </form>
    </section>
  );
};

export default Newsletter;
