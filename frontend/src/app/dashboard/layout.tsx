import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-base lg:flex">
      <DashboardSidebar />
      <section className="min-w-0 flex-1 px-4 pb-10 pt-20 lg:px-8 lg:pt-8">
        {children}
      </section>
    </main>
  );
}
