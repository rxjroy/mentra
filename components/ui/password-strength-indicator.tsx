"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Shield, ShieldCheck } from "lucide-react";
import { checkPasswordStrength } from "@/lib/security";

interface PasswordStrengthIndicatorProps {
  password: string;
  showChecklist?: boolean;
  isInvalidAttempt?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  showChecklist = true,
  isInvalidAttempt = false,
  className = ""
}: PasswordStrengthIndicatorProps) {
  const result = useMemo(() => checkPasswordStrength(password), [password]);

  // Don't render anything if no password has been typed yet and not attempting submit
  if (!password && !isInvalidAttempt) return null;

  const barCount = result.level === "strong" ? 4 : result.level === "good" ? 3 : result.level === "fair" ? 2 : 1;

  const colorMap = {
    weak: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]",
    fair: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
    good: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]",
    strong: "bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
  };

  const textMap = {
    weak: "Weak password",
    fair: "Fair strength",
    good: "Good strength",
    strong: "Strong & secure"
  };

  const textColorMap = {
    weak: "text-red-400",
    fair: "text-amber-400",
    good: "text-emerald-400",
    strong: "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
  };

  const checkListItems = [
    { label: "8+ characters", passed: result.criteria.length },
    { label: "Uppercase letter (A-Z)", passed: result.criteria.uppercase },
    { label: "Lowercase letter (a-z)", passed: result.criteria.lowercase },
    { label: "Numeric digit (0-9)", passed: result.criteria.number },
    { label: "Special symbol (!@#$...)", passed: result.criteria.special }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`space-y-2.5 pt-1.5 ${className}`}
    >
      {/* 4-Segment Strength Bar + Status Label */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/50 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
            {result.valid ? (
              <ShieldCheck className="w-3.5 h-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-white/40" />
            )}
            Security Strength
          </span>
          <span className={`font-medium font-mono text-[11px] ${textColorMap[result.level]} transition-colors`}>
            {textMap[result.level]}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-white/[0.06] rounded-full p-0.5 overflow-hidden">
          {[1, 2, 3, 4].map((segment) => (
            <div
              key={segment}
              className={`h-full rounded-full transition-all duration-300 ${
                segment <= barCount ? colorMap[result.level] : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Sleek Criteria Checklist Card */}
      {showChecklist && (
        <motion.div 
          animate={isInvalidAttempt ? { x: [-4, 4, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`p-3 rounded-2xl bg-[#0a0a0a]/80 border transition-all duration-300 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${
            isInvalidAttempt && !result.valid 
              ? "border-red-500/40 bg-red-500/[0.03] shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
              : "border-white/10"
          }`}
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            {checkListItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-2 transition-colors duration-200 ${
                  idx === 4 ? "col-span-2 sm:col-span-1" : ""
                } ${
                  item.passed ? "text-white font-normal" : "text-white/35 font-light"
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-all duration-300 ${
                  item.passed 
                    ? "bg-white text-black font-bold shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-white" 
                    : "bg-white/[0.03] text-white/20 border border-white/10"
                }`}>
                  {item.passed ? (
                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-white/30" />
                  )}
                </div>
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
