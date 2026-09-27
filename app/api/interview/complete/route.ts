import { NextRequest, NextResponse } from "next/server";
import { SessionStore } from "@/lib/session-store";
import { Database } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { calculateReadinessScore, aggregateTopics } from "@/lib/ai/scoring";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const user = await getAuthUser();
    const body = await req.json();
    const { sessionId } = body;

    const rateLimit = checkRateLimit(user ? `usr_${user.id}` : `ip_${ip}`, {
      limit: process.env.NODE_ENV === "development" ? 30 : 12,
      windowMs: 5 * 60 * 1000,
      prefix: "int_comp"
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, `Completion rate limit reached. Please wait ${rateLimit.retryAfterSeconds}s.`);
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    let session = SessionStore.getSession(sessionId);
    if (!session) {
      session = await Database.getSession(sessionId);
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Multi-tenant check: Prevent completing someone else's session
    if (session.userId) {
      if (!user || user.id !== session.userId) {
        return NextResponse.json(
          { error: "Access denied. You do not have permission to modify or complete this candidate session." },
          { status: 403 }
        );
      }
    } else if (user) {
      session.userId = user.id;
    }

    // Calculate Final Readiness Score
    const scoreData = calculateReadinessScore(session.questions);
    const topicData = aggregateTopics(session.questions);

    session.status = "completed";
    session.completedAt = new Date().toISOString();
    session.readinessScore = scoreData.overall;
    session.categoryScores = {
      technical: scoreData.technical,
      behavioral: scoreData.behavioral,
      communication: scoreData.communication,
      consistency: scoreData.consistency
    };
    session.weakTopics = topicData.weakTopics;
    session.strengths = topicData.strengths;
    session.overallSummary = `Candidate achieved a ${scoreData.overall}% interview readiness score with solid performance in ${topicData.strengths.slice(0, 2).join(" & ")}.`;
    session.recommendedActions = [
      `Review edge cases and trade-offs for ${topicData.weakTopics[0]?.topic || "system architecture"}.`,
      "Practice timing answers to 90–120 seconds with crisp STAR structure.",
      "Conduct another session in Grill Mode to harden high-pressure response clarity."
    ];

    SessionStore.saveSession(session);
    await Database.saveSession(session);

    Logger.audit("Interview session completed", {
      sessionId,
      userId: session.userId,
      readinessScore: scoreData.overall,
      answeredCount: session.questions.filter(q => q.attempts?.length).length
    });

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    Logger.error("Error completing interview session", error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to complete interview session") },
      { status: 500 }
    );
  }
}
