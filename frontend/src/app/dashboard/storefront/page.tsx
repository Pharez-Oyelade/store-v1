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
  Link2,
  Unlink,
  RefreshCw,
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
  useVerifyCustomDomain,
  useRemoveCustomDomain,
} from "@/hooks/useVendorProfile";
import { useProducts } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import { hasMinPlan, getPlanDisplayName } from "@/lib/subscriptionGating";
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
  {
    state: "Lagos",
    fee: 2500,
    areas: ["Mainland", "Island", "Ikeja", "Lekki"],
  },
  {
    state: "Abuja (FCT)",
    fee: 4500,
    areas: ["Central Area", "Maitama", "Garki", "Wuse"],
  },
  { state: "Rivers", fee: 4500, areas: ["Port Harcourt", "Obio-Akpor"] },
  { state: "Oyo", fee: 3500, areas: ["Ibadan Central", "Bodija", "Oluyole"] },
  {
    state: "Interstate Express",
    fee: 6000,
    areas: ["All other states nationwide"],
  },
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

  const verifyDomainMutation = useVerifyCustomDomain();
  const removeDomainMutation = useRemoveCustomDomain();

  const [activeTab, setActiveTab] = useState<
    "overview" | "appearance" | "domains" | "delivery" | "campaigns"
  >("overview");
  const [domainInput, setDomainInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Appearance Form State
  const [appearanceForm, setAppearanceForm] = useState({
    themeColor: "#141210",
    accentColor: "#C88A2C",
    bannerHeadline: "",
    bannerText: "",
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
        themeColor: vendorProfile.storefrontSettings?.themeColor || "#141210",
        accentColor: vendorProfile.storefrontSettings?.accentColor || "#C88A2C",
        bannerHeadline: vendorProfile.storefrontSettings?.bannerHeadline || "",
        bannerText: vendorProfile.storefrontSettings?.bannerText || "",
        announcementText:
          vendorProfile.storefrontSettings?.announcementText || "",
        announcementActive:
          vendorProfile.storefrontSettings?.announcementActive !== false,
        whatsappFabEnabled:
          vendorProfile.storefrontSettings?.whatsappFabEnabled !== false,
        businessType: vendorProfile.businessType || "unselected",
        category: vendorProfile.category || "fashion",
      });
      setDeliveryRates(vendorProfile.storefrontSettings?.deliveryRates || []);
      setDomainInput(vendorProfile.storefrontSettings?.customDomain || "");
    }
  }, [vendorProfile]);

  const handle = vendorProfile?.handle || authVendor?.handle || "";
  const businessName =
    vendorProfile?.businessName || authVendor?.businessName || "Your Boutique";
  const plan = vendorProfile?.subscriptionPlan || "free";
  const isDrapePlus = hasMinPlan(plan, "drape");
  const isAtelierPlus = hasMinPlan(plan, "atelier");

  const publicStoreUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${handle}`
      : `https://tryvendra.ng/store/${handle}`;

  const previewStoreUrl = `${publicStoreUrl}?preview=true`;

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname.includes("localhost");

  const subdomainUrl = isLocalhost
    ? `http://${handle}.localhost:3000`
    : `https://${handle}.vendra.ng`;

  const customDomain = vendorProfile?.storefrontSettings?.customDomain || "";
  const customDomainStatus =
    vendorProfile?.storefrontSettings?.customDomainStatus || "none";
  const customDomainVerifiedAt =
    vendorProfile?.storefrontSettings?.customDomainVerifiedAt;
  const customDomainError =
    vendorProfile?.storefrontSettings?.customDomainError;

  const customDomainUrl = customDomain ? `https://${customDomain}` : "";

  const primaryBrandUrl =
    customDomain && customDomainStatus === "active"
      ? customDomainUrl
      : isDrapePlus
        ? subdomainUrl
        : publicStoreUrl;

  const handleSaveCustomDomain = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainInput.trim()) {
      updateSettings.mutate({ customDomain: "" });
      return;
    }
    updateSettings.mutate({
      customDomain: domainInput.trim(),
    });
  };

  const bio = vendorProfile?.bio;
  const logoUrl = vendorProfile?.logo?.url;
  const bannerUrl = vendorProfile?.storefrontSettings?.bannerImage?.url;
  const isPublished = Boolean(vendorProfile?.storefrontSettings?.isPublished);

  // Compute launch readiness checklist
  const isTypeSelected = appearanceForm.businessType !== "unselected";
  const isDemandModel = appearanceForm.businessType === "demand";
  const hasMinCatalog = isDemandModel ? true : activeProducts.length >= 2;
  const hasContact = Boolean(
    vendorProfile?.socials?.whatsapp || vendorProfile?.phone,
  );
  const hasDeliveryRates = deliveryRates.length > 0;

  const isEligibleToPublish = isTypeSelected && hasMinCatalog && hasContact;

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
        toast.error(
          `You need at least 2 active products in your catalog (currently ${activeProducts.length}/2).`,
        );
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

  const handleSelectPalette = (palette: (typeof FASHION_PALETTES)[0]) => {
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
      bannerHeadline: appearanceForm.bannerHeadline,
      bannerText: appearanceForm.bannerText,
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
                {copied ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied" : "Copy Link"}
              </button>

              <Link
                href={previewStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-2xs transition-all"
              >
                <Eye size={14} className="text-white" />
                <span className="text-white">Preview Store</span>
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
                  {/* <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> */}
                  Live to Public
                </span>
              ) : isEligibleToPublish ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {/* <Sparkles size={13} className="text-blue-400" /> */}
                  Ready to Publish
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {/* <ShieldAlert size={13} className="text-amber-400" /> */}
                  Inactive / Setup Required
                </span>
              )}

              <span className="text-xs text-stone-400 font-medium">
                Tier:{" "}
                <strong className="text-amber-400 font-bold uppercase">
                  {plan}
                </strong>{" "}
                ({isDrapePlus ? "Multi-Page" : "Single-Page"})
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
                disabled={
                  updateSettings.isPending ||
                  (!isPublished && !isEligibleToPublish)
                }
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
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {primaryBrandUrl}
              </span>
              {customDomain && customDomainStatus === "active" ? (
                <span className="text-[9px] font-sans font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Custom Domain
                </span>
              ) : isDrapePlus ? (
                <span className="text-[9px] font-sans font-bold uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                  Subdomain
                </span>
              ) : null}
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
                Complete these quick prerequisites to activate your public
                boutique link.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
              {
                [
                  isTypeSelected,
                  hasMinCatalog,
                  hasContact,
                  hasDeliveryRates,
                ].filter(Boolean).length
              }{" "}
              / 4 Done
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Step 1: Business Type */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Step 1
                </span>
                {isTypeSelected ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">
                Business Model
              </h4>
              <p className="text-[11px] text-stone-500">
                {isTypeSelected
                  ? appearanceForm.businessType.replace(/_/g, " ")
                  : "Select RTW, Demand, or Hybrid"}
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
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Step 2
                </span>
                {hasMinCatalog ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">
                Catalog Readiness
              </h4>
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
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Step 3
                </span>
                {hasContact ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">
                WhatsApp / Phone
              </h4>
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
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Step 4
                </span>
                {hasDeliveryRates ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <h4 className="font-bold text-xs text-gray-950">
                Delivery Rates
              </h4>
              <p className="text-[11px] text-stone-500">
                {hasDeliveryRates
                  ? `${deliveryRates.length} states configured`
                  : "No rates set"}
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
          onClick={() => setActiveTab("domains")}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === "domains"
              ? "border-b-2 border-stone-950 text-stone-950 font-bold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <span>Store Links & Domains</span>
          {customDomain && customDomainStatus === "active" ? (
            <span className="size-2 rounded-full bg-emerald-500" />
          ) : isDrapePlus ? (
            <span className="size-2 rounded-full bg-amber-500" />
          ) : null}
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
                This dictates your public storefront experience: shopping cart,
                lookbook, bespoke measurement forms, or both.
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
                  <h4 className="font-bold text-sm text-gray-950">
                    Ready-to-Wear (RTW)
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    E-commerce catalog with sizes, colors, and live inventory.
                    Shoppers add pieces to cart and checkout instantly.
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
                  <h4 className="font-bold text-sm text-gray-950">
                    Bespoke Tailor (Demand)
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Made-to-measure tailoring. Showcase your signature style
                    lookbook and receive custom measurement requests.
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
                  <h4 className="font-bold text-sm text-gray-950">
                    Hybrid House
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    The complete fashion house: sells stocked ready-to-wear
                    pieces AND takes bespoke tailored requests.
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
                  Visual snapshot of your store's current palette, logo, and
                  banner.
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
                  {appearanceForm.bannerHeadline && (
                    <span className="text-[9px] font-bold tracking-widest uppercase text-amber-300 block">
                      {appearanceForm.bannerHeadline}
                    </span>
                  )}
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
                  <h4 className="font-serif font-bold text-lg">
                    {businessName}
                  </h4>
                  <p className="text-[11px] text-white/80 line-clamp-2 max-w-xs mx-auto">
                    {appearanceForm.bannerText ||
                      bio ||
                      "Your curated fashion collections and bespoke tailoring."}
                  </p>
                  <span
                    className="inline-block py-1 px-3 rounded-full text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: appearanceForm.accentColor }}
                  >
                    {appearanceForm.businessType
                      .replace(/_/g, " ")
                      .toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Simulated Content Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>
                    {isDemandModel ? "Signature Styles" : "Collection Pieces"}
                  </span>
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
                  Hand-crafted color pairings tailored for luxury Nigerian
                  boutiques and ateliers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {FASHION_PALETTES.map((pal) => {
                  const isSelected =
                    appearanceForm.themeColor.toLowerCase() ===
                    pal.theme.toLowerCase();
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
                    Fine-tune exact brand hex colors for background and action
                    buttons.
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
                        setAppearanceForm({
                          ...appearanceForm,
                          themeColor: e.target.value,
                        })
                      }
                      className="size-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 disabled:opacity-50"
                    />
                    <input
                      type="text"
                      disabled={!isDrapePlus}
                      value={appearanceForm.themeColor}
                      onChange={(e) =>
                        setAppearanceForm({
                          ...appearanceForm,
                          themeColor: e.target.value,
                        })
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
                        setAppearanceForm({
                          ...appearanceForm,
                          accentColor: e.target.value,
                        })
                      }
                      className="size-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 disabled:opacity-50"
                    />
                    <input
                      type="text"
                      disabled={!isDrapePlus}
                      value={appearanceForm.accentColor}
                      onChange={(e) =>
                        setAppearanceForm({
                          ...appearanceForm,
                          accentColor: e.target.value,
                        })
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

            {/* Custom Banner Text */}
            <div className="pt-6 border-t border-stone-100 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Custom Banner Text & Editorial Tagline
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Customize the eyebrow headline and promotional tagline that
                  appear on your storefront's hero banner.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Banner Eyebrow / Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Atelier Collection, Harmattan '25, Bespoke Haute Couture"
                    value={appearanceForm.bannerHeadline}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        bannerHeadline: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Displays in stylized tracking above your boutique name.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Banner Promotional Text / Subheading
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Handcrafted bespoke luxury tailored to your exact silhouette. Available for Lagos delivery and nationwide express."
                    value={appearanceForm.bannerText}
                    onChange={(e) =>
                      setAppearanceForm({
                        ...appearanceForm,
                        bannerText: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors resize-none"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Overrides your general boutique bio on the main hero banner
                    if provided.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Floating Button */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  WhatsApp Floating Chat Button (FAB)
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Display a quick chat button at the bottom right corner of your
                  storefront.
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

      {/* ── TAB: STORE LINKS & DOMAINS ───────────────────────── */}
      {activeTab === "domains" && (
        <div className="space-y-8">
          {/* Header & Intro */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-950 flex items-center gap-2">
                  <Globe size={20} className="text-amber-700" />
                  Store Links & Domain Architecture
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Connect and manage your public storefront addresses. Vendra automatically routes shoppers to your boutique across all active links.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200 shrink-0">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Active Tier:
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full capitalize">
                  {getPlanDisplayName(plan)}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Link Cards */}
          <div className="space-y-6">
            {/* ── LEVEL 1: Standard Vendra Storefront Link ───────── */}
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
                    <Store size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                      Standard Store Link
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Universal (All Tiers)
                      </span>
                    </h4>
                    <p className="text-xs text-stone-500">
                      Your default web address accessible to shoppers worldwide.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(publicStoreUrl);
                      toast.success("Standard store link copied!");
                    }}
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                  <a
                    href={publicStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Visit</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-stone-800 bg-stone-50 px-3.5 py-2.5 rounded-xl border border-stone-200 break-all">
                <Link2 size={14} className="text-stone-400 shrink-0" />
                <span>{publicStoreUrl}</span>
              </div>
            </div>

            {/* ── LEVEL 2: Branded Subdomain Link (The Drape+) ──── */}
            <div className={`rounded-3xl border p-6 sm:p-8 shadow-xs space-y-4 transition-all ${
              isDrapePlus
                ? "bg-white border-stone-200/90"
                : "bg-stone-50/70 border-stone-200 opacity-90"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center font-bold ${
                    isDrapePlus ? "bg-amber-100 text-amber-900" : "bg-stone-200 text-stone-600"
                  }`}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                      Branded Subdomain
                      {isDrapePlus ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200/80">
                          Active & Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-stone-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} />
                          Unlocked on The Drape+
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-stone-500">
                      A sleek, memorable address with zero path prefixes (e.g. <strong className="text-stone-700">{handle}.vendra.ng</strong>).
                    </p>
                  </div>
                </div>

                {isDrapePlus ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(subdomainUrl);
                        toast.success("Branded subdomain copied!");
                      }}
                      className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors"
                    >
                      <Copy size={13} />
                      <span>Copy</span>
                    </button>
                    <a
                      href={subdomainUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-xs font-semibold text-white transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Visit</span>
                    </a>
                  </div>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
                  >
                    <span>Upgrade to The Drape</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-stone-800 bg-stone-50 px-3.5 py-2.5 rounded-xl border border-stone-200 break-all">
                <Globe size={14} className="text-amber-700 shrink-0" />
                <span className="font-bold text-gray-950">{subdomainUrl}</span>
              </div>

              {!isDrapePlus && (
                <p className="text-[11px] text-stone-500">
                  Upgrade your atelier plan to eliminate the <code className="bg-stone-200/70 px-1 py-0.5 rounded text-stone-800 font-mono">/store/</code> prefix and give your brand a standalone flagship presence on Vendra.
                </p>
              )}
            </div>

            {/* ── LEVEL 3: White-Label Custom Domain (Atelier / Maison) ─ */}
            <div className={`rounded-3xl border p-6 sm:p-8 shadow-xs space-y-6 transition-all ${
              isAtelierPlus
                ? "bg-white border-stone-200/90"
                : "bg-stone-50/70 border-stone-200 opacity-90"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center font-bold ${
                    isAtelierPlus ? "bg-stone-950 text-white" : "bg-stone-200 text-stone-600"
                  }`}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                      Custom Domain Connection
                      {isAtelierPlus ? (
                        customDomainStatus === "active" ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            Active & SSL Verified
                          </span>
                        ) : customDomain ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            Pending DNS
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                            Available on Your Plan
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-stone-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} />
                          The Atelier & The Maison
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-stone-500">
                      Connect your own custom domain (e.g. <strong className="text-stone-700">shop.yourbrand.com</strong> or <strong className="text-stone-700">yourbrand.ng</strong>) with automated SSL.
                    </p>
                  </div>
                </div>

                {!isAtelierPlus && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gray-950 hover:bg-stone-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
                  >
                    <span>Upgrade to The Atelier</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>

              {isAtelierPlus ? (
                <div className="space-y-6">
                  {/* Connect / Update Domain Form */}
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                      {customDomain ? "Connected Custom Domain" : "Connect New Domain"}
                    </h5>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400">
                          https://
                        </span>
                        <input
                          type="text"
                          placeholder="shop.yourboutique.com or yourboutique.ng"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value.toLowerCase().trim())}
                          className="w-full pl-20 pr-4 py-2.5 border border-stone-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:border-stone-900 transition-colors"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleSaveCustomDomain}
                          isLoading={updateSettings.isPending}
                        >
                          {customDomain ? "Update Domain" : "Connect Domain"}
                        </Button>

                        {customDomain && (
                          <button
                            type="button"
                            onClick={() => removeDomainMutation.mutate()}
                            disabled={removeDomainMutation.isPending}
                            className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-stone-200 transition-colors"
                            title="Disconnect Domain"
                          >
                            <Unlink size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {customDomainError && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{customDomainError}</span>
                      </p>
                    )}
                  </div>

                  {/* DNS Instructions & Verification */}
                  {customDomain && (
                    <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <h5 className="font-serif font-bold text-sm text-gray-950 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-amber-700" />
                            Required DNS Configuration
                          </h5>
                          <p className="text-xs text-stone-600">
                            Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, WhoGoHost) and add this record:
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => verifyDomainMutation.mutate()}
                          isLoading={verifyDomainMutation.isPending}
                        >
                          <RefreshCw size={13} className="mr-1.5" />
                          Verify DNS Now
                        </Button>
                      </div>

                      <div className="overflow-x-auto bg-white rounded-xl border border-stone-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                            <tr>
                              <th className="py-2.5 px-4">Type</th>
                              <th className="py-2.5 px-4">Host / Name</th>
                              <th className="py-2.5 px-4">Value / Points To</th>
                              <th className="py-2.5 px-4">TTL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-mono text-stone-800">
                            <tr>
                              <td className="py-2.5 px-4 font-bold text-amber-900">CNAME</td>
                              <td className="py-2.5 px-4 font-bold">
                                {customDomain.split(".").length > 2
                                  ? customDomain.split(".")[0]
                                  : "www"}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-amber-900">
                                cname.tryvendra.ng
                              </td>
                              <td className="py-2.5 px-4 text-stone-500 font-sans">Automatic / 3600</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {customDomainStatus === "active" && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-800 font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            DNS is fully propagated and verified with automated SSL.
                          </span>
                          <a
                            href={`https://${customDomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline ml-2"
                          >
                            Open {customDomain} &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs text-stone-500">
                  <p>
                    Connect your own apex or subdomain (like <strong className="text-stone-700">shop.aminacouture.com</strong> or <strong className="text-stone-700">aminacouture.ng</strong>) with automated SSL certificates, zero Vendra branding, and high-performance CDN routing.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/pricing"
                      className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Explore The Atelier Plan Features</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
                  Configure delivery rates for Nigerian states. These populate
                  your 2-step checkout automatically.
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
                    No delivery rates configured yet. Shoppers will see
                    "Calculated at confirmation".
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
                Broadcast announcements across the top of your store and create
                coupon codes for holiday campaigns.
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

              <div className="flex gap-3 flex-wrap">
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
                  className="py-2 px-4 w-full sm:w-auto rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
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
                  disabled={
                    createDiscountMutation.isPending || !newPromoCode.trim()
                  }
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
