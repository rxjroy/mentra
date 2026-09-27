import React from "react";

export function InterviewSkeleton() {
  return (
    <div className="h-screen w-full bg-[#020202] text-white flex flex-col overflow-hidden font-sans relative select-none animate-pulse">
      {/* Ambient Background Radial Glows */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)] blur-[120px] pointer-events-none -z-20" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04)_0%,transparent_70%)] blur-[140px] pointer-events-none -z-20" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04)_0%,transparent_70%)] blur-[130px] pointer-events-none -z-20" />
      <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10 opacity-20" />

      {/* Top Navbar Skeleton */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-2xl px-4 md:px-8 flex items-center justify-between shrink-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
        {/* Left: Back button & Role metadata */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-40 sm:w-56 bg-white/20 rounded-md" />
              <div className="h-4 w-16 bg-white/10 rounded-full hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-28 bg-white/10 rounded" />
              <div className="h-3 w-3 rounded-full bg-white/10 hidden sm:block" />
              <div className="h-3 w-16 bg-white/10 rounded font-mono hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Right: Controls & Progress Pill */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Voice Toggle Button Skeleton */}
          <div className="h-8 w-28 sm:w-32 rounded-full bg-white/5 border border-white/10" />

          {/* Question Progress Pill Skeleton */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="h-3 w-14 bg-white/10 rounded" />
            <div className="h-3 w-8 bg-white/20 rounded font-mono" />
            <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="h-full w-1/3 bg-white/30 rounded-full" />
            </div>
          </div>

          {/* End Interview Button Skeleton */}
          <div className="h-8 w-24 rounded-full bg-white/20" />
        </div>
      </header>

      {/* Main Grid: Left Chat Arena (8 cols) + Right Radar Copilot (4 cols) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left: Chat Session Feed (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-[#050505]/90 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden relative">
          
          {/* Message History Skeleton */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {/* AI Initial Question Message Bubble */}
            <div className="flex flex-col w-full items-start">
              <div className="max-w-[90%] md:max-w-[85%] w-full">
                <div className="p-5 md:p-6 rounded-[1.5rem] rounded-tl-md border border-white/10 bg-[#090909] shadow-xl space-y-4">
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/15 border border-white/20" />
                      <div className="h-3 w-20 bg-white/20 rounded" />
                      <div className="h-2.5 w-12 bg-white/10 rounded" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-16 bg-white/10 rounded-full" />
                      <div className="h-4 w-24 bg-white/10 rounded-full hidden sm:block" />
                    </div>
                  </div>

                  {/* Question Body Lines */}
                  <div className="space-y-2.5 pt-1">
                    <div className="h-3.5 w-full bg-white/15 rounded" />
                    <div className="h-3.5 w-[92%] bg-white/15 rounded" />
                    <div className="h-3.5 w-[75%] bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Response Skeleton (Right-aligned) */}
            <div className="flex flex-col w-full items-end">
              <div className="max-w-[85%] md:max-w-[75%] w-full">
                <div className="p-4 md:p-5 rounded-[1.5rem] rounded-tr-md bg-white/[0.04] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <div className="h-2.5 w-12 bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-white/20 rounded" />
                  </div>
                  <div className="h-3 w-full bg-white/15 rounded" />
                  <div className="h-3 w-[80%] bg-white/15 rounded" />
                </div>
              </div>
            </div>

            {/* Follow-up / Evaluation Feedback Message Skeleton */}
            <div className="flex flex-col w-full items-start">
              <div className="max-w-[90%] md:max-w-[85%] w-full">
                <div className="p-5 md:p-6 rounded-[1.5rem] rounded-tl-md border border-white/10 bg-[#090909] space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/15 border border-white/20" />
                      <div className="h-3 w-20 bg-white/20 rounded" />
                      <div className="h-2.5 w-12 bg-white/10 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-white/20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-full bg-white/15 rounded" />
                    <div className="h-3.5 w-[85%] bg-white/15 rounded" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Chat Input Bar Skeleton */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 shrink-0" />
              <div className="flex-1 h-11 rounded-full bg-white/[0.04] border border-white/10 px-4 flex items-center">
                <div className="h-3.5 w-48 bg-white/10 rounded" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 shrink-0" />
            </div>
          </div>

        </div>

        {/* Right: Live Radar Copilot (4 Cols) */}
        <div className="hidden lg:block lg:col-span-4 h-full min-h-0">
          <div className="h-full bg-[#050505]/90 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Header with Live Signal */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
                <div className="h-3.5 w-32 bg-white/20 rounded" />
              </div>
              <div className="h-5 w-20 bg-white/10 rounded-full" />
            </div>

            {/* Radar Visualizer Polygon Simulation */}
            <div className="py-4 flex flex-col items-center justify-center relative">
              <div className="w-36 h-36 rounded-full border border-dashed border-white/15 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/20" />
                </div>
              </div>
            </div>

            {/* 4 Rubric Metric Bars Skeleton */}
            <div className="space-y-3.5 pt-2 border-t border-white/10">
              <div className="h-2.5 w-28 bg-white/10 rounded mb-2" />
              {[
                { labelWidth: "w-14", valWidth: "w-8" },
                { labelWidth: "w-16", valWidth: "w-8" },
                { labelWidth: "w-12", valWidth: "w-8" },
                { labelWidth: "w-18", valWidth: "w-8" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className={`h-3 ${item.labelWidth} bg-white/15 rounded`} />
                    <div className={`h-3 ${item.valWidth} bg-white/20 rounded font-mono`} />
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-white/20 rounded-full w-3/4" />
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted Skill Keywords Badges Skeleton */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="h-2.5 w-32 bg-white/10 rounded" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-24 rounded-md bg-white/5 border border-white/10" />
                <div className="h-6 w-20 rounded-md bg-white/5 border border-white/10" />
                <div className="h-6 w-28 rounded-md bg-white/5 border border-white/10" />
              </div>
            </div>

            {/* Live Coaching Tip Box Skeleton */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white/10" />
                <div className="h-3 w-28 bg-white/20 rounded" />
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded" />
              <div className="h-2.5 w-4/5 bg-white/5 rounded" />
            </div>

            {/* Bottom Card Encrypted Telemetry */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/30 shrink-0">
              <div className="h-3 w-32 bg-white/10 rounded" />
              <div className="h-3 w-20 bg-white/5 rounded font-mono" />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
