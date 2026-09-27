"use client";

import React, { useEffect, useRef, type CSSProperties } from "react";

export type GatewayFlowProps = {
  mode?: "dark" | "light" | "auto";
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

interface Particle {
  t: number;
  speed: number;
  size: number;
  alpha: number;
  length: number;
}

interface Path {
  isLeft: boolean;
  startYRatio: number;
  offsetPhase: number;
  particles: Particle[];
}

export default function GatewayFlow({
  speed = 1,
  size = 1,
  density = 1,
  strokeWidth = 1,
  opacity = 1,
  className = "",
  style,
}: GatewayFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 420;

    const numPaths = Math.max(16, Math.min(80, Math.round(48 * density)));
    const paths: Path[] = [];

    // Initialize paths with normalized ratios so they seamlessly adapt to any container size
    for (let i = 0; i < numPaths; i++) {
      const isLeft = i % 2 === 0;
      // Distribute evenly vertically from -15% to 115% of viewport
      const startYRatio = (i / numPaths) * 1.3 - 0.15;
      
      const particles: Particle[] = [];
      const numParticlesPerPath = Math.random() > 0.4 ? 2 : 1;

      for (let p = 0; p < numParticlesPerPath; p++) {
        particles.push({
          t: Math.random(),
          speed: (0.0012 + Math.random() * 0.0018) * speed,
          size: (1.8 + Math.random() * 1.6) * size,
          alpha: 0.5 + Math.random() * 0.45,
          length: 0.02 + Math.random() * 0.03
        });
      }

      paths.push({
        isLeft,
        startYRatio,
        offsetPhase: Math.random() * Math.PI * 2,
        particles
      });
    }

    const resize = () => {
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || 800;
      height = container.clientHeight || 420;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Use ResizeObserver for instant pixel-perfect responsiveness
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        resize();
      });
      resizeObserver.observe(container);
    }

    // Cubic Bézier calculation
    function getBezierPoint(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
      };
    }

    let time = 0;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameIdRef.current = null;
        return;
      }

      time += 0.015 * speed;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw subtle ambient core glow at center convergence hub
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.45);
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      coreGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.03)");
      coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = coreGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw all Flow Paths and Flowing Energy Particles
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const dynamicStartY = path.startYRatio * height + Math.sin(time + path.offsetPhase) * 6;

        // Control points for organic S-curve convergence into the central pipeline
        const p0 = { x: path.isLeft ? 0 : width, y: dynamicStartY };
        const p1 = { x: path.isLeft ? centerX * 0.45 : width - centerX * 0.45, y: dynamicStartY };
        const p2 = { x: path.isLeft ? centerX * 0.82 : width - centerX * 0.82, y: centerY + (dynamicStartY - centerY) * 0.15 };
        const p3 = { x: centerX, y: centerY };

        // Draw ultra-crisp dashed flow guide line
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 * opacity})`;
        ctx.lineWidth = 1.1 * strokeWidth;
        ctx.setLineDash([2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render traveling glowing particles along each curve
        for (let pIdx = 0; pIdx < path.particles.length; pIdx++) {
          const p = path.particles[pIdx];
          p.t += p.speed;

          if (p.t > 1) {
            p.t = 0;
          }

          const currentPos = getBezierPoint(p.t, p0, p1, p2, p3);
          const trailPos = getBezierPoint(Math.max(0, p.t - p.length), p0, p1, p2, p3);

          // Proximity fade towards center and edge
          const edgeFade = Math.sin(p.t * Math.PI);
          const particleAlpha = p.alpha * edgeFade * opacity;

          if (particleAlpha > 0.01) {
            // Draw particle light trail
            const trailGrad = ctx.createLinearGradient(trailPos.x, trailPos.y, currentPos.x, currentPos.y);
            trailGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
            trailGrad.addColorStop(1, `rgba(255, 255, 255, ${particleAlpha * 0.75})`);

            ctx.beginPath();
            ctx.moveTo(trailPos.x, trailPos.y);
            ctx.lineTo(currentPos.x, currentPos.y);
            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = p.size * 0.8;
            ctx.stroke();

            // Draw glowing head node
            ctx.beginPath();
            ctx.arc(currentPos.x, currentPos.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${particleAlpha})`;
            ctx.fill();

            // Outer soft glow halo
            ctx.beginPath();
            ctx.arc(currentPos.x, currentPos.y, p.size * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${particleAlpha * 0.25})`;
            ctx.fill();
          }
        }
      }

      // 3. Central Hub Node Pulse
      const hubPulse = 0.5 + 0.5 * Math.sin(time * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3 + hubPulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow blur

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    // Pause animation when scrolled off-screen or tab is hidden
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (isVisibleRef.current && !animFrameIdRef.current) {
          animFrameIdRef.current = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current && !animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      observer.disconnect();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [speed, size, density, strokeWidth, opacity]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{ background: "#000000", ...style }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
