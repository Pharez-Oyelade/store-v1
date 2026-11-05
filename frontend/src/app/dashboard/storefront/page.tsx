"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ShieldAlert,
  ShieldCheck,
  Eye,
  Globe,
  Palette,
  Settings,
  MapPin,
  Upload,
  Tag,
  Plus,
  Trash2,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
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
import { useProducts } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import { hasMinPlan } from "@/lib/subscriptionGating";
import toast from "react-hot-toast";

// 6 Curated Fashion Editorial Palettes
const FASHION_PALETTES = [
  {
    name: "Midnight Noir",
    theme: "#141210",
    accent: "#C88A2C",
    desc: "Luxury obsidian with rich warm gold",
  },
  {
    name: "Forest Emerald",
    theme: "#0F382A",
    accent: "#E2A03F",
    desc: "Deep African emerald with satin amber",
  },
  {
    name: "Sartorial Indigo",
    theme: "#161F38",
    accent: "#E11D48",
    desc: "Classic navy tailoring with ruby accent",
  },
  {
    name: "Terracotta Earth",
    theme: "#3B1E16",
    accent: "#E07A5F",
    desc: "Warm artisanal clay and burnt amber",
  },
  {
    name: "Plum Royale",
    theme: "#2B162C",
    accent: "#D4AF37",
    desc: "Regal velvet violet with pale gold",
  },
  {
    name: "Minimalist Stone",
    theme: "#292524",
    accent: "#1C1917",
    desc: "Editorial monochromatic charcoal",
  },
];

const STANDARD_NIGERIA_RATES = [
  { state: "Lagos", fee: 2500, areas: ["Mainland", "Island", "Ikeja", "Lekki"] },
  { state: "Abuja (FCT)", fee: 4500, areas: ["Central Area", "Maitama", "Garki", "Wuse"] },
  { state: "Rivers", fee: 4500, areas: ["Port Harcourt", "Obio-Akpor"] },
  { state: "Oyo", fee: 3500, areas: ["Ibadan Central", "Bodija", "Oluyole"] },
  { state: "Interstate Express", fee: 6000, areas: ["All other states nationwide"] },
];

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
  const { data: vendorProfile, isLoading: profileLoading } = useVendorProfile();
  const authVendor = useAuthStore((s) => s.vendor);
  const vendor = vendorProfile || (authVendor as any);

  const { data: productsData } = useProducts({ limit: 50 });
  const activeProducts = useMemo(() => {
    const list = productsData?.products || [];
    return list.filter((p: any) => p.status === "active");
  }, [productsData]);

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
    themeColor: "#141210",
    accentColor: "#C88A2C",
    announcementText: "",
    announcementActive: true,
    whatsappFabEnabled: true,
    businessType: "unselected",
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
  const [newPromoType, setNewPromoType] = useState<"percentage" | "fixed">("percentage");
  const [newPromoValue, setNewPromoValue] = useState<string>("10");
  const [newPromoMinSpend, setNewPromoMinSpend] = useState<string>("0");
  const [newPromoBroadcast, setNewPromoBroadcast] = useState(true);

  // Sync profile data to local state
  useEffect(() => {
    if (vendorProfile) {
      setAppearanceForm({
        themeColor: vendorProfile.storefrontSettings?.themeColor || "#141210",
        accentColor: vendorProfile.storefrontSettings?.accentColor || "#C88A2C",
        announcementText: vendorProfile.storefrontSettings?.announcementText || "",
        announcementActive: vendorProfile.storefrontSettings?.announcementActive !== false,
        whatsappFabEnabled: vendorProfile.storefrontSettings?.whatsappFabEnabled !== false,
        businessType: vendorProfile.businessType || "unselected",
        category: vendorProfile.category || "fashion",
      });
      setDeliveryRates(vendorProfile.storefrontSettings?.deliveryRates || []);
    }
  }, [vendorProfile]);

  const handle = vendorProfile?.handle || authVendor?.handle || "";
  const businessName = vendorProfile?.businessName || authVendor?.businessName || "Your Boutique";
  const plan = vendorProfile?.subscriptionPlan || "free";
  const isDrapePlus = hasMinPlan(plan, "drape");

  const bio = vendorProfile?.bio;
  const logoUrl = vendorProfile?.logo?.url;
  const bannerUrl = vendorProfile?.storefrontSettings?.bannerImage?.url;
  const isPublished = Boolean(vendorProfile?.storefrontSettings?.isPublished);

  // Compute launch readiness checklist
  const isTypeSelected = appearanceForm.businessType !== "unselected";
  const isDemandModel = appearanceForm.businessType === "demand";
  const hasMinCatalog = isDemandModel ? true : activeProducts.length >= 2;
  const hasContact = Boolean(vendorProfile?.socials?.whatsapp || vendorProfile?.phone);
  const hasDeliveryRates = deliveryRates.length > 0;

  const isEligibleToPublish = isTypeSelected && hasMinCatalog && hasContact;

  const publicStoreUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${handle}`
      : `https://tryvendra.ng/store/${handle}`;

  const previewStoreUrl = `${publicStoreUrl}?preview=true`;

  const handleCopyLink = () => {
    if (!handle) return;
    navigator.clipboard.writeText(publicStoreUrl);
    setCopied(true);
    toast.success("Storefront link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTogglePublish = () => {
    if (!isPublished && !isEligibleToPublish) {
      if (!isTypeSelected) {
        toast.error("Please choose your business model first.");
        return;
      }
      if (!hasMinCatalog) {
        toast.error(`You need at least 2 active products in your catalog (currently ${activeProducts.length}/2).`);
        return;
      }
      if (!hasContact) {
        toast.error("Please add a contact phone or WhatsApp in Settings.");
        return;
      }
    }

    updateSettings.mutate({
      isPublished: !isPublished,
      businessType: appearanceForm.businessType,
    });
  };

  const handleSelectBusinessType = (type: string) => {
    setAppearanceForm((prev) => ({ ...prev, businessType: type }));
    updateSettings.mutate({
      businessType: type,
    });
  };

  const handleSelectPalette = (palette: typeof FASHION_PALETTES[0]) => {
    setAppearanceForm((prev) => ({
      ...prev,
      themeColor: palette.theme,
      accentColor: palette.accent,
    }));
    updateSettings.mutate({
      themeColor: palette.theme,
      accentColor: palette.accent,
    });
    toast.success(`Applied ${palette.name} theme`);
  };

  const handleApplyDefaultRates = () => {
    setDeliveryRates(STANDARD_NIGERIA_RATES);
    updateSettings.mutate({ deliveryRates: STANDARD_NIGERIA_RATES });
    toast.success("Applied standard Nigerian delivery fees!");
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
        (r) => r.state.toLowerCase() !== newRateState.toLowerCase()
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
    toast.success("Delivery rate removed");
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

  return (
    <div className="mx-auto max-w-6xl pb-24 space-y-8">
      {/* ── Top Header ────────────────────────────────────────── */}
      <PageHeader
        title="Storefront & Public Catalog"
        description="Configure your dedicated online boutique, catalog, delivery rates, and brand identity."
        action={
          handle ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Link"}
              </button>

              <Link
                href={previewStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-2xs transition-all"
              >
                <Eye size={14} />
                <span>Preview Store</span>
              </Link>
            </div>
          ) : undefined
        }
      />

      {/* ── Master Status Banner ──────────────────────────────── */}
      <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {isPublished && isEligibleToPublish ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live to Public (200 OK)
                </span>
              ) : isEligibleToPublish ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  <Sparkles size={13} className="text-blue-400" />
                  Ready to Publish (Draft)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <ShieldAlert size={13} className="text-amber-400" />
                  Inactive / Setup Required (404)
                </span>
              )}

              <span className="text-xs text-stone-400 font-medium">
                Tier: <strong className="text-amber-400 font-bold uppercase">{plan}</strong> ({isDrapePlus ? "Multi-Page" : "Single-Page"})
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {businessName}
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {isPublished && isEligibleToPublish
                ? "Your public storefront is live and taking customer orders and custom inquiries."
                : isEligibleToPublish
                ? "All requirements are met! Toggle your store live whenever you are ready."
                : "Your public link shows a 404 until you select your business model and add at least 2 catalog products."}
            </p>
          </div>

          {/* Quick Publish Control Card */}
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] uppercase tracking-wider text-stone-300 font-semibold block">
                Public Store Visibility
              </span>
              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={updateSettings.isPending || (!isPublished && !isEligibleToPublish)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isPublished
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : isEligibleToPublish
                    ? "bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-extrabold animate-pulse"
                    : "bg-stone-700 text-stone-400 cursor-not-allowed"
                }`}
              >
                {updateSettings.isPending
                  ? "Updating..."
                  : isPublished
                  ? "Take Offline (Unpublish)"
                  : "Publish Storefront Now"}
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-amber-200 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
              <Globe size={13} className="text-amber-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{publicStoreUrl}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Setup Progress Checklist (Zero Cognitive Load) ───── */}
      {(!isPublished || !isEligibleToPublish) && (
        <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-gray-950 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-600" />
                Storefront Launch Checklist
              </h3>
              <p className="text-xs text-stone-600">
                Complete these quick prerequisites to activate your public boutique link.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
              {[isTypeSelected, hasMinCatalog, hasContact, hasDeliveryRates].filter(Boolean).length} / 4 Done
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Step 1: Business Type */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Step 1</span>
                {isTypeSelected ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">Business Model</h4>
              <p className="text-[11px] text-stone-500">
                {isTypeSelected ? appearanceForm.businessType.replace(/_/g, " ") : "Select RTW, Demand, or Hybrid"}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="text-xs font-semibold text-amber-800 hover:underline pt-1 block"
              >
                {isTypeSelected ? "Change Model" : "Select Model"}
              </button>
            </div>

            {/* Step 2: Catalog Products */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Step 2</span>
                {hasMinCatalog ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">Catalog Readiness</h4>
              <p className="text-[11px] text-stone-500">
                {isDemandModel
                  ? "Bespoke demand model ready"
                  : `${activeProducts.length} / 2 active products added`}
              </p>
              <Link
                href="/dashboard/products"
                className="text-xs font-semibold text-amber-800 hover:underline pt-1 block"
              >
                {hasMinCatalog ? "Manage Catalog" : "+ Add Products"}
              </Link>
            </div>

            {/* Step 3: Contact & WhatsApp */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Step 3</span>
                {hasContact ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">WhatsApp / Phone</h4>
              <p className="text-[11px] text-stone-500">
                {hasContact ? "Direct chat enabled" : "Add phone number"}
              </p>
              <Link
                href="/dashboard/settings"
                className="text-xs font-semibold text-amber-800 hover:underline pt-1 block"
              >
                {hasContact ? "Verified" : "Set in Settings"}
              </Link>
            </div>

            {/* Step 4: Delivery Fees */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Step 4</span>
                {hasDeliveryRates ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">Delivery Rates</h4>
              <p className="text-[11px] text-stone-500">
                {hasDeliveryRates ? `${deliveryRates.length} states configured` : "No rates set"}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("delivery")}
                className="text-xs font-semibold text-amber-800 hover:underline pt-1 block"
              >
                {hasDeliveryRates ? "View Rates" : "Configure Shipping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Tabs ─────────────────────────────────── */}
      <div className="flex border-b border-stone-200 gap-6 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`pb-3 transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-stone-950 text-stone-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Business Model & Hub
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`pb-3 transition-colors ${
            activeTab === "appearance"
              ? "border-b-2 border-stone-950 text-stone-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Branding & Palettes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={`pb-3 transition-colors ${
            activeTab === "delivery"
              ? "border-b-2 border-stone-950 text-stone-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Delivery Rates ({deliveryRates.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 transition-colors ${
            activeTab === "campaigns"
              ? "border-b-2 border-stone-950 text-stone-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Discounts & Notice Bar
        </button>
      </div>

      {/* ── TAB 1: BUSINESS MODEL & HUB ─────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Business Model Selector */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-950">
                Choose Your Business Model
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                This dictates your public storefront experience: shopping cart, lookbook, bespoke measurement forms, or both.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: RTW */}
              <div
                onClick={() => handleSelectBusinessType("ready_to_wear")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                  appearanceForm.businessType === "ready_to_wear"
                    ? "border-stone-950 bg-stone-50/80 shadow-xs"
                    : "border-stone-200 hover:border-stone-400 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  {appearanceForm.businessType === "ready_to_wear" && (
                    <span className="size-5 rounded-full bg-stone-950 text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-950">Ready-to-Wear (RTW)</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    E-commerce catalog with sizes, colors, and live inventory. Shoppers add pieces to cart and checkout instantly.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-amber-800 font-semibold">
                  Requires ≥2 active catalog pieces
                </div>
              </div>

              {/* Option 2: Bespoke Tailor (Demand) */}
              <div
                onClick={() => handleSelectBusinessType("demand")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                  appearanceForm.businessType === "demand"
                    ? "border-stone-950 bg-stone-50/80 shadow-xs"
                    : "border-stone-200 hover:border-stone-400 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Scissors size={20} />
                  </div>
                  {appearanceForm.businessType === "demand" && (
                    <span className="size-5 rounded-full bg-stone-950 text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-950">Bespoke Tailor (Demand)</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Made-to-measure tailoring. Showcase your signature style lookbook and receive custom measurement requests.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-amber-800 font-semibold">
                  Signature Lookbook + Measurement Form
                </div>
              </div>

              {/* Option 3: Hybrid */}
              <div
                onClick={() => handleSelectBusinessType("hybrid")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                  appearanceForm.businessType === "hybrid"
                    ? "border-stone-950 bg-stone-50/80 shadow-xs"
                    : "border-stone-200 hover:border-stone-400 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  {appearanceForm.businessType === "hybrid" && (
                    <span className="size-5 rounded-full bg-stone-950 text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-950">Hybrid House</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    The complete fashion house: sells stocked ready-to-wear pieces AND takes bespoke tailored requests.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-amber-800 font-semibold">
                  Full Catalog Cart + Bespoke Inquiries
                </div>
              </div>
            </div>
          </div>

          {/* Device Mockup Preview */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-950">
                  Live Brand Preview
                </h3>
                <p className="text-xs text-stone-500">
                  Visual snapshot of your store's current palette, logo, and banner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("appearance")}
                className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
              >
                <Palette size={13} />
                Customize Branding
              </button>
            </div>

            <div className="max-w-md mx-auto rounded-3xl border-4 border-stone-800 overflow-hidden shadow-xl bg-stone-50">
              {/* Simulated Phone Notch */}
              <div className="bg-stone-800 h-6 flex items-center justify-center">
                <div className="w-20 h-3 bg-black rounded-b-lg" />
              </div>

              {/* Simulated Store Hero */}
              <div
                className="p-6 text-white text-center space-y-3 relative overflow-hidden"
                style={{ backgroundColor: appearanceForm.themeColor }}
              >
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 space-y-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      className="size-14 rounded-2xl mx-auto object-cover border-2 border-white/40 shadow-sm"
                    />
                  ) : (
                    <div className="size-14 rounded-2xl mx-auto bg-white/20 flex items-center justify-center font-serif font-bold text-xl border-2 border-white/30">
                      {businessName.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-serif font-bold text-lg">{businessName}</h4>
                  <p className="text-[11px] text-white/80 line-clamp-2 max-w-xs mx-auto">
                    {bio || "Your curated fashion collections and bespoke tailoring."}
                  </p>
                  <span
                    className="inline-block py-1 px-3 rounded-full text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: appearanceForm.accentColor }}
                  >
                    {appearanceForm.businessType.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Simulated Content Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>{isDemandModel ? "Signature Styles" : "Collection Pieces"}</span>
                  <span className="text-[10px] text-stone-400">View All</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-3/4 rounded-xl bg-stone-200 animate-pulse" />
                  <div className="aspect-3/4 rounded-xl bg-stone-200 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BRANDING & APPEARANCE ─────────────────────── */}
      {activeTab === "appearance" && (
        <form onSubmit={handleSaveAppearance} className="space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-8">
            {/* 6 Curated Fashion Palettes */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-950">
                  Curated Fashion Palettes
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Hand-crafted color pairings tailored for luxury Nigerian boutiques and ateliers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {FASHION_PALETTES.map((pal) => {
                  const isSelected =
                    appearanceForm.themeColor.toLowerCase() === pal.theme.toLowerCase();
                  return (
                    <div
                      key={pal.name}
                      onClick={() => handleSelectPalette(pal)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2.5 ${
                        isSelected
                          ? "border-stone-950 bg-stone-50 shadow-2xs"
                          : "border-stone-200 hover:border-stone-400 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-7 rounded-xl border border-stone-300 shadow-2xs"
                          style={{ backgroundColor: pal.theme }}
                        />
                        <div
                          className="size-7 rounded-xl border border-stone-300 shadow-2xs"
                          style={{ backgroundColor: pal.accent }}
                        />
                        <span className="text-xs font-bold text-gray-950 ml-1">
                          {pal.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">{pal.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Overrides (Gated to Drape+) */}
            <div className="pt-6 border-t border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Custom Hex Color Overrides
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Fine-tune exact brand hex colors for background and action buttons.
                  </p>
                </div>
                {!isDrapePlus && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Lock size={12} />
                    Unlocked on The Drape+
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Primary Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      disabled={!isDrapePlus}
                      value={appearanceForm.themeColor}
                      onChange={(e) =>
                        setAppearanceForm({ ...appearanceForm, themeColor: e.target.value })
                      }
                      className="size-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 disabled:opacity-50"
                    />
                    <input
                      type="text"
                      disabled={!isDrapePlus}
                      value={appearanceForm.themeColor}
                      onChange={(e) =>
                        setAppearanceForm({ ...appearanceForm, themeColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono disabled:bg-stone-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Accent Color (CTA Buttons & Highlights)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      disabled={!isDrapePlus}
                      value={appearanceForm.accentColor}
                      onChange={(e) =>
                        setAppearanceForm({ ...appearanceForm, accentColor: e.target.value })
                      }
                      className="size-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 disabled:opacity-50"
                    />
                    <input
                      type="text"
                      disabled={!isDrapePlus}
                      value={appearanceForm.accentColor}
                      onChange={(e) =>
                        setAppearanceForm({ ...appearanceForm, accentColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono disabled:bg-stone-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Banner Upload */}
            <div className="pt-6 border-t border-stone-100 space-y-3">
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
                    No banner uploaded
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors">
                  <Upload size={14} />
                  <span>{updateBanner.isPending ? "Uploading..." : "Upload New Banner"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* WhatsApp Floating Button */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  WhatsApp Floating Chat Button (FAB)
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Display a quick chat button at the bottom right corner of your storefront.
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

            {/* Save Button */}
            <div className="pt-4 border-t border-stone-100">
              <Button type="submit" variant="primary" isLoading={updateSettings.isPending}>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-950">
                  State & Regional Delivery Fees
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure delivery rates for Nigerian states. These populate your 2-step checkout automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyDefaultRates}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors shrink-0"
              >
                <Truck size={14} />
                <span>Apply Standard Nigeria Rates</span>
              </button>
            </div>

            {/* Add Rate Form */}
            <form
              onSubmit={handleAddDeliveryRate}
              className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Add Custom State Rate
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
                    Covered Areas (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Island, Mainland, Ikeja"
                    value={newRateAreas}
                    onChange={(e) => setNewRateAreas(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateSettings.isPending}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                <Plus size={13} />
                <span>Save Rate for {newRateState}</span>
              </button>
            </form>

            {/* Active Delivery Rates List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Configured Delivery Rates ({deliveryRates.length})
              </h4>

              {deliveryRates.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <p className="text-xs text-stone-500">
                    No delivery rates configured yet. Shoppers will see "Calculated at confirmation".
                  </p>
                  <button
                    type="button"
                    onClick={handleApplyDefaultRates}
                    className="text-xs font-bold text-amber-800 hover:underline inline-block pt-1"
                  >
                    Click here to apply standard Nigerian rates in 1 click
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {deliveryRates.map((rate) => (
                    <div
                      key={rate.state}
                      className="p-3 sm:px-4 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-950 mr-2">{rate.state}</span>
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
                        aria-label="Remove rate"
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
                Notice Bar & Promo Discounts
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Broadcast announcements across the top of your store and create coupon codes for holiday campaigns.
              </p>
            </div>

            {/* Top Announcement Notice Bar */}
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Storefront Top Notice Bar
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Runs as a ribbon banner across the top of your boutique.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearanceForm.announcementActive}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        announcementActive: e.target.checked,
                      })
                    }
                    className="rounded border-stone-300 text-stone-900"
                  />
                  <span>Show Notice Bar</span>
                </label>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Free Lagos Delivery this weekend with code LAGOSFREE"
                  value={appearanceForm.announcementText}
                  onChange={(e) =>
                    setAppearanceForm({
                      ...appearanceForm,
                      announcementText: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateSettings.mutate({
                      announcementText: appearanceForm.announcementText,
                      announcementActive: appearanceForm.announcementActive,
                    })
                  }
                  disabled={updateSettings.isPending}
                  className="py-2 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
                >
                  Save Notice
                </button>
              </div>
            </div>

            {/* Create Promo Code Form */}
            <form
              onSubmit={handleCreatePromoCode}
              className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Generate New Promo Code
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER10"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
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
                    placeholder={newPromoType === "percentage" ? "10" : "5000"}
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Min Spend (₦)
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
                    className="rounded border-stone-300 text-stone-900"
                  />
                  <span>Broadcast promo code in Top Notice Bar</span>
                </label>

                <button
                  type="submit"
                  disabled={createDiscountMutation.isPending || !newPromoCode.trim()}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Plus size={13} />
                  <span>Create Coupon</span>
                </button>
              </div>
            </form>

            {/* List Active Promo Codes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Active Campaigns ({discounts.length})
              </h4>

              {discounts.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No promotional discounts created yet.</p>
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
                              (Min: ₦{discount.minOrderAmount.toLocaleString("en-NG")})
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
                          onClick={() => deleteDiscountMutation.mutate(discount._id || discount.code)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                          aria-label="Delete coupon"
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
