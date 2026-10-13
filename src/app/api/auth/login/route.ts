import { NextRequest, NextResponse } from "next/server";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
  timingSafeCompare,
  createSessionToken,
  COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. Check rate limit (5 attempts per 15 minutes)
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${Math.ceil(
            rateLimit.retryAfterSeconds / 60
          )} minutes before retrying.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.retryAfterSeconds.toString(),
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";

    const expectedPasscode = process.env.ADMIN_PASSCODE || "admin2026";

    // 2. Validate passcode in constant time
    if (!passcode || !timingSafeCompare(passcode, expectedPasscode)) {
      recordFailedLogin(ip);
      const updatedLimit = checkLoginRateLimit(ip);
      return NextResponse.json(
        {
          error: "Invalid administrator passcode.",
          remainingAttempts: updatedLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Clear rate limit on success
    clearLoginRateLimit(ip);

    // 4. Create signed session token
    const token = createSessionToken();

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully.",
      isAdmin: true,
    });

    // 5. Set HttpOnly, Secure, SameSite=Strict cookie
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
