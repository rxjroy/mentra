import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { OtpService } from "@/lib/otp";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { checkPasswordStrength, sanitizeInput, sanitizeEmail, isValidEmail, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // Rate limit: 30 OTP send requests in dev, 5 in production per 10 minutes per IP
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 30 : 5,
      windowMs: 10 * 60 * 1000,
      prefix: "otp_send"
    });

    if (!rateLimit.allowed) {
      Logger.security("Registration OTP send rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Too many verification requests. Please wait ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const { name, email, password, agreeToTerms } = await req.json();
    const cleanEmail = sanitizeEmail(email);

    if (!name || !cleanEmail || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (agreeToTerms === false) {
      return NextResponse.json(
        { error: "You must agree to the Terms of Service and Privacy Policy to proceed." },
        { status: 400 }
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Strict password policy validation
    const passwordValidation = checkPasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || "Password does not meet security requirements." },
        { status: 400 }
      );
    }

    const cleanName = sanitizeInput(name, 100);

    // Check if user already exists
    const existing = await Database.findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const { code, cooldownSeconds } = await OtpService.createPendingRegistration(cleanName, cleanEmail, passwordHash);
    Logger.audit("Registration OTP created & dispatched", { email: cleanEmail, ip });

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code was sent to ${cleanEmail}.`,
      devCode: process.env.NODE_ENV === "development" ? code : undefined,
      cooldownSeconds
    });
  } catch (error: any) {
    Logger.error("Registration OTP send error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to send verification code") },
      { status: error.status || 500 }
    );
  }
}
