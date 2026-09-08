import type { NextConfig } from "next";

const rawBackendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  (process.env.NEXT_PUBLIC_API_URL &&
  !process.env.NEXT_PUBLIC_API_URL.startsWith("/")
    ? process.env.NEXT_PUBLIC_API_URL
    : "") ||
  "https://vendra-d480.onrender.com";

const backendBaseUrl = rawBackendUrl
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
