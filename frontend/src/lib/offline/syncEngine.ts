// OFFLINE SYNCHRONIZATION ENGINE & ID RECONCILIATION
import api from "@/lib/api";
import { queryClient } from "@/lib/react-query";
import {
  getPendingMutations,
  markMutationSyncing,
  markMutationFailed,
  removeMutation,
  getBlob,
  removeBlob,
  saveIdMapping,
  getAllIdMappings,
  removeLocalRecord,
} from "./outbox";
import { useNetworkStore, registerSyncTrigger } from "@/store/networkStore";
import toast from "react-hot-toast";

/**
 * Recursively scans an object and replaces any values that match a known tempId
 * with the reconciled serverId.
 */
function reconcilePayload(data: any, idMap: Record<string, string>): any {
  if (!data || typeof data !== "object") {
    if (typeof data === "string" && idMap[data]) {
      return idMap[data];
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => reconcilePayload(item, idMap));
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string" && idMap[val]) {
      result[key] = idMap[val];
    } else if (typeof val === "object" && val !== null) {
      result[key] = reconcilePayload(val, idMap);
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Execute synchronization for all pending outbox mutations.
 */
export async function syncPendingMutations(): Promise<void> {
  const store = useNetworkStore.getState();

  // If already syncing or offline, bail
  if (store.isSyncing) return;
  if (!navigator.onLine) {
    store.setOnline(false);
    return;
  }

  // Acquire sync lock immediately to prevent concurrent race conditions
  store.setSyncing(true);
  store.setOnline(true);

  let syncedCount = 0;
  let failedCount = 0;

  try {
    const pending = await getPendingMutations();
    if (pending.length === 0) {
      await store.refreshQueue();
      return;
    }

    const idMap = await getAllIdMappings();

    for (const mutation of pending) {
      // Re-check online status before each request
      if (!navigator.onLine) {
        store.setOnline(false);
        break;
      }

      // If item has permanently failed 3+ times, don't auto-retry in background loop
      if (mutation.status === "failed" && (mutation.retryCount || 0) >= 3) {
        continue;
      }

      await markMutationSyncing(mutation.id);
      await store.refreshQueue();

      try {
        // 1. Reconcile temporary IDs in payload (e.g. newly created customer or demand references)
        const preparedPayload = reconcilePayload(mutation.payload, idMap);

        let response: any;

        // 2. Handle multipart file uploads if mutation includes offline blobs
        if (mutation.blobIds && mutation.blobIds.length > 0) {
          const formData = new FormData();

          // Append non-file fields
          for (const [key, value] of Object.entries(preparedPayload)) {
            if (typeof value === "object" && value !== null) {
              formData.append(key, JSON.stringify(value));
            } else if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          }

          // Append binary blobs
          for (const blobId of mutation.blobIds) {
            const blobRecord = await getBlob(blobId);
            if (blobRecord) {
              formData.append("images", blobRecord.blob, blobRecord.name);
            }
          }

          response = await api({
            url: mutation.endpoint,
            method: mutation.method,
            data: formData,
            headers: {
              "x-idempotency-key": mutation.id,
            },
          });
        } else {
          // Standard JSON payload
          response = await api({
            url: mutation.endpoint,
            method: mutation.method,
            data: preparedPayload,
            headers: {
              "Content-Type": "application/json",
              "x-idempotency-key": mutation.id,
            },
          });
        }

        // 3. Save ID mapping if a temporary ID was used
        const createdId = response?._id || response?.data?._id;
        if (mutation.tempId && createdId) {
          await saveIdMapping(mutation.tempId, createdId);
          idMap[mutation.tempId] = createdId;
          await removeLocalRecord(mutation.tempId);
        }

        // 4. Clean up stored media blobs
        if (mutation.blobIds) {
          for (const blobId of mutation.blobIds) {
            await removeBlob(blobId);
          }
        }

        // 5. Remove mutation from outbox
        await removeMutation(mutation.id);
        syncedCount++;

        // 6. Refresh relevant queries
        invalidateQueriesForEntity(mutation.entityType);
      } catch (err: any) {
        console.error(`[SyncEngine] Failed mutation ${mutation.id}:`, err);
        const errorMessage = err?.message || "Sync failed. Connection error.";

        // Only treat as a network disconnect if the browser is actually offline.
        // Note: api.ts response interceptor strips AxiosError into a plain Error,
        // so err.response and err.code are always undefined. navigator.onLine is the
        // only reliable signal for network state.
        if (!navigator.onLine) {
          store.setOnline(false);
          await markMutationFailed(mutation.id, "Network connection lost during sync.");
          break;
        }

        // If authentication expired (401), halt sync queue until user re-authenticates
        if (err?.status === 401) {
          await markMutationFailed(mutation.id, "Session expired. Please log in to sync.");
          break;
        }

        // Server returned an error (400, 403, 500, etc.) — record it and continue with next item
        await markMutationFailed(mutation.id, errorMessage);
        failedCount++;
      }
    }
  } finally {
    store.setSyncing(false);
    store.setLastSyncAt(new Date());
    await store.refreshQueue();

    if (syncedCount > 0) {
      toast.success(
        `Sync complete: ${syncedCount} offline change${syncedCount > 1 ? "s" : ""} saved to cloud!`,
        { id: "sync-complete", duration: 4000 }
      );
    }
    if (failedCount > 0) {
      toast.error(
        `${failedCount} item${failedCount > 1 ? "s" : ""} failed to sync. Review in Sync Center.`,
        { id: "sync-failed", duration: 5000 }
      );
    }
  }
}

function invalidateQueriesForEntity(entityType: string) {
  switch (entityType) {
    case "demand":
      queryClient.invalidateQueries({ queryKey: ["custom-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      break;
    case "order":
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      break;
    case "customer":
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      break;
    case "product":
      queryClient.invalidateQueries({ queryKey: ["products"] });
      break;
    case "invoice":
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      break;
    case "supplier":
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      break;
    default:
      queryClient.invalidateQueries();
  }
}

// Register trigger with the network store
registerSyncTrigger(syncPendingMutations);

/**
 * Initializes browser listeners for network transitions and page visibility.
 */
export function initOfflineSyncListeners(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    console.log("[SyncEngine] Network connection restored. Triggering sync...");
    useNetworkStore.getState().setOnline(true);
    syncPendingMutations();
  };

  const handleOffline = () => {
    console.log("[SyncEngine] Device went offline.");
    useNetworkStore.getState().setOnline(false);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      syncPendingMutations();
    }
  };

  const handleFocus = () => {
    if (typeof navigator !== "undefined") {
      const isOnline = navigator.onLine;
      if (isOnline !== useNetworkStore.getState().isOnline) {
        useNetworkStore.getState().setOnline(isOnline);
        if (isOnline) {
          syncPendingMutations();
        }
      }
    }
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Poll navigator.onLine every 4 seconds to catch DevTools throttling changes
  const intervalId = setInterval(() => {
    if (typeof navigator !== "undefined") {
      const isOnline = navigator.onLine;
      if (isOnline !== useNetworkStore.getState().isOnline) {
        useNetworkStore.getState().setOnline(isOnline);
        if (isOnline) {
          syncPendingMutations();
        }
      }
    }
  }, 4000);

  // Initial check and queue refresh
  useNetworkStore.getState().setOnline(navigator.onLine);
  useNetworkStore.getState().refreshQueue();
  if (navigator.onLine) {
    syncPendingMutations();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    clearInterval(intervalId);
  };
}
