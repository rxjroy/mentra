"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { RollText } from "@/components/ui/roll-text";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
.cinematic-footer-wrapper {
  -webkit-font-smoothing: antialiased;
  
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(90, 210, 244, 0.5)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(90, 210, 244, 0.8)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(255, 255, 255, 0.08) 0%, 
    rgba(255, 255, 255, 0.02) 40%, 
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 500;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    },[]);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>AI-Powered Interviews</span> <span className="text-white/60">✦</span>
    <span>Real-time Feedback</span> <span className="text-white/60">✦</span>
    <span>Custom Scenarios</span> <span className="text-white/60">✦</span>
    <span>Performance Tracking</span> <span className="text-white/60">✦</span>
    <span>Absolute Privacy</span> <span className="text-white/60">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "6vh", scale: 0.85, opacity: 0.2 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 90%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 30, opacity: 0.3 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 85%",
            end: "bottom 95%",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  },[]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        ref={wrapperRef}
        className="relative min-h-[100svh] w-full mt-12 sm:mt-24 lg:h-screen"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="relative lg:fixed lg:bottom-0 lg:left-0 flex min-h-[100svh] lg:h-screen w-full flex-col justify-between overflow-hidden bg-transparent text-foreground cinematic-footer-wrapper py-8 lg:py-0">
          
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />

          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[2vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none tracking-tighter"
          >
            MENTRA
          </div>

          <div className="absolute top-4 sm:top-12 -left-[10vw] w-[120vw] overflow-hidden border-y border-border/50 bg-background/60 backdrop-blur-md py-2.5 sm:py-4 z-10 -rotate-2 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-[10px] font-semibold tracking-widest text-white/50 uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 mt-12 sm:mt-20 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tighter mb-6 sm:mb-12 text-center text-white"
            >
              <RollText text="Ready to begin?" className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" duplicateClassName="text-white/40" />
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-4 sm:gap-6 w-full">
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full">
                <MagneticButton as="a" href="/login" className="footer-glass-pill px-6 py-3 sm:px-8 sm:py-4 rounded-full text-white/90 font-medium text-xs sm:text-sm leading-[1.2] flex items-center gap-2.5 sm:gap-3 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-white/90 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start a Session
                </MagneticButton>
                
                <MagneticButton as="a" href="/dashboard" className="footer-glass-pill px-6 py-3 sm:px-8 sm:py-4 rounded-full text-white/90 font-medium text-xs sm:text-sm leading-[1.2] flex items-center gap-2.5 sm:gap-3 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-white/90 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  View Dashboard
                </MagneticButton>
              </div>

              <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 md:gap-6 w-full mt-2 sm:mt-4">
                <MagneticButton as="a" href="/privacy" className="footer-glass-pill px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-white/50 font-semibold text-[9px] sm:text-[10px] uppercase tracking-widest hover:text-white/90">
                  Privacy Policy
                </MagneticButton>
                <MagneticButton as="a" href="/terms" className="footer-glass-pill px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-white/50 font-semibold text-[9px] sm:text-[10px] uppercase tracking-widest hover:text-white/90">
                  Terms of Service
                </MagneticButton>
                <MagneticButton as="a" href="mailto:mentrainterview@gmail.com" className="footer-glass-pill px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-white/50 font-semibold text-[9px] sm:text-[10px] uppercase tracking-widest hover:text-white/90">
                  Support
                </MagneticButton>
              </div>

              {/* Crafted with love badge */}
              <div className="footer-glass-pill px-5 py-2 sm:px-6 sm:py-3 rounded-full flex items-center justify-center gap-2 mt-4 sm:mt-8 cursor-default border-border/50 w-fit mx-auto">
                <span className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest">Crafted with</span>
                <span className="animate-footer-heartbeat text-xs sm:text-base text-white">❤</span>
                <span className="text-white/40 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest">by</span>
                <span className="text-white/90 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest ml-1">Mentra</span>
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full pb-20 sm:pb-8 px-4 sm:px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            
            <div className="text-white/40 text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-center md:text-left">
              © 2026 Mentra. All rights reserved.
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full footer-glass-pill flex items-center justify-center text-white/50 hover:text-white/90 group order-3"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>

          </div>
        </footer>
      </div>
    </>
  );
}
