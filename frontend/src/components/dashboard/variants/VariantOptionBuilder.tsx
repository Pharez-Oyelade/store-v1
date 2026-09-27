"use client";

import React, { useState } from "react";
import { Plus, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { VariantOptionDimension } from "@/types";

interface VariantOptionBuilderProps {
  dimensions: VariantOptionDimension[];
  onChange: (nextDimensions: VariantOptionDimension[]) => void;
  availableSizes: string[];
  availableColors: string[];
  availableLengths: string[];
  availableFits: string[];
  availableSleeves: string[];
  onAddCustomSize?: (val: string) => void;
  onAddCustomColor?: (val: string) => void;
  onAddCustomLength?: (val: string) => void;
  onAddCustomFit?: (val: string) => void;
  onAddCustomSleeve?: (val: string) => void;
  onGenerateVariants: (dims: VariantOptionDimension[]) => void;
}

const COMMON_DIMENSIONS = [
  {
    name: "Size",
    label: "Size (Alpha/UK)",
    color: "border-blue-200 bg-blue-50/50 text-blue-800",
  },
  {
    name: "Length",
    label: "Length (Mini/Maxi/Tall)",
    color: "border-purple-200 bg-purple-50/50 text-purple-800",
  },
  {
    name: "Color",
    label: "Color / Pattern",
    color: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
  },
  {
    name: "Sleeve",
    label: "Sleeve Style",
    color: "border-amber-200 bg-amber-50/50 text-amber-800",
  },
  {
    name: "Fit",
    label: "Fit / Cut",
    color: "border-rose-200 bg-rose-50/50 text-rose-800",
  },
];

export default function VariantOptionBuilder({
  dimensions,
  onChange,
  availableSizes,
  availableColors,
  availableLengths,
  availableFits,
  availableSleeves,
  onAddCustomSize,
  onAddCustomColor,
  onAddCustomLength,
  onAddCustomFit,
  onAddCustomSleeve,
  onGenerateVariants,
}: VariantOptionBuilderProps) {
  const [customDimensionName, setCustomDimensionName] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState(false);

  // Helper to get available presets for a given dimension
  function getPresetsFor(dimName: string): string[] {
    const lower = dimName.toLowerCase();
    if (lower === "size") return availableSizes;
    if (lower === "color") return availableColors;
    if (lower === "length") return availableLengths;
    if (lower === "fit") return availableFits;
    if (lower === "sleeve") return availableSleeves;
    return [];
  }

  function handleAddDimension(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (dimensions.some((d) => d.name.toLowerCase() === trimmed.toLowerCase()))
      return;

    const next = [...dimensions, { name: trimmed, values: [] }];
    onChange(next);
    setCustomDimensionName("");
    setShowAddCustom(false);
  }

  function handleRemoveDimension(dimName: string) {
    const next = dimensions.filter(
      (d) => d.name.toLowerCase() !== dimName.toLowerCase(),
    );
    onChange(next);
    onGenerateVariants(next);
  }

  function handleToggleValue(dimName: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    const next = dimensions.map((d) => {
      if (d.name.toLowerCase() !== dimName.toLowerCase()) return d;
      const exists = d.values.some(
        (v) => v.toLowerCase() === trimmed.toLowerCase(),
      );
      const nextValues = exists
        ? d.values.filter((v) => v.toLowerCase() !== trimmed.toLowerCase())
        : [...d.values, trimmed];
      return { ...d, values: nextValues };
    });

    onChange(next);
  }

  function handleAddCustomValue(dimName: string) {
    const inputVal = newTagInput[dimName]?.trim();
    if (!inputVal) return;

    const lower = dimName.toLowerCase();
    if (lower === "size") onAddCustomSize?.(inputVal);
    else if (lower === "color") onAddCustomColor?.(inputVal);
    else if (lower === "length") onAddCustomLength?.(inputVal);
    else if (lower === "fit") onAddCustomFit?.(inputVal);
    else if (lower === "sleeve") onAddCustomSleeve?.(inputVal);

    handleToggleValue(dimName, inputVal);
    setNewTagInput((prev) => ({ ...prev, [dimName]: "" }));
  }

  // Pre-configured quick bundles for 1-click selection
  function handleSelectBundle(dimName: string, bundleValues: string[]) {
    const next = dimensions.map((d) => {
      if (d.name.toLowerCase() !== dimName.toLowerCase()) return d;
      const merged = Array.from(new Set([...d.values, ...bundleValues]));
      return { ...d, values: merged };
    });
    onChange(next);
  }

  // Calculate combinations count
  const validDimensions = dimensions.filter((d) => d.values.length > 0);
  const totalCombinations =
    validDimensions.length === 0
      ? 0
      : validDimensions.reduce((acc, d) => acc * d.values.length, 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Option Dimensions & Presets
          </h3>
          <p className="text-xs text-gray-500">
            Pick garment dimensions (Length, Size, Sleeve, Fit) to generate all
            variant combinations automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title={collapsed ? "Expand options" : "Collapse options"}
        >
          {collapsed ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronUp className="size-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4 pt-3">
          {/* Dimension Enable Chips */}
          <div>
            <span className="text-xs font-medium text-gray-600 mb-1.5 block">
              1. Add Option Dimensions:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {COMMON_DIMENSIONS.map((cd) => {
                const isActive = dimensions.some(
                  (d) => d.name.toLowerCase() === cd.name.toLowerCase(),
                );
                return (
                  <button
                    key={cd.name}
                    type="button"
                    onClick={() => {
                      if (isActive) handleRemoveDimension(cd.name);
                      else handleAddDimension(cd.name);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                      isActive
                        ? "border-brand-600 bg-brand-50 text-brand-700 shadow-2xs"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {isActive ? (
                      <X className="size-3 text-brand-600" />
                    ) : (
                      <Plus className="size-3 text-gray-400" />
                    )}
                    {cd.name}
                  </button>
                );
              })}

              {!showAddCustom ? (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                >
                  <Plus className="size-3 text-gray-400" />
                  Custom...
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customDimensionName}
                    onChange={(e) => setCustomDimensionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDimension(customDimensionName);
                      }
                    }}
                    placeholder="e.g. Neckline, Fabric"
                    className="h-7 w-36 rounded-md border border-gray-300 px-2 text-xs focus:border-brand-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDimension(customDimensionName)}
                    className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="rounded-md p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Dimensions Value Selectors */}
          {dimensions.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-medium text-gray-600 block">
                2. Select or type values for each dimension (1-click chips):
              </span>

              {dimensions.map((dim) => {
                const presets = getPresetsFor(dim.name);
                const isSize = dim.name.toLowerCase() === "size";
                const isLength = dim.name.toLowerCase() === "length";
                const isSleeve = dim.name.toLowerCase() === "sleeve";

                return (
                  <div
                    key={dim.name}
                    className="rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 sm:p-3 space-y-2 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                          {dim.name}
                        </span>
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-gray-500 border border-gray-200">
                          {dim.values.length} selected
                        </span>
                      </div>

                      {/* Quick bundle buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isLength && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectBundle(dim.name, [
                                "Mini",
                                "Midi",
                                "Maxi",
                              ])
                            }
                            className="text-[10px] sm:text-[11px] font-medium text-brand-700 hover:underline"
                          >
                            + [Mini, Midi, Maxi]
                          </button>
                        )}
                        {isSize && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectBundle(dim.name, [
                                  "XS",
                                  "S",
                                  "M",
                                  "L",
                                  "XL",
                                  "XXL",
                                ])
                              }
                              className="text-[10px] sm:text-[11px] font-medium text-brand-700 hover:underline"
                            >
                              + [S to XXL]
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectBundle(dim.name, [
                                  "UK 8",
                                  "UK 10",
                                  "UK 12",
                                  "UK 14",
                                  "UK 16",
                                ])
                              }
                              className="text-[10px] sm:text-[11px] font-medium text-brand-700 hover:underline"
                            >
                              + [UK 8-16]
                            </button>
                          </>
                        )}
                        {isSleeve && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectBundle(dim.name, [
                                "Sleeveless",
                                "Short Sleeve",
                                "Long Sleeve",
                              ])
                            }
                            className="text-[10px] sm:text-[11px] font-medium text-brand-700 hover:underline"
                          >
                            + Common Sleeves
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDimension(dim.name)}
                          className="text-gray-400 hover:text-error-600 transition-colors ml-1 p-0.5"
                          title={`Remove ${dim.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Preset Pills */}
                    {presets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {presets.map((presetVal) => {
                          const isSelected = dim.values.some(
                            (v) => v.toLowerCase() === presetVal.toLowerCase(),
                          );
                          return (
                            <button
                              key={presetVal}
                              type="button"
                              onClick={() =>
                                handleToggleValue(dim.name, presetVal)
                              }
                              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-brand-600 text-white shadow-2xs font-semibold ring-1 ring-brand-700"
                                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                              }`}
                            >
                              {presetVal}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline Tag Creator */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newTagInput[dim.name] || ""}
                        onChange={(e) =>
                          setNewTagInput((prev) => ({
                            ...prev,
                            [dim.name]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomValue(dim.name);
                          }
                        }}
                        placeholder={`Type custom ${dim.name} & press Enter...`}
                        className="h-7 flex-1 rounded-md border border-gray-300 bg-white px-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomValue(dim.name)}
                        className="h-7 rounded-md bg-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generator Summary Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg bg-brand-50/60 border border-brand-100 p-2.5 sm:p-3 mt-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-medium text-brand-900">
                Matrix combinations:
              </span>
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white shadow-2xs">
                {totalCombinations}
              </span>
              {dimensions.length > 0 && (
                <span className="text-[11px] sm:text-xs text-brand-700">
                  (
                  {dimensions
                    .filter((d) => d.values.length > 0)
                    .map((d) => `${d.values.length} ${d.name}`)
                    .join(" × ") || "No values selected"}
                  )
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={totalCombinations === 0}
              onClick={() => onGenerateVariants(dimensions)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-700 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              Generate / Update Combinations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
