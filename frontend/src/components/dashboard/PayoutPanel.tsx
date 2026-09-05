"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Wallet,
  Sparkles,
  Search,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import {
  useBanksList,
  usePayoutAccount,
  useResolveBank,
  useUpdatePayoutAccount,
} from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PayoutPanel() {
  const { data: payoutAccount, isLoading: isLoadingPayout } =
    usePayoutAccount();
  const { data: banks = [], isLoading: isLoadingBanks } = useBanksList();
  const resolveBankMutation = useResolveBank();
  const updatePayoutMutation = useUpdatePayoutAccount();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [searchBankQuery, setSearchBankQuery] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if payout account is already verified and connected
  useEffect(() => {
    if (payoutAccount?.isVerified && !isEditing) {
      setSelectedBankCode(payoutAccount.bankCode || "");
      setSelectedBankName(payoutAccount.bankName || "");
      setSearchBankQuery(payoutAccount.bankName || "");
      setAccountNumber(payoutAccount.accountNumber || "");
      setResolvedAccountName(payoutAccount.accountName || "");
    }
  }, [payoutAccount, isEditing]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBankDropdownOpen(false);
        // If closed without selecting, restore query to the chosen bank's name
        if (selectedBankName) {
          setSearchBankQuery(selectedBankName);
        } else {
          setSearchBankQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedBankName]);

  // Deduplicate banks by code and sort alphabetically
  const uniqueBanks = useMemo(() => {
    const map = new Map<
      string,
      { id?: number; name: string; code: string; slug?: string }
    >();
    for (const b of banks) {
      if (b.code && !map.has(b.code)) {
        map.set(b.code, b);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [banks]);

  // Filter banks based on search input
  const filteredBanks = useMemo(() => {
    const q = searchBankQuery.trim().toLowerCase();
    if (!q) return uniqueBanks;
    // If the input matches the selected bank name exactly, show full list so user can browse
    if (selectedBankName && q === selectedBankName.trim().toLowerCase()) {
      return uniqueBanks;
    }
    return uniqueBanks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q),
    );
  }, [uniqueBanks, searchBankQuery, selectedBankName]);

  // Trigger NUBAN verification when bankCode and 10-digit account number are present
  useEffect(() => {
    if (selectedBankCode && accountNumber.length === 10) {
      resolveBankMutation.mutate(
        { accountNumber, bankCode: selectedBankCode },
        {
          onSuccess: (data) => {
            setResolvedAccountName(data.account_name);
            toast.success(`Account verified: ${data.account_name}`);
          },
          onError: (err: any) => {
            setResolvedAccountName("");
            toast.error(
              err.message ||
                "Could not resolve account details. Please check numbers.",
            );
          },
        },
      );
    } else {
      setResolvedAccountName("");
    }
  }, [selectedBankCode, accountNumber]);

  const handleSelectBank = (b: { name: string; code: string }) => {
    setSelectedBankCode(b.code);
    setSelectedBankName(b.name);
    setSearchBankQuery(b.name);
    setIsBankDropdownOpen(false);
  };

  const handleClearBank = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBankCode("");
    setSelectedBankName("");
    setSearchBankQuery("");
    setResolvedAccountName("");
    setIsBankDropdownOpen(true);
  };

  const handleSavePayout = () => {
    if (!selectedBankCode || !accountNumber || accountNumber.length !== 10) {
      toast.error(
        "Please provide a valid bank and 10-digit NUBAN account number",
      );
      return;
    }
    if (!resolvedAccountName) {
      toast.error("Account must be successfully resolved before connecting");
      return;
    }

    const bankName =
      selectedBankName ||
      uniqueBanks.find((b) => b.code === selectedBankCode)?.name ||
      "Nigerian Bank";

    updatePayoutMutation.mutate(
      {
        bankName,
        bankCode: selectedBankCode,
        accountNumber,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const isConnected =
    payoutAccount?.isVerified && payoutAccount.paystackSubaccountCode;

  if (isLoadingPayout) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-xs">
        <Loader2 className="mx-auto size-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm text-gray-500 font-medium">
          Loading settlement account details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-900 via-brand-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Direct Bank Settlement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Bank Settlement & Direct Invoicing Payouts
          </h2>
          <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
            Link your registered Nigerian bank account to automatically receive
            customer invoice payments. Funds are settled directly into your
            account on T+1.
          </p>
        </div>
        <Wallet className="absolute -right-6 -bottom-6 size-44 text-white/5 pointer-events-none" />
      </div>

      {/* Connected Account Card (if active and not editing) */}
      {isConnected && !isEditing ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-600 p-3 text-white shadow-sm shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {payoutAccount.bankName}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={12} /> Active & Verified
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {payoutAccount.accountName}
                </p>
                <p className="text-xs font-mono text-gray-600 tracking-wider mt-0.5">
                  Account No: {payoutAccount.accountNumber}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span>Paystack Subaccount:</span>
                  <code className="rounded bg-white px-2 py-0.5 font-mono text-[11px] border border-gray-200">
                    {payoutAccount.paystackSubaccountCode}
                  </code>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSelectedBankCode(payoutAccount.bankCode);
                  setSelectedBankName(payoutAccount.bankName);
                  setSearchBankQuery(payoutAccount.bankName);
                  setAccountNumber(payoutAccount.accountNumber);
                  setResolvedAccountName(payoutAccount.accountName);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs transition-colors cursor-pointer"
              >
                Change Bank Details
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Account Setup / Edit Form */}
      {(!isConnected || isEditing) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900">
              {isConnected
                ? "Update Settlement Bank Account"
                : "Connect Your Nigerian Bank Account"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select your bank and enter your 10-digit NUBAN account number. We
              will verify the account name with NIBSS in real time.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Searchable Bank Combobox */}
            <div className="space-y-1.5" ref={bankDropdownRef}>
              <label className="text-xs font-bold text-gray-700">
                Settlement Bank <span className="text-rose-500">*</span>
              </label>
              {isLoadingBanks ? (
                <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-500">
                  <Loader2 className="size-4 animate-spin text-brand-600" />
                  <span>Loading Nigerian banks...</span>
                </div>
              ) : (
                <div className="relative">
                  <div
                    className={cn(
                      "flex items-center rounded-xl border bg-white px-3 py-2.5 transition-all cursor-pointer",
                      isBankDropdownOpen
                        ? "border-brand-500 ring-2 ring-brand-500/20"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                    onClick={() => setIsBankDropdownOpen(true)}
                  >
                    <Building2 className="size-4 text-gray-400 shrink-0 mr-2.5" />
                    <input
                      type="text"
                      placeholder="Search bank name (e.g. First Bank, GTB, Kuda)..."
                      value={searchBankQuery}
                      onFocus={() => setIsBankDropdownOpen(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchBankQuery(val);
                        if (!isBankDropdownOpen) setIsBankDropdownOpen(true);
                        if (!val.trim()) {
                          setSelectedBankCode("");
                          setSelectedBankName("");
                          setResolvedAccountName("");
                        }
                      }}
                      className="w-full text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {(selectedBankCode || searchBankQuery) && (
                        <button
                          type="button"
                          onClick={handleClearBank}
                          className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                          title="Clear bank"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                      <ChevronDown
                        className={cn(
                          "size-4 text-gray-400 transition-transform duration-200",
                          isBankDropdownOpen && "rotate-180",
                        )}
                      />
                    </div>
                  </div>

                  {/* Floating Dropdown Menu */}
                  {isBankDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                      {filteredBanks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-500">
                          No banks found matching{" "}
                          <span className="font-semibold text-gray-700">
                            "{searchBankQuery}"
                          </span>
                        </div>
                      ) : (
                        filteredBanks.map((b, idx) => {
                          const isSelected = selectedBankCode === b.code;
                          return (
                            <button
                              key={`${b.code}-${b.slug || b.name}-${idx}`}
                              type="button"
                              onClick={() => handleSelectBank(b)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-brand-50 text-brand-900 font-bold"
                                  : "text-gray-700 hover:bg-gray-50 font-medium",
                              )}
                            >
                              <span className="truncate pr-2">{b.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {b.code}
                                </span>
                                {isSelected && (
                                  <Check className="size-3.5 text-brand-600" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                10-Digit NUBAN Account Number{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    const clean = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setAccountNumber(clean);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm tracking-widest text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {resolveBankMutation.isPending && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="size-5 animate-spin text-brand-600" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Enter all 10 digits. Verification begins automatically.
              </p>
            </div>
          </div>

          {/* Real-time Verification Preview */}
          {resolvedAccountName ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Verified Account Name
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {resolvedAccountName}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                Match Verified
              </span>
            </div>
          ) : resolveBankMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 flex items-center gap-3 text-rose-800">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <p className="text-xs font-medium">
                Could not verify account name. Please check your bank and
                account number.
              </p>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (payoutAccount?.isVerified) {
                    setSelectedBankCode(payoutAccount.bankCode);
                    setSelectedBankName(payoutAccount.bankName);
                    setSearchBankQuery(payoutAccount.bankName);
                    setAccountNumber(payoutAccount.accountNumber);
                    setResolvedAccountName(payoutAccount.accountName);
                  }
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={!resolvedAccountName || updatePayoutMutation.isPending}
              onClick={handleSavePayout}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              {updatePayoutMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Connect & Save Payout Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Settlement Architecture & FAQ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="size-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm mb-3">
            1
          </div>
          <h4 className="text-xs font-bold text-gray-900 mb-1">
            Direct Split Settlement
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Customer invoice payments are routed directly into your bank account
            with zero intermediate holding or manual withdrawal requests.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3">
            2
          </div>
          <h4 className="text-xs font-bold text-gray-900 mb-1">
            Automatic Reconciliation
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Paystack webhooks instantly mark your invoice as paid or partially
            credited, and update your orders in real time.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="size-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm mb-3">
            3
          </div>
          <h4 className="text-xs font-bold text-gray-900 mb-1">
            Manual Transfer Ready
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your verified bank details appear on your public invoice page so
            customers who prefer bank transfers can pay seamlessly and upload
            proof.
          </p>
        </div>
      </div>
    </div>
  );
}
