"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Layers,
  Ruler,
  Scissors,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Trash2,
  Edit,
  ExternalLink,
  Circle,
  Sparkles,
  Maximize2,
  X,
} from "lucide-react";

import Button from "@/components/custom/Button";
import {
  useCustomRequest,
  useUpdateCustomRequest,
  useDeleteCustomRequest,
  useToggleMaterialAcquired,
} from "@/hooks/useCustomRequests";
import { formatCurrency } from "@/lib/utils";
import type { CustomRequestStatus } from "@/types";
import toast from "react-hot-toast";

const STAGES: { key: CustomRequestStatus; label: string }[] = [
  { key: "inquiry" as CustomRequestStatus, label: "Inquiry" },
  { key: "quoted" as CustomRequestStatus, label: "Quoted" },
  { key: "confirmed" as CustomRequestStatus, label: "Confirmed" },
  { key: "sourcing" as CustomRequestStatus, label: "Sourcing Fabric" },
  { key: "in_progress" as CustomRequestStatus, label: "Sewing / Crafting" },
  { key: "fitting" as CustomRequestStatus, label: "Fitting Ready" },
  { key: "completed" as CustomRequestStatus, label: "Delivered" },
];

export default function DemandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrapped = use(params);
  const id = unwrapped.id;
  const router = useRouter();

  const { data: request, isLoading, error } = useCustomRequest(id);
  const updateMutation = useUpdateCustomRequest(id);
  const deleteMutation = useDeleteCustomRequest();
  const toggleMaterialMutation = useToggleMaterialAcquired(id);

  // Edit pricing inline state
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [agreedPriceInput, setAgreedPriceInput] = useState<number | "">("");
  const [depositPaidInput, setDepositPaidInput] = useState<number | "">("");
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);


  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-xl mx-auto">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Demand Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The bespoke record you are looking for does not exist or has been deleted.
        </p>
        <Link href="/dashboard/demands">
          <Button variant="primary">Return to Demand Board</Button>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: CustomRequestStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleSavePayment = () => {
    updateMutation.mutate(
      {
        agreedPrice: agreedPriceInput === "" ? request.agreedPrice : Number(agreedPriceInput),
        depositPaid: depositPaidInput === "" ? request.depositPaid : Number(depositPaidInput),
      },
      {
        onSuccess: () => setIsEditingPayment(false),
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this custom request?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => router.push("/dashboard/demands"),
      });
    }
  };

  const targetPrice = request.agreedPrice > 0 ? request.agreedPrice : request.estimatedPrice;
  const currentStageIndex = STAGES.findIndex((s) => s.key === request.status);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-20 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <Link
            href="/dashboard/demands"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-700 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Back to Demand Board
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 break-words">
              {request.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase font-semibold shrink-0">
              {request.category}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Recorded {new Date(request.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href={`/dashboard/demands/${id}/edit`}>
            <Button variant="secondary" size="small" leftIcon={<Edit size={14} />}>
              Edit Demand
            </Button>
          </Link>
          {request.status !== "completed" && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-xl border border-gray-200 bg-white hover:bg-red-50 transition-colors"
              title="Delete demand"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Production Progress Stepper */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Production Workflow & Status
          </h3>
          <span className="text-[11px] font-medium text-brand-700 sm:hidden">
            Tap stage to update
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STAGES.map((stage, idx) => {
            const isCurrent = request.status === stage.key;
            const isCompleted = currentStageIndex > idx && request.status !== "cancelled";

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => handleStatusChange(stage.key)}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? "bg-brand-700 text-white border-brand-700 font-bold shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200 font-medium hover:bg-emerald-100"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 font-medium"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] opacity-75">Step 0{idx + 1}</span>
                  {isCompleted && <CheckCircle size={12} className="text-emerald-700" />}
                </div>
                <p className="text-xs truncate font-medium">{stage.label}</p>
              </button>
            );
          })}
        </div>
      </div>


        {/* Main Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Client, Brief, Inspiration, Measurements, Materials */}
          <div className="lg:col-span-8 space-y-8">
            {/* Design Brief Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Scissors size={18} className="text-brand-700" />
                  Design Brief & Style Notes
                </h3>
                <Link
                  href={`/dashboard/demands/${id}/edit`}
                  className="text-xs text-brand-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <Edit size={12} /> Edit Brief
                </Link>
              </div>

              {request.description ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {request.description}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">No description provided.</p>
              )}
            </div>

            {/* Inspiration & Reference Images Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  Inspiration & Reference Images
                </h3>
                {request.referenceImages && request.referenceImages.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {request.referenceImages.length} Image{request.referenceImages.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {request.referenceImages && request.referenceImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {request.referenceImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActivePreviewImage(img.url)}
                      className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src={img.url}
                        alt={`Inspiration ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white transition-opacity">
                        <Maximize2 size={18} />
                        <span className="text-xs font-semibold">View Full</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/60">
                  <p className="text-xs text-gray-500 mb-2">No inspiration or reference photos attached to this demand.</p>
                  <Link href={`/dashboard/demands/${id}/edit`}>
                    <Button variant="secondary" size="small" leftIcon={<Edit size={14} />}>
                      Upload Photos
                    </Button>
                  </Link>
                </div>
              )}
            </div>


          {/* Measurements */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Ruler size={18} className="text-brand-700" />
              Customer Body Measurements
            </h3>

            {request.measurements && Object.keys(request.measurements).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(request.measurements).map(([k, v]) => (
                  <div key={k} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">{k}</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">{v || "—"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No measurements recorded for this piece.</p>
            )}
          </div>

          {/* Materials & Sourcing */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-brand-700" />
              Fabrics & Material Checklist
            </h3>

            {request.materials && request.materials.length > 0 ? (
              <div className="space-y-2">
                {request.materials.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                      m.acquired
                        ? "bg-green-50/70 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleMaterialMutation.mutate(idx)}
                        className="text-brand-700 hover:scale-110 transition-transform"
                      >
                        {m.acquired ? (
                          <CheckCircle className="text-emerald-600" size={18} />
                        ) : (
                          <Circle className="text-gray-400" size={18} />
                        )}
                      </button>
                      <div>
                        <p className={`font-semibold text-gray-900 ${m.acquired ? "line-through text-gray-500" : ""}`}>
                          {m.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {m.quantity ? `${m.quantity}` : "No quantity"}
                          {m.supplier && typeof m.supplier === "object"
                            ? ` • Supplier: ${m.supplier.name}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {m.estimatedCost > 0 && (
                      <span className="text-xs font-bold text-gray-700">
                        ₦{m.estimatedCost.toLocaleString("en-NG")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No materials added yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Customer info, Payment, WhatsApp trigger */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Customer Profile</h3>
            <div>
              <p className="text-base font-bold text-gray-900">{request.customerSnapshot.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{request.customerSnapshot.phone}</p>
              {request.customerSnapshot.email && (
                <p className="text-xs text-gray-500 mt-0.5">{request.customerSnapshot.email}</p>
              )}
            </div>

            {request.customer && typeof request.customer === "object" && (
              <Link
                href={`/dashboard/customers/${request.customer._id}`}
                className="inline-flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-800 font-semibold"
              >
                View Full CRM History &rarr;
              </Link>
            )}
          </div>

          {/* Pricing & Balances Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Financial Summary</h3>
              <button
                type="button"
                onClick={() => {
                  setAgreedPriceInput(request.agreedPrice || request.estimatedPrice);
                  setDepositPaidInput(request.depositPaid);
                  setIsEditingPayment(!isEditingPayment);
                }}
                className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1"
              >
                <Edit size={12} />
                {isEditingPayment ? "Cancel" : "Edit"}
              </button>
            </div>

            {isEditingPayment ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Agreed Price (₦)</label>
                  <input
                    type="number"
                    value={agreedPriceInput}
                    onChange={(e) => setAgreedPriceInput(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-brand-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Deposit Paid (₦)</label>
                  <input
                    type="number"
                    value={depositPaidInput}
                    onChange={(e) => setDepositPaidInput(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-brand-700 focus:outline-none"
                  />
                </div>
                <Button variant="primary" size="small" className="w-full" onClick={handleSavePayment}>
                  Update Pricing
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Agreed Price:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(targetPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Deposit Collected:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(request.depositPaid || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-bold">
                  <span>Balance Due:</span>
                  <span className={request.balanceOwed > 0 ? "text-amber-700" : "text-gray-900"}>
                    {formatCurrency(request.balanceOwed)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Direct Triggers */}
          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle size={15} className="text-emerald-700" />
              WhatsApp Client Updates
            </h3>
            <p className="text-xs text-emerald-800">
              One-click pre-formatted WhatsApp messages for your client:
            </p>

            <div className="space-y-2 pt-1">
              {request.whatsappLinks?.quote && (
                <a
                  href={request.whatsappLinks.quote}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Send Price Quote
                </a>
              )}
              {request.whatsappLinks?.confirmed && (
                <a
                  href={request.whatsappLinks.confirmed}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Send Order Confirmation
                </a>
              )}
              {request.whatsappLinks?.fitting && (
                <a
                  href={request.whatsappLinks.fitting}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Invite for Fitting
                </a>
              )}
              {request.whatsappLinks?.completed && (
                <a
                  href={request.whatsappLinks.completed}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Notify Completion / Ready
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Inspiration Image Lightbox Modal */}
      {activePreviewImage && (
        <div
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setActivePreviewImage(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={activePreviewImage}
              alt="Inspiration Preview"
              className="max-h-[85vh] w-auto max-w-full object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

