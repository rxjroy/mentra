import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { Database } from "@/lib/db";
import { SessionStore } from "@/lib/session-store";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { Logger } from "@/lib/logger";
import { getSafeErrorMessage } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 20 migrations per minute per IP
  const rateLimit = checkRateLimit(ip, {
    limit: 20,
    windowMs: 60 * 1000
  });

  if (!rateLimit.allowed) {
    Logger.security("Session migration rate limit exceeded", { ip });
    return createRateLimitResponse(rateLimit);
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to migrate interview session." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Valid sessionId is required." },
        { status: 400 }
      );
    }

    let session = SessionStore.getSession(sessionId);
    if (!session) {
      session = await Database.getSession(sessionId);
    }

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    // Security: If session already belongs to another candidate, prevent hijacking!
    if (session.userId && session.userId !== user.id) {
      Logger.security("Candidate attempted to hijack session belonging to another user", {
        ip,
        targetSessionId: sessionId,
        ownerUserId: session.userId,
        attackerUserId: user.id
      });
      return NextResponse.json(
        { error: "Access denied. This interview session is already registered to another candidate account." },
        { status: 403 }
      );
    }

    // Assign session to candidate's vault
    session.userId = user.id;
    SessionStore.saveSession(session);
    await Database.saveSession(session);
    Logger.audit("Session migrated to candidate account", { userId: user.id, sessionId });

    return NextResponse.json({
      success: true,
      message: "Session successfully linked to candidate account vault.",
      session
    });
  } catch (error: any) {
    Logger.error("Session migration error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to migrate session") },
      { status: 500 }
    );
  }
}
