"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();

  const isActiveClassLink = (path: any) => {
    return pathname === path ? "bg-brand-100" : "";
  };

  const isActiveClassIcon = (path: any) => {
    return pathname === path ? "text-brand-600" : "text-primary";
  };

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}

      <SidebarMenu className="py-5">
        {items.map((item) => {
          const isActive = pathname === item.url;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className={`px-5 py-6`}>
                <Link
                  className={`${isActiveClassLink(item.url)} hover:bg-brand-100 hover:text-brand-500`}
                  href={item.url}
                >
                  {item.icon && (
                    <item.icon className={` ${isActiveClassIcon(item.url)} `} />
                  )}
                  <span className="text-[16px]">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
