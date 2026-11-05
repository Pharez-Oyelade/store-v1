"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 300);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const handleScrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-700 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-600 motion-reduce:transition-none ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp aria-hidden="true" className="size-5 text-white" />
    </button>
  );
};

export default ScrollToTop;
