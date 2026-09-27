import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { Logger } from "@/lib/logger";
import { getSafeErrorMessage } from "@/lib/security";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  
  // Rate limit: 60 requests per minute per IP
  const rateLimit = checkRateLimit(ip, {
    limit: 60,
    windowMs: 60 * 1000
  });

  if (!rateLimit.allowed) {
    Logger.security("Dashboard stats rate limit exceeded", { ip });
    return createRateLimitResponse(rateLimit);
  }

  try {
    const user = await getAuthUser();
    const isGuest = !user;
    
    // Fetch user specific stats if authenticated, or general preview stats if guest
    const stats = await Database.getDashboardStats(user?.id);
    
    return NextResponse.json({
      success: true,
      isGuest,
      user: user ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null,
      stats
    });
  } catch (error: any) {
    Logger.error("Error retrieving dashboard stats", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to retrieve dashboard stats") },
      { status: 500 }
    );
  }
}
