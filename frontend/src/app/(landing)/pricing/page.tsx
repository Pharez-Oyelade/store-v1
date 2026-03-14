"use client";

import { Switch } from "@/components/ui/switch";
import { Title } from "@/components/ui/Title";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const Plans = [
  {
    tier: "01",
    name: "The Stitch",
    tagline:
      "For solo vendors and hobbyists taking their first serious step. Basic tools, zero complexity.",
    monthlyPrice: 4900,
    yearlyPrice: 3920,
    sku: 50,
  },
  {
    tier: "02",
    name: "The Drape",
    tagline:
      "For growing Instagram & WhatsApp brands handling real volume. Stop losing track of orders.",
    monthlyPrice: 14900,
    yearlyPrice: 11920,
    sku: 200,
  },
  {
    tier: "03",
    name: "The Atelier",
    tagline:
      "For established fashion brands with a real storefront, online presence, and a team to manage.",
    monthlyPrice: 34900,
    yearlyPrice: 27920,
    sku: "unlimited",
    isPopular: true,
  },
  {
    tier: "04",
    name: "The Maison",
    tagline:
      "For fashion houses, multi-brand portfolios, and serious scale. Full control, zero limits.",
  },
];

const page = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="px-4 md:px-15 py-15 md:py-20">
      <div className="flex flex-col gap-5 justify-center items-center text-center">
        <Title
          eyebrowTitle="Pricing plans"
          headingStart="Pick your"
          headingSpan="level."
          headingEnd="Grow your brand."
          text="From your first stocked rack to a multi-channel empire — Sabi Store has a plan built for every stage of the Nigerian fashion business"
        />

        <div className="flex items-center gap-4 mt-5">
          <span
            className={`text-md font-medium ${!isAnnual ? "text-accent-600" : "text-muted-foreground"}`}
          >
            Monthly
          </span>
          <Switch
            id="billing-cycle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="bg-slate-200 dark:bg-slate-700"
            size="default"
          />
          <span
            className={`text-md font-medium ${isAnnual ? "text-accent-600" : "text-muted-foreground"}`}
          >
            Annual
          </span>
        </div>
        {isAnnual && (
          <span className="ml-2 px-2 py-1 text-xs font-semibold bg-accent-500 text-white rounded">
            Save 20%
          </span>
        )}
      </div>

      {/* .................. PRICING CARDS .................. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {Plans.map((plan) => (
          <div
            key={plan.tier}
            className={cn(
              "p-5 border border-gray-200",
              plan.isPopular ? "bg-[#00000a] text-white" : "",
              "relative",
            )}
          >
            <div className="space-y-3">
              <span className="text-xs font-bold text-accent-600 uppercase">
                Tier {plan.tier}
              </span>
              <h2 className="font-cursive text-4xl font-bold">{plan.name}</h2>
              <p
                className={cn(
                  "text-sm",
                  plan.isPopular ? "text-gray-300" : "text-gray-600",
                )}
              >
                {plan.tagline}
              </p>
            </div>

            {/* PRICING */}
            <div className="py-10">
              <div>
                {/* <span>
                  {plan.monthlyPrice
                    ? formatCurrency(plan.monthlyPrice)
                    : "Custom"}
                </span> */}
                <div className="font-bold text-4xl">
                  {plan.monthlyPrice && plan.yearlyPrice ? (
                    <span>
                      {/* <sup className="text-sm">₦</sup> */}
                      <span className="font-sans">
                        {!isAnnual
                          ? formatCurrency(plan.monthlyPrice)
                          : formatCurrency(plan.yearlyPrice)}
                        <sub className="text-sm">/mo</sub>
                      </span>
                      {isAnnual && (
                        <div className="text-sm text-accent-800">
                          ≈ {formatCurrency(plan.yearlyPrice * 12)} billed
                          annually
                        </div>
                      )}
                    </span>
                  ) : (
                    "Custom"
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <button className="border py-3 w-full px-5 hover:bg-accent-500 hover:border-accent-500 hover:text-white">
              {plan.monthlyPrice ? "START FREE TRIAL" : "BOOK A CALL"}
            </button>

            {/* popular tag */}
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-accent-600 px-3 uppercase">
                Most Popular
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default page;
