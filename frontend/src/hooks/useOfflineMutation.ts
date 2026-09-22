// HOOK FOR HANDLING SEAMLESS OFFLINE-FIRST MUTATIONS
import { useNetworkStore } from "@/store/networkStore";
import {
  enqueueMutation,
  saveBlob,
  saveLocalRecord,
  generateLocalId,
  EntityType,
} from "@/lib/offline/outbox";
import { queryClient } from "@/lib/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface OfflineMutationOptions<TData, TPayload> {
  entityType: EntityType;
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  description?: string;
  queryKeyToUpdate?: unknown[];
  getOptimisticRecord?: (tempId: string, payload: TPayload) => Record<string, any>;
  onSuccess?: (data: TData | Record<string, any>, isOffline: boolean) => void;
  onError?: (error: Error) => void;
}

export function useOfflineMutation<TPayload extends Record<string, any>, TData = any>(
  options: OfflineMutationOptions<TData, TPayload>
) {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const refreshQueue = useNetworkStore((s) => s.refreshQueue);

  const mutate = async (payload: TPayload, files?: { file: Blob; name: string }[]) => {
    const tempId = generateLocalId(`temp_${options.entityType}`);

    // If currently offline, queue immediately without attempting network
    if (!navigator.onLine || !isOnline) {
      return handleOfflineSave(tempId, payload, files);
    }

    // Try online execution first; if network disconnects mid-flight, fallback to offline queue
    try {
      let response: any;
      if (files && files.length > 0) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(payload)) {
          if (typeof value === "object" && value !== null) {
            formData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
        for (const item of files) {
          formData.append("images", item.file, item.name);
        }
        response = await api({
          url: options.endpoint,
          method: options.method || "POST",
          data: formData,
        });
      } else {
        response = await api({
          url: options.endpoint,
          method: options.method || "POST",
          data: payload,
        });
      }

      if (options.queryKeyToUpdate) {
        queryClient.invalidateQueries({ queryKey: options.queryKeyToUpdate });
      }

      if (options.onSuccess) {
        options.onSuccess(response, false);
      }

      return { isOffline: false, data: response, tempId };
    } catch (err: any) {
      if (!navigator.onLine) {
        console.warn("[OfflineMutation] Network dropped. Falling back to offline save:", err);
        return handleOfflineSave(tempId, payload, files);
      }
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  };

  const handleOfflineSave = async (
    tempId: string,
    payload: TPayload,
    files?: { file: Blob; name: string }[]
  ) => {
    try {
      const blobIds: string[] = [];

      // 1. Save any binary files to IndexedDB blobs store
      if (files && files.length > 0) {
        for (const item of files) {
          const blobId = generateLocalId("blob");
          await saveBlob(blobId, item.file, item.name);
          blobIds.push(blobId);
        }
      }

      // 2. Enqueue the mutation in the outbox
      const queued = await enqueueMutation({
        tempId,
        endpoint: options.endpoint,
        method: options.method || "POST",
        payload,
        entityType: options.entityType,
        blobIds: blobIds.length > 0 ? blobIds : undefined,
        description: options.description || `Create ${options.entityType}`,
      });

      // 3. Build optimistic record for TanStack Query
      const optimisticData = options.getOptimisticRecord
        ? options.getOptimisticRecord(tempId, payload)
        : {
            ...payload,
            _id: tempId,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPendingSync: true,
          };

      // Save to local records store
      await saveLocalRecord({
        id: tempId,
        entityType: options.entityType,
        data: optimisticData,
        createdAt: Date.now(),
        isPendingSync: true,
      });

      // 4. Update TanStack Query cache optimistically so UI reflects the change immediately
      if (options.queryKeyToUpdate) {
        queryClient.setQueriesData({ queryKey: options.queryKeyToUpdate }, (oldData: any) => {
          if (!oldData) return oldData;

          // If oldData has an array property (e.g. requests, orders, products, customRequests)
          for (const key of ["requests", "customRequests", "orders", "products", "invoices", "customers", "suppliers"]) {
            if (Array.isArray(oldData[key])) {
              return {
                ...oldData,
                [key]: [optimisticData, ...oldData[key]],
                pagination: oldData.pagination
                  ? { ...oldData.pagination, total: (oldData.pagination.total || 0) + 1 }
                  : undefined,
              };
            }
          }

          if (Array.isArray(oldData)) {
            return [optimisticData, ...oldData];
          }

          return oldData;
        });
      }

      await refreshQueue();

      toast.success(
        `Saved offline! Your ${options.entityType} will sync when connection returns.`,
        { id: `offline-${tempId}`, duration: 4500, icon: "💾" }
      );

      if (options.onSuccess) {
        options.onSuccess(optimisticData, true);
      }

      return { isOffline: true, tempId, data: optimisticData, queued };
    } catch (err: any) {
      console.error("[OfflineMutation] Error saving offline:", err);
      toast.error("Failed to save offline: " + (err.message || "Storage error"));
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  };

  return { mutate, handleOfflineSave, isOnline };
}
