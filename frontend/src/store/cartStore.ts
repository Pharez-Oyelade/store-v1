import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantLabel: string;
}

interface MultiVendorCartState {
  // Scoped carts map: { "amina-couture": [CartItem, ...], "lekki-tailor": [...] }
  carts: Record<string, CartItem[]>;

  // Scoped mutations
  addItem: (vendorHandle: string, item: CartItem) => void;
  removeItem: (vendorHandle: string, productId: string, variantId: string) => void;
  updateQuantity: (vendorHandle: string, productId: string, variantId: string, quantity: number) => void;
  clearCart: (vendorHandle?: string) => void;

  // Scoped queries
  getItems: (vendorHandle?: string) => CartItem[];
  getTotalItems: (vendorHandle?: string) => number;
  getTotalPrice: (vendorHandle?: string) => number;

  // Legacy fallback properties for components during migration
  items: CartItem[];
}

export const useCartStore = create<MultiVendorCartState>()(
  persist(
    (set, get) => ({
      carts: {},
      items: [], // Legacy fallback

      addItem: (vendorHandle, newItem) => {
        const handle = (vendorHandle || "default").toLowerCase().trim();
        set((state) => {
          const vendorItems = state.carts[handle] || [];
          const existingItemIndex = vendorItems.findIndex(
            (item) => item.productId === newItem.productId && item.variantId === newItem.variantId
          );

          let updatedVendorItems: CartItem[];
          if (existingItemIndex >= 0) {
            updatedVendorItems = [...vendorItems];
            updatedVendorItems[existingItemIndex].quantity += newItem.quantity;
          } else {
            updatedVendorItems = [...vendorItems, newItem];
          }

          return {
            carts: {
              ...state.carts,
              [handle]: updatedVendorItems,
            },
            items: updatedVendorItems, // Legacy mirror for current active
          };
        });
      },

      removeItem: (vendorHandle, productId, variantId) => {
        const handle = (vendorHandle || "default").toLowerCase().trim();
        set((state) => {
          const vendorItems = state.carts[handle] || [];
          const updatedVendorItems = vendorItems.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          );
          return {
            carts: {
              ...state.carts,
              [handle]: updatedVendorItems,
            },
            items: updatedVendorItems,
          };
        });
      },

      updateQuantity: (vendorHandle, productId, variantId, quantity) => {
        const handle = (vendorHandle || "default").toLowerCase().trim();
        set((state) => {
          const vendorItems = state.carts[handle] || [];
          const updatedVendorItems = vendorItems.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          );
          return {
            carts: {
              ...state.carts,
              [handle]: updatedVendorItems,
            },
            items: updatedVendorItems,
          };
        });
      },

      clearCart: (vendorHandle) => {
        if (!vendorHandle) {
          // Clear all carts
          set({ carts: {}, items: [] });
          return;
        }
        const handle = vendorHandle.toLowerCase().trim();
        set((state) => {
          const nextCarts = { ...state.carts };
          delete nextCarts[handle];
          return { carts: nextCarts, items: [] };
        });
      },

      getItems: (vendorHandle) => {
        if (!vendorHandle) return get().items;
        const handle = vendorHandle.toLowerCase().trim();
        return get().carts[handle] || [];
      },

      getTotalItems: (vendorHandle) => {
        const items = get().getItems(vendorHandle);
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: (vendorHandle) => {
        const items = get().getItems(vendorHandle);
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: "vendra-multivendor-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Convenient React hook to consume a vendor-isolated cart.
 * Automatically scopes cart operations, item counts, and totals to the given vendor handle.
 */
export function useVendorCart(vendorHandle?: string) {
  const handle = (vendorHandle || "default").toLowerCase().trim();
  const carts = useCartStore((s) => s.carts);
  const addItemFn = useCartStore((s) => s.addItem);
  const removeItemFn = useCartStore((s) => s.removeItem);
  const updateQuantityFn = useCartStore((s) => s.updateQuantity);
  const clearCartFn = useCartStore((s) => s.clearCart);

  const items = carts[handle] || [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    totalItems,
    totalPrice,
    getTotalPrice: () => totalPrice,
    getTotalItems: () => totalItems,
    addItem: (item: CartItem) => addItemFn(handle, item),
    removeItem: (productId: string, variantId: string) => removeItemFn(handle, productId, variantId),
    updateQuantity: (productId: string, variantId: string, quantity: number) =>
      updateQuantityFn(handle, productId, variantId, quantity),
    clearCart: () => clearCartFn(handle),
  };
}
