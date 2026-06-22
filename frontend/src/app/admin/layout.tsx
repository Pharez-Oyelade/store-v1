import type { Metadata } from "next";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: {
    template: "%s — Vendra Admin",
    default: "Vendra Admin",
  },
  description: "Vendra platform administration panel",
  robots: "noindex, nofollow", // Admin panel should never be indexed
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-[#0D1117]">
        {/* Sidebar — fixed width, full height */}
        <AdminSidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full px-6 pb-7 pt-16 md:px-8 lg:pt-7">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
