"use client";

import React, { useState, useCallback, useRef, type ReactNode } from "react";

export interface RollTextProps {
  text: string;
  className?: string;
  duplicateClassName?: string;
  staggerMs?: number;
  durationMs?: number;
  as?: React.ElementType;
}

export function RollText({
  text,
  className = "",
  duplicateClassName = "text-white/40",
  staggerMs = 20,
  durationMs = 700,
  as: Component = "span",
}: RollTextProps) {
  const [hovered, setHovered] = useState(false);
  const animatingRef = useRef(false);
  const pendingLeaveRef = useRef(false);

  const words = text.split(" ");
  let globalCharIndex = 0;

  const totalChars = text.length;
  const lockDuration = staggerMs * totalChars + durationMs * 0.4;

  const handleEnter = useCallback(() => {
    pendingLeaveRef.current = false;
    if (hovered) return;
    setHovered(true);
    animatingRef.current = true;
    setTimeout(() => {
      animatingRef.current = false;
      if (pendingLeaveRef.current) {
        pendingLeaveRef.current = false;
        setHovered(false);
      }
    }, lockDuration);
  }, [hovered, lockDuration]);

  const handleLeave = useCallback(() => {
    if (animatingRef.current) {
      pendingLeaveRef.current = true;
    } else {
      setHovered(false);
    }
  }, []);

  return (
    <Component
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`inline-flex flex-wrap items-center cursor-default select-none ${className}`}
    >
      {words.map((word, wIdx) => {
        const chars = word.split("");
        return (
          <span key={wIdx} className="inline-flex whitespace-nowrap">
            {chars.map((char, cIdx) => {
              const i = globalCharIndex++;
              return (
                <span
                  key={cIdx}
                  className="inline-block overflow-hidden"
                  style={{ height: "1.15em" }}
                >
                  <span
                    className="flex flex-col"
                    style={{
                      transitionProperty: "transform",
                      transitionDuration: hovered ? `${durationMs}ms` : "0ms",
                      transitionDelay: hovered ? `${staggerMs * i}ms` : "0ms",
                      transform: hovered ? "translateY(-50%)" : "translateY(0%)",
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <span
                      className="block"
                      style={{ height: "1.15em", lineHeight: "1.15em" }}
                    >
                      {char}
                    </span>
                    <span
                      className={`block ${duplicateClassName}`}
                      style={{ height: "1.15em", lineHeight: "1.15em" }}
                      aria-hidden
                    >
                      {char}
                    </span>
                  </span>
                </span>
              );
            })}
            {wIdx < words.length - 1 && (
              <span className="inline-block" style={{ width: "0.28em" }}>
                {" "}
              </span>
            )}
          </span>
        );
      })}
    </Component>
  );
}

export default RollText;
