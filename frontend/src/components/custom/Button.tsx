import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "small" | "medium" | "large" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// variant styles
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow:sm",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-gray-100 active:bg-gray-200 border border-brand-200",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200",
  danger:
    "bg-error-500 text-white hover:bg-error-600 active:bg-error-600 shadow:sm",
  outline:
    "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  small: "h-8 px-3 text-xs gap-1.5",
  medium: "h-10 px-4 text-sm gap-2",
  large: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
};

const Button = ({
  variant = "primary",
  size = "medium",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props //other button attributes (onClick, type)
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-md",
        "transition-all duration-150 ease-in-out",
        "focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}

      {children && <span>{children}</span>}

      {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
