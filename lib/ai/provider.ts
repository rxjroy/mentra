import { 
  QuestionSchema, 
  AnswerScoreSchema, 
  DifficultyAdjustmentSchema, 
  SessionSummarySchema, 
  PROMPTS 
} from "./prompts";
import { GenerateInterviewRequest, QuestionData, RubricScores } from "../types/interview";

// Robust JSON parser that handles markdown code fence wrappers
function cleanAndParseJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

// Call Groq / OpenAI compatible endpoint with resilient model fallback
async function callGroqChat(messages: Array<{ role: string; content: string }>, apiKey: string, jsonMode = true, temperature = 0.7) {
  const models = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "groq/compound"
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 3500,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {})
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content;
        }
      } else {
        lastError = new Error(`Groq model ${model} status ${res.status}: ${await res.text()}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("All Groq models failed");
}

// Call Google Gemini API (Expanded Free Fleet)
async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string, jsonMode = true, temperature = 0.7) {
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
  ];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nUser Input:\n${userPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: 3500,
            ...(jsonMode ? { responseMimeType: "application/json" } : {})
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return text;
        }
      } else {
        lastError = new Error(`Gemini ${model} returned ${res.status}: ${await res.text()}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

// Call OpenRouter Community Free Models (100% Free)
async function callOpenRouterFree(messages: Array<{ role: string; content: string }>, apiKey: string, jsonMode = true, temperature = 0.7) {
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free",
    "deepseek/deepseek-chat:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "mistralai/mistral-7b-instruct:free"
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Mentra AI"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 3500,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {})
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content;
        }
      } else {
        lastError = new Error(`OpenRouter ${model} returned ${res.status}: ${await res.text()}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("All OpenRouter free models failed");
}

// Call Cerebras Ultra-Fast LPUs (100% Free Developer Tier)
async function callCerebrasChat(messages: Array<{ role: string; content: string }>, apiKey: string, jsonMode = true, temperature = 0.7) {
  const models = ["llama3.1-8b", "llama3.1-70b"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 3500,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {})
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content;
        }
      } else {
        lastError = new Error(`Cerebras ${model} returned ${res.status}: ${await res.text()}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("All Cerebras models failed");
}

function sampleRandom<T>(array: T[], count = 1): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export class AiEngine {
  // Generic JSON generator for custom prompts (e.g. resume parser)
  static async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const cerebrasKey = process.env.CEREBRAS_API_KEY;

    if (groqKey) {
      try {
        const raw = await callGroqChat([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ], groqKey, true);
        return cleanAndParseJson<T>(raw);
      } catch (e) {
        console.warn("Groq generateJson fallback:", e);
      }
    }

    if (geminiKey) {
      try {
        const raw = await callGemini(systemPrompt, userPrompt, geminiKey, true);
        return cleanAndParseJson<T>(raw);
      } catch (e) {
        console.warn("Gemini generateJson fallback:", e);
      }
    }

    if (openrouterKey) {
      try {
        const raw = await callOpenRouterFree([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ], openrouterKey, true);
        return cleanAndParseJson<T>(raw);
      } catch (e) {
        console.warn("OpenRouter generateJson fallback:", e);
      }
    }

    if (cerebrasKey) {
      try {
        const raw = await callCerebrasChat([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ], cerebrasKey, true);
        return cleanAndParseJson<T>(raw);
      } catch (e) {
        console.warn("Cerebras generateJson fallback:", e);
      }
    }

    throw new Error("Failed to generate JSON output from AI providers.");
  }

  // 1. Generate Interview Questions (Strictly 15 questions with experience tuning & role/company extraction)
  static async generateQuestions(params: GenerateInterviewRequest): Promise<{
    questions: Array<{
      text: string;
      type: "technical" | "behavioral" | "hr";
      difficulty: "easy" | "medium" | "hard";
      context?: string;
    }>;
    inferredRole?: string;
    inferredCompany?: string;
  }> {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const cerebrasKey = process.env.CEREBRAS_API_KEY;

    const experienceLabel = {
      fresher: "Fresher / College Graduate / Entry Level (0-1 Years Experience)",
      junior: "Junior Engineer (1-3 Years Experience)",
      mid: "Mid-Level Engineer (3-5 Years Experience)",
      senior: "Senior / Lead Engineer (5+ Years Experience)"
    }[params.experienceLevel || "fresher"];

    const sessionSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const resumeInfo = params.resumeProfile 
      ? `Candidate Resume Summary: ${params.resumeProfile.summary || ""}\nCandidate Core Skills: ${params.resumeProfile.skills?.join(", ") || ""}\nCandidate Key Projects: ${params.resumeProfile.keyProjects?.join("; ") || ""}\nPast Work / Education: ${params.resumeProfile.pastCompanies?.join(", ") || ""}`
      : params.resumeText
      ? `Candidate Resume Text Extract:\n${params.resumeText.slice(0, 2500)}`
      : params.resumeFileName
      ? `Candidate uploaded resume file: ${params.resumeFileName}`
      : "None provided";

    const userPrompt = `Job Description:
${params.jobDescription}

Target Role: ${params.role || "Infer from Job Description"}
Target Company: ${params.company || "Infer from Job Description if mentioned"}
Candidate Experience Level: ${experienceLabel}
Session Randomization Seed: ${sessionSeed}
Target Questions Count: Exactly 15 progressive interview questions.
Candidate Resume Context (Generate 2-4 direct cross-examination questions on these listed projects/skills):
${resumeInfo}`;

    if (groqKey) {
      try {
        const raw = await callGroqChat([
          { role: "system", content: PROMPTS.questionGeneration.system },
          { role: "user", content: userPrompt }
        ], groqKey, true, 0.85);
        const parsed = cleanAndParseJson<any>(raw);
        const validated = QuestionSchema.parse(parsed);
        if (validated && validated.questions && validated.questions.length >= 10) {
          return {
            questions: validated.questions.slice(0, 15),
            inferredRole: validated.inferredRole,
            inferredCompany: validated.inferredCompany
          };
        }
      } catch (err) {
        console.warn("Groq generation failed, falling back...", err);
      }
    }

    if (geminiKey) {
      try {
        const raw = await callGemini(PROMPTS.questionGeneration.system, userPrompt, geminiKey, true, 0.85);
        const parsed = cleanAndParseJson<any>(raw);
        const validated = QuestionSchema.parse(parsed);
        if (validated && validated.questions && validated.questions.length >= 10) {
          return {
            questions: validated.questions.slice(0, 15),
            inferredRole: validated.inferredRole,
            inferredCompany: validated.inferredCompany
          };
        }
      } catch (err) {
        console.warn("Gemini generation failed, falling back...", err);
      }
    }

    if (openrouterKey) {
      try {
        const raw = await callOpenRouterFree([
          { role: "system", content: PROMPTS.questionGeneration.system },
          { role: "user", content: userPrompt }
        ], openrouterKey, true, 0.85);
        const parsed = cleanAndParseJson<any>(raw);
        const validated = QuestionSchema.parse(parsed);
        if (validated && validated.questions && validated.questions.length >= 10) {
          return {
            questions: validated.questions.slice(0, 15),
            inferredRole: validated.inferredRole,
            inferredCompany: validated.inferredCompany
          };
        }
      } catch (err) {
        console.warn("OpenRouter generation failed, falling back...", err);
      }
    }

    if (cerebrasKey) {
      try {
        const raw = await callCerebrasChat([
          { role: "system", content: PROMPTS.questionGeneration.system },
          { role: "user", content: userPrompt }
        ], cerebrasKey, true, 0.85);
        const parsed = cleanAndParseJson<any>(raw);
        const validated = QuestionSchema.parse(parsed);
        if (validated && validated.questions && validated.questions.length >= 10) {
          return {
            questions: validated.questions.slice(0, 15),
            inferredRole: validated.inferredRole,
            inferredCompany: validated.inferredCompany
          };
        }
      } catch (err) {
        console.warn("Cerebras generation failed, falling back...", err);
      }
    }

    // Dynamic 15-Question Fallback calibrated to experience level
    return {
      questions: this.generateSmartFallbackQuestions(params),
      inferredRole: this.extractRoleFromJd(params.jobDescription),
      inferredCompany: this.extractCompanyFromJd(params.jobDescription)
    };
  }

  static extractRoleFromJd(jd: string): string {
    const match = jd.match(/(?:looking for|hiring|role of|position of|seeking|title:?)\s*(?:a|an)?\s*([A-Za-z0-9\s/+#.-]{3,35}(?:Engineer|Developer|Architect|Lead|Manager|Specialist|Designer|Analyst|Consultant|Scientist|Programmer|Intern|Associate))/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    const directMatch = jd.match(/\b([A-Z][a-zA-Z0-9+#.-]*(?:\s+[A-Z][a-zA-Z0-9+#.-]*){0,3}\s+(?:Engineer|Developer|Architect|Lead|Manager|Specialist|Scientist))\b/);
    if (directMatch && directMatch[1]) {
      return directMatch[1].trim();
    }
    return "Software Engineer";
  }

  static extractCompanyFromJd(jd: string): string | undefined {
    const match = jd.match(/(?:at|company:?|join|about)\s+([A-Z][A-Za-z0-9&.-]{2,25}(?:\s+[A-Z][A-Za-z0-9&.-]{2,20})?)/);
    if (match && match[1] && !["The", "We", "Our", "You", "This", "A", "An", "Job"].includes(match[1])) {
      return match[1].trim();
    }
    return undefined;
  }

  // 2. Score Candidate Answer
  static async scoreAnswer(params: {
    questionText: string;
    questionDifficulty: string;
    answerText: string;
    role?: string;
    inputMode: "voice" | "text";
    isFollowUp?: boolean;
    followUpPrompt?: string;
    previousAnswer?: string;
  }) {
    const trimmed = (params.answerText || "").trim();
    const refusalPattern = /^(no\b|nah\b|nope\b|skip\b|pass\b|next\b|idk\b|i don'?t know\b|no idea\b|i decline\b|i don'?t want to (say|answer|talk|share|speak)\b|dont want to (say|answer|talk|share|speak)\b|refuse\b|none\b|not answering\b|i have no idea\b|can'?t answer\b|cannot answer\b|no comment\b)/i;

    // Strict 0-1 evaluation for explicit refusals or zero-content answers
    if (trimmed.length < 5 || refusalPattern.test(trimmed)) {
      return {
        clarity: 1.0,
        structure: 1.0,
        depth: 0.5,
        relevance: 0.5,
        feedback: "The candidate declined to provide a substantive answer to this question. In an actual technical interview, passing on a core competency results in a failing score for that section. Even if unfamiliar with the exact implementation, candidates are evaluated on articulating their thought process from first principles or discussing relevant foundations.",
        modelAnswer: "In a real interview, approach this by breaking down the question: clarify requirements, outline your thought process, describe key components or technical constraints, and discuss how you would verify the outcome.",
        extractedTopics: ["Communication", "Interview Participation"],
        strengths: ["None demonstrated for this question"],
        improvements: [
          "Attempt every question by sharing your reasoning and problem-solving process",
          "Discuss relevant projects, coursework, or how you would investigate the topic"
        ]
      };
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const cerebrasKey = process.env.CEREBRAS_API_KEY;

    let userPrompt = "";
    if (params.isFollowUp && params.followUpPrompt) {
      userPrompt = `CONTEXT:
Primary Interview Topic / Question: "${params.questionText}"
Candidate's Initial Answer on this Topic: "${params.previousAnswer || "N/A"}"

INTERVIEWER'S ACTIVE DEEP-DIVE PROBE / FOLLOW-UP QUESTION:
"${params.followUpPrompt}"

CANDIDATE'S DIRECT RESPONSE TO THIS FOLLOW-UP PROBE:
"${params.answerText}"

Candidate Role: ${params.role || "Software Engineer"}
Difficulty Level: ${params.questionDifficulty}
Input Mode: ${params.inputMode}

EVALUATION DIRECTIVE:
The candidate is responding directly to the INTERVIEWER'S ACTIVE DEEP-DIVE PROBE above.
Evaluate whether the candidate directly, accurately, and technically answered the specific follow-up question (e.g. code mechanics, error handling, session lifecycle, trade-offs).
DO NOT penalize the candidate for answering the specific technical probe rather than repeating their initial background or main question overview.`;
    } else {
      userPrompt = `Question: ${params.questionText}
Difficulty: ${params.questionDifficulty}
Candidate's Answer (${params.inputMode}): "${params.answerText}"
Role: ${params.role || "Software Engineer"}`;
    }

    if (groqKey) {
      try {
        const raw = await callGroqChat([
          { role: "system", content: PROMPTS.answerScoring.system },
          { role: "user", content: userPrompt }
        ], groqKey, true, 0.5);
        const parsed = cleanAndParseJson<any>(raw);
        return AnswerScoreSchema.parse(parsed);
      } catch (err) {
        console.warn("Groq scoring failed, falling back...", err);
      }
    }

    if (geminiKey) {
      try {
        const raw = await callGemini(PROMPTS.answerScoring.system, userPrompt, geminiKey, true, 0.5);
        const parsed = cleanAndParseJson<any>(raw);
        return AnswerScoreSchema.parse(parsed);
      } catch (err) {
        console.warn("Gemini scoring failed, falling back...", err);
      }
    }

    if (openrouterKey) {
      try {
        const raw = await callOpenRouterFree([
          { role: "system", content: PROMPTS.answerScoring.system },
          { role: "user", content: userPrompt }
        ], openrouterKey, true, 0.5);
        const parsed = cleanAndParseJson<any>(raw);
        return AnswerScoreSchema.parse(parsed);
      } catch (err) {
        console.warn("OpenRouter scoring failed, falling back...", err);
      }
    }

    if (cerebrasKey) {
      try {
        const raw = await callCerebrasChat([
          { role: "system", content: PROMPTS.answerScoring.system },
          { role: "user", content: userPrompt }
        ], cerebrasKey, true, 0.5);
        const parsed = cleanAndParseJson<any>(raw);
        return AnswerScoreSchema.parse(parsed);
      } catch (err) {
        console.warn("Cerebras scoring failed, falling back...", err);
      }
    }

    return this.generateSmartFallbackScore(params);
  }

  // 3. Conversational Follow-up Chat from Interviewer
  static async getLiveInterviewerResponse(params: {
    questionText: string;
    userAnswer: string;
    mode?: string;
    attemptCount?: number;
    score?: number;
    isFollowUp?: boolean;
    followUpPrompt?: string;
  }): Promise<{ message: string; hasFollowUp: boolean }> {
    const trimmed = (params.userAnswer || "").trim();
    const isRefusal = trimmed.length < 5 || /^(no\b|nah\b|nope\b|skip\b|pass\b|next\b|idk\b|i don'?t know\b|no idea\b|i decline\b|i don'?t want to (say|answer|talk|share|speak)\b|dont want to (say|answer|talk|share|speak)\b|refuse\b|none\b|not answering\b|i have no idea\b|can'?t answer\b|cannot answer\b|no comment\b)/i.test(trimmed);

    if (isRefusal) {
      return {
        message: "I understand you'd prefer to skip this topic. Keep in mind that passing on questions impacts your overall evaluation score. Let's move on to our next technical scenario.",
        hasFollowUp: false
      };
    }
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const cerebrasKey = process.env.CEREBRAS_API_KEY;

    const userPrompt = params.isFollowUp && params.followUpPrompt
      ? `Main Question / Topic: "${params.questionText}"
Interviewer's Follow-up Question: "${params.followUpPrompt}"
Candidate's Response to Follow-up: "${params.userAnswer}"
Attempt Count on this Topic: ${params.attemptCount || 2}
Score on this response: ${params.score ?? "N/A"}
NOTE: The candidate has completed their response to the follow-up deep-dive probe. Acknowledge their explanation with specific, positive technical feedback on what they demonstrated and wrap up this question naturally (set hasFollowUp: false).`
      : `Interview Question: "${params.questionText}"
Candidate's Spoken Response: "${params.userAnswer}"
Attempt Count on this Topic: ${params.attemptCount || 1}
Score on this response: ${params.score ?? "N/A"}`;

    if (groqKey) {
      try {
        const raw = await callGroqChat([
          { role: "system", content: PROMPTS.interviewerFollowUp.system },
          { role: "user", content: userPrompt }
        ], groqKey, true, 0.7);
        const parsed = cleanAndParseJson<{ message: string; hasFollowUp?: boolean }>(raw);
        if (parsed?.message) {
          const hasFollowUp = typeof parsed.hasFollowUp === "boolean" 
            ? parsed.hasFollowUp 
            : parsed.message.includes("?");
          return { message: parsed.message.trim(), hasFollowUp };
        }
      } catch (e) {
        console.warn("Groq live chat structured error:", e);
      }
    }

    if (geminiKey) {
      try {
        const raw = await callGemini(PROMPTS.interviewerFollowUp.system, userPrompt, geminiKey, true, 0.7);
        const parsed = cleanAndParseJson<{ message: string; hasFollowUp?: boolean }>(raw);
        if (parsed?.message) {
          const hasFollowUp = typeof parsed.hasFollowUp === "boolean" 
            ? parsed.hasFollowUp 
            : parsed.message.includes("?");
          return { message: parsed.message.trim(), hasFollowUp };
        }
      } catch (e) {
        console.warn("Gemini live chat fallback:", e);
      }
    }

    if (openrouterKey) {
      try {
        const raw = await callOpenRouterFree([
          { role: "system", content: PROMPTS.interviewerFollowUp.system },
          { role: "user", content: userPrompt }
        ], openrouterKey, true, 0.7);
        const parsed = cleanAndParseJson<{ message: string; hasFollowUp?: boolean }>(raw);
        if (parsed?.message) {
          const hasFollowUp = typeof parsed.hasFollowUp === "boolean" 
            ? parsed.hasFollowUp 
            : parsed.message.includes("?");
          return { message: parsed.message.trim(), hasFollowUp };
        }
      } catch (e) {
        console.warn("OpenRouter live chat fallback:", e);
      }
    }

    if (cerebrasKey) {
      try {
        const raw = await callCerebrasChat([
          { role: "system", content: PROMPTS.interviewerFollowUp.system },
          { role: "user", content: userPrompt }
        ], cerebrasKey, true, 0.7);
        const parsed = cleanAndParseJson<{ message: string; hasFollowUp?: boolean }>(raw);
        if (parsed?.message) {
          const hasFollowUp = typeof parsed.hasFollowUp === "boolean" 
            ? parsed.hasFollowUp 
            : parsed.message.includes("?");
          return { message: parsed.message.trim(), hasFollowUp };
        }
      } catch (e) {
        console.warn("Cerebras live chat fallback:", e);
      }
    }

    // Dynamic Context-Aware Fallback (Only probe if attemptCount <= 1 and score is not already perfect)
    if ((params.attemptCount || 1) <= 1 && (params.score ?? 7) < 8.8) {
      const words = params.userAnswer.toLowerCase();
      if (words.includes("project") || words.includes("built") || words.includes("app")) {
        return {
          message: "That gives good context on your project work. What was one specific technical trade-off you had to balance while building that out?",
          hasFollowUp: true
        };
      } else if (words.includes("state") || words.includes("hook") || words.includes("react") || words.includes("api")) {
        return {
          message: "Understood. How would you handle race conditions or loading edge cases if network responses return out of order?",
          hasFollowUp: true
        };
      } else if (words.includes("team") || words.includes("disagree") || words.includes("feedback")) {
        return {
          message: "That's a helpful perspective on your collaboration style. How did that experience shape how you approach code reviews today?",
          hasFollowUp: true
        };
      }
    }

    return {
      message: "Thanks for walking me through that approach. It gives clear insight into your problem-solving process. Let's proceed to the next topic.",
      hasFollowUp: false
    };
  }

  // 4. Adaptive Difficulty Adjustment
  static evaluateDifficultyAdjustment(scores: RubricScores[]): {
    adjustment: "easier" | "harder" | "same";
    reason: string;
  } {
    if (!scores || scores.length === 0) {
      return { adjustment: "same", reason: "Performance is calibrated." };
    }

    const averages = scores.map(s => (s.clarity + s.structure + s.depth + s.relevance) / 4);
    const overallAvg = averages.reduce((a, b) => a + b, 0) / averages.length;

    if (overallAvg >= 8.5) {
      return { adjustment: "harder", reason: "Candidate showed exceptional depth, clarity, and technical intuition." };
    } else if (overallAvg < 5.5) {
      return { adjustment: "easier", reason: "Candidate experienced friction with advanced problem constraints." };
    }
    return { adjustment: "same", reason: "Candidate performance is balanced and steady." };
  }

  // 5. Session Summary Generator
  static async generateSessionSummary(session: {
    role?: string;
    company?: string;
    questions: QuestionData[];
    overallScore: number;
    categoryScores: { technical: number; behavioral: number; communication: number; consistency: number };
  }) {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const answered = session.questions.filter(q => q.attempts && q.attempts.length > 0);

    const summaryContext = `Role: ${session.role || "Software Engineer"}
Company: ${session.company || "Tech Company"}
Overall Score: ${session.overallScore}%
Completed Questions: ${answered.length} of ${session.questions.length} total generated
Category Scores: Technical ${session.categoryScores.technical}%, Behavioral ${session.categoryScores.behavioral}%, Communication ${session.categoryScores.communication}%, Consistency ${session.categoryScores.consistency}%.
Questions and Answers:
${answered.map((q, i) => `
Q${i + 1} (${q.type}, ${q.difficulty}): ${q.text}
Latest Answer: ${q.attempts[q.attempts.length - 1]?.text || "No answer recorded"}
Scores: ${JSON.stringify(q.attempts[q.attempts.length - 1]?.scores || {})}
Feedback: ${q.attempts[q.attempts.length - 1]?.feedback || "None"}
`).join("\n")}`;

    if (groqKey) {
      try {
        const raw = await callGroqChat([
          { role: "system", content: PROMPTS.sessionSummary.system },
          { role: "user", content: summaryContext }
        ], groqKey, true, 0.7);
        const parsed = cleanAndParseJson<any>(raw);
        return SessionSummarySchema.parse(parsed);
      } catch (e) {
        console.warn("Groq summary fallback:", e);
      }
    }

    if (geminiKey) {
      try {
        const raw = await callGemini(PROMPTS.sessionSummary.system, summaryContext, geminiKey, true, 0.7);
        const parsed = cleanAndParseJson<any>(raw);
        return SessionSummarySchema.parse(parsed);
      } catch (e) {
        console.warn("Gemini summary fallback:", e);
      }
    }

    // Heuristic Summary Fallback
    return {
      overallSummary: `Candidate demonstrated solid core readiness across ${answered.length} evaluated questions. Technical articulation was grounded in realistic patterns, with clear opportunities to elevate numerical specificity and trade-off comparisons.`,
      strengths: [
        "Consistent communication flow and problem structuring",
        "Clear understanding of foundational principles and requirements",
        "Good situational composure during behavioral scenarios"
      ],
      weakTopics: [
        {
          topic: "Quantitative Metrics & Benchmarks",
          score: 72,
          advice: "Include exact metrics (e.g. latency deltas, throughput, error rates) to make technical accomplishments more tangible."
        },
        {
          topic: "Edge Case & Error Handling",
          score: 75,
          advice: "Explicitly mention retry strategies, timeout budgets, and degraded fallback states."
        }
      ],
      recommendedActions: [
        "Practice quantifying business and performance impact using the STAR framework",
        "Deepen familiarity with system profiling tools and diagnostic workflows",
        "Review architecture trade-offs between consistency and availability"
      ]
    };
  }

  // --- Dynamic 15-Question Fallback Generator ---
  private static generateSmartFallbackQuestions(params: GenerateInterviewRequest) {
    const level = params.experienceLevel || "fresher";
    const company = params.company || "our engineering team";

    const topProject = params.resumeProfile?.keyProjects?.[0] || "your main portfolio project";
    const secondProject = params.resumeProfile?.keyProjects?.[1] || "your secondary application";
    const topSkills = params.resumeProfile?.skills?.slice(0, 3).join(", ") || "your core programming language and framework";

    if (level === "fresher") {
      return [
        {
          text: `To kick things off, could you introduce yourself, walk me through your background and projects, and share what attracted you to this role at ${company}?`,
          type: "hr" as const,
          difficulty: "easy" as const,
          context: "HR Introduction & Motivation"
        },
        {
          text: params.resumeProfile?.keyProjects?.length
            ? `On your resume, you highlighted your work building "${topProject}". Could you walk me through the system architecture, what technologies you chose, and how you structured the backend and state?`
            : "Tell me about a technical project you built recently (either in college or independently). What tech stack did you choose, and what was a challenging bug you had to solve?",
          type: "technical" as const,
          difficulty: "easy" as const,
          context: "Project Ownership & Foundations"
        },
        {
          text: params.resumeProfile?.keyProjects?.length
            ? `Looking at "${topProject}" (and ${secondProject}), what was the most difficult bug, performance bottleneck, or edge case you ran into, and how did you diagnose and fix it?`
            : "Walk me through how you planned the architecture and file structure of one of your applications before writing the code.",
          type: "technical" as const,
          difficulty: "easy" as const,
          context: "Code Organization & Design"
        },
        {
          text: params.resumeProfile?.skills?.length
            ? `You listed practical experience with ${topSkills}. How did you handle asynchronous operations and error resilience when integrating APIs in your projects?`
            : "Explain how asynchronous operations work in your preferred programming language (such as async/await or Promises in JavaScript). How do you handle errors when an API request fails?",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "Core Async & Error Resilience"
        },
        {
          text: "When building an interactive UI component, how do you handle state management to ensure smooth re-renders without unnecessary lagging?",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "State & Rendering Fundamentals"
        },
        {
          text: "Explain the difference between a GET and POST request in a REST API. How do you validate and protect data being sent from client to server?",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "HTTP & API Protocols"
        },
        {
          text: "How do you inspect network requests, DOM nodes, and console warnings using browser developer tools when troubleshooting UI defects?",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "DevTools & Diagnostic Flow"
        },
        {
          text: "Describe how CSS layouts (Flexbox vs CSS Grid) work and how you ensure responsive designs render cleanly on mobile viewports.",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "Responsive Layouts & Styling"
        },
        {
          text: "Suppose you encounter a bug where data returned from an API is undefined in your component. What is your step-by-step troubleshooting workflow?",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "Debugging & Root Cause Analysis"
        },
        {
          text: "Describe a situation where you had to learn a completely new technology, tool, or library on a tight deadline for a project. How did you approach it?",
          type: "behavioral" as const,
          difficulty: "medium" as const,
          context: "Adaptability & Resourcefulness"
        },
        {
          text: "Tell me about a time you worked on a team project and had a disagreement on how to divide the work or implement a feature. How did you resolve it?",
          type: "behavioral" as const,
          difficulty: "medium" as const,
          context: "Collaboration & Conflict Management"
        },
        {
          text: "Describe a time when you received constructive feedback or a difficult code review. How did you incorporate the feedback to improve your code?",
          type: "behavioral" as const,
          difficulty: "medium" as const,
          context: "Coachability & Growth Mindset"
        },
        {
          text: "When building a web feature or writing an API function, what steps do you take to make sure your code is clean, well-tested, and maintainable?",
          type: "technical" as const,
          difficulty: "medium" as const,
          context: "Clean Code & Quality Standards"
        },
        {
          text: "How do you prioritize your time when you have multiple assignments or feature deadlines competing for your attention?",
          type: "behavioral" as const,
          difficulty: "medium" as const,
          context: "Time Management & Prioritization"
        },
        {
          text: "To wrap up our conversation, where do you see yourself growing technically over the next 1–2 years, and what questions do you have about working on our team?",
          type: "hr" as const,
          difficulty: "easy" as const,
          context: "Career Vision & Final Engagement"
        }
      ];
    }

    // Default Junior/Mid/Senior 15 Questions
    return [
      {
        text: `To kick things off, could you introduce yourself, highlight your engineering journey, and share what drew you to ${company}?`,
        type: "hr" as const,
        difficulty: "easy" as const,
        context: "Professional Narrative & Alignment"
      },
      {
        text: "Walk me through a production feature you implemented end-to-end. How did you structure your components, data models, and API interfaces?",
        type: "technical" as const,
        difficulty: "medium" as const,
        context: "Feature Implementation & Architecture"
      },
      {
        text: "Tell me about the most complex technical trade-off you had to make in your recent work. What alternatives did you evaluate and why did you choose your solution?",
        type: "technical" as const,
        difficulty: "hard" as const,
        context: "Technical Trade-offs & Judgment"
      },
      {
        text: "How do you manage client-side state and caching to prevent redundant network requests and maintain 60 FPS UI responsiveness?",
        type: "technical" as const,
        difficulty: "medium" as const,
        context: "State Management & Caching"
      },
      {
        text: "Describe how you design backend endpoints or serverless functions to guarantee idempotency and graceful error recovery under network partitions.",
        type: "technical" as const,
        difficulty: "hard" as const,
        context: "Idempotency & Resilient API Design"
      },
      {
        text: "How do you approach database schema design, indexing, and query optimization to avoid slow queries as tables grow?",
        type: "technical" as const,
        difficulty: "hard" as const,
        context: "Database Performance & Indexing"
      },
      {
        text: "Describe how you debug a production incident when users report that a feature is intermittently failing or experiencing high latency.",
        type: "technical" as const,
        difficulty: "medium" as const,
        context: "Incident Response & Diagnostics"
      },
      {
        text: "How do you incorporate unit, integration, and end-to-end automated testing into your development workflow without sacrificing velocity?",
        type: "technical" as const,
        difficulty: "medium" as const,
        context: "Testing Strategy & CI/CD"
      },
      {
        text: "Tell me about a time you had a technical disagreement with a colleague on an architectural direction. How did you facilitate consensus?",
        type: "behavioral" as const,
        difficulty: "medium" as const,
        context: "Leadership & Consensus Building"
      },
      {
        text: "Describe a project where requirements shifted dramatically mid-development. How did you adapt your timeline and communication with stakeholders?",
        type: "behavioral" as const,
        difficulty: "medium" as const,
        context: "Stakeholder Management & Agility"
      },
      {
        text: "Tell me about a time you identified technical debt that was slowing the team down. How did you build consensus to refactor it?",
        type: "behavioral" as const,
        difficulty: "medium" as const,
        context: "Technical Debt & Pragmatic Scoping"
      },
      {
        text: "How do you approach securing web applications against common vulnerabilities like XSS, CSRF, and unauthorized data leakage?",
        type: "technical" as const,
        difficulty: "hard" as const,
        context: "Application Security & Auth"
      },
      {
        text: "How do you establish engineering standards, observability (metrics, logs, traces), and code review rigor across a team?",
        type: "technical" as const,
        difficulty: "hard" as const,
        context: "Observability & Engineering Rigor"
      },
      {
        text: "Tell me about a time you mentored a junior engineer or helped unblock a teammate who was struggling with a complex problem.",
        type: "behavioral" as const,
        difficulty: "easy" as const,
        context: "Mentorship & Team Enablement"
      },
      {
        text: "To wrap up, where do you see your technical leadership growing in the coming years, and what questions do you have for us?",
        type: "hr" as const,
        difficulty: "easy" as const,
        context: "Career Vision & Final Engagement"
      }
    ];
  }

  private static generateSmartFallbackScore(params: {
    questionText: string;
    answerText: string;
    questionDifficulty: string;
  }) {
    const trimmed = params.answerText.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const isRefusal = wordCount < 4 || /^(no\b|nah\b|nope\b|skip\b|pass\b|next\b|idk\b|i don'?t know\b|no idea\b|i decline\b|i don'?t want to\b|dont want to\b|refuse\b|none\b)/i.test(trimmed);

    if (isRefusal) {
      return {
        clarity: 1.0,
        structure: 1.0,
        depth: 0.5,
        relevance: 0.5,
        feedback: "No substantive answer or technical explanation was provided. In an actual technical interview, passing on a core competency results in a failing score for that section. Always articulate your thought process from first principles or discuss relevant foundations.",
        modelAnswer: "In a real interview, approach this by breaking down the question: clarify requirements, outline your thought process, describe key components or technical constraints, and discuss how you would verify the outcome.",
        extractedTopics: ["Communication", "Interview Participation"],
        strengths: ["None demonstrated for this question"],
        improvements: [
          "Attempt every question by sharing your reasoning and problem-solving process",
          "Discuss relevant projects, coursework, or how you would investigate the topic"
        ]
      };
    }

    const hasTechnicalKeywords = /(profil|render|memo|cache|zustand|query|virtual|index|latency|async|concurrency|database|api|architecture|star|situation|task|action|result|component|state|error|project|learn|redis|sql|orm|rest|graphql|docker|kubernetes|jwt|oauth|auth|middleware|hook|lifecycle)/i.test(params.answerText);
    
    let clarity: number;
    let structure: number;
    let depth: number;
    let relevance: number;
    let feedback: string;

    if (wordCount < 15) {
      clarity = 3.5;
      structure = 3.0;
      depth = 2.0;
      relevance = 4.0;
      feedback = "Answer is very brief and surface-level. To achieve a competitive interview score, walk through specific technical patterns, implementation steps, and concrete project context.";
    } else if (wordCount < 35) {
      clarity = 5.5;
      structure = 5.0;
      depth = hasTechnicalKeywords ? 5.0 : 3.8;
      relevance = 6.0;
      feedback = "Good initial direction, but lacks technical depth and concrete examples. Elaborate on why you chose your approach, trade-offs balanced, and how you handled edge cases.";
    } else if (wordCount < 70) {
      clarity = 7.5;
      structure = 7.0;
      depth = hasTechnicalKeywords ? 7.2 : 5.8;
      relevance = 7.8;
      feedback = "Solid explanation covering the essential concepts. To push your score higher, include specific numerical metrics, performance trade-offs, and failure recovery strategies.";
    } else {
      clarity = 8.8;
      structure = 8.5;
      depth = hasTechnicalKeywords ? 8.8 : 7.5;
      relevance = 9.0;
      feedback = "Comprehensive, well-articulated response demonstrating strong engineering judgment and clear communication structure.";
    }

    return {
      clarity,
      structure,
      depth,
      relevance,
      feedback,
      modelAnswer: "A gold-standard response clearly outlines the problem constraints, details the architectural solution with concrete component choices, and evaluates production trade-offs including caching, latency, and failure handling.",
      extractedTopics: hasTechnicalKeywords ? ["System Architecture", "Engineering Fundamentals", "Technical Execution"] : ["Problem Solving", "General Delivery"],
      strengths: [
        "Structured communication and logical progression of ideas",
        "Addressed the core intent of the question"
      ],
      improvements: [
        "Include more concrete numerical benchmarks and lessons learned from past projects",
        "Elaborate on alternative approaches and why your chosen solution was best"
      ]
    };
  }
}
