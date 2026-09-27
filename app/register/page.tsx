"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Mail, RefreshCw, Check } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassToast } from "@/components/ui/glass-toast";
import InteractiveGridBackground from "@/components/ui/interactive-grid-background";
import Link from "next/link";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { checkPasswordStrength } from "@/lib/security";

export default function RegisterPage() {
  const router = useRouter();
  
  // Step State: 1 = Form Entry, 2 = 6-Digit OTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [shakeTarget, setShakeTarget] = useState<"password" | "terms" | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Live password validation
  const passwordStatus = useMemo(() => checkPasswordStrength(password), [password]);

  // UI Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerShake = (target: "password" | "terms") => {
    setShakeTarget(target);
    setTimeout(() => setShakeTarget(null), 600);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAttemptedSubmit(true);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!passwordStatus.valid) {
      setError(passwordStatus.errors[0] || "Please fulfill all 5 password security checkmarks.");
      triggerShake("password");
      return;
    }

    if (!agreeToTerms) {
      setError("Please check the box to agree to the Terms of Service & Privacy Policy.");
      triggerShake("terms");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, agreeToTerms })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep(2);
      setSuccessMessage(`A 6-digit code has been sent to ${email}`);
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setCooldown(data.cooldownSeconds || 60);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and Activate Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      // Check if there is a guest session to migrate into the user vault
      const claimSessionId = typeof window !== "undefined" ? localStorage.getItem("mentra_claim_session_id") : null;
      if (claimSessionId) {
        try {
          await fetch("/api/interview/migrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: claimSessionId })
          });
          localStorage.removeItem("mentra_claim_session_id");
        } catch (e) {
          console.warn("Migration error:", e);
        }
      }

      // Successful verification and account activation -> Redirect to redirect target or Dashboard
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirect = params?.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Failed to verify code");
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, agreeToTerms: true })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setSuccessMessage(`New code sent to ${email}`);
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setCooldown(data.cooldownSeconds || 60);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020202] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Floating Glass Toast Notification (Zero Layout Shift / Never Expands Card) */}
      <GlassToast 
        show={Boolean(error)}
        variant="error"
        title="Notice"
        message={error}
        onDismiss={() => setError(null)}
      />

      {/* Interactive Grid Background */}
      <InteractiveGridBackground />

      {/* Background Ambient White Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)] blur-[140px] pointer-events-none z-10" />

      {/* Top Left Return Button */}
      <div className="absolute top-6 left-6 z-30">
        <GlassButton 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (step === 2) {
              setStep(1);
              setError(null);
            } else {
              router.push("/");
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </GlassButton>
      </div>

      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity z-20">
        <span className="text-2xl font-semibold tracking-tight text-white">
          Mentra<span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">.</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#070707]/90 border border-white/15 rounded-[2rem] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6 z-20">
        {/* Subtle Card Internal Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/[0.04] blur-[50px] pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* STEP 1: INITIAL REGISTRATION FORM */
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-medium tracking-tight text-white">Create an account</h1>
                <p className="text-xs text-white/50 font-light">
                  Unlock persistent candidate telemetry and historical performance vaults
                </p>
              </div>

              {/* Social Registration OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a href="/api/auth/oauth/github" className="w-full">
                  <GlassButton 
                    variant="outline" 
                    size="sm"
                    className="w-full text-xs border-white/15 hover:border-white/30"
                    type="button" 
                  >
                    <svg className="mr-2 h-4 w-4 fill-white" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </GlassButton>
                </a>

                <a href="/api/auth/oauth/google" className="w-full">
                  <GlassButton 
                    variant="outline" 
                    size="sm"
                    className="w-full text-xs border-white/15 hover:border-white/30"
                    type="button" 
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </GlassButton>
                </a>
              </div>

              {/* Hairline Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-[#070707] px-3 text-white/40 font-mono">
                    OR REGISTER WITH EMAIL
                  </span>
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Full name</label>
                  <input 
                    id="name" 
                    name="name"
                    type="text" 
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera" 
                    required 
                    className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Email address</label>
                  <input 
                    id="email" 
                    name="email"
                    type="email" 
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@work-email.com" 
                    required 
                    className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Create password</label>
                  <input 
                    id="password" 
                    name="password"
                    type="password" 
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error?.includes("password") || error?.includes("Password")) {
                        setError(null);
                      }
                    }}
                    required 
                    placeholder="•••••••••••• (min 8 chars, mixed case, symbol)"
                    className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] ${
                      shakeTarget === "password"
                        ? "border-red-500/60 ring-1 ring-red-500/30"
                        : "border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/30"
                    }`}
                  />
                  {/* Live Password Strength Indicator with Sleek Checklist */}
                  <PasswordStrengthIndicator 
                    password={password} 
                    isInvalidAttempt={attemptedSubmit && !passwordStatus.valid}
                  />
                </div>

                {/* Sleek Centered Terms of Service & Privacy Policy Agreement */}
                <motion.div 
                  animate={shakeTarget === "terms" ? { x: [-5, 5, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  onClick={() => {
                    setAgreeToTerms(!agreeToTerms);
                    if (error?.includes("Terms") || error?.includes("Policy")) setError(null);
                  }}
                  className={`flex items-center justify-center gap-2.5 py-1.5 px-3 rounded-xl cursor-pointer select-none group transition-all duration-200 ${
                    shakeTarget === "terms" 
                      ? "bg-red-500/[0.08] border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]" 
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0 ${
                    agreeToTerms 
                      ? "bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                      : "bg-white/[0.04] border-white/20 group-hover:border-white/40"
                  }`}>
                    {agreeToTerms && <Check className="w-3 h-3 stroke-[3.5]" />}
                  </div>
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors text-center leading-normal">
                    I agree to Mentra's{" "}
                    <Link 
                      href="/terms" 
                      target="_blank" 
                      onClick={(e) => e.stopPropagation()} 
                      className="text-white underline underline-offset-4 hover:text-white/90 font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link 
                      href="/privacy" 
                      target="_blank" 
                      onClick={(e) => e.stopPropagation()} 
                      className="text-white underline underline-offset-4 hover:text-white/90 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </motion.div>

                <GlassButton 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Sending verification code...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue & Verify Email
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </GlassButton>
              </form>

              {/* Footer Link */}
              <div className="text-center pt-2 border-t border-white/10 text-xs text-white/50">
                Already have an account?{" "}
                <Link href="/login" className="text-white hover:underline font-medium underline-offset-4 ml-1">
                  Sign in
                </Link>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION CARD */
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-3 text-center">
                <GlassButton 
                  size="icon" 
                  className="w-14 h-14 min-w-14 min-h-14 mx-auto pointer-events-none mb-1 shadow-[0_0_25px_rgba(255,255,255,0.15)]" 
                  tabIndex={-1}
                >
                  <Mail className="w-6 h-6 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                </GlassButton>
                <h1 className="text-2xl font-medium tracking-tight text-white">Verify your email</h1>
                <p className="text-xs text-white/60 font-light leading-relaxed">
                  We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
                  <span className="block text-[11px] text-white/40 mt-1">(Check your Spam or Junk folder if you don't see it)</span>
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/70 block text-center uppercase tracking-widest text-[10px]">
                    Enter 6-Digit Code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={(completedCode) => {
                      setOtp(completedCode);
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <GlassButton 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Activating Account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Confirm & Open Vault
                    </span>
                  )}
                </GlassButton>
              </form>

              {/* Resend Code & Back actions */}
              <div className="space-y-2 text-center text-xs text-white/50 pt-2 border-t border-white/10">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || isSubmitting}
                    className="text-white hover:underline font-medium disabled:opacity-40 disabled:hover:no-underline"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="text-white/40 hover:text-white transition-colors block mx-auto text-[11px]"
                >
                  Change email address
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
