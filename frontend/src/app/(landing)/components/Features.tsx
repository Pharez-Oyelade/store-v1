"use client";

import { Title } from "@/components/ui/Title";
import { Icon } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  Clipboard,
  Users,
  ChartColumnBig,
  Store,
  ArrowRight,
} from "lucide-react";

const tabs = [
  {
    icon: <Package />,
    label: "Inventory",
    content: {
      tagline: "fashion-specific",
      heading: "Inventory built for fashion",
      paragraph:
        "Not a generic product list. Track sizes, colour variants, fabrics, and quantities — the way a fashion vendor actually thinks.",
      list: [
        "Add products with sizes (XS–XXL or custom), colour variants, and quantity per variant",
        "Low-stock alerts sent to your WhatsApp when stock hits your threshold",
        "Mark items as sold out, restocked, or discontinued with one tap",
        "Bulk price updates across multiple items at once",
        "Product photos — up to 5 per item",
        "Quick-add mode for vendors with large catalogues",
      ],
    },
  },
  {
    icon: <Clipboard />,
    label: "Orders",
    content: {
      tagline: "works with whatsapp",
      heading: "Manage orders without chaos.",
      paragraph:
        "Log orders from any channel — DM, WhatsApp, in-person — and track them in one place. Works alongside your existing workflow, not against it.",
      list: [
        "Log orders with customer name, item, size, colour, price, and deposit paid",
        "One-tap WhatsApp message generator — send a pre-formatted confirmation in seconds",
        "Order status: Pending → Confirmed → Ready → Dispatched → Completed",
        "Balance tracking — see who still owes you and how much",
        "Order history with search and filter by date, status, or customer",
        "Completing an order automatically updates your inventory",
      ],
    },
  },
  {
    icon: <Users />,
    label: "Customers",
    content: {
      tagline: "built-in crm",
      heading: "Know your customers.",
      paragraph:
        "Every customer you've sold to, their full order history, their preferences, and their balance — always at your fingertips.",
      list: [
        "Auto-create customer profiles when you log their first order",
        "Full order history, total spend, and last purchase date per customer",
        "Add private notes — sizes, preferences, payment history",
        "Flag VIP customers to prioritise them during restocks",
        "Export your full customer list as CSV anytime",
      ],
    },
  },
  {
    icon: <ChartColumnBig />,
    label: "Analytics",
    content: {
      tagline: "clear, visual, mobile-first",
      heading: "See what's actually working.",
      paragraph:
        "Simple insights that don't require a spreadsheet to understand. Know your best sellers, your peak days, and your total outstanding balance at a glance.",
      list: [
        "Revenue dashboard — today, this week, this month, custom range",
        "Best-selling products by quantity and by revenue",
        "Slow-moving inventory alert for items not ordered in 30+ days",
        "Peak order days and hours — know when your customers are buying",
        "Total balance owed summary across all customers",
      ],
    },
  },
  {
    icon: <Store />,
    label: "Storefront",
    content: {
      tagline: "your public face",
      heading: "A storefront that sells",
      paragraph:
        "Every vendor gets a clean, fast, shareable store page. Share the link in your Instagram bio and let buyers browse what's in stock — no DM required to check availability.",
      list: [
        "Your own link: sabistore.ng/yourname — shareable anywhere",
        "Shows real-time available products, sizes, and prices",
      ],
    },
  },
];

const Features = () => {
  const [tabOption, setTabOption] = useState("Inventory");

  const activeTab = tabs.find((tab) => tab.label === tabOption);

  return (
    <section className="px-5 md:px-15 py-20">
      <div>
        <Title
          eyebrowTitle="Features"
          headingStart="Everything your store needs."
          headingSpan="Nothing"
          headingEnd="it doesn't"
        />
      </div>

      {/* Features article */}
      <article
        id="case-article"
        className="h-auto flex flex-col md:flex-row gap-20 mt-10"
      >
        {/* section tags - left side */}
        <aside className="w-full md:w-1/3">
          <div className="sticky top-[15%]">
            <div className="flex flex-col border-x border-gray-400 border-t">
              {tabs.map((tab) => (
                <div key={tab.label} onClick={() => setTabOption(tab.label)}>
                  <div
                    className={cn(
                      "flex items-center gap-5 p-5 border-b border-gray-400",
                      "cursor-pointer",
                      tabOption === tab.label
                        ? "bg-accent-100 border-l-3 border-l-accent-400"
                        : "bg-transparent",
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>

                  {/* ................ MOBILE ACCORDION CONTENT ................ */}
                  {tab.label === tabOption && (
                    <div className="md:hidden border-b border-gray-400 py-3 px-5 space-y-1">
                      <span className="uppercase font-bold text-xs text-accent-600">
                        {activeTab?.content.tagline}
                      </span>
                      <h2 className="text-2xl font-bold tracking-tight capitalize">
                        {activeTab?.content.heading}
                      </h2>
                      <p>{activeTab?.content.paragraph}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Dynamic right side display corresponding to selected tab option */}
        <div className="hidden md:block w-full">
          <div className="bg-gray-600 p-10 space-y-3">
            <span className="uppercase font-bold text-sm text-accent-600">
              {activeTab?.content.tagline}
            </span>
            <h2 className="text-6xl font-bold max-w-lg tracking-tight text-white">
              {activeTab?.content.heading}
            </h2>
            <p className="text-lg text-gray-400">
              {activeTab?.content.paragraph}
            </p>
          </div>

          <ul className="border-2 border-gray-400 p-10 ">
            {activeTab?.content.list?.map((l, index) => (
              <li
                key={index}
                className="flex items-center gap-2 py-3 border-b border-b-gray-300"
              >
                <ArrowRight className="w-4 h-4" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
};

export default Features;
