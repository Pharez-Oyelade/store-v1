"use client";

import React, { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";

interface MeasurementsEditorProps {
  value: Record<string, string>;
  onChange: (measurements: Record<string, string>) => void;
}

const COMMON_PRESETS = [
  "Bust / Chest",
  "Waist",
  "Hips",
  "Shoulder",
  "Sleeve Length",
  "Full Length",
  "Inseam / Trouser Length",
  "Thigh",
  "Neck",
  "Ankle",
  "Agbada Width",
];

export default function MeasurementsEditor({
  value = {},
  onChange,
}: MeasurementsEditorProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = (key: string, val: string) => {
    if (!key.trim()) return;
    onChange({
      ...value,
      [key.trim()]: val.trim(),
    });
    setNewKey("");
    setNewValue("");
  };

  const handleUpdate = (key: string, val: string) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  const handleDelete = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const entries = Object.entries(value);

  return (
    <div className="space-y-4">
      {/* Quick Add Presets */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
          Quick Preset Fields
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_PRESETS.map((preset) => {
            const isAdded = Object.prototype.hasOwnProperty.call(value, preset);
            return (
              <button
                key={preset}
                type="button"
                disabled={isAdded}
                onClick={() => handleAdd(preset, "")}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isAdded
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-200 hover:border-brand-700 hover:text-brand-700 hover:bg-brand-50"
                }`}
              >
                + {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Measurement Key-Value List */}
      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {entries.map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200"
            >
              <span className="text-xs font-medium text-gray-700 w-1/2 truncate pl-1">
                {key}
              </span>
              <input
                type="text"
                value={val}
                placeholder='e.g. 38"'
                onChange={(e) => handleUpdate(key, e.target.value)}
                className="w-1/2 px-2 py-1 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-brand-700"
              />
              <button
                type="button"
                onClick={() => handleDelete(key)}
                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                title="Remove field"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic py-2">
          No measurements added yet. Click a preset above or add a custom field below.
        </p>
      )}

      {/* Custom Field Add Row */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
        <input
          type="text"
          placeholder="Custom field name (e.g. Wrist, Lap)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-700"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder='Value (e.g. 12")'
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1 sm:w-36 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-700"
          />
          <button
            type="button"
            onClick={() => handleAdd(newKey, newValue)}
            className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 shrink-0"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

    </div>
  );
}
