import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vendra - Storefront & Order Management",
    short_name: "Vendra",
    description:
      "Manage your storefront, track orders, and interact with customers seamlessly.",
    start_url: "/dashboard",
    id: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#1e3a8a",
    categories: ["business", "shopping", "productivity"],
    icons: [
      {
        src: "/vendra-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/vendra_dashboard(1).png",
        sizes: "1532x848",
        type: "image/png",
        form_factor: "wide",
        label: "Vendra Dashboard Overview",
      },
      {
        src: "/vendra_demand.png",
        sizes: "1576x797",
        type: "image/png",
        form_factor: "wide",
        label: "Vendra bespoke demand tailoring",
      },
      {
        src: "/vendra_analytics.png",
        sizes: "1576x797",
        type: "image/png",
        form_factor: "wide",
        label: "Vendra analytics dashboard",
      },
    ],
    shortcuts: [
      {
        name: "Orders",
        url: "/dashboard/orders",
        description: "View and manage customer orders",
      },
      {
        name: "Products",
        url: "/dashboard/products",
        description: "Manage store inventory and products",
      },
    ],
  };
}
