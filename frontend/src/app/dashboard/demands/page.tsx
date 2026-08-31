"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import Button from "@/components/custom/Button";
import DemandCard from "@/components/demands/DemandCard";
import { useCustomRequests, useCustomRequestSummary } from "@/hooks/useCustomRequests";
import { formatCurrency } from "@/lib/utils";
import type { CustomRequestStatus } from "@/types";

const STATUS_TABS: { label: string; value: CustomRequestStatus | "all" }[] = [
  { label: "All Demands", value: "all" },
  { label: "Inquiries", value: "inquiry" as CustomRequestStatus },
  { label: "Quoted", value: "quoted" as CustomRequestStatus },
  { label: "Confirmed", value: "confirmed" as CustomRequestStatus },
  { label: "In Production", value: "in_progress" as CustomRequestStatus },
  { label: "Fitting", value: "fitting" as CustomRequestStatus },
  { label: "Completed", value: "completed" as CustomRequestStatus },
];

export default function DemandsPage() {
  const [selectedStatus, setSelectedStatus] = useState<CustomRequestStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data: summaryData, isLoading: isSummaryLoading } = useCustomRequestSummary();
  const { data: requestsData, isLoading: isRequestsLoading } = useCustomRequests({
    page,
    limit: 15,
    status: selectedStatus,
    search: searchTerm,
  });

  const requests = requestsData?.requests || [];
  const pagination = requestsData?.pagination;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Scissors size={24} />
            </span>
            Demand Board
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track bespoke customer requests, tailoring measurements, fabric sourcing, and fittings.
          </p>
        </div>

        <Link href="/dashboard/demands/new" className="w-full sm:w-auto">
          <Button variant="primary" leftIcon={<Plus size={16} />} className="w-full sm:w-auto justify-center">
            New Bespoke Demand
          </Button>
        </Link>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Active Demands</span>
            <Layers size={18} className="text-brand-700 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {isSummaryLoading ? "..." : summaryData?.activeCount || 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Inquiries & fittings</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${summaryData?.overdueCount ? "text-red-600" : "text-gray-900"}`}>
            {isSummaryLoading ? "..." : summaryData?.overdueCount || 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Need urgent attention</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Customer Debt</span>
            <DollarSign size={18} className="text-amber-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 truncate">
            {isSummaryLoading ? "..." : formatCurrency(summaryData?.totalBalanceOwed || 0)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Balances to collect</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Value</span>
            <Sparkles size={18} className="text-purple-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {isSummaryLoading ? "..." : formatCurrency(summaryData?.totalAgreedValue || 0)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Confirmed bespoke</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        {/* Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === tab.value
                  ? "bg-brand-700 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search client, title, phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-brand-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Demand Cards Grid */}
      {isRequestsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((request) => (
            <DemandCard key={request._id} request={request} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No bespoke demands found</h3>
          <p className="text-xs text-gray-500 mb-6">
            {searchTerm || selectedStatus !== "all"
              ? "Try adjusting your search or filters to see more results."
              : "Record tailoring demands, store measurements, and track fabric requirements for made-to-order clients."}
          </p>
          <Link href="/dashboard/demands/new">
            <Button variant="primary" leftIcon={<Plus size={16} />}>
              Record First Demand
            </Button>
          </Link>
        </div>
      )}


      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-600">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
