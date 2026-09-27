"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, ShieldCheck, KeyRound, CheckCircle2, Lock } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassToast } from "@/components/ui/glass-toast";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { checkPasswordStrength } from "@/lib/security";
import InteractiveGridBackground from "@/components/ui/interactive-grid-background";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  
  // Modes: "login" (with step 1 credentials, step 2 2FA) or "forgot_password" (with step 1 email, step 2 reset code & new password)
  const [mode, setMode] = useState<"login" | "forgot_password">("login");
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [shakeResetPassword, setShakeResetPassword] = useState(false);
  const [attemptedResetSubmit, setAttemptedResetSubmit] = useState(false);

  const newPasswordStatus = useMemo(() => checkPasswordStrength(newPassword), [newPassword]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Reset state when switching modes
  const handleSwitchMode = (newMode: "login" | "forgot_password") => {
    setMode(newMode);
    setStep(1);
    setError(null);
    setSuccessMessage(null);
    setOtp("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAttemptedResetSubmit(false);
    setShakeResetPassword(false);
  };

  // --- LOGIN FLOW ---
  // Step 1: Validate Credentials & Request 2FA OTP
  const handleLoginCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      if (data.requireOtp) {
        setStep(2);
        setSuccessMessage(`A 6-digit security code was sent to ${email}`);
        setCooldown(data.cooldownSeconds || 60);
      }
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 2FA OTP & Sign In
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid security code");
      }

      // Migrate guest session if present
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

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirect = params?.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Failed to verify security code");
      setIsSubmitting(false);
    }
  };

  // Resend 2FA Login OTP
  const handleResendLoginOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend security code");
      }

      setSuccessMessage(`New security code sent to ${email}`);
      setCooldown(data.cooldownSeconds || 60);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
      setIsSubmitting(false);
    }
  };

  // --- FORGOT PASSWORD FLOW ---
  // Step 1: Request Password Reset OTP
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/password/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to request password reset");
      }

      setStep(2);
      setSuccessMessage(`A 6-digit reset code was dispatched to ${email}`);
      setCooldown(data.cooldownSeconds || 60);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
      setIsSubmitting(false);
    }
  };

  // Step 2: Confirm Password Reset
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAttemptedResetSubmit(true);

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit reset code.");
      return;
    }

    if (!newPasswordStatus.valid) {
      setError(newPasswordStatus.errors[0] || "Please fulfill all 5 password security checkmarks.");
      setShakeResetPassword(true);
      setTimeout(() => setShakeResetPassword(false), 600);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/password/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Success! Switch back to login with success message
      setMode("login");
      setStep(1);
      setOtp("");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password reset successfully! You can now sign in with your new password.");
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
      setIsSubmitting(false);
    }
  };

  // Resend Password Reset OTP
  const handleResendResetOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/password/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setSuccessMessage(`New reset code sent to ${email}`);
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

      <GlassToast 
        show={Boolean(successMessage && !error)}
        variant="success"
        title="Success"
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
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
            if (mode === "forgot_password") {
              handleSwitchMode("login");
            } else if (step === 2) {
              setStep(1);
              setError(null);
              setOtp("");
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
      <div className="w-full max-w-md bg-[#070707]/90 border border-white/15 rounded-[2rem] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/[0.04] blur-[50px] pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* MODE 1: REGULAR LOGIN (STEP 1: CREDENTIALS, STEP 2: 2FA OTP) */}
          {/* ========================================================================= */}
          {mode === "login" && step === 1 && (
            <motion.div
              key="login-step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-medium tracking-tight text-white">Welcome back</h1>
                <p className="text-xs text-white/50 font-light">
                  Enter your credentials to access your secure candidate telemetry vault
                </p>
              </div>

              {/* Social Login OAuth Buttons */}
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
                    OR SIGN IN WITH EMAIL
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleLoginCredentialsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Email address</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-all font-light"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/80 block">Password</label>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("forgot_password")}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-all font-light"
                  />
                </div>

                <GlassButton 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={isSubmitting || !email || !password}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue & Verify Identity
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </GlassButton>

                {/* Terms of Service & Privacy Policy Notice */}
                <p className="text-[11px] text-white/40 text-center leading-relaxed pt-1">
                  By signing in, you agree to Mentra's{" "}
                  <Link href="/terms" target="_blank" className="text-white/70 hover:text-white underline underline-offset-2">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-white/70 hover:text-white underline underline-offset-2">
                    Privacy Policy
                  </Link>.
                </p>
              </form>

              {/* Footer Link */}
              <div className="text-center pt-2 border-t border-white/10 text-xs text-white/50">
                Don't have an account?{" "}
                <Link href="/register" className="text-white hover:underline font-medium underline-offset-4 ml-1">
                  Create account
                </Link>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1: STEP 2 -> 2FA OTP VERIFICATION */}
          {/* ========================================================================= */}
          {mode === "login" && step === 2 && (
            <motion.div
              key="login-step2"
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
                  <ShieldCheck className="w-6 h-6 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                </GlassButton>
                <h1 className="text-2xl font-medium tracking-tight text-white">Two-Factor Authentication</h1>
                <p className="text-xs text-white/60 font-light leading-relaxed">
                  We sent a 6-digit sign-in code to <span className="text-white font-medium">{email}</span>
                  <span className="block text-[11px] text-white/40 mt-1">(Check your Spam or Junk folder if you don't see it)</span>
                </p>
              </div>

              {/* 2FA Form */}
              <form onSubmit={handleVerifyLoginOtp} className="space-y-6">
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </GlassButton>
              </form>

              {/* Resend & Return */}
              <div className="text-center pt-2 border-t border-white/10 space-y-3">
                <div className="text-xs text-white/60">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    onClick={handleResendLoginOtp}
                    disabled={cooldown > 0 || isSubmitting}
                    className="text-white hover:underline font-medium underline-offset-4 disabled:opacity-40 disabled:hover:no-underline ml-1 cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                      setOtp("");
                    }}
                    className="text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    Sign in with a different email
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: FORGOT PASSWORD (STEP 1: ENTER EMAIL) */}
          {/* ========================================================================= */}
          {mode === "forgot_password" && step === 1 && (
            <motion.div
              key="forgot-step1"
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
                  <KeyRound className="w-6 h-6 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                </GlassButton>
                <h1 className="text-2xl font-medium tracking-tight text-white">Reset password</h1>
                <p className="text-xs text-white/50 font-light leading-relaxed">
                  Enter your account email to receive a single-use 6-digit security code
                </p>
              </div>

              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Account email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-all font-light"
                  />
                </div>

                <GlassButton 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Reset Code
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </GlassButton>
              </form>

              <div className="text-center pt-2 border-t border-white/10 text-xs text-white/50">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className="text-white hover:underline font-medium underline-offset-4 ml-1 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: FORGOT PASSWORD (STEP 2: ENTER CODE & NEW PASSWORD) */}
          {/* ========================================================================= */}
          {mode === "forgot_password" && step === 2 && (
            <motion.div
              key="forgot-step2"
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
                  <Lock className="w-6 h-6 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                </GlassButton>
                <h1 className="text-2xl font-medium tracking-tight text-white">Set new password</h1>
                <p className="text-xs text-white/60 font-light leading-relaxed">
                  Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span> and choose a new password
                </p>
              </div>

              <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                {/* 6-Digit OTP Box */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70 block text-center uppercase tracking-widest text-[10px]">
                    Enter 6-Digit Reset Code
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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">New password</label>
                  <input
                    id="reset-new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error?.includes("password") || error?.includes("Password")) {
                        setError(null);
                      }
                    }}
                    placeholder="•••••••••••• (min 8 chars, mixed case, symbol)"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border text-white placeholder-white/20 text-sm focus:outline-none transition-all font-light ${
                      shakeResetPassword
                        ? "border-red-500/60 ring-1 ring-red-500/30"
                        : "border-white/10 focus:border-white/30"
                    }`}
                  />
                  <PasswordStrengthIndicator 
                    password={newPassword} 
                    isInvalidAttempt={attemptedResetSubmit && !newPasswordStatus.valid}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">Confirm new password</label>
                  <input
                    id="reset-confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-all font-light"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-400 font-mono">Passwords do not match</p>
                  )}
                </div>

                <GlassButton 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </span>
                  )}
                </GlassButton>
              </form>

              {/* Resend & Return to sign in */}
              <div className="text-center pt-2 border-t border-white/10 space-y-3">
                <div className="text-xs text-white/60">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    onClick={handleResendResetOtp}
                    disabled={cooldown > 0 || isSubmitting}
                    className="text-white hover:underline font-medium underline-offset-4 disabled:opacity-40 disabled:hover:no-underline ml-1 cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("login")}
                    className="text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security Watermark */}
      <div className="mt-8 text-center text-xs text-white/30 flex items-center gap-2 z-20">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>End-to-End Encrypted Session Vault</span>
      </div>
    </div>
  );
}
