// INDEXEDDB DATABASE WRAPPER FOR VENDRA OFFLINE SYSTEM
// Handles outbox mutations, media blobs, and cached entities without external dependencies.

const DB_NAME = "vendra_offline_db";
const DB_VERSION = 2;

export const STORES = {
  OUTBOX: "outbox",
  BLOBS: "blobs",
  LOCAL_RECORDS: "local_records",
  ID_MAP: "id_map",
  QUERY_CACHE: "query_cache",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Outbox Mutations Store
        if (!db.objectStoreNames.contains(STORES.OUTBOX)) {
          const outboxStore = db.createObjectStore(STORES.OUTBOX, { keyPath: "id" });
          outboxStore.createIndex("status", "status", { unique: false });
          outboxStore.createIndex("createdAt", "createdAt", { unique: false });
          outboxStore.createIndex("entityType", "entityType", { unique: false });
        }

        // 2. Media Blobs Store (for offline inspiration photos & images)
        if (!db.objectStoreNames.contains(STORES.BLOBS)) {
          const blobStore = db.createObjectStore(STORES.BLOBS, { keyPath: "id" });
          blobStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // 3. Local Records Store (optimistic cache of offline-created items)
        if (!db.objectStoreNames.contains(STORES.LOCAL_RECORDS)) {
          const recordStore = db.createObjectStore(STORES.LOCAL_RECORDS, { keyPath: "id" });
          recordStore.createIndex("entityType", "entityType", { unique: false });
          recordStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // 4. ID Reconciliation Map (tempId -> serverId)
        if (!db.objectStoreNames.contains(STORES.ID_MAP)) {
          db.createObjectStore(STORES.ID_MAP, { keyPath: "tempId" });
        }

        // 5. Query Cache Store (persisted React Query cache for instant offline rehydration)
        if (!db.objectStoreNames.contains(STORES.QUERY_CACHE)) {
          db.createObjectStore(STORES.QUERY_CACHE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

/**
 * Generic helper to run a transaction on a single store.
 */
export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await getDB();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);

  return new Promise<T>((resolve, reject) => {
    let result: T;
    let callbackPromise: Promise<T> | null = null;

    try {
      const res = callback(store);
      if (res instanceof Promise) {
        callbackPromise = res;
        res.catch((err) => reject(err));
      } else {
        result = res;
      }
    } catch (err) {
      reject(err);
      return;
    }

    tx.oncomplete = async () => {
      try {
        if (callbackPromise) {
          result = await callbackPromise;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}
