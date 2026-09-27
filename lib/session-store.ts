import { InterviewSession, QuestionData } from "./types/interview";
import { calculateReadinessScore, aggregateTopics } from "./ai/scoring";

const sessionsMap = new Map<string, InterviewSession>();

// Seed high-fidelity sample sessions if store is empty
function ensureSeedData() {
  if (sessionsMap.size === 0) {
    const sampleQuestions: QuestionData[] = [
      {
        id: "q1",
        sessionId: "sample_session_1",
        order: 1,
        text: "Could you describe a time when you identified and resolved a major rendering bottleneck in a production web application?",
        type: "technical",
        difficulty: "hard",
        attempts: [
          {
            attempt: 1,
            text: "In our core telemetry dashboard, heavy re-renders were causing 120ms frame drops. I profiled using React DevTools, identified redundant renders, and implemented TanStack Virtual for windowing and React.memo for high-frequency cell components.",
            inputMode: "text",
            scores: { clarity: 8.8, depth: 8.6, structure: 8.5, relevance: 9.2 },
            feedback: "Solid technical explanation. Identified the diagnostic tooling and selected proper virtualization mechanisms.",
            modelAnswer: "In our real-time telemetry dashboard, render spikes exceeded 120ms. I profiled with React DevTools and Chrome Performance tab to isolate render thrashing. I re-architected the table with TanStack Virtual, memoized cells via React.memo with custom comparison functions, and localized Zustand stores, bringing latency down to 16ms (60 FPS).",
            extractedTopics: ["React Performance", "Profiling", "Virtual DOM"],
            strengths: ["Explicitly named DevTools profiler", "Selected windowed virtualization pattern"],
            improvements: ["Quantify before/after metrics in RPS or % latency reduction"],
            createdAt: new Date().toISOString()
          }
        ]
      },
      {
        id: "q2",
        sessionId: "sample_session_1",
        order: 2,
        text: "How would you architect application state between local UI state, server cache, and global shared state?",
        type: "technical",
        difficulty: "hard",
        attempts: [
          {
            attempt: 1,
            text: "I separate state into 3 tiers: server state in TanStack Query with automatic deduplication, ephemeral UI state in local component useState, and cross-cutting global state in Zustand with atomic selectors.",
            inputMode: "text",
            scores: { clarity: 9.0, depth: 8.8, structure: 9.0, relevance: 9.4 },
            feedback: "Very clean architectural mindset. Clear boundary between asynchronous server cache and client state prevents redundant synchronization logic.",
            modelAnswer: "I adhere to strict separation of concerns: 1) Server State via React Query for background revalidation. 2) Global Client State in an atomic Zustand store with selective selectors. 3) Local Ephemeral State in React component state or URL search parameters for linkability.",
            extractedTopics: ["State Architecture", "Server Cache", "Zustand"],
            strengths: ["Clear distinction between async server cache and client state", "Avoided syncing server data into global store"],
            improvements: ["Mention URL parameters for deep link state persistence"],
            createdAt: new Date().toISOString()
          }
        ]
      }
    ];

    const scoreData = calculateReadinessScore(sampleQuestions);
    const topicData = aggregateTopics(sampleQuestions);

    sessionsMap.set("sample_session_1", {
      id: "sample_session_1",
      jobDescription: "Senior Frontend Engineer with strong React, state architecture, and systems skills.",
      role: "Senior Frontend Engineer",
      company: "Stripe",
      culture: "Excellence, precision, high velocity",
      mode: "full",
      status: "completed",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
      questions: sampleQuestions,
      currentQuestionIndex: 1,
      overallSummary: "Outstanding technical depth and clear communication. Ready for senior-level system design rounds.",
      readinessScore: 88,
      categoryScores: {
        technical: scoreData.technical,
        behavioral: scoreData.behavioral,
        communication: scoreData.communication,
        consistency: scoreData.consistency
      },
      weakTopics: topicData.weakTopics,
      strengths: topicData.strengths,
      recommendedActions: [
        "Practice quantifying performance gains with exact numbers",
        "Deep-dive into SSR streaming and server component boundaries"
      ]
    });
  }
}

import { Database } from "./db";

export class SessionStore {
  static getSession(id: string): InterviewSession | null {
    ensureSeedData();
    return sessionsMap.get(id) || null;
  }

  static saveSession(session: InterviewSession): InterviewSession {
    sessionsMap.set(session.id, session);
    try {
      Database.saveSession(session);
    } catch (e) {
      console.warn("DB save sync warning:", e);
    }
    return session;
  }

  static listSessions(): InterviewSession[] {
    ensureSeedData();
    return Array.from(sessionsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static getDashboardStats() {
    ensureSeedData();
    const all = this.listSessions();
    const completed = all.filter(s => s.status === "completed" && s.readinessScore);

    const avgReadiness = completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / completed.length)
      : 86;

    // Calculate real dynamic metric averages across all completed sessions
    let totalTech = 0;
    let totalBeh = 0;
    let totalClarity = 0;
    let categoryCount = 0;

    completed.forEach(s => {
      if (s.categoryScores) {
        totalTech += s.categoryScores.technical || 80;
        totalBeh += s.categoryScores.behavioral || 80;
        totalClarity += s.categoryScores.communication || 80;
        categoryCount++;
      }
    });

    const avgTechDepth = categoryCount > 0 ? +((totalTech / categoryCount) / 10).toFixed(1) : 8.6;
    const avgBehavioral = categoryCount > 0 ? +((totalBeh / categoryCount) / 10).toFixed(1) : 8.4;
    const avgClarity = categoryCount > 0 ? +((totalClarity / categoryCount) / 10).toFixed(1) : 8.8;

    // Score delta (trend between first and latest)
    let scoreDelta = 0;
    if (completed.length >= 2) {
      const sortedByDate = [...completed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstScore = sortedByDate[0]?.readinessScore || 70;
      const latestScore = sortedByDate[sortedByDate.length - 1]?.readinessScore || 80;
      scoreDelta = latestScore - firstScore;
    } else {
      scoreDelta = 6;
    }

    // Collect all weak topics
    const weakTopicFreq = new Map<string, { count: number; totalScore: number; advice: string }>();
    completed.forEach(s => {
      s.weakTopics?.forEach(w => {
        const existing = weakTopicFreq.get(w.topic) || { count: 0, totalScore: 0, advice: w.advice };
        weakTopicFreq.set(w.topic, {
          count: existing.count + 1,
          totalScore: existing.totalScore + w.score,
          advice: w.advice
        });
      });
    });

    const recurringWeakTopics = Array.from(weakTopicFreq.entries()).map(([topic, data]) => ({
      topic,
      frequency: data.count,
      avgScore: +(data.totalScore / data.count).toFixed(1),
      advice: data.advice
    })).sort((a, b) => b.frequency - a.frequency);

    return {
      totalSessions: all.length,
      completedSessions: completed.length,
      averageReadiness: avgReadiness,
      avgTechDepth,
      avgBehavioral,
      avgClarity,
      scoreDelta,
      sessions: all,
      recurringWeakTopics: recurringWeakTopics.length ? recurringWeakTopics : [
        { topic: "System Trade-Offs", frequency: 2, avgScore: 7.2, advice: "Explicitly state why you chose pattern A over pattern B." },
        { topic: "Quantifiable Impact", frequency: 1, avgScore: 7.5, advice: "Mention exact metric reductions (% latency or RPS)." }
      ]
    };
  }
}
