# Mentra — AI Mock Interview & Prep Tracker

A full-stack, AI-heavy SaaS project: paste a job description, get a tailored mock interview with a streaming AI interviewer (text or voice), receive structured scoring + feedback, and track weak areas over time.

Use this document as a build prompt — paste relevant sections into your AI coding assistant (Claude Code, Cursor, etc.) section by section, or hand the whole thing over as project context.

---

## 1. Product Overview

**Name:** Mentra
**Tagline:** Practice the interview before it's real. Your personal AI career mentor.

**Problem it solves:** Freshers/job seekers prepare for interviews by reading generic question lists, with no feedback loop on how they actually answer, and no memory of which topics they're consistently weak in across multiple applications.

**Core loop:**
1. User pastes a job description (or role + company name)
2. AI generates 5–8 tailored interview questions (mix of behavioral + technical)
3. User answers via voice or text; AI "interviewer" responds in real time (streaming), sometimes with a natural follow-up
4. After the session, AI scores each answer against a rubric and gives specific feedback
5. Dashboard aggregates sessions over time: score trends, recurring weak topics, "revise before your next interview" summary
6. **New:** Smart difficulty adaptation based on performance
7. **New:** "Second Attempt" mode for immediate improvement
8. **New:** Interview Readiness Score (0-100) tracking progress over time
9. **New:** Session recovery for interrupted interviews

**Target user:** Freshers and early-career job seekers actively interviewing (you are literally the first user — dogfood it and use real feedback from your own job search as your product development story for interviews).

---

## 2. Tech Stack (100% Free Tier)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript | |
| Styling | Tailwind CSS + shadcn/ui | |
| Streaming chat | Vercel AI SDK (`ai` package, `useChat` hook) | Handles token-by-token streaming UI |
| Primary LLM | Groq (Llama 3.3 70B or similar) | Free tier, fast enough for live interview feel |
| Fallback LLM | Google Gemini API (Gemini Flash) | Auto-retry here if Groq rate-limits — worth mentioning in interviews as a resilience design choice |
| Voice input | Browser Web Speech API (`SpeechRecognition`) | Free, in-browser, no network call |
| Voice input (higher accuracy, optional) | Groq Whisper endpoint | Fallback if browser STT is unreliable |
| Voice output | Browser Web Speech API (`SpeechSynthesis`) | Free, in-browser |
| Auth | Clerk | Free tier, drop-in components |
| Database | Supabase (Postgres) | Free tier |
| ORM | Prisma | |
| Charts (dashboard) | Recharts | |
| Deployment | Vercel | Free Hobby tier |
| Validation | Zod | For structured LLM output parsing |
| Caching | Upstash Redis or Vercel KV | Free tier for caching question generation |
| Email | Resend or Nodemailer | Free tier for reminder emails |
| PDF Generation | @react-pdf/renderer | Free |

No paid service, no credit card required anywhere in this stack.

---

## 3. Data Model (Prisma Schema)

```prisma
model User {
  id               String             @id @default(cuid())
  clerkId          String             @unique
  email            String
  createdAt        DateTime           @default(now())
  sessions         InterviewSession[]
  lastPracticedAt  DateTime?
  reminderPreference Boolean           @default(false)
  reminderInterval Int?               // days between reminders (default: 3)
}

model InterviewSession {
  id              String             @id @default(cuid())
  userId          String
  user            User               @relation(fields: [userId], references: [id])
  jobDescription  String             @db.Text
  role            String?
  company         String?
  mode            String             @default("full") // quick | full | grill
  status          String             @default("in_progress") // in_progress | completed | abandoned
  overallSummary  String?            @db.Text
  readinessScore  Int?               // 0-100 overall score for this session
  weakTopics      String[]           @default([])
  createdAt       DateTime           @default(now())
  completedAt     DateTime?
  questions       Question[]
  sessionTopics   SessionTopic[]
}

model Question {
  id          String    @id @default(cuid())
  sessionId   String
  session     InterviewSession @relation(fields: [sessionId], references: [id])
  text        String    @db.Text
  type        String    // behavioral | technical
  difficulty  String    // easy | medium | hard
  order       Int
  answer      Answer?
  attempts    Answer[]  // For "Second Attempt" feature
}

model Answer {
  id          String    @id @default(cuid())
  questionId  String
  question    Question  @relation(fields: [questionId], references: [id])
  attempt     Int       @default(1) // 1 = first attempt, 2 = second attempt
  text        String    @db.Text
  inputMode   String    // voice | text
  clarity     Int       // 0-10
  structure   Int       // 0-10
  depth       Int       // 0-10
  relevance   Int       // 0-10
  feedback    String    @db.Text
  improvementScore Int?  // For second attempt: delta from first attempt
  createdAt   DateTime  @default(now())
}

model Topic {
  id          String   @id @default(cuid())
  name        String   @unique
  createdAt   DateTime @default(now())
  sessionTopics SessionTopic[]
}

model SessionTopic {
  sessionId   String
  session     InterviewSession @relation(fields: [sessionId], references: [id])
  topicId     String
  topic       Topic     @relation(fields: [topicId], references: [id])
  avgScore    Float?    // average score for this topic in this session
  @@id([sessionId, topicId])
}

model CachedQuestions {
  id          String   @id @default(cuid())
  jdHash      String   @unique // hash of jobDescription + role + questionCount
  jobDescription String @db.Text
  role        String?
  questions   Json     // Stored as JSON array
  createdAt   DateTime @default(now())
  expiresAt   DateTime // 30 days from creation
}

4. The AI Calls (Structured & Unstructured)
4a. Question Generation

Prompt the LLM to return strict JSON, validated with Zod — not free text.

System Prompt:
text

You are an expert technical interviewer. Given a job description, generate interview questions.
Return ONLY valid JSON matching this schema, no prose:
{
  "questions": [
    { "text": string, "type": "behavioral" | "technical", "difficulty": "easy" | "medium" | "hard" }
  ]
}
Generate 5-8 questions relevant to the JD, mixing behavioral and technical, ordered easy to hard.
Consider the company culture if provided (e.g., "startup", "corporate", "fast-paced").

User Prompt:
text

Job description: {jobDescription}
Role: {role}
Company: {company}
Company Culture Keywords: {cultureKeywords} // optional
Number of questions: {questionCount} // 5-8, default 7

Zod Validation:
ts

const QuestionSchema = z.object({
  questions: z.array(z.object({
    text: z.string(),
    type: z.enum(["behavioral", "technical"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })).min(5).max(8),
});

Caching Logic:
ts

// Generate hash from JD + role + questionCount
const jdHash = createHash('sha256')
  .update(`${jobDescription}|${role}|${questionCount}`)
  .digest('hex');

// Check cache first
const cached = await prisma.cachedQuestions.findUnique({
  where: { jdHash }
});

if (cached && cached.expiresAt > new Date()) {
  return cached.questions;
}

// If not cached or expired, call LLM and store

4b. Answer Scoring (with Difficulty Tracking)

Separate call, also strict JSON, run right after each answer is submitted.

System Prompt:
text

You are scoring a candidate's interview answer. Score strictly based on the rubric below.
Return ONLY valid JSON, no prose:
{
  "clarity": number (0-10),
  "structure": number (0-10),
  "depth": number (0-10),
  "relevance": number (0-10),
  "feedback": string (2-3 sentences, specific and actionable),
  "extractedTopics": string[] // e.g., ["Data Structures", "System Design", "STAR Method"]
}

Rubric:
- clarity: is the answer easy to follow and well-communicated?
- structure: does it follow a clear format (e.g. STAR for behavioral)?
- depth: does it show real technical/experiential depth, not generic statements?
- relevance: does it actually answer what was asked, tailored to the role?
- extractedTopics: identify 1-3 key topics/concepts from the answer for tracking

User Prompt:
text

Question: {questionText}
Question Difficulty: {difficulty}
Candidate's answer: {answerText}
Role: {role}

Zod Validation:
ts

const AnswerScoreSchema = z.object({
  clarity: z.number().min(0).max(10),
  structure: z.number().min(0).max(10),
  depth: z.number().min(0).max(10),
  relevance: z.number().min(0).max(10),
  feedback: z.string(),
  extractedTopics: z.array(z.string()),
});

4c. Smart Difficulty Adaptation (New)

After 3 questions, analyze performance and adjust remaining question difficulty.

System Prompt:
text

Based on the candidate's performance so far, determine if the remaining questions should be easier or harder.
Return ONLY valid JSON, no prose:
{
  "adjustment": "easier" | "harder" | "same",
  "reason": string (1 sentence)
}

User Prompt:
text

Candidate's scores so far:
{questionText}: clarity {clarity}/10, depth {depth}/10, structure {structure}/10

Average clarity: {avgClarity}
Average depth: {avgDepth}
Average structure: {avgStructure}

Current question difficulty: {currentDifficulty}
Remaining questions: {remainingCount}

Should the remaining questions be adjusted?

Logic:
ts

// If avg score < 6/10: make remaining questions "easy"
// If avg score > 8/10: make remaining questions "hard"
// If avg score 6-8/10: keep "medium"

4d. Streaming "Interviewer" Follow-ups

Use the Vercel AI SDK's streamText for the live back-and-forth feel.

System Prompt:
text

You are conducting a live mock interview. After the candidate answers, respond briefly and naturally —
acknowledge their answer in one short line, and either ask a quick clarifying follow-up OR move to the next question.
Keep responses under 2 sentences. Be encouraging but realistic, like a real interviewer.

If this is a "Grill Mode" interview, be slightly more challenging and push for deeper answers.

4e. Interview Readiness Score Calculation

At the end of each session, calculate a 0-100 readiness score.

Components:

    Technical Skills: average of depth scores across technical questions (weight: 30%)

    Behavioral Skills: average of structure scores across behavioral questions (weight: 30%)

    Communication: average of clarity scores across all questions (weight: 20%)

    Consistency: standard deviation of scores across all questions (lower deviation = higher score) (weight: 20%)

Implementation:
ts

function calculateReadinessScore(session: InterviewSessionWithAnswers): number {
  const techAvg = average(session.questions.filter(q => q.type === 'technical').map(q => q.answer.depth));
  const behaviorAvg = average(session.questions.filter(q => q.type === 'behavioral').map(q => q.answer.structure));
  const clarityAvg = average(session.questions.map(q => q.answer.clarity));
  const consistency = 10 - (standardDeviation(session.questions.map(q => q.answer.clarity + q.answer.depth + q.answer.structure + q.answer.relevance)) / 4);
  
  const score = (techAvg * 0.3) + (behaviorAvg * 0.3) + (clarityAvg * 0.2) + (consistency * 0.2);
  return Math.round(score * 10); // Convert to 0-100 scale
}

4f. Personalized "Revise Before Interview" Card (Post-Session)

Generate a personalized summary after each session.

System Prompt:
text

Generate a personalized "revise before your interview" summary based on the candidate's performance.
Return ONLY valid JSON, no prose:
{
  "weakTopics": [
    { "topic": string, "score": number, "advice": string }
  ],
  "strengths": [
    { "topic": string, "score": number }
  ],
  "recommendedActions": string[] // 2-3 actionable recommendations
}

User Prompt:
text

Candidate's session summary:
{aggregated data from all answers and scores}

Generate a concise, actionable summary for improvement.

5. New Features to Implement
5.1. Smart Question Difficulty Progression

Implementation:

    After the first 3 answers, analyze performance using the existing rubric scores

    If avg clarity/structure < 6/10, the remaining questions become easier ("medium" → "easy")

    If avg > 8/10, remaining questions become "hard"

    UI indicator: "📈 Adjusting difficulty based on your performance..."

    Store adjustmentReason in session for analytics

5.2. "Second Attempt" Mode

Implementation:

    After each answer is scored, show a "📝 Try Again" button

    User can re-answer the same question

    The AI scores the new answer (using the same rubric)

    Store both attempts in the Answer table with attempt: 1 or attempt: 2

    Calculate improvementScore = secondAttempt.avgScore - firstAttempt.avgScore

    Show on dashboard: "You improved your clarity by +3 points on this question!"

UI Flow:
text

[First Answer] → [Score Display] → [Try Again Button]
[Second Answer] → [Score Display] → [Comparison: +2 Clarity, +1 Depth]

5.3. "Interview Readiness Score" (0-100)

Implementation:

    Aggregate all scores from all sessions

    Calculate overall readiness with weighted components:

        Technical skills: 30%

        Behavioral skills: 30%

        Communication clarity: 20%

        Consistency across sessions: 20%

    Display progress bar on dashboard: "You're 72% interview-ready. 5 more sessions to reach 90%."

    Show trend: "Your readiness has improved +15% in the last 3 sessions."

5.4. Session Recovery & Resume

Implementation:

    Store each Answer as soon as it's submitted (not just at session end)

    On page load, check for unfinished sessions: status: "in_progress"

    Prompt: "You have an unfinished interview. Resume from Question 4/7?"

    Store progress in session: lastQuestionIndex

5.5. Session Modes (Quick Prep / Full Mock / Grill Mode)

Implementation:

    Add mode selector on landing page

    Quick Prep: 3 questions, 5 minutes (mix of behavioral + technical)

    Full Mock: 7-8 questions, 20 minutes (default)

    Grill Mode: 6 questions, all "hard" difficulty, with more challenging follow-ups

    Store mode in InterviewSession

5.6. Company Culture Matching

Implementation:

    Add optional field: "Company Culture Keywords" (text input)

    Example: "fast-paced, collaborative, startup, innovation-driven"

    AI tailors questions to assess culture fit

    Post-session: generate "Culture Alignment Score" (0-10)

    Store in session for analytics

5.7. Topic-Level Weakness Detection (NLP)

Implementation:

    Use extractedTopics from the scoring call

    Store topics in Topic and SessionTopic tables

    On dashboard, show: "Your weakest topics: Data Structures (avg 4/10), System Design (avg 5/10)"

    Also show: "Topics to revise: JavaScript Closures (3 sessions, avg 5/10)"

5.8. Email Reminder System

Implementation:

    After each session, ask: "Want a reminder to practice again in 3 days?"

    Store lastPracticedAt and reminderPreference

    Use Vercel Cron Jobs (free) to check daily

    Send email via Resend (free tier): "It's been {days} days since your last practice. Your weak topics are: {topics}. Ready for another round?"

5.9. Exportable Report (PDF)

Implementation:

    Add "📄 Export Report" button on post-session screen

    Generate clean PDF with:

        Session overview (date, role, company, mode)

        Per-question breakdown (question, your answer, rubric scores, feedback)

        Overall summary, weak topics, readiness score

    Use @react-pdf/renderer

5.10. Progress Dashboard with Recharts

Implementation:

    Score trend line chart over time (x-axis: date, y-axis: readiness score)

    Weak topic frequency bar chart

    Session history list with filtering by mode/date

    "Revise before your next interview" card with personalized recommendations

6. Screens to Build
6.1. Landing / Setup Screen

Components:

    Job Description textarea (required)

    Role input (optional)

    Company input (optional)

    Company Culture Keywords input (optional, new)

    Question count selector: 5-8 (default 7)

    Session mode selector: Quick Prep | Full Mock | Grill Mode (new)

    "Start Interview" button

    If unfinished session exists: "Resume Previous Session" button (new)

6.2. Interview Session (Chat UI)

Components:

    Progress bar: "Question 3/7"

    AI question display (text streams in, optionally read aloud)

    User answer input: text field + microphone button

    Real-time scoring after each answer (displayed in a panel on the side)

    "Second Attempt" button after scoring (new)

    Running stats: average clarity, current weak area, difficulty level indicator (new)

    Smart difficulty indicator: "📈 Adjusting to medium difficulty" (new)

6.3. Post-Session Report

Components:

    Session summary (date, role, company, mode)

    Readiness Score with breakdown (new)

    Per-question breakdown:

        Question text

        Your answer (with attempts if applicable) (new)

        4-axis rubric scores (clarity, structure, depth, relevance)

        Feedback

        Improvement score (if second attempt) (new)

    Overall summary and weak topics

    "Revise Before Interview" personalized card (new)

    "Export Report (PDF)" button (new)

    "Start New Session" button

6.4. Dashboard

Components:

    Readiness Score with trend (overall + breakdown) (new)

    Score trend line chart (Recharts)

    Weak topic frequency bar chart

    Session history list with filters (mode, date range)

    "Revise before your next interview" card (new)

    "Second Attempts" summary: improvement tracking (new)

    Reminder settings toggle (new)

7. Voice Implementation Notes

Input:

    webkitSpeechRecognition / SpeechRecognition transcribes to text client-side

    Feed transcript into the exact same pipeline as typed answers

    Fallback: Groq Whisper API if browser STT is unreliable

Output:

    window.speechSynthesis.speak() reads the AI's question/follow-up aloud

    Always keep a text fallback (input field) for accessibility

Storage:

    Store inputMode: "voice" | "text" on each Answer

    Analytics: show "you scored higher when answering by voice vs text"

8. Free-Tier Resilience Pattern

Since Groq and Gemini free tiers can rate-limit unpredictably, wrap LLM calls in a fallback chain:
ts

async function callLLM(prompt: string, options?: { useCache?: boolean }) {
  // 1. Check cache first (for question generation)
  if (options?.useCache) {
    const cached = await checkCache(prompt);
    if (cached) return cached;
  }
  
  // 2. Try primary provider (Groq)
  try {
    const result = await callGroq(prompt);
    // Store in cache if applicable
    return result;
  } catch (err) {
    if (isRateLimitError(err) || isTimeoutError(err)) {
      // 3. Fallback to Gemini
      try {
        const result = await callGemini(prompt);
        return result;
      } catch (geminiErr) {
        // 4. Log and re-throw
        console.error('Both LLM providers failed', geminiErr);
        throw new Error('All LLM providers unavailable');
      }
    }
    throw err;
  }
}

Caching Strategy:

    Cache question generation results for 30 days

    Use jdHash as cache key

    Clear cache when JD changes significantly

This is a genuine, defensible engineering decision: "I designed for free-tier reliability with a provider fallback chain and caching."

11. Performance & UX Considerations
11.1. Loading States

    Show skeleton loaders during question generation

    Show "Interviewer is thinking..." animation during streaming

    Show progress indicators for voice permission requests

11.2. Error Handling

    Graceful fallback if voice is not supported

    Clear error messages for rate limits

    Auto-retry on network failures

11.3. Mobile Responsiveness

    Full mobile support for practice on-the-go

    Touch-friendly buttons

    Voice input optimized for mobile (bigger microphone button)

