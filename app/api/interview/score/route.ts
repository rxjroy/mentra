import { NextRequest, NextResponse } from "next/server";
import { AiEngine } from "@/lib/ai/provider";
import { SessionStore } from "@/lib/session-store";
import { Database } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { AnswerAttempt } from "@/lib/types/interview";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizePromptText, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const user = await getAuthUser();
    const body = await req.json();
    const { 
      sessionId, 
      questionId, 
      answerText, 
      inputMode = "text", 
      attemptNumber = 1,
      isFollowUp,
      followUpPrompt,
      previousAnswer
    } = body;

    const rateLimit = checkRateLimit(sessionId ? `sess_${sessionId}` : `ip_${ip}`, {
      limit: process.env.NODE_ENV === "development" ? 60 : 35,
      windowMs: 60 * 1000,
      prefix: "int_score"
    });

    if (!rateLimit.allowed) {
      Logger.security("Answer scoring rate limit reached", { ip, sessionId });
      return createRateLimitResponse(rateLimit, `Scoring rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.`);
    }

    if (!sessionId || !questionId || !answerText || !answerText.trim()) {
      return NextResponse.json(
        { error: "sessionId, questionId, and answerText are required." },
        { status: 400 }
      );
    }

    // Sanitize user answer against prompt injection tokens while preserving valid code syntax
    const cleanAnswer = sanitizePromptText(answerText, 15000);

    let session = SessionStore.getSession(sessionId);
    if (!session) {
      session = await Database.getSession(sessionId);
      if (session) {
        SessionStore.saveSession(session);
      }
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Multi-tenant authorization check
    if (session.userId) {
      if (!user || user.id !== session.userId) {
        Logger.security("Unauthorized attempt to submit answer to another user's session", {
          ip,
          sessionId,
          sessionOwner: session.userId,
          attemptedBy: user?.id || "guest"
        });
        return NextResponse.json(
          { error: "Access denied. You do not have permission to submit answers to this candidate session." },
          { status: 403 }
        );
      }
    } else if (user) {
      session.userId = user.id;
    }

    const questionIndex = session.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      return NextResponse.json({ error: "Question not found in session." }, { status: 404 });
    }

    const question = session.questions[questionIndex];

    // Score the answer with AI Engine
    const scoreResult = await AiEngine.scoreAnswer({
      questionText: question.text,
      questionDifficulty: question.difficulty,
      answerText: cleanAnswer,
      role: session.role,
      inputMode: inputMode as "voice" | "text",
      previousAnswer: previousAnswer ? sanitizePromptText(previousAnswer, 15000) : undefined,
      isFollowUp: !!isFollowUp,
      followUpPrompt: followUpPrompt ? sanitizePromptText(followUpPrompt, 5000) : undefined
    });

    const previousAttempts = question.attempts || [];
    let improvementScore: number | undefined = undefined;

    if (previousAttempts.length > 0) {
      const firstScore = (previousAttempts[0].scores.clarity + previousAttempts[0].scores.depth + previousAttempts[0].scores.structure + previousAttempts[0].scores.relevance) / 4;
      const currentScore = (scoreResult.clarity + scoreResult.depth + scoreResult.structure + scoreResult.relevance) / 4;
      improvementScore = +(currentScore - firstScore).toFixed(1);
    }

    const newAttempt: AnswerAttempt = {
      attempt: previousAttempts.length + 1,
      text: cleanAnswer,
      inputMode: inputMode as "voice" | "text",
      scores: {
        clarity: scoreResult.clarity,
        structure: scoreResult.structure,
        depth: scoreResult.depth,
        relevance: scoreResult.relevance
      },
      feedback: scoreResult.feedback,
      modelAnswer: scoreResult.modelAnswer,
      extractedTopics: scoreResult.extractedTopics,
      strengths: scoreResult.strengths,
      improvements: scoreResult.improvements,
      improvementScore,
      createdAt: new Date().toISOString()
    };

    if (!question.attempts) {
      question.attempts = [];
    }
    question.attempts.push(newAttempt);
    question.currentAnswer = newAttempt;

    // Check if adaptive difficulty adjustment should trigger (e.g. after question 3)
    const evaluatedScores = session.questions
      .filter(q => q.attempts && q.attempts.length > 0)
      .map(q => q.attempts[q.attempts.length - 1].scores);

    let difficultyAdjustment = session.difficultyAdjustment;
    if (evaluatedScores.length === 3 && !session.difficultyAdjustment) {
      const evaluation = AiEngine.evaluateDifficultyAdjustment(evaluatedScores);
      if (evaluation.adjustment !== "same") {
        difficultyAdjustment = {
          adjustedAtQuestion: 3,
          from: question.difficulty,
          to: evaluation.adjustment === "harder" ? "hard" : "easy",
          reason: evaluation.reason
        };
        session.difficultyAdjustment = difficultyAdjustment;

        // Adjust remaining questions
        for (let i = 3; i < session.questions.length; i++) {
          session.questions[i].difficulty = evaluation.adjustment === "harder" ? "hard" : "easy";
        }
      }
    }

    if (user && !session.userId) {
      session.userId = user.id;
    }

    SessionStore.saveSession(session);
    await Database.saveSession(session);

    return NextResponse.json({
      success: true,
      attempt: newAttempt,
      question,
      difficultyAdjustment,
      session
    });
  } catch (error: any) {
    Logger.error("Error scoring answer", error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to score answer. Please try again.") },
      { status: 500 }
    );
  }
}
