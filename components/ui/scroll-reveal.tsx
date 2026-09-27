"use client";

import React, { useEffect, useRef, useMemo, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './scroll-reveal.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  triggerSelector?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.08,
  baseRotation = 0,
  blurStrength = 12,
  containerClassName = '',
  textClassName = '',
  triggerSelector,
  start = 'top 85%',
  end = 'top 30%',
  scrub = 0.8
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;
      const targetTrigger = triggerSelector 
        ? (document.querySelector(triggerSelector) || el) 
        : (el.closest('section') || el);

      if (baseRotation !== 0) {
        gsap.fromTo(
          el,
          { transformOrigin: '0% 50%', rotate: baseRotation },
          {
            ease: 'none',
            rotate: 0,
            scrollTrigger: {
              trigger: targetTrigger,
              scroller,
              start,
              end,
              scrub
            }
          }
        );
      }

      const wordElements = el.querySelectorAll('.word');
      if (wordElements.length > 0) {
        // Set initial state
        gsap.set(wordElements, {
          opacity: baseOpacity,
          filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
          willChange: 'opacity, filter, transform'
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: targetTrigger,
            scroller,
            start,
            end,
            scrub,
            invalidateOnRefresh: true,
          }
        });

        tl.to(wordElements, {
          opacity: 1,
          filter: enableBlur ? 'blur(0px)' : 'none',
          stagger: {
            each: 0.05,
            from: "start"
          },
          ease: 'power2.out'
        });
      }
    }, containerRef);

    // Refresh scrolltrigger after layout calculation
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, blurStrength, triggerSelector, start, end, scrub]);

  return (
    <div ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <div className={`scroll-reveal-text ${textClassName}`}>{splitText}</div>
    </div>
  );
};

export default ScrollReveal;
