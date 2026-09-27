import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 3 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 3 * 60 * 1000);
}

export function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const clientIp = req.headers.get("x-client-ip");
  if (clientIp) {
    return clientIp.trim();
  }

  return "127.0.0.1";
}

export interface RateLimitOptions {
  limit: number;       // Max allowed requests in window
  windowMs: number;    // Time window in milliseconds
  prefix?: string;     // Endpoint identifier prefix
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
  headers: Record<string, string>;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const key = `${options.prefix || "rl"}:${identifier}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + options.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime
    });

    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetTime,
      retryAfterSeconds: 0,
      headers: {
        "X-RateLimit-Limit": options.limit.toString(),
        "X-RateLimit-Remaining": (options.limit - 1).toString(),
        "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString()
      }
    };
  }

  if (record.count >= options.limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      headers: {
        "X-RateLimit-Limit": options.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(record.resetTime / 1000).toString(),
        "Retry-After": Math.max(1, retryAfterSeconds).toString()
      }
    };
  }

  record.count += 1;
  const remaining = options.limit - record.count;
  return {
    allowed: true,
    limit: options.limit,
    remaining,
    resetTime: record.resetTime,
    retryAfterSeconds: 0,
    headers: {
      "X-RateLimit-Limit": options.limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(record.resetTime / 1000).toString()
    }
  };
}

/**
 * Creates a standardized 429 Too Many Requests response with security headers
 */
export function createRateLimitResponse(rateLimit: RateLimitResult, customMessage?: string): NextResponse {
  const message = customMessage || `Rate limit exceeded. Please try again in ${rateLimit.retryAfterSeconds} seconds.`;
  return NextResponse.json(
    { error: message },
    { status: 429, headers: rateLimit.headers }
  );
}

