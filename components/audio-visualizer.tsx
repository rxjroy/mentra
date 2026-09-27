"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
  variant?: "inline" | "pill" | "banner";
  label?: string;
}

export function AudioVisualizer({
  isActive,
  barCount = 12,
  className,
  variant = "pill",
  label = "Interviewer Speaking"
}: AudioVisualizerProps) {
  const [frequencies, setFrequencies] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 20)
  );

  useEffect(() => {
    if (!isActive) {
      setFrequencies(Array.from({ length: barCount }, () => 15));
      return;
    }

    const interval = setInterval(() => {
      setFrequencies(
        Array.from({ length: barCount }, (_, i) => {
          // Center bars have slightly higher amplitude for natural voice envelope
          const centerBias = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
          const base = 25 + centerBias * 35;
          const randomJitter = Math.floor(Math.random() * 40);
          return Math.min(100, Math.max(15, base + randomJitter));
        })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  if (!isActive && variant !== "banner") return null;

  if (variant === "inline") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white font-mono text-[11px]", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-[10px] text-white/70 font-sans">{label}</span>
        <div className="flex items-center gap-[2px] h-3 px-1">
          {frequencies.slice(0, 6).map((h, i) => (
            <span
              key={i}
              className="w-[2px] bg-white rounded-full transition-all duration-100 ease-out"
              style={{ height: `${isActive ? h : 15}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className={cn(
          "px-3.5 py-1.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(255,255,255,0.15)]",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-white/10 border border-white/20">
            <Volume2 className="w-3 h-3 text-white animate-pulse" />
            <span className="absolute -inset-0.5 rounded-full border border-white/30 animate-ping pointer-events-none" />
          </div>
          <span className="text-xs font-medium text-white tracking-wide">{label}</span>
        </div>

        {/* Live Audio Equalizer Wave */}
        <div className="flex items-center gap-[3px] h-4 px-2 bg-white/5 rounded-full border border-white/10">
          {frequencies.map((height, idx) => (
            <span
              key={idx}
              className="w-[2.5px] bg-gradient-to-t from-white/40 via-white to-white rounded-full transition-all duration-100 ease-out"
              style={{
                height: `${height}%`,
                opacity: 0.5 + (height / 200)
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Default "pill" variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0a]/90 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)] backdrop-blur-xl",
        className
      )}
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
      <span className="text-[11px] font-medium text-white/90">{label}</span>
      <div className="flex items-center gap-[2px] h-3.5 px-1">
        {frequencies.map((h, i) => (
          <span
            key={i}
            className="w-[2px] bg-white rounded-full transition-all duration-100 ease-out shadow-[0_0_4px_rgba(255,255,255,0.6)]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
