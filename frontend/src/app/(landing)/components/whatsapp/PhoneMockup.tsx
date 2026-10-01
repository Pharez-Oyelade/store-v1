"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ChatMessage } from "./whatsappShowcaseData";
import { ChatBubble } from "./ChatBubble";

interface PhoneMockupProps {
  conversation: ChatMessage[];
  featureId: string;
  isInView: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  conversation,
  featureId,
  isInView,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Sequential message timing controller
  useEffect(() => {
    // If not in viewport, halt animations and keep state clean
    if (!isInView) {
      setVisibleCount(0);
      setIsTyping(false);
      return;
    }

    // Reset state on conversation switch & scroll to top
    setVisibleCount(0);
    setIsTyping(false);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }

    const timeouts: NodeJS.Timeout[] = [];

    // Step 1: User message appears at the top
    timeouts.push(
      setTimeout(() => {
        setVisibleCount(1);
      }, 250),
    );

    // Step 2: Bot begins typing
    if (conversation.length > 1) {
      timeouts.push(
        setTimeout(() => {
          setIsTyping(true);
        }, 1100),
      );

      // Step 3: Bot response appears
      timeouts.push(
        setTimeout(() => {
          setIsTyping(false);
          setVisibleCount(2);
        }, 2300),
      );
    }

    // Step 4: Optional follow-up user message
    if (conversation.length > 2) {
      timeouts.push(
        setTimeout(() => {
          setVisibleCount(3);
        }, 3900),
      );

      // Step 5: Bot begins typing final response
      if (conversation.length > 3) {
        timeouts.push(
          setTimeout(() => {
            setIsTyping(true);
          }, 4700),
        );

        // Step 6: Bot confirmation appears
        timeouts.push(
          setTimeout(() => {
            setIsTyping(false);
            setVisibleCount(4);
          }, 5800),
        );
      }
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [featureId, conversation, isInView]);

  // Smoothly scroll down as new messages/typing arrive, but keep top visible initially
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight, scrollTop } =
        chatContainerRef.current;
      // Only scroll if content exceeds the viewport height
      if (scrollHeight > clientHeight) {
        chatContainerRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, [visibleCount, isTyping]);

  return (
    <div className="relative mx-auto w-full max-w-[330px] sm:max-w-[360px] md:max-w-[325px]">
      {/* Ambient background glow behind the phone */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-brand-500/10 to-teal-400/20 rounded-[52px] blur-2xl -z-10 opacity-70" />

      {/* Outer Phone Shell */}
      <div className="relative rounded-[35px] md:rounded-[45px] p-1.5 bg-gradient-to-b from-gray-800 via-gray-900 to-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.12)] border border-gray-700/60">
        {/* Antenna bands & buttons simulation */}
        <div className="absolute -left-[3px] top-28 w-[3px] h-9 bg-gray-600 rounded-l-sm" />
        <div className="absolute -left-[3px] top-40 w-[3px] h-9 bg-gray-600 rounded-l-sm" />
        <div className="absolute -right-[3px] top-32 w-[3px] h-14 bg-gray-600 rounded-r-sm" />

        {/* Screen Bezel */}
        <div className="relative w-full rounded-[36px] md:rounded-[42px] overflow-hidden bg-[#efeae2] border-[4px] border-black flex flex-col h-[580px] sm:h-[620px]">
          {/* Dynamic Island / Notch Area */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
            {/* Camera sensor */}
            <div className="w-2.5 h-2.5 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#1c2938]" />
            </div>
            {/* Status indicator / sensor */}
            <div className="w-2 h-2 rounded-full bg-emerald-500/90 animate-pulse" />
          </div>

          {/* Top Status Bar (Phone OS) */}
          <div className="pt-2 px-6 pb-1 flex justify-between items-center bg-[#075e54] text-white text-[11px] font-semibold tracking-tight select-none z-20">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 opacity-90 text-[10px]">
              <span>5G</span>
              <div className="w-4 h-2 border border-white rounded-[2px] p-[1px] flex items-center">
                <div className="w-full h-full bg-white rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* WhatsApp Chat Header Bar */}
          <div className="bg-[#075e54] text-white px-3 py-2 flex items-center justify-between shadow-md z-20 select-none">
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5 -ml-1 text-white/90" />

              {/* Bot Avatar */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-400 p-[1.5px] shadow-sm flex-shrink-0">
                <div className="w-full h-full rounded-full bg-emerald-950 flex items-center justify-center text-white font-bold text-sm">
                  {/* <Sparkles className="w-4 h-4 text-emerald-300" /> */}
                  <span className="text-emerald-300">V</span>
                </div>
                {/* Verified Green Check */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                  <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              {/* Title & Online/Typing Status */}
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold text-xs sm:text-[13px] tracking-tight">
                    Vendra Assistant
                  </h3>
                </div>
                <p className="text-[10px] font-medium transition-colors">
                  {isTyping ? (
                    <span className="text-emerald-300 font-semibold animate-pulse">
                      typing...
                    </span>
                  ) : (
                    <span className="text-emerald-200/90">online</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 text-white/80">
              <Video className="w-4 h-4 hover:text-white transition-colors" />
              <Phone className="w-3.5 h-3.5 hover:text-white transition-colors" />
              <MoreVertical className="w-4 h-4 hover:text-white transition-colors" />
            </div>
          </div>

          {/* WhatsApp Chat Message Screen */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-[#efeae2] bg-[radial-gradient(#d6cdc3_1px,transparent_1px)] [background-size:16px_16px] no-scrollbar flex flex-col justify-start"
          >
            {/* Encryption notice banner */}
            <div className="mx-auto max-w-[90%] bg-[#ffeecd]/80 backdrop-blur-xs text-[#5e584f] text-[9.5px] text-center px-3 py-1.5 rounded-lg shadow-2xs border border-[#ebdcb9] flex-shrink-0">
              🔒 Messages are secured & synced with your Vendra store
            </div>

            {/* Date Pill */}
            <div className="flex justify-center my-0.5 flex-shrink-0">
              <span className="bg-white/85 text-gray-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-2xs uppercase tracking-wider">
                Today
              </span>
            </div>

            {/* Progressively Revealed Chat Bubbles */}
            <div className="space-y-2.5 flex flex-col flex-1 justify-start">
              {conversation.slice(0, visibleCount).map((msg) => (
                <ChatBubble
                  key={`${featureId}-${msg.id}`}
                  message={msg}
                  delay={0}
                />
              ))}

              {/* Realistic WhatsApp Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.15 },
                    }}
                    className="self-start bg-white text-gray-500 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-gray-100/60 flex items-center gap-1.5 w-fit"
                  >
                    {/* <span className="text-[10.5px] text-gray-400 mr-1 font-medium">
                      typing
                    </span> */}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* WhatsApp Bottom Input Bar */}
          <div className="bg-[#f0f2f5] px-2 py-2 flex items-center gap-1.5 border-t border-gray-200/60 z-20 select-none">
            <button
              type="button"
              aria-label="Emoji picker"
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 text-xs text-gray-400 flex items-center justify-between border border-gray-200/60 shadow-2xs">
              <span className="truncate">Type a message...</span>
              <Paperclip className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </div>
            <button
              type="button"
              aria-label="Send message"
              className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Home Indicator Bar (iOS style) */}
          <div className="pb-1 pt-0.5 bg-[#f0f2f5] flex justify-center">
            <div className="w-28 h-1 bg-gray-400/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
