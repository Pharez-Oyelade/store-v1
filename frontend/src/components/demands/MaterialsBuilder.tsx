"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Circle, Layers } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import type { CustomRequestMaterial } from "@/types";

interface MaterialsBuilderProps {
  materials: CustomRequestMaterial[];
  onChange: (materials: CustomRequestMaterial[]) => void;
}

export default function MaterialsBuilder({
  materials = [],
  onChange,
}: MaterialsBuilderProps) {
  const { data: suppliersData } = useSuppliers();
  const suppliers = suppliersData?.suppliers || [];

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMaterial: CustomRequestMaterial = {
      name: name.trim(),
      quantity: quantity.trim(),
      estimatedCost: Number(estimatedCost) || 0,
      supplier: supplierId || null,
      acquired: false,
    };

    onChange([...materials, newMaterial]);
    setName("");
    setQuantity("");
    setEstimatedCost("");
    setSupplierId("");
  };

  const handleRemove = (index: number) => {
    onChange(materials.filter((_, idx) => idx !== index));
  };

  const handleToggleAcquired = (index: number) => {
    const updated = materials.map((m, idx) =>
      idx === index ? { ...m, acquired: !m.acquired } : m
    );
    onChange(updated);
  };

  const totalCost = materials.reduce(
    (sum, m) => sum + (Number(m.estimatedCost) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Existing Materials List */}
      {materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                item.acquired
                  ? "bg-green-50/60 border-green-200 text-gray-800"
                  : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleAcquired(index)}
                  className="text-brand-700 shrink-0 hover:scale-110 transition-transform"
                  title={item.acquired ? "Mark as pending" : "Mark as acquired"}
                >
                  {item.acquired ? (
                    <CheckCircle className="text-emerald-600" size={18} />
                  ) : (
                    <Circle className="text-gray-400" size={18} />
                  )}
                </button>
                <div className="truncate">
                  <p
                    className={`font-medium ${
                      item.acquired ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity ? `${item.quantity}` : "Quantity not specified"}
                    {item.supplier && typeof item.supplier === "object"
                      ? ` • Supplier: ${item.supplier.name}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pl-3">
                {item.estimatedCost > 0 && (
                  <span className="font-semibold text-xs text-gray-700">
                    ₦{item.estimatedCost.toLocaleString("en-NG")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {totalCost > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-600 px-2 pt-1 font-medium">
              <span>Total Material Estimate:</span>
              <span className="font-bold text-gray-900">
                ₦{totalCost.toLocaleString("en-NG")}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic py-1">
          No materials or fabric requirements added yet.
        </p>
      )}

      {/* Add Material Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-gray-100">
        <div className="sm:col-span-4">
          <input
            type="text"
            placeholder="Fabric / Material Name (e.g. Aso-Oke Navy)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-700"
          />
        </div>

        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Qty (e.g. 5 yds)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-700"
          />
        </div>

        <div className="sm:col-span-3">
          <input
            type="number"
            placeholder="Cost (₦)"
            value={estimatedCost}
            onChange={(e) =>
              setEstimatedCost(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-700"
          />
        </div>

        <div className="sm:col-span-2">
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-2 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-700"
          >
            <option value="">Supplier (Opt)</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full h-full min-h-[38px] bg-gray-100 hover:bg-brand-700 hover:text-white text-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center"
            title="Add material"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
