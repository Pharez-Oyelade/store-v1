"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatableComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onAddOption?: (newOption: string) => void;
  options: string[];
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
}

export default function CreatableCombobox({
  label,
  value,
  onChange,
  onAddOption,
  options = [],
  placeholder = "Select or type to create...",
  helper,
  error,
  required,
  disabled,
  containerClassName,
  className,
}: CreatableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query with incoming value when not open
  useEffect(() => {
    if (!isOpen) {
      setQuery(value || "");
    }
  }, [value, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // If the user typed something and blurred without selecting,
        // revert query to the currently selected value
        setQuery(value || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((opt) => opt.toLowerCase().includes(trimmed));
  }, [options, query]);

  // Check if query is a completely new option
  const isNewOption = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    return !options.some((opt) => opt.toLowerCase() === trimmed.toLowerCase());
  }, [options, query]);

  function handleSelect(selectedValue: string) {
    onChange(selectedValue);
    setQuery(selectedValue);
    setIsOpen(false);
  }

  function handleCreateAndSelect(newOption: string) {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    onAddOption?.(trimmed);
    onChange(trimmed);
    setQuery(trimmed);
    setIsOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isNewOption) {
        handleCreateAndSelect(query);
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery(value || "");
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  }

  const hasError = Boolean(error);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col gap-1.5 w-full", containerClassName)}
    >
      {label && (
        <label className="text-sm font-medium text-gray-700 select-none flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </span>
          {value && !disabled && (
            <span className="text-[11px] font-normal text-gray-400">
              Type or select from list
            </span>
          )}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? query : value}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery(value || "");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-10 bg-white text-sm text-gray-900 rounded-md border pl-3 pr-16 outline-none transition-colors",
            "focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
            hasError
              ? "border-error-500 focus:ring-error-500"
              : "border-gray-300 hover:border-gray-400",
            disabled && "bg-gray-50 text-gray-400 cursor-not-allowed",
            className,
          )}
        />

        {/* Action icons on right */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isOpen && "rotate-180 text-brand-600",
              )}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Create new option button */}
          {isNewOption && (
            <button
              type="button"
              onClick={() => handleCreateAndSelect(query)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors border-b border-brand-100 font-medium"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-200 text-brand-800 shrink-0">
                <Plus className="size-3" />
              </span>
              <span className="truncate">
                Add &quot;<strong>{query.trim()}</strong>&quot; as new option
              </span>
            </button>
          )}

          {/* Existing filtered options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected =
                value?.toLowerCase() === opt.toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "bg-brand-50 text-brand-800 font-semibold"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && (
                    <Check className="size-4 text-brand-600 shrink-0" />
                  )}
                </button>
              );
            })
          ) : !isNewOption ? (
            <div className="px-3 py-3 text-center text-xs text-gray-500">
              No matching options found
            </div>
          ) : null}
        </div>
      )}

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
}
