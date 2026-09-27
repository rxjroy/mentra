import { NextRequest, NextResponse } from "next/server";
import { AiEngine } from "@/lib/ai/provider";
import { SessionStore } from "@/lib/session-store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizePromptText, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    const body = await req.json();
    const { sessionId, questionId, userAnswer, attemptCount, score, isFollowUp, followUpPrompt } = body;

    const rateLimit = checkRateLimit(sessionId ? `sess_${sessionId}` : `ip_${ip}`, {
      limit: process.env.NODE_ENV === "development" ? 60 : 35,
      windowMs: 60 * 1000,
      prefix: "int_chat"
    });

    if (!rateLimit.allowed) {
      Logger.security("Chat response rate limit exceeded", { ip, sessionId });
      return createRateLimitResponse(rateLimit, `Chat rate limit reached. Please wait ${rateLimit.retryAfterSeconds}s.`);
    }

    const session = sessionId ? SessionStore.getSession(sessionId) : null;
    const question = session?.questions.find(q => q.id === questionId);

    const cleanAnswer = userAnswer ? sanitizePromptText(userAnswer, 15000) : "";
    const cleanFollowUpPrompt = followUpPrompt ? sanitizePromptText(followUpPrompt, 5000) : undefined;

    const reply = await AiEngine.getLiveInterviewerResponse({
      questionText: question?.text || "Tell me about your approach.",
      userAnswer: cleanAnswer,
      mode: session?.mode || "full",
      attemptCount: attemptCount ?? question?.attempts?.length ?? 1,
      score: score,
      isFollowUp: !!isFollowUp,
      followUpPrompt: cleanFollowUpPrompt
    });

    return NextResponse.json({
      success: true,
      message: reply.message,
      hasFollowUp: reply.hasFollowUp
    });
  } catch (error: any) {
    Logger.error("Error generating interviewer response", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to generate interviewer chat") },
      { status: 500 }
    );
  }
}
