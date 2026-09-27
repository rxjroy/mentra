import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { signJWT, COOKIE_NAME } from "@/lib/auth";
import { OtpService } from "@/lib/otp";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizeEmail, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // Rate limit: Max 10 verify attempts per 10 minutes
    const rateLimit = checkRateLimit(ip, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
      prefix: "otp_verify"
    });

    if (!rateLimit.allowed) {
      Logger.security("Registration OTP verify rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Too many attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`);
    }

    const { email, otp } = await req.json();
    const cleanEmail = sanitizeEmail(email);

    if (!cleanEmail || !otp) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required" },
        { status: 400 }
      );
    }

    const result = OtpService.verifyCode(cleanEmail, otp);

    if (!result.success || !result.data) {
      Logger.security("Invalid registration OTP code entered", { email: cleanEmail, ip });
      return NextResponse.json(
        { error: result.error || "Invalid verification code" },
        { status: 400 }
      );
    }

    // Double check email isn't already taken
    const existing = await Database.findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Create user in Database
    const user = await Database.createUser(
      result.data.name,
      result.data.email,
      result.data.passwordHash
    );

    // Issue JWT Auth Cookie
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name
    });

    Logger.audit("User verified email and registered account", { userId: user.id, email: user.email, ip });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    return response;
  } catch (error: any) {
    Logger.error("OTP verify error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to verify account") },
      { status: 500 }
    );
  }
}
