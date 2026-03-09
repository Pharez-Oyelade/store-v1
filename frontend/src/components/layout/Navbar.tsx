"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useIsAuthenticated, useCurrentVendor } from "@/store/authStore";

const navLinks = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/pricing",
    label: "Pricing",
  },
  {
    href: "/about",
    label: "About",
  },
];

const Navbar = () => {
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const vendor = useCurrentVendor();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Detect scroll to add effecr
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // prevent body scrolling when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/80 backdrop-blur-md shadow-sm"
            : "bg-transparent",
        )}
      >
        <nav className="w-full px-5 md:px-15 flex items-center justify-between h-16">
          {/* lOGO */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-700 text-white">
              <Store size={18} />
            </span>
            <span>
              Sabi<span className="text-brand-700">Store</span>
            </span>
          </Link>

          {/* DESKTOP NAV + CTA */}
          <div className="flex items-center gap-5">
            <ul className="hidden md:flex items-center gap-5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "text-brand-400"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              <Button variant="primary" size="small">
                {isAuthenticated
                  ? vendor?.businessName || "Dashboard"
                  : "Get Started"}
              </Button>
            </Link>

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE NAV */}
      <div
        className={cn(
          "fixed inset-0 z-60 md:hidden",
          "transition-all duration-300",
          isMobileOpen ? "visible" : "invisible",
        )}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            isMobileOpen ? "opacity-100" : "opacity-0",
          )}
        />

        {/* panel */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-72 bg-white shadow-modal",
            "flex flex-col transform transition-transform duration-300 ease-out",
            isMobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
            <span className="font-bold text-lg text-gray-900">
              Sabi<span className="text-brand-700">Store</span>
            </span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 overflow-y-auto p-5 sapce-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium",
                  pathname === link.href
                    ? "text-brand-700 bg-brand-500"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bottom CTAs */}
          <div className="p-5 border-t border-gray-100 space-y-3">
            {isAuthenticated ? (
              <Button variant="primary" className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="w-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="primary" className="w-full">
                  <Link href="/register">Start Free →</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
