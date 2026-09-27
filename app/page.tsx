"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Target, Mic, FileText, TrendingUp, ShieldAlert, Zap, Activity, Terminal } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { SetupSessionForm } from "@/components/setup-session-form";
import { Features } from "@/components/ui/features-section";
import InteractiveGridBackground from "@/components/ui/interactive-grid-background";
import { FeatureCard } from "@/components/ui/feature-card";
import { FoldText } from "@/components/ui/fold-text";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { TextCursor } from "@/components/ui/text-cursor";
import { RollText } from "@/components/ui/roll-text";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LaserFlow } from "@/components/ui/laser-flow";
import Link from "next/link";

// Below-the-fold lazy loaded components
const GatewayFlow = dynamic(() => import("@/components/ui/gateway-flow"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent animate-pulse rounded-3xl" />
});

const CinematicFooter = dynamic(() => import("@/components/ui/cinematic-footer").then(mod => mod.CinematicFooter), {
  ssr: true,
  loading: () => <div className="w-full h-64 bg-black" />
});

const FloatingMenu = dynamic(() => import("@/components/ui/floating-menu").then(mod => mod.FloatingMenu), {
  ssr: false
});

export default function Home() {
  const router = useRouter();
  
  // Real-time Authentication state
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatarUrl?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));

    // Refresh ScrollTrigger calculations on mount when returning from other pages
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        ScrollTrigger.refresh();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSetup = () => {
    const el = document.getElementById("setup-session");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      const textarea = el.querySelector("textarea");
      if (textarea) {
        textarea.focus();
      }
    }
  };

  return (
    <div className="relative overflow-x-clip pb-0">

      {/* Header/Nav */}
      <header className="absolute top-4 sm:top-6 left-0 w-full px-4 sm:px-6 md:px-12 max-w-[1400px] right-0 mx-auto flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-wide text-white/90 cursor-pointer group flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="flex">
              {"Mentra".split("").map((char, i) => (
                <span 
                  key={i} 
                  style={{ display: "inline-block", overflow: "hidden", height: "1.2em", lineHeight: "1.2em" }}
                >
                  <span 
                    className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[1.2em]"
                    style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      transitionDelay: `${i * 35}ms` 
                    }}
                  >
                    <span style={{ height: "1.2em", display: "flex", alignItems: "center" }}>{char}</span>
                    <span style={{ height: "1.2em", display: "flex", alignItems: "center", color: "white" }}>{char}</span>
                  </span>
                </span>
              ))}
            </span>
            <span className="text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">.</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {!authLoading && (
            user ? (
              <>
                <GlassButton 
                  size="sm"
                  className="text-xs px-4"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </GlassButton>

                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 hover:opacity-85 transition-opacity px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/25 shadow-sm"
                  title="View Candidate Vault"
                >
                  <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                  <span className="text-xs text-white/90 font-medium pr-1">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <GlassButton 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:inline-flex text-xs px-4" 
                  onClick={() => router.push("/login")}
                >
                  Login
                </GlassButton>
                <GlassButton 
                  size="sm" 
                  className="text-xs px-4" 
                  onClick={() => router.push("/register")}
                >
                  Sign Up
                </GlassButton>
              </>
            )
          )}
        </div>
      </header>

      {/* Hero Section with Interactive Grid Background */}
      <section className="relative min-h-screen lg:sticky lg:top-0 lg:h-[100svh] w-full flex items-center z-10 bg-black pt-28 pb-16 lg:py-0 overflow-hidden">
        
        {/* Interactive Grid Background */}
        <InteractiveGridBackground />

        {/* Ambient White Center Glow & Noise */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)] blur-[140px] pointer-events-none z-10" />

        <main className="container mx-auto px-4 sm:px-6 z-20 relative mt-0">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Hero Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4)] w-fit backdrop-blur-md">
              <div className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </div>
              <span className="text-white/70 text-[11px] font-normal tracking-wide">Adaptive Role Simulation</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tighter leading-[1.1] mb-6 text-white/95 select-none cursor-default flex flex-col items-start gap-1">
              <RollText 
                text="Master the interview." 
                className="text-white"
                duplicateClassName="text-white/40"
              />
              <RollText 
                text="Before it even happens." 
                className="text-white"
                duplicateClassName="text-white/40"
              />
            </h1>
            
            <p className="text-base font-light text-white/60 max-w-lg leading-relaxed">
              Your personal AI career mentor. Paste any job description, get a tailored mock interview, and track your weak areas over time.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 mt-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                Voice & Text Sessions
              </div>
              <div className="hidden sm:block w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                Instant AI Feedback
              </div>
              <div className="hidden sm:block w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                Personalized to Role
              </div>
            </div>
          </motion.div>

          {/* Setup Card Form with Volumetric LaserFlow Beam */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:ml-auto relative group"
          >
            {/* Volumetric LaserFlow Beam */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0 -top-[520px] lg:-top-[260px] w-[500px] sm:w-[600px] h-[1040px] lg:h-[520px]"
            >
              <LaserFlow
                color="#FFFFFF"
                horizontalBeamOffset={0.0}
                verticalBeamOffset={0.0}
                horizontalSizing={0.65}
                verticalSizing={3.2}
                wispDensity={1}
                wispSpeed={15.0}
                wispIntensity={5.0}
                fogIntensity={0.45}
                fogScale={0.3}
                flowSpeed={0.35}
                flowStrength={0.25}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent blur-3xl -z-10 rounded-[3rem] opacity-30 pointer-events-none" />
            <Card id="setup-session" className="border-white/15 bg-black/80 backdrop-blur-2xl shadow-2xl shadow-black/90 overflow-hidden relative z-10 pt-0 gap-0 scroll-mt-28">
              <div className="absolute inset-0 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2)] pointer-events-none rounded-xl z-10" />
              
              {/* Terminal Header */}
              <div className="h-8 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2 relative z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
              </div>

              <CardHeader className="pt-5 pb-2 relative z-20">
                <CardTitle className="text-xs uppercase tracking-widest font-semibold text-white/90">Start a new session</CardTitle>
                <CardDescription className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Paste the job details below to generate a tailored interview.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SetupSessionForm />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </main>
      </section>

      {/* How it Works Section */}
      <motion.section 
        id="how-it-works" 
        className="relative min-h-screen lg:sticky lg:top-0 lg:h-[100svh] w-full flex items-center z-20 bg-[#060606] border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] py-16 lg:py-0 overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Background Ambient White Glow & Noise */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)] blur-[140px] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10 opacity-15" />

        <div className="w-full relative z-10 pointer-events-none">
          <Features 
            features={[
              {
                id: 1,
                icon: "solar:document-text-linear",
                title: "1. Paste & Tailor",
                description: "Paste your target job description, upload your resume, and set the culture keywords. Mentra builds a custom persona instantly.",
                image: "/slide1.mp4"
              },
              {
                id: 2,
                icon: "solar:microphone-3-linear",
                title: "2. Practice Live",
                description: "Engage in a realistic chat or voice interview. The AI dynamically adapts the difficulty based on your performance.",
                image: "/slide2.mp4"
              },
              {
                id: 3,
                icon: "solar:chart-square-linear",
                title: "3. Get Actionable Feedback",
                description: "Receive an instant Readiness Score, granular rubric breakdowns, and targeted advice on how to fix your weak spots.",
                image: "/slide3.mp4"
              }
            ]}
          />
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="relative min-h-screen lg:sticky lg:top-0 lg:h-[100svh] w-full flex flex-col justify-center z-30 bg-black border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] py-20 lg:py-0 overflow-visible lg:overflow-hidden">
        <InteractiveGridBackground />
        <div className="container mx-auto px-4 relative z-10 py-8 lg:py-0">
        <motion.div 
          className="text-center mb-10 lg:mb-16"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 mb-3 block">
            Powerful Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white/90 mt-2 mb-6">
            <RollText text="Engineered for Precision" duplicateClassName="text-white/40" />
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <FeatureCard 
            feature={{
              title: "Role-Specific Questions",
              description: "AI extracts requirements from your target JD to simulate exact real-world engineering questions.",
              icon: Target
            }}
          />
          <FeatureCard 
            feature={{
              title: "Instant Audio Synthesis",
              description: "Zero-lag voice synthesis that mirrors natural human cadence and dynamic conversational timing.",
              icon: Mic
            }}
          />
          <FeatureCard 
            feature={{
              title: "Competency Heatmap",
              description: "Continuous telemetry tracking your mastery in state machines, layout thrashing, and algorithms.",
              icon: TrendingUp
            }}
          />
          <FeatureCard 
            feature={{
              title: "Grill Mode Rigor",
              description: "AI challenges vague answers, demanding deep technical trade-offs and architectural depth.",
              icon: ShieldAlert
            }}
          />
        </div>
        </div>
      </section>

      {/* Interactive Gateway Node Flow */}
      <section id="orchestration" className="relative min-h-screen lg:sticky lg:top-0 lg:h-[100svh] w-full flex flex-col justify-center z-40 bg-[#060606] border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] py-16 lg:py-0 overflow-hidden">
        {/* Background Ambient White Glow & Noise */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)] blur-[140px] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10 opacity-15" />

        <div className="container mx-auto px-4 z-10 relative">
          <div className="text-center mb-6 max-w-4xl mx-auto">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 mb-3 inline-block px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              Adaptive Interview Engine
            </span>
            <ScrollReveal
              baseOpacity={0.08}
              enableBlur={true}
              baseRotation={0}
              blurStrength={12}
              triggerSelector="#orchestration"
              start="top 75%"
              end="top 25%"
              containerClassName="my-2"
              textClassName="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-white leading-snug"
            >
              Dynamic 15-Question Loop Tailored to Your Job Description &amp; Resume.
            </ScrollReveal>
            <p className="text-xs sm:text-sm text-white/45 max-w-2xl mx-auto font-light leading-relaxed mt-4">
              Mentra cross-examines your actual projects, calibrates difficulty to your experience level, and triggers deep-dive follow-up probes on shallow answers.
            </p>
          </div>
          
          {/* Premium Terminal Container */}
          <div className="w-full max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-black/60 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] relative group/flow flex flex-col">
            {/* Terminal Top Window Chrome Bar */}
            <div className="h-10 sm:h-11 border-b border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center justify-between px-4 sm:px-5 relative z-20 select-none">
              {/* Left: Window controls & title */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 shadow-[0_0_6px_rgba(255,95,86,0.4)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 shadow-[0_0_6px_rgba(255,189,46,0.4)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 shadow-[0_0_6px_rgba(39,201,63,0.4)]" />
                </div>
                <div className="h-3 w-px bg-white/10 mx-1 hidden sm:block" />
                <div className="flex items-center gap-2 text-white/50 text-[11px] font-mono font-light">
                  <Terminal className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white/80 font-medium">mentra-interview-engine</span>
                  <span className="text-white/30 hidden md:inline">--mode=adaptive-loop</span>
                </div>
              </div>

              {/* Right: Live Telemetry Badges */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE SESSION</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-white/40">
                  <span>15 QUESTIONS</span>
                </div>
              </div>
            </div>

            {/* Main Terminal Viewport with Shader & HUD Elements */}
            <div className="relative w-full h-[360px] sm:h-[420px] bg-black/90 overflow-hidden">
              {/* Floating HUD Top-Left: Command Line / Pipeline Stream */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex flex-col gap-1 text-[10px] font-mono text-white/40 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-white/75">
                  <span className="text-emerald-400">❯</span>
                  <span>session.evaluate()</span>
                </div>
                <div className="text-white/30 text-[9px]">
                  loop: 15 questions • seniority: calibrated • rubric: 4-criteria
                </div>
              </div>

              {/* Floating HUD Top-Right: Active Node Routing Matrix */}
              <div className="absolute top-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 text-[10px] font-mono text-white/50 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                <span>FOLLOW-UP PROBES ACTIVE</span>
              </div>

              {/* Interactive Text Cursor with 100% Real Features */}
              <TextCursor
                items={[
                  { label: "JD & Resume Tailoring", icon: FileText },
                  { label: "15-Question Loop", icon: Brain },
                  { label: "Seniority Calibration", icon: Target },
                  { label: "Deep-Dive Follow-ups", icon: ShieldAlert },
                  { label: "4-Criteria Scoring", icon: Activity },
                  { label: "Weak Topic Tracking", icon: TrendingUp }
                ]}
                spacing={85}
                maxPoints={6}
                exitDuration={0.4}
                removalInterval={25}
                randomFloat={true}
                followMouseDirection={false}
              >
                <div className="w-full h-full pointer-events-none">
                  <GatewayFlow />
                </div>
              </TextCursor>

              {/* Bottom Terminal Status Bar Footer */}
              <div className="absolute bottom-0 inset-x-0 h-8 border-t border-white/10 bg-black/75 backdrop-blur-md z-20 flex items-center justify-between px-4 text-[10px] font-mono text-white/40 pointer-events-none select-none">
                <div className="flex items-center gap-3">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> STATUS: ADAPTIVE
                  </span>
                  <span className="hidden md:inline text-white/20">|</span>
                  <span className="hidden md:inline">RUBRIC: 4-CRITERIA</span>
                  <span className="hidden md:inline text-white/20">|</span>
                  <span className="hidden md:inline">EVAL: REAL-TIME</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <span className="hidden sm:inline">DEEP-DIVE PROBING:</span>
                  <span className="text-white/80 font-medium">ENABLED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Reveal Footer */}
      <div className="relative z-50 bg-black">
        <CinematicFooter />
      </div>

      {/* Bottom Floating Navigation Pill */}
      <FloatingMenu />

    </div>
  );
}
