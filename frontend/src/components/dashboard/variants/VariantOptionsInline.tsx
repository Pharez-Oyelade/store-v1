"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  SlidersHorizontal,
} from "lucide-react";
import type { VariantOptionDimension } from "@/types";
import CreatableTagInput from "@/components/ui/CreatableTagInput";

interface VariantOptionsInlineProps {
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
  activeCategoryPreset?: {
    categoryKey: string;
    dimensions: string[];
    missingDims: string[];
  } | null;
  onApplyCategoryPreset?: () => void;
}

const STANDARD_OPTION_NAMES = [
  "Size",
  "Color",
  "Length",
  "Fit",
  "Sleeve",
  "Material",
];

// Quick suggestion sets for instant 1-click value additions
const QUICK_SUGGESTIONS: Record<string, { label: string; values: string[] }[]> =
  {
    size: [
      { label: "S–XXL Bundle", values: ["S", "M", "L", "XL", "XXL"] },
      { label: "UK 8–14", values: ["UK 8", "UK 10", "UK 12", "UK 14"] },
      {
        label: "UK 6-24",
        values: [
          "UK 6",
          "UK 8",
          "UK 10",
          "UK 12",
          "UK 14",
          "UK 16",
          "UK 18",
          "UK 20",
          "UK 22",
          "UK 24",
        ],
      },
      { label: "S", values: ["S"] },
      { label: "M", values: ["M"] },
      { label: "L", values: ["L"] },
      { label: "XL", values: ["XL"] },
      { label: "XXL", values: ["XXL"] },
      { label: "Free Size", values: ["Free Size"] },
    ],
    color: [
      { label: "Black", values: ["Black"] },
      { label: "White", values: ["White"] },
      { label: "Navy Blue", values: ["Navy Blue"] },
      { label: "Emerald Green", values: ["Emerald Green"] },
      { label: "Burgundy / Wine", values: ["Burgundy / Wine"] },
      { label: "Red", values: ["Red"] },
      { label: "Nude / Beige", values: ["Nude / Beige"] },
      { label: "Burnt Orange", values: ["Burnt Orange"] },
    ],
    length: [
      { label: "Mini, Midi, Maxi", values: ["Mini", "Midi", "Maxi"] },
      { label: "Mini", values: ["Mini"] },
      { label: "Midi", values: ["Midi"] },
      { label: "Maxi", values: ["Maxi"] },
      { label: "Regular", values: ["Regular"] },
      { label: "Tall", values: ["Tall"] },
      { label: "Petite", values: ["Petite"] },
    ],
    fit: [
      { label: "Regular Fit", values: ["Regular Fit"] },
      { label: "Slim Fit", values: ["Slim Fit"] },
      { label: "Oversized", values: ["Oversized"] },
      { label: "Bodycon", values: ["Bodycon"] },
    ],
    sleeve: [
      { label: "Sleeveless", values: ["Sleeveless"] },
      { label: "Short Sleeve", values: ["Short Sleeve"] },
      { label: "Long Sleeve", values: ["Long Sleeve"] },
      { label: "Puff Sleeve", values: ["Puff Sleeve"] },
    ],
  };

export default function VariantOptionsInline({
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
  activeCategoryPreset,
  onApplyCategoryPreset,
}: VariantOptionsInlineProps) {
  const [editingCustomIndex, setEditingCustomIndex] = useState<number | null>(
    null,
  );
  const [customNameInput, setCustomNameInput] = useState("");

  // Get autocomplete options for a dimension name
  function getAutocompleteOptions(dimName: string): string[] {
    const lower = dimName.toLowerCase();
    if (lower === "size") return availableSizes;
    if (lower === "color") return availableColors;
    if (lower === "length") return availableLengths;
    if (lower === "fit") return availableFits;
    if (lower === "sleeve") return availableSleeves;
    return [];
  }

  // Handle adding custom value callback to sync with store/localStorage
  function handleAddCustomValue(dimName: string, val: string) {
    const lower = dimName.toLowerCase();
    if (lower === "size") onAddCustomSize?.(val);
    else if (lower === "color") onAddCustomColor?.(val);
    else if (lower === "length") onAddCustomLength?.(val);
    else if (lower === "fit") onAddCustomFit?.(val);
    else if (lower === "sleeve") onAddCustomSleeve?.(val);
  }

  // Add a new option dimension (max 3)
  function handleAddOption() {
    if (dimensions.length >= 3) return;

    // Pick first unused standard name
    const usedLower = new Set(dimensions.map((d) => d.name.toLowerCase()));
    let nextName = STANDARD_OPTION_NAMES.find(
      (name) => !usedLower.has(name.toLowerCase()),
    );
    if (!nextName) nextName = "Custom Option";

    onChange([...dimensions, { name: nextName, values: [] }]);
  }

  // Remove option dimension
  function handleRemoveOption(index: number) {
    onChange(dimensions.filter((_, i) => i !== index));
  }

  // Change option name (e.g. from Size to Color)
  function handleNameChange(index: number, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;

    onChange(
      dimensions.map((dim, i) =>
        i === index ? { ...dim, name: trimmed } : dim,
      ),
    );
  }

  // Update option values (from CreatableTagInput)
  function handleValuesChange(index: number, newValues: string[]) {
    onChange(
      dimensions.map((dim, i) =>
        i === index ? { ...dim, values: newValues } : dim,
      ),
    );
  }

  // Quick click suggestion pill
  function handleApplyQuickSuggestion(index: number, vals: string[]) {
    const current = dimensions[index]?.values || [];
    const currentLower = new Set(current.map((v) => v.toLowerCase()));
    const toAdd = vals.filter((v) => !currentLower.has(v.toLowerCase()));
    if (toAdd.length === 0) return;

    const merged = [...current, ...toAdd];
    handleValuesChange(index, merged);

    // Also register custom values if applicable
    const dimName = dimensions[index]?.name || "";
    toAdd.forEach((val) => handleAddCustomValue(dimName, val));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-4">
      {/* Header with Title and Category Preset Tip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Product Options
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            Define options like Size and Color. Combinations will generate
            automatically below.
          </p>
        </div>

        {/* Category suggestion chip */}
        {activeCategoryPreset && onApplyCategoryPreset && (
          <button
            type="button"
            onClick={onApplyCategoryPreset}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="size-3 text-purple-600" />
            <span>
              Suggested for {activeCategoryPreset.categoryKey}: Add{" "}
              {activeCategoryPreset.missingDims.slice(0, 2).join(" & ")}
            </span>
            <span className="font-semibold underline ml-0.5">Apply</span>
          </button>
        )}
      </div>

      {/* Options Stack */}
      <div className="space-y-5">
        {dimensions.map((dim, index) => {
          const lowerName = dim.name.toLowerCase();
          const isStandardName = STANDARD_OPTION_NAMES.some(
            (n) => n.toLowerCase() === lowerName,
          );
          const suggestions = QUICK_SUGGESTIONS[lowerName] || [];
          const currentValuesLower = new Set(
            dim.values.map((v) => v.toLowerCase()),
          );

          return (
            <div
              key={index}
              className="rounded-lg border border-gray-200/90 bg-gray-50/50 p-3 sm:p-3.5 space-y-3 transition-colors focus-within:border-brand-300 focus-within:bg-white"
            >
              {/* Option Row Header: Option Label + Name Selector + Remove Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-700 shrink-0">
                    Option {index + 1}:
                  </span>

                  {/* Standard Dropdown or Custom Input */}
                  {editingCustomIndex === index ||
                  (!isStandardName && dim.name) ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                      <input
                        type="text"
                        value={dim.name}
                        onChange={(e) =>
                          handleNameChange(index, e.target.value)
                        }
                        placeholder="Option name (e.g. Material)"
                        className="h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setEditingCustomIndex(null)}
                        className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:text-gray-700"
                        title="Done"
                      >
                        <Check className="size-3.5 text-emerald-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={isStandardName ? dim.name : "custom"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            setEditingCustomIndex(index);
                          } else {
                            handleNameChange(index, val);
                          }
                        }}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-900 focus:border-brand-500 focus:outline-none cursor-pointer"
                      >
                        {STANDARD_OPTION_NAMES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                        <option value="custom">+ Custom option...</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Remove Option Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="rounded-md p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                  title="Remove this option"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Values Input (Creatable Tag Input) */}
              <div className="space-y-2">
                <CreatableTagInput
                  value={dim.values}
                  onChange={(vals) => handleValuesChange(index, vals)}
                  onAddOption={(val) => handleAddCustomValue(dim.name, val)}
                  options={getAutocompleteOptions(dim.name)}
                  placeholder={`Type ${dim.name || "value"} and press Enter or comma (e.g. S, M, L)...`}
                  className="bg-white text-xs min-h-9"
                />

                {/* Quick suggestion pills (Click to add) */}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-gray-400 font-medium select-none mr-0.5">
                      Suggested:
                    </span>
                    {suggestions.map((sug, sugIdx) => {
                      const allPresent = sug.values.every((v) =>
                        currentValuesLower.has(v.toLowerCase()),
                      );
                      if (allPresent) return null; // Hide already added suggestions

                      return (
                        <button
                          key={sugIdx}
                          type="button"
                          onClick={() =>
                            handleApplyQuickSuggestion(index, sug.values)
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 transition-colors shadow-2xs"
                        >
                          <Plus className="size-2.5 text-gray-400" />
                          <span>{sug.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Another Option Button (Capped at 3) */}
      {dimensions.length < 3 ? (
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50/20 transition-all w-full justify-center"
        >
          <Plus className="size-3.5" />
          <span>
            Add another option{" "}
            {dimensions.length === 0
              ? "(e.g. Size, Color)"
              : "(e.g. Color, Length)"}
          </span>
        </button>
      ) : (
        <p className="text-[11px] text-center text-gray-400">
          Maximum of 3 options reached
        </p>
      )}
    </div>
  );
}
