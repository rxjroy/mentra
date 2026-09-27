"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of chars
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    // Focus first empty box on mount
    const firstEmptyIndex = digits.findIndex(d => !d);
    const targetIdx = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    inputsRef.current[targetIdx]?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigit = rawVal.replace(/\D/g, "").slice(-1); // Get latest single digit

    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const newCode = newDigits.join("");
    onChange(newCode);

    if (cleanDigit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.length === length && onComplete) {
      onComplete(newCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIdx = Math.min(length - 1, pastedData.length);
      inputsRef.current[nextIdx]?.focus();
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = !!digits[index];
        return (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digits[index]}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-semibold rounded-2xl bg-white/[0.03] border transition-all duration-200 outline-none select-none text-white",
              isFilled 
                ? "border-white/50 bg-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.2),inset_0_1px_2px_rgba(255,255,255,0.2)]" 
                : "border-white/10 hover:border-white/20 focus:border-white focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            )}
          />
        );
      })}
    </div>
  );
}
