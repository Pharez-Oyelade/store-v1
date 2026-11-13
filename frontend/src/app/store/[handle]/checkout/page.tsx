"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Trash2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  CreditCard,
  Check,
  Shield,
  Tag,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiPost, apiGet } from "@/lib/api";
import { useVendorCart } from "@/store/cartStore";

// Safe, resilient Paystack inline script loader
function loadPaystackScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.PaystackPop) return Promise.resolve(true);

  return new Promise((resolve) => {
    let script = document.querySelector<HTMLScriptElement>(
      'script[src*="paystack.co/v1/inline.js"]'
    );
    if (!script) {
      script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const onLoad = () => resolve(Boolean(window.PaystackPop));
    const onError = () => resolve(false);

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    // Fallback watchdog in case onload already fired
    setTimeout(() => {
      resolve(Boolean(window.PaystackPop));
    }, 2500);
  });
}

export default function StorefrontCheckout({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const unwrappedParams = use(params);
  const handle = unwrappedParams.handle;
  const router = useRouter();

  const { items, getTotalPrice, removeItem, clearCart } = useVendorCart(handle);

  const [step, setStep] = useState<"details" | "payment">("details");
  const [loading, setLoading] = useState(false);
  const [orderProcessingState, setOrderProcessingState] = useState<
    "idle" | "launching_paystack" | "awaiting_payment" | "verifying" | "success"
  >("idle");
  const [vendorData, setVendorData] = useState<any>(null);

  // Confirmed Order Screen State
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    totalAmount: number;
    paymentReference?: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: any;
    items?: any[];
  } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    notes: "",
  });

  // Field Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Delivery Rates from vendor settings
  const [selectedDeliveryFee, setSelectedDeliveryFee] = useState<number>(0);

  // Coupon / Discount State
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    discountAmount: number;
  } | null>(null);

  // Payment Method: "whatsapp" or "paystack"
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "paystack">("whatsapp");

  // Fetch Vendor Storefront Profile
  useEffect(() => {
    let isMounted = true;
    apiGet<any>(`/storefront/${handle}`)
      .then((data) => {
        if (isMounted) {
          setVendorData(data);
          // If vendor has default delivery rates, preset state
          const rates = data?.storefrontSettings?.deliveryRates;
          if (rates && rates.length > 0) {
            setFormData((prev) => ({ ...prev, state: prev.state || rates[0].state }));
            setSelectedDeliveryFee(rates[0].fee || 0);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [handle]);

  // Preload Paystack script in the background
  useEffect(() => {
    loadPaystackScript().catch(() => {});
  }, []);

  // Handle return from Paystack hosted checkout redirect (if applicable)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const returnRef =
      urlParams.get("paystack_ref") ||
      urlParams.get("reference") ||
      urlParams.get("trxref");

    if (!returnRef) return;

    const pendingRaw = sessionStorage.getItem(`pending_order_${handle}`);
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        setLoading(true);
        setOrderProcessingState("verifying");
        const verifyToast = toast.loading("Verifying your payment with Paystack...");

        apiPost<any>(`/storefront/${handle}/orders`, {
          ...pending.payload,
          paymentReference: returnRef,
        })
          .then((orderRes) => {
            toast.dismiss(verifyToast);
            toast.success("Payment confirmed! Your order has been placed.");
            sessionStorage.removeItem(`pending_order_${handle}`);
            clearCart();
            setConfirmedOrder({
              orderId: orderRes?.orderId || orderRes?._id || "CONFIRMED",
              totalAmount: pending.payload.totalAmount || getTotalPrice(),
              paymentReference: returnRef,
              customerName: pending.payload.customerName,
              customerPhone: pending.payload.customerPhone,
              deliveryAddress: pending.payload.deliveryAddress,
              items: pending.payload.items,
            });
            setOrderProcessingState("success");
            window.history.replaceState({}, "", window.location.pathname);
          })
          .catch((err) => {
            toast.dismiss(verifyToast);
            toast.error(err.message || "Failed to confirm payment reference");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (e) {
        console.error("Failed to parse pending order:", e);
      }
    }
  }, [handle, getTotalPrice, clearCart]);

  const itemsSubtotal = getTotalPrice();
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const grandTotal = Math.max(0, itemsSubtotal - discountAmount + selectedDeliveryFee);

  const deliveryRates = vendorData?.storefrontSettings?.deliveryRates || [];
  const accentColor = vendorData?.storefrontSettings?.accentColor || "#E11D48";
  const whatsappPhone = vendorData?.socials?.whatsapp || vendorData?.phone;

  // Handle State Change & Delivery Fee
  const handleStateChange = (stateName: string) => {
    const rate = deliveryRates.find(
      (r: any) => r.state.toLowerCase() === stateName.toLowerCase()
    );
    setFormData((prev) => ({ ...prev, state: stateName }));
    setSelectedDeliveryFee(rate ? rate.fee : 0);
    if (errors.state) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.state;
        return next;
      });
    }
  };

  // Validate & Apply Coupon Code
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setApplyingCoupon(true);
    try {
      const res = await apiPost<any>(`/storefront/${handle}/validate-coupon`, {
        code: couponInput.trim(),
        subtotal: itemsSubtotal,
      });

      if (res) {
        setAppliedDiscount({
          code: res.code,
          type: res.type,
          value: res.value,
          discountAmount: res.discountAmount,
        });
        toast.success(`Coupon "${res.code}" applied! Saved ${formatCurrency(res.discountAmount)}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponInput("");
    toast.success("Coupon removed");
  };

  // Step 1 Validation -> Proceed to Payment Step
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone / WhatsApp number is required";
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        newErrors.phone = "Please enter a valid phone number (at least 10 digits)";
      }
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address (e.g. name@domain.com)";
      }
    }

    if (!formData.street.trim()) {
      newErrors.street = "Street address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (deliveryRates.length > 0 && !formData.state.trim()) {
      newErrors.state = "Please select a delivery state";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required delivery details");
      return;
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2 Submission (WhatsApp or Paystack)
  const handleCompleteOrder = async () => {
    if (loading) return;

    if (items.length === 0) {
      toast.error("Your shopping bag is empty");
      return;
    }

    setLoading(true);

    // Clean & validate email for Paystack and backend
    const cleanPhoneDigits = formData.phone.replace(/\D/g, "");
    const emailCandidate = formData.email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate);
    const sanitizedEmail = isValidEmail
      ? emailCandidate
      : `customer_${cleanPhoneDigits || Date.now()}@tryvendra.ng`;

    const payload = {
      customerName: formData.name.trim(),
      customerPhone: formData.phone.trim(),
      customerEmail: sanitizedEmail,
      deliveryAddress: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
      },
      deliveryFee: selectedDeliveryFee,
      paymentMethod,
      couponCode: appliedDiscount?.code || "",
      notes: formData.notes.trim(),
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    if (paymentMethod === "paystack") {
      setOrderProcessingState("launching_paystack");

      const paystackKey =
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        "pk_test_c4b2eb84f0a0f617c83c345b25ba357a5169a821";

      const amountInKobo = Math.round(Number(grandTotal) * 100);

      if (amountInKobo <= 0) {
        toast.error("Order total must be greater than zero");
        setLoading(false);
        setOrderProcessingState("idle");
        return;
      }

      // Ensure Paystack inline script is ready
      let isReady = typeof window !== "undefined" && Boolean(window.PaystackPop);
      if (!isReady) {
        setOrderProcessingState("launching_paystack");
        isReady = await loadPaystackScript();
      }

      if (!isReady || !window.PaystackPop) {
        // Fallback: If inline popup script failed to load (blocked by adblocker / privacy extension),
        // try backend initialization with hosted redirect fallback
        toast("Paystack popup unavailable. Connecting to secure hosted gateway...");
        try {
          const initRes = await apiPost<any>(`/storefront/${handle}/initialize-paystack`, {
            ...payload,
            amount: grandTotal,
          });

          if (initRes?.authorization_url) {
            sessionStorage.setItem(
              `pending_order_${handle}`,
              JSON.stringify({ payload, reference: initRes.reference, totalAmount: grandTotal })
            );
            window.location.href = initRes.authorization_url;
            return;
          }
        } catch (initErr) {
          console.error("Paystack server init fallback error:", initErr);
        }

        toast.error(
          "Could not initialize Paystack popup (often blocked by ad blockers or privacy extensions). Please try WhatsApp checkout or disable blockers."
        );
        setLoading(false);
        setOrderProcessingState("idle");
        return;
      }

      const transactionRef = `VEN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      try {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: sanitizedEmail,
          amount: amountInKobo,
          currency: "NGN",
          ref: transactionRef,
          metadata: {
            custom_fields: [
              { display_name: "Customer Name", variable_name: "customer_name", value: formData.name },
              { display_name: "Customer Phone", variable_name: "customer_phone", value: formData.phone },
              { display_name: "Store Handle", variable_name: "store_handle", value: handle },
            ],
          },
          callback: async (response: any) => {
            setOrderProcessingState("verifying");
            try {
              const res = await apiPost<any>(`/storefront/${handle}/orders`, {
                ...payload,
                paymentReference: response.reference || transactionRef,
              });

              clearCart();
              toast.success("Payment successful! Your order has been placed.");
              setConfirmedOrder({
                orderId: res?.orderId || res?._id || "CONFIRMED",
                totalAmount: grandTotal,
                paymentReference: response.reference || transactionRef,
                customerName: formData.name,
                customerPhone: formData.phone,
                deliveryAddress: payload.deliveryAddress,
                items: [...items],
              });
              setOrderProcessingState("success");
            } catch (err: any) {
              toast.error(
                err.message ||
                  "Payment confirmed, but failed to save order record. Please contact the boutique with reference: " +
                    (response.reference || transactionRef)
              );
              setOrderProcessingState("idle");
            } finally {
              setLoading(false);
            }
          },
          onClose: () => {
            setLoading(false);
            setOrderProcessingState("idle");
            toast("Payment window closed");
          },
        });

        if (!handler || typeof handler.openIframe !== "function") {
          throw new Error("Paystack popup could not be initialized");
        }

        handler.openIframe();
        setOrderProcessingState("awaiting_payment");
      } catch (popupErr: any) {
        console.error("[Paystack Setup Error]", popupErr);
        toast.error(popupErr.message || "Failed to open Paystack payment modal.");

        // Attempt hosted checkout redirect as fallback
        try {
          const initRes = await apiPost<any>(`/storefront/${handle}/initialize-paystack`, {
            ...payload,
            amount: grandTotal,
          });

          if (initRes?.authorization_url) {
            sessionStorage.setItem(
              `pending_order_${handle}`,
              JSON.stringify({ payload, reference: initRes.reference, totalAmount: grandTotal })
            );
            window.location.href = initRes.authorization_url;
            return;
          }
        } catch {
          // Fallback failed
        }

        setLoading(false);
        setOrderProcessingState("idle");
      }
    } else {
      // Order via WhatsApp Flow
      try {
        const orderRes = await apiPost<any>(`/storefront/${handle}/orders`, payload);

        // Build comprehensive WhatsApp order dispatch message
        const orderLines = items
          .map(
            (i) =>
              `• ${i.name} (${i.variantLabel}) x${i.quantity} — ${formatCurrency(
                i.price * i.quantity
              )}`
          )
          .join("\n");

        const discountLine = appliedDiscount
          ? `\n🎟️ Coupon: ${appliedDiscount.code} (-${formatCurrency(discountAmount)})`
          : "";
        const deliveryLine =
          selectedDeliveryFee > 0
            ? `\n🚚 Delivery Fee: ${formatCurrency(selectedDeliveryFee)}`
            : "\n🚚 Delivery: Calculated at confirmation";

        const message = `Hello ${vendorData?.businessName || "Store"}!\nI just placed an order on your storefront:\n\n${orderLines}${discountLine}${deliveryLine}\n*Grand Total: ${formatCurrency(
          grandTotal
        )}*\n\n👤 *Customer Details:*\nName: ${formData.name}\nPhone: ${formData.phone}${
          formData.email ? `\nEmail: ${formData.email}` : ""
        }\n\n📍 *Delivery Address:*\n${formData.street}, ${formData.city}${
          formData.state ? `, ${formData.state}` : ""
        }${formData.notes ? `\n\n📝 *Notes:* ${formData.notes}` : ""}`;

        clearCart();
        toast.success("Order placed successfully! Redirecting to WhatsApp...");

        if (whatsappPhone) {
          const cleanPhone = whatsappPhone.replace(/\D/g, "");
          const formattedPhone = cleanPhone.startsWith("0")
            ? `234${cleanPhone.slice(1)}`
            : cleanPhone;
          window.location.href = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
            message
          )}`;
        } else {
          setConfirmedOrder({
            orderId: orderRes?.orderId || orderRes?._id || "CONFIRMED",
            totalAmount: grandTotal,
            customerName: formData.name,
            customerPhone: formData.phone,
            deliveryAddress: payload.deliveryAddress,
            items: [...items],
          });
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to place order. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // ── ORDER CONFIRMED VIEW ──────────────────────────────────────────
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-10 shadow-sm space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div
            className="size-16 rounded-full flex items-center justify-center mx-auto shadow-sm"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            <Check size={32} strokeWidth={2.5} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 block">
              ✓ Payment & Order Confirmed
            </span>
            <h1 className="text-3xl font-serif font-bold text-gray-950">
              Thank You for Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Your order has been safely placed with{" "}
              <strong className="text-gray-900">{vendorData?.businessName || "the boutique"}</strong>.
              We'll prepare your pieces with utmost care.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-stone-50 rounded-2xl p-5 text-left space-y-3 text-xs border border-stone-200/60">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
              <span className="text-stone-500 font-medium">Order Number:</span>
              <span className="font-mono font-bold text-gray-900">
                #{String(confirmedOrder.orderId).slice(-6).toUpperCase()}
              </span>
            </div>

            {confirmedOrder.paymentReference && (
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
                <span className="text-stone-500 font-medium">Payment Ref:</span>
                <span className="font-mono text-stone-700 text-[11px]">
                  {confirmedOrder.paymentReference}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-stone-200/70">
              <span className="text-stone-500 font-medium">Customer:</span>
              <span className="font-semibold text-gray-900">
                {confirmedOrder.customerName} ({confirmedOrder.customerPhone})
              </span>
            </div>

            {confirmedOrder.deliveryAddress?.street && (
              <div className="flex justify-between items-start pb-2 border-b border-stone-200/70">
                <span className="text-stone-500 font-medium">Delivery:</span>
                <span className="text-right font-medium text-stone-800 max-w-[65%]">
                  {confirmedOrder.deliveryAddress.street}, {confirmedOrder.deliveryAddress.city}
                  {confirmedOrder.deliveryAddress.state ? `, ${confirmedOrder.deliveryAddress.state}` : ""}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 text-sm font-bold text-gray-950">
              <span>Amount Paid:</span>
              <span style={{ color: accentColor }}>
                {formatCurrency(confirmedOrder.totalAmount)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {whatsappPhone && (
              <a
                href={`https://wa.me/${
                  whatsappPhone.replace(/\D/g, "").startsWith("0")
                    ? `234${whatsappPhone.replace(/\D/g, "").slice(1)}`
                    : whatsappPhone.replace(/\D/g, "")
                }?text=${encodeURIComponent(
                  `Hello ${vendorData?.businessName || "Store"}! I just placed Order #${String(
                    confirmedOrder.orderId
                  ).slice(-6).toUpperCase()}${
                    confirmedOrder.paymentReference ? ` (Ref: ${confirmedOrder.paymentReference})` : ""
                  } for ${formatCurrency(confirmedOrder.totalAmount)}. Looking forward to confirmation!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                <MessageCircle size={16} />
                <span>Message Boutique</span>
              </a>
            )}

            <Link
              href={`/store/${handle}`}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-3xl font-serif font-bold text-gray-950">Your bag is empty</h2>
        <p className="text-sm text-stone-500">
          Explore our collection and add pieces to your bag to proceed with checkout.
        </p>
        <div className="pt-2">
          <Link
            href={`/store/${handle}`}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-gray-950 text-white font-medium text-xs sm:text-sm hover:bg-stone-800 transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* ── Stepper Header & Breadcrumbs ──────────────────────── */}
      <div className="border-b border-stone-200/80 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
          {/* Stepper */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!loading) setStep("details");
              }}
              className={`flex items-center gap-2 transition-colors ${
                step === "details" ? "text-gray-950 font-bold" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <span
                className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "details"
                    ? "text-white"
                    : "bg-stone-200 text-stone-600"
                }`}
                style={step === "details" ? { backgroundColor: accentColor } : {}}
              >
                1
              </span>
              <span>Details</span>
            </button>

            <span className="text-stone-300">/</span>

            <button
              type="button"
              disabled={step === "details"}
              className={`flex items-center gap-2 transition-colors ${
                step === "payment" ? "text-gray-950 font-bold" : "text-stone-400"
              }`}
            >
              <span
                className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "payment"
                    ? "text-white"
                    : "bg-stone-200 text-stone-600"
                }`}
                style={step === "payment" ? { backgroundColor: accentColor } : {}}
              >
                2
              </span>
              <span>Payment</span>
            </button>
          </div>

          {/* Secure Checkout Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-stone-500 font-medium normal-case text-xs">
            <Shield size={14} className="text-stone-400" />
            <span>256-bit Encrypted Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16 items-start">
          {/* ── Left Column: Form Steps ───────────────────────── */}
          <div className="lg:col-span-7 space-y-8">
            {step === "details" ? (
              /* ── STEP 1: DETAILS ────────────────────────────── */
              <form onSubmit={handleProceedToPayment} className="space-y-8">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                    ── SECURE CHECKOUT
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950 tracking-tight">
                    Your <span className="italic font-normal font-serif" style={{ color: accentColor }}>Details</span>
                  </h1>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h2 className="text-sm font-serif font-bold text-gray-900 border-b border-stone-200 pb-2">
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        placeholder="Ada Obi"
                        value={formData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className={`w-full bg-transparent border-b py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors ${
                          errors.name
                            ? "border-rose-500"
                            : "border-stone-300 focus:border-stone-900"
                        }`}
                      />
                      {errors.name && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        EMAIL ADDRESS (OPTIONAL)
                      </label>
                      <input
                        type="email"
                        placeholder="hello@example.com"
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className={`w-full bg-transparent border-b py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors ${
                          errors.email
                            ? "border-rose-500"
                            : "border-stone-300 focus:border-stone-900"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        PHONE NUMBER (WHATSAPP) *
                      </label>
                      <input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        className={`w-full bg-transparent border-b py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors ${
                          errors.phone
                            ? "border-rose-500"
                            : "border-stone-300 focus:border-stone-900"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-4 pt-4">
                  <h2 className="text-sm font-serif font-bold text-gray-900 border-b border-stone-200 pb-2">
                    Delivery Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        STREET ADDRESS *
                      </label>
                      <input
                        type="text"
                        placeholder="12 Bourdillon Road, Ikoyi"
                        value={formData.street}
                        onChange={(e) => handleFieldChange("street", e.target.value)}
                        className={`w-full bg-transparent border-b py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors ${
                          errors.street
                            ? "border-rose-500"
                            : "border-stone-300 focus:border-stone-900"
                        }`}
                      />
                      {errors.street && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{errors.street}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                          CITY *
                        </label>
                        <input
                          type="text"
                          placeholder="Lagos"
                          value={formData.city}
                          onChange={(e) => handleFieldChange("city", e.target.value)}
                          className={`w-full bg-transparent border-b py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors ${
                            errors.city
                              ? "border-rose-500"
                              : "border-stone-300 focus:border-stone-900"
                          }`}
                        />
                        {errors.city && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{errors.city}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                          STATE {deliveryRates.length > 0 ? "*" : "(OPTIONAL)"}
                        </label>
                        {deliveryRates.length > 0 ? (
                          <select
                            value={formData.state}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className={`w-full bg-transparent border-b py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors ${
                              errors.state
                                ? "border-rose-500"
                                : "border-stone-300 focus:border-stone-900"
                            }`}
                          >
                            <option value="">Select Delivery State</option>
                            {deliveryRates.map((r: any) => (
                              <option key={r.state} value={r.state}>
                                {r.state} {r.fee > 0 ? `(+${formatCurrency(r.fee)})` : "(Free)"}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Lagos State"
                            value={formData.state}
                            onChange={(e) => handleFieldChange("state", e.target.value)}
                            className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900 py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors"
                          />
                        )}
                        {errors.state && (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{errors.state}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Note */}
                <div className="space-y-4 pt-4">
                  <h2 className="text-sm font-serif font-bold text-gray-900 border-b border-stone-200 pb-2">
                    Order Note <span className="font-normal text-stone-400">(optional)</span>
                  </h2>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      SPECIAL INSTRUCTIONS, SIZE NOTES, ETC.
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please make in a size 12 with the green colorway."
                      value={formData.notes}
                      onChange={(e) => handleFieldChange("notes", e.target.value)}
                      className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900 py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-98"
                    style={{ backgroundColor: accentColor || "#111827" }}
                  >
                    <span>CONTINUE TO PAYMENT</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            ) : (
              /* ── STEP 2: PAYMENT ────────────────────────────── */
              <div className="space-y-8">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                    ── SECURE CHECKOUT
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950 tracking-tight">
                    Choose <span className="italic font-normal font-serif" style={{ color: accentColor }}>Payment</span>
                  </h1>
                </div>

                {/* Delivering To Box with Edit */}
                <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-1 relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    DELIVERING TO
                  </span>
                  <p className="text-sm font-semibold text-gray-950">
                    {formData.name} — {formData.street}, {formData.city}
                    {formData.state ? `, ${formData.state}` : ""}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formData.email ? `${formData.email} • ` : ""}
                    {formData.phone}
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setStep("details")}
                    className="absolute right-5 top-5 text-xs font-bold hover:underline disabled:opacity-50"
                    style={{ color: accentColor }}
                  >
                    Edit
                  </button>
                </div>

                {/* Payment Selection Options */}
                <div className="space-y-4">
                  <h3 className="text-sm font-serif font-bold text-gray-900">
                    How would you like to pay?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: WhatsApp Checkout */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setPaymentMethod("whatsapp")}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between space-y-3 disabled:opacity-60 ${
                        paymentMethod === "whatsapp"
                          ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-white/80 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                          <MessageCircle size={20} />
                        </div>
                        {paymentMethod === "whatsapp" && (
                          <span className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-gray-950 text-base">
                          Order via WhatsApp
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          Send your order directly to our team. We'll confirm availability and process your order personally.
                        </p>
                      </div>
                    </button>

                    {/* Option 2: Paystack Checkout */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setPaymentMethod("paystack")}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between space-y-3 disabled:opacity-60 ${
                        paymentMethod === "paystack"
                          ? "bg-white shadow-xs"
                          : "bg-white/80 border-stone-200 hover:border-stone-300"
                      }`}
                      style={
                        paymentMethod === "paystack"
                          ? {
                              borderColor: accentColor,
                              boxShadow: `0 0 0 2px ${accentColor}33`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="size-10 rounded-xl flex items-center justify-center border"
                          style={{
                            backgroundColor: `${accentColor}18`,
                            color: accentColor,
                            borderColor: `${accentColor}40`,
                          }}
                        >
                          <CreditCard size={20} />
                        </div>
                        {paymentMethod === "paystack" && (
                          <span
                            className="size-5 rounded-full text-white flex items-center justify-center text-[10px]"
                            style={{ backgroundColor: accentColor }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-gray-950 text-base">
                          Pay with Paystack
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          Secure online payment. Supports Debit/Credit Cards, Bank Transfer, USSD, and Apple Pay.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Privacy & Guarantee note */}
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <Shield size={14} className="text-stone-400 shrink-0" />
                  <span>
                    Your payment information is processed through secure 256-bit SSL encryption.
                  </span>
                </div>

                {/* Final Checkout Button & Action Container */}
                <div className="pt-2 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      disabled={loading && orderProcessingState === "verifying"}
                      onClick={() => {
                        if (loading) {
                          setLoading(false);
                          setOrderProcessingState("idle");
                        } else {
                          setStep("details");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-4 px-6 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors"
                    >
                      <ArrowLeft size={14} />
                      <span>{loading ? "Cancel" : "Back"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCompleteOrder}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-75 active:scale-98"
                      style={{
                        backgroundColor: paymentMethod === "paystack" ? (accentColor || "#111827") : "#111827",
                      }}
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2.5">
                          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>
                            {orderProcessingState === "launching_paystack"
                              ? "CONNECTING TO PAYSTACK..."
                              : orderProcessingState === "awaiting_payment"
                              ? "PAYMENT WINDOW ACTIVE..."
                              : orderProcessingState === "verifying"
                              ? "CONFIRMING ORDER..."
                              : "PROCESSING ORDER..."}
                          </span>
                        </span>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "paystack"
                              ? `PAY ${formatCurrency(grandTotal)} VIA PAYSTACK`
                              : "PLACE ORDER VIA WHATSAPP"}
                          </span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Watchdog / Reset Banner when Paystack popup is active */}
                  {loading && orderProcessingState === "awaiting_payment" && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-amber-700 shrink-0" />
                        <span>Complete your card/transfer payment in the Paystack window.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLoading(false);
                          setOrderProcessingState("idle");
                          toast("Checkout reset. You can try again or place order via WhatsApp.");
                        }}
                        className="font-bold underline text-amber-950 hover:text-amber-800 text-left sm:text-right"
                      >
                        Reset / Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Sticky Order Summary ─────────────── */}
          <div className="lg:col-span-5 mt-12 lg:mt-0 sticky top-24">
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                  ── YOUR SELECTION
                </span>
                <h2 className="text-2xl font-serif font-bold text-gray-950">
                  Order Summary
                </h2>
              </div>

              {/* Items List */}
              <ul className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId}`}
                    className="py-4 flex items-center gap-4 group"
                  >
                    <div className="size-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200/80">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                          Piece
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-sm text-gray-950 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-stone-500 truncate">
                        {item.variantLabel} • Qty {item.quantity}
                      </p>
                      <p className="text-xs font-bold text-gray-900 mt-1">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-1.5 text-stone-300 hover:text-rose-600 transition-colors disabled:opacity-40"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Promo Coupon Box */}
              <div className="pt-2 border-t border-stone-100">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <Tag size={13} />
                      <span>{appliedDiscount.code} (-{formatCurrency(discountAmount)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-stone-400 hover:text-rose-600 font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs uppercase font-medium outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-stone-400 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="py-2 px-4 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-stone-800 transition-colors disabled:opacity-40"
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </button>
                  </form>
                )}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2.5 pt-2 border-t border-stone-100 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>SUBTOTAL</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(itemsSubtotal)}
                  </span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>DISCOUNT ({appliedDiscount.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>SHIPPING</span>
                  <span>
                    {selectedDeliveryFee > 0
                      ? formatCurrency(selectedDeliveryFee)
                      : "Calculated at confirmation"}
                  </span>
                </div>

                <div className="pt-3 border-t border-stone-100 flex justify-between text-base sm:text-lg font-serif font-bold text-gray-950">
                  <span>TOTAL</span>
                  <span style={{ color: accentColor }}>
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-stone-400 leading-relaxed pt-2 border-t border-stone-100">
                All pieces are handcrafted in Lagos. Delivery timelines will be confirmed after your order is received.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
