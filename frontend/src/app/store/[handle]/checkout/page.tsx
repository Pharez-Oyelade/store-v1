"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency, buildWhatsAppLink } from "@/lib/utils";
import { apiPost } from "@/lib/api";

export default function StorefrontCheckout({ params }: { params: Promise<{ handle: string }> }) {
  const unwrappedParams = use(params);
  const handle = unwrappedParams.handle;
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <button
          onClick={() => router.push(`/store/${handle}`)}
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          &larr; Continue shopping
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        notes: formData.notes,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        }))
      };

      // 1. Submit the order to our new public endpoint
      await apiPost(`/storefront/${handle}/orders`, payload);

      // 2. Fetch the vendor's WhatsApp number to redirect the customer
      // Ideally, the layout passed this down or we fetch it. We will fetch it quickly.
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
      const vendorRes = await fetch(`${apiUrl}/storefront/${handle}`);
      const vendorData = await vendorRes.json();
      const whatsappPhone = vendorData.data.socials?.whatsapp || vendorData.data.phone;

      // 3. Build the WhatsApp message
      const orderLines = items.map(i => `${i.name} (${i.variantLabel}) x${i.quantity} - ${formatCurrency(i.price * i.quantity)}`).join('%0A');
      const message = `Hello ${vendorData.data.businessName}!%0AI just placed an order on your storefront:%0A%0A${orderLines}%0A%0A*Total: ${formatCurrency(getTotalPrice())}*%0A%0AMy Name: ${formData.name}%0APhone: ${formData.phone}`;
      
      clearCart();
      toast.success("Order placed successfully!");
      
      // 4. Redirect to WhatsApp
      if (whatsappPhone) {
        window.location.href = `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${message}`;
      } else {
        router.push(`/store/${handle}`);
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        
        {/* Order Summary */}
        <div className="lg:col-span-5 mb-10 lg:mb-0 order-2 lg:order-2">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex py-4">
                  <div className="flex-shrink-0 h-16 w-16 rounded-md border border-gray-200 overflow-hidden bg-white">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                    ) : (
                      <div className="h-full w-full bg-gray-100" />
                    )}
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.variantLabel}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <p className="text-gray-500">Qty {item.quantity}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between text-base font-bold text-gray-900">
                <p>Total</p>
                <p>{formatCurrency(getTotalPrice())}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-7 order-1 lg:order-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-3 px-4 border"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-3 px-4 border"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-3 px-4 border"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Delivery Address / Notes</label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-3 px-4 border"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-700 px-4 py-4 text-base font-medium text-white shadow-sm hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? "Processing..." : "Place Order via WhatsApp"}
              </button>
              <p className="mt-4 text-xs text-center text-gray-500">
                You will be redirected to WhatsApp to confirm your payment details with the vendor.
              </p>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}
