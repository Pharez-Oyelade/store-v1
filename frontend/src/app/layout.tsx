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
    "Practice project for Vendra, an e-commerce platform for vendors to manage their products and orders.",
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
