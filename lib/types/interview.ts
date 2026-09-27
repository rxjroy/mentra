export type SessionMode = "quick" | "full" | "grill";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type QuestionType = "technical" | "behavioral" | "hr";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type ExperienceLevel = "fresher" | "junior" | "mid" | "senior";

export interface RubricScores {
  clarity: number;    // 0-10
  structure: number;  // 0-10
  depth: number;      // 0-10
  relevance: number;  // 0-10
}

export interface AnswerAttempt {
  attempt: number;
  text: string;
  inputMode: "voice" | "text";
  scores: RubricScores;
  feedback: string;
  modelAnswer?: string;
  extractedTopics: string[];
  strengths: string[];
  improvements: string[];
  improvementScore?: number;
  createdAt: string;
}

export interface QuestionData {
  id: string;
  sessionId: string;
  order: number;
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  context?: string;
  attempts: AnswerAttempt[];
  currentAnswer?: AnswerAttempt;
}

export interface SessionTopic {
  topic: string;
  avgScore: number;
  count: number;
}

export interface ReviseItem {
  topic: string;
  score: number;
  advice: string;
}

export interface InterviewSession {
  id: string;
  userId?: string;
  jobDescription: string;
  role?: string;
  company?: string;
  culture?: string;
  experienceLevel?: ExperienceLevel;
  mode: SessionMode;
  status: SessionStatus;
  createdAt: string;
  completedAt?: string;
  questions: QuestionData[];
  currentQuestionIndex: number;
  difficultyAdjustment?: {
    adjustedAtQuestion: number;
    from: string;
    to: string;
    reason: string;
  };
  overallSummary?: string;
  readinessScore?: number; // 0-100
  categoryScores?: {
    technical: number;
    behavioral: number;
    communication: number;
    consistency: number;
  };
  weakTopics: ReviseItem[];
  strengths: string[];
  recommendedActions: string[];
  resumeText?: string;
  resumeProfile?: {
    role?: string;
    seniority?: string;
    skills?: string[];
    pastCompanies?: string[];
    keyProjects?: string[];
    summary?: string;
  };
}

export interface GenerateInterviewRequest {
  jobDescription: string;
  role?: string;
  company?: string;
  culture?: string;
  experienceLevel?: ExperienceLevel;
  mode?: SessionMode;
  resumeFileName?: string;
  resumeText?: string;
  resumeProfile?: {
    role?: string;
    seniority?: string;
    skills?: string[];
    pastCompanies?: string[];
    keyProjects?: string[];
    summary?: string;
  };
}

export interface ScoreAnswerRequest {
  sessionId: string;
  questionId: string;
  answerText: string;
  inputMode: "voice" | "text";
  attemptNumber?: number;
}

export interface ChatInterviewerRequest {
  sessionId: string;
  questionId: string;
  userAnswer: string;
  history?: Array<{ role: "ai" | "user"; content: string }>;
}
