import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassButtonWrapVariants = cva(
  "glass-button-wrap cursor-pointer rounded-full",
  {
    variants: {
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10 shrink-0 aspect-square flex items-center justify-center p-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const glassButtonVariants = cva(
  "relative isolate all-unset cursor-pointer rounded-full transition-all flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "",
        ghost: "bg-transparent",
        primary: "bg-primary/10",
        outline: "border border-white/10",
        secondary: "bg-secondary/20",
        destructive: "bg-destructive/20 text-destructive",
      },
      size: {
        default: "w-full text-sm font-medium leading-[1.2]",
        sm: "w-full text-xs font-medium leading-[1.2]",
        lg: "w-full text-base font-medium leading-[1.2]",
        icon: "w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10 shrink-0 aspect-square p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const glassButtonTextVariants = cva(
  "glass-button-text relative flex items-center justify-center whitespace-nowrap select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "w-full px-6 py-3",
        sm: "w-full px-4 py-1.5 text-xs",
        lg: "w-full px-8 py-4",
        icon: "w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10 shrink-0 aspect-square flex items-center justify-center p-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, variant, contentClassName, ...props }, ref) => {
    return (
      <div
        className={cn(
          glassButtonWrapVariants({ size }),
          className
        )}
      >
        <button
          className={cn("glass-button", glassButtonVariants({ size, variant: (variant as any) || "default" }))}
          ref={ref}
          {...props}
        >
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName
            )}
          >
            {children}
          </span>
        </button>
        <div className={cn("glass-button-shadow rounded-full", size === "icon" && "w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10 shrink-0 aspect-square")}></div>
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
