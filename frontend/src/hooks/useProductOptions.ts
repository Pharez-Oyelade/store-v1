"use client";

import { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";

import { useAuthStore } from "@/store/authStore";


const STORAGE_KEY_PREFIX = "vendra_product_options_";

// Curated Nigerian fashion & apparel presets
export const DEFAULT_CATEGORIES = [
  "Dresses",
  "Two-Piece Sets",
  "Gowns",
  "Kaftan & Boubou",
  "Agbada & Senegalese",
  "Tops & Blouses",
  "Skirts",
  "Trousers & Pants",
  "Jumpsuits",
  "Corsets & Bralettes",
  "Fabrics & Asoebi",
  "Accessories",
  "Ready-to-Wear",
  "Bespoke Couture",
];

export const DEFAULT_TAGS = [
  "New Arrival",
  "Bestseller",
  "Silk",
  "Ankara",
  "Chiffon",
  "Lace",
  "Crepe",
  "Velvet",
  "Casual",
  "Party / Wedding Guest",
  "Corporate",
  "Limited Edition",
  "Restocked",
];

export const DEFAULT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "UK 6",
  "UK 8",
  "UK 10",
  "UK 12",
  "UK 14",
  "UK 16",
  "UK 18",
  "UK 20",
  "Free Size",
  "Custom Fit",
];

export const DEFAULT_COLORS = [
  "Black",
  "White",
  "Navy Blue",
  "Royal Blue",
  "Emerald Green",
  "Olive Green",
  "Sage Green",
  "Burgundy / Wine",
  "Red",
  "Hot Pink",
  "Blush Pink",
  "Mustard Yellow",
  "Burnt Orange",
  "Brown / Chocolate",
  "Nude / Beige",
  "Grey",
  "Gold",
  "Silver",
  "Multi-color / Print",
];

interface StoredOptions {
  categories: string[];
  tags: string[];
  sizes: string[];
  colors: string[];
}

export function useProductOptions() {
  const { vendor } = useAuthStore();
  const vendorId = vendor?._id || "default";
  const storageKey = `${STORAGE_KEY_PREFIX}${vendorId}`;

  // Fetch vendor's existing products (up to 100) to harvest existing attributes
  const { data: productsData } = useProducts({ limit: 100 });

  // Local storage state for user-added custom options
  const [customOptions, setCustomOptions] = useState<StoredOptions>(() => {
    if (typeof window === "undefined") {
      return { categories: [], tags: [], sizes: [], colors: [] };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
          colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        };
      }
    } catch (e) {
      console.error("Failed to load product options from localStorage", e);
    }
    return { categories: [], tags: [], sizes: [], colors: [] };
  });


  // Persist custom options to localStorage
  const saveCustomOptions = useCallback(
    (next: StoredOptions) => {
      setCustomOptions(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save product options to localStorage", e);
      }
    },
    [storageKey],
  );

  // Harvest attributes from existing products in database
  const harvested = useMemo(() => {
    const categoriesSet = new Set<string>();
    const tagsSet = new Set<string>();
    const sizesSet = new Set<string>();
    const colorsSet = new Set<string>();

    const products = productsData?.products || [];
    products.forEach((p) => {
      if (p.category?.trim()) categoriesSet.add(p.category.trim());
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t?.trim()) tagsSet.add(t.trim());
        });
      }
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          if (v.size?.trim()) sizesSet.add(v.size.trim());
          if (v.color?.trim()) colorsSet.add(v.color.trim());
        });
      }
    });

    return {
      categories: Array.from(categoriesSet),
      tags: Array.from(tagsSet),
      sizes: Array.from(sizesSet),
      colors: Array.from(colorsSet),
    };
  }, [productsData]);

  // Merge: Defaults + Harvested from DB + User Custom Added
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    [...DEFAULT_CATEGORIES, ...harvested.categories, ...customOptions.categories].forEach(
      (item) => {
        const trimmed = item.trim();
        if (trimmed && !map.has(trimmed.toLowerCase())) {
          map.set(trimmed.toLowerCase(), trimmed);
        }
      },
    );
    return Array.from(map.values());
  }, [harvested.categories, customOptions.categories]);

  const tags = useMemo(() => {
    const map = new Map<string, string>();
    [...DEFAULT_TAGS, ...harvested.tags, ...customOptions.tags].forEach((item) => {
      const trimmed = item.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
    });
    return Array.from(map.values());
  }, [harvested.tags, customOptions.tags]);

  const sizes = useMemo(() => {
    const map = new Map<string, string>();
    [...DEFAULT_SIZES, ...harvested.sizes, ...customOptions.sizes].forEach((item) => {
      const trimmed = item.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
    });
    return Array.from(map.values());
  }, [harvested.sizes, customOptions.sizes]);

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    [...DEFAULT_COLORS, ...harvested.colors, ...customOptions.colors].forEach((item) => {
      const trimmed = item.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), trimmed);
      }
    });
    return Array.from(map.values());
  }, [harvested.colors, customOptions.colors]);

  // Add individual handlers
  const addCategory = useCallback(
    (newVal: string) => {
      const trimmed = newVal.trim();
      if (!trimmed) return;
      if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        const next = {
          ...customOptions,
          categories: [...customOptions.categories, trimmed],
        };
        saveCustomOptions(next);
      }
    },
    [categories, customOptions, saveCustomOptions],
  );

  const addTag = useCallback(
    (newVal: string) => {
      const trimmed = newVal.trim();
      if (!trimmed) return;
      if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        const next = {
          ...customOptions,
          tags: [...customOptions.tags, trimmed],
        };
        saveCustomOptions(next);
      }
    },
    [tags, customOptions, saveCustomOptions],
  );

  const addSize = useCallback(
    (newVal: string) => {
      const trimmed = newVal.trim();
      if (!trimmed) return;
      if (!sizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        const next = {
          ...customOptions,
          sizes: [...customOptions.sizes, trimmed],
        };
        saveCustomOptions(next);
      }
    },
    [sizes, customOptions, saveCustomOptions],
  );

  const addColor = useCallback(
    (newVal: string) => {
      const trimmed = newVal.trim();
      if (!trimmed) return;
      if (!colors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        const next = {
          ...customOptions,
          colors: [...customOptions.colors, trimmed],
        };
        saveCustomOptions(next);
      }
    },
    [colors, customOptions, saveCustomOptions],
  );

  return {
    categories,
    tags,
    sizes,
    colors,
    addCategory,
    addTag,
    addSize,
    addColor,
  };
}
