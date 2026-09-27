import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { comparePassword } from "@/lib/auth";
import { OtpService } from "@/lib/otp";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { sanitizeEmail, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // Rate limit: 25 login attempts per 10 minutes in dev, 5 in prod
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 25 : 5,
      windowMs: 10 * 60 * 1000,
      prefix: "login"
    });

    if (!rateLimit.allowed) {
      Logger.security("Login rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Too many login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const { email, password } = await req.json();
    const cleanEmail = sanitizeEmail(email);

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await Database.findUserByEmail(cleanEmail);
    if (!user) {
      Logger.security("Login failed: email not found", { email: cleanEmail, ip });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      Logger.security("Login failed: invalid password", { email: cleanEmail, ip });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Passwords match! Generate and dispatch 2FA Security OTP
    const { cooldownSeconds } = await OtpService.createPendingLogin(user.id, user.name, user.email);
    Logger.audit("Dispatched 2FA login OTP", { userId: user.id, email: user.email, ip });

    return NextResponse.json({
      success: true,
      requireOtp: true,
      email: user.email,
      message: `A 6-digit security code was sent to ${user.email}.`,
      cooldownSeconds
    });
  } catch (error: any) {
    Logger.error("Login error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to process sign in") },
      { status: 500 }
    );
  }
}
