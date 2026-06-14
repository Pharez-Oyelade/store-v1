import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-base lg:flex relative">
      <DashboardSidebar />

      {/* Top right floating actions (mobile & desktop) */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-8 z-40">
        <NotificationCenter />
      </div>

      <section className="min-w-0 flex-1 px-4 pb-10 pt-20 lg:px-8 lg:pt-12">
        {children}
      </section>
    </main>
  );
}
