"use client";

import { useEffect } from "react";
import { useMe } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

export function AuthSync() {
  const { data, isError } = useMe();
  const { setVendor, clearVendor, setInitialized } = useAuthStore();

  useEffect(() => {
    // If we have data from the useMe hook (the backend endpoint), sync it to the store.
    if (data) {
      // apiGet likely resolves with the actual data payload. 
      // We check if data has a 'data' property just in case it was nested, but useLogin directly does setVendor(vendor).
      const vendorData = (data as any).data ? (data as any).data : data;
      setVendor(vendorData);
      setInitialized(true);
    } else if (isError) {
      clearVendor();
      setInitialized(true);
    }
  }, [data, isError, setVendor, clearVendor, setInitialized]);

  return null;
}
