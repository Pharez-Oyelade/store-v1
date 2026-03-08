import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, SubscriptionPlan } from "@/types";

// TypeScript interface for the store's shape
interface AuthState {
  vendor: AuthUser | null; //union type - either AuthUser object or null - nobody logged in
  isAuthenticated: boolean;
  isInitialized: boolean; //check if /me endpoint is checked on app load - show loading spinner if false

  // Actions - updating state
  setVendor: (vendor: AuthUser) => void;
  clearVendor: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      //initial state
      vendor: null,
      isAuthenticated: false,
      isInitialized: false,

      // Actions
      setVendor: (vendor: AuthUser) =>
        set({
          vendor,
          isAuthenticated: true,
        }),

      clearVendor: () =>
        set({
          vendor: null,
          isAuthenticated: false,
        }),

      setInitialized: (value: boolean) => set({ isInitialized: value }),
    }),
    {
      name: "sabi-auth", //key used in sessionStorage
      storage: createJSONStorage(() => sessionStorage), //use sessionStorage instead of localStorage for better security - data cleared when tab closed
      partialize: (state) => ({
        vendor: state.vendor,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
