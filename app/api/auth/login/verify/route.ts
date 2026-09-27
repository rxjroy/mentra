import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "@/lib/otp";
import { signJWT, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 20 verify attempts in dev, 5 in prod
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 25 : 5,
      windowMs: 10 * 60 * 1000,
      prefix: "login_otp_verify"
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, `Too many verification attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and 6-digit code are required" },
        { status: 400 }
      );
    }

    // Verify the single-use login OTP
    const verification = OtpService.verifyLoginCode(email, otp);
    if (!verification.success || !verification.data) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired security code" },
        { status: 400 }
      );
    }

    const { userId, name } = verification.data;

    // Issue Secure Session JWT Token
    const token = await signJWT({
      id: userId,
      email: email.toLowerCase().trim(),
      name
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, name, email }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 Days
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Login OTP verify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify security code" },
      { status: 500 }
    );
  }
}
