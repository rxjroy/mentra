"use client";

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './text-cursor.css';

export type TextCursorItem = {
  label: string;
  icon?: React.ElementType;
};

export interface TextCursorProps {
  items?: (TextCursorItem | string)[];
  text?: string | string[];
  spacing?: number;
  followMouseDirection?: boolean;
  randomFloat?: boolean;
  exitDuration?: number;
  removalInterval?: number;
  maxPoints?: number;
  children?: ReactNode;
  className?: string;
}

export const TextCursor: React.FC<TextCursorProps> = ({
  items,
  text = 'Active Node',
  spacing = 75,
  followMouseDirection = false,
  randomFloat = true,
  exitDuration = 0.4,
  removalInterval = 30,
  maxPoints = 5,
  children,
  className = ''
}) => {
  const [trail, setTrail] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      angle: number;
      label: string;
      icon?: React.ElementType;
      randomX?: number;
      randomY?: number;
      randomRotate?: number;
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef(Date.now());
  const idCounter = useRef(0);
  const itemIndexRef = useRef(0);

  const getItem = (): { label: string; icon?: React.ElementType } => {
    const list = items || (Array.isArray(text) ? text : [text]);
    const raw = list[itemIndexRef.current % list.length];
    itemIndexRef.current++;

    if (typeof raw === 'string') {
      return { label: raw };
    }
    return raw;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
      return;
    }

    const createRandomData = () =>
      randomFloat
        ? {
            randomX: Math.random() * 8 - 4,
            randomY: Math.random() * 8 - 4,
            randomRotate: Math.random() * 6 - 3
          }
        : {};

    setTrail(prev => {
      const newTrail = [...prev];

      if (newTrail.length === 0) {
        const item = getItem();
        newTrail.push({
          id: idCounter.current++,
          x: mouseX,
          y: mouseY,
          angle: 0,
          label: item.label,
          icon: item.icon,
          ...createRandomData()
        });
      } else {
        const last = newTrail[newTrail.length - 1];
        const dx = mouseX - last.x;
        const dy = mouseY - last.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= spacing) {
          let rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const computedAngle = followMouseDirection ? rawAngle : 0;
          const steps = Math.floor(distance / spacing);

          for (let i = 1; i <= steps; i++) {
            const t = (spacing * i) / distance;
            const newX = last.x + dx * t;
            const newY = last.y + dy * t;
            const item = getItem();

            newTrail.push({
              id: idCounter.current++,
              x: newX,
              y: newY,
              angle: computedAngle,
              label: item.label,
              icon: item.icon,
              ...createRandomData()
            });
          }
        }
      }

      return newTrail.length > maxPoints ? newTrail.slice(newTrail.length - maxPoints) : newTrail;
    });

    lastMoveTimeRef.current = Date.now();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, text, spacing, followMouseDirection, randomFloat, maxPoints]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastMoveTimeRef.current > 120) {
        setTrail(prev => (prev.length > 0 ? prev.slice(1) : prev));
      }
    }, removalInterval);
    return () => clearInterval(interval);
  }, [removalInterval]);

  return (
    <div ref={containerRef} className={`text-cursor-container ${className}`}>
      {children}
      <div className="text-cursor-inner">
        <AnimatePresence>
          {trail.map(item => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.85, rotate: item.angle }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: randomFloat ? [0, item.randomX || 0, 0] : 0,
                  y: randomFloat ? [0, item.randomY || 0, 0] : 0,
                  rotate: randomFloat ? [item.angle, item.angle + (item.randomRotate || 0), item.angle] : item.angle
                }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{
                  opacity: { duration: exitDuration, ease: 'easeOut' },
                  scale: { duration: exitDuration, ease: 'easeOut' },
                  ...(randomFloat && {
                    x: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                    y: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                    rotate: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }
                  })
                }}
                className="text-cursor-item"
                style={{ left: item.x, top: item.y }}
              >
                {IconComponent && <IconComponent className="w-3.5 h-3.5 text-white/90 shrink-0" />}
                <span>{item.label}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TextCursor;
