import React from "react";
import { Title } from "@/components/ui/Title";
import { motion } from "framer-motion";
import {
  Package,
  Clipboard,
  Users,
  ChartColumnBig,
  Store,
  Scissors,
  WifiOff,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const allFeatures = [
  {
    id: "inventory",
    icon: <Package className="w-8 h-8 text-brand-500" />,
    title: "Inventory built for fashion",
    description:
      "Track sizes, colour variants, fabrics, and quantities. Mark items as sold out, restocked, or discontinued with one tap.",
    className: "bg-brand-50",
    iconBg: "bg-white",
  },
  {
    id: "orders",
    icon: <Clipboard className="w-8 h-8 text-accent-500" />,
    title: "Manage orders without chaos",
    description:
      "Log orders from DM or WhatsApp. One-tap WhatsApp confirmation messages. Streamline your checkout flow.",
    className: "bg-accent-50",
    iconBg: "bg-white",
  },
  {
    id: "bespoke",
    icon: <Scissors className="w-8 h-8 text-purple-600" />,
    title: "Bespoke & Tailoring Board",
    description:
      "Record customer demands, save body measurements, track fabric requirements, and schedule fittings efficiently.",
    className: "bg-purple-50/70 border-purple-200/60",
    iconBg: "bg-white",
  },
  {
    id: "customers",
    icon: <Users className="w-8 h-8 text-success-500" />,
    title: "Built-in CRM & Measurements",
    description:
      "Full order history, customer body measurements map, and purchase debt tracking to build lasting customer relationships.",
    className: "bg-success-50",
    iconBg: "bg-white",
  },
  {
    id: "analytics",
    icon: <ChartColumnBig className="w-8 h-8 text-info-500" />,
    title: "Clear, visual analytics",
    description:
      "Know your best sellers, peak days, outstanding balances, and active tailoring demands at a glance.",
    className: "bg-info-50 text-gray-900",
    iconBg: "bg-white",
  },
  {
    id: "storefront",
    icon: <Store className="w-8 h-8 text-brand-400" />,
    title: "Public storefront",
    description:
      "Get a clean, shareable link (tryvendra.ng/store/yourname) where buyers can shop your ready-made items.",
    className: "bg-brand-100",
    iconBg: "bg-white",
  },
  {
    id: "offline",
    icon: <WifiOff className="w-8 h-8 text-orange-500" />,
    title: "Offline Compatibility",
    description:
      "Keep working even when the internet drops. View inventory, log sales, and check details offline. Syncs automatically when back online.",
    className: "bg-orange-50",
    iconBg: "bg-white",
  },
  {
    id: "whatsapp",
    icon: <MessageCircle className="w-8 h-8 text-green-500" />,
    title: "Vendra WhatsApp Assistant",
    description:
      "Our smart AI assistant works directly via WhatsApp to help you manage inventory, record orders, and send automated updates.",
    className: "bg-green-50",
    iconBg: "bg-white",
  },
];

const FeaturesPage = () => {
  return (
    <div className="bg-white overflow-x-hidden pt-24 pb-32">
      <div className="px-5 md:px-15 max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <Title
            eyebrowTitle="All Features"
            headingStart="Everything you need to run your fashion business."
            text="Discover all the powerful tools Vendra offers to help you manage inventory, serve customers, and grow your sales seamlessly."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allFeatures.map((feature, i) => (
            <div
              key={feature.id}
              className={cn(
                "rounded-3xl p-8 border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full",
                feature.className,
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl w-fit shadow-sm border border-gray-100 mb-6",
                  feature.iconBg,
                )}
              >
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-base leading-relaxed flex-grow">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
