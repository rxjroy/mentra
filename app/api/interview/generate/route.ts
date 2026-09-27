import { NextRequest, NextResponse } from "next/server";
import { AiEngine } from "@/lib/ai/provider";
import { SessionStore } from "@/lib/session-store";
import { Database } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { InterviewSession, QuestionData, ExperienceLevel } from "@/lib/types/interview";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizeInput, sanitizePromptText, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const user = await getAuthUser();

    // Rate limit: 20 per 5 min in dev, 8 per 5 min in prod
    const rateLimitKey = user ? `usr_${user.id}` : `ip_${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      limit: process.env.NODE_ENV === "development" ? 25 : 8,
      windowMs: 5 * 60 * 1000,
      prefix: "int_gen"
    });

    if (!rateLimit.allowed) {
      Logger.security("Interview generation rate limit reached", { ip, userId: user?.id });
      return createRateLimitResponse(rateLimit, `Interview generation limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds before generating a new session.`);
    }

    const body = await req.json();
    const { 
      jobDescription, 
      role, 
      company, 
      experienceLevel = "fresher", 
      mode = "full", 
      resumeFileName,
      resumeText,
      resumeProfile
    } = body;

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a valid job description with at least 10 characters." },
        { status: 400 }
      );
    }

    // Input sanitization against prompt injections & HTML injection
    const cleanJd = sanitizePromptText(jobDescription, 20000);
    const cleanRole = role ? sanitizeInput(role, 100) : undefined;
    const cleanCompany = company ? sanitizeInput(company, 100) : undefined;
    const cleanResume = resumeText ? sanitizePromptText(resumeText, 15000) : undefined;

    // Generate AI questions tailored to the input and calibrated to the candidate's experience level and resume
    const { questions: generatedQuestions, inferredRole, inferredCompany } = await AiEngine.generateQuestions({
      jobDescription: cleanJd,
      role: cleanRole,
      company: cleanCompany,
      experienceLevel: experienceLevel as ExperienceLevel,
      mode,
      resumeFileName: resumeFileName ? sanitizeInput(resumeFileName, 120) : undefined,
      resumeText: cleanResume,
      resumeProfile
    });

    const finalRole = cleanRole || inferredRole?.trim() || resumeProfile?.role?.trim() || AiEngine.extractRoleFromJd(cleanJd) || "Software Engineer";
    const finalCompany = cleanCompany || inferredCompany?.trim() || AiEngine.extractCompanyFromJd(cleanJd) || undefined;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const questions: QuestionData[] = generatedQuestions.map((q, idx) => ({
      id: `q_${idx + 1}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      order: idx + 1,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      context: q.context,
      attempts: []
    }));

    const newSession: InterviewSession = {
      id: sessionId,
      userId: user?.id,
      jobDescription: cleanJd,
      role: finalRole,
      company: finalCompany,
      experienceLevel: experienceLevel as ExperienceLevel,
      mode,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      questions,
      currentQuestionIndex: 0,
      weakTopics: [],
      strengths: [],
      recommendedActions: [],
      resumeText: cleanResume,
      resumeProfile: resumeProfile || undefined
    };

    SessionStore.saveSession(newSession);
    await Database.saveSession(newSession);

    Logger.info("Created new interview session", { sessionId, role: finalRole, userId: user?.id });

    return NextResponse.json({
      success: true,
      sessionId,
      session: newSession
    });
  } catch (error: any) {
    Logger.error("Error generating interview session", error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to generate interview sequence") },
      { status: 500 }
    );
  }
}
