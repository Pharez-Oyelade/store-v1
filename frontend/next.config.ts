import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://vendra-d480.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
