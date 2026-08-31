"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, Scissors, AlertCircle } from "lucide-react";
import DemandForm from "@/components/demands/DemandForm";
import { useCustomRequest } from "@/hooks/useCustomRequests";
import Button from "@/components/custom/Button";

export default function EditDemandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrapped = use(params);
  const id = unwrapped.id;

  const { data: request, isLoading, error } = useCustomRequest(id);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-xl mx-auto">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Demand Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The bespoke demand you are trying to edit does not exist or has been deleted.
        </p>
        <Link href="/dashboard/demands">
          <Button variant="primary">Return to Demand Board</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <Link
          href={`/dashboard/demands/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-700 transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          Back to Demand Details
        </Link>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
            <Scissors size={24} />
          </span>
          Edit Bespoke Demand
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Update inspiration photos, design notes, client measurements, and pricing for &quot;{request.title}&quot;.
        </p>
      </div>

      <DemandForm initialData={request} />
    </div>
  );
}
