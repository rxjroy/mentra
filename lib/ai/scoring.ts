import { InterviewSession, QuestionData } from "../types/interview";

export function calculateReadinessScore(questions: QuestionData[] = []) {
  const answeredQuestions = (questions || []).filter(q => q && q.attempts && q.attempts.length > 0);
  if (answeredQuestions.length === 0) {
    return {
      overall: 0,
      technical: 0,
      behavioral: 0,
      communication: 0,
      consistency: 0
    };
  }

  // Get best or latest attempt for each question
  const answers = answeredQuestions.map(q => q.attempts[q.attempts.length - 1]);
  const techQuestions = answeredQuestions.filter(q => q.type === "technical");
  const behQuestions = answeredQuestions.filter(q => q.type === "behavioral");

  const techScores = techQuestions.length > 0
    ? techQuestions.map(q => q.attempts[q.attempts.length - 1]?.scores?.depth ?? 7.5)
    : answers.map(a => a?.scores?.depth ?? 7.5);

  const behScores = behQuestions.length > 0
    ? behQuestions.map(q => q.attempts[q.attempts.length - 1]?.scores?.structure ?? 7.5)
    : answers.map(a => a?.scores?.structure ?? 7.5);

  const clarityScores = answers.map(a => a?.scores?.clarity ?? 7.5);
  const relevanceScores = answers.map(a => a?.scores?.relevance ?? 8.0);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 7.8);

  const techAvg = Math.max(5.0, avg(techScores));
  const behAvg = Math.max(5.0, avg(behScores));
  const clarityAvg = Math.max(5.0, avg(clarityScores));
  const relevanceAvg = Math.max(5.0, avg(relevanceScores));

  // Calculate consistency standard deviation
  const allCompoundScores = answers.map(a => 
    ((a?.scores?.clarity ?? 7.5) + (a?.scores?.depth ?? 7.5) + (a?.scores?.structure ?? 7.5) + (a?.scores?.relevance ?? 7.5)) / 4
  );
  const compoundAvg = avg(allCompoundScores);
  const variance = allCompoundScores.length > 1
    ? allCompoundScores.reduce((sum, val) => sum + Math.pow(val - compoundAvg, 2), 0) / allCompoundScores.length
    : 0.1;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(6.5, Math.min(10.0, 10 - stdDev * 1.5));

  // Calibrated weighted overall readiness (0 - 100)
  const weighted = (techAvg * 0.35) + (behAvg * 0.25) + (clarityAvg * 0.20) + (relevanceAvg * 0.10) + (consistencyScore * 0.10);
  const overall = Math.round(Math.min(100, Math.max(30, weighted * 10)));

  return {
    overall,
    technical: Math.round(Math.min(100, Math.max(30, techAvg * 10))),
    behavioral: Math.round(Math.min(100, Math.max(30, behAvg * 10))),
    communication: Math.round(Math.min(100, Math.max(30, clarityAvg * 10))),
    consistency: Math.round(Math.min(100, Math.max(30, consistencyScore * 10)))
  };
}

export function aggregateTopics(questions: QuestionData[] = []) {
  const topicMap = new Map<string, { totalScore: number; count: number }>();

  (questions || []).forEach(q => {
    if (!q) return;
    const latestAttempt = q.attempts?.[q.attempts.length - 1];
    if (latestAttempt && latestAttempt.scores) {
      const avgScore = (
        (latestAttempt.scores.clarity || 7.5) + 
        (latestAttempt.scores.depth || 7.5) + 
        (latestAttempt.scores.structure || 7.5) + 
        (latestAttempt.scores.relevance || 7.5)
      ) / 4;

      const topics = (latestAttempt.extractedTopics && latestAttempt.extractedTopics.length > 0)
        ? latestAttempt.extractedTopics
        : [q.type === "technical" ? "Technical Architecture" : "Behavioral STAR"];

      topics.forEach(topic => {
        const existing = topicMap.get(topic) || { totalScore: 0, count: 0 };
        topicMap.set(topic, {
          totalScore: existing.totalScore + avgScore,
          count: existing.count + 1
        });
      });
    }
  });

  const topicsList = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    score: +(Math.max(5.5, data.totalScore / data.count)).toFixed(1)
  }));

  // Identify top weak topics (score < 8.2)
  const weakTopics = topicsList
    .filter(t => t.score < 8.2)
    .sort((a, b) => a.score - b.score)
    .map(t => ({
      topic: t.topic,
      score: t.score,
      advice: `Review architectural trade-offs, edge cases, and best practices for ${t.topic}.`
    }));

  const strengths = topicsList
    .filter(t => t.score >= 8.2)
    .sort((a, b) => b.score - a.score)
    .map(t => t.topic);

  return {
    allTopics: topicsList,
    weakTopics: weakTopics.slice(0, 3),
    strengths: strengths.length ? strengths : (topicsList.length ? [topicsList[0].topic] : ["Foundational Understanding"])
  };
}
