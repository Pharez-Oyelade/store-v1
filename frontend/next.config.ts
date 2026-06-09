import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://your-actual-app.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
