"use client";

import React, { useState } from "react";
import { CheckCheck, Trash2, ArrowDownToLine, Layers } from "lucide-react";

interface VariantBulkBarProps {
  totalCount: number;
  selectedCount: number;
  onApplyPriceAndStockToAll: (price: string, stock: string) => void;
  onApplyPriceAndStockToBlank: (price: string, stock: string) => void;
  onApplyPriceAndStockToSelected: (price: string, stock: string) => void;
  onDeleteSelected: () => void;
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
}

export default function VariantBulkBar({
  totalCount,
  selectedCount,
  onApplyPriceAndStockToAll,
  onApplyPriceAndStockToBlank,
  onApplyPriceAndStockToSelected,
  onDeleteSelected,
  onSelectAll,
  isAllSelected,
}: VariantBulkBarProps) {
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  function handleApplyAll() {
    if (!bulkPrice && !bulkStock) return;
    onApplyPriceAndStockToAll(bulkPrice, bulkStock);
  }

  function handleApplyBlank() {
    if (!bulkPrice && !bulkStock) return;
    onApplyPriceAndStockToBlank(bulkPrice, bulkStock);
  }

  function handleApplySelected() {
    if (!bulkPrice && !bulkStock) return;
    onApplyPriceAndStockToSelected(bulkPrice, bulkStock);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-3 shadow-2xs space-y-2.5">
      {/* Top Header: Label & Select All / Delete */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="size-4 text-brand-600 shrink-0" />
          <span className="text-xs font-semibold text-gray-900 truncate">
            Quick Bulk Apply
          </span>
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            — Set price & stock once across all {totalCount} variants
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected && totalCount > 0}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="size-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[11px] sm:text-xs">Select All ({totalCount})</span>
          </label>

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-error-600 hover:text-error-700"
            >
              <Trash2 className="size-3" />
              Delete ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Inputs & Actions: Mobile-first layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Price & Stock side-by-side on mobile, inline on desktop */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:max-w-xs">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
              ₦
            </span>
            <input
              type="number"
              min={0}
              placeholder="Price (₦)"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white pl-6 pr-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <input
              type="number"
              min={0}
              placeholder="Stock qty"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons: Stacked or 2-col on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-1 sm:justify-start">
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={!bulkPrice && !bulkStock}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              <CheckCheck className="size-3.5" />
              Apply to {selectedCount} Selected
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleApplyAll}
                disabled={!bulkPrice && !bulkStock}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <CheckCheck className="size-3.5 shrink-0" />
                <span className="truncate">Apply All ({totalCount})</span>
              </button>

              <button
                type="button"
                onClick={handleApplyBlank}
                disabled={!bulkPrice && !bulkStock}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ArrowDownToLine className="size-3.5 shrink-0 text-gray-500" />
                <span className="truncate">Apply Blank</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
