// OUTBOX QUEUE & OFFLINE ENTITY OPERATIONS
import { withStore, STORES } from "./db";

export type EntityType =
  | "demand"
  | "order"
  | "customer"
  | "product"
  | "invoice"
  | "supplier";

export interface QueuedMutation {
  id: string; // client UUID (e.g. outbox_1725590000000_abc)
  tempId?: string; // e.g. temp_demand_123, used to reconcile references
  endpoint: string; // e.g. /custom-requests
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: Record<string, any>;
  entityType: EntityType;
  createdAt: number;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  error?: string;
  blobIds?: string[]; // IDs in the blobs store for offline attachments
  description?: string; // Display name for UI: "Bespoke Demand for Chioma"
}

export interface OfflineBlob {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  createdAt: number;
}

export interface LocalRecord {
  id: string;
  entityType: EntityType;
  data: Record<string, any>;
  createdAt: number;
  isPendingSync: boolean;
}

export interface IdMapEntry {
  tempId: string;
  serverId: string;
  createdAt: number;
}

// Generate unique local ID
export function generateLocalId(prefix: string = "temp"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/* ── Outbox Mutation Operations ────────────────────────────────── */

export async function enqueueMutation(
  mutation: Omit<QueuedMutation, "id" | "createdAt" | "status" | "retryCount">
): Promise<QueuedMutation> {
  const fullMutation: QueuedMutation = {
    ...mutation,
    id: generateLocalId("outbox"),
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  await withStore(STORES.OUTBOX, "readwrite", (store) => {
    store.put(fullMutation);
  });

  return fullMutation;
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  return withStore(STORES.OUTBOX, "readonly", (store) => {
    return new Promise<QueuedMutation[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const all = (request.result as QueuedMutation[]) || [];
        // Return pending or failed mutations sorted chronologically
        const pending = all
          .filter((m) => m.status === "pending" || m.status === "failed")
          .sort((a, b) => a.createdAt - b.createdAt);
        resolve(pending);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getAllMutations(): Promise<QueuedMutation[]> {
  return withStore(STORES.OUTBOX, "readonly", (store) => {
    return new Promise<QueuedMutation[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const all = (request.result as QueuedMutation[]) || [];
        resolve(all.sort((a, b) => a.createdAt - b.createdAt));
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function markMutationSyncing(id: string): Promise<void> {
  await withStore(STORES.OUTBOX, "readwrite", (store) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const item: QueuedMutation = { ...getReq.result, status: "syncing" };
        store.put(item);
      }
    };
  });
}

export async function markMutationFailed(id: string, error: string): Promise<void> {
  await withStore(STORES.OUTBOX, "readwrite", (store) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const item: QueuedMutation = {
          ...getReq.result,
          status: "failed",
          retryCount: (getReq.result.retryCount || 0) + 1,
          error,
        };
        store.put(item);
      }
    };
  });
}

export async function removeMutation(id: string): Promise<void> {
  try {
    const item = await withStore<QueuedMutation | null>(STORES.OUTBOX, "readonly", (store) => {
      return new Promise((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    });

    if (item?.blobIds && item.blobIds.length > 0) {
      for (const blobId of item.blobIds) {
        await removeBlob(blobId).catch(() => {});
      }
    }
  } catch {}

  await withStore(STORES.OUTBOX, "readwrite", (store) => {
    store.delete(id);
  });
}

export async function clearAllMutations(): Promise<void> {
  await withStore(STORES.OUTBOX, "readwrite", (store) => {
    store.clear();
  });
  await withStore(STORES.BLOBS, "readwrite", (store) => {
    store.clear();
  }).catch(() => {});
}

/* ── Media Blobs Operations ────────────────────────────────────── */

export async function saveBlob(id: string, blob: Blob, name: string): Promise<OfflineBlob> {
  const item: OfflineBlob = {
    id,
    blob,
    name,
    type: blob.type || "image/jpeg",
    createdAt: Date.now(),
  };

  await withStore(STORES.BLOBS, "readwrite", (store) => {
    store.put(item);
  });

  return item;
}

export async function getBlob(id: string): Promise<OfflineBlob | null> {
  return withStore(STORES.BLOBS, "readonly", (store) => {
    return new Promise<OfflineBlob | null>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function removeBlob(id: string): Promise<void> {
  await withStore(STORES.BLOBS, "readwrite", (store) => {
    store.delete(id);
  });
}

/* ── ID Reconciliation Mapping ─────────────────────────────────── */

export async function saveIdMapping(tempId: string, serverId: string): Promise<void> {
  const entry: IdMapEntry = {
    tempId,
    serverId,
    createdAt: Date.now(),
  };

  await withStore(STORES.ID_MAP, "readwrite", (store) => {
    store.put(entry);
  });
}

export async function getIdMapping(tempId: string): Promise<string | null> {
  return withStore(STORES.ID_MAP, "readonly", (store) => {
    return new Promise<string | null>((resolve, reject) => {
      const req = store.get(tempId);
      req.onsuccess = () => {
        resolve(req.result ? req.result.serverId : null);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getAllIdMappings(): Promise<Record<string, string>> {
  return withStore(STORES.ID_MAP, "readonly", (store) => {
    return new Promise<Record<string, string>>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as IdMapEntry[]) || [];
        const map: Record<string, string> = {};
        for (const item of list) {
          map[item.tempId] = item.serverId;
        }
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/* ── Local Optimistic Entities Store ───────────────────────────── */

export async function saveLocalRecord(record: LocalRecord): Promise<void> {
  await withStore(STORES.LOCAL_RECORDS, "readwrite", (store) => {
    store.put(record);
  });
}

export async function getLocalRecord(id: string): Promise<LocalRecord | null> {
  return withStore(STORES.LOCAL_RECORDS, "readonly", (store) => {
    return new Promise<LocalRecord | null>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getLocalRecordsByEntity(entityType: EntityType): Promise<LocalRecord[]> {
  return withStore(STORES.LOCAL_RECORDS, "readonly", (store) => {
    return new Promise<LocalRecord[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as LocalRecord[]) || [];
        resolve(list.filter((item) => item.entityType === entityType));
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function removeLocalRecord(id: string): Promise<void> {
  await withStore(STORES.LOCAL_RECORDS, "readwrite", (store) => {
    store.delete(id);
  });
}
