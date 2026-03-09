import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string; // shown as a disabled first option
  containerClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helper,
      options,
      placeholder,
      containerClassName,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        {/* Wrapper for the select + chevron icon */}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 bg-white text-sm text-gray-900",
              "border rounded-md pl-3 pr-9 appearance-none", // appearance-none hides native arrow
              "transition-colors duration-150 outline-none cursor-pointer",
              "focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
              hasError
                ? "border-error-500 focus:ring-error-500"
                : "border-gray-300 hover:border-gray-400",
              "disabled:bg-gray-50 disabled:cursor-not-allowed",
              className,
            )}
            {...props}
          >
            {/* Placeholder option — disabled so user must pick a real one */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron icon replaces the hidden native arrow */}
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        {hasError && (
          <p className="text-xs text-error-600" role="alert">
            {error}
          </p>
        )}
        {!hasError && helper && (
          <p className="text-xs text-gray-500">{helper}</p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
export default Select;
