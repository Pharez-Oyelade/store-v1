// Utility finctions
// cn - class name utility for conditional class names

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// FORMARTIING UTILITIES

// format number as currency string (Naira)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0, //no kobo
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date string for display
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

// Format date as relative date e.g yesterday, 2 days ago
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
}

// build whatsapp deeplink URL with prefilled message
export function buildWhatsAppLink(phone: string, message?: string): string {
  // International format without the +
  const formattedPhone = phone.startsWith("0")
    ? `234${phone.slice(1)}`
    : phone.replace(/[^0-9]/g, ""); // Remove non-numeric characters

  const base = `https://wa.me/${formattedPhone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// Truncate text to specific length
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

// Generate URL slug from business name
export function generateSlug(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

// Get initials from name for avatar fallback
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase(); // single word, take first 2 letters
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); // first letter of first and last word
}
