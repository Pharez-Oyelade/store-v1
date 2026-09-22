// NETWORK & OFFLINE SYNCHRONIZATION STORE
import { create } from "zustand";
import {
  QueuedMutation,
  getPendingMutations,
  getAllMutations,
  removeMutation,
} from "@/lib/offline/outbox";

interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  isDrawerOpen: boolean;
  mutations: QueuedMutation[];

  // Actions
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  refreshQueue: () => Promise<void>;
  triggerSync: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

// Module-level callback for triggering the sync engine without circular dependencies
let syncEngineTrigger: (() => Promise<void>) | null = null;

export function registerSyncTrigger(trigger: () => Promise<void>) {
  syncEngineTrigger = trigger;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true, // Baseline true for consistent SSR rendering; synced with browser in useEffect
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  isDrawerOpen: false,
  mutations: [],

  setOnline: (isOnline) => set({ isOnline }),

  setSyncing: (isSyncing) => set({ isSyncing }),

  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),

  refreshQueue: async () => {
    try {
      const all = await getAllMutations();
      const pending = all.filter(
        (m) => m.status === "pending" || m.status === "failed" || m.status === "syncing"
      );
      set({
        mutations: all,
        pendingCount: pending.length,
      });
    } catch (err) {
      console.error("[NetworkStore] Error refreshing queue:", err);
    }
  },

  triggerSync: async () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      set({ isOnline: true });
    }
    if (get().isSyncing) return;
    if (syncEngineTrigger) {
      await syncEngineTrigger();
    }
  },

  removeItem: async (id: string) => {
    try {
      await removeMutation(id);
      await get().refreshQueue();
    } catch (err) {
      console.error("[NetworkStore] Error removing item:", err);
    }
  },
}));
