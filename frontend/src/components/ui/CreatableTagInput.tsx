"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatableTagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  onAddOption?: (newTag: string) => void;
  options: string[];
  placeholder?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
}

export default function CreatableTagInput({
  label,
  value = [],
  onChange,
  onAddOption,
  options = [],
  placeholder = "Select or type tag...",
  helper,
  error,
  disabled,
  containerClassName,
  className,
}: CreatableTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available options (exclude already selected)
  const unselectedOptions = useMemo(() => {
    const selectedLower = new Set(value.map((v) => v.toLowerCase()));
    return options.filter((opt) => !selectedLower.has(opt.toLowerCase()));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return unselectedOptions;
    return unselectedOptions.filter((opt) =>
      opt.toLowerCase().includes(trimmed),
    );
  }, [unselectedOptions, query]);

  // Is the query a completely new tag?
  const isNewTag = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    const allKnown = new Set([
      ...options.map((o) => o.toLowerCase()),
      ...value.map((v) => v.toLowerCase()),
    ]);
    return !allKnown.has(trimmed.toLowerCase());
  }, [options, value, query]);

  function addTag(tagToAdd: string) {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;

    // Check if already in current value
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setQuery("");
      return;
    }

    // Persist as new option if needed
    if (!options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      onAddOption?.(trimmed);
    }

    onChange([...value, trimmed]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeTag(indexToRemove: number) {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (query.trim()) {
        if (isNewTag) {
          addTag(query);
        } else if (filteredOptions.length > 0) {
          addTag(filteredOptions[0]);
        } else {
          addTag(query);
        }
      }
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      // Remove last tag if user hits Backspace with empty input
      removeTag(value.length - 1);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
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
          <span>{label}</span>
          <span className="text-[11px] font-normal text-gray-400">
            Press Enter or comma to add
          </span>
        </label>
      )}

      {/* Pill Box Container */}
      <div
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
        className={cn(
          "min-h-10 w-full bg-white rounded-md border p-1.5 flex flex-wrap items-center gap-1.5 cursor-text transition-colors",
          "focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500",
          hasError
            ? "border-error-500 focus-within:ring-error-500"
            : "border-gray-300 hover:border-gray-400",
          disabled && "bg-gray-50 cursor-not-allowed",
          className,
        )}
      >
        {/* Selected tag chips */}
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-800 border border-brand-200"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="size-3.5 rounded-full hover:bg-brand-200/60 inline-flex items-center justify-center text-brand-600 transition-colors"
                title={`Remove ${tag}`}
              >
                <X className="size-2.5" />
              </button>
            )}
          </span>
        ))}

        {/* Inline input */}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          placeholder={value.length === 0 ? placeholder : "Add another..."}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 outline-none px-1 py-0.5 placeholder:text-gray-400"
        />
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Create new tag button */}
          {isNewTag && (
            <button
              type="button"
              onClick={() => addTag(query)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors border-b border-brand-100 font-medium"
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-brand-200 text-brand-800 shrink-0">
                <Plus className="size-2.5" />
              </span>
              <span className="truncate">
                Add &quot;<strong>{query.trim()}</strong>&quot; as new tag
              </span>
            </button>
          )}

          {/* Existing tag suggestions */}
          {filteredOptions.length > 0 ? (
            <div className="p-1">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Suggested Tags
              </div>
              <div className="flex flex-wrap gap-1 p-1">
                {filteredOptions.slice(0, 16).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => addTag(opt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  >
                    <Plus className="size-3 text-gray-400" />
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : !isNewTag ? (
            <div className="px-3 py-3 text-center text-xs text-gray-500">
              No further tag suggestions
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
