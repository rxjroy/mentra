"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { 
  ArrowLeft, 
  Mic, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InterviewSession, QuestionData, AnswerAttempt, RubricScores } from "@/lib/types/interview";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { InterviewSkeleton } from "@/components/interview-skeleton";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
  isFeedback?: boolean;
  isFollowUpProbe?: boolean;
  score?: number;
  scores?: RubricScores;
  feedbackText?: string;
  modelAnswer?: string;
  strengths?: string[];
  improvements?: string[];
  improvementScore?: number;
  tags?: string[];
}

const LiveAnalysisContent = React.memo(function LiveAnalysisContent({
  scores,
  difficulty,
  topics,
  difficultyAdjustment
}: {
  scores: RubricScores;
  difficulty: string;
  topics: string[];
  difficultyAdjustment?: { from: string; to: string; reason: string };
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1.5 flex-1 min-h-0 overscroll-contain">
        {/* Header with Live Signal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
            <h2 className="text-xs uppercase tracking-widest font-semibold text-white">Live Evaluation Radar</h2>
          </div>
          <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider">AI Copilot</span>
        </div>

        {/* Current Difficulty Metric */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60 font-medium">Adaptive Difficulty</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium border border-white/15 uppercase">
              {difficulty} Level
            </span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed">
            {difficultyAdjustment 
              ? difficultyAdjustment.reason
              : "Interviewer dynamically adjusting depth based on your live performance."}
          </p>
        </div>

        {/* Real-Time Competency Scores (Monochrome Progress Bars) */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 block">Real-Time Competency Meter</span>

          {/* Technical Depth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/80 font-medium flex items-center gap-1.5">
                <Icon icon="solar:cpu-bolt-linear" className="w-3.5 h-3.5 text-white/60" />
                Technical Depth
              </span>
              <span className="text-white font-semibold font-mono">{scores.depth.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-700" 
                style={{ width: `${Math.min(100, scores.depth * 10)}%` }}
              />
            </div>
          </div>

          {/* STAR Structure */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/80 font-medium flex items-center gap-1.5">
                <Icon icon="solar:target-linear" className="w-3.5 h-3.5 text-white/60" />
                STAR Structure
              </span>
              <span className="text-white font-semibold font-mono">{scores.structure.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-700" 
                style={{ width: `${Math.min(100, scores.structure * 10)}%` }}
              />
            </div>
          </div>

          {/* Communication Clarity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/80 font-medium flex items-center gap-1.5">
                <Icon icon="solar:microphone-3-linear" className="w-3.5 h-3.5 text-white/60" />
                Clarity & Tone
              </span>
              <span className="text-white font-semibold font-mono">{scores.clarity.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white/80 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-700" 
                style={{ width: `${Math.min(100, scores.clarity * 10)}%` }}
              />
            </div>
          </div>

          {/* Relevance */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/80 font-medium flex items-center gap-1.5">
                <Icon icon="solar:shield-check-linear" className="w-3.5 h-3.5 text-white/60" />
                Role Relevance
              </span>
              <span className="text-white font-semibold font-mono">{scores.relevance.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white/70 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-700" 
                style={{ width: `${Math.min(100, scores.relevance * 10)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Extracted Key Topics */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 block">Extracted Skill Keywords</span>
          <div className="flex flex-wrap gap-2">
            {topics.map((t, idx) => (
              <Badge key={idx} variant="outline" className="bg-white/[0.03] border-white/10 text-white/80 text-xs py-1 px-2.5">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        {/* Live Coaching Tip Box */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-white text-xs font-medium">
            <Icon icon="solar:lightbulb-bolt-linear" className="w-4 h-4 text-white/70" />
            <span>Interviewer Insight</span>
          </div>
          <p className="text-xs text-white/60 font-light leading-relaxed">
            When answering technical system questions, start with high-level constraints and architecture before diving into edge cases.
          </p>
        </div>
      </div>

      {/* Bottom Card Signal */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0">
        <span className="flex items-center gap-1.5 text-white/50">
          <Icon icon="solar:shield-check-linear" className="w-4 h-4 text-white/60" />
          Encrypted Telemetry
        </span>
        <span className="font-mono text-white/30">ZERO-LATENCY</span>
      </div>
    </div>
  );
});

function InterviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || searchParams.get("id");

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMobileAnalysisOpen, setIsMobileAnalysisOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 45, 75, 30, 90, 60, 40, 80, 25, 65, 50, 85]);
  const [seconds, setSeconds] = useState(0);

  const [liveScores, setLiveScores] = useState<RubricScores>({
    clarity: 8.5,
    structure: 8.0,
    depth: 8.0,
    relevance: 9.0
  });
  const [liveTopics, setLiveTopics] = useState<string[]>([
    "System Design", "Performance Profiling", "State Architecture"
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedRubrics, setExpandedRubrics] = useState<Record<string, boolean>>({});
  const [activeFollowUp, setActiveFollowUp] = useState<{ questionIndex: number; questionId: string; text: string } | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [activeSpeakingMessageId, setActiveSpeakingMessageId] = useState<string | null>(null);

  // References to prevent duplicate playback and Chrome/Edge V8 garbage-collection bugs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pendingSpeechTextRef = useRef<{ text: string; id?: string } | null>(null);
  const voicesLoadedRef = useRef<boolean>(false);
  const lastSpokenRef = useRef<{ id: string | null; text: string; time: number }>({ id: null, text: "", time: 0 });
  const hasAutoSpokenInitialRef = useRef<boolean>(false);

  // Select the highest fidelity natural English voice available in the browser
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. High priority: Premium natural / neural English voices
    const preferred = voices.find(v => 
      v.lang.startsWith("en") && (
        v.name.includes("Google") || 
        v.name.includes("Natural") || 
        v.name.includes("Samantha") || 
        v.name.includes("Jenny") || 
        v.name.includes("Aria") || 
        v.name.includes("Guy") || 
        v.name.includes("David") || 
        v.name.includes("Zira")
      )
    );
    if (preferred) return preferred;

    // 2. Any English voice
    const anyEnglish = voices.find(v => v.lang.startsWith("en"));
    if (anyEnglish) return anyEnglish;

    return voices[0] || null;
  }, []);

  // Stop speech synthesis immediately
  const stopAiSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn("Cancel speech error:", e);
      }
    }
    utteranceRef.current = null;
    pendingSpeechTextRef.current = null;
    setIsAiSpeaking(false);
    setActiveSpeakingMessageId(null);
  }, []);

  // Web Speech API: Text-to-Speech (TTS) - Strictly speaks once per message
  const speakText = useCallback((text: string, messageId?: string) => {
    if (!isVoiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsAiSpeaking(false);
      setActiveSpeakingMessageId(null);
      return;
    }

    // Clean conversational text (strip markdown symbols, code fences, and redundant headers)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_#`~>]/g, "")
      .replace(/Question \d+ of \d+ \([^)]+\):/gi, "")
      .trim();

    if (!cleanText) return;

    // Deduplication check: prevent speaking the exact same message or text twice within 8 seconds
    const now = Date.now();
    if (
      (messageId && lastSpokenRef.current.id === messageId && now - lastSpokenRef.current.time < 8000) ||
      (lastSpokenRef.current.text === cleanText && now - lastSpokenRef.current.time < 8000)
    ) {
      return;
    }

    lastSpokenRef.current = { id: messageId || null, text: cleanText, time: now };
    pendingSpeechTextRef.current = null;

    try {
      // Cancel any ongoing speech so only the latest question plays cleanly
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance; // Keep active reference to prevent GC
      (window as any).__mentraCurrentUtterance = utterance;

      const voice = getBestVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsAiSpeaking(true);
        if (messageId) {
          setActiveSpeakingMessageId(messageId);
        }
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        setActiveSpeakingMessageId(null);
        utteranceRef.current = null;
        (window as any).__mentraCurrentUtterance = null;
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("TTS Utterance error:", e.error);
        }
        setIsAiSpeaking(false);
        setActiveSpeakingMessageId(null);
        utteranceRef.current = null;
        (window as any).__mentraCurrentUtterance = null;
      };

      // Slight tick allows speech synthesis pipeline to initialize cleanly
      setTimeout(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window && isVoiceEnabled) {
          try {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          } catch (speakErr) {
            console.warn("Speak execution error:", speakErr);
          }
        }
      }, 30);
    } catch (e) {
      console.warn("TTS Initialization Error:", e);
      setIsAiSpeaking(false);
      setActiveSpeakingMessageId(null);
    }
  }, [isVoiceEnabled, getBestVoice]);

  // Pre-warm voices and handle browser Autoplay / User Interaction unlock
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const warmUpVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          voicesLoadedRef.current = true;
        }
      } catch (e) {
        console.warn("Voices load error:", e);
      }
    };

    warmUpVoices();
    window.speechSynthesis.onvoiceschanged = warmUpVoices;

    // Unlock speech pipeline audio context on user interaction
    const unlockSpeechOnGesture = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.resume();
        } catch (e) {
          console.warn("Speech gesture unlock error:", e);
        }
      }
    };

    window.addEventListener("pointerdown", unlockSpeechOnGesture, { passive: true });
    window.addEventListener("keydown", unlockSpeechOnGesture, { passive: true });
    window.addEventListener("click", unlockSpeechOnGesture, { passive: true });

    const stopSpeech = () => {
      stopAiSpeech();
    };

    window.addEventListener("beforeunload", stopSpeech);
    window.addEventListener("pagehide", stopSpeech);

    return () => {
      window.removeEventListener("pointerdown", unlockSpeechOnGesture);
      window.removeEventListener("keydown", unlockSpeechOnGesture);
      window.removeEventListener("click", unlockSpeechOnGesture);
      window.removeEventListener("beforeunload", stopSpeech);
      window.removeEventListener("pagehide", stopSpeech);
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      stopSpeech();
    };
  }, [stopAiSpeech]);

  const initMessagesWithSession = useCallback((s: InterviewSession) => {
    if (!s.questions || s.questions.length === 0) return;

    const totalQ = s.questions.length;
    const reconstructedMessages: Message[] = [];
    const answeredCount = s.questions.filter(q => q.attempts && q.attempts.length > 0).length;

    // 1. First question initial greeting
    const firstQ = s.questions[0];
    const firstTypeLabel = firstQ.type === "hr" ? "HR & INTRO" : firstQ.type === "technical" ? "TECHNICAL" : "BEHAVIORAL";

    const initialAiMsg: Message = {
      id: "msg_q1",
      role: "ai",
      content: `Hello! Welcome to your tailored mock interview for ${s.role || "the role"}${s.company ? ` at ${s.company}` : ""}. Let's begin.\n\n${firstQ.text}`,
      timestamp: new Date(s.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags: [firstTypeLabel, `${firstQ.difficulty.toUpperCase()} DIFFICULTY`]
    };
    reconstructedMessages.push(initialAiMsg);

    // 2. Reconstruct each answered question's user answer & AI response
    let lastEvaluatedAttempt: any = null;

    s.questions.forEach((q, idx) => {
      if (q.attempts && q.attempts.length > 0) {
        if (idx > 0) {
          const typeLabel = q.type === "hr" ? "HR & INTRO" : q.type === "technical" ? "TECHNICAL" : "BEHAVIORAL";
          reconstructedMessages.push({
            id: `msg_q_${idx + 1}`,
            role: "ai",
            content: `Question ${idx + 1} of ${totalQ} (${q.difficulty.toUpperCase()}):\n\n${q.text}`,
            timestamp: new Date(q.attempts[0]?.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tags: [typeLabel, `${q.difficulty.toUpperCase()} DIFFICULTY`]
          });
        }

        q.attempts.forEach((attempt, attIdx) => {
          lastEvaluatedAttempt = attempt;
          const avgScore = +(
            ((attempt.scores?.clarity || 0) + 
             (attempt.scores?.depth || 0) + 
             (attempt.scores?.structure || 0) + 
             (attempt.scores?.relevance || 0)) / 4
          ).toFixed(1);

          reconstructedMessages.push({
            id: `user_q${idx + 1}_att${attIdx + 1}`,
            role: "user",
            content: attempt.text,
            timestamp: new Date(attempt.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });

          reconstructedMessages.push({
            id: `ai_q${idx + 1}_reply${attIdx + 1}`,
            role: "ai",
            content: attempt.feedback || "Answer evaluated.",
            timestamp: new Date(attempt.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isFeedback: false,
            score: avgScore,
            scores: attempt.scores,
            feedbackText: attempt.feedback,
            modelAnswer: attempt.modelAnswer,
            strengths: attempt.strengths,
            improvements: attempt.improvements,
            improvementScore: attempt.improvementScore,
            tags: ["INTERVIEWER"]
          });
        });
      }
    });

    // 3. Find active question index (first unanswered question)
    let activeIdx = 0;
    const firstUnansweredIdx = s.questions.findIndex(q => !q.attempts || q.attempts.length === 0);
    if (firstUnansweredIdx !== -1) {
      activeIdx = firstUnansweredIdx;
    } else {
      activeIdx = Math.min((s.currentQuestionIndex || 0), totalQ - 1);
    }

    // If activeIdx > 0 and question is not yet answered, add question prompt
    if (activeIdx > 0 && (!s.questions[activeIdx].attempts || s.questions[activeIdx].attempts.length === 0)) {
      const activeQ = s.questions[activeIdx];
      const typeLabel = activeQ.type === "hr" ? "HR & INTRO" : activeQ.type === "technical" ? "TECHNICAL" : "BEHAVIORAL";
      const qMsgId = `msg_q_${activeIdx + 1}`;
      reconstructedMessages.push({
        id: qMsgId,
        role: "ai",
        content: `Question ${activeIdx + 1} of ${totalQ} (${activeQ.difficulty.toUpperCase()}):\n\n${activeQ.text}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags: [typeLabel, `${activeQ.difficulty.toUpperCase()} DIFFICULTY`]
      });
      if (!hasAutoSpokenInitialRef.current) {
        hasAutoSpokenInitialRef.current = true;
        speakText(activeQ.text, qMsgId);
      }
    } else if (activeIdx === 0 && answeredCount === 0) {
      if (!hasAutoSpokenInitialRef.current) {
        hasAutoSpokenInitialRef.current = true;
        speakText(initialAiMsg.content, "msg_q1");
      }
    }

    setCurrentQuestionIndex(activeIdx);
    setMessages(reconstructedMessages);

    // 4. Restore live radar scores & extracted topics from the last evaluated attempt
    if (lastEvaluatedAttempt && lastEvaluatedAttempt.scores) {
      setLiveScores(lastEvaluatedAttempt.scores);
      if (lastEvaluatedAttempt.extractedTopics && lastEvaluatedAttempt.extractedTopics.length > 0) {
        setLiveTopics(lastEvaluatedAttempt.extractedTopics);
      }
    }
  }, [speakText]);

  // Load Session on Mount
  useEffect(() => {
    async function loadSession() {
      setIsLoadingSession(true);
      if (sessionId) {
        try {
          const res = await fetch(`/api/interview/session/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.session) {
              if (data.session.status === "completed") {
                router.replace(`/report?sessionId=${data.session.id}`);
                return;
              }
              setSession(data.session);
              initMessagesWithSession(data.session);
              setIsLoadingSession(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Failed fetching session from server, checking local...", e);
        }
      }

      // Check localStorage fallback
      if (typeof window !== "undefined") {
        const localId = sessionId || localStorage.getItem("mentra_active_session_id");
        if (localId) {
          const localStr = localStorage.getItem(`mentra_session_${localId}`);
          if (localStr) {
            try {
              const parsed = JSON.parse(localStr);
              if (parsed.status === "completed") {
                router.replace(`/report?sessionId=${parsed.id}`);
                return;
              }
              setSession(parsed);
              initMessagesWithSession(parsed);
              setIsLoadingSession(false);
              return;
            } catch (e) {
              console.warn("Error parsing local session:", e);
            }
          }
        }
      }

      // Fallback default sample session if opened directly
      const fallbackSession: InterviewSession = {
        id: "default_session",
        jobDescription: "Senior Software Engineer with strong system design, performance, and architecture skills.",
        role: "Software Engineer",
        company: "Target Company",
        mode: "full",
        status: "in_progress",
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: "q1",
            sessionId: "default_session",
            order: 1,
            text: "Could you describe a time when you identified and resolved a major performance bottleneck in a production application?",
            type: "technical",
            difficulty: "medium",
            attempts: []
          },
          {
            id: "q2",
            sessionId: "default_session",
            order: 2,
            text: "How would you architect application state between local UI state, server cache, and global shared state?",
            type: "technical",
            difficulty: "hard",
            attempts: []
          },
          {
            id: "q3",
            sessionId: "default_session",
            order: 3,
            text: "Tell me about a time you had a technical disagreement with a teammate over architectural patterns and how you navigated it.",
            type: "behavioral",
            difficulty: "medium",
            attempts: []
          }
        ],
        currentQuestionIndex: 0,
        weakTopics: [],
        strengths: [],
        recommendedActions: []
      };

      setSession(fallbackSession);
      initMessagesWithSession(fallbackSession);
      setIsLoadingSession(false);
    }

    loadSession();
  }, [sessionId, router, initMessagesWithSession]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech API Recognition (Accurate live streaming with zero duplication)
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + (item[0]?.transcript || "").trim();
          } else {
            interimTranscript += (interimTranscript ? " " : "") + (item[0]?.transcript || "").trim();
          }
        }

        const currentSpeech = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
        const base = baseInputRef.current;
        const combined = base ? `${base} ${currentSpeech}` : currentSpeech;
        setInput(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Audio wave animation simulator during recording
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setAudioLevel(Array.from({ length: 16 }, () => Math.floor(Math.random() * 85) + 15));
    }, 120);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isRecording, isEvaluating]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      baseInputRef.current = input.trim();
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("Recognition start error:", e);
        setIsRecording(true);
      }
    }
  };

  const currentQuestion = session?.questions?.[currentQuestionIndex];
  const totalQuestions = session?.questions?.length || 1;

  const handleSend = async () => {
    if (!input.trim() || isEvaluating || !session || !currentQuestion) return;

    const answerText = input.trim();
    setInput("");
    baseInputRef.current = "";
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsEvaluating(true);

    try {
      // Check if candidate is replying to an active follow-up probe on this question
      const isFollowUpAttempt = !!activeFollowUp && activeFollowUp.questionId === currentQuestion.id;
      const followUpPrompt = isFollowUpAttempt ? activeFollowUp.text : undefined;
      const previousAttemptText = currentQuestion.attempts?.length 
        ? currentQuestion.attempts[currentQuestion.attempts.length - 1].text 
        : undefined;

      // 1. Call Scoring API with full multi-turn follow-up context
      const scoreRes = await fetch("/api/interview/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          answerText,
          inputMode: isRecording ? "voice" : "text",
          isFollowUp: isFollowUpAttempt,
          followUpPrompt,
          previousAnswer: previousAttemptText
        })
      });

      const scoreData = await scoreRes.json();
      const attempt: AnswerAttempt = scoreData.attempt;

      if (attempt) {
        // Update Live Radar Metrics
        setLiveScores(attempt.scores);
        if (attempt.extractedTopics?.length) {
          setLiveTopics(attempt.extractedTopics);
        }

        const avgScore = +((attempt.scores.clarity + attempt.scores.depth + attempt.scores.structure + attempt.scores.relevance) / 4).toFixed(1);

        // 2. Call Conversational Interviewer follow-up (passes attempt count and score to decide necessity)
        let interviewerFollowUp = "Thank you for walking through that approach. Let's proceed to the next topic.";
        let hasFollowUpProbe = false;

        try {
          const attemptCount = (currentQuestion.attempts?.length || 0) + 1;
          const chatRes = await fetch("/api/interview/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: session.id,
              questionId: currentQuestion.id,
              userAnswer: answerText,
              attemptCount,
              score: avgScore,
              isFollowUp: isFollowUpAttempt,
              followUpPrompt
            })
          });
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            if (chatData.message) {
              interviewerFollowUp = chatData.message;
            }
            if (typeof chatData.hasFollowUp === "boolean") {
              hasFollowUpProbe = chatData.hasFollowUp;
            }
          }
        } catch (e) {
          console.warn("Chat follow-up error:", e);
        }

        // Set or clear active follow-up state
        if (hasFollowUpProbe) {
          setActiveFollowUp({
            questionIndex: currentQuestionIndex,
            questionId: currentQuestion.id,
            text: interviewerFollowUp
          });
        } else {
          setActiveFollowUp(null);
        }

        // Add Interviewer's natural response to the chat feed
        const interviewerMsg: Message = {
          id: `interviewer_reply_${Date.now()}`,
          role: "ai",
          content: interviewerFollowUp,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFeedback: false,
          isFollowUpProbe: hasFollowUpProbe,
          score: avgScore,
          scores: attempt.scores,
          feedbackText: attempt.feedback,
          modelAnswer: attempt.modelAnswer,
          strengths: attempt.strengths,
          improvements: attempt.improvements,
          improvementScore: attempt.improvementScore,
          tags: hasFollowUpProbe ? [`DEEP DIVE · Q${currentQuestionIndex + 1}`] : ["INTERVIEWER"]
        };

        setMessages(prev => [...prev, interviewerMsg]);
        // SPEAK ONLY THE INTERVIEWER'S SPOKEN WORDS!
        speakText(interviewerFollowUp, interviewerMsg.id);
      }

      if (scoreData.difficultyAdjustment) {
        setSession(prev => prev ? { ...prev, difficultyAdjustment: scoreData.difficultyAdjustment } : null);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (!session) return;
    setActiveFollowUp(null);
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < totalQuestions) {
      setCurrentQuestionIndex(nextIdx);
      const updatedSession = { ...session, currentQuestionIndex: nextIdx };
      setSession(updatedSession);
      if (typeof window !== "undefined") {
        localStorage.setItem(`mentra_session_${session.id}`, JSON.stringify(updatedSession));
      }

      const nextQ = session.questions[nextIdx];
      const typeLabel = nextQ.type === "hr" ? "HR & INTRO" : nextQ.type === "technical" ? "TECHNICAL" : "BEHAVIORAL";
      const nextMsgId = `msg_q_${nextIdx + 1}`;
      const nextAiMsg: Message = {
        id: nextMsgId,
        role: "ai",
        content: `Question ${nextIdx + 1} of ${totalQuestions} (${nextQ.difficulty.toUpperCase()}):\n\n${nextQ.text}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags: [typeLabel, `${nextQ.difficulty.toUpperCase()} DIFFICULTY`]
      };
      setMessages(prev => [...prev, nextAiMsg]);
      speakText(nextQ.text, nextMsgId);
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (!session) return;
    try {
      await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      const updated = { ...session, status: "completed" as const };
      setSession(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(`mentra_session_${session.id}`, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Error marking complete:", e);
    }
    router.push(`/report?sessionId=${session.id}`);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoadingSession) {
    return <InterviewSkeleton />;
  }

  return (
    <div className="h-screen w-full bg-[#020202] text-white flex flex-col overflow-hidden font-sans relative">
      {/* Ambient Background Radial Glows */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] blur-[120px] pointer-events-none -z-20" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)] blur-[140px] pointer-events-none -z-20" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)] blur-[130px] pointer-events-none -z-20" />
      <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10" />
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-2xl px-4 md:px-8 flex items-center justify-between shrink-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <GlassButton 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              router.push("/dashboard");
            }}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </GlassButton>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-medium tracking-tight text-white line-clamp-1">
                {session?.role || "Technical Mock"}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-white/80 text-[10px] font-medium border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.8)]"></span>
                Live Arena
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
              <span className="hidden sm:inline">{session?.company || "Custom Simulation"}</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1 text-white/60 font-mono">
                <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-white/70" />
                {formatTimer(seconds)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* AI Voice Output Reactive Audio Visualizer Pill */}
          <AnimatePresence>
            {isAiSpeaking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="hidden sm:block"
              >
                <AudioVisualizer isActive={true} variant="pill" label="AI Speaking" barCount={8} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* TTS Audio Voice Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              if (isVoiceEnabled && typeof window !== "undefined") {
                window.speechSynthesis?.cancel();
              }
              setIsAiSpeaking(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs transition-colors"
            title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
            <span className="hidden md:inline font-medium">{isVoiceEnabled ? "Voice Output On" : "Muted"}</span>
          </button>

          {/* Mobile Live Analysis Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileAnalysisOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs transition-all active:scale-95"
            title="Open Live Evaluation Radar"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            <span className="font-medium tracking-tight">Radar</span>
            <span className="font-mono text-white/50 text-[10px]">{((liveScores.clarity + liveScores.depth + liveScores.structure) / 3).toFixed(1)}</span>
          </button>

          {/* Question Progress Pill */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-white/60 font-medium">Question</span>
            <span className="text-xs font-semibold text-white font-mono">{currentQuestionIndex + 1}/{totalQuestions}</span>
            <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500" 
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <button 
            onClick={handleCompleteSession}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Grid: Left Chat Arena + Right Radar Copilot with Min-H-0 */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* Left: Chat Session Feed (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-[#050505]/90 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden relative">
          
          {/* Scrollable Message History with Smooth Mouse Wheel */}
          <div 
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar overscroll-contain"
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex flex-col w-full",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div className={cn("max-w-[90%] md:max-w-[85%]")}>
                  {msg.role === "ai" ? (
                    <div className="p-5 md:p-6 rounded-[1.5rem] rounded-tl-md border border-white/10 bg-[#090909] shadow-[0_8px_30px_rgba(0,0,0,0.7)] relative overflow-hidden space-y-3.5">
                      {/* Top Header Row with Interviewer Avatar and Score */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isAiSpeaking && activeSpeakingMessageId === msg.id) {
                                stopAiSpeech();
                              } else {
                                speakText(msg.content, msg.id);
                              }
                            }}
                            className={cn(
                              "w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center relative transition-all cursor-pointer",
                              activeSpeakingMessageId === msg.id && isAiSpeaking && "border-emerald-400/80 bg-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                            )}
                            title={activeSpeakingMessageId === msg.id && isAiSpeaking ? "Click to mute speech" : "Click to replay voice"}
                          >
                            {activeSpeakingMessageId === msg.id && isAiSpeaking ? (
                              <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Icon icon="solar:user-speak-linear" className="w-3.5 h-3.5 text-white" />
                            )}
                            {activeSpeakingMessageId === msg.id && isAiSpeaking && (
                              <span className="absolute -inset-1 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" />
                            )}
                          </button>
                          <span className="text-xs font-semibold tracking-wide uppercase text-white/90">
                            Interviewer
                          </span>
                          <span className="text-[11px] text-white/30 font-mono">{msg.timestamp}</span>

                          {activeSpeakingMessageId === msg.id && isAiSpeaking && (
                            <AudioVisualizer isActive={true} variant="inline" label="Voice Active" barCount={6} />
                          )}
                        </div>

                        {msg.isFollowUpProbe && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 text-[10px] font-medium flex items-center gap-1 font-mono shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                            <Sparkles className="w-3 h-3 text-white" />
                            Deep Dive Probe
                          </span>
                        )}

                        {msg.score !== undefined && (
                          <div className="flex items-center gap-2">
                            {msg.improvementScore !== undefined && msg.improvementScore !== 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono font-medium border border-white/20 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {msg.improvementScore > 0 ? `+${msg.improvementScore}` : msg.improvementScore} Delta
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-black font-semibold text-xs font-mono shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                              <span>Score</span>
                              <span>{msg.score}/10</span>
                            </div>
                          </div>
                        )}

                        {msg.tags && msg.score === undefined && (
                          <div className="flex items-center gap-1.5">
                            {msg.tags.map((t, idx) => (
                              <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-white/60 text-[10px] py-0.5 px-2">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Conversational Message Content */}
                      <p className="text-sm md:text-[15px] font-normal text-white/95 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {/* Optional Expandable Coaching & Evaluation Rubric */}
                      {msg.feedbackText && (
                        <div className="pt-2 border-t border-white/10 space-y-3">
                          <button 
                            type="button"
                            onClick={() => setExpandedRubrics(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                            className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-white/70" />
                            <span>{expandedRubrics[msg.id] ? "Hide Evaluation Rubric & Feedback" : "View Evaluation Rubric & Feedback"}</span>
                            <Icon icon={expandedRubrics[msg.id] ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} className="w-3 h-3 opacity-60 ml-auto" />
                          </button>

                          {expandedRubrics[msg.id] && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.2 }}
                              className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 text-xs"
                            >
                              <div className="text-white/80 leading-relaxed font-light">
                                <span className="font-medium text-white block mb-1">Evaluator Feedback:</span>
                                {msg.feedbackText}
                              </div>

                              {msg.strengths && msg.strengths.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-white/10">
                                  <span className="text-white/80 font-medium flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
                                    Key Strengths:
                                  </span>
                                  <ul className="list-disc list-inside space-y-1 text-white/60 pl-1">
                                    {msg.strengths.map((s, idx) => (
                                      <li key={idx}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {msg.improvements && msg.improvements.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-white/10">
                                  <span className="text-white/80 font-medium flex items-center gap-1.5">
                                    <Icon icon="solar:lightbulb-bolt-linear" className="w-3.5 h-3.5 text-white/90" />
                                    Actionable Improvement Tips:
                                  </span>
                                  <ul className="list-disc list-inside space-y-1 text-white/60 pl-1">
                                    {msg.improvements.map((imp, idx) => (
                                      <li key={idx}>{imp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons: Next Question or Re-try */}
                      {msg.score !== undefined && (
                        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2.5">
                          <button 
                            onClick={handleNextQuestion}
                            className="px-4 py-1.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            {currentQuestionIndex + 1 < totalQuestions ? (
                              <>Continue to Next Question &rarr;</>
                            ) : (
                              <>Finish Interview & View Final Report &rarr;</>
                            )}
                          </button>

                          <button 
                            onClick={() => {
                              setInput(msg.modelAnswer ? `[Refining approach]: ` : "");
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors border border-white/15 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Icon icon="solar:restart-linear" className="w-3.5 h-3.5" />
                            Try Answering Again
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 md:p-6 rounded-[1.5rem] rounded-tr-md bg-[#161616] border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                      <div className="flex items-center justify-between gap-4 mb-2.5">
                        <span className="text-[11px] font-medium tracking-wide uppercase text-white/50">Your Response</span>
                        <span className="text-[11px] text-white/30 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm md:text-[15px] font-normal text-white leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* AI Evaluating Spinner */}
            {isEvaluating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 w-fit"
              >
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-xs text-white/70 font-medium">Scoring answer against rubric...</span>
              </motion.div>
            )}

            {/* Live Audio Visualizer Overlay when Mic is Active */}
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 rounded-2xl bg-white/[0.04] border border-white/20 flex items-center justify-between gap-4 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="text-xs uppercase tracking-widest text-white font-medium">Listening to Voice Stream</span>
                  </div>

                  <div className="flex items-center gap-1.5 h-6">
                    {audioLevel.map((height, idx) => (
                      <div
                        key={idx}
                        className="w-1 bg-white/90 rounded-full transition-all duration-100"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>

                  <button 
                    onClick={toggleRecording}
                    className="px-3 py-1 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-colors"
                  >
                    Done Speaking
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Docked Input Bar */}
          <div className="p-3 md:p-4 bg-black border-t border-white/10 shrink-0 relative">
            
            {/* Active Follow-Up Probe Indicator Banner */}
            <AnimatePresence>
              {activeFollowUp && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/15 text-xs mb-2.5 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                    <span className="font-medium text-white/95">Deep Dive on Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <span className="text-[11px] text-white/40 hidden md:inline">(Reply below to refine this topic, or proceed to next question)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="text-[11px] font-medium text-white hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 transition-all cursor-pointer shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <span>Proceed to Q{currentQuestionIndex + 2}</span>
                    <Icon icon="solar:arrow-right-linear" className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Speaking Live Audio Banner */}
            <AnimatePresence>
              {isAiSpeaking && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-[#0c0c0c]/95 border border-white/20 text-xs mb-2.5 backdrop-blur-xl shadow-[0_0_25px_rgba(255,255,255,0.08)]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-white/10 border border-white/20">
                      <Volume2 className="w-3 h-3 text-white animate-pulse" />
                      <span className="absolute -inset-0.5 rounded-full border border-white/30 animate-ping pointer-events-none" />
                    </div>
                    <span className="font-medium text-white/95 text-xs">Interviewer is speaking...</span>
                    <div className="hidden sm:block">
                      <AudioVisualizer isActive={true} variant="inline" label="" barCount={8} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={stopAiSpeech}
                    className="text-[11px] font-medium text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full border border-white/15 transition-all cursor-pointer flex items-center gap-1"
                    title="Stop voice readout"
                  >
                    <span>Skip Voice</span>
                    <VolumeX className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-center gap-2 bg-[#0a0a0a] p-2 pl-2.5 rounded-full border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.08)] focus-within:border-white/40 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.1),inset_0_1px_2px_rgba(255,255,255,0.15)] transition-all duration-300">
              
              {/* Mic Button */}
              <GlassButton 
                size="icon" 
                variant="ghost"
                onClick={toggleRecording}
                className={cn(
                  "shrink-0",
                  isRecording ? "animate-pulse bg-white/20" : ""
                )}
              >
                <Mic className="w-4 h-4 text-white" />
              </GlassButton>

              {/* Text Input */}
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isRecording 
                    ? "Listening to your voice..." 
                    : activeFollowUp 
                    ? `Reply to follow-up probe (Q${currentQuestionIndex + 1} of ${totalQuestions})...` 
                    : "Type your answer or speak with microphone..."
                }
                className="flex-1 bg-transparent border-0 outline-none text-sm md:text-base text-white placeholder:text-white/30 px-2 caret-white h-10 leading-10"
                disabled={isEvaluating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {/* Send Button */}
              <GlassButton 
                size="icon" 
                variant="default"
                onClick={handleSend} 
                disabled={!input.trim() || isEvaluating}
                className={cn(
                  "shrink-0",
                  (!input.trim() || isEvaluating) && "opacity-40 cursor-not-allowed"
                )}
              >
                {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Right: Live Analysis Panel (Desktop) with Smooth Internal Mouse Wheel Scroll */}
        <div className="hidden lg:flex lg:col-span-4 flex-col h-full min-h-0 bg-[#050505]/95 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden justify-between">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-white/[0.04] blur-[90px] pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10 opacity-80" />
          <LiveAnalysisContent 
            scores={liveScores}
            difficulty={currentQuestion?.difficulty || "medium"}
            topics={liveTopics}
            difficultyAdjustment={session?.difficultyAdjustment}
          />
        </div>

      </main>

      {/* Mobile Live Analysis Bottom Sheet Drawer */}
      <AnimatePresence>
        {isMobileAnalysisOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileAnalysisOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 inset-x-0 max-h-[85vh] bg-[#0c0c0c]/95 border-t border-white/15 rounded-t-[2rem] p-6 z-50 overflow-hidden flex flex-col justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.9)] relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.04] blur-[90px] pointer-events-none -z-10" />
              <div className="absolute inset-0 bg-noise-grain pointer-events-none -z-10 opacity-80" />
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
                <button
                  type="button"
                  onClick={() => setIsMobileAnalysisOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                <LiveAnalysisContent 
                  scores={liveScores}
                  difficulty={currentQuestion?.difficulty || "medium"}
                  topics={liveTopics}
                  difficultyAdjustment={session?.difficultyAdjustment}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<InterviewSkeleton />}>
      <InterviewPageContent />
    </Suspense>
  );
}
