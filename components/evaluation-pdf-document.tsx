import React from "react";
import { InterviewSession, ReviseItem } from "@/lib/types/interview";

interface EvaluationPdfDocumentProps {
  session: InterviewSession | null;
  readiness: number;
  categoryScores: {
    technical: number;
    behavioral: number;
    communication: number;
    consistency: number;
  };
  weakTopics: ReviseItem[];
  questionsList: Array<{
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
  }>;
}

export function EvaluationPdfDocument({
  session,
  readiness,
  categoryScores,
  weakTopics,
  questionsList
}: EvaluationPdfDocumentProps) {
  const role = session?.role || "Software Engineer";
  const company = session?.company || "Target Enterprise";
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const getReadinessSignal = (score: number) => {
    if (score >= 85) return "Senior Hire Signal · Top 10% Competency";
    if (score >= 70) return "Ready for Onsite · Solid Benchmark";
    return "Needs Targeted Review · Practice Recommended";
  };

  return (
    <div className="hidden print:block w-full max-w-[850px] mx-auto text-slate-900 bg-white font-sans text-sm leading-normal p-2">
      {/* Dossier Header */}
      <header className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold tracking-tight text-slate-950 uppercase">MENTRA</span>
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-900 text-white tracking-widest uppercase">
              EXECUTIVE DOSSIER
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            {role} Evaluation Report
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Calibrated for {company} · AI Mock Technical Assessment
          </p>
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Evaluation Date</div>
          <div className="text-sm font-semibold text-slate-900">{dateFormatted}</div>
          <div className="text-[10px] font-mono text-slate-400">ID: {session?.id ? session.id.slice(0, 16) : "MNT-REPORT-EVAL"}</div>
        </div>
      </header>

      {/* Meta Specs Grid */}
      <div className="grid grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 mb-6 text-xs">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Candidate Role</div>
          <div className="font-semibold text-slate-900 truncate mt-0.5">{role}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Entity</div>
          <div className="font-semibold text-slate-900 truncate mt-0.5">{company}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Questions Evaluated</div>
          <div className="font-semibold text-slate-900 mt-0.5">{questionsList.length} of 15 Scored</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Interview Mode</div>
          <div className="font-semibold text-slate-900 mt-0.5 uppercase">{session?.mode || "Full Simulation"}</div>
        </div>
      </div>

      {/* Section 1: Executive Readiness Summary */}
      <section className="mb-8 page-break-avoid">
        <h2 className="text-xs uppercase font-bold tracking-widest text-slate-500 pb-1.5 border-b border-slate-200 mb-3">
          1. EXECUTIVE READINESS SUMMARY
        </h2>

        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Readiness Score Card */}
          <div className="col-span-5 p-4 rounded-xl border border-slate-300 bg-slate-900 text-white flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall Preparedness Index</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-extrabold tracking-tight text-white">{readiness}</span>
                <span className="text-sm text-slate-400 font-mono">/ 100</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 block">{getReadinessSignal(readiness)}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Calibrated against industry hiring bar</span>
            </div>
          </div>

          {/* Core Competency Radar Telemetry */}
          <div className="col-span-7 p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
              Core Competency Dimensions
            </span>
            
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Technical Architecture & Depth</span>
                  <span className="font-mono">{categoryScores.technical}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${categoryScores.technical}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>STAR Behavioral Structure</span>
                  <span className="font-mono">{categoryScores.behavioral}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${categoryScores.behavioral}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Communication & Articulation</span>
                  <span className="font-mono">{categoryScores.communication}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${categoryScores.communication}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Consistency & Edge-Case Coverage</span>
                  <span className="font-mono">{categoryScores.consistency}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${categoryScores.consistency}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Actionable Growth Areas */}
      {weakTopics && weakTopics.length > 0 && (
        <section className="mb-8 page-break-avoid">
          <h2 className="text-xs uppercase font-bold tracking-widest text-slate-500 pb-1.5 border-b border-slate-200 mb-3">
            2. TARGETED FOCUS & WEAK AREAS
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {weakTopics.map((topic, i) => (
              <div key={i} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{topic.topic}</span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900">
                    {topic.score ? `${topic.score}/10` : "Flagged"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">{topic.advice}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Question-by-Question Deep Dive */}
      <section>
        <h2 className="text-xs uppercase font-bold tracking-widest text-slate-500 pb-1.5 border-b border-slate-200 mb-4">
          3. DETAILED QUESTION BREAKDOWN & EVALUATION RUBRICS
        </h2>

        <div className="space-y-6">
          {questionsList.map((q) => {
            const avgQScore = +(
              (q.scores.clarity + q.scores.depth + q.scores.structure + q.scores.relevance) /
              4
            ).toFixed(1);

            return (
              <div
                key={q.id}
                className="page-break-avoid border border-slate-300 rounded-xl p-4 bg-white shadow-sm space-y-3"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-900 text-white">
                      Q{q.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                      {q.topic}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Score: {avgQScore} / 10
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    Interviewer Prompt
                  </div>
                  <p className="text-xs font-medium text-slate-900 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {q.question}
                  </p>
                </div>

                {/* Candidate's Submitted Response */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    Candidate Response
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed p-2.5 rounded-lg bg-white border border-slate-200 whitespace-pre-wrap font-sans">
                    {q.userAnswer || "(No response submitted)"}
                  </p>
                </div>

                {/* Rubric Matrix */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Clarity</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{q.scores.clarity}/10</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Depth</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{q.scores.depth}/10</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Structure</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{q.scores.structure}/10</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Relevance</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{q.scores.relevance}/10</div>
                  </div>
                </div>

                {/* AI Evaluation Critique */}
                <div className="pt-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    AI Evaluation & Critique
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {q.feedback}
                  </p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {q.strengths && q.strengths.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <div className="text-[10px] font-bold uppercase text-emerald-800 mb-1">Key Strengths</div>
                      <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                        {q.strengths.map((str, idx) => (
                          <li key={idx} className="leading-snug">{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {q.improvements && q.improvements.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                      <div className="text-[10px] font-bold uppercase text-amber-800 mb-1">Actionable Growth Areas</div>
                      <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                        {q.improvements.map((imp, idx) => (
                          <li key={idx} className="leading-snug">{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Principal Model Answer */}
                {q.modelAnswer && (
                  <div className="pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                      Principal Engineer Benchmark Answer
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      {q.modelAnswer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Document Footer */}
      <footer className="mt-8 pt-4 border-t-2 border-slate-900 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>Mentra AI Intelligence · Candidate Evaluation Dossier</div>
        <div>Confidential & Proprietary</div>
      </footer>
    </div>
  );
}
