// TANSTACK QUERY INDEXEDDB PERSISTENCE ENGINE
// Automatically synchronizes QueryClient cache to IndexedDB for instant, zero-latency offline loads.
// Operates with zero external npm dependencies using native IndexedDB.

import { QueryClient, hashKey, type QueryKey } from "@tanstack/react-query";
import { getDB, STORES, withStore } from "./db";

export interface PersistedQueryRecord {
  key: string;
  queryKey: QueryKey;
  data: any;
  updatedAt: number;
}

// Queries we specifically avoid persisting to avoid storing non-cacheable or transient data
const IGNORED_ROOT_KEYS = new Set(["admin-stats-live"]);

let isInitialized = false;
let isRestoring = false;
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const pendingWrites = new Map<string, PersistedQueryRecord>();
const pendingDeletes = new Set<string>();

/**
 * Flushes all queued debounced writes and deletes to IndexedDB in a single transaction.
 */
async function flushPendingOperations(): Promise<void> {
  if (pendingWrites.size === 0 && pendingDeletes.size === 0) return;

  const writes = Array.from(pendingWrites.values());
  const deletes = Array.from(pendingDeletes.values());

  pendingWrites.clear();
  pendingDeletes.clear();

  try {
    const db = await getDB();
    const tx = db.transaction(STORES.QUERY_CACHE, "readwrite");
    const store = tx.objectStore(STORES.QUERY_CACHE);

    for (const record of writes) {
      try {
        store.put(record);
      } catch (err) {
        // e.g. non-clonable data or circular refs
        console.warn("[QueryPersister] Could not persist query:", record.key, err);
      }
    }

    for (const key of deletes) {
      store.delete(key);
    }
  } catch (err) {
    console.error("[QueryPersister] Failed to flush to IndexedDB:", err);
  }
}

/**
 * Schedules a query to be saved to IndexedDB after a 300ms debounce.
 */
function scheduleSave(queryKey: QueryKey, data: any, updatedAt: number): void {
  // Don't re-persist data we just restored from IndexedDB
  if (isRestoring) return;

  const rootKey = Array.isArray(queryKey) && typeof queryKey[0] === "string" ? queryKey[0] : "";
  if (IGNORED_ROOT_KEYS.has(rootKey)) return;

  try {
    const key = hashKey(queryKey);
    pendingDeletes.delete(key);
    pendingWrites.set(key, {
      key,
      queryKey,
      data,
      updatedAt: updatedAt || Date.now(),
    });

    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      flushPendingOperations();
    }, 300);
  } catch (err) {
    console.warn("[QueryPersister] Hash key generation failed:", err);
  }
}

/**
 * Schedules a query to be deleted from IndexedDB when removed from QueryClient.
 */
function scheduleDelete(queryKey: QueryKey): void {
  try {
    const key = hashKey(queryKey);
    pendingWrites.delete(key);
    pendingDeletes.add(key);

    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      flushPendingOperations();
    }, 300);
  } catch (err) {
    console.warn("[QueryPersister] Hash key delete failed:", err);
  }
}

/**
 * Restores persisted query cache from IndexedDB into QueryClient.
 * This populates QueryClient with saved data immediately on app load,
 * enabling full offline reading before any network requests occur.
 */
export async function restoreQueryCache(queryClient: QueryClient): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    isRestoring = true;
    const records = await withStore<PersistedQueryRecord[]>(
      STORES.QUERY_CACHE,
      "readonly",
      (store) => {
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      }
    );

    let restoredCount = 0;
    const now = Date.now();
    const MAX_CACHE_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days retention

    for (const record of records) {
      if (!record || !record.queryKey) continue;

      // Clean up records older than 7 days
      if (record.updatedAt && now - record.updatedAt > MAX_CACHE_AGE_MS) {
        scheduleDelete(record.queryKey);
        continue;
      }

      // Populate query client if not already present in memory
      const existingData = queryClient.getQueryData(record.queryKey);
      if (existingData === undefined) {
        queryClient.setQueryData(record.queryKey, record.data, {
          updatedAt: record.updatedAt,
        });
        restoredCount++;
      }
    }

    if (restoredCount > 0) {
      console.log(`[QueryPersister] Restored ${restoredCount} cached queries from IndexedDB`);
    }
    return restoredCount;
  } catch (err) {
    console.warn("[QueryPersister] Failed to restore query cache:", err);
    return 0;
  } finally {
    isRestoring = false;
  }
}

/**
 * Initializes continuous bi-directional persistence between QueryClient and IndexedDB.
 */
export function initQueryCachePersistence(queryClient: QueryClient): () => void {
  if (typeof window === "undefined" || isInitialized) {
    return () => {};
  }

  isInitialized = true;

  // 1. Initial rehydration from IndexedDB
  restoreQueryCache(queryClient);

  // 2. Subscribe to React Query cache changes to persist new/updated queries
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (!event) return;

    if (event.type === "updated") {
      const { query } = event;
      if (query.state.status === "success" && query.state.data !== undefined) {
        scheduleSave(query.queryKey, query.state.data, query.state.dataUpdatedAt);
      }
    } else if (event.type === "removed") {
      scheduleDelete(event.query.queryKey);
    }
  });

  return () => {
    unsubscribe();
    isInitialized = false;
  };
}

/**
 * Clears the persisted query cache in IndexedDB (e.g. upon user logout).
 */
export async function clearPersistedQueryCache(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await withStore(STORES.QUERY_CACHE, "readwrite", (store) => {
      store.clear();
    });
    console.log("[QueryPersister] Persisted query cache cleared");
  } catch (err) {
    console.warn("[QueryPersister] Failed to clear query cache:", err);
  }
}
