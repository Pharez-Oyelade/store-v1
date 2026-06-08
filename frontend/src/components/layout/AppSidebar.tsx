"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Store,
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  ChartColumnIncreasing,
} from "lucide-react";
import { NavMain } from "../nav-main";
import { Separator } from "../ui/separator";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Products",
      url: "#",
      icon: Package,
    },

    {
      title: "Orders",
      url: "#",
      icon: ClipboardList,
    },

    {
      title: "Customers",
      url: "#",
      icon: Users,
    },

    {
      title: "Analytics",
      url: "#",
      icon: ChartColumnIncreasing,
    },

    {
      title: "Storefront",
      url: "#",
      icon: Store,
    },
  ],
};

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Store />
        <h1>Vendra</h1>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
