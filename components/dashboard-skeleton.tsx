import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#020202] text-white flex flex-col font-sans pb-16 relative overflow-hidden animate-pulse">
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-[120px] pointer-events-none -z-10" />

      {/* Top Navbar Skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#020202]/85 backdrop-blur-2xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-white/10 rounded-md" />
            <div className="h-3 w-48 bg-white/5 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-24 h-7 rounded-full bg-white/5 border border-white/10 hidden sm:block" />
          <div className="w-28 h-8 rounded-full bg-white/10" />
        </div>
      </header>

      {/* Main Container Skeleton */}
      <main className="container max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Top 4 Summary Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[1.6rem] bg-[#070707]/90 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-white/10 rounded" />
                <div className="h-4 w-12 bg-white/5 rounded-full" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="h-8 w-16 bg-white/15 rounded-lg" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden" />
            </div>
          ))}
        </section>

        {/* Mid Section: Trajectory Curve (8 Cols) + Weak Topics (4 Cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Trajectory Skeleton */}
          <div className="lg:col-span-8 h-[360px] max-h-[360px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="space-y-1">
                <div className="h-2.5 w-20 bg-white/10 rounded" />
                <div className="h-4 w-44 bg-white/15 rounded-md" />
              </div>
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>

            {/* Shimmer Chart Simulation */}
            <div className="flex-1 flex flex-col items-center justify-center my-3 relative overflow-hidden">
              <div className="w-full h-36 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 flex items-center justify-center">
                <div className="w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="h-3 w-56 bg-white/5 rounded" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          </div>

          {/* Right: Recurring Weak Topics Skeleton */}
          <div className="lg:col-span-4 h-[360px] max-h-[360px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="h-3 w-36 bg-white/15 rounded" />
              <div className="h-3 w-14 bg-white/5 rounded" />
            </div>

            <div className="flex-1 space-y-2.5 my-3 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-32 bg-white/10 rounded" />
                    <div className="h-2.5 w-12 bg-white/5 rounded" />
                  </div>
                  <div className="h-2.5 w-4/5 bg-white/5 rounded" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="w-full h-8 rounded-full bg-white/10" />
            </div>
          </div>
        </section>

        {/* Bottom Section: Recent Mock Interviews Vault Skeleton */}
        <section className="bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="h-2.5 w-20 bg-white/10 rounded" />
              <div className="h-4 w-40 bg-white/15 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-12 rounded-full bg-white/10" />
              <div className="h-7 w-20 rounded-full bg-white/5" />
              <div className="h-7 w-20 rounded-full bg-white/5" />
            </div>
          </div>

          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-48 bg-white/15 rounded" />
                    <div className="h-4 w-16 bg-white/5 rounded-full" />
                  </div>
                  <div className="h-3 w-56 bg-white/5 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-12 bg-white/10 rounded" />
                  <div className="h-8 w-24 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
