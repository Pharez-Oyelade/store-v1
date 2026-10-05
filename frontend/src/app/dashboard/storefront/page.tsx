"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Package,
  Scissors,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  Globe,
  Palette,
  Settings,
  MapPin,
  Instagram,
  Upload,
  Tag,
  Plus,
  Trash2,
  Truck,
  CheckCircle2,
} from "lucide-react";
import Button from "@/components/custom/Button";
import { PageHeader } from "@/components/dashboard/DashboardPrimitives";
import {
  useVendorProfile,
  useUpdateStorefrontSettings,
  useUpdateStorefrontBanner,
  useVendorDiscounts,
  useCreateDiscount,
  useDeleteDiscount,
} from "@/hooks/useVendorProfile";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const NIGERIAN_STATES = [
  "Abia",
  "Abuja (FCT)",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export default function StorefrontDashboardPage() {
  const { data: vendorProfile, isLoading } = useVendorProfile();
  const authVendor = useAuthStore((s) => s.vendor);
  const vendor = vendorProfile || (authVendor as any);

  const updateSettings = useUpdateStorefrontSettings();
  const updateBanner = useUpdateStorefrontBanner();
  const { data: discounts = [] } = useVendorDiscounts();
  const createDiscountMutation = useCreateDiscount();
  const deleteDiscountMutation = useDeleteDiscount();

  const [activeTab, setActiveTab] = useState<
    "overview" | "appearance" | "delivery" | "campaigns"
  >("overview");
  const [copied, setCopied] = useState(false);

  // Appearance Form State
  const [appearanceForm, setAppearanceForm] = useState({
    themeColor: "#E2A03F",
    accentColor: "#E11D48",
    announcementText: "",
    announcementActive: true,
    whatsappFabEnabled: true,
    businessType: "ready_to_wear",
    category: "fashion",
  });

  // Delivery Form State
  const [deliveryRates, setDeliveryRates] = useState<
    { state: string; fee: number; areas?: string[] }[]
  >([]);
  const [newRateState, setNewRateState] = useState("Lagos");
  const [newRateFee, setNewRateFee] = useState<string>("2500");
  const [newRateAreas, setNewRateAreas] = useState<string>("");

  // Campaign Form State
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoType, setNewPromoType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [newPromoValue, setNewPromoValue] = useState<string>("10");
  const [newPromoMinSpend, setNewPromoMinSpend] = useState<string>("0");
  const [newPromoBroadcast, setNewPromoBroadcast] = useState(true);

  // Sync profile data to local state
  useEffect(() => {
    if (vendorProfile) {
      setAppearanceForm({
        themeColor: vendorProfile.storefrontSettings?.themeColor || "#E2A03F",
        accentColor: vendorProfile.storefrontSettings?.accentColor || "#E11D48",
        announcementText:
          vendorProfile.storefrontSettings?.announcementText || "",
        announcementActive:
          vendorProfile.storefrontSettings?.announcementActive !== false,
        whatsappFabEnabled:
          vendorProfile.storefrontSettings?.whatsappFabEnabled !== false,
        businessType: vendorProfile.businessType || "ready_to_wear",
        category: vendorProfile.category || "fashion",
      });
      setDeliveryRates(vendorProfile.storefrontSettings?.deliveryRates || []);
    }
  }, [vendorProfile]);

  const handle = vendorProfile?.handle || authVendor?.handle || "";
  const businessName =
    vendorProfile?.businessName ||
    authVendor?.businessName ||
    "Your Storefront";
  const bio = vendorProfile?.bio;
  const logoUrl = vendorProfile?.logo?.url;
  const bannerUrl = vendorProfile?.storefrontSettings?.bannerImage?.url;
  const location = vendorProfile?.location;
  const socials = vendorProfile?.socials;

  const publicStoreUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${handle}`
      : `https://tryvendra.ng/store/${handle}`;

  const handleCopyLink = () => {
    if (!handle) return;
    navigator.clipboard.writeText(publicStoreUrl);
    setCopied(true);
    toast.success("Storefront link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      themeColor: appearanceForm.themeColor,
      accentColor: appearanceForm.accentColor,
      announcementText: appearanceForm.announcementText,
      announcementActive: appearanceForm.announcementActive,
      whatsappFabEnabled: appearanceForm.whatsappFabEnabled,
      businessType: appearanceForm.businessType,
      category: appearanceForm.category,
    });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    updateBanner.mutate(formData);
  };

  const handleAddDeliveryRate = (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = Number(newRateFee);
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error("Please enter a valid fee");
      return;
    }

    const areasArray = newRateAreas
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const updated = [
      ...deliveryRates.filter(
        (r) => r.state.toLowerCase() !== newRateState.toLowerCase(),
      ),
      { state: newRateState, fee: feeNum, areas: areasArray },
    ];

    setDeliveryRates(updated);
    updateSettings.mutate({ deliveryRates: updated });
    setNewRateAreas("");
    toast.success(`Delivery rate for ${newRateState} saved`);
  };

  const handleRemoveDeliveryRate = (stateToRemove: string) => {
    const updated = deliveryRates.filter((r) => r.state !== stateToRemove);
    setDeliveryRates(updated);
    updateSettings.mutate({ deliveryRates: updated });
    toast.success(`Delivery rate removed`);
  };

  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;

    createDiscountMutation.mutate({
      code: newPromoCode.trim().toUpperCase(),
      type: newPromoType,
      value: Number(newPromoValue),
      minOrderAmount: Number(newPromoMinSpend) || 0,
      showInAnnouncementBar: newPromoBroadcast,
    });

    setNewPromoCode("");
  };

  const locationString = [location?.area, location?.city, location?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-6xl pb-24 space-y-8">
      <PageHeader
        title="Storefront & Public Catalog"
        description="Customize your online boutique appearance, delivery rates, campaigns, and preview what customers see."
        action={
          handle ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>

              <Link
                href={`/store/${handle}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-2xs transition-all"
              >
                <span className="text-white">View Public Store</span>
                <ExternalLink size={14} className="text-white" />
              </Link>
            </div>
          ) : undefined
        }
      />

      {/* ── Navigation Tabs ─────────────────────────────────── */}
      <div className="flex border-b border-stone-200 gap-6 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`pb-3 transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-gray-950 text-gray-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Storefront Hub
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`pb-3 transition-colors ${
            activeTab === "appearance"
              ? "border-b-2 border-gray-950 text-gray-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Branding & Appearance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={`pb-3 transition-colors ${
            activeTab === "delivery"
              ? "border-b-2 border-gray-950 text-gray-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Delivery Rates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 transition-colors ${
            activeTab === "campaigns"
              ? "border-b-2 border-gray-950 text-gray-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Discounts & Campaigns
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & HUB ───────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Banner Header */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Storefront Ready
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-gray-300 border border-white/15">
                    <ShieldCheck size={12} className="text-amber-400" />
                    Production Guard Active
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  {businessName}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Your public storefront adapts based on your business model:
                  ready-to-wear pieces, bespoke requests with measurements, and
                  instant WhatsApp / Paystack ordering.
                </p>
              </div>

              {/* Quick Link Card */}
              <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-3 shrink-0">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                  Storefront Web Address
                </span>
                <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-amber-200 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
                  <Globe size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-xs">
                    {publicStoreUrl}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/15 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copied ? "Link Copied" : "Copy Link"}
                  </button>
                  {handle && (
                    <Link
                      href={`/store/${handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors"
                    >
                      <Eye size={13} />
                      Open Store
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Hub Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Storefront Appearance Preview
                    </h3>
                    <p className="text-xs text-stone-500">
                      Live preview of your brand hero, logo, and active business
                      model
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("appearance")}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <Palette size={13} />
                    Customize Appearance
                  </button>
                </div>

                {/* Mock Hero Card */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 overflow-hidden">
                  {bannerUrl ? (
                    <div className="h-32 w-full overflow-hidden relative">
                      <img
                        src={bannerUrl}
                        alt="Store banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                  ) : null}

                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={businessName}
                          className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 font-serif font-bold text-2xl flex items-center justify-center border border-amber-200 shadow-2xs shrink-0">
                          {businessName.charAt(0) || "V"}
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h4 className="text-xl font-serif font-bold text-gray-950">
                            {businessName}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {appearanceForm.businessType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 max-w-lg leading-relaxed">
                          {bio ||
                            "Add a business bio in Settings to tell your brand story."}
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-stone-500">
                          {locationString && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-stone-400" />
                              {locationString}
                            </span>
                          )}
                          {socials?.whatsapp && (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <MessageCircle size={12} />
                              WhatsApp Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Manage Content & Orders
                </h3>
                <div className="space-y-3 pt-1">
                  <Link
                    href="/dashboard/products"
                    className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                        <Package size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Product Inventory
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Add or edit ready-to-wear pieces
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-stone-400 group-hover:text-stone-900"
                    />
                  </Link>

                  <Link
                    href="/dashboard/demands"
                    className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                        <Scissors size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Bespoke Demands
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Review custom tailor requests
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-stone-400 group-hover:text-amber-800"
                    />
                  </Link>

                  <Link
                    href="/dashboard/orders"
                    className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                        <MessageCircle size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Store Orders
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Orders placed on storefront
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-stone-400 group-hover:text-emerald-800"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BRANDING & APPEARANCE ─────────────────────── */}
      {activeTab === "appearance" && (
        <form onSubmit={handleSaveAppearance} className="space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-lg font-serif font-bold text-gray-950 border-b border-stone-200 pb-3">
              Storefront Customization & Theme
            </h3>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Theme Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearanceForm.themeColor}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        themeColor: e.target.value,
                      })
                    }
                    className="size-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={appearanceForm.themeColor}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        themeColor: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Accent Color (Buttons, Badges & Price)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearanceForm.accentColor}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        accentColor: e.target.value,
                      })
                    }
                    className="size-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={appearanceForm.accentColor}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        accentColor: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Store Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Storefront Business Model
                </label>
                <select
                  value={appearanceForm.businessType}
                  onChange={(e) =>
                    setAppearanceForm({
                      ...appearanceForm,
                      businessType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium bg-white"
                >
                  <option value="ready_to_wear">
                    Ready-to-Wear (E-commerce Catalog & Cart)
                  </option>
                  <option value="demand">
                    Bespoke Tailoring Only (Measurements & Requests)
                  </option>
                  <option value="hybrid">
                    Hybrid (Both Catalog Cart & Bespoke Requests)
                  </option>
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  Controls whether cart, bespoke forms, or both are shown on
                  your navbar and hero.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Boutique Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bridal & Evening Wear, Casual Menswear"
                  value={appearanceForm.category}
                  onChange={(e) =>
                    setAppearanceForm({
                      ...appearanceForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Announcement Notice Bar */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Top Announcement / Notice Bar (Drape+ Plan)
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearanceForm.announcementActive}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        announcementActive: e.target.checked,
                      })
                    }
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  <span>Show on storefront</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Worldwide Shipping Available • New Spring Collection Released!"
                value={appearanceForm.announcementText}
                onChange={(e) =>
                  setAppearanceForm({
                    ...appearanceForm,
                    announcementText: e.target.value,
                  })
                }
                className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* WhatsApp Floating Action Button */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  WhatsApp Floating Action Button (FAB)
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Display a floating WhatsApp chat button at the bottom-right of
                  your storefront.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearanceForm.whatsappFabEnabled}
                  onChange={(e) =>
                    setAppearanceForm({
                      ...appearanceForm,
                      whatsappFabEnabled: e.target.checked,
                    })
                  }
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                />
                <span>Active</span>
              </label>
            </div>

            {/* Banner Image Upload */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Storefront Hero Banner Image
              </h4>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    className="h-20 w-36 rounded-xl object-cover border border-stone-200"
                  />
                ) : (
                  <div className="h-20 w-36 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xs text-stone-400">
                    No banner
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors">
                  <Upload size={14} />
                  <span>
                    {updateBanner.isPending
                      ? "Uploading..."
                      : "Upload New Banner"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-4 border-t border-stone-100">
              <Button
                type="submit"
                variant="primary"
                isLoading={updateSettings.isPending}
              >
                Save Appearance Settings
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 3: DELIVERY RATES ───────────────────────────── */}
      {activeTab === "delivery" && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-950">
                State & Regional Delivery Rates
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure delivery fees for customer states. These will
                automatically appear in your checkout dropdown and calculate
                total shipping.
              </p>
            </div>

            {/* Add Rate Form */}
            <form
              onSubmit={handleAddDeliveryRate}
              className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Add or Update Delivery Rate
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    State
                  </label>
                  <select
                    value={newRateState}
                    onChange={(e) => setNewRateState(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2500"
                    value={newRateFee}
                    onChange={(e) => setNewRateFee(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Covered Areas (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Island, Mainland, Lekki"
                    value={newRateAreas}
                    onChange={(e) => setNewRateAreas(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateSettings.isPending}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                <Plus size={13} />
                <span>Save Rate for {newRateState}</span>
              </button>
            </form>

            {/* List of Configured Rates */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Active Delivery Rates ({deliveryRates.length})
              </h4>

              {deliveryRates.length === 0 ? (
                <p className="text-xs text-stone-400 italic">
                  No delivery rates configured yet. Checkout will show
                  "Calculated at confirmation".
                </p>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {deliveryRates.map((rate) => (
                    <div
                      key={rate.state}
                      className="p-3 sm:px-4 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-950 mr-2">
                          {rate.state}
                        </span>
                        <span className="text-amber-800 font-semibold">
                          {formatCurrency(rate.fee)}
                        </span>
                        {rate.areas && rate.areas.length > 0 && (
                          <span className="text-stone-400 ml-2">
                            ({rate.areas.join(", ")})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliveryRate(rate.state)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DISCOUNTS & CAMPAIGNS ─────────────────────── */}
      {activeTab === "campaigns" && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-950">
                Promotional Discounts & Coupons
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Generate promo codes for campaigns, holiday sales, and customer
                appreciation.
              </p>
            </div>

            {/* Create Coupon Form */}
            <form
              onSubmit={handleCreatePromoCode}
              className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Create New Promo Code
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER15"
                    value={newPromoCode}
                    onChange={(e) =>
                      setNewPromoCode(e.target.value.toUpperCase())
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs uppercase font-mono bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Discount Value ({newPromoType === "percentage" ? "%" : "₦"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={newPromoType === "percentage" ? "15" : "5000"}
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Min Order Spend (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newPromoMinSpend}
                    onChange={(e) => setNewPromoMinSpend(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPromoBroadcast}
                    onChange={(e) => setNewPromoBroadcast(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  <span>
                    Broadcast promo code in Top Announcement Notice Bar
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={
                    createDiscountMutation.isPending || !newPromoCode.trim()
                  }
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-stone-800 transition-colors disabled:opacity-40"
                >
                  <Plus size={13} />
                  <span>Create Coupon</span>
                </button>
              </div>
            </form>

            {/* List Active Discounts */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Active Campaigns ({discounts.length})
              </h4>

              {discounts.length === 0 ? (
                <p className="text-xs text-stone-400 italic">
                  No promotional discounts created yet.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {discounts.map((discount: any) => (
                    <div
                      key={discount._id || discount.code}
                      className="p-3 sm:px-4 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="size-4 text-emerald-600" />
                        <div>
                          <span className="font-mono font-bold text-gray-950 mr-2">
                            {discount.code}
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            {discount.type === "percentage"
                              ? `${discount.value}% OFF`
                              : `₦${discount.value.toLocaleString("en-NG")} OFF`}
                          </span>
                          {discount.minOrderAmount > 0 && (
                            <span className="text-stone-400 ml-2">
                              (Min: ₦
                              {discount.minOrderAmount.toLocaleString("en-NG")})
                            </span>
                          )}
                          {discount.showInAnnouncementBar && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Notice Bar
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-stone-400 text-[11px]">
                          Used {discount.usedCount || 0} times
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            deleteDiscountMutation.mutate(
                              discount._id || discount.code,
                            )
                          }
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
