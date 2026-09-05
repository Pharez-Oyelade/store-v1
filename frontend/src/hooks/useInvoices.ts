"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/api";
import type {
  Invoice,
  InvoiceMetrics,
  CreateInvoicePayload,
  PayoutAccount,
} from "@/types";

export const INVOICE_KEYS = {
  all: ["invoices"] as const,
  list: (params?: Record<string, any>) => ["invoices", "list", params] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
  public: (token: string) => ["invoices", "public", token] as const,
  payout: ["vendor", "payout"] as const,
  banks: ["payout", "banks"] as const,
};

interface InvoiceListResponse {
  invoices: Invoice[];
  metrics: InvoiceMetrics;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/* ── Query: List Invoices for Vendor ────────────────────────────── */
export function useInvoices(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: INVOICE_KEYS.list(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.status && params.status !== "all") sp.set("status", params.status);
      if (params?.search) sp.set("search", params.search);
      return apiGet<InvoiceListResponse>(`/invoices?${sp.toString()}`);
    },
    staleTime: 1000 * 30, // 30s
  });
}

/* ── Query: Single Invoice Details (Vendor) ─────────────────────── */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: INVOICE_KEYS.detail(id),
    queryFn: () => apiGet<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });
}

/* ── Query: Public Invoice by Token (Customer Live View) ─────────── */
export function usePublicInvoice(token: string, refetchInterval?: number | false) {
  return useQuery({
    queryKey: INVOICE_KEYS.public(token),
    queryFn: () => apiGet<Invoice>(`/invoices/public/${token}`),
    enabled: !!token,
    refetchInterval: refetchInterval || false,
  });
}

/* ── Mutation: Create Invoice ───────────────────────────────────── */
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => apiPost<Invoice>("/invoices", payload),
    onSuccess: (newInvoice) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast.success(`Invoice #${newInvoice.invoiceNumber} created!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create invoice");
    },
  });
}

/* ── Mutation: Record Manual Payment ────────────────────────────── */
export function useRecordManualPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      channel,
      notes,
    }: {
      id: string;
      amount: number;
      channel: string;
      notes?: string;
    }) => apiPatch<Invoice>(`/invoices/${id}/manual-payment`, { amount, channel, notes }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.detail(updated._id) });
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast.success("Payment recorded successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to record payment");
    },
  });
}

/* ── Mutation: Verify Manual Payment Proof ──────────────────────── */
export function useVerifyPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      proofId,
      action,
    }: {
      invoiceId: string;
      proofId: string;
      action: "approve" | "reject";
    }) => apiPatch<Invoice>(`/invoices/${invoiceId}/verify-proof`, { proofId, action }),
    onSuccess: (updated, vars) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.detail(updated._id) });
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast.success(
        vars.action === "approve"
          ? "Payment approved and credited to balance!"
          : "Payment proof rejected"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify payment proof");
    },
  });
}

/* ── Mutation: Cancel Invoice ───────────────────────────────────── */
export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch<Invoice>(`/invoices/${id}/cancel`),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.detail(updated._id) });
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast.success("Invoice marked as cancelled");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel invoice");
    },
  });
}

/* ── Mutation: Initialize Online Payment (Paystack) ─────────────── */
export function useInitializeInvoicePayment() {
  return useMutation({
    mutationFn: ({
      token,
      amount,
      email,
    }: {
      token: string;
      amount?: number;
      email?: string;
    }) =>
      apiPost<{
        authorization_url: string;
        access_code: string;
        reference: string;
      }>(`/invoices/public/${token}/pay`, { amount, email }),
  });
}

/* ── Mutation: Submit Manual Bank Transfer Proof ────────────────── */
export function useSubmitManualProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      token,
      amount,
      bankSenderName,
      reference,
      notes,
    }: {
      token: string;
      amount: number;
      bankSenderName?: string;
      reference?: string;
      notes?: string;
    }) =>
      apiPost(`/invoices/public/${token}/manual-proof`, {
        amount,
        bankSenderName,
        reference,
        notes,
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.public(vars.token) });
      toast.success("Payment proof submitted! The vendor has been notified.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit transfer proof");
    },
  });
}

/* ── Bank & Payout Settings Hooks ───────────────────────────────── */
export function useBanksList() {
  return useQuery({
    queryKey: INVOICE_KEYS.banks,
    queryFn: () =>
      apiGet<Array<{ name: string; code: string; slug: string }>>(
        "/vendor/payout/banks"
      ),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function usePayoutAccount() {
  return useQuery({
    queryKey: INVOICE_KEYS.payout,
    queryFn: () => apiGet<PayoutAccount>("/vendor/payout"),
  });
}

export function useResolveBank() {
  return useMutation({
    mutationFn: ({
      accountNumber,
      bankCode,
    }: {
      accountNumber: string;
      bankCode: string;
    }) =>
      apiPost<{ account_number: string; account_name: string }>(
        "/vendor/payout/resolve",
        { accountNumber, bankCode }
      ),
  });
}

export function useUpdatePayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
    }) => apiPut<PayoutAccount>("/vendor/payout", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.payout });
      toast.success("Settlement bank account verified and connected!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update payout account");
    },
  });
}
