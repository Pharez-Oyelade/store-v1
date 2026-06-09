import { PageHeader } from "@/components/dashboard/DashboardPrimitives";
import OrderForm from "@/components/dashboard/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="New order"
        description="Record orders from Instagram, WhatsApp, calls, walk-ins or the storefront."
      />
      <OrderForm />
    </div>
  );
}
