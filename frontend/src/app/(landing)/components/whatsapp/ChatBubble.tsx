"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./whatsappShowcaseData";

interface ChatBubbleProps {
  message: ChatMessage;
  delay?: number;
}

// Simple parser for WhatsApp style *bold* text and line breaks
const renderFormattedText = (rawText: string) => {
  const lines = rawText.split("\n");

  return lines.map((line, lineIdx) => {
    // Regex matches *bold text*
    const parts = line.split(/(\*[^*]+\*)/g);

    return (
      <span key={lineIdx} className="block min-h-[1.15em]">
        {parts.map((part, pIdx) => {
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <strong key={pIdx} className="font-semibold text-gray-900">
                {part.slice(1, -1)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </span>
    );
  });
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, delay = 0 }) => {
  const isUser = message.sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
      transition={{
        duration: 0.35,
        delay,
        ease: [0.21, 1.02, 0.49, 0.99],
      }}
      className={cn(
        "relative flex flex-col max-w-[86%] sm:max-w-[82%] text-xs sm:text-[12.5px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        isUser
          ? "self-end bg-[#d9fdd3] text-gray-800 rounded-2xl rounded-tr-xs ml-auto"
          : "self-start bg-white text-gray-800 rounded-2xl rounded-tl-xs mr-auto border border-gray-100/60",
      )}
    >
      {/* Sender indicator for bot (optional subtle tag) */}
      {!isUser && (
        <div className="px-3 pt-2 pb-0.5 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            Vendra AI
          </span>
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
        </div>
      )}

      {/* Bubble text content */}
      <div className={cn("px-3 text-gray-800 break-words", isUser ? "pt-2.5 pb-1" : "pb-1")}>
        {renderFormattedText(message.text)}
      </div>

      {/* Timestamp and ticks row */}
      <div className="flex items-center justify-end gap-1 px-3 pb-1.5 pt-0.5 text-[9.5px] text-gray-500 font-medium select-none ml-auto">
        <span>{message.timestamp}</span>
        {isUser && (
          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]" />
        )}
      </div>
    </motion.div>
  );
};
