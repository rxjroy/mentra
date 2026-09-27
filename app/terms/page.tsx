"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Scale, Shield, UserCheck, AlertTriangle, FileText, Sparkles, Mail, ArrowRight } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import InteractiveGridBackground from "@/components/ui/interactive-grid-background";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TermsOfServicePage() {
  const router = useRouter();

  const sections = [
    {
      id: "agreement",
      icon: Scale,
      title: "1. Acceptance of Terms",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            By creating an account, accessing, or utilizing any features of Mentra (including AI mock interviews, speech transcription, resume calibration, and performance reports), you enter into a legally binding agreement to comply with these Terms of Service.
          </p>
          <p>
            If you do not agree to these terms, you must refrain from using the Mentra platform and services.
          </p>
        </div>
      )
    },
    {
      id: "account-security",
      icon: UserCheck,
      title: "2. Account Registration & Security",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            To unlock permanent session history and tailored progress metrics, you must create an account with accurate credentials:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-white/60 pl-1">
            <li><strong>Eligibility:</strong> You must be at least 13 years of age (or the minimum legal age in your jurisdiction) to use Mentra.</li>
            <li><strong>Credential Confidentiality:</strong> You are responsible for safeguarding your login password and single-use 2FA verification codes.</li>
            <li><strong>Account Integrity:</strong> You must immediately notify our security desk at <span className="text-white font-mono">mentrainterview@gmail.com</span> if you suspect unauthorized access to your account.</li>
          </ul>
        </div>
      )
    },
    {
      id: "acceptable-use",
      icon: Shield,
      title: "3. Acceptable Use & Conduct",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            Mentra is dedicated to providing high-quality interview preparation. You agree not to engage in any prohibited conduct, including:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium block">No Automated Exploits</span>
              <span className="text-white/50">Prohibited from running scraping bots or attempting to bypass backend rate limits.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium block">No Malicious Payloads</span>
              <span className="text-white/50">Prohibited from uploading corrupted files or exploiting audio/resume upload streams.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium block">No Reverse Engineering</span>
              <span className="text-white/50">Prohibited from extracting proprietary system prompts or evaluation weights.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium block">Ethical Career Usage</span>
              <span className="text-white/50">Content submitted must adhere to legal standards and respect intellectual rights.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "ai-disclaimer",
      icon: Sparkles,
      title: "4. AI Simulation & Educational Disclaimer",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-white/90 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Educational Practice Tool:</strong> Mentra's interviews, conversational speech models, and rubric scoring are simulation tools intended for self-improvement and interview skill practice.
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            AI scores and feedback evaluations do not guarantee employment, job offers, or specific compensation outcomes with any employer or third-party hiring organization.
          </p>
        </div>
      )
    },
    {
      id: "intellectual-property",
      icon: FileText,
      title: "5. Intellectual Property & Content Rights",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            • <strong>Your Content:</strong> You retain complete ownership and copyright of all resume documents, spoken answers, and custom job target notes submitted during your interview practice.
          </p>
          <p>
            • <strong>Mentra Platform:</strong> All software architecture, user interface elements, visual assets, evaluation algorithms, and branding remain the exclusive intellectual property of Mentra.
          </p>
        </div>
      )
    },
    {
      id: "termination",
      icon: Shield,
      title: "6. Modifications & Account Termination",
      content: (
        <div className="space-y-3 text-white/70 font-light leading-relaxed text-sm">
          <p>
            We continuously enhance our AI models and audio engine. We reserve the right to modify or refine platform capabilities to maintain security, performance, and legal compliance.
          </p>
          <p className="text-xs text-white/60">
            You may stop using Mentra and delete your account at any time. We reserve the right to suspend or terminate access for accounts that repeatedly violate rate limits or security policies.
          </p>
        </div>
      )
    },
    {
      id: "contact",
      icon: Mail,
      title: "7. Contact Information",
      content: (
        <div className="space-y-2 text-white/70 font-light leading-relaxed text-sm">
          <p>
            For legal inquiries, terms clarifications, or support requests, please contact:
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
            <Link href="/privacy">
              <GlassButton variant="ghost" size="sm" className="text-xs text-white/60 hover:text-white">
                Privacy Policy
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
            <Scale className="w-3.5 h-3.5 text-white" />
            <span>Platform Agreement & Guidelines</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white"
          >
            Terms of Service
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-sm font-light leading-relaxed"
          >
            Please read these terms carefully before using Mentra's AI mock interview platform and practice tools.
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
            <Link href="/privacy" className="text-white/70 hover:text-white underline underline-offset-4">
              Privacy Policy
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
