"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { 
  ArrowLeft, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Settings, 
  Plus, 
  Play, 
  History, 
  Layers, 
  Sparkles,
  ChevronRight,
  ExternalLink,
  Target,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  LogOut,
  UserCheck,
  Compass
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { GlassButton } from "@/components/ui/glass-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InterviewSession } from "@/lib/types/interview";
import Link from "next/link";

const SetupSessionForm = dynamic(
  () => import("@/components/setup-session-form").then(mod => mod.SetupSessionForm),
  { ssr: false, loading: () => <div className="p-8 text-center text-xs text-white/40 font-mono">Loading session builder...</div> }
);

interface TrajectoryPoint {
  session: string;
  date: string;
  score: number;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatarUrl?: string } | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [avgReadiness, setAvgReadiness] = useState(0);
  const [avgTechDepth, setAvgTechDepth] = useState(0);
  const [avgBehavioral, setAvgBehavioral] = useState(0);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [recurringWeakTopics, setRecurringWeakTopics] = useState<Array<{ topic: string; frequency: number; avgScore: number; advice: string }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completingSessionId, setCompletingSessionId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setSessions(data.stats.sessions || []);
          setAvgReadiness(data.stats.averageReadiness || 0);
          setAvgTechDepth(data.stats.avgTechDepth || 0);
          setAvgBehavioral(data.stats.avgBehavioral || 0);
          setScoreDelta(data.stats.scoreDelta || 0);
          setRecurringWeakTopics(data.stats.recurringWeakTopics || []);
        }
      }
    } catch (e) {
      console.warn("Failed fetching updated stats:", e);
    }
  };

  const handleMarkSessionComplete = async (sessionId: string) => {
    setCompletingSessionId(sessionId);
    try {
      const res = await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      if (res.ok) {
        await fetchStats();
      }
    } catch (e) {
      console.warn("Failed marking session complete from dashboard:", e);
    } finally {
      setCompletingSessionId(null);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (data.isGuest || !data.user) {
          router.replace("/login");
          return;
        }

        setUser(data.user);

        if (data.stats) {
          setSessions(data.stats.sessions || []);
          setAvgReadiness(data.stats.averageReadiness || 0);
          setAvgTechDepth(data.stats.avgTechDepth || 0);
          setAvgBehavioral(data.stats.avgBehavioral || 0);
          setScoreDelta(data.stats.scoreDelta || 0);
          setRecurringWeakTopics(data.stats.recurringWeakTopics || []);
        }
      } catch (e) {
        console.warn("Failed fetching dashboard stats:", e);
        router.replace("/login");
        return;
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === "completed" && s.readinessScore !== undefined);
  }, [sessions]);

  const hasCompleted = completedSessions.length > 0;

  // Generate Real Trajectory Chart Points
  const trajectoryData: TrajectoryPoint[] = useMemo(() => {
    return hasCompleted
      ? [...completedSessions].reverse().map((s, idx) => ({
          session: `S${idx + 1}`,
          date: new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
          score: s.readinessScore || 0,
          role: s.role || "Technical Simulation"
        }))
      : [];
  }, [completedSessions, hasCompleted]);

  const filteredSessions = useMemo(() => {
    if (selectedFilter === "All") return sessions;
    if (selectedFilter === "Completed") return sessions.filter(s => s.status === "completed");
    if (selectedFilter === "In Progress") return sessions.filter(s => s.status === "in_progress");
    const lower = selectedFilter.toLowerCase();
    return sessions.filter(s => 
      (s.experienceLevel?.toLowerCase() || "").includes(lower) || 
      (s.company?.toLowerCase() || "").includes(lower) ||
      (s.role?.toLowerCase() || "").includes(lower)
    );
  }, [sessions, selectedFilter]);

  // SVG Chart Geometry
  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  // Dynamic Y-axis scaling based on actual data
  const { minScore, maxScore, gridLines } = useMemo(() => {
    if (trajectoryData.length === 0) return { minScore: 0, maxScore: 100, gridLines: [20, 40, 60, 80] };
    const scores = trajectoryData.map(d => d.score);
    const dataMin = Math.min(...scores);
    const dataMax = Math.max(...scores);
    
    // Add 10% padding below and above, clamped to 0-100
    const range = Math.max(dataMax - dataMin, 10); // minimum 10-point range
    const padAmount = Math.ceil(range * 0.15);
    const computedMin = Math.max(0, Math.floor((dataMin - padAmount) / 5) * 5); // round down to nearest 5
    const computedMax = Math.min(100, Math.ceil((dataMax + padAmount) / 5) * 5); // round up to nearest 5
    
    // Generate 3-4 evenly spaced grid lines within the range
    const finalRange = computedMax - computedMin;
    const step = finalRange <= 20 ? 5 : finalRange <= 50 ? 10 : 20;
    const lines: number[] = [];
    for (let v = computedMin + step; v < computedMax; v += step) {
      lines.push(v);
    }
    
    return { minScore: computedMin, maxScore: computedMax, gridLines: lines };
  }, [trajectoryData]);

  const { points, pathD, areaD } = useMemo(() => {
    const scoreRange = maxScore - minScore || 1;
    const pts = trajectoryData.map((item, index) => {
      const x = paddingX + (index / Math.max(1, trajectoryData.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - (((item.score || 0) - minScore) / scoreRange) * (chartHeight - paddingY * 2);
      return { x, y, ...item };
    });

    const pD = pts.length > 1
      ? pts.reduce((acc, curr, index) => {
          if (index === 0) return `M ${curr.x} ${curr.y}`;
          const prev = pts[index - 1];
          const cp1x = prev.x + (curr.x - prev.x) / 2;
          const cp1y = prev.y;
          const cp2x = prev.x + (curr.x - prev.x) / 2;
          const cp2y = curr.y;
          return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }, "")
      : pts.length === 1
      ? `M ${pts[0].x - 30} ${pts[0].y} L ${pts[0].x + 30} ${pts[0].y}`
      : "";

    const aD = pts.length > 1
      ? `${pD} L ${pts[pts.length - 1]?.x || 0} ${chartHeight - paddingY} L ${pts[0]?.x || 0} ${chartHeight - paddingY} Z`
      : "";

    return { points: pts, pathD: pD, areaD: aD };
  }, [trajectoryData, minScore, maxScore]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-[#020202] text-white flex flex-col font-sans pb-16">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-[120px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#020202]/85 backdrop-blur-2xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <GlassButton 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </GlassButton>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-medium tracking-tight text-white">Mentra Intelligence</h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-white/80 text-[10px] font-medium border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                Candidate Vault
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              {user ? `Logged in as ${user.name}` : "Interview Prep & Competency Tracking"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {user && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-sm">
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                <span className="hidden md:inline-block text-xs text-white/90 font-medium pr-1">
                  {user.name.split(" ")[0]}
                </span>
              </div>
            )}
            <GlassButton
              variant="outline"
              size="sm"
              className="text-xs px-3.5 border-white/15 hover:border-white/30"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-white/70" />
              Logout
            </GlassButton>
          </div>

          {/* New Session Modal Trigger */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger render={<GlassButton size="sm" className="text-xs px-4" />}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Session
            </DialogTrigger>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-[#080808]/95 backdrop-blur-2xl border-white/15 p-6 rounded-[2rem] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium text-white">Launch Tailored Mock Session</DialogTitle>
                <DialogDescription className="text-xs text-white/50">
                  Paste the job description or select a role profile to generate personalized questions.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <SetupSessionForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="container max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* Top Summary Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: Readiness Score */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-5 rounded-[1.6rem] bg-[#070707]/90 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5 font-medium">
              <span>Overall Readiness</span>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-white text-[10px]">
                {hasCompleted ? "Active" : "Pending First Mock"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white tracking-tight">
                {hasCompleted ? `${avgReadiness}%` : "--%"}
              </span>
              <span className="text-xs text-white/50 font-mono">
                {hasCompleted ? `${scoreDelta >= 0 ? `+${scoreDelta}%` : `${scoreDelta}%`} trend` : "No baseline"}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${hasCompleted ? avgReadiness : 0}%` }}
                transition={{ duration: 1.0, ease: "easeOut" }}
                className="h-full bg-white rounded-full" 
              />
            </div>
          </motion.div>

          {/* Metric 2: Completed Sessions */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="p-5 rounded-[1.6rem] bg-[#070707]/90 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5 font-medium">
              <span>Total Mocks Practiced</span>
              <History className="w-3.5 h-3.5 text-white/40" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white tracking-tight">{sessions.length}</span>
              <span className="text-xs text-white/60 font-mono">{completedSessions.length} Completed</span>
            </div>
            <p className="text-[11px] text-white/40 mt-2.5">
              {sessions.length === 0
                ? "No active sessions recorded"
                : sessions.length - completedSessions.length > 0 
                ? `${sessions.length - completedSessions.length} in-progress sessions` 
                : "All mock sessions finalized"}
            </p>
          </motion.div>

          {/* Metric 3: Technical Cadence */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="p-5 rounded-[1.6rem] bg-[#070707]/90 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5 font-medium">
              <span>Average Technical Depth</span>
              <Icon icon="solar:cpu-bolt-linear" className="w-3.5 h-3.5 text-white/40" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white tracking-tight">
                {hasCompleted && avgTechDepth > 0 ? avgTechDepth : "--"}
              </span>
              <span className="text-xs text-white/60 font-mono">/ 10 Scale</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${hasCompleted ? Math.min(100, avgTechDepth * 10) : 0}%` }}
                transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
                className="h-full bg-white/90 rounded-full" 
              />
            </div>
          </motion.div>

          {/* Metric 4: STAR Communication */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="p-5 rounded-[1.6rem] bg-[#070707]/90 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5 font-medium">
              <span>Behavioral Structure</span>
              <Icon icon="solar:target-linear" className="w-3.5 h-3.5 text-white/40" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-white tracking-tight">
                {hasCompleted && avgBehavioral > 0 ? avgBehavioral : "--"}
              </span>
              <span className="text-xs text-white/60 font-mono">/ 10 Scale</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${hasCompleted ? Math.min(100, avgBehavioral * 10) : 0}%` }}
                transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-white/80 rounded-full" 
              />
            </div>
          </motion.div>
        </section>

        {/* Mid Section: Trajectory Curve (8 Cols) + Weak Topics Radar (4 Cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Trajectory Score Line Chart (8 Cols) */}
          <div className="lg:col-span-8 h-[360px] max-h-[360px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 block mb-0.5">Telemetry Curve</span>
                <h2 className="text-base font-medium text-white">Interview Readiness Trajectory</h2>
              </div>
              <span className="text-xs font-mono text-white/40">SCORE DELTA (0-100)</span>
            </div>

            {/* Content: Real Curve vs Elegant Empty State */}
            {hasCompleted ? (
              <div className="relative w-full flex-1 flex items-center justify-center my-2 min-h-0">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {gridLines.map((level, i) => {
                    const scoreRange = maxScore - minScore || 1;
                    const y = chartHeight - paddingY - ((level - minScore) / scoreRange) * (chartHeight - paddingY * 2);
                    return (
                      <g key={i}>
                        <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <text x={paddingX - 10} y={y + 3} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="end" fontFamily="monospace">{level}</text>
                      </g>
                    );
                  })}

                  {/* Animated Shaded Area Under Curve */}
                  {areaD && (
                    <motion.path 
                      d={areaD} 
                      fill="url(#chartGradient)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.0 }}
                    />
                  )}

                  {/* Animated Glowing Smooth Curve Line */}
                  {pathD && (
                    <motion.path 
                      d={pathD} 
                      fill="none" 
                      stroke="#FFFFFF" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                  )}

                  {/* Interactive Points */}
                  {points.map((pt, i) => (
                    <motion.g 
                      key={i} 
                      className="cursor-pointer group" 
                      onMouseEnter={() => setHoveredPoint(pt)} 
                      onMouseLeave={() => setHoveredPoint(null)}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                    >
                      <circle cx={pt.x} cy={pt.y} r="4.5" fill="#020202" stroke="#FFFFFF" strokeWidth="2" className="group-hover:scale-150 transition-transform" />
                      <text x={pt.x} y={chartHeight - 4} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle" fontFamily="monospace">{pt.date}</text>
                    </motion.g>
                  ))}
                </svg>

                {/* Hover Tooltip */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-4 p-2.5 rounded-xl bg-black/90 border border-white/20 backdrop-blur-md shadow-2xl text-xs space-y-1 z-10">
                    <div className="font-semibold text-white">{hoveredPoint.role}</div>
                    <div className="text-white/60 font-mono">Score: <span className="text-white font-bold">{hoveredPoint.score}%</span> on {hoveredPoint.date}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 shadow-inner">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white">No Telemetry Recorded Yet</h3>
                  <p className="text-xs text-white/50 max-w-sm font-light leading-relaxed">
                    Complete your first mock interview simulation to generate your score trajectory curve and benchmark competencies.
                  </p>
                </div>
                <GlassButton 
                  size="sm" 
                  className="text-xs mt-1"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Launch First Mock Simulation
                </GlassButton>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0">
              <span>{hasCompleted ? "Consistent trajectory toward FAANG onsite threshold" : "Readiness telemetry calibrated against industry standards"}</span>
              <span className="font-mono text-white/50">TARGET: 90%+</span>
            </div>
          </div>

          {/* Recurring Weak Topics Radar (4 Cols) */}
          <div className="lg:col-span-4 h-[360px] max-h-[360px] bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 shrink-0">
              <AlertCircle className="w-4 h-4 text-white/80" />
              <h2 className="text-xs uppercase tracking-widest font-semibold text-white">
                Recurring Weak Topics
              </h2>
              <span className="ml-auto text-[10px] font-mono text-white/40">{recurringWeakTopics.length} Tracked</span>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2.5 pr-1.5 my-3 overscroll-contain">
              {recurringWeakTopics.length > 0 ? (
                recurringWeakTopics.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white truncate max-w-[190px]">{item.topic}</span>
                      <span className="text-[10px] font-mono text-white/50">{item.frequency}x flagged</span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">{item.advice}</p>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-2 text-xs text-white/40">
                  <CheckCircle2 className="w-6 h-6 text-white/30" />
                  <p>No recurring weak topics flagged yet.</p>
                  <p className="text-[11px] text-white/30 font-light">Areas for growth will be cataloged after your first evaluated session.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 shrink-0">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-all shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {recurringWeakTopics.length > 0 ? "Launch Drill on Weak Topics →" : "Start Practice Interview →"}
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Section: Past Sessions History Table */}
        <section className="bg-[#070707]/95 border border-white/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50 block mb-1">Session Vault</span>
              <h2 className="text-base sm:text-lg font-medium text-white">Recent Mock Interviews</h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
              {["All", "Completed", "In Progress"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                    selectedFilter === f 
                      ? "bg-white text-black shadow-sm font-semibold" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          {filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.map((session, idx) => {
                const isCompleted = session.status === "completed";
                const dateStr = new Date(session.createdAt).toLocaleDateString([], { 
                  month: "short", 
                  day: "numeric", 
                  year: "numeric" 
                });

                return (
                  <motion.div
                    key={session.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white group-hover:text-white transition-colors">
                          {session.role || "Target Role Simulation"}
                        </span>
                        {session.company && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/70 font-medium">
                            {session.company}
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                          isCompleted 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        )}>
                          {isCompleted ? "Completed" : "In Progress"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-white/40 font-light">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/30" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{session.experienceLevel ? `${session.experienceLevel} Level` : "Interview Session"}</span>
                        <span>•</span>
                        <span>{(() => {
                          const totalQ = session.questions?.length || 15;
                          const attempted = session.questions?.filter((q: any) => q.attempts && q.attempts.length > 0)?.length || 0;
                          return `${attempted}/${totalQ} Answered`;
                        })()}</span>
                      </div>
                    </div>

                    {/* Right Action: Score Badge or Resume/Mark Complete Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
                      {!isCompleted ? (
                        <>
                          <GlassButton 
                            size="sm" 
                            variant="outline"
                            disabled={completingSessionId === session.id}
                            onClick={() => handleMarkSessionComplete(session.id)}
                            className="text-xs px-2.5 sm:px-3 border-white/15 hover:border-emerald-500/40 hover:text-emerald-400 text-white/70 transition-all cursor-pointer"
                            title="Mark this session as complete and compute score"
                          >
                            {completingSessionId === session.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-emerald-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400/80" />
                            )}
                            <span className="hidden sm:inline">Mark</span> Complete
                          </GlassButton>

                          <Link href={`/interview?sessionId=${session.id}`}>
                            <GlassButton 
                              size="sm" 
                              className="text-xs px-3.5"
                            >
                              Resume
                              <ChevronRight className="w-3.5 h-3.5 ml-1 text-white/70" />
                            </GlassButton>
                          </Link>
                        </>
                      ) : (
                        <>
                          {session.readinessScore !== undefined && (
                            <div className="text-right pr-2">
                              <div className="text-lg font-semibold text-white">{session.readinessScore}%</div>
                              <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Readiness</div>
                            </div>
                          )}

                          <Link href={`/report?sessionId=${session.id}`}>
                            <GlassButton 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-3.5 border-white/15"
                            >
                              View Report
                              <ChevronRight className="w-3.5 h-3.5 ml-1 text-white/70" />
                            </GlassButton>
                          </Link>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white">No Mock Interviews Recorded</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto font-light leading-relaxed">
                  Your evaluated simulation runs, answer audio logs, and score breakdowns will be preserved in your vault here.
                </p>
              </div>
              <GlassButton 
                size="sm" 
                className="text-xs"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Start Your First Simulation
              </GlassButton>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
