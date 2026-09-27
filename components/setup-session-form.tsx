"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  FileText, 
  Loader2, 
  GraduationCap, 
  Briefcase, 
  Award, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  Brain,
  Cpu,
  Layers
} from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { GlassToast } from "@/components/ui/glass-toast";
import { ExperienceLevel } from "@/lib/types/interview";

const EXPERIENCE_LEVELS: {
  value: ExperienceLevel;
  label: string;
  icon: typeof GraduationCap;
}[] = [
  {
    value: "fresher",
    label: "Fresher / College Graduate (0–1 yrs)",
    icon: GraduationCap
  },
  {
    value: "junior",
    label: "Junior Developer (1–3 yrs)",
    icon: Briefcase
  },
  {
    value: "mid",
    label: "Mid-Level Engineer (3–5 yrs)",
    icon: Zap
  },
  {
    value: "senior",
    label: "Senior / Lead Engineer (5+ yrs)",
    icon: Award
  }
];

const SYNTHESIS_STAGES = [
  {
    icon: Brain,
    title: "Deconstructing Job Description & Seniority",
    subtitle: "Analyzing required skills, architectures & company profile...",
    progress: 25,
    tag: "PHASE 1/4"
  },
  {
    icon: Sparkles,
    title: "Cross-Referencing Profile & Tech Stack",
    subtitle: "Calibrating rubric criteria and expected technical depth...",
    progress: 55,
    tag: "PHASE 2/4"
  },
  {
    icon: Cpu,
    title: "Synthesizing 15-Question Progressive Loop",
    subtitle: "Formulating situational architecture, live coding & deep-dives...",
    progress: 82,
    tag: "PHASE 3/4"
  },
  {
    icon: CheckCircle2,
    title: "Connecting to Neural Interview Arena",
    subtitle: "Initializing speech synthesis and real-time evaluation radar...",
    progress: 98,
    tag: "READY"
  }
];

export function SetupSessionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Form State
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("fresher");
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeProfile, setResumeProfile] = useState<any>(null);

  const activeLevel = EXPERIENCE_LEVELS.find(l => l.value === experienceLevel) || EXPERIENCE_LEVELS[0];
  const ActiveIcon = activeLevel.icon;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setResumeText(null);
      setResumeProfile(null);
      return;
    }

    setFileName(file.name);
    setIsParsingResume(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setResumeProfile(data.profile);
          setResumeText(data.resumeText || file.name);
          if (!role && data.profile.role) {
            setRole(data.profile.role);
          }
        }
      }
    } catch (err) {
      console.warn("Resume parsing failed:", err);
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setErrorMessage("Please enter a job description to generate your tailored interview.");
      return;
    }

    setIsSubmitting(true);
    setLoadingStep(0);
    setErrorMessage(null);

    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [
      setTimeout(() => setLoadingStep(1), 600),
      setTimeout(() => setLoadingStep(2), 1500),
      setTimeout(() => setLoadingStep(3), 2600),
    ];

    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          role: role || undefined,
          company: company || undefined,
          experienceLevel,
          mode: "full",
          resumeFileName: fileName || undefined,
          resumeText: resumeText || undefined,
          resumeProfile: resumeProfile || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Failed to initialize interview session");
      }

      // Store active session in localStorage for backup/recovery
      if (typeof window !== "undefined") {
        localStorage.setItem("mentra_active_session_id", data.sessionId);
        localStorage.setItem(`mentra_session_${data.sessionId}`, JSON.stringify(data.session));
      }

      router.push(`/interview?sessionId=${data.sessionId}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      timerRefs.current.forEach(clearTimeout);
      setErrorMessage(err.message || "Failed to start interview sequence. Please try again.");
      setIsSubmitting(false);
    }
  };

  const labelClass = "text-white/50 text-[10px] uppercase tracking-widest font-medium mb-1.5 block";
  const inputClass = "bg-black/40 border-white/10 hover:border-white/20 focus-visible:ring-0 focus-visible:border-white/40 focus-visible:shadow-[0_0_15px_rgba(255,255,255,0.12),inset_0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-300 text-white/90 placeholder:text-white/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] rounded-lg caret-white text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative z-20">
      <GlassToast
        show={Boolean(errorMessage)}
        variant="error"
        title="Notice"
        message={errorMessage}
        onDismiss={() => setErrorMessage(null)}
      />

      {/* Job Description Textarea */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="jd" className={labelClass}>Job Description *</Label>
          <span className="text-[10px] text-white/40 font-mono">Required</span>
        </div>
        <Textarea 
          id="jd" 
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description, required skills, or key qualifications..." 
          className={`h-24 max-h-32 overflow-y-auto resize-none custom-scrollbar ${inputClass}`}
          required
        />
      </div>
      
      {/* Role & Company Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="role" className={labelClass}>Target Role (Optional)</Label>
          <Input 
            id="role" 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Frontend Engineer, SDE Intern" 
            className={inputClass} 
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="company" className={labelClass}>Target Company (Optional)</Label>
          <Input 
            id="company" 
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Google, Microsoft, Startup" 
            className={inputClass} 
          />
        </div>
      </div>

      {/* Experience Level Selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="exp-level" className={labelClass}>
            Candidate Experience Level
          </Label>
          <span className="text-[10px] text-emerald-400/80 font-mono">15 Progressive Questions</span>
        </div>
        <Select 
          value={experienceLevel} 
          onValueChange={(val) => {
            if (val) setExperienceLevel(val as ExperienceLevel);
          }}
        >
          <SelectTrigger id="exp-level" className={`${inputClass} h-10 px-3 cursor-pointer`}>
            <div className="flex items-center gap-2.5 text-white/90 truncate">
              <ActiveIcon className="w-4 h-4 text-white/80 shrink-0" />
              <span className="text-sm font-normal truncate">{activeLevel.label}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="w-full min-w-[340px] bg-[#0d0d0d] backdrop-blur-2xl border-white/15 text-white p-1.5 shadow-2xl rounded-xl">
            {EXPERIENCE_LEVELS.map((lvl) => {
              const Icon = lvl.icon;
              return (
                <SelectItem 
                  key={lvl.value} 
                  value={lvl.value} 
                  className="focus:bg-white/10 focus:text-white cursor-pointer py-2.5 px-3 rounded-lg text-white/90"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-white/80 shrink-0" />
                    <span className="text-sm font-normal">{lvl.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Resume Upload (Optional) */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <Label htmlFor="resume" className={labelClass}>Your Resume (Optional)</Label>
          {resumeProfile && (
            <span className="text-[10px] text-white/60 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white" />
              Tailoring Questions to Resume
            </span>
          )}
        </div>
        
        <div 
          className="flex items-center gap-3 p-1 pr-4 bg-black/40 border border-white/10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] rounded-lg cursor-pointer hover:border-white/20 transition-all duration-300 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-white/5 group-hover:bg-white/10 group-hover:text-white transition-colors text-white/80 px-3.5 py-1.5 rounded-md text-xs flex items-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10 group-hover:border-white/20">
            <FileText className="w-3.5 h-3.5" />
            Browse...
          </div>
          <span className="text-xs text-white/50 truncate flex-1">
            {fileName || "No resume uploaded"}
          </span>
          <Input 
            ref={fileInputRef}
            id="resume" 
            type="file" 
            accept=".pdf,.docx,.txt,.md,.json" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>

        {/* Live Parsing State */}
        {isParsingResume && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/10 text-xs text-white/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Parsing resume projects & technologies with AI...</span>
          </div>
        )}

        {/* Parsed Profile Summary Badge */}
        {!isParsingResume && resumeProfile && (
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/15 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-white font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Resume Analyzed ({fileName})</span>
              </span>
              <span className="text-[10px] text-white/50 font-mono">{resumeProfile.skills?.length || 0} Skills Detected</span>
            </div>
            {resumeProfile.keyProjects && resumeProfile.keyProjects.length > 0 && (
              <p className="text-[11px] text-white/60 line-clamp-1">
                Detected Projects: <span className="text-white/85 font-mono">{resumeProfile.keyProjects.slice(0, 2).join(", ")}</span>
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] text-white/30">
          When uploaded, 2–4 questions will explicitly cross-examine your listed projects, technical stack, and architecture choices.
        </p>
      </div>

      {/* Submit Button & Neural Synthesis Console */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          {!isSubmitting ? (
            <motion.div
              key="idle-btn"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <ShinyButton type="submit" className="w-full group" disabled={isSubmitting}>
                <span className="flex items-center justify-center gap-2 font-medium">
                  Start Interview Sequence
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </ShinyButton>
            </motion.div>
          ) : (
            <motion.div
              key="loading-console"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative w-full rounded-2xl border border-white/20 bg-[#080808]/95 backdrop-blur-2xl p-4 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] select-none"
            >
              {/* Ambient Glowing Laser Sweep */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-white/[0.08] blur-2xl pointer-events-none rounded-full" />

              <div className="relative z-10 space-y-3">
                {/* Top Status Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 border border-white/15">
                      {(() => {
                        const CurrentIcon = SYNTHESIS_STAGES[loadingStep].icon;
                        return <CurrentIcon className="w-3.5 h-3.5 text-white animate-pulse" />;
                      })()}
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-white/90 tracking-wide uppercase">
                      Neural Synthesis Active
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">
                    {SYNTHESIS_STAGES[loadingStep].tag}
                  </span>
                </div>

                {/* Animated Stage Description */}
                <div className="min-h-[38px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={loadingStep}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="space-y-0.5"
                    >
                      <div className="text-xs sm:text-sm font-medium text-white/95 truncate">
                        {SYNTHESIS_STAGES[loadingStep].title}
                      </div>
                      <div className="text-[11px] text-white/50 truncate font-light">
                        {SYNTHESIS_STAGES[loadingStep].subtitle}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dynamic Cyberpunk Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-white/40 via-white to-emerald-400 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                      initial={{ width: "15%" }}
                      animate={{ width: `${SYNTHESIS_STAGES[loadingStep].progress}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-white/35">
                    <span>PROGRESSIVE 15-Q PIPELINE</span>
                    <span className="text-white/60 font-medium">
                      {SYNTHESIS_STAGES[loadingStep].progress}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
