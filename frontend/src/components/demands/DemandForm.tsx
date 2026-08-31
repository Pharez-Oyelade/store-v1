"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UploadCloud,
  X,
  Sparkles,
  User,
  Users,
  UserPlus,
  CheckCircle2,
  Scissors,
  DollarSign,
  Calendar,
  Layers,
  Ruler,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/custom/Button";
import MeasurementsEditor from "./MeasurementsEditor";
import MaterialsBuilder from "./MaterialsBuilder";
import { useCreateCustomRequest, useUpdateCustomRequest } from "@/hooks/useCustomRequests";
import { useCustomers } from "@/hooks/useCustomers";
import type { CustomRequest, CustomRequestMaterial } from "@/types";
import toast from "react-hot-toast";

const demandSchema = z.object({
  title: z.string().min(2, "Title is required (e.g. Agbada Set in Navy Aso-Oke)"),
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().min(7, "Customer phone is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  category: z.enum(["clothing", "accessories", "alteration", "repair", "other"]),
  description: z.string().optional(),
  estimatedPrice: z.coerce.number().min(0).default(0),
  agreedPrice: z.coerce.number().min(0).default(0),
  depositPaid: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
  source: z.enum(["dm", "call", "walk_in", "storefront", "referral"]).default("dm"),
  notes: z.string().optional(),
});

type DemandFormSchema = z.infer<typeof demandSchema>;

interface DemandFormProps {
  initialData?: CustomRequest;
}

export default function DemandForm({ initialData }: DemandFormProps) {
  const router = useRouter();
  const createMutation = useCreateCustomRequest();
  const updateMutation = useUpdateCustomRequest(initialData?._id || "");
  const customersQuery = useCustomers({ page: 1, limit: 200 });
  const customerList = customersQuery.data?.customers || [];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    (typeof initialData?.customer === "object"
      ? (initialData?.customer as any)?._id
      : initialData?.customer) || ""
  );
  const [autoFilledInfo, setAutoFilledInfo] = useState<{
    name: string;
    measurementsCount: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"details" | "measurements" | "materials" | "pricing">("details");

  // Controlled state for custom editors
  const [measurements, setMeasurements] = useState<Record<string, string>>(
    initialData?.measurements || {}
  );
  const [materials, setMaterials] = useState<CustomRequestMaterial[]>(
    initialData?.materials || []
  );

  // Reference images
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState(
    initialData?.referenceImages || []
  );
  const [removeImageIds, setRemoveImageIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DemandFormSchema>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      title: initialData?.title || "",
      customerName: initialData?.customerSnapshot?.name || "",
      customerPhone: initialData?.customerSnapshot?.phone || "",
      customerEmail: initialData?.customerSnapshot?.email || "",
      category: initialData?.category || "clothing",
      description: initialData?.description || "",
      estimatedPrice: initialData?.estimatedPrice || 0,
      agreedPrice: initialData?.agreedPrice || 0,
      depositPaid: initialData?.depositPaid || 0,
      deadline: initialData?.deadline
        ? new Date(initialData.deadline).toISOString().split("T")[0]
        : "",
      source: (initialData?.source as any) || "dm",
      notes: initialData?.notes || "",
    },
  });

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId === "") {
      setValue("customerName", "");
      setValue("customerPhone", "");
      setValue("customerEmail", "");
      setAutoFilledInfo(null);
      return;
    }

    const found = customerList.find((c) => c._id === customerId);
    if (found) {
      setValue("customerName", found.name, { shouldValidate: true });
      setValue("customerPhone", found.phone, { shouldValidate: true });
      setValue("customerEmail", found.email || "");

      let count = 0;
      if (found.measurements && typeof found.measurements === "object" && Object.keys(found.measurements).length > 0) {
        setMeasurements((prev) => ({
          ...found.measurements,
          ...prev,
        }));
        count = Object.keys(found.measurements).length;
      }

      setAutoFilledInfo({
        name: found.name,
        measurementsCount: count,
      });

      toast.success(
        `Auto-filled ${found.name}'s details${count > 0 ? ` & ${count} saved measurements` : ""}`
      );
    }
  };


  const estimatedPriceWatch = watch("estimatedPrice");
  const agreedPriceWatch = watch("agreedPrice");
  const depositPaidWatch = watch("depositPaid");

  const calculatedBalance = Math.max(
    0,
    (Number(agreedPriceWatch) > 0 ? Number(agreedPriceWatch) : Number(estimatedPriceWatch)) -
      (Number(depositPaidWatch) || 0)
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const oversized = files.filter((f) => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error("One or more images exceed the 15MB limit. Please choose smaller files.");
      return;
    }

    const totalCount = existingImages.length + selectedFiles.length + files.length;
    if (totalCount > 5) {
      toast.error("Maximum 5 reference images allowed");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };


  const handleRemoveNewImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (publicId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
    setRemoveImageIds((prev) => [...prev, publicId]);
  };

  const onSubmit = async (data: DemandFormSchema) => {
    const formData = new FormData();
    if (selectedCustomerId) {
      formData.append("customerId", selectedCustomerId);
    }
    formData.append("title", data.title);
    formData.append("customerName", data.customerName);
    formData.append("customerPhone", data.customerPhone);
    if (data.customerEmail) formData.append("customerEmail", data.customerEmail);
    formData.append("category", data.category);
    if (data.description) formData.append("description", data.description);
    formData.append("estimatedPrice", String(data.estimatedPrice));
    formData.append("agreedPrice", String(data.agreedPrice));
    formData.append("depositPaid", String(data.depositPaid));
    if (data.deadline) formData.append("deadline", data.deadline);
    formData.append("source", data.source);
    if (data.notes) formData.append("notes", data.notes);

    // JSON encoded objects
    formData.append("measurements", JSON.stringify(measurements));
    formData.append("materials", JSON.stringify(materials));

    // Images
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    if (removeImageIds.length > 0) {
      formData.append("removeImageIds", JSON.stringify(removeImageIds));
    }

    if (initialData) {
      updateMutation.mutate(formData, {
        onSuccess: () => {
          router.push(`/dashboard/demands/${initialData._id}`);
        },
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: (created: any) => {
          router.push(`/dashboard/demands/${created._id || ""}`);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-1 sm:gap-2 pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "details"
              ? "border-brand-700 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Scissors size={15} />
          1. Design & Customer
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("measurements")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "measurements"
              ? "border-brand-700 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Ruler size={16} />
          2. Measurements ({Object.keys(measurements).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "materials"
              ? "border-brand-700 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Layers size={16} />
          3. Fabrics & Materials ({materials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "pricing"
              ? "border-brand-700 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <DollarSign size={16} />
          4. Pricing & Deadline
        </button>
      </div>

      {/* TAB 1: DETAILS & CUSTOMER */}
      {activeTab === "details" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Customer Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-brand-700" />
                Customer Information
              </h3>
              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={() => handleCustomerSelect("")}
                  className="text-xs text-brand-700 hover:underline font-semibold"
                >
                  Clear / New Customer
                </button>
              )}
            </div>

            {/* Customer Dropdown Selection */}
            {!initialData && (
              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50/80 border border-gray-200">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Select Existing Customer or Create New
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {selectedCustomerId ? (
                      <Users className="size-4 text-brand-700" />
                    ) : (
                      <UserPlus className="size-4 text-gray-400" />
                    )}
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm bg-white focus:border-brand-700 focus:outline-none shadow-xs"
                  >
                    <option value="">＋ Create New Customer (Enter details below)</option>
                    {customerList.length > 0 && (
                      <optgroup label="Existing Customers">
                        {customerList.map((c) => {
                          const measCount =
                            c.measurements && typeof c.measurements === "object"
                              ? Object.keys(c.measurements).length
                              : 0;
                          return (
                            <option key={c._id} value={c._id}>
                              {c.name} — {c.phone} {measCount > 0 ? `(${measCount} measurements saved)` : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </div>

                {autoFilledInfo && (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg font-medium border border-emerald-200 mt-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>
                      Loaded <strong>{autoFilledInfo.name}</strong>.
                      {autoFilledInfo.measurementsCount > 0
                        ? ` Synced ${autoFilledInfo.measurementsCount} saved body measurements to Tab 2.`
                        : " Ready to record custom measurements."}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Full Name"
                type="text"
                placeholder="e.g. Chioma Rowland"
                error={errors.customerName?.message}
                {...register("customerName")}
              />
              <Input
                label="WhatsApp / Phone Number"
                type="tel"
                placeholder="e.g. 08012345678"
                error={errors.customerPhone?.message}
                {...register("customerPhone")}
              />
              <Input
                label="Email (Optional)"
                type="email"
                placeholder="chioma@example.com"
                error={errors.customerEmail?.message}
                {...register("customerEmail")}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Demand Channel / Source
                </label>
                <select
                  {...register("source")}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand-700 focus:outline-none"
                >
                  <option value="dm">Instagram / Social DM</option>
                  <option value="call">Phone Call / WhatsApp</option>
                  <option value="walk_in">Walk-in Client</option>
                  <option value="storefront">Online Storefront</option>
                  <option value="referral">Word of Mouth Referral</option>
                </select>
              </div>
            </div>
          </div>


          {/* Design Brief Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Scissors size={18} className="text-brand-700" />
              Design Brief & Style Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Outfit Title / Style Name"
                  type="text"
                  placeholder="e.g. 3-Piece Navy Senator with Gold Embroidery"
                  error={errors.title?.message}
                  {...register("title")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  {...register("category")}
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
                Detailed Design Notes & Customer Requests
              </label>
              <textarea
                rows={4}
                placeholder="Include specific instructions on collars, cuffs, embroidery patterns, lining, vents, etc."
                className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-700 focus:outline-none"
                {...register("description")}
              />
            </div>

            {/* Inspiration / Reference Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference & Inspiration Photos (Max 5)
              </label>
              <div className="flex flex-wrap gap-3">
                {/* Existing Images */}
                {existingImages.map((img) => (
                  <div
                    key={img.publicId}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group"
                  >
                    <img
                      src={img.url}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.publicId)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* New Previews */}
                {previewUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group"
                  >
                    <img
                      src={url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                {existingImages.length + selectedFiles.length < 5 && (
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-700 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-brand-50/50 transition-colors">
                    <UploadCloud size={20} className="text-gray-400" />
                    <span className="text-[11px] font-medium text-gray-500 mt-1">
                      Add Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("measurements")}
            >
              Next: Measurements &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: MEASUREMENTS */}
      {activeTab === "measurements" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Ruler size={18} className="text-brand-700" />
              Tailoring Measurements Snapshot
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              These measurements are locked to this specific garment request and automatically saved to the customer&apos;s CRM profile.
            </p>
          </div>

          <MeasurementsEditor
            value={measurements}
            onChange={setMeasurements}
          />

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("details")}
            >
              &larr; Back
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("materials")}
            >
              Next: Fabrics & Materials &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: MATERIALS */}
      {activeTab === "materials" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-brand-700" />
              Fabrics, Trims & Sourcing Checklist
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Track fabric yardage, lining, buttons, and supplier links for this piece.
            </p>
          </div>

          <MaterialsBuilder
            materials={materials}
            onChange={setMaterials}
          />

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("measurements")}
            >
              &larr; Back
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("pricing")}
            >
              Next: Pricing & Deadline &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* TAB 4: PRICING & DEADLINE */}
      {activeTab === "pricing" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <DollarSign size={18} className="text-brand-700" />
              Pricing & Production Deadline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Estimated Quote (₦)"
                type="number"
                placeholder="0"
                error={errors.estimatedPrice?.message}
                {...register("estimatedPrice")}
              />
              <Input
                label="Agreed Final Price (₦)"
                type="number"
                placeholder="0"
                error={errors.agreedPrice?.message}
                {...register("agreedPrice")}
              />
              <Input
                label="Deposit Paid (₦)"
                type="number"
                placeholder="0"
                error={errors.depositPaid?.message}
                {...register("depositPaid")}
              />
            </div>

            {/* Balance Calculation Pill */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Outstanding Balance Owed by Customer
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ₦{calculatedBalance.toLocaleString("en-NG")}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold">
                Auto Calculated
              </span>
            </div>

            {/* Target Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery / Fitting Date
                </label>
                <input
                  type="date"
                  {...register("deadline")}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Workshop Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs expedited delivery for wedding on Saturday"
                  {...register("notes")}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("materials")}
            >
              &larr; Back
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isPending}
            >
              {initialData ? "Save Changes" : "Create Bespoke Request"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
