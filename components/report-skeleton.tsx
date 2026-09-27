import React from "react";

export function ReportSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#020202] text-white flex flex-col font-sans pb-20 relative overflow-hidden animate-pulse">
      {/* Ambient Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07)_0%,transparent_70%)] blur-[140px] pointer-events-none -z-20" />

      {/* Top Navbar Skeleton */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-2xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-white/15 rounded-md" />
            <div className="h-3 w-32 bg-white/5 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-24 h-8 rounded-full bg-white/5 border border-white/10 hidden sm:block" />
          <div className="w-28 h-8 rounded-full bg-white/10" />
        </div>
      </header>

      {/* Main Report Container Skeleton */}
      <main className="container max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Executive Summary Grid (2 Cards: 8 cols + 4 cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Readiness Index & Telemetry Card */}
          <div className="lg:col-span-8 min-h-[330px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-5 sm:p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="space-y-1">
                <div className="h-2.5 w-24 bg-white/10 rounded" />
                <div className="h-4 w-48 bg-white/15 rounded-md" />
              </div>
              <div className="h-6 w-28 rounded-full bg-white/5 border border-white/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-4">
              {/* Radial Gauge Placeholder */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/10 flex items-center justify-center">
                  <div className="h-8 w-12 bg-white/15 rounded" />
                </div>
              </div>

              {/* 4 Telemetry Bars Placeholder */}
              <div className="sm:col-span-8 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 w-32 bg-white/10 rounded" />
                      <div className="h-3 w-8 bg-white/5 rounded" />
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="h-3 w-48 bg-white/5 rounded" />
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>
          </div>

          {/* Executive Verdict Card */}
          <div className="lg:col-span-4 min-h-[330px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-5 sm:p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
            <div className="pb-3 border-b border-white/10">
              <div className="h-4 w-36 bg-white/15 rounded-md" />
            </div>

            <div className="space-y-2.5 my-3">
              <div className="h-3.5 w-full bg-white/10 rounded" />
              <div className="h-3.5 w-5/6 bg-white/10 rounded" />
              <div className="h-3.5 w-4/6 bg-white/10 rounded" />
              <div className="h-3.5 w-full bg-white/5 rounded mt-4" />
              <div className="h-3.5 w-3/4 bg-white/5 rounded" />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center gap-2">
              <div className="h-5 w-20 rounded-md bg-white/5" />
              <div className="h-5 w-24 rounded-md bg-white/5" />
            </div>
          </div>
        </section>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center gap-2 pb-2">
          <div className="h-9 w-28 rounded-full bg-white/10" />
          <div className="h-9 w-32 rounded-full bg-white/5" />
          <div className="h-9 w-36 rounded-full bg-white/5" />
        </div>

        {/* Breakdown Card Skeleton */}
        <section className="bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="h-4 w-40 bg-white/15 rounded" />
            <div className="h-6 w-16 bg-white/10 rounded-full" />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="h-4 w-3/4 bg-white/15 rounded" />
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-5/6 bg-white/5 rounded" />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="h-4 w-2/3 bg-white/15 rounded" />
            <div className="h-3 w-full bg-white/5 rounded" />
          </div>
        </section>
      </main>
    </div>
  );
}
