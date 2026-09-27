"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Lock, Database, UserCheck, EyeOff, Server, Mail, ArrowRight, FileText } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import InteractiveGridBackground from "@/components/ui/interactive-grid-background";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      id: "overview",
      icon: ShieldCheck,
      title: "1. Overview & Core Privacy Commitment",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            Mentra is an AI-powered technical interview preparation and career acceleration platform. We treat your privacy and personal career data with the highest standard of confidentiality and integrity.
          </p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-white/90 text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>
              <strong>Zero Data Selling:</strong> We never sell, rent, or monetize your personal profile, interview recordings, or uploaded resumes to third-party advertisers or recruiters without your explicit consent.
            </span>
          </div>
        </div>
      )
    },
    {
      id: "data-collection",
      icon: Database,
      title: "2. Information We Collect",
      content: (
        <div className="space-y-4 text-white/70 font-light leading-relaxed text-sm">
          <p>To provide personalized AI mock interviews and evaluations, we collect only the necessary data points:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <h4 className="text-white font-medium text-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-white/80" /> Account & Identity
              </h4>
              <p className="text-xs text-white/60">
                Full name, email address, salted password hashes (bcrypt), and optional OAuth identifiers from Google or GitHub.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <h4 className="text-white font-medium text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-white/80" /> Resume & Job Target Data
              </h4>
              <p className="text-xs text-white/60">
                Uploaded PDF/DOCX resumes (up to 5MB) and job descriptions used solely to calibrate role-specific interview questions.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <h4 className="text-white font-medium text-xs flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-white/80" /> Voice & Session Audio
              </h4>
              <p className="text-xs text-white/60">
                Microphone audio streams processed during active mock interviews for real-time speech-to-text transcription.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <h4 className="text-white font-medium text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-white/80" /> Security & Telemetry
              </h4>
              <p className="text-xs text-white/60">
                IP addresses, session tokens, and request timestamps strictly utilized for brute-force rate-limiting and DDoS mitigation.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "ai-processing",
      icon: EyeOff,
      title: "3. AI Inference & Model Privacy",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            Mentra utilizes enterprise-grade AI LLM providers (Groq Cloud API and Google Gemini API) for question generation, conversational voice turns, and performance scoring.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-white/60 pl-1">
            <li>Your private interview answers are processed transiently via secure API gateways over TLS 1.3 encryption.</li>
            <li>Inference requests sent to our AI providers are governed under zero-retention developer agreements that do not train foundation models on your private interview submissions.</li>
          </ul>
        </div>
      )
    },
    {
      id: "data-retention",
      icon: Server,
      title: "4. Data Retention & User Control",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            You have full ownership and authority over your data stored in Mentra:
          </p>
          <div className="space-y-2 text-xs text-white/60">
            <p>• <strong>Session History:</strong> Past interview reports, transcripts, and readiness scores are stored in your encrypted user account vault until you choose to delete them.</p>
            <p>• <strong>Guest Sessions:</strong> Anonymous practice interviews without an account expire after 7 days unless claimed by registering.</p>
            <p>• <strong>Account Deletion:</strong> You can permanently purge your account and all associated interview telemetry at any time by contacting our security desk.</p>
          </div>
        </div>
      )
    },
    {
      id: "security-measures",
      icon: Lock,
      title: "5. Security Safeguards",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            We implement enterprise-standard physical, technical, and organizational defenses:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
              <span className="text-white font-medium block mb-1">Encrypted In Transit</span>
              <span className="text-white/50 text-[11px]">Strict HTTPS & TLS 1.3 on all API endpoints</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
              <span className="text-white font-medium block mb-1">Timing-Safe Auth</span>
              <span className="text-white/50 text-[11px]">Constant-time OTP & 2FA verification</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
              <span className="text-white font-medium block mb-1">Brute-Force Shield</span>
              <span className="text-white/50 text-[11px]">Intelligent multi-tier rate limiting</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "contact",
      icon: Mail,
      title: "6. Privacy Inquiries & Contact",
      content: (
        <div className="space-y-2 text-white/70 font-light leading-relaxed text-sm">
          <p>
            If you have questions about this Privacy Policy, your personal data, or wish to submit a data export/deletion request, please contact our team directly:
          </p>
          <div className="pt-2">
            <a 
              href="mailto:mentrainterview@gmail.com" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white hover:bg-white/10 transition-colors text-xs font-mono"
            >
              <Mail className="w-3.5 h-3.5 text-white" />
              mentrainterview@gmail.com
            </a>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-white relative selection:bg-white selection:text-black overflow-x-hidden">
      {/* Dynamic Background */}
      <InteractiveGridBackground />
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-[#070707]/60 to-[#070707] pointer-events-none z-0" />

      {/* Floating Glass Navigation Header */}
      <header className="sticky top-4 z-50 max-w-5xl mx-auto px-4">
        <div className="backdrop-blur-xl bg-[#0c0c0c]/80 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <GlassButton 
              size="icon" 
              variant="outline" 
              onClick={() => router.push("/")}
              className="w-9 h-9 min-w-9 min-h-9 border-white/15 hover:border-white/30"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </GlassButton>
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-semibold tracking-tight text-white text-base">Mentra</span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10">
                Legal
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/terms">
              <GlassButton variant="ghost" size="sm" className="text-xs text-white/60 hover:text-white">
                Terms of Service
              </GlassButton>
            </Link>
            <Link href="/register">
              <GlassButton size="sm" className="text-xs">
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </GlassButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-24 space-y-12">
        {/* Title Block */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/15 text-white/80 text-xs font-mono"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Privacy Architecture</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white"
          >
            Privacy Policy
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm font-light leading-relaxed"
          >
            How Mentra protects your candidate profile, interview audio streams, and evaluation data with transparent security principles.
          </motion.p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono text-white/40">
            <span>Effective: August 2026</span>
            <span>•</span>
            <span>Version 2.4</span>
          </div>
        </div>

        {/* Section Cards */}
        <div className="space-y-6">
          {sections.map((sec, index) => {
            const Icon = sec.icon;
            return (
              <motion.section
                key={sec.id}
                id={sec.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0c]/70 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] space-y-4"
              >
                <div className="flex items-center gap-3">
                  <GlassButton size="icon" className="w-10 h-10 min-w-10 min-h-10 pointer-events-none" tabIndex={-1}>
                    <Icon className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </GlassButton>
                  <h2 className="text-base sm:text-lg font-medium text-white tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                <div className="pt-1">
                  {sec.content}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Mentra AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-white/70 hover:text-white underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/login" className="text-white/70 hover:text-white underline underline-offset-4">
              Sign In
            </Link>
            <Link href="/" className="text-white/70 hover:text-white underline underline-offset-4">
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
