"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GridPattern, genRandomPattern } from "@/components/ui/feature-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Icon as Iconify } from "@iconify/react";
import { RollText } from "@/components/ui/roll-text";

interface FeaturesProps {
  features: {
    id: number;
    icon: string | React.ElementType;
    title: string;
    description: string;
    image: string;
  }[];
  primaryColor?: string;
  progressGradientLight?: string;
  progressGradientDark?: string;
}

export function Features({
  features,
  primaryColor,
  progressGradientLight = "bg-white",
  progressGradientDark = "bg-white",
}: FeaturesProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [patterns, setPatterns] = useState<number[][][]>([]);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPatterns(features.map(() => genRandomPattern()));
  }, [features]);

  useEffect(() => {
    const activeFeatureElement = featureRefs.current[currentFeature];
    const container = containerRef.current;

    if (activeFeatureElement && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeFeatureElement.getBoundingClientRect();

      container.scrollTo({
        left:
          activeFeatureElement.offsetLeft -
          (containerRect.width - elementRect.width) / 2,
        behavior: "smooth",
      });
    }
  }, [currentFeature]);

  const handleFeatureClick = (index: number) => {
    setCurrentFeature(index);
  };

  return (
    <div className="py-8 lg:py-24 px-4 sm:px-6 w-full relative z-10 pointer-events-none">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8 lg:mb-16"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 mb-3 block">
            AI Mentors. Real Results.
          </span>
          <h2 className="text-2xl font-medium tracking-tight text-white mt-2 mb-6 pointer-events-auto inline-block">
            <RollText text="How it Works" duplicateClassName="text-white/40" />
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 lg:gap-16 gap-8 items-center">
          {/* Left Side - Features with Progress Lines */}
          <div
            ref={containerRef}
            className="lg:space-y-8 md:space-x-6 lg:space-x-0 overflow-x-auto overflow-hidden no-scrollbar lg:overflow-visible flex lg:flex lg:flex-col flex-row order-1 pb-4 scroll-smooth"
          >
            {features.map((feature, index) => {
              const isActive = currentFeature === index;

              return (
                <div
                  key={feature.id}
                  ref={(el) => {
                    featureRefs.current[index] = el;
                  }}
                  className="relative cursor-pointer flex-shrink-0 pointer-events-auto"
                  onClick={() => handleFeatureClick(index)}
                >
                  {/* Feature Content */}
                  <div
                    className={`
                    flex lg:flex-row flex-col items-start space-x-4 p-4 max-w-sm md:max-w-sm lg:max-w-2xl transition-all duration-500 relative overflow-hidden group
                    ${
                      isActive
                        ? " bg-[#050505]/95 shadow-[0_15px_40px_-10px_rgba(255,255,255,0.08)] rounded-2xl border border-white/10 hover:border-white/25 hover:bg-[#000000] hover:-translate-y-1 "
                        : " rounded-2xl border border-transparent hover:bg-white/[0.02] "
                    }
                  `}
                  >
                    {isActive && (
                      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)] z-0">
                        <div className="from-white/10 to-white/0 group-hover:from-white/15 group-hover:to-transparent absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100 transition-colors duration-500">
                            <GridPattern width={20} height={20} x="-12" y="4" squares={patterns[index] || []} className="fill-white/5 stroke-white/10 group-hover:stroke-white/20 group-hover:fill-white/5 absolute inset-0 h-full w-full mix-blend-overlay transition-all duration-500" />
                        </div>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex items-center justify-center shrink-0">
                      <GlassButton size="icon" className="pointer-events-none" tabIndex={-1}>
                        {typeof feature.icon === 'string' ? (
                          <Iconify icon={feature.icon} className="w-5 h-5 text-white" />
                        ) : (
                          <feature.icon className="w-5 h-5 text-white" />
                        )}
                      </GlassButton>
                    </div>

                    {/* Content */}
                    <div className="flex-1 mt-4 lg:mt-0 relative z-10">
                      <h3
                        className={`
                        text-sm font-medium mb-1 transition-colors duration-300 tracking-wide uppercase
                        ${
                          isActive
                            ? "text-white"
                            : "text-white/40"
                        }
                      `}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`
                        transition-colors duration-300 text-xs font-light leading-relaxed
                        ${
                          isActive
                            ? "text-white/70"
                            : "text-white/30"
                        }
                      `}
                      >
                        {feature.description}
                      </p>
                      <div className="mt-4 bg-white/10 rounded-sm h-1 overflow-hidden">
                        {isActive && (
                          <motion.div
                            key={currentFeature}
                            className={`h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]`}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 10, ease: "linear" }}
                            onAnimationComplete={() => {
                              setCurrentFeature((prev) => (prev + 1) % features.length);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side - Media Display (16:9 for 1920x1080 Videos with Pure White Glow) */}
          <div className="relative order-2 max-w-xl xl:max-w-2xl mx-auto w-full aspect-video pointer-events-auto">
            {/* White Circular Blur Glow Behind Video Frame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)] blur-[90px] pointer-events-none -z-10" />

            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative w-full h-full"
            >
              {features[currentFeature].image ? (
                features[currentFeature].image.endsWith(".mp4") || features[currentFeature].image.endsWith(".webm") ? (
                  <video
                    key={features[currentFeature].image}
                    src={features[currentFeature].image}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="rounded-2xl border border-white/10 shadow-2xl object-cover w-full h-full bg-black/80 shadow-[0_0_50px_-10px_rgba(255,255,255,0.12)]"
                  />
                ) : (
                  <Image
                    className="rounded-2xl border border-white/10 shadow-2xl object-cover bg-black/80 shadow-[0_0_50px_-10px_rgba(255,255,255,0.12)]"
                    src={features[currentFeature].image}
                    alt={features[currentFeature].title}
                    fill
                    unoptimized
                  />
                )
              ) : (
                <div className="rounded-2xl border border-white/10 shadow-2xl w-full h-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Media coming soon...</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
