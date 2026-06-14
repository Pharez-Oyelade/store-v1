"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/DashboardPrimitives";
import {
  useVendorProfile,
  useUpdateVendorProfile,
} from "@/hooks/useVendorProfile";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/dashboard/DashboardPrimitives";
import Link from "next/link";
import toast from "react-hot-toast";

const DEFAULT_TEMPLATES = {
  orderConfirmedTemplate:
    "Hi {customerName}, your order with {businessName} is confirmed! Total: ₦{totalAmount}. Balance: ₦{balanceOwed}.",
  orderDispatchedTemplate:
    "Hi {customerName}, your order is out for delivery! Track code: {trackingCode}.",
  orderCompletedTemplate:
    "Thank you for shopping with {businessName}, {customerName}! We'd love your feedback.",
};

const TOKENS = [
  "{customerName}",
  "{businessName}",
  "{orderId}",
  "{totalAmount}",
  "{balanceOwed}",
  "{trackingCode}",
  "{itemsList}",
];

export default function SocialTemplatesPage() {
  const { data: profile, isLoading } = useVendorProfile();
  const updateProfile = useUpdateVendorProfile();

  const [templates, setTemplates] = useState({
    orderConfirmedTemplate:
      profile?.socialMessaging?.orderConfirmedTemplate ||
      DEFAULT_TEMPLATES.orderConfirmedTemplate,
    orderDispatchedTemplate:
      profile?.socialMessaging?.orderDispatchedTemplate ||
      DEFAULT_TEMPLATES.orderDispatchedTemplate,
    orderCompletedTemplate:
      profile?.socialMessaging?.orderCompletedTemplate ||
      DEFAULT_TEMPLATES.orderCompletedTemplate,
  });

  const isPremium =
    profile?.subscriptionPlan === "atelier" ||
    profile?.subscriptionPlan === "maison";

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        socialMessaging: templates,
      });
      toast.success("Templates saved successfully");
    } catch (e) {
      toast.error("Failed to save templates");
    }
  };

  const renderPreview = (template: string) => {
    let preview = template;
    const mockData: Record<string, string> = {
      "{customerName}": "Pleasant",
      "{businessName}": profile?.businessName || "Your Store",
      "{orderId}": "ORD123",
      "{totalAmount}": "15,000",
      "{balanceOwed}": "0",
      "{trackingCode}": "TRK987",
      "{itemsList}": "• Aso Oke Blouse (M / Blue) × 1 — ₦15,000",
    };

    TOKENS.forEach((token) => {
      preview = preview.replaceAll(token, mockData[token] || token);
    });

    return preview;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl relative">
      <PageHeader
        title="Social Messaging Templates"
        description="Customize the automated WhatsApp messages sent to your customers."
      />

      {!isPremium && (
        <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl text-center max-w-md border border-gray-100 dark:border-gray-800">
            <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Custom social messaging templates are available on The Atelier and
              The Maison plans. Upgrade to unlock this feature.
            </p>
            <Link href="/dashboard/settings">
              <Button className="w-full">Upgrade Plan</Button>
            </Link>
          </div>
        </div>
      )}

      <div
        className={`space-y-8 ${!isPremium ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="bg-brand-purple/5 border border-brand-purple/20 p-4 rounded-xl mb-8">
          <h4 className="font-semibold text-brand-purple mb-2">
            Available Variables
          </h4>
          <div className="flex flex-wrap gap-2">
            {TOKENS.map((t) => (
              <span
                key={t}
                className="px-2 py-1 bg-white dark:bg-gray-800 text-xs font-mono rounded border border-gray-200 dark:border-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Confirmed Template */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Order Confirmed
            </h3>
            <TextArea
              rows={4}
              value={templates.orderConfirmedTemplate}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  orderConfirmedTemplate: e.target.value,
                })
              }
            />
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Live Preview (WhatsApp)
            </h4>
            <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {renderPreview(templates.orderConfirmedTemplate)}
            </div>
          </div>
        </div>

        {/* Dispatched Template */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Order Dispatched
            </h3>
            <TextArea
              rows={3}
              value={templates.orderDispatchedTemplate}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  orderDispatchedTemplate: e.target.value,
                })
              }
            />
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Live Preview (WhatsApp)
            </h4>
            <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {renderPreview(templates.orderDispatchedTemplate)}
            </div>
          </div>
        </div>

        {/* Completed Template */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Order Completed
            </h3>
            <TextArea
              rows={3}
              value={templates.orderCompletedTemplate}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  orderCompletedTemplate: e.target.value,
                })
              }
            />
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Live Preview (WhatsApp)
            </h4>
            <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {renderPreview(templates.orderCompletedTemplate)}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateProfile.isPending ? "Saving..." : "Save Templates"}
          </Button>
        </div>
      </div>
    </div>
  );
}
