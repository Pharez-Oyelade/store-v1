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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiPost, apiGet } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";

export default function StorefrontCheckout({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const unwrappedParams = use(params);
  const handle = unwrappedParams.handle;
  const router = useRouter();

  const { items, getTotalPrice, removeItem, clearCart } = useCartStore();

  const [step, setStep] = useState<"details" | "payment">("details");
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);

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

  // Load Paystack Inline JS Script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.street.trim()) {
      toast.error("Please enter your street delivery address");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return;
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2 Submission (WhatsApp or Paystack)
  const handleCompleteOrder = async () => {
    setLoading(true);

    const payload = {
      customerName: formData.name.trim(),
      customerPhone: formData.phone.trim(),
      customerEmail: formData.email.trim(),
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
      // Initialize Paystack Inline Popup
      const paystackKey =
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        "pk_test_c4b2eb84f0a0f617c83c345b25ba357a5169a821";

      if (!window.PaystackPop) {
        toast.error("Paystack checkout is loading. Please try again in a moment.");
        setLoading(false);
        return;
      }

      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: formData.email.trim() || `${formData.phone.replace(/\D/g, "")}@customer.vendra.ng`,
        amount: grandTotal * 100, // in kobo
        currency: "NGN",
        ref: `VEN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: formData.name },
            { display_name: "Store", variable_name: "store_handle", value: handle },
          ],
        },
        callback: async (response: any) => {
          try {
            await apiPost(`/storefront/${handle}/orders`, {
              ...payload,
              paymentReference: response.reference,
            });

            clearCart();
            toast.success("Payment successful! Your order has been placed.");
            router.push(`/store/${handle}`);
          } catch (err: any) {
            toast.error(err.message || "Failed to finalize order. Contact the boutique.");
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          setLoading(false);
          toast("Payment cancelled");
        },
      });

      handler.openIframe();
    } else {
      // Order via WhatsApp Flow
      try {
        await apiPost(`/storefront/${handle}/orders`, payload);

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
          router.push(`/store/${handle}`);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to place order. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

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
              onClick={() => setStep("details")}
              className={`transition-colors ${
                step === "details"
                  ? "text-gray-950 font-bold border-b-2 border-gray-950 pb-0.5"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              DETAILS
            </button>
            <span className="text-stone-300">──</span>
            <button
              type="button"
              onClick={() => {
                if (formData.name && formData.phone && formData.street && formData.city) {
                  setStep("payment");
                }
              }}
              className={`transition-colors ${
                step === "payment"
                  ? "text-gray-950 font-bold border-b-2 border-gray-950 pb-0.5"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              PAYMENT
            </button>
          </div>

          {/* Shop Breadcrumb */}
          <Link
            href={`/store/${handle}`}
            className="text-stone-500 hover:text-stone-900 flex items-center gap-1 normal-case font-medium text-xs transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Shop</span>
          </Link>
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
                    Your <span className="italic font-normal font-serif text-pink-600">Details</span>
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
                        required
                        placeholder="Ada Obi"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        EMAIL ADDRESS (OPTIONAL)
                      </label>
                      <input
                        type="email"
                        placeholder="hello@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                        PHONE NUMBER (WHATSAPP) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+234 800 000 0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
                      />
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
                        required
                        placeholder="12 Bourdillon Road, Ikoyi"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                          CITY *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Lagos"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                          STATE (OPTIONAL)
                        </label>
                        {deliveryRates.length > 0 ? (
                          <select
                            value={formData.state}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
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
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors"
                          />
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
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-transparent border-b border-stone-300 focus:border-gray-950 py-2.5 text-sm focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-98"
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
                    Choose <span className="italic font-normal font-serif text-pink-600">Payment</span>
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
                    onClick={() => setStep("details")}
                    className="absolute right-5 top-5 text-xs font-bold text-brand-700 hover:underline"
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
                      onClick={() => setPaymentMethod("whatsapp")}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
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
                      onClick={() => setPaymentMethod("paystack")}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
                        paymentMethod === "paystack"
                          ? "bg-white border-pink-500 ring-2 ring-pink-500/20 shadow-xs"
                          : "bg-white/80 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="size-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-200/60">
                          <CreditCard size={20} />
                        </div>
                        {paymentMethod === "paystack" && (
                          <span className="size-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-gray-950 text-base">
                          Pay with Paystack
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          Secure card payment via Paystack. Supports Visa, Mastercard, Verve, and bank transfer.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Privacy & Guarantee note */}
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <Shield size={14} className="text-stone-400 shrink-0" />
                  <span>
                    Your information is only used to process your order. We never share your data with third parties.
                  </span>
                </div>

                {/* Final Checkout Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="inline-flex items-center justify-center gap-1.5 py-4 px-6 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCompleteOrder}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 active:scale-98"
                  >
                    <span>
                      {loading
                        ? "PROCESSING ORDER..."
                        : paymentMethod === "paystack"
                        ? `PAY ${formatCurrency(grandTotal)} VIA PAYSTACK`
                        : "PLACE ORDER VIA WHATSAPP"}
                    </span>
                    <ArrowRight size={15} />
                  </button>
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
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-1.5 text-stone-300 hover:text-rose-600 transition-colors"
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
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs uppercase font-medium focus:outline-none focus:ring-1 focus:ring-stone-400"
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
