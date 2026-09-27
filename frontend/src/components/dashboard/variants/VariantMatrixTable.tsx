"use client";

import React, { useState, useMemo } from "react";
import {
  Trash2,
  Copy,
  Search,
  Plus,
  Package,
  CheckCheck,
  Layers,
  AlertCircle,
} from "lucide-react";
import type { ProductVariant } from "@/types";

export type VariantDraft = Omit<
  ProductVariant,
  "sold" | "price" | "quantity"
> & {
  price: number | string;
  quantity: number | string;
  sold?: number;
};

interface VariantMatrixTableProps {
  variants: VariantDraft[];
  selectedIndices: number[];
  onToggleSelect: (index: number) => void;
  onSelectAll: (checked: boolean) => void;
  onUpdateVariant: (
    index: number,
    field: keyof VariantDraft,
    value: any,
  ) => void;
  onDeleteVariant: (index: number) => void;
  onDuplicateVariant: (index: number) => void;
  onAddBlankVariant: () => void;
  onApplyPriceAndStockToAll: (price: string, stock: string) => void;
  onApplyPriceAndStockToSelected: (price: string, stock: string) => void;
  onDeleteSelected: () => void;
  highlightInvalidPrices?: boolean;
}

export default function VariantMatrixTable({
  variants,
  selectedIndices,
  onToggleSelect,
  onSelectAll,
  onUpdateVariant,
  onDeleteVariant,
  onDuplicateVariant,
  onAddBlankVariant,
  onApplyPriceAndStockToAll,
  onApplyPriceAndStockToSelected,
  onDeleteSelected,
  highlightInvalidPrices = false,
}: VariantMatrixTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  const isAllSelected =
    variants.length > 0 && selectedIndices.length === variants.length;

  function handleApplyBulk() {
    if (!bulkPrice && !bulkStock) return;
    if (selectedIndices.length > 0) {
      onApplyPriceAndStockToSelected(bulkPrice, bulkStock);
    } else {
      onApplyPriceAndStockToAll(bulkPrice, bulkStock);
    }
  }

  // Filter variants based on search
  const filteredIndices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return variants.map((_, i) => i);
    return variants
      .map((v, i) => {
        const text = [
          v.label,
          v.size,
          v.color,
          v.length,
          v.fit,
          v.sleeve,
          v.sku,
          v.custom,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q) ? i : -1;
      })
      .filter((i) => i !== -1);
  }, [variants, searchQuery]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden space-y-0">
      {/* 1. Integrated Bulk Action & Quick Fill Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50/80 p-3 sm:p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Variant Count & Select All */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 text-brand-600 shrink-0" />
              <span className="text-xs font-semibold text-gray-900">
                {variants.length} Variant{variants.length === 1 ? "" : "s"}
              </span>
            </div>

            {variants.length > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none border-l border-gray-300 pl-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="size-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs">
                  {selectedIndices.length > 0
                    ? `${selectedIndices.length} of ${variants.length} selected`
                    : "Select all"}
                </span>
              </label>
            )}

            {selectedIndices.length > 0 && (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="inline-flex items-center gap-1 text-xs font-medium text-error-600 hover:text-error-700 ml-1"
              >
                <Trash2 className="size-3" />
                Delete ({selectedIndices.length})
              </button>
            )}
          </div>

          {/* Right: Search & Add Blank Variant */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative w-full sm:w-44">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-gray-400" />
              <input
                type="text"
                placeholder="Filter variants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-full rounded-md border border-gray-200 bg-white pl-7 pr-2 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={onAddBlankVariant}
              className="inline-flex items-center gap-1 shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
            >
              <Plus className="size-3 text-gray-500" />
              <span>Custom Variant</span>
            </button>
          </div>
        </div>

        {/* Quick Bulk Fill Row */}
        {variants.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-gray-200/60">
            <span className="text-[11px] font-medium text-gray-500 shrink-0">
              Quick fill:
            </span>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
              <div className="relative sm:w-32">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                  ₦
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="Price"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="h-7 w-full rounded-md border border-gray-300 bg-white pl-6 pr-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="relative sm:w-24">
                <input
                  type="number"
                  min={0}
                  placeholder="Stock"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  className="h-7 w-full rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyBulk}
              disabled={!bulkPrice && !bulkStock}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors w-full sm:w-auto"
            >
              <CheckCheck className="size-3.5" />
              <span>
                {selectedIndices.length > 0
                  ? `Apply to ${selectedIndices.length} Selected`
                  : `Apply to All (${variants.length})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Empty State */}
      {variants.length === 0 ? (
        <div className="p-8 text-center bg-white">
          <Package className="mx-auto size-8 text-gray-300 mb-2" />
          <p className="text-xs font-medium text-gray-700">
            No variants created yet.
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm mx-auto">
            Select or type option values above (like Size: S, M, L) to
            automatically create variants.
          </p>
        </div>
      ) : (
        <>
          {/* 3. Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {filteredIndices.map((origIndex) => {
              const variant = variants[origIndex];
              const isSelected = selectedIndices.includes(origIndex);
              const isPriceInvalid =
                highlightInvalidPrices &&
                (variant.price === "" || Number(variant.price) < 0);

              return (
                <div
                  key={origIndex}
                  className={`p-3 space-y-2.5 transition-colors ${
                    isSelected
                      ? "bg-brand-50/40"
                      : origIndex % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(origIndex)}
                        className="mt-1 size-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                      />
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {variant.size && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                            Size: {variant.size}
                          </span>
                        )}
                        {variant.color && (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                            {variant.color}
                          </span>
                        )}
                        {variant.length && (
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                            {variant.length}
                          </span>
                        )}
                        {variant.sleeve && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                            {variant.sleeve}
                          </span>
                        )}
                        {variant.fit && (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-100">
                            {variant.fit}
                          </span>
                        )}
                        {!variant.size && !variant.color && !variant.length && (
                          <span className="text-xs font-semibold text-gray-800">
                            {variant.label || "Variant"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onDuplicateVariant(origIndex)}
                        className="rounded p-1 text-gray-400 hover:text-gray-600"
                        title="Duplicate"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteVariant(origIndex)}
                        className="rounded p-1 text-gray-400 hover:text-error-600"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase flex items-center gap-1">
                        Price (₦) *
                        {isPriceInvalid && (
                          <AlertCircle className="size-3 text-error-500" />
                        )}
                      </label>
                      <div className="relative mt-0.5">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          ₦
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={variant.price}
                          onChange={(e) =>
                            onUpdateVariant(origIndex, "price", e.target.value)
                          }
                          className={`h-8 w-full rounded-md border pl-6 pr-2 text-xs font-semibold focus:outline-none ${
                            isPriceInvalid
                              ? "border-error-500 bg-error-50/20 text-error-900"
                              : "border-gray-300 bg-white text-gray-900 focus:border-brand-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase">
                        Stock Qty *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={variant.quantity}
                        onChange={(e) =>
                          onUpdateVariant(origIndex, "quantity", e.target.value)
                        }
                        className="mt-0.5 h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="SKU (optional)"
                      value={variant.sku || ""}
                      onChange={(e) =>
                        onUpdateVariant(origIndex, "sku", e.target.value)
                      }
                      className="h-6 w-full rounded border border-gray-200 bg-white px-2 text-[11px] text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold text-gray-600">
                <tr>
                  <th className="w-9 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      className="size-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5">Variant</th>
                  <th className="w-36 px-3 py-2.5">Price (₦) *</th>
                  <th className="w-28 px-3 py-2.5">Stock *</th>
                  <th className="w-32 px-3 py-2.5">SKU (Optional)</th>
                  <th className="w-20 px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredIndices.map((origIndex) => {
                  const variant = variants[origIndex];
                  const isSelected = selectedIndices.includes(origIndex);
                  const isPriceInvalid =
                    highlightInvalidPrices &&
                    (variant.price === "" || Number(variant.price) < 0);

                  return (
                    <tr
                      key={origIndex}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        isSelected ? "bg-brand-50/30" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(origIndex)}
                          className="size-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {variant.size && (
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                              {variant.size}
                            </span>
                          )}
                          {variant.color && (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                              {variant.color}
                            </span>
                          )}
                          {variant.length && (
                            <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                              {variant.length}
                            </span>
                          )}
                          {variant.sleeve && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                              {variant.sleeve}
                            </span>
                          )}
                          {variant.fit && (
                            <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-100">
                              {variant.fit}
                            </span>
                          )}
                          {!variant.size &&
                            !variant.color &&
                            !variant.length && (
                              <span className="font-semibold text-gray-800">
                                {variant.label || "Variant"}
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            ₦
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={variant.price}
                            onChange={(e) =>
                              onUpdateVariant(
                                origIndex,
                                "price",
                                e.target.value,
                              )
                            }
                            className={`h-7 w-full rounded border pl-6 pr-2 text-xs font-semibold focus:outline-none ${
                              isPriceInvalid
                                ? "border-error-500 bg-error-50/20 text-error-900"
                                : "border-gray-200 bg-white text-gray-900 focus:border-brand-500"
                            }`}
                          />
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          value={variant.quantity}
                          onChange={(e) =>
                            onUpdateVariant(
                              origIndex,
                              "quantity",
                              e.target.value,
                            )
                          }
                          className="h-7 w-full rounded border border-gray-200 bg-white px-2 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          placeholder="Optional"
                          value={variant.sku || ""}
                          onChange={(e) =>
                            onUpdateVariant(origIndex, "sku", e.target.value)
                          }
                          className="h-7 w-full rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 placeholder-gray-300 focus:border-brand-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onDuplicateVariant(origIndex)}
                            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVariant(origIndex)}
                            className="rounded p-1 text-gray-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
