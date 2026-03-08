import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

/** forwardRef:
 * React.forwardRef lets parent components attach a ref directly
 * to the <input> DOM element inside this component. This is
 * needed for react-hook-form's register() — it needs a ref to
 * the actual input to track its value and trigger validation.
 * Without forwardRef, register() would fail silently.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftElement,
      rightElement,
      containerClassName,
      className,
      id,
      ...props
    },
    ref, // the forwarded ref from parent components
  ) => {
    //generate id if not provided, for accessibility
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {/* LABEL */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 select-none"
          >
            {label}
            {/* asterisk for required */}
            {props.required && (
              <span className='text-error-500 ml-1 aria-hidden="true'>*</span>
            )}
          </label>
        )}

        {/* INPUT WRAPPER */}
        <div className="relative flex items-center">
          {/* Left element */}
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 bg-white text-sm text-gray-900",
              "border rounded-md px-3",
              "placeholder:text-gray-400",
              "transition-colors duration-150",
              "outline-none",
              //error state
              hasError
                ? "border-error-500 focus:ring-error-500 focus-border-error-500"
                : "border-gray-300 focus:ring-brand-500 focus:ring-2 focus:ring-offset-0 focus:border-brand-500 hover:border-gray-400",
              //disabled state
              "disabled:bg-grey-50 disabled:text-gray-400 disabled:cursor-not-allowed",
              //padding for left/right elements
              leftElement && "pl-10",
              rightElement && "pr-10",
              className,
            )}
            {...props}
          />

          {/* Right element */}
          {rightElement && (
            <div className="absolute right-3 flex items-center text-gray-400">
              {rightElement}
            </div>
          )}
        </div>

        {/* ERROR MESSAGE - showm instead of helper when ther is an error */}
        {hasError && (
          <p className="text-xs text-error-600" role="alert">
            {error}
          </p>
        )}

        {/* HELPER TEXT */}
        {!hasError && helper && (
          <p className="text-xs text-gray-500">{helper}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input"; // for better debugging and React DevTools display

export default Input;
