import { NextRequest } from "next/server";
import crypto from "crypto";

// Rate limiting in-memory map: IP -> { attempts: number; firstAttemptMs: number }
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const loginRateLimits = new Map<string, RateLimitEntry>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const COOKIE_NAME = "sd_admin_session";

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses SHA-256 to produce fixed 32-byte digests before timingSafeEqual,
 * ensuring constant comparison time regardless of string length.
 */
export function timingSafeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || typeof a !== "string" || typeof b !== "string" || a.length === 0 || b.length === 0) {
    return false;
  }
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

/**
 * Checks and records rate-limit for admin passcode attempts
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = loginRateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - entry.attempts,
    retryAfterSeconds: 0,
  };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginRateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    loginRateLimits.set(ip, {
      attempts: 1,
      resetAt: now + LOGIN_WINDOW_MS,
    });
  } else {
    entry.attempts += 1;
  }
}

export function clearLoginRateLimit(ip: string): void {
  loginRateLimits.delete(ip);
}

/**
 * Creates an HMAC signed session token
 */
export function createSessionToken(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSCODE || "sd_fallback_session_secret_2026";
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString("hex");
  const data = `${timestamp}.${random}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${hmac}`;
}

/**
 * Verifies the HMAC signed session token
 */
export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestampStr, random, receivedHmac] = parts;
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSCODE || "sd_fallback_session_secret_2026";
  const data = `${timestampStr}.${random}`;
  const expectedHmac = crypto.createHmac("sha256", secret).update(data).digest("hex");

  if (!timingSafeCompare(receivedHmac, expectedHmac)) {
    return false;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max session age: 7 days
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) {
    return false;
  }

  return true;
}

/**
 * Extracts and verifies the admin session from request cookies
 */
export function verifyAdminSession(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie || !cookie.value) {
    return false;
  }
  return verifySessionToken(cookie.value);
}

/**
 * Verifies the device API key from x-api-key or authorization header
 */
export function verifyDeviceApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!apiKey) return false;

  const expectedKey = process.env.DEVICE_API_KEY || process.env.API_INGEST_KEY;
  if (!expectedKey) {
    console.error("SERVER MISCONFIGURATION: DEVICE_API_KEY environment variable is not set!");
    return false;
  }

  return timingSafeCompare(apiKey, expectedKey);
}

export { COOKIE_NAME };
