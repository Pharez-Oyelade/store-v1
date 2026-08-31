"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  UploadCloud,
  X,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Ruler,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/custom/Button";
import { apiPost } from "@/lib/api";
import toast from "react-hot-toast";

export default function StorefrontBespokeRequestPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const unwrapped = use(params);
  const handle = unwrapped.handle;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("clothing");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Optional measurements
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState({
    Bust: "",
    Waist: "",
    Hips: "",
    Shoulder: "",
    "Sleeve Length": "",
    "Full Length": "",
  });

  // Reference images
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 5) {
      toast.error("Maximum 5 reference photos allowed");
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [
      ...prev,
      ...selected.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !title) {
      toast.error("Please fill in your name, phone number, and style request");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("customerName", customerName);
      formData.append("customerPhone", customerPhone);
      if (customerEmail) formData.append("customerEmail", customerEmail);
      formData.append("title", title);
      formData.append("category", category);
      if (description) formData.append("description", description);
      if (notes) formData.append("notes", notes);

      // Clean measurements
      const filledMeasurements: Record<string, string> = {};
      Object.entries(measurements).forEach(([k, v]) => {
        if (v.trim()) filledMeasurements[k] = v.trim();
      });
      formData.append("measurements", JSON.stringify(filledMeasurements));

      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await apiPost<{ requestId: string; whatsappLink: string }>(
        `/storefront/${handle}/custom-requests`,
        formData
      );

      setWhatsappLink(res.whatsappLink || "");
      setSubmitted(true);
      toast.success("Your bespoke request has been submitted!");

      if (res.whatsappLink) {
        setTimeout(() => {
          window.location.href = res.whatsappLink;
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Link
        href={`/store/${handle}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 sm:mb-6"
      >
        <ArrowLeft size={16} />
        Back to Storefront
      </Link>

      {submitted ? (
        <div className="bg-white p-6 sm:p-12 rounded-2xl border border-gray-100 shadow-sm text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Request Received!
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            The designer has received your custom inquiry. You are being redirected to WhatsApp to confirm fabric details and measurements.
          </p>

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm transition-colors mb-3 shadow-sm"
            >
              <MessageCircle size={18} />
              Open in WhatsApp Now
            </a>
          )}

          <Link
            href={`/store/${handle}`}
            className="block text-xs text-gray-500 hover:text-gray-700 pt-2"
          >
            Return to Store
          </Link>
        </div>
      ) : (
        <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm space-y-6 sm:space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Scissors size={14} />
              Made to Order / Bespoke
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
              Request a Custom Outfit
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Have a specific style in mind? Share your inspiration photos, measurements, and details with the designer.
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                1. Your Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  type="text"
                  placeholder="e.g. Funke Akindele"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  label="WhatsApp / Phone Number"
                  type="tel"
                  placeholder="e.g. 08012345678"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Email Address (Optional)"
                    type="email"
                    placeholder="funke@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Design Request */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                2. Outfit / Style Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Style Title / What would you like made?"
                    type="text"
                    placeholder="e.g. Emerald Corset Gown with Beaded Sleeves"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand-700 focus:outline-none"
                  >
                    <option value="clothing">Clothing / Traditional</option>
                    <option value="accessories">Accessories</option>
                    <option value="alteration">Alteration / Adjustment</option>
                    <option value="repair">Repair</option>
                    <option value="other">Other Bespoke</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Design Specifications & Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the neckline, preferred fabric (e.g. Silk, Ankara, Velvet), event date, and any special requests."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-700 focus:outline-none"
                />
              </div>

              {/* Photos upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference & Inspiration Photos (Up to 5)
                </label>
                <div className="flex flex-wrap gap-3">
                  {previews.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group"
                    >
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {files.length < 5 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-700 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-brand-50/50 transition-colors">
                      <UploadCloud size={18} className="text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-500 mt-1">
                        Add Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Body Measurements Toggle */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Ruler size={16} className="text-brand-700" />
                    3. Body Measurements (Optional)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    If you know your measurements, enter them now. Otherwise the designer will follow up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMeasurements(!showMeasurements)}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  {showMeasurements ? "Hide Measurements" : "+ Add Measurements"}
                </button>
              </div>

              {showMeasurements && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in duration-150">
                  {Object.keys(measurements).map((key) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        placeholder='e.g. 36"'
                        value={(measurements as any)[key]}
                        onChange={(e) =>
                          setMeasurements({
                            ...measurements,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-brand-700 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="large"
                isLoading={loading}
                className="w-full justify-center"
              >
                <MessageCircle size={18} className="mr-2" />
                Submit Request & Connect via WhatsApp
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                Your request details will be sent directly to the vendor&apos;s dashboard and WhatsApp.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
