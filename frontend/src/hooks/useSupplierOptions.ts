"use client";

import { useState, useMemo, useCallback } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuthStore } from "@/store/authStore";

const STORAGE_KEY_PREFIX = "vendra_supplier_options_";

// Curated Nigerian apparel & tailoring materials, fabrics, trimmings and hardware
export const DEFAULT_MATERIALS = [
  // Premium & Traditional Fabrics
  "Ankara",
  "Adire",
  "Aso-Oke",
  "Lace",
  "George",
  "Silk",
  "Chiffon",
  "Crepe",
  "Satin",
  "Organza",
  "Velvet",
  "Brocade",
  "Damask",
  "Cotton",
  "Linen",
  "Denim",
  "Wool",
  "Cashmere",
  "Scuba",
  "Tulle",
  "Georgette",
  "Voile",
  "Viscose / Rayon",
  "Polyester",
  "Spandex / Lycra",
  "Jacquard",
  "Leather / Suede",
  "Mikado",
  "Taffeta",
  // Trimmings, Haberdashery & Hardware
  "Zippers",
  "Buttons",
  "Sewing Thread",
  "Interfacing / Stay",
  "Elastic Bands",
  "Lining / Pocketing",
  "Hooks & Eyes",
  "Ribbons & Cords",
  "Beads & Stones",
  "Shoulder Pads",
  "Boning",
  "Buckles & Eyelets",
];

interface StoredSupplierOptions {
  materials: string[];
}

export function useSupplierOptions() {
  const { vendor } = useAuthStore();
  const vendorId = vendor?._id || "default";
  const storageKey = `${STORAGE_KEY_PREFIX}${vendorId}`;

  // Fetch vendor's existing suppliers (up to 100) to harvest existing materials
  const { data: suppliersData } = useSuppliers({ limit: 100 });

  // Local storage state for user-added custom materials
  const [customOptions, setCustomOptions] = useState<StoredSupplierOptions>(() => {
    if (typeof window === "undefined") {
      return { materials: [] };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          materials: Array.isArray(parsed.materials) ? parsed.materials : [],
        };
      }
    } catch (e) {
      console.error("Failed to load supplier options from localStorage", e);
    }
    return { materials: [] };
  });

  // Persist custom options to localStorage
  const saveCustomOptions = useCallback(
    (next: StoredSupplierOptions) => {
      setCustomOptions(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save supplier options to localStorage", e);
      }
    },
    [storageKey],
  );

  // Harvest materials from existing suppliers in database
  const harvested = useMemo(() => {
    const materialsSet = new Set<string>();
    const suppliers = suppliersData?.suppliers || [];

    suppliers.forEach((s) => {
      if (Array.isArray(s.materials)) {
        s.materials.forEach((m) => {
          if (m?.trim()) materialsSet.add(m.trim());
        });
      }
    });

    return Array.from(materialsSet);
  }, [suppliersData]);

  // Merge: Defaults + Harvested from DB + User Custom Added (preserving casing & uniqueness)
  const materials = useMemo(() => {
    const map = new Map<string, string>();
    [...DEFAULT_MATERIALS, ...harvested, ...customOptions.materials].forEach(
      (item) => {
        const trimmed = item.trim();
        if (trimmed && !map.has(trimmed.toLowerCase())) {
          map.set(trimmed.toLowerCase(), trimmed);
        }
      },
    );
    return Array.from(map.values());
  }, [harvested, customOptions.materials]);

  // Handler to add a new custom material option
  const addMaterial = useCallback(
    (newVal: string) => {
      const trimmed = newVal.trim();
      if (!trimmed) return;
      if (!materials.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
        const next = {
          ...customOptions,
          materials: [...customOptions.materials, trimmed],
        };
        saveCustomOptions(next);
      }
    },
    [materials, customOptions, saveCustomOptions],
  );

  return {
    materials,
    addMaterial,
  };
}
