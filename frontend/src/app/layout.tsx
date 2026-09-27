import type { Metadata } from "next";
import { Inter, Great_Vibes } from "next/font/google";
// Ignore missing type declarations for side-effect global CSS import
// TypeScript may complain about modules without declarations; this import is intentional.
// @ts-ignore
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.tryvendra.ng"),
  title: {
    default: "Vendra - Your Ultimate E-commerce Solution",
    template: "%s | Vendra",
  },
  description:
    "Built for ready-to-wear boutiques, thrifts, and bespoke tailors who sew on demand",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/vendra-icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Vendra",
    title: "Vendra - Your Ultimate E-commerce Solution",
    description: "Built for ready-to-wear boutiques, thrifts, and bespoke tailors who sew on demand",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Vendra" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendra",
    description: "Built for ready-to-wear boutiques, thrifts, and bespoke tailors who sew on demand",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${greatVibes.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
