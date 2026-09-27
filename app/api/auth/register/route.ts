import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { hashPassword, signJWT, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limiter";
import { checkPasswordStrength, sanitizeInput, getSafeErrorMessage } from "@/lib/security";
import { Logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 20 in dev, 5 in prod per 15 minutes per IP
    const rateLimit = checkRateLimit(ip, {
      limit: process.env.NODE_ENV === "development" ? 20 : 5,
      windowMs: 15 * 60 * 1000,
      prefix: "auth_reg"
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, `Too many registration attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }

    const { name, email, password, agreeToTerms } = await req.json();

    if (!name || !email || !password) {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const passwordValidation = checkPasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || "Password does not meet security requirements." },
        { status: 400 }
      );
    }

    const existing = await Database.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const cleanName = sanitizeInput(name);
    const passwordHash = await hashPassword(password);
    const user = await Database.createUser(cleanName, email.trim().toLowerCase(), passwordHash);

    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name
    });

    Logger.audit("User registered successfully", { userId: user.id, email: user.email, ip });

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
    Logger.error("Registration error", error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, "Failed to register user. Please try again.") },
      { status: 500 }
    );
  }
}
