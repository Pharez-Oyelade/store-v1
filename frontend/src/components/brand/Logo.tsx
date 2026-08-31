import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  theme?: "light" | "dark" | "auto";
}

export function VendraNeedleIcon({
  size = 32,
  className,
  theme = "auto",
  ...props
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <defs>
        {/* Needle Metallic Gradient */}
        <linearGradient id="needle-gradient" x1="20" y1="10" x2="60" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#CBD5E1" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Emerald Thread Gradient */}
        <linearGradient id="thread-gradient" x1="20" y1="20" x2="90" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="60%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        <filter id="thread-glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#10B981" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#thread-glow)">
        {/* Tailor's Sewing Needle (Left arm of V) */}
        {/* Needle shaft tapering to bottom point */}
        <path
          d="M26 18 C24 14 29 10 33 13 L53 82 C53.5 84 52.5 85 51 83 L27 24 C26.2 22 26 20 26 18 Z"
          fill="url(#needle-gradient)"
        />

        {/* Needle Eye Slot */}
        <ellipse cx="30" cy="22" rx="1.8" ry="5.5" transform="rotate(-18 30 22)" fill="#0F172A" opacity="0.8" />

        {/* Flowing Tailor's Thread (Threading through needle eye & creating right arm of V) */}
        {/* Left thread tail exiting eye */}
        <path
          d="M18 35 C17 26 23 23 29 22"
          stroke="url(#thread-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main thread loop through the eye, across top, looping into right arm of V */}
        <path
          d="M30 22 C38 21 54 28 66 26 C78 24 86 18 84 32 C82 44 68 45 62 58 L52 82"
          stroke="url(#thread-gradient)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default function Logo({
  variant = "full",
  size = "md",
  theme = "auto",
  className,
}: {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg" | "xl" | number;
  theme?: "light" | "dark" | "auto";
  className?: string;
}) {
  const iconPixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 26
      : size === "md"
      ? 34
      : size === "lg"
      ? 46
      : 60;

  const textClasses =
    typeof size === "number"
      ? "text-xl font-bold tracking-tight"
      : size === "sm"
      ? "text-lg font-bold tracking-tight"
      : size === "md"
      ? "text-xl font-bold tracking-tight"
      : size === "lg"
      ? "text-2xl font-bold tracking-tight"
      : "text-3xl font-extrabold tracking-tight";

  const textColorClass =
    theme === "dark"
      ? "text-white"
      : theme === "light"
      ? "text-slate-900"
      : "text-slate-900 dark:text-white";

  if (variant === "icon") {
    return <VendraNeedleIcon size={iconPixelSize} className={className} theme={theme} />;
  }

  const draColorClass =
    theme === "dark"
      ? "text-brand-400"
      : theme === "light"
      ? "text-brand-600"
      : "text-brand-600 dark:text-brand-400";

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <VendraNeedleIcon size={iconPixelSize} theme={theme} />
      <span className={cn(textClasses, textColorClass, "font-sans font-semibold tracking-[-0.02em] flex items-center")}>
        <span>Ven</span>
        <span className={cn(draColorClass, "font-bold")}>dra</span>
      </span>
    </div>
  );
}
