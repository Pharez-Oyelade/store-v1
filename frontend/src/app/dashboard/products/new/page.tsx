import { PageHeader } from "@/components/dashboard/DashboardPrimitives";
import ProductForm from "@/components/dashboard/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Add product"
        description="Create a product with variants so orders can track exact stock."
      />
      <ProductForm />
    </div>
  );
}
