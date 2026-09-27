import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#020202] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* 404 Display */}
        <div className="space-y-2">
          <h1 className="text-[120px] font-bold leading-none tracking-tighter text-white/[0.06] select-none">
            404
          </h1>
          <div className="-mt-14 space-y-2">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Page Not Found
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-[0.97]"
          >
            <Home className="w-3.5 h-3.5" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
