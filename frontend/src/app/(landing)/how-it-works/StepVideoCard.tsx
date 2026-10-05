"use client";

import React, { useRef, useState, useEffect } from "react";
import { Pause, Play } from "lucide-react";

interface StepVideoCardProps {
  stepNumber: string;
  icon: React.ReactNode;
  videoSrc: string;
  posterSrc?: string;
  colorGradient?: string;
  isActive: boolean;
}

export default function StepVideoCard({
  stepNumber,
  icon,
  videoSrc,
  posterSrc,
  colorGradient = "from-brand-50 to-brand-100/50",
  isActive,
}: StepVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Play / Pause orchestration based on viewport activity and user hover/click
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure audio is always muted for web autoplay policies
    video.muted = true;

    if (!isActive) {
      video.pause();
      // Reset manual pause once step scrolls out of view so it auto-plays when returning
      setIsManuallyPaused(false);
      return;
    }

    const shouldPlay = !isHovered && !isManuallyPaused;

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Playback interrupted or prevented by browser; ignore silently
        });
      }
    } else {
      video.pause();
    }
  }, [isActive, isHovered, isManuallyPaused]);

  // Touch / Click toggle for mobile and desktop manual control
  const handleTogglePlay = () => {
    setIsManuallyPaused((prev) => !prev);
  };

  const isPaused = !isActive || isHovered || isManuallyPaused;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-gray-200/80 shadow-md group hover:shadow-xl transition-all duration-300 h-[320px] sm:h-[380px] md:h-[420px] lg:h-[450px] w-full flex flex-col justify-between p-6 md:p-8 bg-gray-950 cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTogglePlay}
      role="region"
      aria-label={`Demo video for step ${stepNumber}`}
    >
      {/* Fallback gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-30 pointer-events-none`}
      />

      {/* Background Video */}
      {!hasError ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          loop
          preload="metadata"
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.02] ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/70 text-sm">
          Video preview unavailable
        </div>
      )}

      {/* Contrast vignette overlay: preserves crisp legibility for overlaid badges */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/50 pointer-events-none transition-opacity duration-300" />

      {/* Top Header Row: Icon Badge & Giant Step Number */}
      <div className="relative z-10 flex justify-between items-start pointer-events-none">
        <div className="p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 transition-transform duration-300 group-hover:scale-105">
          {icon}
        </div>
        <span className="text-6xl md:text-7xl font-black text-white/80 drop-shadow-lg select-none group-hover:scale-105 transition-transform duration-300 font-sans">
          {stepNumber}
        </span>
      </div>

      {/* Center Pause/Play Icon Overlay (briefly indicates state changes) */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
          isPaused && isActive ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-transform duration-200 scale-95 group-hover:scale-100">
          <Pause className="w-7 h-7 text-amber-300 fill-amber-300/20" />
        </div>
      </div>

      {/* Bottom Footer Row: Status Pill */}
      <div className="relative z-10 flex items-center justify-between pointer-events-none">
        {isActive && !isPaused ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-md transition-all duration-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Demo</span>
          </div>
        ) : isActive && isPaused ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white text-xs font-medium shadow-md transition-all duration-300">
            <Pause className="w-3.5 h-3.5 text-amber-300" />
            <span>Paused</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/80 text-xs font-medium shadow-md transition-all duration-300">
            <Play className="w-3 h-3 text-white/80" />
            <span>Scroll into view to play</span>
          </div>
        )}

        <div className="text-[11px] text-white/70 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 hidden sm:block">
          Tap or hover
        </div>
      </div>
    </div>
  );
}
