import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { OtpService } from "@/lib/otp";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizeEmail, isValidEmail, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // Rate limit: 20 requests in dev, 5 in prod per 10 minutes
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 25 : 5,
      windowMs: 10 * 60 * 1000,
      prefix: "pwd_reset_req"
    });

    if (!rateLimit.allowed) {
      Logger.security("Password reset request rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Too many password reset attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const body = await req.json();
    const cleanEmail = sanitizeEmail(body.email);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const user = await Database.findUserByEmail(cleanEmail);
    if (!user) {
      Logger.warn("Password reset requested for non-existent email", { email: cleanEmail, ip });
      return NextResponse.json(
        { error: "No registered account was found with this email address." },
        { status: 404 }
      );
    }

    // Generate & Dispatch Password Reset OTP
    const { cooldownSeconds } = await OtpService.createPendingPasswordReset(user.name, user.email);
    Logger.audit("Dispatched password reset OTP", { userId: user.id, email: user.email, ip });

    return NextResponse.json({
      success: true,
      message: `A 6-digit password reset code has been dispatched to ${user.email}.`,
      cooldownSeconds
    });
  } catch (error: any) {
    Logger.error("Password reset request error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to process password reset request") },
      { status: 500 }
    );
  }
}
