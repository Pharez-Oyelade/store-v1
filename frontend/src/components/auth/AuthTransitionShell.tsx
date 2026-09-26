"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const springTransition = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
  mass: 0.9,
};

export default function AuthTransitionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const isSplitAuth = isLogin || isRegister;

  // On non-split auth pages (e.g. forgot-password, reset-password), render children directly
  if (!isSplitAuth) {
    return <>{children}</>;
  }

  const isRegisterState = isRegister;
  const effectiveIsMobile = mounted ? isMobile : false;

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      {/* Sliding Image Panel (Desktop only) */}
      <motion.div
        className="hidden md:block absolute top-0 bottom-0 left-0 w-1/2 h-full z-20 overflow-hidden shadow-2xl"
        initial={false}
        animate={{
          x: isRegisterState ? "100%" : "0%",
        }}
        transition={springTransition}
      >
        <Image
          src="/auth-image.webp"
          alt="Precision tailoring atelier"
          fill
          priority
          sizes="50vw"
          className="object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="absolute bottom-10 left-8 right-8 z-10 text-white">
          <p className="text-xl font-semibold tracking-wide">
            <span className="text-4xl leading-none font-serif">“</span>Precision
            is the new Aesthetic
          </p>
          <p className="text-xs text-white/70 mt-1 uppercase tracking-wider font-medium">
            Vendra Fashion Store Management
          </p>
        </div>
      </motion.div>

      {/* Form Panel (Slides on Desktop, static full-width on Mobile) */}
      <motion.div
        className="w-full md:w-1/2 h-full absolute top-0 bottom-0 left-0 md:left-1/2 z-10 overflow-y-auto flex items-center justify-center p-4 sm:p-8"
        initial={false}
        animate={{
          x: effectiveIsMobile ? "0%" : isRegisterState ? "-100%" : "0%",
        }}
        transition={springTransition}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: isRegisterState ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRegisterState ? 20 : -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md mx-auto my-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
