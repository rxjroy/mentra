"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, ShieldAlert, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassAlertProps {
  variant?: "error" | "success" | "warning" | "info";
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const GlassAlert: React.FC<GlassAlertProps> = ({
  variant = "error",
  title,
  message,
  onDismiss,
  className
}) => {
  if (!message) return null;

  const isError = variant === "error";
  const isSuccess = variant === "success";
  const isWarning = variant === "warning";
  const isInfo = variant === "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-3.5 border backdrop-blur-2xl transition-all duration-300",
        // Dark glass base with subtle luminous glow matching Mentra's luxury design system
        isError && "bg-gradient-to-r from-[#180808]/90 via-[#100606]/85 to-[#0c0505]/90 border-red-500/25 shadow-[0_4px_24px_rgba(239,68,68,0.12),inset_0_1px_1px_rgba(255,255,255,0.08)]",
        isSuccess && "bg-gradient-to-r from-[#061810]/90 via-[#05120c]/85 to-[#030c08]/90 border-emerald-500/25 shadow-[0_4px_24px_rgba(16,185,129,0.12),inset_0_1px_1px_rgba(255,255,255,0.08)]",
        isWarning && "bg-gradient-to-r from-[#1a1406]/90 via-[#120e04]/85 to-[#0a0802]/90 border-amber-500/25 shadow-[0_4px_24px_rgba(245,158,11,0.12),inset_0_1px_1px_rgba(255,255,255,0.08)]",
        isInfo && "bg-gradient-to-r from-[#0c0c14]/90 via-[#09090e]/85 to-[#06060a]/90 border-white/15 shadow-[0_4px_24px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.08)]",
        className
      )}
    >
      {/* Top subtle light sheen reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div className="flex items-start gap-3 relative z-10">
        {/* Luminous Icon Badge Lens */}
        <div
          className={cn(
            "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-md shadow-inner transition-transform",
            isError && "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]",
            isSuccess && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
            isWarning && "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
            isInfo && "bg-white/10 border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]"
          )}
        >
          {isError && <ShieldAlert className="w-3.5 h-3.5" />}
          {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isWarning && <AlertCircle className="w-3.5 h-3.5" />}
          {isInfo && <Info className="w-3.5 h-3.5" />}
        </div>

        {/* Message and Title Body */}
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <span
              className={cn(
                "block text-[10px] font-mono uppercase tracking-widest font-semibold mb-0.5",
                isError && "text-red-400/90",
                isSuccess && "text-emerald-400/90",
                isWarning && "text-amber-400/90",
                isInfo && "text-white/60"
              )}
            >
              {title}
            </span>
          )}
          <p className="text-xs text-white/90 font-light leading-relaxed tracking-wide">
            {message}
          </p>
        </div>

        {/* Optional Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0 -mr-1 -mt-0.5"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
