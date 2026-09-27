/**
 * Mentra Production Logger & Security Audit Tracking System
 * Provides structured logging with security context, event classification,
 * credential redaction, and audit tracking for production observability.
 */

export type LogLevel = "info" | "warn" | "error" | "security" | "audit";

interface LogContext {
  userId?: string;
  ip?: string;
  path?: string;
  action?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "token",
  "jwt",
  "secret",
  "authorization",
  "code",
  "otp",
  "cookie",
  "api_key",
  "apikey",
  "groq_api_key",
  "gemini_api_key",
  "database_url"
]);

/**
 * Recursively redacts sensitive credentials from log objects
 */
function sanitizeLogData(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizeLogData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export class Logger {
  private static formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const cleanContext = context ? sanitizeLogData(context) : undefined;

    if (process.env.NODE_ENV === "production") {
      // In production, emit single-line structured JSON for log aggregators (Datadog, CloudWatch, Vercel)
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        service: "mentra-api",
        message,
        ...cleanContext
      });
    }

    // In development, emit human-readable format
    const metaStr = cleanContext ? ` | ${JSON.stringify(cleanContext)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  static info(message: string, context?: LogContext) {
    console.log(this.formatMessage("info", message, context));
  }

  static warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  static error(message: string, error?: any, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined }
      : { rawError: String(error) };

    const combinedContext = { ...context, ...errorDetails };
    console.error(this.formatMessage("error", message, combinedContext));
  }

  /**
   * Track high-priority security events (rate limit triggers, auth failures, payload blocks, CSRF anomalies)
   */
  static security(event: string, context?: LogContext) {
    console.warn(this.formatMessage("security", `[SECURITY_ALERT] ${event}`, context));
  }

  /**
   * Track auditable authentication and candidate account events
   */
  static audit(action: string, context?: LogContext) {
    console.log(this.formatMessage("audit", `[AUDIT_TRAIL] ${action}`, context));
  }
}
