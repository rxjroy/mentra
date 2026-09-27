import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { OtpService } from "@/lib/otp";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { checkPasswordStrength, sanitizeEmail, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // Rate limit: 20 confirm attempts in dev, 5 in prod
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 25 : 5,
      windowMs: 10 * 60 * 1000,
      prefix: "pwd_reset_conf"
    });

    if (!rateLimit.allowed) {
      Logger.security("Password reset confirm rate limit exceeded", { ip });
      return createRateLimitResponse(rateLimit, `Too many attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const { email, otp, newPassword } = await req.json();
    const cleanEmail = sanitizeEmail(email);

    if (!cleanEmail || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, 6-digit code, and new password are required." },
        { status: 400 }
      );
    }

    const passwordValidation = checkPasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || "New password does not meet security requirements." },
        { status: 400 }
      );
    }

    // Verify the single-use password reset OTP
    const verification = OtpService.verifyPasswordResetCode(cleanEmail, otp);
    if (!verification.success) {
      Logger.security("Invalid password reset OTP attempt", { email: cleanEmail, ip });
      return NextResponse.json(
        { error: verification.error || "Invalid or expired password reset code." },
        { status: 400 }
      );
    }

    // Hash the new password and update in Supabase / Database
    const newPasswordHash = await hashPassword(newPassword);
    await Database.updateUserPassword(cleanEmail, newPasswordHash);
    Logger.audit("Password reset confirmed and updated", { email: cleanEmail, ip });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now sign in with your new password."
    });
  } catch (error: any) {
    Logger.error("Password reset confirmation error", error, { ip });
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to update password") },
      { status: 500 }
    );
  }
}
