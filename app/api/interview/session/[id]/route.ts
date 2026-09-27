import { NextRequest, NextResponse } from "next/server";
import { SessionStore } from "@/lib/session-store";
import { Database } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { Logger } from "@/lib/logger";
import { getSafeErrorMessage } from "@/lib/security";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);

  // Rate limit: 60 requests per minute per IP
  const rateLimit = checkRateLimit(ip, {
    limit: 60,
    windowMs: 60 * 1000
  });

  if (!rateLimit.allowed) {
    Logger.security("Session access rate limit exceeded", { ip });
    return createRateLimitResponse(rateLimit);
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    let session = SessionStore.getSession(id);
    if (!session) {
      session = await Database.getSession(id);
      if (session) {
        SessionStore.saveSession(session);
      }
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const user = await getAuthUser();

    // Multi-tenant isolation: If session belongs to an authenticated user, only that user may access it
    if (session.userId) {
      if (!user || user.id !== session.userId) {
        Logger.security("Unauthorized attempt to access another user's session", {
          ip,
          targetSessionId: id,
          targetSessionOwner: session.userId,
          requestingUserId: user?.id || "guest"
        });
        return NextResponse.json(
          { error: "Access denied. You do not have permission to view or resume this candidate interview session." },
          { status: 403 }
        );
      }
    } else if (user) {
      // Auto-bind unassigned guest session to current logged in user
      session.userId = user.id;
      SessionStore.saveSession(session);
      await Database.saveSession(session);
      Logger.audit("Bound guest session to authenticated user", { userId: user.id, sessionId: id });
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    Logger.error("Error retrieving session", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to retrieve session") },
      { status: 500 }
    );
  }
}
