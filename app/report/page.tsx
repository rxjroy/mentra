"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { ArrowLeft, Download, RefreshCcw, CheckCircle2, AlertCircle, Sparkles, ChevronRight, Loader2, Award } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InterviewSession, QuestionData } from "@/lib/types/interview";
import { ReportSkeleton } from "@/components/report-skeleton";
import { EvaluationPdfDocument } from "@/components/evaluation-pdf-document";
import Link from "next/link";

interface DisplayQuestion {
  id: number;
  questionId: string;
  question: string;
  topic: string;
  difficulty: string;
  userAnswer: string;
  modelAnswer: string;
  feedback: string;
  scores: {
    clarity: number;
    depth: number;
    structure: number;
    relevance: number;
  };
  strengths: string[];
  improvements: string[];
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || searchParams.get("id");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);

      let currentUser: any = null;
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          currentUser = authData.user;
          setIsGuest(!authData.user);
        }
      } catch {
        setIsGuest(true);
      }

      if (sessionId) {
        try {
          const res = await fetch(`/api/interview/session/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.session) {
              setSession(data.session);
              // If user is authenticated, ensure session is linked in their vault
              if (currentUser && (!data.session.userId || data.session.userId !== currentUser.id)) {
                fetch("/api/interview/migrate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId })
                }).catch(() => {});
              }
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Failed fetching server session:", e);
        }
      }

      // Check localStorage
      if (typeof window !== "undefined") {
        const localId = sessionId || localStorage.getItem("mentra_active_session_id");
        if (localId) {
          const localStr = localStorage.getItem(`mentra_session_${localId}`);
          if (localStr) {
            try {
              setSession(JSON.parse(localStr));
              setIsLoading(false);
              return;
            } catch (e) {
              console.warn("Error parsing local report session:", e);
            }
          }
        }
      }

      setIsLoading(false);
    }

    loadReport();
  }, [sessionId]);

  // Filter to ONLY questions that were actually answered/evaluated
  const answeredQuestions = (session?.questions || []).filter(q => q.attempts && q.attempts.length > 0);

  const questionsList: DisplayQuestion[] = answeredQuestions.map((q, idx) => {
    const latestAttempt = q.attempts[q.attempts.length - 1];
    return {
      id: idx + 1,
      questionId: q.id,
      question: q.text,
      topic: latestAttempt?.extractedTopics?.[0] || (q.type === "technical" ? "Technical Architecture" : q.type === "hr" ? "HR & Background" : "Applied Problem Solving"),
      difficulty: q.difficulty.toUpperCase(),
      userAnswer: latestAttempt?.text || "",
      modelAnswer: latestAttempt?.modelAnswer || "Model answer articulating problem constraints, diagnostic tooling, and benchmark metrics.",
      feedback: latestAttempt?.feedback || "Candidate provided a clear response.",
      scores: latestAttempt?.scores || { clarity: 0, depth: 0, structure: 0, relevance: 0 },
      strengths: latestAttempt?.strengths || [],
      improvements: latestAttempt?.improvements || []
    };
  });

  const activeQuestion = questionsList[selectedQuestionIdx] || questionsList[0];
  const readiness = session?.readinessScore ?? (questionsList.length > 0 ? 70 : 0);
  const categoryScores = session?.categoryScores || {
    technical: readiness || 0,
    behavioral: readiness || 0,
    communication: readiness || 0,
    consistency: readiness || 0
  };

  const weakTopics = session?.weakTopics || [];

  if (isLoading) {
    return <ReportSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen w-full bg-[#020202] text-white flex flex-col font-sans relative pb-20 print:hidden">
      
      {/* Background Ambient Glows & Noise Canvas */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07)_0%,transparent_70%)] blur-[140px] pointer-events-none -z-20" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[700px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04)_0%,transparent_70%)] blur-[150px] pointer-events-none -z-20" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[700px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04)_0%,transparent_70%)] blur-[150px] pointer-events-none -z-20" />
      <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-2xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <GlassButton 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </GlassButton>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-medium tracking-tight text-white">
                {session?.role || "Technical"} Evaluation Report
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-white/80 text-[10px] font-medium border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                Completed
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              {session?.company ? `${session.company} · ` : ""}
              {session?.mode === "grill" ? "Grill Mode Simulation" : "Tailored Mock Interview"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <GlassButton 
            variant="outline" 
            size="sm"
            onClick={() => window.print()}
            className="text-xs px-3 sm:px-4 border-white/15 text-white/80 hover:text-white"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Export</span> PDF
          </GlassButton>
          
          <GlassButton 
            size="sm" 
            onClick={() => router.push("/")}
            className="text-xs px-4"
          >
            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
            New Session
          </GlassButton>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="container max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Guest Mode Save Prompt Banner */}
        {isGuest && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[1.8rem] bg-[#0c0c0c]/90 border border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/90" />
                <span className="text-sm font-medium text-white">Save This Evaluation to Your Dashboard</span>
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 text-[10px]">Guest Session</Badge>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-2xl">
                Create a free account to permanently save this interview score, track your candidate readiness curve over time, and practice recurring weak topic drills.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link 
                href={`/login?redirect=/report?sessionId=${session?.id || sessionId || ""}`}
                onClick={() => {
                  if (session?.id || sessionId) {
                    localStorage.setItem("mentra_claim_session_id", session?.id || sessionId || "");
                  }
                }}
              >
                <GlassButton variant="outline" size="sm" className="text-xs px-4 border-white/20">
                  Sign In
                </GlassButton>
              </Link>
              <Link 
                href={`/register?redirect=/report?sessionId=${session?.id || sessionId || ""}`}
                onClick={() => {
                  if (session?.id || sessionId) {
                    localStorage.setItem("mentra_claim_session_id", session?.id || sessionId || "");
                  }
                }}
              >
                <GlassButton size="sm" className="text-xs px-4">
                  Create Account
                </GlassButton>
              </Link>
            </div>
          </motion.div>
        )}
        {/* Executive Summary Grid (Fully Responsive: Auto on Mobile, Fixed Height on Desktop) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Readiness Score Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-8 min-h-[330px] lg:h-[330px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-5 sm:p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/[0.04] blur-[100px] pointer-events-none -z-10" />
            <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10 opacity-70" />

            <div>
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 mb-4 gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 block mb-0.5">Performance Overview</span>
                  <h2 className="text-base font-medium text-white">Interview Readiness Index</h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-medium shrink-0">
                  {readiness >= 85 ? "Senior Hire Signal" : readiness >= 70 ? "Ready for Onsite" : "Needs Targeted Review"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Radial Gauge with Smooth Animation (Zero Cropping with explicit viewBox) */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center relative py-1 sm:py-0">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center p-1">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90 overflow-visible">
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="48" 
                        className="stroke-white/10 fill-none stroke-[6]" 
                      />
                      <motion.circle 
                        cx="60" 
                        cy="60" 
                        r="48" 
                        className="stroke-white fill-none stroke-[6] shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                        strokeDasharray={301.6}
                        initial={{ strokeDashoffset: 301.6 }}
                        animate={{ strokeDashoffset: 301.6 - (301.6 * (readiness / 100)) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-light tracking-tighter text-white">{readiness}</span>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">/ 100</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/60 mt-1.5 font-medium">Overall Preparedness</span>
                </div>

                {/* Rubric Breakdown Progress Bars with Sleek Animation */}
                <div className="sm:col-span-8 space-y-3 sm:space-y-2.5">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/80 text-[11px]">Technical Architecture & Depth</span>
                      <span className="text-white font-mono text-[11px]">{categoryScores.technical}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${categoryScores.technical}%` }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                        className="h-full bg-white rounded-full" 
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/80 text-[11px]">STAR Behavioral Structure</span>
                      <span className="text-white font-mono text-[11px]">{categoryScores.behavioral}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${categoryScores.behavioral}%` }}
                        transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
                        className="h-full bg-white/90 rounded-full" 
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/80 text-[11px]">Communication & Cadence</span>
                      <span className="text-white font-mono text-[11px]">{categoryScores.communication}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${categoryScores.communication}%` }}
                        transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-white/80 rounded-full" 
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/80 text-[11px]">Score Consistency & Latency</span>
                      <span className="text-white font-mono text-[11px]">{categoryScores.consistency}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${categoryScores.consistency}%` }}
                        transition={{ duration: 1.0, ease: "easeOut", delay: 0.3 }}
                        className="h-full bg-white/70 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3.5 mt-5 sm:mt-0 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50 shrink-0">
              <span className="flex items-center gap-2 line-clamp-1 max-w-[80%]">
                <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
                {session?.overallSummary || `Evaluation synthesized across ${questionsList.length} completed question${questionsList.length === 1 ? '' : 's'}.`}
              </span>
              <span className="font-mono text-white/40 text-[11px] shrink-0">
                COMPLETED: {questionsList.length} / {session?.questions?.length || 15}
              </span>
            </div>
          </motion.div>

          {/* Revise Before Your Next Interview Card (Responsive Auto / Fixed Height) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-4 min-h-[300px] lg:h-[330px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-5 sm:p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 shrink-0">
              <AlertCircle className="w-4 h-4 text-white/80" />
              <h2 className="text-xs font-semibold tracking-wider text-white uppercase">
                Revise Before Next Mock
              </h2>
              <span className="ml-auto text-[10px] font-mono text-white/40">{weakTopics.length} Focus Areas</span>
            </div>

            {/* Scrollable List with strict min-h-0 */}
            <div className="flex-1 min-h-[140px] lg:min-h-0 overflow-y-auto custom-scrollbar space-y-2.5 pr-1.5 my-3 overscroll-contain">
              {weakTopics.length > 0 ? (
                weakTopics.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white truncate max-w-[190px]">{item.topic}</span>
                      <span className="text-[10px] font-mono text-white/50">{item.score}/10</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      {item.advice}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-2 text-xs text-white/40">
                  <CheckCircle2 className="w-6 h-6 text-white/30" />
                  <p>No critical weak topics flagged.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 shrink-0">
              <button 
                onClick={() => router.push("/")}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/90 font-medium transition-colors cursor-pointer"
              >
                {weakTopics.length > 0 ? "Target Weak Areas in Practice →" : "Start New Mock Simulation →"}
              </button>
            </div>
          </motion.div>
        </section>

        {/* Detailed Question By Question Analysis */}
        {questionsList.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#050505]/95 border border-white/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 block mb-1">Granular Breakdown</span>
                <h2 className="text-base sm:text-lg font-medium text-white">Question-by-Question Deep Dive</h2>
              </div>

              {/* Question Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10 overflow-x-auto max-w-full">
                {questionsList.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionIdx(idx)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 shrink-0",
                      selectedQuestionIdx === idx 
                        ? "bg-white text-black font-semibold shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Question Details */}
            {activeQuestion && (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2"
                >
                  
                  {/* Left Column: Question + Candidate Answer + AI Model Answer */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Prompt Card */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span className="font-mono uppercase">Question {activeQuestion.id} · {activeQuestion.difficulty}</span>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 text-[10px]">
                          {activeQuestion.topic}
                        </Badge>
                      </div>
                      <p className="text-sm md:text-base font-medium text-white leading-relaxed">
                        {activeQuestion.question}
                      </p>
                    </div>

                    {/* Candidate Answer */}
                    <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 block">Your Submitted Response</span>
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                        {activeQuestion.userAnswer}
                      </p>
                    </div>

                    {/* AI Gold Standard Model Answer */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-2 relative overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-white" />
                        <span className="text-[10px] uppercase font-mono tracking-widest text-white block">
                          AI 10/10 Gold Standard Benchmark
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-white/90 font-light leading-relaxed whitespace-pre-wrap">
                        {activeQuestion.modelAnswer}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: AI Critique & Rubric Card */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Rubric Score Mini Card */}
                    <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-4">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 block">Rubric Score Breakdown</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                          <span className="text-[10px] text-white/40 block">Clarity</span>
                          <span className="text-base font-semibold font-mono text-white">{activeQuestion.scores.clarity}/10</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                          <span className="text-[10px] text-white/40 block">Structure</span>
                          <span className="text-base font-semibold font-mono text-white">{activeQuestion.scores.structure}/10</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                          <span className="text-[10px] text-white/40 block">Depth</span>
                          <span className="text-base font-semibold font-mono text-white">{activeQuestion.scores.depth}/10</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                          <span className="text-[10px] text-white/40 block">Relevance</span>
                          <span className="text-base font-semibold font-mono text-white">{activeQuestion.scores.relevance}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Critique */}
                    <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-3">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 block">Actionable Feedback</span>
                      <p className="text-xs text-white/80 leading-relaxed">
                        {activeQuestion.feedback}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-[10px] font-medium uppercase text-white/60 block">Identified Strengths</span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-white/60">
                          {activeQuestion.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                  </div>

                </motion.div>
              </AnimatePresence>
            )}
          </motion.section>
        )}

      </main>
    </div>

    {/* Dedicated High-Contrast Executive Dossier (Visible ONLY during PDF Print/Export) */}
    <EvaluationPdfDocument
      session={session}
      readiness={readiness}
      categoryScores={categoryScores}
      weakTopics={weakTopics}
      questionsList={questionsList}
    />
  </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportContent />
    </Suspense>
  );
}
