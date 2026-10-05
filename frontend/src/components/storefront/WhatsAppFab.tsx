"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface WhatsAppFabProps {
  phone?: string;
  businessName?: string;
  enabled?: boolean;
}

export function WhatsAppFab({
  phone,
  businessName = "Designer",
  enabled = true,
}: WhatsAppFabProps) {
  if (!enabled || !phone) return null;

  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("0")
    ? `234${cleanPhone.slice(1)}`
    : cleanPhone;

  const message = `Hello ${businessName}, I am browsing your online storefront and would like to make an inquiry!`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  return (
    <aside aria-label="Customer WhatsApp Contact" className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        title={`Chat with ${businessName} on WhatsApp`}
      >
        <MessageCircle className="size-6 shrink-0 fill-current text-white" />
        <span className="hidden sm:inline font-sans text-xs font-bold tracking-wide">
          Chat with us
        </span>
      </a>
    </aside>
  );
}
