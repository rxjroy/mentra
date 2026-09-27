import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { OtpService } from "@/lib/otp";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizeEmail, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 25 : 5,
      windowMs: 10 * 60 * 1000,
      prefix: "login_resend"
    });

    if (!rateLimit.allowed) {
      Logger.security("Login resend OTP rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Too many requests. Please try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const { email } = await req.json();
    const cleanEmail = sanitizeEmail(email);

    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await Database.findUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { cooldownSeconds } = await OtpService.createPendingLogin(user.id, user.name, user.email);
    Logger.audit("Resent 2FA login OTP", { userId: user.id, email: user.email, ip });

    return NextResponse.json({
      success: true,
      message: `A new 6-digit security code was sent to ${user.email}.`,
      cooldownSeconds
    });
  } catch (error: any) {
    Logger.error("Login resend error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to resend security code") },
      { status: 500 }
    );
  }
}
