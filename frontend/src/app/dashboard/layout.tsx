import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <TooltipProvider> */}
      {/* <SidebarProvider> */}
      {/* <AppSidebar /> */}
      <main className="flex gap-10">
        {/* <SidebarTrigger /> */}
        <DashboardSidebar />
        {children}
      </main>
      {/* </SidebarProvider> */}
      {/* </TooltipProvider> */}
    </>
  );
}
