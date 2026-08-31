import type { Metadata } from "next";
import { Inter, Great_Vibes } from "next/font/google";
// Ignore missing type declarations for side-effect global CSS import
// TypeScript may complain about modules without declarations; this import is intentional.
// @ts-ignore
import "./globals.css";
import Providers from "@/components/Providers";

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
  title: {
    default: "Vendra — Your Ultimate E-commerce Solution",
    template: "%s | Vendra",
  },
  description:
    "Built for ready-to-wear boutiques, thrifts, and bespoke tailors who sew on demand",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/vendra-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/vendra-icon.svg",
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
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
