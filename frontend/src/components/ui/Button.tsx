// import * as React from "react"
// import { cva, type VariantProps } from "class-variance-authority"
// import { Slot } from "radix-ui"

// import { cn } from "@/lib/utils"

// const buttonVariants = cva(
//   "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//   {
//     variants: {
//       variant: {
//         default: "bg-primary text-primary-foreground hover:bg-primary/80",
//         outline:
//           "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
//         secondary:
//           "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
//         ghost:
//           "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
//         destructive:
//           "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default:
//           "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
//         xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
//         sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
//         lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
//         icon: "size-9",
//         "icon-xs":
//           "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
//         "icon-sm":
//           "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
//         "icon-lg": "size-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )

// function Button({
//   className,
//   variant = "default",
//   size = "default",
//   asChild = false,
//   ...props
// }: React.ComponentProps<"button"> &
//   VariantProps<typeof buttonVariants> & {
//     asChild?: boolean
//   }) {
//   const Comp = asChild ? Slot.Root : "button"

//   return (
//     <Comp
//       data-slot="button"
//       data-variant={variant}
//       data-size={size}
//       className={cn(buttonVariants({ variant, size, className }))}
//       {...props}
//     />
//   )
// }

// export { Button, buttonVariants }

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
