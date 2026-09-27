import crypto from "crypto";

export interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0 to 100
  level: "weak" | "fair" | "good" | "strong";
  errors: string[];
  criteria: PasswordCriteria;
}

/**
 * Validates password strength against production-grade security policy:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*(),.?":{}|<>\-_=+[\]\\/;'~`)
 */
export function checkPasswordStrength(password: string): PasswordValidationResult {
  const p = password || "";
  
  const criteria: PasswordCriteria = {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\/;'~`]/.test(p)
  };

  const errors: string[] = [];
  if (!criteria.length) errors.push("Password must be at least 8 characters long.");
  if (!criteria.uppercase) errors.push("Password must include at least one uppercase letter.");
  if (!criteria.lowercase) errors.push("Password must include at least one lowercase letter.");
  if (!criteria.number) errors.push("Password must include at least one number.");
  if (!criteria.special) errors.push("Password must include at least one special character (!@#$%^&*...).");

  // Calculate score 0-100
  let matchedCount = 0;
  if (criteria.length) matchedCount++;
  if (criteria.uppercase) matchedCount++;
  if (criteria.lowercase) matchedCount++;
  if (criteria.number) matchedCount++;
  if (criteria.special) matchedCount++;

  let score = Math.round((matchedCount / 5) * 80);
  if (p.length >= 12 && matchedCount === 5) score = 100;
  else if (p.length >= 10 && matchedCount === 5) score = 90;

  let level: "weak" | "fair" | "good" | "strong" = "weak";
  if (matchedCount >= 5) level = "strong";
  else if (matchedCount >= 4) level = "good";
  else if (matchedCount >= 3) level = "fair";

  return {
    valid: errors.length === 0,
    score,
    level,
    errors,
    criteria
  };
}

/**
 * Sanitizes generic user text inputs to prevent XSS / HTML injection
 */
export function sanitizeInput(input: string, maxLength = 5000): string {
  if (!input || typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Strip raw HTML angle brackets
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Strip control characters
}

/**
 * Validates and normalizes email strings
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Validates email format against RFC 5322 standard
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string" || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes text passed into AI prompts to neutralize prompt-injection attacks
 * and prevent delimiter breakouts while preserving valid code and technical syntax.
 */
export function sanitizePromptText(input: string, maxLength = 25000): string {
  if (!input || typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip invisible control chars
    .replace(/<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>/gi, "") // Neutralize chat template injection tokens
    .replace(/```(?:system|assistant|admin)/gi, "```code"); // Neutralize system prompt markdown overrides
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks on tokens/OTPs
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Returns a sanitized client-safe error message that never leaks database connection strings,
 * internal stack traces, or server file paths to the client.
 */
export function getSafeErrorMessage(error: any, fallbackMessage = "An unexpected error occurred. Please try again."): string {
  if (process.env.NODE_ENV === "development" && error?.message) {
    return error.message;
  }

  // In production, mask internal library / DB exceptions
  const msg = error instanceof Error ? error.message : String(error || "");
  
  // Detect sensitive keywords that should never be returned to client
  const isInternalLeak = /prisma|database|postgresql|connection|econnrefused|jwt|secret|syntaxerror|typeerror/i.test(msg);
  if (isInternalLeak || !msg) {
    return fallbackMessage;
  }

  return msg;
}
