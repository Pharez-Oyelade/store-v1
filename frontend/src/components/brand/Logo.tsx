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
  const isDark = theme === "dark";

  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 26
      : size === "md"
      ? 34
      : size === "lg"
      ? 46
      : size === "xl"
      ? 56
      : 34;

  // Solid, highly visible color palette (no fragile url(#id) gradient dependencies)
  const needleFill = "#FFFFFF";
  const needleStroke = isDark ? "#475569" : "#0F172A";
  const eyeFill = isDark ? "#0F172A" : "#0F172A";
  const threadColor = isDark ? "#34D399" : "#10B981"; // Luminous Emerald/Mint in Dark, Emerald in Light

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 block", className)}
      {...props}
    >
      {/* 1. LEFT ARM: Solid White Tailor's Needle */}
      <path
        d="M5.5 4.5 C4.8 3.2 7.2 2.0 8.5 2.8 L16.8 28.0 C17.1 29.0 16.0 29.5 15.3 28.5 L5.8 6.0 C5.6 5.5 5.5 5.0 5.5 4.5 Z"
        fill={needleFill}
        stroke={needleStroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* 2. NEEDLE EYE: Visible Hole */}
      <ellipse
        cx="7.0"
        cy="5.0"
        rx="0.9"
        ry="2.2"
        transform="rotate(-20 7.0 5.0)"
        fill={eyeFill}
      />

      {/* 3. THREAD TAIL: Left thread exiting eye */}
      <path
        d="M2.5 9.2 C2.0 6.2 4.5 5.0 6.8 4.8"
        stroke={threadColor}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* 4. RIGHT ARM: Bold Emerald Thread looping to complete the V */}
      <path
        d="M7.0 4.8 C10.0 4.2 16.5 6.5 21.0 5.5 C25.8 4.4 29.2 2.8 28.4 8.2 C27.2 14.5 21.5 15.2 19.5 20.8 L16.0 28.0"
        stroke={threadColor}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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
    <div className={cn("inline-flex items-center gap-3 select-none shrink-0", className)}>
      <VendraNeedleIcon size={iconPixelSize} theme={theme} />
      <span className={cn(textClasses, textColorClass, "font-sans font-bold tracking-tight flex items-center")}>
        <span>Ven</span>
        <span className={cn(draColorClass, "font-bold")}>dra</span>
      </span>
    </div>
  );
}
