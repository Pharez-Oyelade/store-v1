"use client";

import React, { useState } from "react";
import Button from "@/components/custom/Button";
import { Title } from "@/components/ui/Title";
import { apiPost } from "@/lib/api";
import toast from "react-hot-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/newsletter/subscribe", { email });
      setSubscribed(true);
      toast.success("Welcome to Vendra! You're on the early access list.");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-brand-900 flex flex-col md:flex-row justify-between items-center gap-12 lg:gap-20 border-t-2 border-t-accent-600 px-6 md:px-16 py-20">
      <div className="w-full text-white">
        <Title
          eyebrowTitle="Join the waitlist"
          headingStart="Stop losing sales to"
          headingSpan="chaos."
          text="Join early access. Vendors who sign up today get 3 months of Growth features for free and permanent early-adopter pricing."
        />
      </div>

      {/* NEWSLETTER input */}
      <div className="w-full max-w-md">
        {subscribed ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">You&apos;re on the list! 🎉</h3>
            <p className="text-sm text-gray-300">
              We&apos;ll notify you with your exclusive early access code.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="border border-white/30 bg-white/5 focus:bg-white/10 px-5 py-3.5 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-white transition-colors text-sm"
            />
            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={loading}
              className="w-full justify-center"
            >
              SECURE MY EARLY ACCESS
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

export default Newsletter;
