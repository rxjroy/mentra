import crypto from "crypto";
import { sendOtpEmail } from "./email";
import { constantTimeEqual } from "./security";

export interface PendingRegistration {
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

export interface PendingLogin {
  userId: string;
  name: string;
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

export interface PendingPasswordReset {
  email: string;
  name: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const pendingRegistrations = new Map<string, PendingRegistration>();
const pendingLogins = new Map<string, PendingLogin>();
const pendingPasswordResets = new Map<string, PendingPasswordReset>();

// Cleanup expired OTPs every 2 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [email, record] of pendingRegistrations.entries()) {
      if (now > record.expiresAt) {
        pendingRegistrations.delete(email);
      }
    }
    for (const [email, record] of pendingLogins.entries()) {
      if (now > record.expiresAt) {
        pendingLogins.delete(email);
      }
    }
    for (const [email, record] of pendingPasswordResets.entries()) {
      if (now > record.expiresAt) {
        pendingPasswordResets.delete(email);
      }
    }
  }, 2 * 60 * 1000);
}

export class OtpService {
  static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // --- REGISTRATION OTP ---
  static async createPendingRegistration(
    name: string,
    email: string,
    passwordHash: string
  ): Promise<{ code: string; cooldownSeconds: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = pendingRegistrations.get(normalizedEmail);
    const now = Date.now();

    if (existing && now - existing.lastSentAt < 60000) {
      const cooldownSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${cooldownSeconds}s before requesting another verification code.`);
    }

    const code = this.generateCode();
    const record: PendingRegistration = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      otp: code,
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: now
    };

    pendingRegistrations.set(normalizedEmail, record);

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        name: name.trim(),
        code,
        purpose: "verification"
      });
    } catch (err) {
      console.warn("Email delivery warning:", err);
    }

    console.log(`\n======================================================`);
    console.log(`🔐 MENTRA SIGN-UP OTP VERIFICATION CODE`);
    console.log(`To: ${normalizedEmail}`);
    console.log(`Code: >>> ${code} <<<`);
    console.log(`Expires in 10 minutes`);
    console.log(`======================================================\n`);

    return { code, cooldownSeconds: 60 };
  }

  static verifyCode(
    email: string,
    inputCode: string
  ): { success: boolean; data?: { name: string; email: string; passwordHash: string }; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const record = pendingRegistrations.get(normalizedEmail);

    if (!record) {
      return { success: false, error: "No verification code was requested for this email or it has expired." };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      pendingRegistrations.delete(normalizedEmail);
      return { success: false, error: "Verification code has expired. Please request a new code." };
    }

    if (record.attempts >= 5) {
      pendingRegistrations.delete(normalizedEmail);
      return { success: false, error: "Too many incorrect attempts. Please request a new verification code." };
    }

    if (!constantTimeEqual(record.otp, inputCode.trim())) {
      record.attempts += 1;
      const remainingAttempts = 5 - record.attempts;
      return {
        success: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
      };
    }

    pendingRegistrations.delete(normalizedEmail);
    return {
      success: true,
      data: {
        name: record.name,
        email: record.email,
        passwordHash: record.passwordHash
      }
    };
  }

  // --- 2FA LOGIN OTP ---
  static async createPendingLogin(
    userId: string,
    name: string,
    email: string
  ): Promise<{ code: string; cooldownSeconds: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = pendingLogins.get(normalizedEmail);
    const now = Date.now();

    if (existing && now - existing.lastSentAt < 60000) {
      const cooldownSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${cooldownSeconds}s before requesting another login security code.`);
    }

    const code = this.generateCode();
    const record: PendingLogin = {
      userId,
      name: name.trim(),
      email: normalizedEmail,
      otp: code,
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: now
    };

    pendingLogins.set(normalizedEmail, record);

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        name: name.trim(),
        code,
        purpose: "login_2fa"
      });
    } catch (err) {
      console.warn("Login OTP email delivery warning:", err);
    }

    console.log(`\n======================================================`);
    console.log(`🔐 MENTRA 2FA SIGN-IN SECURITY CODE`);
    console.log(`To: ${normalizedEmail}`);
    console.log(`Code: >>> ${code} <<<`);
    console.log(`Expires in 10 minutes`);
    console.log(`======================================================\n`);

    return { code, cooldownSeconds: 60 };
  }

  static verifyLoginCode(
    email: string,
    inputCode: string
  ): { success: boolean; data?: { userId: string; name: string; email: string }; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const record = pendingLogins.get(normalizedEmail);

    if (!record) {
      return { success: false, error: "No active login code found for this email. Please sign in again." };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      pendingLogins.delete(normalizedEmail);
      return { success: false, error: "Security code has expired. Please sign in again." };
    }

    if (record.attempts >= 5) {
      pendingLogins.delete(normalizedEmail);
      return { success: false, error: "Too many incorrect attempts. Please sign in again." };
    }

    if (!constantTimeEqual(record.otp, inputCode.trim())) {
      record.attempts += 1;
      const remainingAttempts = 5 - record.attempts;
      return {
        success: false,
        error: `Incorrect security code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
      };
    }

    pendingLogins.delete(normalizedEmail);
    return {
      success: true,
      data: {
        userId: record.userId,
        name: record.name,
        email: record.email
      }
    };
  }

  // --- PASSWORD RESET OTP ---
  static async createPendingPasswordReset(
    name: string,
    email: string
  ): Promise<{ code: string; cooldownSeconds: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = pendingPasswordResets.get(normalizedEmail);
    const now = Date.now();

    if (existing && now - existing.lastSentAt < 60000) {
      const cooldownSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${cooldownSeconds}s before requesting another password reset code.`);
    }

    const code = this.generateCode();
    const record: PendingPasswordReset = {
      email: normalizedEmail,
      name: name.trim(),
      otp: code,
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: now
    };

    pendingPasswordResets.set(normalizedEmail, record);

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        name: name.trim(),
        code,
        purpose: "password_reset"
      });
    } catch (err) {
      console.warn("Password reset email delivery warning:", err);
    }

    console.log(`\n======================================================`);
    console.log(`🔐 MENTRA PASSWORD RESET VERIFICATION CODE`);
    console.log(`To: ${normalizedEmail}`);
    console.log(`Code: >>> ${code} <<<`);
    console.log(`Expires in 10 minutes`);
    console.log(`======================================================\n`);

    return { code, cooldownSeconds: 60 };
  }

  static verifyPasswordResetCode(
    email: string,
    inputCode: string
  ): { success: boolean; data?: { email: string; name: string }; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const record = pendingPasswordResets.get(normalizedEmail);

    if (!record) {
      return { success: false, error: "No active password reset request found. Please request a new code." };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      pendingPasswordResets.delete(normalizedEmail);
      return { success: false, error: "Reset code has expired. Please request a new code." };
    }

    if (record.attempts >= 5) {
      pendingPasswordResets.delete(normalizedEmail);
      return { success: false, error: "Too many incorrect attempts. Please request a new reset code." };
    }

    if (!constantTimeEqual(record.otp, inputCode.trim())) {
      record.attempts += 1;
      const remainingAttempts = 5 - record.attempts;
      return {
        success: false,
        error: `Incorrect reset code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
      };
    }

    pendingPasswordResets.delete(normalizedEmail);
    return {
      success: true,
      data: {
        email: record.email,
        name: record.name
      }
    };
  }
}
