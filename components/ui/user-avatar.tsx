"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({
  name,
  avatarUrl,
  className,
  size = "md"
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initial = (name?.trim()?.charAt(0) || "U").toUpperCase();

  const sizeClasses = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm"
  }[size];

  if (avatarUrl && !imageError) {
    return (
      <div 
        className={cn(
          "rounded-full overflow-hidden border border-white/25 shadow-[0_0_12px_rgba(255,255,255,0.15)] bg-white/5 relative shrink-0",
          sizeClasses,
          className
        )}
      >
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-white/25 via-white/10 to-white/5 border border-white/30 text-white font-semibold flex items-center justify-center select-none shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.3)]",
        sizeClasses,
        className
      )}
      title={name}
    >
      <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{initial}</span>
    </div>
  );
}
