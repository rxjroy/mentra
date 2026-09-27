"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassToastProps {
  show: boolean;
  variant?: "error" | "success" | "warning" | "info";
  title?: string;
  message: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const GlassToast: React.FC<GlassToastProps> = ({
  show,
  variant = "error",
  title = "Notice",
  message,
  onDismiss,
  autoDismissMs = 4500
}) => {
  useEffect(() => {
    if (!show || !message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [show, message, autoDismissMs, onDismiss]);

  const isError = variant === "error";
  const isSuccess = variant === "success";
  const isWarning = variant === "warning";
  const isInfo = variant === "info";

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, scale: 0.95, filter: "blur(6px)" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-[90vw] sm:max-w-md w-full px-4 pointer-events-auto"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl p-3 sm:p-3.5 border backdrop-blur-2xl transition-all duration-300 shadow-2xl flex items-center gap-3",
              isError && "bg-[#0f0707]/95 border-red-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(239,68,68,0.18)]",
              isSuccess && "bg-[#050f09]/95 border-emerald-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(16,185,129,0.18)]",
              isWarning && "bg-[#120e05]/95 border-amber-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(245,158,11,0.18)]",
              isInfo && "bg-[#080808]/95 border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(255,255,255,0.1)]"
            )}
          >
            {/* Top Specular Sheen */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Lens Icon Badge */}
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-md shadow-inner",
                isError && "bg-red-500/15 border-red-500/35 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]",
                isSuccess && "bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
                isWarning && "bg-amber-500/15 border-amber-500/35 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
                isInfo && "bg-white/10 border-white/25 text-white shadow-[0_0_12px_rgba(255,255,255,0.3)]"
              )}
            >
              {isError && <ShieldAlert className="w-3.5 h-3.5" />}
              {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isWarning && <AlertCircle className="w-3.5 h-3.5" />}
              {isInfo && <Info className="w-3.5 h-3.5" />}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0">
              {title && (
                <span
                  className={cn(
                    "block text-[10px] font-mono uppercase tracking-widest font-semibold leading-none mb-1",
                    isError && "text-red-400",
                    isSuccess && "text-emerald-400",
                    isWarning && "text-amber-400",
                    isInfo && "text-white/60"
                  )}
                >
                  {title}
                </span>
              )}
              <p className="text-xs text-white/95 font-light leading-relaxed">
                {message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onDismiss}
              className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
