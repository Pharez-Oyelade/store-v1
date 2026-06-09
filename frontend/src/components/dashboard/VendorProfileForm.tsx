"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { Save } from "lucide-react";
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
    });
  }, [profile.data]);

  function update<K extends keyof typeof form>(key: K, value: string) {
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
