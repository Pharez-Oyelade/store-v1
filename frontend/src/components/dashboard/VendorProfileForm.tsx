"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { Save, Package, Scissors, Sparkles, Check } from "lucide-react";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import { FieldLabel, TextArea } from "@/components/dashboard/DashboardPrimitives";
import { useUpdateVendorProfile, useVendorProfile } from "@/hooks/useVendorProfile";

export default function VendorProfileForm({ compact = false }: { compact?: boolean }) {
  const profile = useVendorProfile();
  const updateProfile = useUpdateVendorProfile();
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    bio: "",
    state: "",
    city: "",
    area: "",
    instagram: "",
    whatsapp: "",
    businessType: "ready_to_wear" as "ready_to_wear" | "demand" | "hybrid" | "made_to_order" | "unselected",
  });

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      businessName: profile.data.businessName,
      email: profile.data.email ?? "",
      bio: profile.data.bio ?? "",
      state: profile.data.location?.state ?? "",
      city: profile.data.location?.city ?? "",
      area: profile.data.location?.area ?? "",
      instagram: profile.data.socials?.instagram ?? "",
      whatsapp: profile.data.socials?.whatsapp ?? "",
      businessType:
        profile.data.businessType && profile.data.businessType !== "unselected"
          ? profile.data.businessType
          : "ready_to_wear",
    });
  }, [profile.data]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateProfile.mutateAsync(form);
  }

  if (profile.isLoading) return <p className="text-sm text-gray-500">Loading profile...</p>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Business name" value={form.businessName} onChange={(event) => update("businessName", event.target.value)} required />
        <Input label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
      </div>

      {/* Business Type Selector */}
      <div className="space-y-2">
        <FieldLabel>Business Type</FieldLabel>
        <p className="text-xs text-gray-500">
          Dictates your primary dashboard navigation, quick action order, and public storefront mode.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* RTW */}
          <button
            type="button"
            onClick={() => update("businessType", "ready_to_wear")}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              form.businessType === "ready_to_wear"
                ? "border-brand-600 bg-brand-50/70 text-brand-950 shadow-xs ring-1 ring-brand-600/30"
                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span
                className={`p-1.5 rounded-lg ${
                  form.businessType === "ready_to_wear"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Package size={16} />
              </span>
              {form.businessType === "ready_to_wear" && (
                <span className="size-4 rounded-full bg-brand-600 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">RTW / Made-to-order</p>
              <p className="text-[11px] text-gray-500 mt-0.5">E-commerce catalog & cart</p>
            </div>
          </button>

          {/* Bespoke */}
          <button
            type="button"
            onClick={() => update("businessType", "demand")}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              form.businessType === "demand"
                ? "border-brand-600 bg-brand-50/70 text-brand-950 shadow-xs ring-1 ring-brand-600/30"
                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span
                className={`p-1.5 rounded-lg ${
                  form.businessType === "demand"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Scissors size={16} />
              </span>
              {form.businessType === "demand" && (
                <span className="size-4 rounded-full bg-brand-600 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Bespoke Tailoring</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Custom requests & measurements</p>
            </div>
          </button>

          {/* Hybrid */}
          <button
            type="button"
            onClick={() => update("businessType", "hybrid")}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              form.businessType === "hybrid"
                ? "border-brand-600 bg-brand-50/70 text-brand-950 shadow-xs ring-1 ring-brand-600/30"
                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span
                className={`p-1.5 rounded-lg ${
                  form.businessType === "hybrid"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Sparkles size={16} />
              </span>
              {form.businessType === "hybrid" && (
                <span className="size-4 rounded-full bg-brand-600 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Hybrid House</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Catalog pieces + custom tailoring</p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Bio</FieldLabel>
        <TextArea value={form.bio} onChange={(event) => update("bio", event.target.value)} />
      </div>
      {!compact && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="State" value={form.state} onChange={(event) => update("state", event.target.value)} />
          <Input label="City" value={form.city} onChange={(event) => update("city", event.target.value)} />
          <Input label="Area" value={form.area} onChange={(event) => update("area", event.target.value)} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Instagram" value={form.instagram} onChange={(event) => update("instagram", event.target.value)} />
        <Input label="WhatsApp" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} />
      </div>
      <Button type="submit" isLoading={updateProfile.isPending} leftIcon={<Save className="size-4" />}>
        Save profile
      </Button>
    </form>
  );
}
